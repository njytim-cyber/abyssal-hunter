import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Audio API for tests
global.AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: vi.fn().mockReturnValue({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 0 },
    type: 'sine',
  }),
  createGain: vi.fn().mockReturnValue({
    connect: vi.fn(),
    gain: { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  }),
  createBiquadFilter: vi.fn().mockReturnValue({
    connect: vi.fn(),
    frequency: { value: 0 },
    type: 'lowpass',
  }),
  destination: {},
  currentTime: 0,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
})) as any;

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}));

// Mock requestAnimationFrame
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16)) as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.cancelAnimationFrame = vi.fn(id => clearTimeout(id)) as any;
