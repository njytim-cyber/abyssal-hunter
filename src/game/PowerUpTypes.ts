/**
 * Power-Up Type Definitions
 * Defines all available power-up types and their properties
 */

export type PowerUpType = 'speedBoost' | 'shield' | 'sizeIncrease' | 'magnet' | 'multiDash';

export interface PowerUpDefinition {
  type: PowerUpType;
  name: string;
  description: string;
  duration: number; // Duration in milliseconds
  color: string;
  glowColor: string;
  icon: string; // Emoji or symbol for visual representation
}

export const POWER_UP_DEFINITIONS: Record<PowerUpType, PowerUpDefinition> = {
  speedBoost: {
    type: 'speedBoost',
    name: 'Speed Boost',
    description: 'Increases movement speed by 50%',
    duration: 10000, // 10 seconds
    color: '#00ccff',
    glowColor: 'rgba(0, 204, 255, 0.6)',
    icon: '⚡',
  },
  shield: {
    type: 'shield',
    name: 'Shield',
    description: 'Protects from one predator hit',
    duration: 15000, // 15 seconds
    color: '#ffaa00',
    glowColor: 'rgba(255, 170, 0, 0.6)',
    icon: '🛡',
  },
  sizeIncrease: {
    type: 'sizeIncrease',
    name: 'Size Boost',
    description: 'Temporarily grow larger',
    duration: 12000, // 12 seconds
    color: '#ff66ff',
    glowColor: 'rgba(255, 102, 255, 0.6)',
    icon: '⬆',
  },
  magnet: {
    type: 'magnet',
    name: 'Magnet',
    description: 'Automatically attracts nearby food',
    duration: 15000, // 15 seconds
    color: '#ff3366',
    glowColor: 'rgba(255, 51, 102, 0.6)',
    icon: '🧲',
  },
  multiDash: {
    type: 'multiDash',
    name: 'Multi-Dash',
    description: 'Dash uses 50% less ink',
    duration: 10000, // 10 seconds
    color: '#66ff66',
    glowColor: 'rgba(102, 255, 102, 0.6)',
    icon: '💨',
  },
} as const;

/**
 * Active power-up tracking
 */
export interface ActivePowerUp {
  type: PowerUpType;
  startTime: number;
  endTime: number;
}

/**
 * Power-up configuration constants
 */
export const POWER_UP_CONFIG = {
  spawnInterval: 30000, // Spawn one every 30 seconds
  spawnChance: 0.4, // 40% chance to spawn when interval passes
  minSpawnDistance: 500, // Minimum distance from player
  maxSpawnDistance: 1500, // Maximum distance from player
  pickupRadius: 40, // Collision detection radius
  rotationSpeed: 0.02, // Visual rotation speed
  pulseSpeed: 0.05, // Glow pulse speed
  particleCount: 12, // Number of particles in ring
  particleDistance: 50, // Distance of particles from center
} as const;
