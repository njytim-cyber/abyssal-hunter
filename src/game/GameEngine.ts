import { audioManager } from './AudioManager';
import { Boss, BOSS_DEFINITIONS } from './Boss';
import { CONFIG, LEVELS, EntityType, Level } from './config';
import { Entity } from './Entity';
import { FloatingTextPool } from './FloatingText';
import { ParticlePool, Star, createStars, drawStarsWithParallax } from './Particle';
import { Player } from './Player';
import { PowerUp } from './PowerUp';
import { ActivePowerUp, POWER_UP_CONFIG, POWER_UP_DEFINITIONS, PowerUpType } from './PowerUpTypes';
import { ProjectilePool } from './Projectile';
import { shopManager } from './ShopManager';
import { SpatialGrid } from './SpatialGrid';

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
  shoot: boolean;
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
  onLivesChange?: (lives: number) => void;
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
  private powerUps: PowerUp[] = [];
  private activePowerUps: ActivePowerUp[] = [];
  private lastPowerUpSpawn: number = 0;
  private particlePool: ParticlePool;
  private projectilePool: ProjectilePool;
  private floatingTextPool: FloatingTextPool;
  private stars: Star[] = [];
  private camera: Camera = { x: 0, y: 0, scale: 1 };

  // Shooting mechanics
  private shootCharge: number = 0;
  private lastShootTime: number = 0;
  private readonly shootCooldown: number = 300; // 300ms between shots
  private readonly shootInkCost: number = 10;

  // Canvas
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number = 800;
  private height: number = 600;

  // Game state
  private running: boolean = false;
  private paused: boolean = false;
  private frame: number = 0;
  private animationId: number = 0;

  // Input
  private input: InputState = { x: 0, y: 0, active: false };
  private keys: KeyboardState = {
    up: false,
    down: false,
    left: false,
    right: false,
    dash: false,
    shoot: false,
  };
  private usingKeyboard: boolean = false;

  // Screen shake
  private shake: ScreenShake = { intensity: 0, offsetX: 0, offsetY: 0 };

  // Combo system
  private combo: ComboState = { count: 0, lastEatTime: 0, multiplier: 1 };

  // Spawn protection (invincibility frames at start)
  private spawnProtection: number = 0;
  private static readonly SPAWN_PROTECTION_FRAMES = 60; // 1 second at 60fps

  // Callbacks
  private callbacks: GameCallbacks | null = null;

  // Track dashing state for player draw
  private playerDashing: boolean = false;

  // Shop upgrade multipliers (loaded on game start)
  private xpMultiplier: number = 1;
  private visionMultiplier: number = 1;

  // Spatial grid for optimized collision detection
  private spatialGrid: SpatialGrid;

  // Boss encounter system
  private currentBoss: Boss | null = null;
  private bossSpawnIndex: number = 0;
  private gameStartTime: number = 0;

  // Lives system
  private lives: number = 3;
  private static readonly MAX_LIVES = 3;

  constructor() {
    this.player = new Player();
    this.particlePool = new ParticlePool(300);
    this.projectilePool = new ProjectilePool(50);
    this.floatingTextPool = new FloatingTextPool();
    this.stars = createStars(CONFIG.stars.count, CONFIG.worldSize);
    this.spatialGrid = new SpatialGrid(300); // 300px cells
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
    this.callbacks.onLivesChange?.(this.lives);
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
        this.keys.dash = pressed;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.shoot = pressed;
        // Handle shoot when key is released (charge shot)
        if (!pressed && this.shootCharge > 0) {
          this.fireProjectile();
        }
        break;
      case 'Escape':
      case 'KeyP':
        // Toggle pause on key press (not release)
        if (pressed) {
          this.togglePause();
        }
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
   * Toggle pause state
   */
  togglePause(): boolean {
    if (!this.running) return false;
    this.paused = !this.paused;
    return this.paused;
  }

  /**
   * Check if game is paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Starts or restarts the game
   */
  start(): void {
    this.player = new Player();
    this.entities = [];
    this.powerUps = [];
    this.activePowerUps = [];
    this.lastPowerUpSpawn = performance.now();
    this.particlePool.clear();
    this.projectilePool.clear();
    this.floatingTextPool.clear();
    this.frame = 0;
    this.running = true;
    this.paused = false;
    this.combo = { count: 0, lastEatTime: 0, multiplier: 1 };
    this.shake = { intensity: 0, offsetX: 0, offsetY: 0 };
    this.spawnProtection = GameEngine.SPAWN_PROTECTION_FRAMES;
    this.shootCharge = 0;
    this.lastShootTime = 0;
    this.currentBoss = null;
    this.bossSpawnIndex = 0;
    this.gameStartTime = Date.now();
    this.lives = GameEngine.MAX_LIVES;

    // Apply shop upgrades to player
    const upgrades = shopManager.getUpgradeMultipliers();
    this.player.baseSpeed = CONFIG.player.baseSpeed * upgrades.speed;
    this.player.dashInkCost = CONFIG.player.inkCost * upgrades.dashCooldown;
    this.player.radius = CONFIG.player.startRadius * upgrades.startSize;
    this.xpMultiplier = upgrades.xp;
    this.visionMultiplier = upgrades.vision;

    // Reset input position to player
    this.input.x = this.player.x;
    this.input.y = this.player.y;

    // Notify UI
    this.callbacks?.onScoreChange(Math.floor(this.player.radius));
    this.callbacks?.onInkChange(this.player.ink, CONFIG.player.maxInk);
    this.callbacks?.onLivesChange?.(this.lives);

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
      // Skip game logic updates when paused, but still render
      if (!this.paused) {
        this.spawnEntities();
        this.updatePhysics();
        this.updateShake();
        this.frame++;
      }
      this.render();
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
    const difficultyMultiplier = 1 + this.player.levelIndex * 0.25; // Increases faster with level
    const maxEnemiesScaled = Math.floor(CONFIG.spawn.maxEnemies * difficultyMultiplier);

    if (enemyCount < maxEnemiesScaled) {
      // Higher level = more predators - increased from 0.1 to 0.15
      const predatorChance = 0.4 + this.player.levelIndex * 0.15;
      const isPredator = Math.random() < predatorChance;
      let radius: number;
      let type: EntityType;

      if (isPredator) {
        // Predators scale more aggressively with level - made even bigger
        radius = this.player.radius * (1.3 + Math.random() * 0.6 + this.player.levelIndex * 0.15);
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

    // Spawn power-ups periodically
    const now = performance.now();
    if (
      now - this.lastPowerUpSpawn > POWER_UP_CONFIG.spawnInterval &&
      Math.random() < POWER_UP_CONFIG.spawnChance
    ) {
      this.lastPowerUpSpawn = now;
      const powerUpTypes: PowerUpType[] = [
        'speedBoost',
        'shield',
        'sizeIncrease',
        'magnet',
        'multiDash',
      ];
      const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

      // Spawn at random position away from player
      const angle = Math.random() * Math.PI * 2;
      const distance =
        POWER_UP_CONFIG.minSpawnDistance +
        Math.random() * (POWER_UP_CONFIG.maxSpawnDistance - POWER_UP_CONFIG.minSpawnDistance);
      const px = this.player.x + Math.cos(angle) * distance;
      const py = this.player.y + Math.sin(angle) * distance;

      // Clamp to world bounds
      const clampedX = Math.max(50, Math.min(CONFIG.worldSize - 50, px));
      const clampedY = Math.max(50, Math.min(CONFIG.worldSize - 50, py));

      this.powerUps.push(new PowerUp(randomType, clampedX, clampedY));
    }

    // Spawn bosses based on elapsed time
    if (!this.currentBoss && this.bossSpawnIndex < BOSS_DEFINITIONS.length) {
      const elapsedMinutes = (Date.now() - this.gameStartTime) / 1000 / 60;
      const nextBoss = BOSS_DEFINITIONS[this.bossSpawnIndex];

      if (elapsedMinutes >= nextBoss.spawnMinutes) {
        this.currentBoss = new Boss(nextBoss, CONFIG.worldSize);
        this.bossSpawnIndex++;
        this.floatingTextPool.acquire(
          this.player.x,
          this.player.y - 100,
          `${nextBoss.name} Appears!`,
          '#ff0000'
        );
        audioManager.playLevelUp(); // Boss spawn sound
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

    // Update all entities first
    for (let i = 0; i < this.entities.length; i++) {
      const e = this.entities[i];
      e.updateType(playerRadius);
      e.update(playerX, playerY, this.frame);

      // Magnet power-up: Attract food toward player
      if (this.hasPowerUp('magnet') && e.type === 'food') {
        const dx = playerX - e.x;
        const dy = playerY - e.y;
        const dist = dx * dx + dy * dy; // Use squared distance to avoid sqrt
        if (dist < 640000 && dist > 0) {
          // 640000 = 800^2
          const d = Math.sqrt(dist);
          const pullStrength = 2;
          e.x += (dx / d) * pullStrength;
          e.y += (dy / d) * pullStrength;
        }
      }
    }

    // Build spatial grid for optimized collision detection
    this.spatialGrid.build(this.entities);

    // Get nearby entities using spatial grid
    const nearbyEntities = this.spatialGrid.getNearby(playerX, playerY);

    // Check collisions only with nearby entities
    for (let i = nearbyEntities.length - 1; i >= 0; i--) {
      const e = nearbyEntities[i];

      // Collision detection using squared distance (faster)
      const dx = playerX - e.x;
      const dy = playerY - e.y;
      const distSq = dx * dx + dy * dy;
      const minDist = playerRadius + e.radius;
      const minDistSq = minDist * minDist;

      if (distSq < minDistSq) {
        if (playerRadius > e.radius) {
          // Eat entity
          const baseGain = e.type === 'food' ? 0.3 : e.radius * 0.2;

          // Update combo
          this.combo.count++;
          this.combo.lastEatTime = now;
          this.combo.multiplier = Math.min(this.combo.count, CONFIG.combo.maxMultiplier);

          // Apply XP multiplier from shop upgrades
          const gain = baseGain * (1 + (this.combo.multiplier - 1) * 0.2) * this.xpMultiplier;
          this.player.radius += gain;

          // Spawn particles - optimized to reduce lag
          const particleCount = Math.min(6 + this.combo.multiplier, 12);
          this.particlePool.spawnBurst(e.x, e.y, particleCount, e.color, 4, 'glow');

          // Add sparkles for combos - reduced count
          if (this.combo.multiplier > 1) {
            const sparkleCount = Math.min(this.combo.multiplier, 6);
            this.particlePool.spawnBurst(e.x, e.y, sparkleCount, CONFIG.colors.combo, 6, 'sparkle');
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

          // Mark entity for removal (batched cleanup for performance)
          e.markedForDeath = true;

          // Screen shake & sound
          this.triggerShake(e.type === 'food' ? 1 : CONFIG.shake.eatIntensity);
          audioManager.playEat(this.combo.multiplier);

          this.checkLevelUp();
          this.callbacks?.onScoreChange(Math.floor(this.player.radius));
          this.callbacks?.onComboChange?.(this.combo.count, this.combo.multiplier);
        } else if (e.type !== 'food' && this.spawnProtection <= 0) {
          // Check if player has shield power-up
          if (this.hasPowerUp('shield')) {
            // Shield blocks the hit - remove shield and entity
            this.activePowerUps = this.activePowerUps.filter(p => p.type !== 'shield');
            e.markedForDeath = true;
            this.particlePool.spawnBurst(
              this.player.x,
              this.player.y,
              30,
              POWER_UP_DEFINITIONS.shield.color,
              10,
              'explosion'
            );
            this.floatingTextPool.acquire(this.player.x, this.player.y - 40, 'BLOCKED!', '#ffaa00');
            this.triggerShake(5);
            // Play shield sound
            continue;
          }
          // Game over - eaten by predator (unless protected)
          this.gameOver();
          return;
        }
      }
    }

    // Check power-up collisions
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.update(this.frame);

      if (powerUp.checkCollision(playerX, playerY, playerRadius)) {
        // Activate power-up
        const now = performance.now();
        const def = POWER_UP_DEFINITIONS[powerUp.type];
        this.activePowerUps.push({
          type: powerUp.type,
          startTime: now,
          endTime: now + def.duration,
        });

        // Visual feedback
        this.particlePool.spawnBurst(powerUp.x, powerUp.y, 20, def.color, 8, 'sparkle');
        this.floatingTextPool.acquire(powerUp.x, powerUp.y - 30, def.name, def.color);
        this.triggerShake(2);

        // Play sound (will add audio later)
        // audioManager.playPowerUpPickup();

        // Remove power-up
        this.powerUps.splice(i, 1);
      }
    }

    // Update active power-ups (remove expired ones)
    const currentTime = performance.now();
    this.activePowerUps = this.activePowerUps.filter(p => p.endTime > currentTime);

    // Apply power-up effects to player
    this.applyPowerUpEffects();

    // Handle shooting charge
    if (this.keys.shoot) {
      this.shootCharge++;
    } else if (this.shootCharge > 0) {
      // Fire when released
      this.fireProjectile();
    }

    // Update projectiles and check collisions with entities
    this.projectilePool.update();
    for (const projectile of this.projectilePool.getAll()) {
      // Performance: use spatial grid to only check nearby entities
      const nearbyEntities = this.spatialGrid.getNearby(projectile.x, projectile.y);

      for (const entity of nearbyEntities) {
        if (entity.markedForDeath) continue; // Skip already-dead entities
        if (projectile.checkCollision(entity.x, entity.y, entity.radius)) {
          // Projectile hit entity - mark for removal
          entity.markedForDeath = true;
          this.projectilePool.remove(projectile);

          // Explosion effect
          this.particlePool.spawnBurst(entity.x, entity.y, 15, entity.color, 8, 'explosion');
          this.floatingTextPool.acquire(entity.x, entity.y - 20, 'HIT!', CONFIG.colors.ink);
          this.triggerShake(3);

          // Award some score
          const gain = entity.radius * 0.1;
          this.player.radius += gain;
          this.checkLevelUp();
          this.callbacks?.onScoreChange(Math.floor(this.player.radius));
          break;
        }
      }
    }

    // Batch remove dead entities (performance optimization)
    this.entities = this.entities.filter(e => !e.markedForDeath);

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

    // Update and check boss collision
    if (this.currentBoss) {
      const boss = this.currentBoss; // Store reference for type safety
      boss.update(this.player.x, this.player.y, this.frame);

      // Check boss collision with player
      if (boss.checkCollision(this.player.x, this.player.y, this.player.radius)) {
        // Player hit by boss
        if (this.spawnProtection === 0 && !this.hasPowerUp('shield')) {
          this.gameOver();
        }
      }

      // Check boss collision with projectiles
      for (const projectile of this.projectilePool.getAll()) {
        if (boss.checkCollision(projectile.x, projectile.y, projectile.radius)) {
          // Projectile hit boss
          const damage = 10 + this.player.radius * 0.5; // Scale with player size
          boss.takeDamage(damage);
          projectile.active = false;

          // Boss death
          if (!boss.active) {
            const bossReward = boss.maxHealth * 2;
            this.player.radius += bossReward;
            this.floatingTextPool.acquire(
              boss.x,
              boss.y,
              `+${Math.floor(bossReward)} XP`,
              '#ffcc00'
            );
            this.particlePool.spawnBurst(boss.x, boss.y, 30, boss.color, 3);
            audioManager.playLevelUp(); // Boss defeated sound
            this.checkLevelUp(); // Check if defeating boss levels up player
            this.callbacks?.onScoreChange(Math.floor(this.player.radius));
            this.currentBoss = null;
          } else {
            // Boss hit effect
            this.particlePool.spawnBurst(projectile.x, projectile.y, 5, boss.color, 2);
            audioManager.playEat();
          }
        }
      }
    }

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
      // Reduced shake intensity to prevent slowdown during level up
      this.triggerShake(5);
    }
  }

  /**
   * Handles game over or life loss
   */
  private gameOver(): void {
    // Reduce lives
    this.lives--;
    this.callbacks?.onLivesChange?.(this.lives);

    audioManager.playDeath();

    // Visual feedback for life loss
    this.particlePool.spawnBurst(this.player.x, this.player.y, 50, '#ff0000', 12, 'explosion');
    this.floatingTextPool.acquire(
      this.player.x,
      this.player.y - 50,
      this.lives > 0 ? `${this.lives} ${this.lives === 1 ? 'LIFE' : 'LIVES'} LEFT!` : 'GAME OVER',
      '#ff0000'
    );
    this.triggerShake(20);

    if (this.lives > 0) {
      // Still have lives - respawn
      this.respawn();
    } else {
      // Out of lives - actual game over
      this.running = false;
      audioManager.stopAmbient();

      const finalScore = Math.floor(this.player.radius);

      // Award coins based on score (1 coin per radius gained above starting size)
      const coinsEarned = Math.max(0, finalScore - CONFIG.player.startRadius);
      shopManager.addCoins(coinsEarned);
      shopManager.recordGame();

      this.callbacks?.onGameOver(finalScore);
    }
  }

  /**
   * Respawns the player after losing a life
   */
  private respawn(): void {
    // Reset player to starting position with current size preserved
    const savedRadius = this.player.radius;
    const savedLevelIndex = this.player.levelIndex;
    this.player = new Player();
    this.player.radius = savedRadius;
    this.player.levelIndex = savedLevelIndex;

    // Clear nearby threats
    this.entities = this.entities.filter(e => {
      const dx = e.x - this.player.x;
      const dy = e.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist > 500; // Remove entities within 500px
    });

    // Reset combat state
    this.spawnProtection = GameEngine.SPAWN_PROTECTION_FRAMES * 3; // 3 seconds invincibility
    this.player.ink = CONFIG.player.maxInk; // Restore ink
    this.callbacks?.onInkChange(this.player.ink, CONFIG.player.maxInk);

    // Visual respawn effect
    this.particlePool.spawnBurst(
      this.player.x,
      this.player.y,
      30,
      CONFIG.colors.playerGlow,
      8,
      'sparkle'
    );
    this.floatingTextPool.acquire(this.player.x, this.player.y - 30, 'RESPAWN!', '#00ffff');
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

    // Calculate camera scale based on player size (with vision upgrade multiplier)
    const baseTargetScale = Math.max(0.15, Math.min(1.5, 30 / (this.player.radius + 10)));
    const targetScale = baseTargetScale * this.visionMultiplier;
    this.camera.scale += (targetScale - this.camera.scale) * 0.05;

    // Performance: cache scaled dimensions to avoid repeated division
    const scaledWidth = this.width / this.camera.scale;
    const scaledHeight = this.height / this.camera.scale;

    // Camera position (centered on player)
    this.camera.x = this.player.x - scaledWidth / 2;
    this.camera.y = this.player.y - scaledHeight / 2;

    // Clamp camera to world bounds
    this.camera.x = Math.max(0, Math.min(this.camera.x, CONFIG.worldSize - scaledWidth));
    this.camera.y = Math.max(0, Math.min(this.camera.y, CONFIG.worldSize - scaledHeight));

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

    // Draw entities (disable glow for distant entities when too many for performance)
    const entityCount = this.entities.length;
    const glowDistanceThreshold = 800; // Only glow entities within 800px of player

    // Viewport culling: calculate visible bounds in world coordinates
    const viewportPadding = 200; // Extra padding for smooth edge transitions
    const viewportLeft = this.camera.x - viewportPadding;
    const viewportRight = this.camera.x + scaledWidth + viewportPadding;
    const viewportTop = this.camera.y - viewportPadding;
    const viewportBottom = this.camera.y + scaledHeight + viewportPadding;

    for (const entity of this.entities) {
      // Viewport culling: skip entities completely outside visible area
      if (
        entity.x + entity.radius < viewportLeft ||
        entity.x - entity.radius > viewportRight ||
        entity.y + entity.radius < viewportTop ||
        entity.y - entity.radius > viewportBottom
      ) {
        continue; // Entity is off-screen, skip rendering
      }

      // Performance optimization: disable expensive shadow blur when many entities
      const enableGlow =
        entityCount < 60 ||
        (Math.abs(entity.x - this.player.x) < glowDistanceThreshold &&
          Math.abs(entity.y - this.player.y) < glowDistanceThreshold);
      entity.draw(ctx, this.frame, enableGlow);
    }

    // Draw boss (if active)
    if (this.currentBoss) {
      this.currentBoss.draw(ctx, this.frame);
    }

    // Draw power-ups
    for (const powerUp of this.powerUps) {
      powerUp.draw(ctx, this.frame);
    }

    // Draw projectiles
    this.projectilePool.draw(ctx);

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

  /**
   * Checks if a specific power-up is currently active
   */
  hasPowerUp(type: PowerUpType): boolean {
    return this.activePowerUps.some(p => p.type === type);
  }

  /**
   * Gets all currently active power-ups
   */
  getActivePowerUps(): ActivePowerUp[] {
    return this.activePowerUps;
  }

  /**
   * Applies power-up modifiers to player stats
   */
  private applyPowerUpEffects(): void {
    // Speed boost: +50% speed
    if (this.hasPowerUp('speedBoost')) {
      this.player.baseSpeed = CONFIG.player.baseSpeed * 1.5;
    } else {
      this.player.baseSpeed = CONFIG.player.baseSpeed;
    }

    // Size increase: +30% radius
    const baseSizeMultiplier = this.hasPowerUp('sizeIncrease') ? 1.3 : 1.0;
    // Apply size multiplier visually only (doesn't change actual radius for collision/growth)
    this.player.visualSizeMultiplier = baseSizeMultiplier;

    // Multi-dash: 50% less ink cost
    if (this.hasPowerUp('multiDash')) {
      this.player.dashInkCost = CONFIG.player.inkCost * 0.5;
    } else {
      this.player.dashInkCost = CONFIG.player.inkCost;
    }
  }

  /**
   * Fires a projectile in the direction the player is facing
   */
  private fireProjectile(): void {
    const now = performance.now();

    // Check cooldown
    if (now - this.lastShootTime < this.shootCooldown) {
      return;
    }

    // Check if player has enough ink
    if (this.player.ink < this.shootInkCost) {
      return;
    }

    // Calculate charge level (0-1)
    const charge = Math.min(this.shootCharge / 60, 1); // Max charge at 1 second (60 frames)

    // Fire projectile in direction player is facing
    this.projectilePool.spawn(this.player.x, this.player.y, this.player.angle, charge);

    // Consume ink
    this.player.ink = Math.max(0, this.player.ink - this.shootInkCost);
    this.callbacks?.onInkChange(this.player.ink, CONFIG.player.maxInk);

    // Reset charge and cooldown
    this.shootCharge = 0;
    this.lastShootTime = now;

    // Visual feedback
    this.particlePool.spawnBurst(this.player.x, this.player.y, 8, CONFIG.colors.ink, 6, 'glow');
    this.triggerShake(2);

    // Play sound
    // audioManager.playShoot();
  }
}
