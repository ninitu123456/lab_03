import { vi } from 'vitest';

class FakeAudioParam {
  constructor(value = 0) {
    this.value = value;
    this.setValueAtTime = vi.fn((nextValue) => {
      this.value = nextValue;
    });
    this.linearRampToValueAtTime = vi.fn();
    this.exponentialRampToValueAtTime = vi.fn();
    this.cancelScheduledValues = vi.fn();
  }
}

class FakeGainNode {
  constructor() {
    this.gain = new FakeAudioParam(1);
    this.connect = vi.fn();
    this.disconnect = vi.fn();
  }
}

class FakeOscillatorNode extends EventTarget {
  constructor() {
    super();
    this.type = 'sine';
    this.frequency = new FakeAudioParam(440);
    this.connect = vi.fn();
    this.disconnect = vi.fn();
    this.start = vi.fn();
    this.stop = vi.fn();
  }

  // Simulates the browser finishing playback.
  finish() {
    this.dispatchEvent(new Event('ended'));
  }
}

export class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.destination = {};
    this.oscillators = [];
    this.gains = [];
    this.resume = vi.fn(async () => {
      this.state = 'running';
    });
    this.close = vi.fn(async () => {
      this.state = 'closed';
    });
  }

  createOscillator() {
    const oscillator = new FakeOscillatorNode();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    const gain = new FakeGainNode();
    this.gains.push(gain);
    return gain;
  }
}
