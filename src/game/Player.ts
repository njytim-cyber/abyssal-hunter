import { CONFIG } from './config';

/**
 * Represents a segment of a tentacle for physics simulation
 */
interface TentacleSegment {
    x: number;
    y: number;
}

/**
 * Tentacle class using verlet integration for smooth, organic movement.
 * Optimized for performance by avoiding object allocations in update loop.
 */
export class Tentacle {
    length: number;
    readonly segments: TentacleSegment[];
    private readonly segmentCount: number;

    constructor(length: number, segmentCount: number) {
        this.length = length;
        this.segmentCount = segmentCount;
        this.segments = [];

        for (let i = 0; i < segmentCount; i++) {
            this.segments.push({ x: 0, y: 0 });
        }
    }

    /**
     * Updates tentacle physics using constraint-based simulation
     * @param headX - X position of tentacle base
     * @param headY - Y position of tentacle base  
     * @param _angle - Angle (unused but kept for API consistency)
     * @param tension - How quickly segments follow (0-1)
     */
    update(headX: number, headY: number, _angle: number, tension: number): void {
        this.segments[0].x = headX;
        this.segments[0].y = headY;

        const targetDist = this.length / this.segmentCount;

        for (let i = 1; i < this.segmentCount; i++) {
            const prev = this.segments[i - 1];
            const curr = this.segments[i];

            const dx = prev.x - curr.x;
            const dy = prev.y - curr.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > targetDist) {
                const ratio = targetDist / dist;
                const tx = prev.x - dx * ratio;
                const ty = prev.y - dy * ratio;

                curr.x += (tx - curr.x) * tension;
                curr.y += (ty - curr.y) * tension;
            }
        }
    }

    /**
     * Renders the tentacle as a smooth curve
     */
    draw(ctx: CanvasRenderingContext2D, width: number, color: string): void {
        if (this.segmentCount < 2) return;

        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);

        for (let i = 1; i < this.segmentCount - 1; i++) {
            const xc = (this.segments[i].x + this.segments[i + 1].x) / 2;
            const yc = (this.segments[i].y + this.segments[i + 1].y) / 2;
            ctx.quadraticCurveTo(this.segments[i].x, this.segments[i].y, xc, yc);
        }

        const last = this.segments[this.segmentCount - 1];
        ctx.quadraticCurveTo(last.x, last.y, last.x, last.y);

        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.strokeStyle = color;
        ctx.stroke();
    }
}

/**
 * Player class representing the main controllable creature
 * Uses 8 tentacles for visual effect with bioluminescent glow
 */
export class Player {
    x: number;
    y: number;
    radius: number;
    angle: number;
    ink: number;
    levelIndex: number;
    readonly tentacles: Tentacle[];

    // Glow animation
    private glowPhase: number = 0;

    private static readonly TENTACLE_COUNT = 8;

    constructor() {
        this.x = CONFIG.worldSize / 2;
        this.y = CONFIG.worldSize / 2;
        this.radius = CONFIG.player.startRadius;
        this.angle = 0;
        this.ink = CONFIG.player.maxInk;
        this.levelIndex = 0;
        this.tentacles = [];
        this.glowPhase = 0;

        for (let i = 0; i < Player.TENTACLE_COUNT; i++) {
            this.tentacles.push(new Tentacle(100, 10));
        }
    }

    /**
     * Updates player position and tentacle physics
     * @param inputX - Target X position from input
     * @param inputY - Target Y position from input
     * @param isDashing - Whether player is currently dashing
     * @returns Whether the player is dashing (for particle effects)
     */
    update(inputX: number, inputY: number, isInputActive: boolean): boolean {
        const dx = inputX - this.x;
        const dy = inputY - this.y;
        const targetAngle = Math.atan2(dy, dx);

        // Smooth angle interpolation
        let diff = targetAngle - this.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.angle += diff * 0.1;

        let speed: number = CONFIG.player.baseSpeed;
        let isDashing = false;

        if (isInputActive && this.ink > 1) {
            speed = CONFIG.player.dashSpeed;
            this.ink -= CONFIG.player.inkCost;
            isDashing = true;
        } else {
            this.ink = Math.min(this.ink + CONFIG.player.inkRegen, CONFIG.player.maxInk);
        }

        this.x += Math.cos(this.angle) * speed;
        this.y += Math.sin(this.angle) * speed;

        // Clamp to world bounds
        this.x = Math.max(0, Math.min(this.x, CONFIG.worldSize));
        this.y = Math.max(0, Math.min(this.y, CONFIG.worldSize));

        // Update tentacles
        const tentacleRad = this.radius * 0.6;
        const tension = isDashing ? 0.3 : 0.6;

        for (let i = 0; i < this.tentacles.length; i++) {
            const t = this.tentacles[i];
            const offset = this.angle + (i / Player.TENTACLE_COUNT) * Math.PI * 2;
            const tx = this.x + Math.cos(offset) * tentacleRad;
            const ty = this.y + Math.sin(offset) * tentacleRad;
            t.length = this.radius * 4;
            t.update(tx, ty, this.angle, tension);
        }

        // Update glow animation
        this.glowPhase += CONFIG.player.glowPulseSpeed;

        return isDashing;
    }

    /**
     * Renders the player (octopus-like creature) with bioluminescent glow
     */
    draw(ctx: CanvasRenderingContext2D, isDashing: boolean = false): void {
        // Calculate glow intensity
        const glowAlpha = CONFIG.player.glowMinAlpha +
            (Math.sin(this.glowPhase) * 0.5 + 0.5) *
            (CONFIG.player.glowMaxAlpha - CONFIG.player.glowMinAlpha);

        // Draw outer glow
        const glowRadius = this.radius * (isDashing ? 3 : 2.2);
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.radius * 0.5,
            this.x, this.y, glowRadius
        );
        gradient.addColorStop(0, `rgba(0, 255, 204, ${glowAlpha})`);
        gradient.addColorStop(0.5, `rgba(0, 255, 204, ${glowAlpha * 0.3})`);
        gradient.addColorStop(1, 'rgba(0, 255, 204, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw tentacles (behind body)
        const tentacleColor = isDashing ? '#00ffff' : CONFIG.colors.playerOutline;
        for (const t of this.tentacles) {
            t.draw(ctx, this.radius * 0.25, tentacleColor);
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Body (elongated ellipse)
        ctx.fillStyle = CONFIG.colors.player;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 1.2, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (white)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.radius * 0.4, -this.radius * 0.35, this.radius * 0.3, 0, Math.PI * 2);
        ctx.arc(this.radius * 0.4, this.radius * 0.35, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Pupils (dark)
        ctx.fillStyle = '#050510';
        ctx.beginPath();
        ctx.arc(this.radius * 0.5, -this.radius * 0.35, this.radius * 0.12, 0, Math.PI * 2);
        ctx.arc(this.radius * 0.5, this.radius * 0.35, this.radius * 0.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
