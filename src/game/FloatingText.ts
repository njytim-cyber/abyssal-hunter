/**
 * FloatingText - Score popup that rises and fades
 * Used for "+10" style feedback when eating entities
 */
export class FloatingText {
    x: number;
    y: number;
    text: string;
    color: string;
    life: number;
    vy: number;
    scale: number;

    constructor(x: number, y: number, text: string, color: string = '#ffffff') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.vy = -2;
        this.scale = 1.0;
    }

    /**
     * Updates position and lifetime
     * @returns true if still alive
     */
    update(): boolean {
        this.y += this.vy;
        this.vy *= 0.95; // Slow down
        this.life -= 0.02;
        this.scale = 0.5 + this.life * 0.5;
        return this.life > 0;
    }

    /**
     * Renders the floating text
     */
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.font = `bold ${Math.floor(20 * this.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Shadow for visibility
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);

        ctx.restore();
    }
}

/**
 * Object pool for FloatingText to reduce allocations
 */
export class FloatingTextPool {
    private pool: FloatingText[] = [];
    private active: FloatingText[] = [];
    private readonly maxPoolSize = 50;

    acquire(x: number, y: number, text: string, color: string): FloatingText {
        let ft: FloatingText;

        if (this.pool.length > 0) {
            ft = this.pool.pop()!;
            ft.x = x;
            ft.y = y;
            ft.text = text;
            ft.color = color;
            ft.life = 1.0;
            ft.vy = -2;
            ft.scale = 1.0;
        } else {
            ft = new FloatingText(x, y, text, color);
        }

        this.active.push(ft);
        return ft;
    }

    update(): void {
        for (let i = this.active.length - 1; i >= 0; i--) {
            if (!this.active[i].update()) {
                const ft = this.active.splice(i, 1)[0];
                if (this.pool.length < this.maxPoolSize) {
                    this.pool.push(ft);
                }
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        for (const ft of this.active) {
            ft.draw(ctx);
        }
    }

    clear(): void {
        this.pool.push(...this.active);
        this.active = [];
    }
}
