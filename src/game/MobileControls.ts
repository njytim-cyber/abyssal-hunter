/**
 * Mobile optimization with virtual joystick and touch gestures
 */

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  startTime: number;
}

export class MobileControls {
  private canvas: HTMLCanvasElement;
  private joystickActive: boolean = false;
  private joystickCenter: { x: number; y: number } = { x: 0, y: 0 };
  private joystickCurrent: { x: number; y: number } = { x: 0, y: 0 };
  private joystickRadius: number = 60;
  private joystickMaxDistance: number = 40;
  private touchPoints: Map<number, TouchPoint> = new Map();

  // Gesture detection
  private lastTapTime: number = 0;
  private tapCount: number = 0;
  private pinchStartDistance: number = 0;
  private currentPinchDistance: number = 0;

  // Callbacks
  private onMove: ((dx: number, dy: number) => void) | null = null;
  private onTap: (() => void) | null = null;
  private onDoubleTap: (() => void) | null = null;
  private onLongPress: (() => void) | null = null;
  private onSwipe: ((direction: 'up' | 'down' | 'left' | 'right') => void) | null = null;
  private onPinch: ((scale: number) => void) | null = null;

  // Settings
  private showJoystick: boolean = true;
  private vibrationEnabled: boolean = true;
  private longPressDuration: number = 500; // ms
  private swipeThreshold: number = 50; // pixels

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupTouchListeners();
  }

  private setupTouchListeners(): void {
    // Prevent default touch behaviors
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), {
      passive: false,
    });

    // Prevent context menu on long press
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();

    const now = Date.now();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const touchPoint: TouchPoint = {
        id: touch.identifier,
        x,
        y,
        startX: x,
        startY: y,
        startTime: now,
      };

      this.touchPoints.set(touch.identifier, touchPoint);

      // Joystick activation (left half of screen)
      if (x < this.canvas.width / 2 && this.touchPoints.size === 1) {
        this.joystickActive = true;
        this.joystickCenter = { x, y };
        this.joystickCurrent = { x, y };
      }

      // Long press detection
      setTimeout(() => {
        const point = this.touchPoints.get(touch.identifier);
        if (point && now === point.startTime) {
          const dx = point.x - point.startX;
          const dy = point.y - point.startY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 10) {
            // Finger hasn't moved much
            this.onLongPress?.();
            this.vibrate(30);
          }
        }
      }, this.longPressDuration);
    }

    // Detect double tap
    if (now - this.lastTapTime < 300) {
      this.tapCount++;
      if (this.tapCount === 2) {
        this.onDoubleTap?.();
        this.vibrate(15);
        this.tapCount = 0;
      }
    } else {
      this.tapCount = 1;
    }
    this.lastTapTime = now;

    // Pinch gesture detection
    if (this.touchPoints.size === 2) {
      const points = Array.from(this.touchPoints.values());
      this.pinchStartDistance = this.getDistance(points[0], points[1]);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const touchPoint = this.touchPoints.get(touch.identifier);
      if (touchPoint) {
        touchPoint.x = x;
        touchPoint.y = y;

        // Update joystick
        if (this.joystickActive && this.touchPoints.size === 1) {
          this.joystickCurrent = { x, y };

          // Calculate joystick direction
          const dx = x - this.joystickCenter.x;
          const dy = y - this.joystickCenter.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0) {
            // Limit to max distance
            const limitedDistance = Math.min(distance, this.joystickMaxDistance);
            const normalizedDx = (dx / distance) * limitedDistance;
            const normalizedDy = (dy / distance) * limitedDistance;

            this.onMove?.(
              normalizedDx / this.joystickMaxDistance,
              normalizedDy / this.joystickMaxDistance
            );
          }
        }
      }
    }

    // Pinch gesture
    if (this.touchPoints.size === 2) {
      const points = Array.from(this.touchPoints.values());
      this.currentPinchDistance = this.getDistance(points[0], points[1]);

      if (this.pinchStartDistance > 0) {
        const scale = this.currentPinchDistance / this.pinchStartDistance;
        this.onPinch?.(scale);
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchPoint = this.touchPoints.get(touch.identifier);

      if (touchPoint) {
        // Detect swipe
        const dx = touchPoint.x - touchPoint.startX;
        const dy = touchPoint.y - touchPoint.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const timeDiff = Date.now() - touchPoint.startTime;

        if (distance > this.swipeThreshold && timeDiff < 500) {
          // Fast swipe
          const angle = Math.atan2(dy, dx);
          const direction = this.getSwipeDirection(angle);
          this.onSwipe?.(direction);
          this.vibrate(20);
        } else if (distance < 10 && timeDiff < 300) {
          // Quick tap
          this.onTap?.();
          this.vibrate(10);
        }

        this.touchPoints.delete(touch.identifier);
      }
    }

    // Reset joystick
    if (this.touchPoints.size === 0) {
      this.joystickActive = false;
      this.onMove?.(0, 0);
    }

    // Reset pinch
    if (this.touchPoints.size < 2) {
      this.pinchStartDistance = 0;
    }
  }

  private getDistance(p1: TouchPoint, p2: TouchPoint): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getSwipeDirection(angle: number): 'up' | 'down' | 'left' | 'right' {
    const degrees = (angle * 180) / Math.PI;
    if (degrees >= -45 && degrees < 45) return 'right';
    if (degrees >= 45 && degrees < 135) return 'down';
    if (degrees >= 135 || degrees < -135) return 'left';
    return 'up';
  }

  private vibrate(duration: number): void {
    if (this.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }

  // Draw virtual joystick
  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.showJoystick || !this.joystickActive) return;

    ctx.save();

    // Joystick base
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.joystickCenter.x, this.joystickCenter.y, this.joystickRadius, 0, Math.PI * 2);
    ctx.fill();

    // Joystick outline
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.joystickCenter.x, this.joystickCenter.y, this.joystickRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Joystick stick
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.arc(this.joystickCurrent.x, this.joystickCurrent.y, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Setters for callbacks
  setOnMove(callback: (dx: number, dy: number) => void): void {
    this.onMove = callback;
  }

  setOnTap(callback: () => void): void {
    this.onTap = callback;
  }

  setOnDoubleTap(callback: () => void): void {
    this.onDoubleTap = callback;
  }

  setOnLongPress(callback: () => void): void {
    this.onLongPress = callback;
  }

  setOnSwipe(callback: (direction: 'up' | 'down' | 'left' | 'right') => void): void {
    this.onSwipe = callback;
  }

  setOnPinch(callback: (scale: number) => void): void {
    this.onPinch = callback;
  }

  // Settings
  setShowJoystick(show: boolean): void {
    this.showJoystick = show;
  }

  setVibrationEnabled(enabled: boolean): void {
    this.vibrationEnabled = enabled;
  }

  // Responsive UI scaling
  static getUIScale(windowWidth: number, windowHeight: number): number {
    const baseWidth = 1920;
    const baseHeight = 1080;
    const scaleX = windowWidth / baseWidth;
    const scaleY = windowHeight / baseHeight;
    return Math.min(scaleX, scaleY, 1.5); // Cap at 1.5x
  }

  // Check if device is mobile
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  // Check if device supports touch
  static supportsTouch(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  // Get safe area insets for notched devices
  static getSafeAreaInsets(): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
    };
  }

  // Cleanup
  dispose(): void {
    // Remove event listeners if needed
    this.touchPoints.clear();
  }
}
