/**
 * Boss encounter system with unique mechanics
 */

export type BossType = 'leviathan' | 'kraken' | 'megalodon';

export interface BossAbility {
  name: string;
  cooldown: number;
  lastUsed: number;
  execute: (boss: Boss, playerX: number, playerY: number) => void;
}

export interface BossDefinition {
  type: BossType;
  name: string;
  baseHealth: number;
  baseRadius: number;
  baseSpeed: number;
  color: string;
  abilities: BossAbility[];
  spawnMinutes: number; // Spawn after X minutes
}

export class Boss {
  type: BossType;
  name: string;
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  speed: number;
  angle: number = 0;
  color: string;
  abilities: BossAbility[];
  phase: number = 1; // Boss phases (1-3)
  enraged: boolean = false;
  lastAbilityTime: number = 0;
  active: boolean = true;

  // Boss-specific state
  attackCooldown: number = 0;
  specialState: Map<string, unknown> = new Map();

  constructor(definition: BossDefinition, worldSize: number) {
    this.type = definition.type;
    this.name = definition.name;
    this.radius = definition.baseRadius;
    this.maxHealth = definition.baseHealth;
    this.health = this.maxHealth;
    this.speed = definition.baseSpeed;
    this.color = definition.color;
    this.abilities = definition.abilities;

    // Spawn at random edge
    const edge = Math.floor(Math.random() * 4);
    const padding = this.radius * 2;
    switch (edge) {
      case 0: // Top
        this.x = Math.random() * worldSize;
        this.y = padding;
        break;
      case 1: // Right
        this.x = worldSize - padding;
        this.y = Math.random() * worldSize;
        break;
      case 2: // Bottom
        this.x = Math.random() * worldSize;
        this.y = worldSize - padding;
        break;
      default: // Left
        this.x = padding;
        this.y = Math.random() * worldSize;
    }
  }

  update(playerX: number, playerY: number, _frame: number): void {
    if (!this.active) return;

    // Update phase based on health
    if (this.health / this.maxHealth < 0.33) {
      this.phase = 3;
      this.enraged = true;
    } else if (this.health / this.maxHealth < 0.66) {
      this.phase = 2;
    }

    // Move towards player
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      this.angle = Math.atan2(dy, dx);
      const moveSpeed = this.speed * (this.enraged ? 1.5 : 1);
      this.x += (dx / distance) * moveSpeed;
      this.y += (dy / distance) * moveSpeed;
    }

    // Use abilities
    for (const ability of this.abilities) {
      const now = Date.now();
      if (now - ability.lastUsed > ability.cooldown) {
        ability.execute(this, playerX, playerY);
        ability.lastUsed = now;
      }
    }

