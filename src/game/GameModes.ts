/**
 * Multiple game modes with different objectives and rules
 */

export type GameMode = 'classic' | 'timeAttack' | 'waveSurvival' | 'bossRush' | 'zen' | 'daily';

export interface GameModeDefinition {
  id: GameMode;
  name: string;
  description: string;
  icon: string;
  rules: {
    timeLimit?: number; // seconds
    lives?: number;
    startingSize?: number;
    noPredators?: boolean;
    continuousWaves?: boolean;
    bossOnly?: boolean;
    powerUpsEnabled?: boolean;
    scoreMultiplier?: number;
  };
  objectives: string[];
  unlockCondition?: string;
}

export const GAME_MODES: Record<GameMode, GameModeDefinition> = {
  classic: {
    id: 'classic',
    name: 'Classic Mode',
    description: 'Survive as long as possible and grow to become the apex predator',
    icon: '🌊',
    rules: {
      powerUpsEnabled: true,
      scoreMultiplier: 1.0,
    },
    objectives: [
      'Survive as long as possible',
      'Eat smaller creatures to grow',
      'Avoid larger predators',
      'Collect power-ups for advantages',
    ],
  },

  timeAttack: {
    id: 'timeAttack',
    name: 'Time Attack',
    description: 'Score as many points as possible in 3 minutes',
    icon: '⏱️',
    rules: {
      timeLimit: 180,
      powerUpsEnabled: true,
      scoreMultiplier: 1.5,
    },
    objectives: [
      'Maximize your score in 3 minutes',
      'Eat food and defeat enemies quickly',
      'Combo chains give bonus points',
      'Time bonuses for risky plays',
    ],
    unlockCondition: 'Survive 5 minutes in Classic Mode',
  },

  waveSurvival: {
    id: 'waveSurvival',
    name: 'Wave Survival',
    description: 'Survive increasingly difficult waves of enemies',
    icon: '🌀',
    rules: {
      lives: 3,
      continuousWaves: true,
      powerUpsEnabled: true,
      scoreMultiplier: 2.0,
    },
    objectives: [
      'Survive progressive enemy waves',
      'Each wave spawns more enemies',
      'Defeat all enemies to advance',
      "Limited lives - don't die!",
    ],
    unlockCondition: 'Defeat 100 enemies',
  },

  bossRush: {
    id: 'bossRush',
    name: 'Boss Rush',
    description: 'Fight all bosses back-to-back',
    icon: '👹',
    rules: {
      bossOnly: true,
      powerUpsEnabled: true,
      startingSize: 50,
      scoreMultiplier: 3.0,
    },
    objectives: [
      'Defeat all 3 bosses consecutively',
      'No breaks between fights',
      'Start with increased size',
      'Fastest time wins',
    ],
    unlockCondition: 'Defeat your first boss',
  },

  zen: {
    id: 'zen',
    name: 'Zen Mode',
    description: 'Peaceful exploration with no predators',
    icon: '🧘',
    rules: {
      noPredators: true,
      powerUpsEnabled: false,
      scoreMultiplier: 0.5,
    },
    objectives: [
      'Explore the ocean peacefully',
      'No predators or danger',
      'Grow at your own pace',
      'Perfect for practice',
    ],
  },

  daily: {
    id: 'daily',
    name: 'Daily Challenge',
    description: 'A new challenge every day with special modifiers',
    icon: '📅',
    rules: {
      powerUpsEnabled: true,
      scoreMultiplier: 2.5,
    },
    objectives: [
      "Complete today's unique challenge",
      'Random modifiers each day',
      'Compete on global leaderboards',
      'One attempt per day',
    ],
    unlockCondition: 'Play 10 games',
  },
};

export interface WaveDefinition {
  waveNumber: number;
  enemyCount: number;
  enemyTypes: ('prey' | 'predator')[];
  spawnDelay: number; // frames between spawns
  bossWave?: boolean;
}

export class GameModeManager {
  private currentMode: GameMode;
  private modeDefinition: GameModeDefinition;
  private startTime: number = 0;
  private elapsedTime: number = 0;
  private currentWave: number = 0;
  private livesRemaining: number = 0;
  private waveEnemiesRemaining: number = 0;

  constructor(mode: GameMode) {
    this.currentMode = mode;
    this.modeDefinition = GAME_MODES[mode];
    this.livesRemaining = this.modeDefinition.rules.lives || Infinity;
    this.startTime = Date.now();
  }

