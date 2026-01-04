// Game Configuration - centralized constants for easy tuning
export const CONFIG = {
    worldSize: 4000,
    colors: {
        bg: '#050510',
        player: '#00ffcc',
        playerOutline: '#00ccaa',
        playerGlow: 'rgba(0, 255, 204, 0.4)',
        food: '#ffff00',
        prey: '#44ff44',
        predator: '#ff4444',
        ink: '#00ffcc',
        combo: '#ffcc00'
    },
    player: {
        startRadius: 15,
        baseSpeed: 5,
        dashSpeed: 12,
        maxInk: 100,
        inkCost: 2.0,
        inkRegen: 0.4,
        glowPulseSpeed: 0.05,
        glowMinAlpha: 0.2,
        glowMaxAlpha: 0.6
    },
    spawn: {
        maxFood: 200,
        maxEnemies: 30,
        minSpawnDistance: 800
    },
    stars: {
        count: 300,
        layers: 3,
        parallaxFactors: [0.2, 0.5, 0.8] as readonly number[]
    },
    combo: {
        windowMs: 1500,
        maxMultiplier: 5,
        inkBonus: 10
    },
    shake: {
        eatIntensity: 3,
        hitIntensity: 8,
        decay: 0.9
    },
    keyboard: {
        moveSpeed: 8
    },
    audio: {
        enabled: true,
        masterVolume: 0.3
    }
} as const;

export interface Level {
    size: number;
    title: string;
}

export const LEVELS: readonly Level[] = [
    { size: 0, title: "Larva" },
    { size: 30, title: "Scavenger" },
    { size: 60, title: "Hunter" },
    { size: 100, title: "Apex Predator" },
    { size: 150, title: "Leviathan" },
    { size: 220, title: "KRAKEN" },
    { size: 350, title: "COSMIC HORROR" }
] as const;

export type EntityType = 'food' | 'prey' | 'predator';
