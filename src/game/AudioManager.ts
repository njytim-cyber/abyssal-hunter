import { CONFIG } from './config';

/**
 * AudioManager - Procedural sound effects using Web Audio API
 * No external audio files needed - all sounds are synthesized
 */
export class AudioManager {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private ambientOsc: OscillatorNode | null = null;
    private ambientGain: GainNode | null = null;
    private muted: boolean = false;

    constructor() {
        // AudioContext is created on first user interaction
    }

    private ensureContext(): boolean {
        if (!this.ctx) {
            try {
                this.ctx = new AudioContext();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = CONFIG.audio.masterVolume;
                this.masterGain.connect(this.ctx.destination);
            } catch {
                console.warn('Web Audio API not supported');
                return false;
            }
        }

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        return true;
    }

    /**
     * Toggle mute state
     */
    toggleMute(): boolean {
        this.muted = !this.muted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : CONFIG.audio.masterVolume;
        }
        return this.muted;
    }

    isMuted(): boolean {
        return this.muted;
    }

    /**
     * Dash/whoosh sound - filtered noise burst
     */
    playDash(): void {
        if (!this.ensureContext() || !this.ctx || !this.masterGain || this.muted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    /**
     * Eat/pop sound - quick bubble pop
     */
    playEat(size: number = 1): void {
        if (!this.ensureContext() || !this.ctx || !this.masterGain || this.muted) return;

        const baseFreq = 300 + Math.min(size, 5) * 100;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.05);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    /**
     * Level up sound - ascending arpeggio
     */
    playLevelUp(): void {
        if (!this.ensureContext() || !this.ctx || !this.masterGain || this.muted) return;

        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            const startTime = this.ctx!.currentTime + i * 0.1;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    /**
     * Death sound - descending tone
     */
    playDeath(): void {
        if (!this.ensureContext() || !this.ctx || !this.masterGain || this.muted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.8);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.8);
    }

    /**
     * Combo sound - quick ascending blip
     */
    playCombo(multiplier: number): void {
        if (!this.ensureContext() || !this.ctx || !this.masterGain || this.muted) return;

        const baseFreq = 400 + multiplier * 100;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    /**
     * Start ambient ocean drone
     */
    startAmbient(): void {
        if (!this.ensureContext() || !this.ctx || !this.masterGain || this.ambientOsc) return;

        this.ambientOsc = this.ctx.createOscillator();
        this.ambientGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        this.ambientOsc.type = 'sine';
        this.ambientOsc.frequency.value = 40;

        filter.type = 'lowpass';
        filter.frequency.value = 100;

        this.ambientGain.gain.value = this.muted ? 0 : 0.08;

        this.ambientOsc.connect(filter);
        filter.connect(this.ambientGain);
        this.ambientGain.connect(this.masterGain);

        this.ambientOsc.start();
    }

    /**
     * Stop ambient
     */
    stopAmbient(): void {
        if (this.ambientOsc) {
            this.ambientOsc.stop();
            this.ambientOsc = null;
            this.ambientGain = null;
        }
    }
}

// Singleton instance
export const audioManager = new AudioManager();
