// src/homeworks/DrumMachine/audio/DrumAudioEngine.js

export class DrumAudioEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.analyser = null;

    // Track active audio sources for resource management.
    this.activeSources = new Set();

    // Reuse one noise buffer instead of generating it every hit.
    this.noiseBuffer = null;
  }

  // 1. Initialize AudioContext only when needed.
  initialize() {
    if (this.audioContext) {
      return this.audioContext;
    }

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported.');
    }

    this.audioContext = new AudioContextClass();

    // Master volume.
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.7;

    // Audio analyser for the visual meter.
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Audio signal chain.
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    return this.audioContext;
  }

  // 2. Resume AudioContext after browser suspension.
  async resume() {
    const context = this.initialize();

    if (context.state === 'suspended') {
      await context.resume();
    }

    return context;
  }

  // 3. Generate reusable white noise.
  getNoiseBuffer() {
    const context = this.initialize();

    if (this.noiseBuffer) {
      return this.noiseBuffer;
    }

    const bufferSize = context.sampleRate * 2;

    const buffer = context.createBuffer(
      1,
      bufferSize,
      context.sampleRate,
    );

    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
      channelData[i] = Math.random() * 2 - 1;
    }

    this.noiseBuffer = buffer;

    return buffer;
  }

  // 4. Track source lifecycle.
  trackSource(source) {
    this.activeSources.add(source);

    source.addEventListener(
      'ended',
      () => {
        this.activeSources.delete(source);
        source.disconnect();
      },
      { once: true },
    );
  }

  // 5. Create an oscillator-based drum voice.
  playOscillator({
    startFrequency,
    endFrequency,
    duration,
    volume = 0.8,
    waveform = 'sine',
  }) {
    const context = this.initialize();
    const now = context.currentTime;

    const oscillator = context.createOscillator();
    const envelope = context.createGain();

    oscillator.type = waveform;

    oscillator.frequency.setValueAtTime(
      startFrequency,
      now,
    );

    if (endFrequency !== startFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, endFrequency),
        now + duration,
      );
    }

    envelope.gain.setValueAtTime(volume, now);
    envelope.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration,
    );

    oscillator.connect(envelope);
    envelope.connect(this.masterGain);

    this.trackSource(oscillator);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
  }

  // 6. Create a noise-based drum voice.
  playNoise({
    duration,
    volume = 0.5,
    frequency = 10000,
  }) {
    const context = this.initialize();
    const now = context.currentTime;

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();

    source.buffer = this.getNoiseBuffer();

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(frequency, now);

    envelope.gain.setValueAtTime(volume, now);
    envelope.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration,
    );

    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.masterGain);

    this.trackSource(source);

    source.start(now);
    source.stop(now + duration + 0.01);
  }

  // 7. Trigger a drum sound by its sound type.
  async triggerPad(soundType) {
    await this.resume();

    switch (soundType) {
      case 'kick':
        this.playOscillator({
          startFrequency: 150,
          endFrequency: 45,
          duration: 0.3,
          volume: 1,
        });
        break;

      case 'snare':
        this.playOscillator({
          startFrequency: 180,
          endFrequency: 100,
          duration: 0.12,
          volume: 0.4,
        });

        this.playNoise({
          duration: 0.18,
          volume: 0.7,
          frequency: 1200,
        });
        break;

      case 'closed-hat':
        this.playNoise({
          duration: 0.06,
          volume: 0.35,
          frequency: 7000,
        });
        break;

      case 'open-hat':
        this.playNoise({
          duration: 0.5,
          volume: 0.3,
          frequency: 5000,
        });
        break;

      case 'low-tom':
        this.playOscillator({
          startFrequency: 130,
          endFrequency: 65,
          duration: 0.35,
          volume: 0.75,
        });
        break;

      case 'crash':
        this.playNoise({
          duration: 1.2,
          volume: 0.45,
          frequency: 3500,
        });
        break;

      case 'ride':
        this.playNoise({
          duration: 0.7,
          volume: 0.25,
          frequency: 6000,
        });
        break;

      default:
        console.warn(`Unknown drum sound: ${soundType}`);
    }
  }

  // 8. Expose analyser data for the visual meter.
  getAudioLevel() {
    if (!this.analyser) {
      return 0;
    }

    const samples = new Uint8Array(
      this.analyser.fftSize,
    );

    this.analyser.getByteTimeDomainData(samples);

    let sumSquares = 0;

    for (const sample of samples) {
      const normalized = (sample - 128) / 128;
      sumSquares += normalized * normalized;
    }

    return Math.sqrt(sumSquares / samples.length);
  }

  // 9. Stop all currently active sources.
  stopAll() {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // Source may already have stopped.
      }
    }

    this.activeSources.clear();
  }

  // 10. Release all audio resources.
  async dispose() {
    this.stopAll();

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
      this.analyser = null;
      this.noiseBuffer = null;
    }
  }
}