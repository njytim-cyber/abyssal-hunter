/**
 * Shop system types and item definitions
 */

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  effect: ShopItemEffect;
  icon: string;
}

export interface ShopItemEffect {
  type: 'speed' | 'dash' | 'xp' | 'size' | 'vision';
  value: number; // Multiplier or bonus value per level
}

export interface PlayerProgress {
  coins: number;
  upgrades: Record<string, number>; // itemId -> current level
  totalCoinsEarned: number;
  gamesPlayed: number;
}

/**
 * All available shop items
 */
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'speed',
    name: 'Swift Current',
    description: 'Increase your movement speed',
    cost: 100,
    maxLevel: 5,
    effect: { type: 'speed', value: 0.1 }, // +10% per level
    icon: '🌊',
  },
  {
    id: 'dash_cooldown',
    name: 'Rapid Dash',
    description: 'Reduce dash cooldown time',
    cost: 150,
    maxLevel: 5,
    effect: { type: 'dash', value: 0.15 }, // -15% cooldown per level
    icon: '⚡',
  },
  {
    id: 'xp_boost',
    name: 'Abyssal Knowledge',
    description: 'Gain more XP from eating',
    cost: 200,
    maxLevel: 5,
    effect: { type: 'xp', value: 0.2 }, // +20% XP per level
    icon: '📚',
  },
  {
    id: 'start_size',
    name: 'Born Larger',
    description: 'Start each run with more mass',
    cost: 250,
    maxLevel: 3,
    effect: { type: 'size', value: 0.15 }, // +15% starting size per level
    icon: '🐋',
  },
  {
    id: 'vision',
    name: 'Deep Sight',
    description: 'Increase your view distance',
    cost: 300,
    maxLevel: 3,
    effect: { type: 'vision', value: 0.2 }, // +20% camera zoom per level
    icon: '👁️',
  },
];

/**
 * Calculate total cost to upgrade an item from current level to next level
 */
export function getUpgradeCost(item: ShopItem, currentLevel: number): number {
  if (currentLevel >= item.maxLevel) return 0;
  // Cost increases exponentially with level
  return Math.floor(item.cost * Math.pow(1.5, currentLevel));
}

/**
 * Get the total effect value for an item at a given level
 */
export function getItemEffectValue(item: ShopItem, level: number): number {
  return item.effect.value * level;
}
