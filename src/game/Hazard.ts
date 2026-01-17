/**
 * Environmental hazards that add gameplay variety
 */

export type HazardType = 'vent' | 'toxicCloud' | 'current' | 'obstacle' | 'lava' | 'coral';

export interface HazardDefinition {
  type: HazardType;
  name: string;
  damage: number;
  radius: number;
  duration: number; // -1 for permanent
  color: string;
}

export class Hazard {
  type: HazardType;
  x: number;
  y: number;
  radius: number;
  damage: number;
  age: number = 0;
  duration: number;
  active: boolean = true;
  color: string;

  // Type-specific properties
  angle: number = Math.random() * Math.PI * 2;
  pulsePhase: number = Math.random() * Math.PI * 2;

  // For currents
  forceX: number = 0;
  forceY: number = 0;

  constructor(type: HazardType, x: number, y: number, definition: HazardDefinition) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = definition.radius;
    this.damage = definition.damage;
    this.duration = definition.duration;
    this.color = definition.color;

    // Initialize type-specific properties
    if (type === 'current') {
      const angle = Math.random() * Math.PI * 2;
      this.forceX = Math.cos(angle) * 2;
      this.forceY = Math.sin(angle) * 2;
    }
  }

  update(): void {
    if (this.duration > 0) {
      this.age++;
      if (this.age >= this.duration) {
        this.active = false;
      }
    }

    this.pulsePhase += 0.05;
  }

  draw(ctx: CanvasRenderingContext2D, frame: number): void {
    if (!this.active) return;

    ctx.save();

    switch (this.type) {
      case 'vent':
        this.drawVent(ctx, frame);
        break;
      case 'toxicCloud':
        this.drawToxicCloud(ctx, frame);
        break;
      case 'current':
        this.drawCurrent(ctx, frame);
        break;
      case 'obstacle':
        this.drawObstacle(ctx);
        break;
      case 'lava':
        this.drawLava(ctx, frame);
        break;
      case 'coral':
        this.drawCoral(ctx);
        break;
    }

    ctx.restore();
  }

  private drawVent(ctx: CanvasRenderingContext2D, frame: number): void {
    // Volcanic vent shooting particles upward
    const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5;

    // Base
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Eruption particles
    for (let i = 0; i < 10; i++) {
      const particlePhase = (frame + i * 10) % 60;
      const height = (particlePhase / 60) * this.radius * 3;
      const spread = Math.sin((particlePhase / 60) * Math.PI) * this.radius * 0.5;

      ctx.fillStyle = `rgba(255, ${100 - height / 2}, 0, ${1 - particlePhase / 60})`;
      ctx.beginPath();
      ctx.arc(
        this.x + spread * Math.cos(i),
        this.y - height,
        this.radius * 0.1 * (1 - particlePhase / 60),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Danger zone indicator
    ctx.strokeStyle = `rgba(255, 100, 0, ${0.3 + pulse * 0.3})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawToxicCloud(ctx: CanvasRenderingContext2D, _frame: number): void {
    // Pulsing toxic cloud
    const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8;
    const fadeOut = this.duration > 0 ? 1 - this.age / this.duration : 1;

    // Multiple layers for depth
    for (let i = 0; i < 3; i++) {
      const layerRadius = this.radius * (0.6 + i * 0.2) * pulse;
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, layerRadius);
      gradient.addColorStop(0, `rgba(100, 255, 100, ${0.4 * fadeOut})`);
      gradient.addColorStop(0.5, `rgba(50, 200, 50, ${0.2 * fadeOut})`);
      gradient.addColorStop(1, 'rgba(50, 200, 50, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, layerRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bubbles
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + this.pulsePhase;
      const distance = this.radius * 0.5;
      const bx = this.x + Math.cos(angle) * distance;
      const by = this.y + Math.sin(angle) * distance;

      ctx.fillStyle = `rgba(150, 255, 150, ${0.5 * fadeOut})`;
      ctx.beginPath();
      ctx.arc(bx, by, this.radius * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawCurrent(ctx: CanvasRenderingContext2D, frame: number): void {
    // Water current with flowing arrows
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    gradient.addColorStop(0, 'rgba(100, 150, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Flow lines
    const flowAngle = Math.atan2(this.forceY, this.forceX);
    const flowSpeed = Math.sqrt(this.forceX * this.forceX + this.forceY * this.forceY);

    ctx.strokeStyle = 'rgba(150, 200, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (let i = 0; i < 5; i++) {
      const offset = ((frame * flowSpeed + i * 20) % 100) - 50;
      const startX = this.x + Math.cos(flowAngle) * offset;
      const startY = this.y + Math.sin(flowAngle) * offset;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + Math.cos(flowAngle) * 20, startY + Math.sin(flowAngle) * 20);
      ctx.stroke();

      // Arrowhead
      const arrowSize = 8;
      const arrowAngle = Math.PI / 6;
      const endX = startX + Math.cos(flowAngle) * 20;
      const endY = startY + Math.sin(flowAngle) * 20;

      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - Math.cos(flowAngle - arrowAngle) * arrowSize,
        endY - Math.sin(flowAngle - arrowAngle) * arrowSize
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - Math.cos(flowAngle + arrowAngle) * arrowSize,
        endY - Math.sin(flowAngle + arrowAngle) * arrowSize
      );
      ctx.stroke();
    }
  }

  private drawObstacle(ctx: CanvasRenderingContext2D): void {
    // Solid rock obstacle
    ctx.fillStyle = '#4a4a4a';
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 2;

    // Irregular shape
    ctx.beginPath();
    const points = 8;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const variance = 0.8 + Math.sin(i * 2.5) * 0.2;
      const px = this.x + Math.cos(angle) * this.radius * variance;
      const py = this.y + Math.sin(angle) * this.radius * variance;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Barnacles
    ctx.fillStyle = '#666666';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + this.angle;
      const bx = this.x + Math.cos(angle) * this.radius * 0.7;
      const by = this.y + Math.sin(angle) * this.radius * 0.7;
      ctx.beginPath();
      ctx.arc(bx, by, this.radius * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawLava(ctx: CanvasRenderingContext2D, frame: number): void {
    // Lava pool
    const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;

    // Glow
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    gradient.addColorStop(0, `rgba(255, 100, 0, ${0.8 * pulse})`);
    gradient.addColorStop(0.5, `rgba(255, 50, 0, ${0.4 * pulse})`);
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Lava surface
    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Bubbles
    const bubbleCount = 3;
    for (let i = 0; i < bubbleCount; i++) {
      const bubblePhase = (frame + i * 20) % 60;
      const bubbleSize = (bubblePhase / 60) * this.radius * 0.3;
      const angle = (i / bubbleCount) * Math.PI * 2;
      const bx = this.x + Math.cos(angle) * this.radius * 0.5;
      const by = this.y + Math.sin(angle) * this.radius * 0.5;

      ctx.fillStyle = `rgba(255, 200, 0, ${1 - bubblePhase / 60})`;
      ctx.beginPath();
      ctx.arc(bx, by, bubbleSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawCoral(ctx: CanvasRenderingContext2D): void {
    // Coral reef obstacle
    ctx.fillStyle = '#ff6699';
    ctx.strokeStyle = '#cc3366';
    ctx.lineWidth = 2;

    // Branching structure
    ctx.save();
    ctx.translate(this.x, this.y);

    // Main body
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Branches
    const branchCount = 6;
    for (let i = 0; i < branchCount; i++) {
      const angle = (i / branchCount) * Math.PI * 2;
      const length = this.radius * 0.8;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
      ctx.lineWidth = this.radius * 0.15;
      ctx.stroke();

      // Branch tip
      ctx.fillStyle = '#ffaacc';
      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * length,
        Math.sin(angle) * length,
        this.radius * 0.2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.restore();
  }

  checkCollision(x: number, y: number, radius: number): boolean {
    if (!this.active) return false;
    const dx = this.x - x;
    const dy = this.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + radius;
  }

  applyEffect(playerX: number, playerY: number): { dx: number; dy: number; damage: number } {
    let dx = 0;
    let dy = 0;
    let damage = 0;

    if (this.checkCollision(playerX, playerY, 0)) {
      if (this.type === 'current') {
        dx = this.forceX;
        dy = this.forceY;
      } else {
        damage = this.damage;
      }
    }

    return { dx, dy, damage };
  }
}

export const HAZARD_DEFINITIONS: Record<HazardType, HazardDefinition> = {
  vent: {
    type: 'vent',
    name: 'Volcanic Vent',
    damage: 2,
    radius: 60,
    duration: -1,
    color: '#ff6600',
  },
  toxicCloud: {
    type: 'toxicCloud',
    name: 'Toxic Cloud',
    damage: 1,
    radius: 80,
    duration: 300, // 5 seconds at 60fps
    color: '#64ff64',
  },
  current: {
    type: 'current',
    name: 'Strong Current',
    damage: 0,
    radius: 100,
    duration: -1,
    color: '#6496ff',
  },
  obstacle: {
    type: 'obstacle',
    name: 'Rock Formation',
    damage: 0,
    radius: 50,
    duration: -1,
    color: '#4a4a4a',
  },
  lava: {
    type: 'lava',
    name: 'Lava Pool',
    damage: 5,
    radius: 70,
    duration: -1,
    color: '#ff3300',
  },
  coral: {
    type: 'coral',
    name: 'Sharp Coral',
    damage: 1,
    radius: 40,
    duration: -1,
    color: '#ff6699',
  },
};
