/**
 * Piano Audio Engine
 *
 * Polyphonic synthesizer with:
 * - Up to 8 simultaneous voices.
 * - FIFO voice stealing (oldest voice is replaced first).
 * - ADSR envelope per voice.
 */

import { PIANO_KEY_MAP } from '../data/pianoNotes';
import {
  DEFAULT_ADSR,
  scheduleAttackDecay,
  scheduleRelease,
  validateEnvelope,
} from './adsr';

export const MAX_VOICES = 8;

// Very short fade for stolen voices to avoid audible clicks.
const STEAL_FADE_TIME = 0.015;

// Small padding so the oscillator stops after the gain reaches 0.
const STOP_PADDING = 0.02;

export class PianoAudioEngine {
  constructor({ maxVoices = MAX_VOICES, envelope = DEFAULT_ADSR } = {}) {
    if (!Number.isInteger(maxVoices) || maxVoices < 1) {
      throw new RangeError('maxVoices must be a positive integer.');
    }

    this.maxVoices = maxVoices;
    this.envelope = validateEnvelope({ ...envelope });

    this.audioContext = null;
    this.masterGain = null;

    // A Map keeps insertion order: the first entry is always
    // the oldest voice, which makes FIFO stealing O(1).
    this.voices = new Map();
    this.nextVoiceId = 0;
  }

  // 1. Create the AudioContext lazily (after a user gesture).
  initialize() {
    if (this.audioContext) {
      return this.audioContext;
    }

    const AudioContextClass =
      globalThis.AudioContext || globalThis.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported.');
    }

    this.audioContext = new AudioContextClass();

    // Keep master volume low enough for 8 voices without clipping.
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.audioContext.destination);

    return this.audioContext;
  }

  // 2. Resume a suspended AudioContext.
  async resume() {
    const context = this.initialize();

    if (context.state === 'suspended') {
      await context.resume();
    }

    return context;
  }

  // 3. Find a voice that is still held (not releasing) for a note.
  findHeldVoice(midi) {
    for (const voice of this.voices.values()) {
      if (voice.midi === midi && !voice.isReleasing) {
        return voice;
      }
    }

    return null;
  }

  // 4. Start a note. Returns the new voice id.
  noteOn(midi, velocity = 0.8) {
    const key = PIANO_KEY_MAP.get(midi);

    if (!key) {
      throw new RangeError('MIDI note must be a piano key between 21 and 108.');
    }

    const context = this.initialize();

    if (context.state === 'suspended') {
      context.resume().catch(() => {
        // Ignored: the browser will resume on the next user gesture.
      });
    }

    // Re-triggering the same key replaces its previous voice.
    const heldVoice = this.findHeldVoice(midi);

    if (heldVoice) {
      this.stealVoice(heldVoice);
    }

    // FIFO voice stealing: remove the oldest voices first.
    while (this.voices.size >= this.maxVoices) {
      const oldestVoice = this.voices.values().next().value;
      this.stealVoice(oldestVoice);
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const peak = Math.min(Math.max(velocity, 0), 1);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(key.frequency, now);

    scheduleAttackDecay(gain.gain, now, peak, this.envelope);

    oscillator.connect(gain);
    gain.connect(this.masterGain);

    const voice = {
      id: this.nextVoiceId,
      midi,
      oscillator,
      gain,
      startedAt: now,
      isReleasing: false,
    };

    this.nextVoiceId += 1;

    oscillator.addEventListener(
      'ended',
      () => this.cleanupVoice(voice),
      { once: true },
    );

    this.voices.set(voice.id, voice);
    oscillator.start(now);

    return voice.id;
  }

  // 5. Release a note using the ADSR release stage.
  noteOff(midi) {
    const voice = this.findHeldVoice(midi);

    if (!voice || !this.audioContext) {
      return false;
    }

    const now = this.audioContext.currentTime;
    const endTime = scheduleRelease(voice.gain.gain, now, this.envelope);

    // The voice keeps counting toward polyphony until it is silent.
    voice.isReleasing = true;
    voice.oscillator.stop(endTime + STOP_PADDING);

    return true;
  }

  // 6. Quickly fade out and remove a voice.
  stealVoice(voice) {
    const now = this.audioContext.currentTime;

    this.voices.delete(voice.id);

    scheduleRelease(voice.gain.gain, now, {
      ...this.envelope,
      release: STEAL_FADE_TIME,
    });

    try {
      voice.oscillator.stop(now + STEAL_FADE_TIME + STOP_PADDING);
    } catch {
      // Oscillator may already have stopped.
    }
  }

  // 7. Disconnect nodes after a voice has finished.
  cleanupVoice(voice) {
    if (this.voices.get(voice.id) === voice) {
      this.voices.delete(voice.id);
    }

    voice.oscillator.disconnect();
    voice.gain.disconnect();
  }

  // 8. Number of voices currently producing sound.
  getActiveVoiceCount() {
    return this.voices.size;
  }

  // 9. MIDI notes that are currently held down.
  getActiveNotes() {
    return [...this.voices.values()]
      .filter((voice) => !voice.isReleasing)
      .map((voice) => voice.midi);
  }

  // 10. Stop every voice immediately.
  stopAll() {
    for (const voice of this.voices.values()) {
      try {
        voice.oscillator.stop();
      } catch {
        // Oscillator may already have stopped.
      }

      voice.oscillator.disconnect();
      voice.gain.disconnect();
    }

    this.voices.clear();
  }

  // 11. Release all audio resources.
  async dispose() {
    this.stopAll();

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}
