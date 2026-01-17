/**
 * Creature shape types for visual variety
 */
export type CreatureShape =
  | 'blob'
  | 'fish'
  | 'jellyfish'
  | 'eel'
  | 'squid'
  | 'anglerfish'
  | 'seahorse'
  | 'shark'
  | 'mantaray'
  | 'nautilus'
  | 'crab'
  | 'starfish';

export const CREATURE_SHAPES: readonly CreatureShape[] = [
  'blob',
  'fish',
  'jellyfish',
  'eel',
  'squid',
  'anglerfish',
  'seahorse',
  'shark',
  'mantaray',
  'nautilus',
  'crab',
  'starfish',
];

/**
 * Get a random creature shape weighted by type
 */
export function getRandomShape(type: 'food' | 'prey' | 'predator'): CreatureShape {
  if (type === 'food') return 'blob';

  const rand = Math.random();

  // Equal distribution across all creature types
  if (rand < 0.083) return 'fish';
  if (rand < 0.166) return 'jellyfish';
  if (rand < 0.25) return 'eel';
  if (rand < 0.333) return 'squid';
  if (rand < 0.416) return 'anglerfish';
  if (rand < 0.5) return 'seahorse';
  if (rand < 0.583) return 'shark';
  if (rand < 0.666) return 'mantaray';
  if (rand < 0.75) return 'nautilus';
  if (rand < 0.833) return 'crab';
  if (rand < 0.916) return 'starfish';
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

/**
 * Draw a squid shape
 */
export function drawSquid(
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

  ctx.fillStyle = color;

  // Elongated head
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.5, radius * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eight trailing tentacles
  ctx.strokeStyle = color;
  ctx.lineWidth = radius * 0.15;
  ctx.lineCap = 'round';

  for (let i = 0; i < 8; i++) {
    const offsetY = (i - 3.5) * radius * 0.25;
    const wave = Math.sin(frame * 0.1 + i * 0.5) * radius * 0.3;

    ctx.beginPath();
    ctx.moveTo(-radius * 0.8, offsetY);
    ctx.quadraticCurveTo(-radius * 1.5 + wave, offsetY, -radius * 2.2, offsetY + wave * 0.5);
    ctx.stroke();
  }

  // Eyes
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(radius * 0.3, -radius * 0.3, radius * 0.2, 0, Math.PI * 2);
  ctx.arc(radius * 0.3, radius * 0.3, radius * 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw an anglerfish shape
 */
export function drawAnglerfish(
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

  ctx.fillStyle = color;

  // Large body
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.3, radius, 0, 0, Math.PI * 2);
  ctx.fill();

  // Large mouth with teeth
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = radius * 0.1;
  ctx.beginPath();
  ctx.arc(radius * 0.8, 0, radius * 0.4, -Math.PI * 0.3, Math.PI * 0.3);
  ctx.stroke();

  // Teeth
  for (let i = 0; i < 5; i++) {
    const ta = -Math.PI * 0.25 + (i / 4) * Math.PI * 0.5;
    ctx.beginPath();
    ctx.moveTo(radius * 0.8 + Math.cos(ta) * radius * 0.4, Math.sin(ta) * radius * 0.4);
    ctx.lineTo(radius * 0.8 + Math.cos(ta) * radius * 0.6, Math.sin(ta) * radius * 0.6);
    ctx.stroke();
  }

  // Dangling lure light (bioluminescent)
  const lureSway = Math.sin(frame * 0.05) * radius * 0.3;
  ctx.strokeStyle = color;
  ctx.lineWidth = radius * 0.08;
  ctx.beginPath();
  ctx.moveTo(radius * 0.3, -radius * 0.8);
  ctx.quadraticCurveTo(
    radius * 0.5 + lureSway,
    -radius * 1.5,
    radius * 0.3 + lureSway,
    -radius * 2
  );
  ctx.stroke();

  // Glowing lure
  const glowGradient = ctx.createRadialGradient(
    radius * 0.3 + lureSway,
    -radius * 2,
    0,
    radius * 0.3 + lureSway,
    -radius * 2,
    radius * 0.4
  );
  glowGradient.addColorStop(0, '#ffff00');
  glowGradient.addColorStop(0.5, '#ffaa00');
  glowGradient.addColorStop(1, 'rgba(255, 170, 0, 0)');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(radius * 0.3 + lureSway, -radius * 2, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw a seahorse shape
 */
export function drawSeahorse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  angle: number,
  color: string
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2); // Vertical orientation

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = radius * 0.4;
  ctx.lineCap = 'round';

  // Curved body (S-shape)
  ctx.beginPath();
  ctx.moveTo(0, -radius * 1.2);
  ctx.quadraticCurveTo(radius * 0.5, -radius * 0.5, radius * 0.3, 0);
  ctx.quadraticCurveTo(radius * 0.1, radius * 0.8, -radius * 0.2, radius * 1.5);
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.arc(0, -radius * 1.4, radius * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  ctx.lineWidth = radius * 0.25;
  ctx.beginPath();
  ctx.moveTo(radius * 0.3, -radius * 1.4);
  ctx.lineTo(radius * 0.7, -radius * 1.5);
  ctx.stroke();

  // Fins
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = radius * 0.15;
  ctx.beginPath();
  ctx.moveTo(radius * 0.3, -radius * 0.3);
  ctx.quadraticCurveTo(radius * 0.8, -radius * 0.5, radius * 0.5, -radius * 0.8);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a shark shape
 */
export function drawShark(
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

  // Streamlined body
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.8, radius * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dorsal fin
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.6);
  ctx.lineTo(radius * 0.3, -radius * 1.3);
  ctx.lineTo(radius * 0.8, -radius * 0.6);
  ctx.closePath();
  ctx.fill();

  // Tail fin
  ctx.beginPath();
  ctx.moveTo(-radius * 1.4, 0);
  ctx.lineTo(-radius * 2, -radius * 0.7);
  ctx.lineTo(-radius * 1.6, 0);
  ctx.lineTo(-radius * 2, radius * 0.5);
  ctx.closePath();
  ctx.fill();

  // Pectoral fins
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.ellipse(
    radius * 0.5,
    radius * 0.4,
    radius * 0.6,
    radius * 0.3,
    Math.PI * 0.3,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    radius * 0.5,
    -radius * 0.4,
    radius * 0.6,
    radius * 0.3,
    -Math.PI * 0.3,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Eye
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(radius * 1, -radius * 0.2, radius * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw a manta ray shape
 */
export function drawMantaray(
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

  ctx.fillStyle = color;

  // Wing flap animation
  const flap = Math.sin(frame * 0.08) * 0.2;

  // Body (small center)
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.8, radius * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wide wing-like fins
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(
    radius * 1.5,
    -radius * (1.2 + flap),
    radius * 2.5,
    -radius * (0.3 + flap * 0.5)
  );
  ctx.lineTo(radius * 2.2, 0);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(
    radius * 1.5,
    radius * (1.2 - flap),
    radius * 2.5,
    radius * (0.3 - flap * 0.5)
  );
  ctx.lineTo(radius * 2.2, 0);
  ctx.closePath();
  ctx.fill();

  // Tail
  ctx.lineWidth = radius * 0.15;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.6, 0);
  ctx.lineTo(-radius * 1.5, 0);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a nautilus shape
 */
export function drawNautilus(
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

  // Spiral shell
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Spiral pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = radius * 0.08;
  let r = radius * 0.1;
  let a = 0;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  while (r < radius) {
    a += 0.3;
    r += 0.05 * radius;
    ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
  }
  ctx.stroke();

  // Tentacles emerging
  ctx.strokeStyle = color;
  ctx.lineWidth = radius * 0.12;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const ta = (i / 6) * Math.PI - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(radius * 0.5 * Math.cos(ta), radius * 0.5 * Math.sin(ta));
    ctx.lineTo(radius * 1.3 * Math.cos(ta), radius * 1.3 * Math.sin(ta));
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw a crab shape
 */
export function drawCrab(
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

  // Wide body
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.2, radius * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Claws
  ctx.strokeStyle = color;
  ctx.lineWidth = radius * 0.25;
  ctx.lineCap = 'round';

  // Left claw
  ctx.beginPath();
  ctx.moveTo(radius * 0.8, -radius * 0.5);
  ctx.lineTo(radius * 1.5, -radius * 1.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(radius * 1.5, -radius * 1.2, radius * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Right claw
  ctx.beginPath();
  ctx.moveTo(radius * 0.8, radius * 0.5);
  ctx.lineTo(radius * 1.5, radius * 1.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(radius * 1.5, radius * 1.2, radius * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Walking legs (4 per side)
  ctx.lineWidth = radius * 0.12;
  for (let i = 0; i < 4; i++) {
    const legX = -radius * 0.5 + i * radius * 0.4;
    ctx.beginPath();
    ctx.moveTo(legX, -radius * 0.6);
    ctx.lineTo(legX - radius * 0.3, -radius * 1.3);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(legX, radius * 0.6);
    ctx.lineTo(legX - radius * 0.3, radius * 1.3);
    ctx.stroke();
  }

  // Eyes on stalks
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(radius * 0.6, -radius * 0.3, radius * 0.15, 0, Math.PI * 2);
  ctx.arc(radius * 0.6, radius * 0.3, radius * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw a starfish shape
 */
export function drawStarfish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  frame: number,
  color: string
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(frame * 0.01); // Slow rotation

  ctx.fillStyle = color;

  // 5-pointed star
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const outerX = Math.cos(angle) * radius * 1.5;
    const outerY = Math.sin(angle) * radius * 1.5;

    if (i === 0) {
      ctx.moveTo(outerX, outerY);
    } else {
      ctx.lineTo(outerX, outerY);
    }

    const innerAngle = angle + Math.PI / 5;
    const innerX = Math.cos(innerAngle) * radius * 0.6;
    const innerY = Math.sin(innerAngle) * radius * 0.6;
    ctx.lineTo(innerX, innerY);
  }
  ctx.closePath();
  ctx.fill();

  // Center circle
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
