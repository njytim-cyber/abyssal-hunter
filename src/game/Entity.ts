import { CONFIG, EntityType } from './config';
import {
  CreatureShape,
  getRandomShape,
  drawFish,
  drawJellyfish,
  drawEel,
  drawBlob,
  drawSquid,
  drawAnglerfish,
  drawSeahorse,
  drawShark,
  drawMantaray,
  drawNautilus,
  drawCrab,
  drawStarfish,
} from './CreatureTypes';

/**
 * Entity class representing food, prey, and predator objects
 * Type can dynamically change based on size relative to player
 */
export class Entity {
  type: EntityType;
  x: number;
  y: number;
  radius: number;
  color: string;
  speed: number;
  vx: number;
  vy: number;
  shape: CreatureShape;
  private frameOffset: number; // For animation variety

  constructor(type: EntityType, x: number, y: number, r: number) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = r;
    this.color = this.getColorForType(type);
    this.shape = getRandomShape(type);
    this.frameOffset = Math.random() * 1000;

    // Speed based on entity type and size
    if (type === 'food') {
      this.speed = Math.random() * 0.2;
    } else if (type === 'prey') {
      this.speed = 2.5 + Math.random() * 2.0;
    } else {
      const sizeFactor = Math.min(r / 50, 1);
      this.speed = 3.5 - sizeFactor * 1.7 + Math.random() * 0.5;
    }

    // Adjust speed by shape
    if (this.shape === 'eel') {
      this.speed *= 1.3; // Eels are faster
    } else if (this.shape === 'jellyfish') {
      this.speed *= 0.7; // Jellyfish are slower
    }

    // Initial random direction
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
  }

  private getColorForType(type: EntityType): string {
    switch (type) {
      case 'food':
        return CONFIG.colors.food;
      case 'prey':
        return CONFIG.colors.prey;
      case 'predator':
        return CONFIG.colors.predator;
    }
  }

  /**
   * Updates entity's type and color based on player radius
   * Called each frame to handle dynamic role changes
   */
  updateType(playerRadius: number): void {
    if (this.type === 'food') return;

    const newType = this.radius < playerRadius ? 'prey' : 'predator';
    if (newType !== this.type) {
      this.type = newType;
      this.color = this.getColorForType(newType);
    }
  }

  /**
   * Updates entity AI and physics
   * @param playerX - Player X position for AI decisions
   * @param playerY - Player Y position for AI decisions
   * @param frame - Current frame number for periodic behavior
   */
  update(playerX: number, playerY: number, frame: number): void {
    if (this.type === 'food') {
      // Food just drifts
      this.x += this.vx;
      this.y += this.vy;
    } else {
      // AI behavior based on distance to player
      const dx = this.x - playerX;
      const dy = this.y - playerY;
      const d = Math.sqrt(dx * dx + dy * dy);
      const range = 600 + this.radius;

      let targetVx = this.vx;
      let targetVy = this.vy;

      if (d < range) {
        const angleToPlayer = Math.atan2(dy, dx);

        if (this.type === 'predator') {
          // Chase player
          targetVx = -Math.cos(angleToPlayer) * this.speed;
          targetVy = -Math.sin(angleToPlayer) * this.speed;
        } else {
          // Flee from player
          targetVx = Math.cos(angleToPlayer) * this.speed;
          targetVy = Math.sin(angleToPlayer) * this.speed;
        }
      } else {
        // Wander randomly when player is far
        if (frame % 60 === 0 && Math.random() > 0.5) {
          const a = Math.random() * Math.PI * 2;
          targetVx = Math.cos(a) * (this.speed * 0.5);
          targetVy = Math.sin(a) * (this.speed * 0.5);
        }
      }

      // Eel zigzag movement
      if (this.shape === 'eel') {
        const zigzag = Math.sin((frame + this.frameOffset) * 0.1) * 0.5;
        targetVx += Math.cos(Math.atan2(targetVy, targetVx) + Math.PI / 2) * zigzag;
        targetVy += Math.sin(Math.atan2(targetVy, targetVx) + Math.PI / 2) * zigzag;
      }

      // Smooth velocity interpolation
      this.vx += (targetVx - this.vx) * 0.05;
      this.vy += (targetVy - this.vy) * 0.05;

      this.x += this.vx;
      this.y += this.vy;
    }

    // Wrap around world boundaries (like player)
    if (this.x < 0) this.x = CONFIG.worldSize;
    if (this.x > CONFIG.worldSize) this.x = 0;
    if (this.y < 0) this.y = CONFIG.worldSize;
    if (this.y > CONFIG.worldSize) this.y = 0;
  }

  /**
   * Renders the entity based on its shape
   */
  draw(ctx: CanvasRenderingContext2D, frame: number): void {
    const angle = Math.atan2(this.vy, this.vx);
    const animFrame = frame + this.frameOffset;

    // Enhanced glow effect based on entity type
    const pulse = Math.sin(frame * 0.05 + this.frameOffset) * 0.5 + 0.5;
    let glowIntensity = 10;
    let glowColor = this.color;

    switch (this.type) {
      case 'food':
        glowIntensity = 8 + pulse * 5;
        glowColor = CONFIG.colors.foodGlow;
        break;
      case 'prey':
        glowIntensity = 12 + pulse * 6;
        glowColor = CONFIG.colors.preyGlow;
        break;
      case 'predator':
        glowIntensity = 18 + pulse * 10;
        glowColor = CONFIG.colors.predatorGlow;
        break;
    }

    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = glowColor;

    switch (this.shape) {
      case 'fish':
        drawFish(ctx, this.x, this.y, this.radius, angle, this.color);
        break;
      case 'jellyfish':
        drawJellyfish(ctx, this.x, this.y, this.radius, animFrame, this.color);
        break;
      case 'eel':
        drawEel(ctx, this.x, this.y, this.radius, angle, animFrame, this.color);
        break;
      case 'squid':
        drawSquid(ctx, this.x, this.y, this.radius, angle, animFrame, this.color);
        break;
      case 'anglerfish':
        drawAnglerfish(ctx, this.x, this.y, this.radius, angle, animFrame, this.color);
        break;
      case 'seahorse':
        drawSeahorse(ctx, this.x, this.y, this.radius, angle, this.color);
        break;
      case 'shark':
        drawShark(ctx, this.x, this.y, this.radius, angle, this.color);
        break;
      case 'mantaray':
        drawMantaray(ctx, this.x, this.y, this.radius, angle, animFrame, this.color);
        break;
      case 'nautilus':
        drawNautilus(ctx, this.x, this.y, this.radius, angle, this.color);
        break;
      case 'crab':
        drawCrab(ctx, this.x, this.y, this.radius, angle, this.color);
        break;
      case 'starfish':
        drawStarfish(ctx, this.x, this.y, this.radius, animFrame, this.color);
        break;
      case 'blob':
      default:
        drawBlob(ctx, this.x, this.y, this.radius, this.color);
        // Draw eye for blob non-food
        if (this.type !== 'food') {
          const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
          if (speed > 0.1) {
            const ex = this.x + Math.cos(angle) * (this.radius * 0.5);
            const ey = this.y + Math.sin(angle) * (this.radius * 0.5);
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(ex, ey, this.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
    }

    ctx.shadowBlur = 0;
  }
}
