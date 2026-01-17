/**
 * Achievement system with 30 achievements tracking various accomplishments
 */

export type AchievementCategory = 'survival' | 'combat' | 'exploration' | 'mastery' | 'special';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  condition: (stats: GameStats) => boolean;
  reward?: {
    xp: number;
    unlock?: string;
  };
  secret?: boolean;
}

export interface GameStats {
  // Survival stats
  totalPlayTime: number;
  gamesPlayed: number;
  totalScore: number;
  highScore: number;
  totalDeaths: number;
  longestSurvivalTime: number;

  // Combat stats
  enemiesKilled: number;
  projectilesFired: number;
  bossesDefeated: number;
  damageDealt: number;

  // Growth stats
  foodEaten: number;
  maxSizeReached: number;
  powerUpsCollected: number;

  // Exploration stats
  distanceTraveled: number;
  biomesVisited: Set<string>;
  hazardsSurvived: number;

  // Special stats
  perfectRuns: number; // No damage taken
  speedruns: number; // Complete objectives quickly
  dailyChallengesCompleted: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Survival achievements (10)
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Play your first game',
    category: 'survival',
    icon: '🎮',
    condition: stats => stats.gamesPlayed >= 1,
    reward: { xp: 50 },
  },
  {
    id: 'survivor',
    name: 'Survivor',
    description: 'Survive for 5 minutes',
    category: 'survival',
    icon: '⏱️',
    condition: stats => stats.longestSurvivalTime >= 300,
    reward: { xp: 100 },
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Survive for 10 minutes',
    category: 'survival',
    icon: '🏆',
    condition: stats => stats.longestSurvivalTime >= 600,
    reward: { xp: 250 },
  },
  {
    id: 'immortal',
    name: 'Immortal',
    description: 'Survive for 20 minutes',
    category: 'survival',
    icon: '👑',
    condition: stats => stats.longestSurvivalTime >= 1200,
    reward: { xp: 500 },
  },
  {
    id: 'high_scorer',
    name: 'High Scorer',
    description: 'Reach a score of 10,000',
    category: 'survival',
    icon: '💯',
    condition: stats => stats.highScore >= 10000,
    reward: { xp: 200 },
  },
  {
    id: 'point_master',
    name: 'Point Master',
    description: 'Reach a score of 50,000',
    category: 'survival',
    icon: '⭐',
    condition: stats => stats.highScore >= 50000,
    reward: { xp: 500 },
  },
  {
    id: 'dedicated',
    name: 'Dedicated Player',
    description: 'Play 50 games',
    category: 'survival',
    icon: '🎯',
    condition: stats => stats.gamesPlayed >= 50,
    reward: { xp: 300 },
  },
  {
    id: 'no_pain_no_gain',
    name: 'No Pain, No Gain',
    description: 'Die 100 times',
    category: 'survival',
    icon: '💀',
    condition: stats => stats.totalDeaths >= 100,
    reward: { xp: 150 },
  },
  {
    id: 'flawless',
    name: 'Flawless Victory',
    description: 'Complete a game without taking damage',
    category: 'survival',
    icon: '✨',
    condition: stats => stats.perfectRuns >= 1,
    reward: { xp: 400 },
  },
  {
    id: 'marathon',
    name: 'Marathon Runner',
    description: 'Accumulate 60 minutes of total play time',
    category: 'survival',
    icon: '🏃',
    condition: stats => stats.totalPlayTime >= 3600,
    reward: { xp: 300 },
  },

  // Combat achievements (8)
  {
    id: 'first_kill',
    name: 'First Kill',
    description: 'Defeat your first enemy',
    category: 'combat',
    icon: '⚔️',
    condition: stats => stats.enemiesKilled >= 1,
    reward: { xp: 50 },
  },
  {
    id: 'hunter',
    name: 'Hunter',
    description: 'Defeat 100 enemies',
    category: 'combat',
    icon: '🎯',
    condition: stats => stats.enemiesKilled >= 100,
    reward: { xp: 200 },
  },
  {
    id: 'apex_predator',
    name: 'Apex Predator',
    description: 'Defeat 500 enemies',
    category: 'combat',
    icon: '🦈',
    condition: stats => stats.enemiesKilled >= 500,
    reward: { xp: 500 },
  },
  {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    description: 'Defeat your first boss',
    category: 'combat',
    icon: '👹',
    condition: stats => stats.bossesDefeated >= 1,
    reward: { xp: 300 },
  },
  {
    id: 'legend_killer',
    name: 'Legend Killer',
    description: 'Defeat all 3 boss types',
    category: 'combat',
    icon: '🔥',
    condition: stats => stats.bossesDefeated >= 3,
    reward: { xp: 600 },
  },
  {
    id: 'trigger_happy',
    name: 'Trigger Happy',
    description: 'Fire 1000 projectiles',
    category: 'combat',
    icon: '💥',
    condition: stats => stats.projectilesFired >= 1000,
    reward: { xp: 150 },
  },
  {
    id: 'heavy_hitter',
    name: 'Heavy Hitter',
    description: 'Deal 10,000 total damage',
    category: 'combat',
    icon: '💪',
    condition: stats => stats.damageDealt >= 10000,
    reward: { xp: 250 },
  },
  {
    id: 'sniper',
    name: 'Sniper',
    description: 'Defeat an enemy from maximum range',
    category: 'combat',
    icon: '🎯',
    condition: stats => stats.enemiesKilled >= 1, // Placeholder
    reward: { xp: 200 },
    secret: true,
  },

  // Exploration achievements (6)
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Visit all 5 biome types',
    category: 'exploration',
    icon: '🗺️',
    condition: stats => stats.biomesVisited.size >= 5,
    reward: { xp: 300 },
  },
  {
    id: 'traveler',
    name: 'World Traveler',
    description: 'Travel 50,000 units',
    category: 'exploration',
    icon: '🌊',
    condition: stats => stats.distanceTraveled >= 50000,
    reward: { xp: 200 },
  },
  {
    id: 'abyss_walker',
    name: 'Abyss Walker',
    description: 'Spend 5 minutes in the Abyssal Trench',
    category: 'exploration',
    icon: '🕳️',
    condition: stats => stats.biomesVisited.has('trench'),
    reward: { xp: 250 },
  },
  {
    id: 'danger_zone',
    name: 'Danger Zone',
    description: 'Survive 50 environmental hazards',
    category: 'exploration',
    icon: '⚠️',
    condition: stats => stats.hazardsSurvived >= 50,
    reward: { xp: 200 },
  },
  {
    id: 'power_hungry',
    name: 'Power Hungry',
    description: 'Collect 100 power-ups',
    category: 'exploration',
    icon: '🔋',
    condition: stats => stats.powerUpsCollected >= 100,
    reward: { xp: 200 },
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Discover all secrets',
    category: 'exploration',
    icon: '🎁',
    condition: stats => stats.biomesVisited.size >= 5 && stats.powerUpsCollected >= 100,
    reward: { xp: 500 },
  },

  // Mastery achievements (4)
  {
    id: 'gourmand',
    name: 'Gourmand',
    description: 'Eat 1000 food items',
    category: 'mastery',
    icon: '🍽️',
    condition: stats => stats.foodEaten >= 1000,
    reward: { xp: 200 },
  },
  {
    id: 'giant',
    name: 'Giant of the Deep',
    description: 'Reach maximum size',
    category: 'mastery',
    icon: '🐋',
    condition: stats => stats.maxSizeReached >= 100,
    reward: { xp: 300 },
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a speedrun challenge',
    category: 'mastery',
    icon: '⚡',
    condition: stats => stats.speedruns >= 1,
    reward: { xp: 400 },
  },
  {
    id: 'daily_grind',
    name: 'Daily Grind',
    description: 'Complete 10 daily challenges',
    category: 'mastery',
    icon: '📅',
    condition: stats => stats.dailyChallengesCompleted >= 10,
    reward: { xp: 350 },
  },

  // Special achievements (2)
  {
    id: 'lucky',
    name: 'Lucky Seven',
    description: 'Find a rare golden creature',
    category: 'special',
    icon: '🍀',
    condition: stats => stats.enemiesKilled >= 1, // Placeholder
    reward: { xp: 500, unlock: 'goldenSkin' },
    secret: true,
  },
  {
    id: 'master',
    name: 'Master of the Abyss',
    description: 'Unlock all achievements',
    category: 'special',
    icon: '🏆',
    condition: _stats => false, // Checked separately
    reward: { xp: 1000, unlock: 'masterSkin' },
  },
];

