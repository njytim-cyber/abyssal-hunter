/**
 * Save system using localStorage for persistent data
 */

import type { GameStats } from './AchievementSystem';
import type { PlayerUpgrades } from './UpgradeTypes';

export interface SaveData {
  version: string;
  lastPlayed: number;
  stats: GameStats;
  upgrades: PlayerUpgrades;
  achievements: string[];
  settings: GameSettings;
  unlockedSkins: string[];
  selectedSkin: string;
  totalXP: number;
  availableXP: number;
}

export interface GameSettings {
  volume: {
    master: number;
    music: number;
    sfx: number;
  };
  graphics: {
    particles: boolean;
    screenShake: boolean;
    visualEffects: 'low' | 'medium' | 'high';
  };
  controls: {
    mouseControl: boolean;
    touchControl: boolean;
    vibration: boolean;
  };
  accessibility: {
    colorBlindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
    highContrast: boolean;
    reducedMotion: boolean;
    textSize: 'small' | 'medium' | 'large';
  };
}

const SAVE_KEY = 'abyssal-hunter-save';
const SAVE_VERSION = '1.0.0';

export class SaveSystem {
  private saveData: SaveData;

  constructor() {
    this.saveData = this.loadOrCreateSave();
  }

  private getDefaultSettings(): GameSettings {
    return {
      volume: {
        master: 0.7,
        music: 0.5,
        sfx: 0.6,
      },
      graphics: {
        particles: true,
        screenShake: true,
        visualEffects: 'high',
      },
      controls: {
        mouseControl: true,
        touchControl: true,
        vibration: true,
      },
      accessibility: {
        colorBlindMode: 'none',
        highContrast: false,
        reducedMotion: false,
        textSize: 'medium',
      },
    };
  }

  private getDefaultStats(): GameStats {
    return {
      totalPlayTime: 0,
      gamesPlayed: 0,
      totalScore: 0,
      highScore: 0,
      totalDeaths: 0,
      longestSurvivalTime: 0,
      enemiesKilled: 0,
      projectilesFired: 0,
      bossesDefeated: 0,
      damageDealt: 0,
      foodEaten: 0,
      maxSizeReached: 0,
      powerUpsCollected: 0,
      distanceTraveled: 0,
      biomesVisited: new Set<string>(),
      hazardsSurvived: 0,
      perfectRuns: 0,
      speedruns: 0,
      dailyChallengesCompleted: 0,
    };
  }

  private loadOrCreateSave(): SaveData {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved);

        // Convert biomesVisited array back to Set
        if (Array.isArray(data.stats.biomesVisited)) {
          data.stats.biomesVisited = new Set(data.stats.biomesVisited);
        }

        // Merge with defaults for backwards compatibility
        return {
          ...this.createNewSave(),
          ...data,
          settings: { ...this.getDefaultSettings(), ...data.settings },
        };
      }
    } catch (error) {
      console.error('Failed to load save data:', error);
    }

    return this.createNewSave();
  }

  private createNewSave(): SaveData {
    return {
      version: SAVE_VERSION,
      lastPlayed: Date.now(),
      stats: this.getDefaultStats(),
      upgrades: {},
      achievements: [],
      settings: this.getDefaultSettings(),
      unlockedSkins: ['default'],
      selectedSkin: 'default',
      totalXP: 0,
      availableXP: 0,
    };
  }

  save(): boolean {
    try {
      this.saveData.lastPlayed = Date.now();

      // Convert Set to Array for JSON serialization
      const dataToSave = {
        ...this.saveData,
        stats: {
          ...this.saveData.stats,
          biomesVisited: Array.from(this.saveData.stats.biomesVisited),
        },
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
      return true;
    } catch (error) {
      console.error('Failed to save data:', error);
      return false;
    }
  }

  getData(): SaveData {
    return this.saveData;
  }

  updateStats(updates: Partial<GameStats>): void {
    this.saveData.stats = { ...this.saveData.stats, ...updates };
    this.save();
  }

  updateSettings(updates: Partial<GameSettings>): void {
    this.saveData.settings = { ...this.saveData.settings, ...updates };
    this.save();
  }

  addXP(amount: number): void {
    this.saveData.totalXP += amount;
    this.saveData.availableXP += amount;
    this.save();
  }

  spendXP(amount: number): boolean {
    if (this.saveData.availableXP >= amount) {
      this.saveData.availableXP -= amount;
      this.save();
      return true;
    }
    return false;
  }

  upgradeAbility(upgradeId: string): void {
    this.saveData.upgrades[upgradeId] = (this.saveData.upgrades[upgradeId] || 0) + 1;
    this.save();
  }

  unlockAchievement(achievementId: string): void {
    if (!this.saveData.achievements.includes(achievementId)) {
      this.saveData.achievements.push(achievementId);
      this.save();
    }
  }

  unlockSkin(skinId: string): void {
    if (!this.saveData.unlockedSkins.includes(skinId)) {
      this.saveData.unlockedSkins.push(skinId);
      this.save();
    }
  }

  selectSkin(skinId: string): boolean {
    if (this.saveData.unlockedSkins.includes(skinId)) {
      this.saveData.selectedSkin = skinId;
      this.save();
      return true;
    }
    return false;
  }

  resetProgress(): void {
    // eslint-disable-next-line no-alert
    if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
      this.saveData = this.createNewSave();
      this.save();
    }
  }

  exportSave(): string {
    return btoa(JSON.stringify(this.saveData));
  }

  importSave(encoded: string): boolean {
    try {
      const data = JSON.parse(atob(encoded));
      this.saveData = data;
      this.save();
      return true;
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }

  // Auto-save every 30 seconds
  startAutoSave(): void {
    setInterval(() => {
      this.save();
    }, 30000);
  }
}

// Singleton instance
let saveSystemInstance: SaveSystem | null = null;

export function getSaveSystem(): SaveSystem {
  if (!saveSystemInstance) {
    saveSystemInstance = new SaveSystem();
    saveSystemInstance.startAutoSave();
  }
  return saveSystemInstance;
}
