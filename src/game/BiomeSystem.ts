/**
 * Biome system with distinct visual themes and gameplay modifiers
 */

export type BiomeType = 'shallows' | 'reefs' | 'depths' | 'trench' | 'volcanic';

export interface BiomeDefinition {
  type: BiomeType;
  name: string;
  backgroundColor: string;
  ambientColor: string;
  particleColor: string;
  depth: number; // Visual depth indicator
  modifiers: {
    spawnRateMultiplier: number;
    predatorChance: number;
    powerUpChance: number;
    visibilityRange: number;
  };
  hazards: string[];
  music?: string; // Background music track
}

export const BIOME_DEFINITIONS: Record<BiomeType, BiomeDefinition> = {
  shallows: {
    type: 'shallows',
    name: 'Sunlit Shallows',
    backgroundColor: '#1a4d6d',
    ambientColor: 'rgba(100, 180, 220, 0.2)',
    particleColor: '#88ccff',
    depth: 0,
    modifiers: {
      spawnRateMultiplier: 1.2,
      predatorChance: 0.2,
      powerUpChance: 0.3,
      visibilityRange: 1.5,
    },
    hazards: [],
  },
  reefs: {
    type: 'reefs',
    name: 'Coral Reefs',
    backgroundColor: '#0d3d56',
    ambientColor: 'rgba(80, 200, 180, 0.2)',
    particleColor: '#50c8b4',
    depth: 1,
    modifiers: {
      spawnRateMultiplier: 1.5,
      predatorChance: 0.3,
      powerUpChance: 0.4,
      visibilityRange: 1.2,
    },
    hazards: ['coral'],
  },
  depths: {
    type: 'depths',
    name: 'Twilight Depths',
    backgroundColor: '#0a2942',
    ambientColor: 'rgba(50, 80, 120, 0.3)',
    particleColor: '#3264a8',
    depth: 2,
    modifiers: {
      spawnRateMultiplier: 1.0,
      predatorChance: 0.5,
      powerUpChance: 0.25,
      visibilityRange: 0.8,
    },
    hazards: ['current'],
  },
  trench: {
    type: 'trench',
    name: 'Abyssal Trench',
    backgroundColor: '#050510',
    ambientColor: 'rgba(20, 20, 40, 0.4)',
    particleColor: '#1e1e3c',
    depth: 3,
    modifiers: {
      spawnRateMultiplier: 0.7,
      predatorChance: 0.7,
      powerUpChance: 0.15,
      visibilityRange: 0.5,
    },
    hazards: ['current', 'pressure'],
  },
  volcanic: {
    type: 'volcanic',
    name: 'Volcanic Vents',
    backgroundColor: '#2d1810',
    ambientColor: 'rgba(180, 80, 40, 0.3)',
    particleColor: '#ff6600',
    depth: 2,
    modifiers: {
      spawnRateMultiplier: 0.9,
      predatorChance: 0.4,
      powerUpChance: 0.35,
      visibilityRange: 1.0,
    },
    hazards: ['vent', 'lava'],
  },
};

export class BiomeSystem {
  private worldSize: number;
  private biomeSize: number = 2000; // Size of each biome region
  private biomes: Map<string, BiomeType> = new Map();

  constructor(worldSize: number) {
    this.worldSize = worldSize;
    this.generateBiomes();
  }

  private generateBiomes(): void {
    // Create a grid of biomes
    const gridSize = Math.ceil(this.worldSize / this.biomeSize);

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const key = `${x},${y}`;

        // Distance from center determines depth/biome type
        const centerX = gridSize / 2;
        const centerY = gridSize / 2;
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        const depthRatio = distance / maxDistance;

        // Assign biome based on depth and randomness
        let biomeType: BiomeType;
        const rand = Math.random();

        if (depthRatio < 0.2) {
          biomeType = 'shallows';
        } else if (depthRatio < 0.4) {
          biomeType = rand < 0.7 ? 'reefs' : 'shallows';
        } else if (depthRatio < 0.6) {
          if (rand < 0.5) {
            biomeType = 'reefs';
          } else if (rand < 0.8) {
            biomeType = 'depths';
          } else {
            biomeType = 'volcanic';
          }
        } else if (depthRatio < 0.8) {
          biomeType = rand < 0.7 ? 'depths' : 'volcanic';
        } else {
          biomeType = rand < 0.8 ? 'trench' : 'depths';
        }

        this.biomes.set(key, biomeType);
      }
    }
  }

  getBiomeAt(x: number, y: number): BiomeType {
    const gridX = Math.floor(x / this.biomeSize);
    const gridY = Math.floor(y / this.biomeSize);
    const key = `${gridX},${gridY}`;
    return this.biomes.get(key) || 'depths';
  }

  getBiomeDefinition(biomeType: BiomeType): BiomeDefinition {
    return BIOME_DEFINITIONS[biomeType];
  }

  getCurrentBiome(playerX: number, playerY: number): BiomeDefinition {
    const biomeType = this.getBiomeAt(playerX, playerY);
    return this.getBiomeDefinition(biomeType);
  }

  drawBiomeTransition(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    const biome = this.getCurrentBiome(centerX, centerY);

    // Background
    ctx.fillStyle = biome.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Ambient overlay
    ctx.fillStyle = biome.ambientColor;
    ctx.fillRect(0, 0, width, height);

    // Ambient particles (snow effect)
    const particleCount = 50;
    ctx.fillStyle = biome.particleColor;
    for (let i = 0; i < particleCount; i++) {
      const px = Math.random() * width;
      const py = Math.random() * height;
      const size = Math.random() * 2 + 1;
      ctx.globalAlpha = Math.random() * 0.5 + 0.2;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Mini-map showing biome regions
  drawBiomeMap(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number,
    mapSize: number
  ): void {
    const mapX = 20;
    const mapY = 20;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);

    // Draw biome regions
    const gridSize = Math.ceil(this.worldSize / this.biomeSize);
    const cellSize = mapSize / gridSize;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const key = `${x},${y}`;
        const biomeType = this.biomes.get(key);
        if (biomeType) {
          const biome = BIOME_DEFINITIONS[biomeType];
          ctx.fillStyle = biome.backgroundColor;
          ctx.fillRect(mapX + x * cellSize, mapY + y * cellSize, cellSize, cellSize);
        }
      }
    }

    // Player position
    const playerGridX = Math.floor(playerX / this.biomeSize);
    const playerGridY = Math.floor(playerY / this.biomeSize);
    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.arc(
      mapX + playerGridX * cellSize + cellSize / 2,
      mapY + playerGridY * cellSize + cellSize / 2,
      cellSize / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Current biome label
    const currentBiome = this.getCurrentBiome(playerX, playerY);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(currentBiome.name, mapX, mapY + mapSize + 20);
  }
}