export class AchievementSystem {
  private unlockedAchievements: Set<string> = new Set();
  private stats: GameStats;
  private listeners: ((achievement: Achievement) => void)[] = [];

  constructor(stats: GameStats, savedAchievements?: string[]) {
    this.stats = stats;
    if (savedAchievements) {
      this.unlockedAchievements = new Set(savedAchievements);
    }
  }

  checkAchievements(): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (!this.unlockedAchievements.has(achievement.id)) {
        if (achievement.condition(this.stats)) {
          this.unlockAchievement(achievement);
          newlyUnlocked.push(achievement);
        }
      }
    }

    // Check master achievement separately
    const masterAchievement = ACHIEVEMENTS.find(a => a.id === 'master');
    if (masterAchievement && !this.unlockedAchievements.has('master')) {
      const allOtherUnlocked = ACHIEVEMENTS.filter(a => a.id !== 'master').every(a =>
        this.unlockedAchievements.has(a.id)
      );
      if (allOtherUnlocked) {
        this.unlockAchievement(masterAchievement);
        newlyUnlocked.push(masterAchievement);
      }
    }

    return newlyUnlocked;
  }

  private unlockAchievement(achievement: Achievement): void {
    this.unlockedAchievements.add(achievement.id);
    this.listeners.forEach(listener => listener(achievement));
  }

  onAchievementUnlocked(callback: (achievement: Achievement) => void): void {
    this.listeners.push(callback);
  }

  getProgress(): {
    total: number;
    unlocked: number;
    percentage: number;
  } {
    return {
      total: ACHIEVEMENTS.length,
      unlocked: this.unlockedAchievements.size,
      percentage: (this.unlockedAchievements.size / ACHIEVEMENTS.length) * 100,
    };
  }

  getUnlockedAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(a => this.unlockedAchievements.has(a.id));
  }

  getLockedAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(a => !this.unlockedAchievements.has(a.id) && !a.secret);
  }

  isUnlocked(achievementId: string): boolean {
    return this.unlockedAchievements.has(achievementId);
  }

  getSaveData(): string[] {
    return Array.from(this.unlockedAchievements);
  }
}
