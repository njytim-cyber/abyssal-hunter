/**
 * Visual themes and unlockable skins for player customization
 */

export interface PlayerSkin {
  id: string;
  name: string;
  description: string;
  colors: {
    player: string;
    playerOutline: string;
    tentacle: string;
    glow: string;
  };
  effects?: {
    trail?: boolean;
    sparkles?: boolean;
    aura?: string;
  };
  unlockCondition: string;
  unlocked: boolean;
}

export const PLAYER_SKINS: PlayerSkin[] = [
  {
    id: 'default',
    name: 'Deep Sea',
    description: 'The classic bioluminescent look',
    colors: {
      player: '#00ccaa',
      playerOutline: '#008866',
      tentacle: '#00aa88',
      glow: '#00ffcc',
    },
    unlockCondition: 'Default',
    unlocked: true,
  },
  {
    id: 'crimson',
    name: 'Crimson Depths',
    description: 'A fierce red coloration',
    colors: {
      player: '#cc0044',
      playerOutline: '#880022',
      tentacle: '#aa0033',
      glow: '#ff0066',
    },
    unlockCondition: 'Defeat 100 enemies',
    unlocked: false,
  },
  {
    id: 'electric',
    name: 'Electric Eel',
    description: 'Crackling with electric energy',
    colors: {
      player: '#00aaff',
      playerOutline: '#0066cc',
      tentacle: '#0088dd',
      glow: '#00ddff',
    },
    effects: {
      sparkles: true,
    },
    unlockCondition: 'Collect 100 power-ups',
    unlocked: false,
  },
  {
    id: 'toxic',
    name: 'Toxic Waste',
    description: 'Glowing with radioactive energy',
    colors: {
      player: '#66ff33',
      playerOutline: '#44cc11',
      tentacle: '#55dd22',
      glow: '#88ff44',
    },
    effects: {
      aura: 'toxic',
    },
    unlockCondition: 'Survive 50 hazards',
    unlocked: false,
  },
  {
    id: 'shadow',
    name: 'Shadow Lurker',
    description: 'Nearly invisible in the dark',
    colors: {
      player: '#2a2a3a',
      playerOutline: '#1a1a2a',
      tentacle: '#222232',
      glow: '#4444aa',
    },
    effects: {
      trail: true,
    },
    unlockCondition: 'Explore Abyssal Trench for 5 minutes',
    unlocked: false,
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    description: 'Fit for the king of the ocean',
    colors: {
      player: '#8833cc',
      playerOutline: '#6622aa',
      tentacle: '#7722bb',
      glow: '#aa55ff',
    },
    unlockCondition: 'Reach score of 50,000',
    unlocked: false,
  },
  {
    id: 'arctic',
    name: 'Arctic Ice',
    description: 'Cool as ice',
    colors: {
      player: '#aaeeff',
      playerOutline: '#88ccdd',
      tentacle: '#99ddee',
      glow: '#ccffff',
    },
    effects: {
      sparkles: true,
      trail: true,
    },
    unlockCondition: 'Visit all 5 biomes',
    unlocked: false,
  },
  {
    id: 'volcanic',
    name: 'Volcanic Fury',
    description: 'Burning with inner fire',
    colors: {
      player: '#ff6600',
      playerOutline: '#cc4400',
      tentacle: '#dd5500',
      glow: '#ff8800',
    },
    effects: {
      aura: 'fire',
    },
    unlockCondition: 'Defeat a boss in Volcanic Vents',
    unlocked: false,
  },
  {
    id: 'cosmic',
    name: 'Cosmic Entity',
    description: 'From beyond the stars',
    colors: {
      player: '#6644cc',
      playerOutline: '#4422aa',
      tentacle: '#5533bb',
      glow: '#8866ff',
    },
    effects: {
      sparkles: true,
      aura: 'stars',
    },
    unlockCondition: 'Survive 20 minutes',
    unlocked: false,
  },
  {
    id: 'golden',
    name: 'Golden Legend',
    description: 'The mark of true mastery',
    colors: {
      player: '#ffcc00',
      playerOutline: '#ccaa00',
      tentacle: '#ddbb00',
      glow: '#ffdd44',
    },
    effects: {
      sparkles: true,
      trail: true,
      aura: 'golden',
    },
    unlockCondition: 'Find the Lucky Seven achievement',
    unlocked: false,
  },
  {
    id: 'master',
    name: 'Master of the Abyss',
    description: 'Ultimate power incarnate',
    colors: {
      player: '#ff00ff',
      playerOutline: '#cc00cc',
      tentacle: '#dd00dd',
      glow: '#ff44ff',
    },
    effects: {
      sparkles: true,
      trail: true,
      aura: 'rainbow',
    },
    unlockCondition: 'Unlock all achievements',
    unlocked: false,
  },
];

export class SkinSystem {
  private skins: PlayerSkin[];
  private activeSkin: PlayerSkin;

