import { audioManager } from './AudioManager';
import { CONFIG, LEVELS, EntityType, Level } from './config';
import { Entity } from './Entity';
import { FloatingTextPool } from './FloatingText';
import { ParticlePool, Star, createStars, drawStarsWithParallax } from './Particle';
import { Player } from './Player';

/**
 * Camera state for smooth following
 */
interface Camera {
  x: number;
  y: number;
  scale: number;
}

/**
 * Keyboard input state
 */
interface KeyboardState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  dash: boolean;
}

/**
 * Screen shake state
 */
interface ScreenShake {
  intensity: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Combo tracking
 */
interface ComboState {
  count: number;
  lastEatTime: number;
  multiplier: number;
}

/**
 * Input state from mouse/touch
 */
export interface InputState {
  x: number;
  y: number;
  active: boolean;
}

/**
 * Callback interface for game events
 */
export interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onLevelUp: (level: Level) => void;
  onInkChange: (ink: number, maxInk: number) => void;
  onGameOver: (finalScore: number) => void;
  onComboChange?: (combo: number, multiplier: number) => void;
}

/**
 * Main game engine - handles all game logic separate from React rendering
 * Uses requestAnimationFrame for smooth 60fps gameplay
 * Designed for performance: minimal allocations in game loop
 */
export class GameEngine {
  // Core state
  private player: Player;
  private entities: Entity[] = [];
  private particlePool: ParticlePool;
  private floatingTextPool: FloatingTextPool;
  private stars: Star[] = [];
  private camera: Camera = { x: 0, y: 0, scale: 1 };

  // Canvas
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number = 800;
  private height: number = 600;

  // Game state
  private running: boolean = false;
  private frame: number = 0;
  private animationId: number = 0;

  // Input
  private input: InputState = { x: 0, y: 0, active: false };
  private keys: KeyboardState = { up: false, down: false, left: false, right: false, dash: false };
  private usingKeyboard: boolean = false;

  // Screen shake
  private shake: ScreenShake = { intensity: 0, offsetX: 0, offsetY: 0 };

  // Combo system
  private combo: ComboState = { count: 0, lastEatTime: 0, multiplier: 1 };

  // Spawn protection (invincibility frames at start)
  private spawnProtection: number = 0;
  private static readonly SPAWN_PROTECTION_FRAMES = 180; // 3 seconds at 60fps

  // Callbacks
  private callbacks: GameCallbacks | null = null;

  // Track dashing state for player draw
  private playerDashing: boolean = false;

  constructor() {
    this.player = new Player();
    this.particlePool = new ParticlePool(300);
    this.floatingTextPool = new FloatingTextPool();
    this.stars = createStars(CONFIG.stars.count, CONFIG.worldSize);
  }

  /**
   * Initializes the game engine with a canvas element
   */
  init(canvas: HTMLCanvasElement, callbacks: GameCallbacks): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.callbacks = callbacks;
    this.handleResize();

