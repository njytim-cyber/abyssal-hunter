/**
 * BGMManager - Background Music Management System
 * Handles music playback with crossfading and volume control
 */

import bossBattleBGM from '../assets/bgm/boss-battle.mp3';
import finalBossBGM from '../assets/bgm/final-boss.mp3';
import gameOverBGM from '../assets/bgm/game-over.mp3';
import gameplayBGM from '../assets/bgm/gameplay.mp3';
import mainMenuBGM from '../assets/bgm/main-menu.mp3';
import shopBGM from '../assets/bgm/shop.mp3';

export type BGMTrack = 'menu' | 'gameplay' | 'boss' | 'finalBoss' | 'gameOver' | 'shop';

interface TrackInfo {
  audio: HTMLAudioElement;
  name: string;
}

export class BGMManager {
  private tracks: Map<BGMTrack, TrackInfo>;
  private currentTrack: BGMTrack | null = null;
  private volume: number = 0.3; // Default 30% volume
  private muted: boolean = false;
  private crossfadeDuration: number = 300; // 300ms for quick transitions

  constructor() {
    this.tracks = new Map();
    this.initTracks();
  }

  private initTracks(): void {
    // Initialize all audio elements
    const trackData: [BGMTrack, string, string][] = [
      ['menu', mainMenuBGM, 'Main Menu'],
      ['gameplay', gameplayBGM, 'Gameplay'],
      ['boss', bossBattleBGM, 'Boss Battle'],
      ['finalBoss', finalBossBGM, 'Final Boss'],
      ['gameOver', gameOverBGM, 'Game Over'],
      ['shop', shopBGM, 'Shop'],
    ];

    trackData.forEach(([key, src, name]) => {
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0;
      audio.preload = 'auto';
      this.tracks.set(key, { audio, name });
    });
  }

  /**
   * Play a track with optional crossfade
   */
  async play(track: BGMTrack, crossfade: boolean = true): Promise<void> {
    // Don't restart the same track
    if (this.currentTrack === track) {
      const trackInfo = this.tracks.get(track);
      if (trackInfo && !trackInfo.audio.paused) {
        return;
      }
    }

    const newTrackInfo = this.tracks.get(track);
    if (!newTrackInfo) return;

    const oldTrackInfo = this.currentTrack ? this.tracks.get(this.currentTrack) : null;

    if (crossfade && oldTrackInfo && !oldTrackInfo.audio.paused) {
      // Crossfade between tracks
      await this.crossfade(oldTrackInfo.audio, newTrackInfo.audio);
    } else {
      // Stop old track immediately
      if (oldTrackInfo) {
        oldTrackInfo.audio.pause();
        oldTrackInfo.audio.currentTime = 0;
        oldTrackInfo.audio.volume = 0;
      }

      // Start new track
      newTrackInfo.audio.volume = this.muted ? 0 : this.volume;
      try {
        await newTrackInfo.audio.play();
      } catch (err) {
        console.warn('BGM playback failed:', err);
      }
    }

    this.currentTrack = track;
  }

  /**
   * Crossfade between two tracks
   */
  private async crossfade(oldAudio: HTMLAudioElement, newAudio: HTMLAudioElement): Promise<void> {
    const steps = 30;
    const stepDuration = this.crossfadeDuration / steps;
    const volumeStep = this.volume / steps;

    // Start new track at 0 volume
    newAudio.volume = 0;
    try {
      await newAudio.play();
    } catch (err) {
      console.warn('BGM playback failed:', err);
      return;
    }

    // Gradually fade out old, fade in new
    return new Promise(resolve => {
      let step = 0;
      const interval = setInterval(() => {
        step++;

        if (!this.muted) {
          oldAudio.volume = Math.max(0, this.volume - volumeStep * step);
          newAudio.volume = Math.min(this.volume, volumeStep * step);
        }

        if (step >= steps) {
          clearInterval(interval);
          oldAudio.pause();
          oldAudio.currentTime = 0;
          oldAudio.volume = 0;
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * Stop all music
   */
  stop(fade: boolean = true): void {
    if (!this.currentTrack) return;

    const trackInfo = this.tracks.get(this.currentTrack);
    if (!trackInfo) return;

    if (fade) {
      void this.fadeOut(trackInfo.audio).then(() => {
        trackInfo.audio.pause();
        trackInfo.audio.currentTime = 0;
      });
    } else {
      trackInfo.audio.pause();
      trackInfo.audio.currentTime = 0;
      trackInfo.audio.volume = 0;
    }

    this.currentTrack = null;
  }

  /**
   * Fade out a track
   */
  private async fadeOut(audio: HTMLAudioElement): Promise<void> {
    const steps = 20;
    const stepDuration = 1000 / steps;
    const volumeStep = audio.volume / steps;

    return new Promise(resolve => {
      let step = 0;
      const interval = setInterval(() => {
        step++;
        audio.volume = Math.max(0, audio.volume - volumeStep);

        if (step >= steps || audio.volume === 0) {
          clearInterval(interval);
          audio.volume = 0;
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * Pause current track
   */
  pause(): void {
    if (!this.currentTrack) return;

    const trackInfo = this.tracks.get(this.currentTrack);
    if (trackInfo) {
      trackInfo.audio.pause();
    }
  }

  /**
   * Resume current track
   */
  resume(): void {
    if (!this.currentTrack) return;

    const trackInfo = this.tracks.get(this.currentTrack);
    if (trackInfo) {
      trackInfo.audio.play().catch(err => {
        console.warn('BGM resume failed:', err);
      });
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));

    if (!this.muted && this.currentTrack) {
      const trackInfo = this.tracks.get(this.currentTrack);
      if (trackInfo) {
        trackInfo.audio.volume = this.volume;
      }
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.muted = !this.muted;

    if (this.currentTrack) {
      const trackInfo = this.tracks.get(this.currentTrack);
      if (trackInfo) {
        trackInfo.audio.volume = this.muted ? 0 : this.volume;
      }
    }

    return this.muted;
  }

  /**
   * Get mute state
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Get current track name
   */
  getCurrentTrack(): string | null {
    if (!this.currentTrack) return null;
    const trackInfo = this.tracks.get(this.currentTrack);
    return trackInfo ? trackInfo.name : null;
  }

  /**
   * Preload all tracks (call after user interaction)
   */
  preloadAll(): void {
    this.tracks.forEach(trackInfo => {
      trackInfo.audio.load();
    });
  }
}

// Singleton instance
export const bgmManager = new BGMManager();
