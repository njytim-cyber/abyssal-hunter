import { CONFIG } from './config';

export type ParticleType = 'explosion' | 'trail' | 'glow' | 'sparkle';

/**
 * Particle class for visual effects (dash trails, eating effects)
 * Optimized for pooling - particles are short-lived
 */
export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: ParticleType;
  glow: boolean;

  constructor(
    x: number = 0,
    y: number = 0,
    color: string = '#fff',
    speed: number = 3,
    type: ParticleType = 'explosion'
  ) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.life = 1.0;
    this.maxLife = 1.0;
    this.size = 4;
    this.type = type;
    this.glow = false;

    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * Math.random() * speed;
    this.vy = Math.sin(angle) * Math.random() * speed;

    // Adjust properties based on type
    if (type === 'trail') {
      this.size = 6;
      this.vx *= 0.3;
      this.vy *= 0.3;
      this.glow = true;
    } else if (type === 'sparkle') {
      this.size = 2;
      this.life = 0.8;
      this.maxLife = 0.8;
      this.glow = true;
    } else if (type === 'glow') {
      this.size = 8;
      this.vx *= 0.5;
      this.vy *= 0.5;
      this.glow = true;
    }
  }

  /**
   * Reset particle for reuse from pool
   */
  reset(
    x: number,
    y: number,
    color: string,
    speed: number,
    type: ParticleType = 'explosion'
  ): void {
    this.x = x;
    this.y = y;
    this.color = color;
    this.life = 1.0;
    this.maxLife = 1.0;
    this.size = 4;
    this.type = type;
    this.glow = false;

    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * Math.random() * speed;
    this.vy = Math.sin(angle) * Math.random() * speed;

    // Adjust properties based on type
    if (type === 'trail') {
      this.size = 6;
      this.vx *= 0.3;
      this.vy *= 0.3;
      this.glow = true;
    } else if (type === 'sparkle') {
      this.size = 2;
      this.life = 0.8;
      this.maxLife = 0.8;
      this.glow = true;
    } else if (type === 'glow') {
      this.size = 8;
      this.vx *= 0.5;
      this.vy *= 0.5;
      this.glow = true;
    }
  }

  /**
   * Updates particle physics and lifetime
   * @returns true if particle is still alive
   */
  update(): boolean {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 0.03;
    return this.life > 0;
  }

  /**
   * Renders the particle with fade-out effect
   * @param ctx - Canvas rendering context
   * @param enableGlow - Whether to render expensive glow effect (default true)
   */
  draw(ctx: CanvasRenderingContext2D, enableGlow: boolean = true): void {
    const alpha = Math.max(0, this.life);

    // Add glow effect for certain particle types (expensive operation)
    if (enableGlow && this.glow && alpha > 0.1) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * this.life * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw main particle
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();

    if (this.type === 'sparkle') {
      // Draw sparkles as stars
      const points = 4;
      const outerRadius = this.size * this.life;
      const innerRadius = outerRadius * 0.5;
      ctx.moveTo(this.x, this.y - outerRadius);
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI * i) / points;
        ctx.lineTo(this.x + Math.sin(angle) * radius, this.y - Math.cos(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // Regular circle
      ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }
}

/**
 * Particle pool for object reuse
 */
export class ParticlePool {
  private pool: Particle[] = [];
  private active: Particle[] = [];
  private readonly maxPoolSize: number;

  constructor(maxPoolSize: number = 200) {
    this.maxPoolSize = maxPoolSize;
    // Pre-allocate some particles
    for (let i = 0; i < 50; i++) {
      this.pool.push(new Particle());
    }
  }

  /**
   * Get a particle from the pool or create new one
   */
  spawn(
    x: number,
    y: number,
    color: string,
    speed: number,
    type: ParticleType = 'explosion'
  ): void {
    let particle: Particle;

    if (this.pool.length > 0) {
      particle = this.pool.pop()!;
      particle.reset(x, y, color, speed, type);
    } else if (this.active.length < this.maxPoolSize) {
      particle = new Particle(x, y, color, speed, type);
    } else {
      return; // At capacity
    }

    this.active.push(particle);
  }

  /**
   * Spawn multiple particles
   */
  spawnBurst(
    x: number,
    y: number,
    count: number,
    color: string,
    speed: number,
    type: ParticleType = 'explosion'
  ): void {
    for (let i = 0; i < count; i++) {
      this.spawn(x, y, color, speed, type);
    }
  }

  /**
   * Spawn trail particles behind a moving object
   */
  spawnTrail(x: number, y: number, color: string): void {
    this.spawn(x, y, color, 1, 'trail');
  }

  /**
   * Update all active particles
   */
  update(): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      if (!this.active[i].update()) {
        const p = this.active.splice(i, 1)[0];
        if (this.pool.length < this.maxPoolSize) {
          this.pool.push(p);
        }
      }
    }
  }

  /**
   * Draw all active particles
   */
  draw(ctx: CanvasRenderingContext2D): void {
    // Performance optimization: disable glow when too many particles
    const enableGlow = this.active.length < 80;
    for (const p of this.active) {
      p.draw(ctx, enableGlow);
    }
  }

  /**
   * Clear all active particles
   */
  clear(): void {
    this.pool.push(...this.active);
    this.active = [];
  }

  get count(): number {
    return this.active.length;
  }
}

/**
 * Star with parallax layer for depth effect
 */
export interface Star {
  x: number;
  y: number;
  size: number;
  layer: number; // 0 = far (slow), 1 = mid, 2 = near (fast)
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

/**
 * Creates an array of random stars with parallax layers
 */
export function createStars(count: number, worldSize: number): Star[] {
  const stars: Star[] = [];
  const layerCount = CONFIG.stars.layers;

  for (let i = 0; i < count; i++) {
    const layer = Math.floor(Math.random() * layerCount);
    const sizeMult = 0.5 + (layer / layerCount) * 1.5; // Far stars smaller

    stars.push({
      x: Math.random() * worldSize * 1.5, // Extend beyond world for parallax
      y: Math.random() * worldSize * 1.5,
      size: (Math.random() * 2 + 0.5) * sizeMult,
      layer,
      brightness: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.02 + Math.random() * 0.03,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }

  return stars;
}

/**
 * Draw stars with parallax effect
 */
export function drawStarsWithParallax(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  cameraX: number,
  cameraY: number,
  frame: number
): void {
  // Performance: use RGBA instead of globalAlpha to avoid 200+ state changes
  for (const star of stars) {
    const parallax = CONFIG.stars.parallaxFactors[star.layer];
    const x = star.x - cameraX * parallax;
    const y = star.y - cameraY * parallax;

    // Twinkle effect
    const twinkle = Math.sin(frame * star.twinkleSpeed + star.twinklePhase);
    const alpha = star.brightness * (0.7 + twinkle * 0.3);

    // Use RGBA color directly instead of setting globalAlpha
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, alpha)})`;
    ctx.beginPath();
    ctx.arc(x, y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
}
