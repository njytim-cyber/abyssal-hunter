import { POWER_UP_CONFIG, POWER_UP_DEFINITIONS, PowerUpType } from './PowerUpTypes';

/**
 * PowerUp entity class representing collectible power-ups in the game
 * Spawns randomly and provides temporary abilities when collected
 */
export class PowerUp {
  type: PowerUpType;
  x: number;
  y: number;
  radius: number;
  rotation: number = 0;
  pulsePhase: number = 0;
  active: boolean = true;

  constructor(type: PowerUpType, x: number, y: number) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = POWER_UP_CONFIG.pickupRadius;
    this.pulsePhase = Math.random() * Math.PI * 2; // Random start phase for variety
  }

  /**
   * Updates power-up animation
   * @param _frame - Current frame number (unused)
   */
  update(_frame: number): void {
    this.rotation += POWER_UP_CONFIG.rotationSpeed;
    this.pulsePhase += POWER_UP_CONFIG.pulseSpeed;
  }

  /**
   * Checks if player is close enough to pickup the power-up
   * @param playerX - Player X position
   * @param playerY - Player Y position
   * @param playerRadius - Player radius for collision
   * @returns true if player collected the power-up
   */
  checkCollision(playerX: number, playerY: number, playerRadius: number): boolean {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + playerRadius;
  }

  /**
   * Renders the power-up with rotating icon and particle ring
   */
  draw(ctx: CanvasRenderingContext2D, _frame: number): void {
    const def = POWER_UP_DEFINITIONS[this.type];

    // Pulsing glow effect
    const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5;
    const glowIntensity = 20 + pulse * 15;

    ctx.save();

    // Draw particle ring
    for (let i = 0; i < POWER_UP_CONFIG.particleCount; i++) {
      const angle = (i / POWER_UP_CONFIG.particleCount) * Math.PI * 2 + this.rotation;
      const px = this.x + Math.cos(angle) * POWER_UP_CONFIG.particleDistance;
      const py = this.y + Math.sin(angle) * POWER_UP_CONFIG.particleDistance;
      const particleSize = 3 + pulse * 2;

      ctx.shadowBlur = glowIntensity * 0.5;
      ctx.shadowColor = def.glowColor;
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(px, py, particleSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw center glow
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = def.glowColor;

    // Draw hexagonal base
    ctx.fillStyle = def.color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + this.rotation * 0.5;
      const px = this.x + Math.cos(angle) * (this.radius * 0.6);
      const py = this.y + Math.sin(angle) * (this.radius * 0.6);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Draw icon (emoji)
    ctx.shadowBlur = 0;
    ctx.font = `${this.radius * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.sin(this.rotation * 2) * 0.2); // Slight wobble
    ctx.fillText(def.icon, 0, 0);
    ctx.restore();

    ctx.restore();
  }
}
