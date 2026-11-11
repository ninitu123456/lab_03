/**
 * Piano Audio Engine
 *
 * Polyphonic synthesizer with:
 * - Up to 8 simultaneous voices.
 * - FIFO voice stealing via ES6 Map insertion order (midi -> voice).
 * - ADSR envelope per voice.
 * - Click-free exponential fade before every forced stop.
 */

import { PIANO_KEY_MAP } from '../data/pianoNotes';
import {
  DEFAULT_ADSR,
  scheduleAttackDecay,
  scheduleFadeOut,
  scheduleRelease,
  validateEnvelope,
} from './adsr';

export const MAX_VOICES = 8;

// Click-free fade used before a voice is force-stopped (40 ms).
export const CLICK_FREE_FADE_TIME = 0.04;

// Small padding so the oscillator stops after the gain is silent.
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

    // ES6 Map preserves insertion order (FIFO):
    // voices.keys().next().value is always the OLDEST midi note.
    // Shape: midi -> { midi, oscillator, gain, startedAt, isReleasing }
    this.voices = new Map();
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

  // 3. Start a note. Returns its frequency in Hz.
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

    // Re-triggering a key (held or still releasing) restarts it.
    // Deleting first also moves the note to the END of the FIFO order.
    if (this.voices.has(midi)) {
      this.stealVoice(midi);
    }

    // FIFO voice stealing: the first Map key is the oldest note.
    while (this.voices.size >= this.maxVoices) {
      const oldestMidi = this.voices.keys().next().value;
      this.stealVoice(oldestMidi);
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
      midi,
      oscillator,
      gain,
      startedAt: now,
      isReleasing: false,
    };

    oscillator.addEventListener(
      'ended',
      () => this.cleanupVoice(voice),
      { once: true },
    );

    this.voices.set(midi, voice);
    oscillator.start(now);

    return key.frequency;
  }

  // 4. Release a held note using the ADSR release stage.
  noteOff(midi) {
    const voice = this.voices.get(midi);

    if (!voice || voice.isReleasing || !this.audioContext) {
      return false;
    }

    const now = this.audioContext.currentTime;
    const endTime = scheduleRelease(voice.gain.gain, now, this.envelope);

    // The voice keeps counting toward polyphony until it is silent.
    voice.isReleasing = true;
    voice.oscillator.stop(endTime + STOP_PADDING);

    return true;
  }

  // 5. Force-stop a voice with a click-free 40 ms exponential fade.
  stealVoice(midi) {
    const voice = this.voices.get(midi);

    if (!voice) {
      return;
    }

    const now = this.audioContext.currentTime;
    const fadeEnd = scheduleFadeOut(voice.gain.gain, now, CLICK_FREE_FADE_TIME);

    this.voices.delete(midi);

    try {
      voice.oscillator.stop(fadeEnd + STOP_PADDING);
    } catch {
      // Oscillator may already have stopped.
    }
  }

  // 6. Disconnect nodes after a voice has finished.
  cleanupVoice(voice) {
    // Only delete if a newer voice has not replaced this midi key.
    if (this.voices.get(voice.midi) === voice) {
      this.voices.delete(voice.midi);
    }

    voice.oscillator.disconnect();
    voice.gain.disconnect();
  }

  // 7. Number of voices currently producing sound.
  getActiveVoiceCount() {
    return this.voices.size;
  }

  // 8. MIDI notes that are currently held down (oldest first).
  getActiveNotes() {
    return [...this.voices.values()]
      .filter((voice) => !voice.isReleasing)
      .map((voice) => voice.midi);
  }

  // 9. Silence every voice (used by Stop Sequence / unmount).
  stopAll() {
    for (const midi of [...this.voices.keys()]) {
      this.stealVoice(midi);
    }
  }

  // 10. Release all audio resources.
  async dispose() {
    this.stopAll();

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}
