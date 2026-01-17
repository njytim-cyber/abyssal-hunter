// Game Configuration - centralized constants for easy tuning
export const CONFIG = {
  worldSize: 4000,
  colors: {
    bg: '#050510',
    bgDeep: '#0a0520',
    bgShallow: '#050515',
    player: '#00ffcc',
    playerOutline: '#00ccaa',
    playerGlow: 'rgba(0, 255, 204, 0.4)',
    food: '#ffff00',
    foodGlow: 'rgba(255, 255, 0, 0.3)',
    prey: '#44ff44',
    preyGlow: 'rgba(68, 255, 68, 0.3)',
    predator: '#ff4444',
    predatorGlow: 'rgba(255, 68, 68, 0.5)',
    ink: '#00ffcc',
    combo: '#ffcc00',
  },
  player: {
    startRadius: 15,
    baseSpeed: 5.5, // Slightly faster for better feel
    dashSpeed: 13, // More impactful dash
    maxInk: 100,
    inkCost: 1.8, // Slightly cheaper dash
    inkRegen: 0.45, // Faster regen for more dashing
    glowPulseSpeed: 0.05,
    glowMinAlpha: 0.2,
    glowMaxAlpha: 0.6,
  },
  spawn: {
    maxFood: 200,
    maxEnemies: 30,
    minSpawnDistance: 800,
  },
  stars: {
    count: 300,
    layers: 3,
    parallaxFactors: [0.2, 0.5, 0.8] as readonly number[],
  },
  combo: {
    windowMs: 1800, // Slightly longer window for easier combos
    maxMultiplier: 8, // Higher max for more exciting gameplay
    inkBonus: 12, // Better ink recovery on combo
  },
  shake: {
    eatIntensity: 3,
    hitIntensity: 8,
    decay: 0.9,
  },
  keyboard: {
    moveSpeed: 8,
  },
  audio: {
    enabled: true,
    masterVolume: 0.3,
  },
} as const;

export interface Level {
  threshold: number;
  rank: string;
}

export const LEVELS: readonly Level[] = [
  { threshold: 0, rank: 'Larva' },
  { threshold: 30, rank: 'Scavenger' },
  { threshold: 60, rank: 'Hunter' },
  { threshold: 100, rank: 'Apex Predator' },
  { threshold: 150, rank: 'Leviathan' },
  { threshold: 220, rank: 'KRAKEN' },
  { threshold: 350, rank: 'COSMIC HORROR' },
] as const;

export type EntityType = 'food' | 'prey' | 'predator';
