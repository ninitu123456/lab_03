import { describe, expect, it } from 'vitest';

import {
  BLACK_KEYS,
  PIANO_KEYS,
  PIANO_KEY_MAP,
  TOTAL_BLACK_KEYS,
  TOTAL_PIANO_KEYS,
  TOTAL_WHITE_KEYS,
  WHITE_KEYS,
  isBlackKey,
} from '../pianoNotes';

describe('Piano Notes', () => {
  it('generates exactly 88 keys', () => {
    expect(PIANO_KEYS).toHaveLength(TOTAL_PIANO_KEYS);
  });

  it('generates 52 white keys and 36 black keys', () => {
    expect(WHITE_KEYS).toHaveLength(TOTAL_WHITE_KEYS);
    expect(BLACK_KEYS).toHaveLength(TOTAL_BLACK_KEYS);
  });

  it('starts at A0 and ends at C8', () => {
    expect(PIANO_KEYS[0]).toMatchObject({ midi: 21, noteName: 'A0', isBlack: false });
    expect(PIANO_KEYS.at(-1)).toMatchObject({ midi: 108, noteName: 'C8', isBlack: false });
  });

  it('classifies black keys correctly', () => {
    expect(isBlackKey(60)).toBe(false); // C4
    expect(isBlackKey(61)).toBe(true); // C#4
    expect(isBlackKey(64)).toBe(false); // E4
    expect(isBlackKey(70)).toBe(true); // A#4
  });

  it('uses unique ids and MIDI numbers', () => {
    const ids = new Set(PIANO_KEYS.map((key) => key.id));
    expect(ids.size).toBe(TOTAL_PIANO_KEYS);
    expect(PIANO_KEY_MAP.size).toBe(TOTAL_PIANO_KEYS);
  });

  it('assigns the correct frequency to A4', () => {
    expect(PIANO_KEY_MAP.get(69).frequency).toBe(440);
  });

  it('assigns sequential white key indexes', () => {
    WHITE_KEYS.forEach((key, index) => {
      expect(key.whiteIndex).toBe(index);
    });
  });

  it('places each black key after its left white key', () => {
    const asharp0 = PIANO_KEY_MAP.get(22); // A#0
    expect(asharp0.whiteIndex).toBe(0); // right after A0
  });

  it('is immutable', () => {
    expect(Object.isFrozen(PIANO_KEYS)).toBe(true);
    expect(Object.isFrozen(PIANO_KEYS[0])).toBe(true);
  });
});