  constructor(unlockedSkinIds: string[], selectedSkinId: string = 'default') {
    this.skins = PLAYER_SKINS.map(skin => ({
      ...skin,
      unlocked: unlockedSkinIds.includes(skin.id),
    }));

    const selected = this.skins.find(s => s.id === selectedSkinId);
    this.activeSkin = selected || this.skins[0];
  }

  getActiveSkin(): PlayerSkin {
    return this.activeSkin;
  }

  getAllSkins(): PlayerSkin[] {
    return this.skins;
  }

  getUnlockedSkins(): PlayerSkin[] {
    return this.skins.filter(s => s.unlocked);
  }

  getLockedSkins(): PlayerSkin[] {
    return this.skins.filter(s => !s.unlocked);
  }

  selectSkin(skinId: string): boolean {
    const skin = this.skins.find(s => s.id === skinId);
    if (skin && skin.unlocked) {
      this.activeSkin = skin;
      return true;
    }
    return false;
  }

  unlockSkin(skinId: string): boolean {
    const skin = this.skins.find(s => s.id === skinId);
    if (skin && !skin.unlocked) {
      skin.unlocked = true;
      return true;
    }
    return false;
  }

  drawSkinEffects(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number,
    playerRadius: number,
    frame: number
  ): void {
    if (!this.activeSkin.effects) return;

    ctx.save();

    // Trail effect
    if (this.activeSkin.effects.trail) {
      const trailLength = 5;
      for (let i = 0; i < trailLength; i++) {
        const alpha = (1 - i / trailLength) * 0.3;
        const offset = i * 5;
        ctx.fillStyle = this.activeSkin.colors.glow
          .replace(')', `, ${alpha})`)
          .replace('rgb', 'rgba');
        ctx.beginPath();
        ctx.arc(
          playerX - offset,
          playerY,
          playerRadius * (1 - (i / trailLength) * 0.3),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // Sparkles effect
    if (this.activeSkin.effects.sparkles) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + frame * 0.02;
        const distance = playerRadius * 1.5 + Math.sin(frame * 0.05 + i) * playerRadius * 0.3;
        const sx = playerX + Math.cos(angle) * distance;
        const sy = playerY + Math.sin(angle) * distance;
        const sparkleAlpha = Math.sin(frame * 0.1 + i) * 0.5 + 0.5;

        ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Aura effects
    if (this.activeSkin.effects.aura) {
      this.drawAura(ctx, playerX, playerY, playerRadius, frame);
    }

    ctx.restore();
  }

  private drawAura(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    frame: number
  ): void {
    const auraType = this.activeSkin.effects?.aura;
    if (!auraType) return;

    const pulse = Math.sin(frame * 0.05) * 0.2 + 0.8;

    switch (auraType) {
      case 'toxic':
        // Green bubbles floating up
        for (let i = 0; i < 5; i++) {
          const bubblePhase = (frame + i * 20) % 120;
          const bubbleY = y - (bubblePhase / 120) * radius * 3;
          const bubbleX = x + Math.sin(bubblePhase * 0.05 + i) * radius * 0.5;
          const bubbleAlpha = 1 - bubblePhase / 120;

          ctx.fillStyle = `rgba(102, 255, 51, ${bubbleAlpha * 0.5})`;
          ctx.beginPath();
          ctx.arc(bubbleX, bubbleY, radius * 0.15, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'fire':
        // Flame particles
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + frame * 0.03;
          const distance = radius * (1.2 + Math.sin(frame * 0.1 + i) * 0.3);
          const fx = x + Math.cos(angle) * distance;
          const fy = y + Math.sin(angle) * distance;

          const gradient = ctx.createRadialGradient(fx, fy, 0, fx, fy, radius * 0.3);
          gradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
          gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.4)');
          gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(fx, fy, radius * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'stars':
        // Twinkling stars
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const distance = radius * 2;
          const twinkle = Math.sin(frame * 0.1 + i * 0.5) * 0.5 + 0.5;
          const sx = x + Math.cos(angle) * distance;
          const sy = y + Math.sin(angle) * distance;

          ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
          this.drawStar(ctx, sx, sy, radius * 0.15, 4);
        }
        break;

      case 'golden': {
        // Golden shimmer
        const shimmerGradient = ctx.createRadialGradient(x, y, radius, x, y, radius * 2 * pulse);
        shimmerGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        shimmerGradient.addColorStop(0.5, 'rgba(255, 223, 0, 0.15)');
        shimmerGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

        ctx.fillStyle = shimmerGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2 * pulse, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'rainbow':
        // Rainbow aura rings
        for (let i = 0; i < 6; i++) {
          const hue = (frame * 2 + i * 60) % 360;
          const ringRadius = radius * (1.5 + i * 0.2) * pulse;
          const alpha = 0.2 - i * 0.03;

          ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
    }
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    points: number
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const radius = i % 2 === 0 ? size : size / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
