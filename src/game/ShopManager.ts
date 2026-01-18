/**
 * Shop manager for persistent player progress and upgrades
 */

import type { PlayerProgress, ShopItem } from './ShopTypes';
import { SHOP_ITEMS, getUpgradeCost } from './ShopTypes';

const STORAGE_KEY = 'abyssal-hunter-progress';

/**
 * Default player progress
 */
const DEFAULT_PROGRESS: PlayerProgress = {
  coins: 0,
  upgrades: {},
  totalCoinsEarned: 0,
  gamesPlayed: 0,
};

/**
 * Shop manager class for handling persistent upgrades
 */
export class ShopManager {
  private progress: PlayerProgress;

  constructor() {
    this.progress = this.loadProgress();
  }

  /**
   * Load progress from localStorage
   */
  private loadProgress(): PlayerProgress {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure all fields exist
        return {
          ...DEFAULT_PROGRESS,
          ...parsed,
          upgrades: parsed.upgrades || {},
        };
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
    return { ...DEFAULT_PROGRESS };
  }

  /**
   * Save progress to localStorage
   */
  private saveProgress(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  /**
   * Get current player progress
   */
  getProgress(): PlayerProgress {
    return { ...this.progress };
  }

  /**
   * Get current level of an upgrade
   */
  getUpgradeLevel(itemId: string): number {
    return this.progress.upgrades[itemId] || 0;
  }

  /**
   * Get current coin count
   */
  getCoins(): number {
    return this.progress.coins;
  }

  /**
   * Add coins to player's balance
   */
  addCoins(amount: number): void {
    this.progress.coins += amount;
    this.progress.totalCoinsEarned += amount;
    this.saveProgress();
  }

  /**
   * Try to purchase an upgrade
   * @returns true if purchase successful, false if not enough coins or max level
   */
  purchaseUpgrade(itemId: string): boolean {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;

    const currentLevel = this.getUpgradeLevel(itemId);
    if (currentLevel >= item.maxLevel) return false;

    const cost = getUpgradeCost(item, currentLevel);
    if (this.progress.coins < cost) return false;

    // Purchase successful
    this.progress.coins -= cost;
    this.progress.upgrades[itemId] = currentLevel + 1;
    this.saveProgress();
    return true;
  }

  /**
   * Record a game completion
   */
  recordGame(): void {
    this.progress.gamesPlayed++;
    this.saveProgress();
  }

  /**
   * Get all shop items with their current levels and costs
   */
  getShopItems(): Array<ShopItem & { currentLevel: number; nextCost: number; maxed: boolean }> {
    return SHOP_ITEMS.map(item => {
      const currentLevel = this.getUpgradeLevel(item.id);
      const maxed = currentLevel >= item.maxLevel;
      return {
        ...item,
        currentLevel,
        nextCost: maxed ? 0 : getUpgradeCost(item, currentLevel),
        maxed,
      };
    });
  }

  /**
   * Reset all progress (for debugging/testing)
   */
  resetProgress(): void {
    this.progress = { ...DEFAULT_PROGRESS };
    this.saveProgress();
  }

  /**
   * Get upgrade multipliers for game engine to use
   */
  getUpgradeMultipliers(): {
    speed: number;
    dashCooldown: number;
    xp: number;
    startSize: number;
    vision: number;
  } {
    const speedLevel = this.getUpgradeLevel('speed');
    const dashLevel = this.getUpgradeLevel('dash_cooldown');
    const xpLevel = this.getUpgradeLevel('xp_boost');
    const sizeLevel = this.getUpgradeLevel('start_size');
    const visionLevel = this.getUpgradeLevel('vision');

    return {
      speed: 1 + speedLevel * 0.1, // +10% per level
      dashCooldown: 1 - dashLevel * 0.15, // -15% per level
      xp: 1 + xpLevel * 0.2, // +20% per level
      startSize: 1 + sizeLevel * 0.15, // +15% per level
      vision: 1 + visionLevel * 0.2, // +20% per level
    };
  }
}

// Export singleton instance
export const shopManager = new ShopManager();
