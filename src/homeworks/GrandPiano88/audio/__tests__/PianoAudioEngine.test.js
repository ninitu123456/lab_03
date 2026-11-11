import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_VOICES, PianoAudioEngine } from '../PianoAudioEngine';
import { FakeAudioContext } from './fakeAudioContext';

// Values chosen to be exact in binary floating point.
const TEST_ENVELOPE = {
  attack: 0.5,
  decay: 0.25,
  sustain: 0.5,
  release: 0.5,
};

describe('PianoAudioEngine', () => {
  let engine;

  beforeEach(() => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    engine = new PianoAudioEngine({ envelope: TEST_ENVELOPE });
  });

  afterEach(async () => {
    await engine.dispose();
    vi.unstubAllGlobals();
  });

  it('plays a note at the correct frequency', () => {
    engine.noteOn(69);

    const [oscillator] = engine.audioContext.oscillators;

    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(440, 0);
    expect(oscillator.start).toHaveBeenCalledWith(0);
    expect(engine.getActiveVoiceCount()).toBe(1);
    expect(engine.getActiveNotes()).toEqual([69]);
  });

  it('applies the attack and decay stages', () => {
    engine.noteOn(60, 1);

    // gains[0] is the master gain, gains[1] is the voice gain.
    const voiceGain = engine.audioContext.gains[1].gain;

    expect(voiceGain.setValueAtTime).toHaveBeenCalledWith(0, 0);
    expect(voiceGain.linearRampToValueAtTime).toHaveBeenNthCalledWith(1, 1, 0.5);
    expect(voiceGain.linearRampToValueAtTime).toHaveBeenNthCalledWith(2, 0.5, 0.75);
  });

  it('limits polyphony to 8 voices using FIFO stealing', () => {
    for (let midi = 60; midi <= 68; midi += 1) {
      engine.noteOn(midi);
    }

    const activeNotes = engine.getActiveNotes();

    expect(engine.getActiveVoiceCount()).toBe(MAX_VOICES);
    expect(activeNotes).not.toContain(60); // Oldest voice was stolen.
    expect(activeNotes).toContain(61);
    expect(activeNotes).toContain(68);
    expect(engine.audioContext.oscillators[0].stop).toHaveBeenCalled();
  });

  it('releases a note using the release stage', () => {
    engine.noteOn(60);

    const context = engine.audioContext;
    const [oscillator] = context.oscillators;
    const voiceGain = context.gains[1].gain;

    context.currentTime = 1;

    expect(engine.noteOff(60)).toBe(true);
    expect(voiceGain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 1.5);
    expect(oscillator.stop.mock.calls[0][0]).toBeCloseTo(1.52);

    // Releasing voice still sounds, but is no longer held.
    expect(engine.getActiveVoiceCount()).toBe(1);
    expect(engine.getActiveNotes()).toEqual([]);

    oscillator.finish();

    expect(engine.getActiveVoiceCount()).toBe(0);
    expect(oscillator.disconnect).toHaveBeenCalled();
  });

  it('does not duplicate voices when the same key is re-triggered', () => {
    engine.noteOn(60);
    engine.noteOn(60);

    expect(engine.getActiveVoiceCount()).toBe(1);
    expect(engine.getActiveNotes()).toEqual([60]);
    expect(engine.audioContext.oscillators[0].stop).toHaveBeenCalled();
  });

  it('rejects notes outside the piano range', () => {
    expect(() => engine.noteOn(20)).toThrow(RangeError);
    expect(() => engine.noteOn(109)).toThrow(RangeError);
    expect(() => engine.noteOn(60.5)).toThrow(RangeError);
  });

  it('returns false when releasing a note that is not playing', () => {
    expect(engine.noteOff(60)).toBe(false);
  });

  it('rejects an invalid voice limit', () => {
    expect(() => new PianoAudioEngine({ maxVoices: 0 })).toThrow(RangeError);
  });

  it('releases audio resources on dispose', async () => {
    engine.noteOn(60);

    const context = engine.audioContext;

    await engine.dispose();

    expect(context.close).toHaveBeenCalled();
    expect(engine.getActiveVoiceCount()).toBe(0);
    expect(engine.audioContext).toBeNull();
  });
});
