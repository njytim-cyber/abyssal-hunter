import { CONFIG } from './config';

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
    color: string;
    size: number;

    constructor(x: number = 0, y: number = 0, color: string = '#fff', speed: number = 3) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = 1.0;
        this.size = 4;

        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * Math.random() * speed;
        this.vy = Math.sin(angle) * Math.random() * speed;
    }

    /**
     * Reset particle for reuse from pool
     */
    reset(x: number, y: number, color: string, speed: number): void {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = 1.0;
        this.size = 4;

        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * Math.random() * speed;
        this.vy = Math.sin(angle) * Math.random() * speed;
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
     */
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
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
    spawn(x: number, y: number, color: string, speed: number): void {
        let particle: Particle;

        if (this.pool.length > 0) {
            particle = this.pool.pop()!;
            particle.reset(x, y, color, speed);
        } else if (this.active.length < this.maxPoolSize) {
            particle = new Particle(x, y, color, speed);
        } else {
            return; // At capacity
        }

        this.active.push(particle);
    }

    /**
     * Spawn multiple particles
     */
    spawnBurst(x: number, y: number, count: number, color: string, speed: number): void {
        for (let i = 0; i < count; i++) {
            this.spawn(x, y, color, speed);
        }
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
        for (const p of this.active) {
            p.draw(ctx);
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
            twinklePhase: Math.random() * Math.PI * 2
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
    for (const star of stars) {
        const parallax = CONFIG.stars.parallaxFactors[star.layer];
        const x = star.x - cameraX * parallax;
        const y = star.y - cameraY * parallax;

        // Twinkle effect
        const twinkle = Math.sin(frame * star.twinkleSpeed + star.twinklePhase);
        const alpha = star.brightness * (0.7 + twinkle * 0.3);

        ctx.globalAlpha = Math.max(0.1, alpha);
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}
