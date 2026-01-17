import { CONFIG } from './config';

/**
 * Projectile class for player shooting ability
 * Ink projectiles that can kill entities regardless of size
 */
export class Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  lifetime: number;
  age: number = 0;
  active: boolean = true;
  charge: number; // 0-1 for charge power

  constructor(x: number, y: number, angle: number, charge: number = 0) {
    this.x = x;
    this.y = y;
    this.charge = Math.max(0, Math.min(1, charge)); // Clamp 0-1

    // Charge affects speed and size
    this.speed = 12 + this.charge * 8; // 12-20 speed
    this.radius = 8 + this.charge * 12; // 8-20 radius
    this.lifetime = 120; // 2 seconds at 60fps

    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
  }

  /**
   * Updates projectile position and age
   * @returns true if projectile is still active
   */
  update(): boolean {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;

    // Deactivate if too old or out of bounds
    if (
      this.age >= this.lifetime ||
      this.x < 0 ||
      this.x > CONFIG.worldSize ||
      this.y < 0 ||
      this.y > CONFIG.worldSize
    ) {
      this.active = false;
    }

    return this.active;
  }

  /**
   * Checks collision with an entity
   */
  checkCollision(entityX: number, entityY: number, entityRadius: number): boolean {
    const dx = this.x - entityX;
    const dy = this.y - entityY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + entityRadius;
  }

  /**
   * Renders the projectile as an ink blob with trail
   */
  draw(ctx: CanvasRenderingContext2D): void {
    // Fade out near end of lifetime
    const fadeStart = this.lifetime * 0.8;
    const alpha =
      this.age > fadeStart ? 1 - (this.age - fadeStart) / (this.lifetime - fadeStart) : 1;

    // Main projectile
    ctx.save();
    ctx.globalAlpha = alpha;

    // Glow effect
    const glowIntensity = 15 + this.charge * 10;
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = CONFIG.colors.ink;

    // Ink blob (larger for charged shots)
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    gradient.addColorStop(0, CONFIG.colors.player);
    gradient.addColorStop(0.5, CONFIG.colors.ink);
    gradient.addColorStop(1, 'rgba(0, 255, 204, 0.3)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Charged shot has additional effects
    if (this.charge > 0.5) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = alpha * 0.5;
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Projectile pool for efficient memory management
 */
export class ProjectilePool {
  private pool: Projectile[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  /**
   * Spawns a new projectile
   */
  spawn(x: number, y: number, angle: number, charge: number = 0): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(new Projectile(x, y, angle, charge));
    }
  }

  /**
   * Updates all projectiles and removes inactive ones
   */
  update(): void {
    for (let i = this.pool.length - 1; i >= 0; i--) {
      if (!this.pool[i].update()) {
        this.pool.splice(i, 1);
      }
    }
  }

  /**
   * Renders all active projectiles
   */
  draw(ctx: CanvasRenderingContext2D): void {
    for (const projectile of this.pool) {
      projectile.draw(ctx);
    }
  }

  /**
   * Gets all active projectiles
   */
  getAll(): Projectile[] {
    return this.pool;
  }

  /**
   * Removes a specific projectile
   */
  remove(projectile: Projectile): void {
    const index = this.pool.indexOf(projectile);
    if (index !== -1) {
      this.pool.splice(index, 1);
    }
  }

  /**
   * Clears all projectiles
   */
  clear(): void {
    this.pool = [];
  }
}
