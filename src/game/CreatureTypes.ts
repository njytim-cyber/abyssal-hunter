/**
 * Creature shape types for visual variety
 */
export type CreatureShape = 'blob' | 'fish' | 'jellyfish' | 'eel';

export const CREATURE_SHAPES: readonly CreatureShape[] = ['blob', 'fish', 'jellyfish', 'eel'];

/**
 * Get a random creature shape weighted by type
 */
export function getRandomShape(type: 'food' | 'prey' | 'predator'): CreatureShape {
  if (type === 'food') return 'blob';

  const rand = Math.random();
  if (rand < 0.4) return 'fish';
  if (rand < 0.7) return 'jellyfish';
  if (rand < 0.9) return 'eel';
  return 'blob';
}

/**
 * Draw a fish shape
 */
export function drawFish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  angle: number,
  color: string
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = color;

  // Body (ellipse)
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.3, radius * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.beginPath();
  ctx.moveTo(-radius * 0.8, 0);
  ctx.lineTo(-radius * 1.6, -radius * 0.6);
  ctx.lineTo(-radius * 1.6, radius * 0.6);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(radius * 0.5, -radius * 0.1, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(radius * 0.55, -radius * 0.1, radius * 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw a jellyfish shape
 */
export function drawJellyfish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  frame: number,
  color: string
): void {
  ctx.save();
  ctx.translate(x, y);

  // Pulsing bell
  const pulse = 1 + Math.sin(frame * 0.1) * 0.1;

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.8;

  // Bell (dome)
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * pulse, radius * 0.7 * pulse, 0, Math.PI, 0);
  ctx.fill();

  // Tentacles
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = color;
  ctx.lineWidth = radius * 0.15;
  ctx.lineCap = 'round';

  for (let i = 0; i < 5; i++) {
    const tx = (i - 2) * radius * 0.4;
    const wave = Math.sin(frame * 0.08 + i) * radius * 0.3;

    ctx.beginPath();
    ctx.moveTo(tx, radius * 0.3);
    ctx.quadraticCurveTo(tx + wave, radius, tx, radius * 1.8);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw an eel shape
 */
export function drawEel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  angle: number,
  frame: number,
  color: string
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.strokeStyle = color;
  ctx.lineWidth = radius * 0.6;
  ctx.lineCap = 'round';

  // Wavy body
  ctx.beginPath();
  ctx.moveTo(radius, 0);

  const segments = 6;
  for (let i = 1; i <= segments; i++) {
    const sx = radius - (i / segments) * radius * 3;
    const sy = Math.sin(frame * 0.15 + i * 0.8) * radius * 0.5;
    ctx.lineTo(sx, sy);
  }
  ctx.stroke();

  // Head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(radius, 0, radius * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(radius * 1.1, -radius * 0.15, radius * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw a blob shape (default)
 */
export function drawBlob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}
