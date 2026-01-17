/**
 * Accessibility features for inclusive gameplay
 */

export type ColorBlindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

export interface AccessibilitySettings {
  colorBlindMode: ColorBlindMode;
  highContrast: boolean;
  reducedMotion: boolean;
  textSize: 'small' | 'medium' | 'large';
  screenReader: boolean;
  subtitles: boolean;
  visualCues: boolean;
  simplifiedUI: boolean;
}

export class AccessibilitySystem {
  private settings: AccessibilitySettings;
  private announcements: string[] = [];

  constructor(savedSettings?: Partial<AccessibilitySettings>) {
    this.settings = {
      colorBlindMode: 'none',
      highContrast: false,
      reducedMotion: false,
      textSize: 'medium',
      screenReader: false,
      subtitles: false,
      visualCues: true,
      simplifiedUI: false,
      ...savedSettings,
    };

    this.setupARIA();
  }

  private setupARIA(): void {
    // Set up ARIA live region for screen reader announcements
    const liveRegion = document.getElementById('sr-announcements');
    if (!liveRegion && this.settings.screenReader) {
      const region = document.createElement('div');
      region.id = 'sr-announcements';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.style.position = 'absolute';
      region.style.left = '-10000px';
      region.style.width = '1px';
      region.style.height = '1px';
      region.style.overflow = 'hidden';
      document.body.appendChild(region);
    }
  }

  // Color blind mode filters
  adjustColor(originalColor: string): string {
    if (this.settings.colorBlindMode === 'none' && !this.settings.highContrast) {
      return originalColor;
    }

    const rgb = this.hexToRgb(originalColor);
    if (!rgb) return originalColor;

    let adjusted = rgb;

    // Apply color blind filter
    switch (this.settings.colorBlindMode) {
      case 'deuteranopia':
        adjusted = this.applyDeuteranopia(rgb);
        break;
      case 'protanopia':
        adjusted = this.applyProtanopia(rgb);
        break;
      case 'tritanopia':
        adjusted = this.applyTritanopia(rgb);
        break;
    }

    // Apply high contrast
    if (this.settings.highContrast) {
      adjusted = this.applyHighContrast(adjusted);
    }

    return this.rgbToHex(adjusted);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  private rgbToHex(rgb: { r: number; g: number; b: number }): string {
    return (
      '#' +
      [rgb.r, rgb.g, rgb.b]
        .map(x => {
          const hex = Math.round(x).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  }

  private applyDeuteranopia(rgb: { r: number; g: number; b: number }): {
    r: number;
    g: number;
    b: number;
  } {
    // Green-blind (most common)
    return {
      r: rgb.r * 0.625 + rgb.g * 0.375,
      g: rgb.r * 0.7 + rgb.g * 0.3,
      b: rgb.g * 0.3 + rgb.b * 0.7,
    };
  }

  private applyProtanopia(rgb: { r: number; g: number; b: number }): {
    r: number;
    g: number;
    b: number;
  } {
    // Red-blind
    return {
      r: rgb.r * 0.567 + rgb.g * 0.433,
      g: rgb.r * 0.558 + rgb.g * 0.442,
      b: rgb.b,
    };
  }

  private applyTritanopia(rgb: { r: number; g: number; b: number }): {
    r: number;
    g: number;
    b: number;
  } {
    // Blue-blind (rarest)
    return {
      r: rgb.r * 0.95 + rgb.g * 0.05,
      g: rgb.g * 0.433 + rgb.b * 0.567,
      b: rgb.g * 0.475 + rgb.b * 0.525,
    };
  }

  private applyHighContrast(rgb: { r: number; g: number; b: number }): {
    r: number;
    g: number;
    b: number;
  } {
    // Increase saturation and brightness for better visibility
    const avg = (rgb.r + rgb.g + rgb.b) / 3;
    const factor = 1.5;

    return {
      r: Math.min(255, rgb.r + (rgb.r - avg) * factor),
      g: Math.min(255, rgb.g + (rgb.g - avg) * factor),
      b: Math.min(255, rgb.b + (rgb.b - avg) * factor),
    };
  }

  // Text size multipliers
  getTextSizeMultiplier(): number {
    switch (this.settings.textSize) {
      case 'small':
        return 0.85;
      case 'large':
        return 1.3;
      default:
        return 1.0;
    }
  }

  // Particle effects
  shouldShowParticles(): boolean {
    return !this.settings.reducedMotion;
  }

  // Animation speed
  getAnimationSpeedMultiplier(): number {
    return this.settings.reducedMotion ? 0.5 : 1.0;
  }

  // Screen reader announcements
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.settings.screenReader) return;

    const liveRegion = document.getElementById('sr-announcements');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }

    this.announcements.push(message);
  }

  // Visual cues for audio events
  showVisualCue(_type: 'damage' | 'powerup' | 'warning' | 'success'): void {
    if (!this.settings.visualCues) return;

    // This would trigger visual indicators in the game
    // Implementation would be in the main game engine
  }

  // Subtitle system
  showSubtitle(_text: string, _duration: number = 3000): void {
    if (!this.settings.subtitles) return;

    // Add subtitle to queue
    // Implementation would be in the UI system
  }

  // Simplified UI mode
  isSimplifiedUI(): boolean {
    return this.settings.simplifiedUI;
  }

  // Keyboard navigation helpers
  static setupKeyboardNavigation(elements: HTMLElement[]): void {
    elements.forEach((element, index) => {
      element.setAttribute('tabindex', '0');
      element.setAttribute('role', 'button');

      element.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          element.click();
        } else if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
          e.preventDefault();
          const next = elements[(index + 1) % elements.length];
          next.focus();
        } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
          e.preventDefault();
          const prev = elements[(index - 1 + elements.length) % elements.length];
          prev.focus();
        }
      });
    });
  }

  // Focus management
  static trapFocus(container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    container.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });

    firstElement.focus();
  }

  // Skip to main content
  static addSkipLink(): void {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.position = 'absolute';
    skipLink.style.top = '-40px';
    skipLink.style.left = '0';
    skipLink.style.background = '#000';
    skipLink.style.color = '#fff';
    skipLink.style.padding = '8px';
    skipLink.style.zIndex = '9999';
    skipLink.style.transition = 'top 0.3s';

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '0';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // Update settings
  updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.screenReader !== undefined) {
      this.setupARIA();
    }
  }

  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  // WCAG contrast checker
  static checkContrast(
    foreground: string,
    background: string
  ): { ratio: number; passAA: boolean; passAAA: boolean } {
    const fg = this.getLuminance(foreground);
    const bg = this.getLuminance(background);
    const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);

    return {
      ratio,
      passAA: ratio >= 4.5,
      passAAA: ratio >= 7,
    };
  }

  private static getLuminance(color: string): number {
    const rgb = AccessibilitySystem.prototype.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      const v = val / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Game-specific accessibility features
  shouldShowDamageIndicators(): boolean {
    return this.settings.visualCues || this.settings.highContrast;
  }

  shouldShowDirectionalIndicators(): boolean {
    return this.settings.visualCues;
  }

  shouldUseAlternativeIcons(): boolean {
    return this.settings.simplifiedUI;
  }

  getReducedMotionMultiplier(): number {
    return this.settings.reducedMotion ? 0.3 : 1.0;
  }
}

// Singleton instance
let accessibilityInstance: AccessibilitySystem | null = null;

export function getAccessibilitySystem(
  settings?: Partial<AccessibilitySettings>
): AccessibilitySystem {
  if (!accessibilityInstance) {
    accessibilityInstance = new AccessibilitySystem(settings);
  }
  return accessibilityInstance;
}
