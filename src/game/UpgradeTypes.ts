/**
 * Ability upgrade system for permanent stat improvements
 */

export type UpgradeCategory = 'movement' | 'combat' | 'survival' | 'utility';

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  maxLevel: number;
  cost: (level: number) => number; // XP cost for next level
  effect: {
    stat: string;
    value: number; // Value per level
  };
}

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  // Movement upgrades
  {
    id: 'speed',
    name: 'Swift Current',
    description: 'Increase base movement speed',
    category: 'movement',
    maxLevel: 5,
    cost: level => 100 * Math.pow(1.5, level),
    effect: { stat: 'baseSpeed', value: 0.2 },
  },
  {
    id: 'dashEfficiency',
    name: 'Ink Conservation',
    description: 'Reduce ink cost for dashing',
    category: 'movement',
    maxLevel: 5,
    cost: level => 120 * Math.pow(1.5, level),
    effect: { stat: 'dashInkCost', value: -0.05 },
  },
  {
    id: 'inkRegen',
    name: 'Rapid Recovery',
    description: 'Increase ink regeneration rate',
    category: 'movement',
    maxLevel: 5,
    cost: level => 150 * Math.pow(1.5, level),
    effect: { stat: 'inkRegen', value: 0.1 },
  },

  // Combat upgrades
  {
    id: 'projectileDamage',
    name: 'Piercing Shot',
    description: 'Increase projectile damage',
    category: 'combat',
    maxLevel: 5,
    cost: level => 200 * Math.pow(1.6, level),
    effect: { stat: 'projectileDamage', value: 0.25 },
  },
  {
    id: 'projectileSpeed',
    name: 'Rapid Fire',
    description: 'Increase projectile speed',
    category: 'combat',
    maxLevel: 3,
    cost: level => 180 * Math.pow(1.5, level),
    effect: { stat: 'projectileSpeed', value: 1.5 },
  },
  {
    id: 'chargeSpeed',
    name: 'Quick Charge',
    description: 'Faster projectile charging',
    category: 'combat',
    maxLevel: 3,
    cost: level => 220 * Math.pow(1.6, level),
    effect: { stat: 'chargeSpeed', value: 0.15 },
  },

  // Survival upgrades
  {
    id: 'maxHealth',
    name: 'Resilient Shell',
    description: 'Increase maximum health',
    category: 'survival',
    maxLevel: 5,
    cost: level => 250 * Math.pow(1.7, level),
    effect: { stat: 'maxHealth', value: 1 },
  },
  {
    id: 'sizeGrowth',
    name: 'Rapid Growth',
    description: 'Grow faster from eating',
    category: 'survival',
    maxLevel: 3,
    cost: level => 180 * Math.pow(1.5, level),
    effect: { stat: 'growthRate', value: 0.15 },
  },
  {
    id: 'foodAttraction',
    name: "Hunter's Instinct",
    description: 'Food spawns closer to you',
    category: 'survival',
    maxLevel: 3,
    cost: level => 160 * Math.pow(1.5, level),
    effect: { stat: 'foodAttraction', value: 50 },
  },

  // Utility upgrades
  {
    id: 'powerUpDuration',
    name: 'Lasting Effects',
    description: 'Power-ups last longer',
    category: 'utility',
    maxLevel: 5,
    cost: level => 200 * Math.pow(1.6, level),
    effect: { stat: 'powerUpDuration', value: 2000 },
  },
  {
    id: 'powerUpSpawn',
    name: "Fortune's Favor",
    description: 'Power-ups spawn more frequently',
    category: 'utility',
    maxLevel: 3,
    cost: level => 300 * Math.pow(1.8, level),
    effect: { stat: 'powerUpSpawnRate', value: -2000 },
  },
  {
    id: 'xpMultiplier',
    name: 'Fast Learner',
    description: 'Gain more XP from all sources',
    category: 'utility',
    maxLevel: 5,
    cost: level => 400 * Math.pow(2, level),
    effect: { stat: 'xpMultiplier', value: 0.1 },
  },
];

export interface PlayerUpgrades {
  [upgradeId: string]: number; // upgrade level
}

export function calculateUpgradeBonus(upgrades: PlayerUpgrades, stat: string): number {
  let bonus = 0;
  for (const upgrade of UPGRADE_DEFINITIONS) {
    const level = upgrades[upgrade.id] || 0;
    if (level > 0 && upgrade.effect.stat === stat) {
      bonus += upgrade.effect.value * level;
    }
  }
  return bonus;
}

export function getNextUpgradeCost(upgradeId: string, currentLevel: number): number {
  const upgrade = UPGRADE_DEFINITIONS.find(u => u.id === upgradeId);
  if (!upgrade || currentLevel >= upgrade.maxLevel) return Infinity;
  return upgrade.cost(currentLevel);
}

export function canAffordUpgrade(
  upgradeId: string,
  currentLevel: number,
  availableXP: number
): boolean {
  const cost = getNextUpgradeCost(upgradeId, currentLevel);
  return cost !== Infinity && availableXP >= cost;
}