    if (this.attackCooldown > 0) this.attackCooldown--;
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      this.health = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D, frame: number): void {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Boss-specific rendering
    switch (this.type) {
      case 'leviathan':
        this.drawLeviathan(ctx, frame);
        break;
      case 'kraken':
        this.drawKraken(ctx, frame);
        break;
      case 'megalodon':
        this.drawMegalodon(ctx, frame);
        break;
    }

    ctx.restore();

    // Health bar
    this.drawHealthBar(ctx);

    // Boss name
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, this.x, this.y - this.radius - 40);
  }

  private drawLeviathan(ctx: CanvasRenderingContext2D, frame: number): void {
    const pulse = Math.sin(frame * 0.05) * 0.1 + 1;

    // Serpentine body
    ctx.strokeStyle = this.enraged ? '#ff0066' : this.color;
    ctx.lineWidth = this.radius * 0.8;
    ctx.lineCap = 'round';

    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const segmentX = -i * this.radius * 0.5;
      const wave = Math.sin(frame * 0.1 + i * 0.5) * this.radius * 0.3;
      if (i === 0) {
        ctx.moveTo(segmentX, wave);
      } else {
        ctx.lineTo(segmentX, wave);
      }
    }
    ctx.stroke();

    // Head
    ctx.fillStyle = this.enraged ? '#ff0066' : this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius * pulse, this.radius * 0.7 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing eyes
    ctx.fillStyle = this.enraged ? '#ffff00' : '#ff0000';
    ctx.beginPath();
    ctx.arc(this.radius * 0.4, -this.radius * 0.3, this.radius * 0.15, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.4, this.radius * 0.3, this.radius * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = this.radius * 0.1;
    ctx.beginPath();
    ctx.moveTo(this.radius * 0.2, -this.radius * 0.6);
    ctx.lineTo(this.radius * 0.5, -this.radius * 1.2);
    ctx.moveTo(this.radius * 0.2, this.radius * 0.6);
    ctx.lineTo(this.radius * 0.5, this.radius * 1.2);
    ctx.stroke();
  }

  private drawKraken(ctx: CanvasRenderingContext2D, frame: number): void {
    // Massive head
    ctx.fillStyle = this.enraged ? '#8800ff' : this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Tentacles (many!)
    ctx.strokeStyle = this.enraged ? '#8800ff' : this.color;
    ctx.lineWidth = this.radius * 0.2;
    ctx.lineCap = 'round';

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const wave = Math.sin(frame * 0.08 + i * 0.3) * this.radius * 0.4;
      const length = this.radius * (2 + Math.sin(i) * 0.5);

      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * this.radius * 0.5, Math.sin(angle) * this.radius * 0.5);
      ctx.quadraticCurveTo(
        Math.cos(angle) * length * 0.6 + wave,
        Math.sin(angle) * length * 0.6,
        Math.cos(angle) * length,
        Math.sin(angle) * length
      );
      ctx.stroke();

      // Suckers
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let j = 0; j < 5; j++) {
        const t = (j + 1) / 6;
        const sx = Math.cos(angle) * length * t;
        const sy = Math.sin(angle) * length * t;
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Beak
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(this.radius * 0.3, 0);
    ctx.lineTo(this.radius * 0.7, -this.radius * 0.2);
    ctx.lineTo(this.radius * 0.7, this.radius * 0.2);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = this.enraged ? '#ff0000' : '#ffffff';
    ctx.beginPath();
    ctx.arc(-this.radius * 0.3, -this.radius * 0.4, this.radius * 0.2, 0, Math.PI * 2);
    ctx.arc(-this.radius * 0.3, this.radius * 0.4, this.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMegalodon(ctx: CanvasRenderingContext2D, _frame: number): void {
    // Massive shark body
    ctx.fillStyle = this.enraged ? '#00aaff' : this.color;

    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius * 2, this.radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dorsal fin (iconic)
    ctx.beginPath();
    ctx.moveTo(0, -this.radius * 0.8);
    ctx.lineTo(this.radius * 0.5, -this.radius * 2);
    ctx.lineTo(this.radius * 1.2, -this.radius * 0.8);
    ctx.closePath();
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-this.radius * 1.6, 0);
    ctx.lineTo(-this.radius * 2.5, -this.radius);
    ctx.lineTo(-this.radius * 2, 0);
    ctx.lineTo(-this.radius * 2.5, this.radius * 0.7);
    ctx.closePath();
    ctx.fill();

    // Pectoral fins
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(
      this.radius * 0.5,
      this.radius * 0.6,
      this.radius * 0.8,
      this.radius * 0.4,
      Math.PI * 0.4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      this.radius * 0.5,
      -this.radius * 0.6,
      this.radius * 0.8,
      this.radius * 0.4,
      -Math.PI * 0.4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.globalAlpha = 1;

    // Massive jaws
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = this.radius * 0.15;
    ctx.beginPath();
    ctx.arc(this.radius * 1.5, 0, this.radius * 0.6, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();

    // Teeth
    for (let i = 0; i < 12; i++) {
      const ta = -Math.PI * 0.35 + (i / 11) * Math.PI * 0.7;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = this.radius * 0.08;
      ctx.beginPath();
      ctx.moveTo(
        this.radius * 1.5 + Math.cos(ta) * this.radius * 0.6,
        Math.sin(ta) * this.radius * 0.6
      );
      ctx.lineTo(
        this.radius * 1.5 + Math.cos(ta) * this.radius * 0.9,
        Math.sin(ta) * this.radius * 0.9
      );
      ctx.stroke();
    }

    // Eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(this.radius * 1.2, -this.radius * 0.4, this.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Scars (battle-worn)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = this.radius * 0.05;
    ctx.beginPath();
    ctx.moveTo(this.radius * 0.5, -this.radius * 0.3);
    ctx.lineTo(this.radius * 1, -this.radius * 0.5);
    ctx.moveTo(this.radius * 0.2, this.radius * 0.4);
    ctx.lineTo(this.radius * 0.8, this.radius * 0.3);
    ctx.stroke();
  }

  private drawHealthBar(ctx: CanvasRenderingContext2D): void {
    const barWidth = this.radius * 3;
    const barHeight = 10;
    const x = this.x - barWidth / 2;
    const y = this.y - this.radius - 20;

    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Health
    const healthPercent = this.health / this.maxHealth;
    const healthColor =
      healthPercent > 0.6 ? '#00ff00' : healthPercent > 0.3 ? '#ffaa00' : '#ff0000';
    ctx.fillStyle = healthColor;
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Phase indicators
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Phase ${this.phase}`, this.x, y - 5);
  }

  checkCollision(x: number, y: number, radius: number): boolean {
    if (!this.active) return false;
    const dx = this.x - x;
    const dy = this.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + radius;
  }
}

// Boss definitions
export const BOSS_DEFINITIONS: BossDefinition[] = [
  {
    type: 'leviathan',
    name: 'The Ancient Leviathan',
    baseHealth: 500,
    baseRadius: 80,
    baseSpeed: 1.5,
    color: '#00cc99',
    spawnMinutes: 3,
    abilities: [
      {
        name: 'Tail Sweep',
        cooldown: 5000,
        lastUsed: 0,
        execute: boss => {
          // Spawn damage wave around boss
          boss.specialState.set('tailSweep', Date.now());
        },
      },
      {
        name: 'Roar',
        cooldown: 10000,
        lastUsed: 0,
        execute: boss => {
          // Stun/push nearby entities
          boss.specialState.set('roar', Date.now());
        },
      },
    ],
  },
  {
    type: 'kraken',
    name: 'The Abyss Kraken',
    baseHealth: 750,
    baseRadius: 100,
    baseSpeed: 1.2,
    color: '#6600cc',
    spawnMinutes: 5,
    abilities: [
      {
        name: 'Tentacle Grab',
        cooldown: 4000,
        lastUsed: 0,
        execute: (boss, playerX, playerY) => {
          // Launch tentacle attack toward player
          boss.specialState.set('tentacleGrab', { x: playerX, y: playerY, time: Date.now() });
        },
      },
      {
        name: 'Ink Cloud',
        cooldown: 12000,
        lastUsed: 0,
        execute: boss => {
          // Create vision-blocking ink cloud
          boss.specialState.set('inkCloud', Date.now());
        },
      },
    ],
  },
  {
    type: 'megalodon',
    name: 'The Deep Terror',
    baseHealth: 1000,
    baseRadius: 90,
    baseSpeed: 2.0,
    color: '#003366',
    spawnMinutes: 7,
    abilities: [
      {
        name: 'Charge',
        cooldown: 8000,
        lastUsed: 0,
        execute: (boss, playerX, playerY) => {
          // Rapid charge attack
          const dx = playerX - boss.x;
          const dy = playerY - boss.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          boss.specialState.set('charging', {
            vx: (dx / distance) * 5,
            vy: (dy / distance) * 5,
            duration: 60,
          });
        },
      },
      {
        name: 'Frenzy',
        cooldown: 15000,
        lastUsed: 0,
        execute: boss => {
          // Temporary speed and damage boost
          boss.specialState.set('frenzy', { endTime: Date.now() + 5000 });
        },
      },
    ],
  },
];
