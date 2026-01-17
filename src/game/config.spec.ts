import { describe, it, expect } from 'vitest';

import { CONFIG, LEVELS } from './config';

describe('Game Configuration', () => {
  describe('CONFIG object', () => {
    it('should have valid world size', () => {
      expect(CONFIG.worldSize).toBeGreaterThan(0);
      expect(typeof CONFIG.worldSize).toBe('number');
    });

    it('should have all required color definitions', () => {
      expect(CONFIG.colors).toBeDefined();
      expect(CONFIG.colors.bg).toBeDefined();
      expect(CONFIG.colors.player).toBeDefined();
      expect(CONFIG.colors.food).toBeDefined();
    });

    it('should have valid player configuration', () => {
      expect(CONFIG.player.baseSpeed).toBeGreaterThan(0);
      expect(CONFIG.player.dashSpeed).toBeGreaterThan(CONFIG.player.baseSpeed);
      expect(CONFIG.player.inkRegen).toBeGreaterThan(0);
      expect(CONFIG.player.maxInk).toBeGreaterThan(0);
    });

    it('should have valid spawn configuration', () => {
      expect(CONFIG.spawn.maxFood).toBeGreaterThan(0);
      expect(CONFIG.spawn.maxEnemies).toBeGreaterThan(0);
      expect(CONFIG.spawn.minSpawnDistance).toBeGreaterThan(0);
    });

    it('should have valid combo configuration', () => {
      expect(CONFIG.combo.windowMs).toBeGreaterThan(0);
      expect(CONFIG.combo.maxMultiplier).toBeGreaterThan(0);
      expect(CONFIG.combo.inkBonus).toBeGreaterThan(0);
    });
  });

  describe('LEVELS array', () => {
    it('should have at least one level', () => {
      expect(LEVELS.length).toBeGreaterThan(0);
    });

    it('should have ascending thresholds', () => {
      for (let i = 1; i < LEVELS.length; i++) {
        expect(LEVELS[i].threshold).toBeGreaterThan(LEVELS[i - 1].threshold);
      }
    });

    it('should start at threshold 0', () => {
      expect(LEVELS[0].threshold).toBe(0);
    });

    it('should have valid rank names', () => {
      LEVELS.forEach(level => {
        expect(level.rank).toBeDefined();
        expect(level.rank.length).toBeGreaterThan(0);
      });
    });
  });
});