    // Initial UI update
    this.callbacks.onScoreChange(Math.floor(this.player.radius));
    this.callbacks.onInkChange(this.player.ink, CONFIG.player.maxInk);
  }

  /**
   * Handles window resize
   */
  handleResize(): void {
    this.width = window.innerWidth || 800;
    this.height = window.innerHeight || 600;

    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  }

  /**
   * Converts screen coordinates to world coordinates
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const s = this.camera.scale || 1;
    return {
      x: (screenX - this.width / 2) / s + this.player.x,
      y: (screenY - this.height / 2) / s + this.player.y,
    };
  }

  /**
   * Updates input state from mouse/touch position
   */
  setInputPosition(screenX: number, screenY: number): void {
    const worldPos = this.screenToWorld(screenX, screenY);
    this.input.x = worldPos.x;
    this.input.y = worldPos.y;
    this.usingKeyboard = false;
  }

  /**
   * Sets whether dash is active (mouse/touch)
   */
  setInputActive(active: boolean): void {
    this.input.active = active;
  }

  /**
   * Sets keyboard state
   */
  setKeyState(key: string, pressed: boolean): void {
    switch (key) {
      case 'ArrowUp':
      case 'KeyW':
        this.keys.up = pressed;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.keys.down = pressed;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = pressed;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = pressed;
        break;
      case 'Space':
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.dash = pressed;
        break;
    }

    if (pressed && (this.keys.up || this.keys.down || this.keys.left || this.keys.right)) {
      this.usingKeyboard = true;
    }
  }

  /**
   * Trigger screen shake
   */
  triggerShake(intensity: number): void {
    this.shake.intensity = Math.max(this.shake.intensity, intensity);
  }

  /**
   * Toggle audio mute
   */
  toggleMute(): boolean {
    return audioManager.toggleMute();
  }

  /**
   * Check if audio is muted
   */
  isMuted(): boolean {
    return audioManager.isMuted();
  }

  /**
   * Starts or restarts the game
   */
  start(): void {
    this.player = new Player();
    this.entities = [];
    this.particlePool.clear();
    this.floatingTextPool.clear();
    this.frame = 0;
    this.running = true;
    this.combo = { count: 0, lastEatTime: 0, multiplier: 1 };
    this.shake = { intensity: 0, offsetX: 0, offsetY: 0 };
    this.spawnProtection = GameEngine.SPAWN_PROTECTION_FRAMES;

    // Reset input position to player
    this.input.x = this.player.x;
    this.input.y = this.player.y;

    // Notify UI
    this.callbacks?.onScoreChange(Math.floor(this.player.radius));
    this.callbacks?.onInkChange(this.player.ink, CONFIG.player.maxInk);

    // Start ambient audio
    audioManager.startAmbient();

    // Cancel any existing animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this.loop();
  }

  /**
   * Stops the game
   */
  stop(): void {
    this.running = false;
    audioManager.stopAmbient();
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  /**
   * Main game loop
   */
  private loop = (): void => {
    if (!this.running) return;

    try {
      this.spawnEntities();
      this.updatePhysics();
      this.updateShake();
      this.render();
      this.frame++;
      this.animationId = requestAnimationFrame(this.loop);
    } catch (error) {
      console.error('Game loop error:', error);
      this.running = false;
    }
  };

  /**
   * Entity spawning system
   */
  private spawnEntities(): void {
    // Spawn food particles
    const foodCount = this.entities.filter(e => e.type === 'food').length;
    if (foodCount < CONFIG.spawn.maxFood) {
      this.entities.push(
        new Entity(
          'food',
          Math.random() * CONFIG.worldSize,
          Math.random() * CONFIG.worldSize,
          Math.random() * 4 + 3
        )
      );
    }

    // Spawn enemies with difficulty scaling based on player level
    const enemyCount = this.entities.filter(e => e.type !== 'food').length;
    const difficultyMultiplier = 1 + this.player.levelIndex * 0.15; // Increases with level
    const maxEnemiesScaled = Math.floor(CONFIG.spawn.maxEnemies * difficultyMultiplier);

    if (enemyCount < maxEnemiesScaled) {
      // During spawn protection, only spawn prey so player can grow
      // Higher level = more predators
      const predatorChance = 0.3 + this.player.levelIndex * 0.1;
      const isPredator = this.spawnProtection <= 0 && Math.random() < predatorChance;
      let radius: number;
      let type: EntityType;

      if (isPredator) {
        // Predators scale more aggressively with level
        radius = this.player.radius * (1.2 + Math.random() * 0.5 + this.player.levelIndex * 0.1);
        type = 'predator';
      } else {
        // Prey also gets tougher at higher levels
        const preyScale = 0.2 + Math.random() * 0.6 + this.player.levelIndex * 0.05;
        radius = Math.max(10, this.player.radius * preyScale);
        type = 'prey';
      }

      // Find valid spawn position (away from player)
      let ex: number = 0,
        ey: number = 0;
      let attempts = 0;

      do {
        ex = Math.random() * CONFIG.worldSize;
        ey = Math.random() * CONFIG.worldSize;
        const dx = ex - this.player.x;
        const dy = ey - this.player.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d >= CONFIG.spawn.minSpawnDistance) break;
        attempts++;
      } while (attempts < 50);

      if (attempts < 50) {
        this.entities.push(new Entity(type, ex, ey, radius));
      }
    }
  }

  /**
   * Physics and collision update
   */
  private updatePhysics(): void {
    // Handle keyboard input
    let inputX = this.input.x;
    let inputY = this.input.y;
    const inputActive = this.input.active || this.keys.dash;

    if (this.usingKeyboard) {
      let dx = 0;
      let dy = 0;
      if (this.keys.up) dy -= 1;
      if (this.keys.down) dy += 1;
      if (this.keys.left) dx -= 1;
      if (this.keys.right) dx += 1;

      if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
        inputX = this.player.x + dx * 100;
        inputY = this.player.y + dy * 100;
      } else {
        inputX = this.player.x;
        inputY = this.player.y;
      }
    }

    const playerX = this.player.x;
    const playerY = this.player.y;
    const playerRadius = this.player.radius;

    // Check combo timeout
    const now = performance.now();
    if (this.combo.count > 0 && now - this.combo.lastEatTime > CONFIG.combo.windowMs) {
      this.combo.count = 0;
      this.combo.multiplier = 1;
      this.callbacks?.onComboChange?.(0, 1);
    }

    // Update entities and check collisions
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];

      // Update dynamic types
      e.updateType(playerRadius);
      e.update(playerX, playerY, this.frame);

      // Collision detection
      const dx = playerX - e.x;
      const dy = playerY - e.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d < playerRadius + e.radius) {
        if (playerRadius > e.radius) {
          // Eat entity
          const baseGain = e.type === 'food' ? 0.3 : e.radius * 0.2;

          // Update combo
          this.combo.count++;
          this.combo.lastEatTime = now;
          this.combo.multiplier = Math.min(this.combo.count, CONFIG.combo.maxMultiplier);

          const gain = baseGain * (1 + (this.combo.multiplier - 1) * 0.2);
          this.player.radius += gain;

          // Spawn enhanced particles based on entity type and combo
          const particleCount = 8 + this.combo.multiplier * 2;
          this.particlePool.spawnBurst(e.x, e.y, particleCount, e.color, 4, 'glow');

          // Add sparkles for combos
          if (this.combo.multiplier > 1) {
            this.particlePool.spawnBurst(
              e.x,
              e.y,
              this.combo.multiplier * 2,
              CONFIG.colors.combo,
              6,
              'sparkle'
            );
          }

          // Floating score text
          const scoreText = e.type === 'food' ? '+1' : `+${Math.floor(gain * 10)}`;
          const textColor = this.combo.multiplier > 1 ? CONFIG.colors.combo : '#ffffff';
          this.floatingTextPool.acquire(e.x, e.y - 20, scoreText, textColor);

          // Combo text
          if (this.combo.multiplier > 1) {
            this.floatingTextPool.acquire(
              e.x,
              e.y - 40,
              `x${this.combo.multiplier} COMBO!`,
              CONFIG.colors.combo
            );
            audioManager.playCombo(this.combo.multiplier);

            // Ink bonus on high combo
            if (this.combo.multiplier >= 3) {
              this.player.ink = Math.min(
                this.player.ink + CONFIG.combo.inkBonus,
                CONFIG.player.maxInk
              );
            }
          }

          this.entities.splice(i, 1);

          // Screen shake & sound
          this.triggerShake(e.type === 'food' ? 1 : CONFIG.shake.eatIntensity);
          audioManager.playEat(this.combo.multiplier);

          this.checkLevelUp();
          this.callbacks?.onScoreChange(Math.floor(this.player.radius));
          this.callbacks?.onComboChange?.(this.combo.count, this.combo.multiplier);
        } else if (e.type !== 'food' && this.spawnProtection <= 0) {
          // Game over - eaten by predator (unless protected)
          this.gameOver();
          return;
        }
      }
    }

    // Update player
    this.playerDashing = this.player.update(inputX, inputY, inputActive);

    // Player trail effect (always active, more when dashing)
    if (this.frame % 2 === 0) {
      this.particlePool.spawnTrail(this.player.x, this.player.y, CONFIG.colors.playerGlow);
    }

    if (this.playerDashing) {
      // Enhanced dash particles
      if (this.frame % 2 === 0) {
        this.particlePool.spawnBurst(this.player.x, this.player.y, 2, CONFIG.colors.ink, 6, 'glow');
        // Add some sparkles
        this.particlePool.spawn(this.player.x, this.player.y, '#ffffff', 4, 'sparkle');
      }

      // Play dash sound occasionally
      if (this.frame % 15 === 0) {
        audioManager.playDash();
      }
    }

    this.callbacks?.onInkChange(this.player.ink, CONFIG.player.maxInk);

    // Update particles and floating text
    this.particlePool.update();
    this.floatingTextPool.update();

    // Decrement spawn protection
    if (this.spawnProtection > 0) {
      this.spawnProtection--;
    }
  }

  /**
   * Update screen shake
   */
  private updateShake(): void {
    if (this.shake.intensity > 0.1) {
      this.shake.offsetX = (Math.random() - 0.5) * this.shake.intensity * 2;
      this.shake.offsetY = (Math.random() - 0.5) * this.shake.intensity * 2;
      this.shake.intensity *= CONFIG.shake.decay;
    } else {
      this.shake.intensity = 0;
      this.shake.offsetX = 0;
      this.shake.offsetY = 0;
    }
  }

  /**
   * Checks if player should level up
   */
  private checkLevelUp(): void {
    const nextLevel = LEVELS[this.player.levelIndex + 1];
    if (nextLevel && this.player.radius >= nextLevel.threshold) {
      this.player.levelIndex++;
      this.callbacks?.onLevelUp(nextLevel);
      audioManager.playLevelUp();
      this.triggerShake(CONFIG.shake.hitIntensity);
    }
  }

  /**
   * Handles game over
   */
  private gameOver(): void {
    this.running = false;
    audioManager.playDeath();
    audioManager.stopAmbient();
    this.callbacks?.onGameOver(Math.floor(this.player.radius));
  }

  /**
   * Renders the game
   */
  private render(): void {
    const ctx = this.ctx;
    if (!ctx) return;

    // Animated gradient background for depth
    const gradientOffset = Math.sin(this.frame * 0.002) * 0.2;
    const gradient = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      0,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) * (0.8 + gradientOffset)
    );
    gradient.addColorStop(0, CONFIG.colors.bgShallow);
    gradient.addColorStop(0.6, CONFIG.colors.bg);
    gradient.addColorStop(1, CONFIG.colors.bgDeep);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();

    // Calculate camera scale based on player size
    const targetScale = Math.max(0.15, Math.min(1.5, 30 / (this.player.radius + 10)));
    this.camera.scale += (targetScale - this.camera.scale) * 0.05;

    // Camera position (centered on player)
    this.camera.x = this.player.x - this.width / (2 * this.camera.scale);
    this.camera.y = this.player.y - this.height / (2 * this.camera.scale);

    // Clamp camera to world bounds
    this.camera.x = Math.max(
      0,
      Math.min(this.camera.x, CONFIG.worldSize - this.width / this.camera.scale)
    );
    this.camera.y = Math.max(
      0,
      Math.min(this.camera.y, CONFIG.worldSize - this.height / this.camera.scale)
    );

    // Apply screen shake
    ctx.translate(this.shake.offsetX, this.shake.offsetY);

    ctx.scale(this.camera.scale, this.camera.scale);
    ctx.translate(-this.camera.x, -this.camera.y);

    // Draw background stars with parallax
    drawStarsWithParallax(ctx, this.stars, this.camera.x, this.camera.y, this.frame);

    // Draw world boundary
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 50;
    ctx.strokeRect(0, 0, CONFIG.worldSize, CONFIG.worldSize);

    // Draw entities
    for (const entity of this.entities) {
      entity.draw(ctx, this.frame);
    }

    // Draw particles
    this.particlePool.draw(ctx);

    // Draw player
    this.player.draw(ctx, this.playerDashing);

    // Draw floating text (in world space for proper positioning)
    this.floatingTextPool.draw(ctx);

    ctx.restore();
  }

  /**
   * Gets current level for initial UI state
   */
  getCurrentLevel(): Level {
    return LEVELS[this.player.levelIndex];
  }

  /**
   * Checks if game is currently running
   */
  isRunning(): boolean {
    return this.running;
  }
}