  update(): void {
    this.elapsedTime = (Date.now() - this.startTime) / 1000;
  }

  getMode(): GameMode {
    return this.currentMode;
  }

  getDefinition(): GameModeDefinition {
    return this.modeDefinition;
  }

  getRemainingTime(): number | null {
    if (this.modeDefinition.rules.timeLimit) {
      return Math.max(0, this.modeDefinition.rules.timeLimit - this.elapsedTime);
    }
    return null;
  }

  isTimeUp(): boolean {
    const remaining = this.getRemainingTime();
    return remaining !== null && remaining <= 0;
  }

  getLivesRemaining(): number {
    return this.livesRemaining;
  }

  loseLife(): boolean {
    if (this.livesRemaining > 0) {
      this.livesRemaining--;
      return this.livesRemaining > 0;
    }
    return false;
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  getWaveDefinition(wave: number): WaveDefinition {
    const baseEnemies = 5;
    const enemiesPerWave = 3;
    const enemyCount = baseEnemies + wave * enemiesPerWave;

    // Every 5th wave is a boss wave
    const isBossWave = wave > 0 && wave % 5 === 0;

    // Increase predator ratio as waves progress
    const predatorRatio = Math.min(0.7, 0.2 + wave * 0.05);
    const enemyTypes: ('prey' | 'predator')[] = [];

    for (let i = 0; i < enemyCount; i++) {
      enemyTypes.push(Math.random() < predatorRatio ? 'predator' : 'prey');
    }

    return {
      waveNumber: wave,
      enemyCount,
      enemyTypes,
      spawnDelay: Math.max(30, 90 - wave * 5), // Faster spawns each wave
      bossWave: isBossWave,
    };
  }

  startNextWave(): WaveDefinition {
    this.currentWave++;
    const waveDef = this.getWaveDefinition(this.currentWave);
    this.waveEnemiesRemaining = waveDef.enemyCount;
    return waveDef;
  }

  enemyDefeated(): void {
    this.waveEnemiesRemaining = Math.max(0, this.waveEnemiesRemaining - 1);
  }

  isWaveComplete(): boolean {
    return this.waveEnemiesRemaining <= 0;
  }

  getScoreMultiplier(): number {
    let multiplier = this.modeDefinition.rules.scoreMultiplier || 1.0;

    // Wave survival bonus
    if (this.currentMode === 'waveSurvival') {
      multiplier *= 1 + this.currentWave * 0.1;
    }

    // Time attack bonus for remaining time
    if (this.currentMode === 'timeAttack') {
      const remaining = this.getRemainingTime();
      if (remaining && remaining < 30) {
        multiplier *= 1.5; // Bonus for last 30 seconds
      }
    }

    return multiplier;
  }

  // Daily challenge seed generator
  getDailySeed(): string {
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    return dateStr;
  }

  getDailyModifiers(): {
    speedMultiplier: number;
    sizeMultiplier: number;
    powerUpFrequency: number;
    difficulty: number;
  } {
    const seed = this.hashCode(this.getDailySeed());
    const random = this.seededRandom(seed);

    return {
      speedMultiplier: 0.7 + random() * 0.6, // 0.7 - 1.3x
      sizeMultiplier: 0.8 + random() * 0.4, // 0.8 - 1.2x
      powerUpFrequency: 0.5 + random() * 1.0, // 0.5 - 1.5x
      difficulty: 0.8 + random() * 0.4, // 0.8 - 1.2x
    };
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number): () => number {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }

  getHUD(): {
    mode: string;
    timer?: string;
    lives?: number;
    wave?: number;
    objective?: string;
  } {
    const hud: ReturnType<GameModeManager['getHUD']> = {
      mode: this.modeDefinition.name,
    };

    const remaining = this.getRemainingTime();
    if (remaining !== null) {
      const minutes = Math.floor(remaining / 60);
      const seconds = Math.floor(remaining % 60);
      hud.timer = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    if (this.modeDefinition.rules.lives) {
      hud.lives = this.livesRemaining;
    }

    if (this.modeDefinition.rules.continuousWaves) {
      hud.wave = this.currentWave;
      hud.objective =
        this.waveEnemiesRemaining > 0
          ? `Defeat ${this.waveEnemiesRemaining} enemies`
          : 'Wave Complete!';
    }

    return hud;
  }
}
