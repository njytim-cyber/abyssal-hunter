/**
 * Spatial grid for efficient collision detection
 * Divides world into cells to reduce collision checks from O(n²) to O(n)
 */

import type { Entity } from './Entity';

export class SpatialGrid {
  private cellSize: number;
  private cells: Map<string, Entity[]>;

  constructor(cellSize: number = 200) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  /**
   * Get cell key for position
   */
  private getCellKey(x: number, y: number): string {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    return `${col},${row}`;
  }

  /**
   * Clear all cells
   */
  clear(): void {
    this.cells.clear();
  }

  /**
   * Insert entity into grid
   */
  insert(entity: Entity): void {
    const key = this.getCellKey(entity.x, entity.y);
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key)!.push(entity);
  }

  /**
   * Get nearby entities (current cell + 8 surrounding cells)
   */
  getNearby(x: number, y: number): Entity[] {
    const nearby: Entity[] = [];
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    // Check current and surrounding cells
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const key = `${col + dc},${row + dr}`;
        const cell = this.cells.get(key);
        if (cell) {
          nearby.push(...cell);
        }
      }
    }

    return nearby;
  }

  /**
   * Build grid from entities
   */
  build(entities: Entity[]): void {
    this.clear();
    for (const entity of entities) {
      this.insert(entity);
    }
  }
}
