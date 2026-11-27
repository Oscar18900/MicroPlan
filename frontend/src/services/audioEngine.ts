import type { AmbientSoundType } from '../types/domain';

class OfflineAmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private activeType: AmbientSoundType = 'silence';

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public start(type: AmbientSoundType): void {
    if (type === 'silence') {
      this.stop();
      return;
    }
    if (this.activeType === type && this.sourceNode) {
      return;
    }
    this.stop();

    const ctx = this.ensureContext();
    if (!ctx) return;

    // Generate 3 seconds of noise buffer entirely locally (zero network)
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white_noise') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.28;
      }
    } else {
      // Soft pink/brownian rain-like noise
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.04 * white) / 1.04;
        lastOut = output[i];
        output[i] *= 1.6;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = type === 'white_noise' ? 1400 : 750;

    const gain = ctx.createGain();
    gain.gain.value = type === 'white_noise' ? 0.14 : 0.24;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    this.sourceNode = source;
    this.filterNode = filter;
    this.gainNode = gain;
    this.activeType = type;
  }

  public stop(): void {
    try {
      this.sourceNode?.stop();
      this.sourceNode?.disconnect();
      this.filterNode?.disconnect();
      this.gainNode?.disconnect();
    } catch {
      // Ignore already stopped nodes
    }
    this.sourceNode = null;
    this.filterNode = null;
    this.gainNode = null;
    this.activeType = 'silence';
  }
}

export const audioEngine = new OfflineAmbientAudioEngine();
