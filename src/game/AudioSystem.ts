/**
 * Enhanced audio system with sound effects and biome soundscapes
 */

export type SoundEffect =
  | 'eat'
  | 'dash'
  | 'powerup'
  | 'hit'
  | 'death'
  | 'shoot'
  | 'explosion'
  | 'levelup'
  | 'achievement'
  | 'bossAppear'
  | 'bossHit'
  | 'bossDefeat'
  | 'waveComplete'
  | 'menuClick'
  | 'menuHover';

export type BiomeMusic = 'shallows' | 'reefs' | 'depths' | 'trench' | 'volcanic';

interface SoundDefinition {
  type: 'tone' | 'noise';
  frequency?: number;
  duration: number;
  volume: number;
  fadeOut?: boolean;
  envelope?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 0.7;
  private sfxVolume: number = 0.6;
  private musicVolume: number = 0.5;
  private muted: boolean = false;
  private currentBiomeMusic: AudioBufferSourceNode | null = null;
  private musicGainNode: GainNode | null = null;

  constructor() {
    this.initAudio();
  }

  private initAudio(): void {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        this.musicGainNode = this.audioContext.createGain();
        this.musicGainNode.connect(this.audioContext.destination);
        this.updateMusicVolume();
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolume();
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolume();
  }

  private updateMusicVolume(): void {
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.masterVolume * this.musicVolume;
    }
  }

  toggleMute(): void {
    this.muted = !this.muted;
  }

  // Play sound effects
  playSfx(effect: SoundEffect): void {
    if (this.muted || !this.audioContext) return;

    const definition = this.getSoundDefinition(effect);
    this.playSound(definition, this.sfxVolume);
  }

  private getSoundDefinition(effect: SoundEffect): SoundDefinition {
    const definitions: Record<SoundEffect, SoundDefinition> = {
      eat: {
        type: 'tone',
        frequency: 400,
        duration: 0.1,
        volume: 0.3,
        fadeOut: true,
      },
      dash: {
        type: 'noise',
        duration: 0.2,
        volume: 0.2,
        fadeOut: true,
      },
      powerup: {
        type: 'tone',
        frequency: 600,
        duration: 0.3,
        volume: 0.4,
        envelope: {
          attack: 0.05,
          decay: 0.1,
          sustain: 0.7,
          release: 0.15,
        },
      },
      hit: {
        type: 'noise',
        duration: 0.15,
        volume: 0.5,
      },
      death: {
        type: 'tone',
        frequency: 200,
        duration: 0.8,
        volume: 0.6,
        fadeOut: true,
        envelope: {
          attack: 0.01,
          decay: 0.3,
          sustain: 0.4,
          release: 0.49,
        },
      },
      shoot: {
        type: 'tone',
        frequency: 800,
        duration: 0.08,
        volume: 0.25,
        fadeOut: true,
      },
      explosion: {
        type: 'noise',
        duration: 0.4,
        volume: 0.5,
        fadeOut: true,
      },
      levelup: {
        type: 'tone',
        frequency: 800,
        duration: 0.5,
        volume: 0.5,
        envelope: {
          attack: 0.05,
          decay: 0.15,
          sustain: 0.6,
          release: 0.2,
        },
      },
      achievement: {
        type: 'tone',
        frequency: 1000,
        duration: 0.6,
        volume: 0.6,
        envelope: {
          attack: 0.05,
          decay: 0.1,
          sustain: 0.7,
          release: 0.15,
        },
      },
      bossAppear: {
        type: 'tone',
        frequency: 150,
        duration: 1.5,
        volume: 0.7,
        envelope: {
          attack: 0.3,
          decay: 0.4,
          sustain: 0.6,
          release: 0.3,
        },
      },
      bossHit: {
        type: 'noise',
        duration: 0.2,
        volume: 0.6,
      },
      bossDefeat: {
        type: 'tone',
        frequency: 600,
        duration: 1.0,
        volume: 0.7,
        envelope: {
          attack: 0.1,
          decay: 0.3,
          sustain: 0.4,
          release: 0.2,
        },
      },
      waveComplete: {
        type: 'tone',
        frequency: 700,
        duration: 0.4,
        volume: 0.5,
      },
      menuClick: {
        type: 'tone',
        frequency: 500,
        duration: 0.05,
        volume: 0.3,
      },
      menuHover: {
        type: 'tone',
        frequency: 600,
        duration: 0.03,
        volume: 0.2,
      },
    };

    return definitions[effect];
  }

  private playSound(definition: SoundDefinition, volumeMultiplier: number): void {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create gain node for volume control
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    const finalVolume = definition.volume * volumeMultiplier * this.masterVolume;

    if (definition.envelope) {
      const { attack, decay, sustain, release } = definition.envelope;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(finalVolume, now + attack);
      gainNode.gain.linearRampToValueAtTime(finalVolume * sustain, now + attack + decay);
      gainNode.gain.setValueAtTime(finalVolume * sustain, now + definition.duration - release);
      gainNode.gain.linearRampToValueAtTime(0, now + definition.duration);
    } else if (definition.fadeOut) {
      gainNode.gain.setValueAtTime(finalVolume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + definition.duration);
    } else {
      gainNode.gain.value = finalVolume;
    }

    if (definition.type === 'tone' && definition.frequency) {
      // Create oscillator for tone
      const oscillator = ctx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = definition.frequency;
      oscillator.connect(gainNode);
      oscillator.start(now);
      oscillator.stop(now + definition.duration);
    } else if (definition.type === 'noise') {
      // Create noise buffer
      const bufferSize = ctx.sampleRate * definition.duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(gainNode);
      source.start(now);
    }
  }

  // Biome ambient soundscapes (procedurally generated)
  playBiomeMusic(biome: BiomeMusic): void {
    if (this.muted || !this.audioContext || !this.musicGainNode) return;

    // Stop current music
    this.stopBiomeMusic();

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create ambient soundscape based on biome
    switch (biome) {
      case 'shallows':
        this.createShallowsAmbience(ctx, now);
        break;
      case 'reefs':
        this.createReefsAmbience(ctx, now);
        break;
      case 'depths':
        this.createDepthsAmbience(ctx, now);
        break;
      case 'trench':
        this.createTrenchAmbience(ctx, now);
        break;
      case 'volcanic':
        this.createVolcanicAmbience(ctx, now);
        break;
    }
  }

  private createShallowsAmbience(ctx: AudioContext, startTime: number): void {
    // Bright, peaceful tones
    const frequencies = [220, 330, 440, 550];
    this.createAmbienceLoop(ctx, startTime, frequencies, 0.05);
  }

  private createReefsAmbience(ctx: AudioContext, startTime: number): void {
    // Vibrant, colorful tones
    const frequencies = [260, 390, 520, 650];
    this.createAmbienceLoop(ctx, startTime, frequencies, 0.06);
  }

  private createDepthsAmbience(ctx: AudioContext, startTime: number): void {
    // Dark, mysterious tones
    const frequencies = [110, 165, 220, 275];
    this.createAmbienceLoop(ctx, startTime, frequencies, 0.04);
  }

  private createTrenchAmbience(ctx: AudioContext, startTime: number): void {
    // Deep, ominous tones
    const frequencies = [55, 82.5, 110, 137.5];
    this.createAmbienceLoop(ctx, startTime, frequencies, 0.03);
  }

  private createVolcanicAmbience(ctx: AudioContext, startTime: number): void {
    // Rumbling, intense tones with added noise
    const frequencies = [80, 120, 160, 200];
    this.createAmbienceLoop(ctx, startTime, frequencies, 0.08);

    // Add rumbling noise
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.02 * this.masterVolume * this.musicVolume;
    noiseGain.connect(this.musicGainNode!);

    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    noise.buffer = buffer;
    noise.loop = true;
    noise.connect(noiseGain);
    noise.start(startTime);
  }

  private createAmbienceLoop(
    ctx: AudioContext,
    startTime: number,
    frequencies: number[],
    baseVolume: number
  ): void {
    if (!this.musicGainNode) return;

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;

      const gainNode = ctx.createGain();
      const volume = baseVolume * (1 - index * 0.15);
      gainNode.gain.value = volume;

      // Add slow volume modulation for organic feel
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.1 + index * 0.05;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = volume * 0.3;

      lfo.connect(lfoGain);
      lfoGain.connect(gainNode.gain);

      oscillator.connect(gainNode);
      gainNode.connect(this.musicGainNode!);

      oscillator.start(startTime);
      lfo.start(startTime);
    });
  }

  stopBiomeMusic(): void {
    if (this.currentBiomeMusic) {
      try {
        this.currentBiomeMusic.stop();
      } catch {
        // Already stopped
      }
      this.currentBiomeMusic = null;
    }
  }

  // Combo sound - pitch increases with combo
  playComboSound(comboCount: number): void {
    if (this.muted || !this.audioContext) return;

    const baseFreq = 400;
    const frequency = baseFreq + comboCount * 50;
    const definition: SoundDefinition = {
      type: 'tone',
      frequency: Math.min(frequency, 1200),
      duration: 0.15,
      volume: 0.3,
      fadeOut: true,
    };

    this.playSound(definition, this.sfxVolume);
  }

  // UI feedback sound
  playUISound(type: 'click' | 'hover' | 'error' | 'success'): void {
    const soundMap = {
      click: 'menuClick' as SoundEffect,
      hover: 'menuHover' as SoundEffect,
      error: 'hit' as SoundEffect,
      success: 'powerup' as SoundEffect,
    };

    this.playSfx(soundMap[type]);
  }

  // Clean up
  dispose(): void {
    this.stopBiomeMusic();
    if (this.audioContext) {
      void this.audioContext.close();
    }
  }
}

// Singleton instance
let audioSystemInstance: AudioSystem | null = null;

export function getAudioSystem(): AudioSystem {
  if (!audioSystemInstance) {
    audioSystemInstance = new AudioSystem();
  }
  return audioSystemInstance;
}
