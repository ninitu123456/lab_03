
import { describe, expect, it } from 'vitest';

import {
  isValidMidiNote,
  midiToFrequency,
  midiToNoteName,
} from '../midi';

describe('MIDI Utilities', () => {
  describe('isValidMidiNote', () => {
    it('accepts valid MIDI note numbers', () => {
      expect(isValidMidiNote(0)).toBe(true);
      expect(isValidMidiNote(69)).toBe(true);
      expect(isValidMidiNote(127)).toBe(true);
    });

    it('rejects invalid MIDI note numbers', () => {
      expect(isValidMidiNote(-1)).toBe(false);
      expect(isValidMidiNote(128)).toBe(false);
      expect(isValidMidiNote(60.5)).toBe(false);
      expect(isValidMidiNote('60')).toBe(false);
    });
  });

  describe('midiToFrequency', () => {
    it('returns 440 Hz for A4', () => {
      expect(midiToFrequency(69)).toBe(440);
    });

    it('calculates C4 frequency correctly', () => {
      expect(midiToFrequency(60)).toBeCloseTo(261.63, 2);
    });

    it('calculates A5 frequency correctly', () => {
      expect(midiToFrequency(81)).toBe(880);
    });

    it('throws RangeError for invalid MIDI values', () => {
      expect(() => midiToFrequency(-1)).toThrow(RangeError);
      expect(() => midiToFrequency(128)).toThrow(RangeError);
    });
  });

  describe('midiToNoteName', () => {
    it('converts natural notes correctly', () => {
      expect(midiToNoteName(60)).toBe('C4');
      expect(midiToNoteName(62)).toBe('D4');
      expect(midiToNoteName(69)).toBe('A4');
    });

    it('converts sharp notes correctly', () => {
      expect(midiToNoteName(61)).toBe('C#4');
      expect(midiToNoteName(66)).toBe('F#4');
    });

    it('supports the complete piano range', () => {
      expect(midiToNoteName(21)).toBe('A0');
      expect(midiToNoteName(108)).toBe('C8');
    });

    it('throws RangeError for invalid MIDI values', () => {
      expect(() => midiToNoteName(-1)).toThrow(RangeError);
      expect(() => midiToNoteName(128)).toThrow(RangeError);
    });
  });
});
