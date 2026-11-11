/**
 * Piano Notes
 *
 * Generates the 88 keys of a standard piano (A0 to C8)
 * algorithmically from MIDI note numbers.
 */

import {
  PIANO_MAX_MIDI,
  PIANO_MIN_MIDI,
  SEMITONES_PER_OCTAVE,
  midiToFrequency,
  midiToNoteName,
} from './midi';

// Pitch classes of black keys: C#, D#, F#, G#, A#.
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

export const TOTAL_PIANO_KEYS = 88;
export const TOTAL_WHITE_KEYS = 52;
export const TOTAL_BLACK_KEYS = 36;

/**
 * Checks whether a MIDI note is a black key.
 *
 * @param {number} midi - MIDI note number.
 * @returns {boolean}
 */
export function isBlackKey(midi) {
  return BLACK_PITCH_CLASSES.has(midi % SEMITONES_PER_OCTAVE);
}

/**
 * Generates all 88 piano keys.
 *
 * whiteIndex:
 * - White key: its position among white keys (0..51).
 * - Black key: index of the white key on its left.
 *
 * @returns {ReadonlyArray<object>}
 */
export function generatePianoKeys() {
  const keys = [];
  let whiteCount = 0;

  for (let midi = PIANO_MIN_MIDI; midi <= PIANO_MAX_MIDI; midi += 1) {
    const isBlack = isBlackKey(midi);
    const noteName = midiToNoteName(midi);

    if (!isBlack) {
      whiteCount += 1;
    }

    keys.push(
      Object.freeze({
        id: `note-${midi}`,
        midi,
        noteName,
        octave: Math.floor(midi / SEMITONES_PER_OCTAVE) - 1,
        frequency: midiToFrequency(midi),
        isBlack,
        whiteIndex: whiteCount - 1,
      }),
    );
  }

  return Object.freeze(keys);
}

// Generated once at module load and shared by the whole app.
export const PIANO_KEYS = generatePianoKeys();

export const WHITE_KEYS = Object.freeze(
  PIANO_KEYS.filter((key) => !key.isBlack),
);

export const BLACK_KEYS = Object.freeze(
  PIANO_KEYS.filter((key) => key.isBlack),
);

// Fast lookup: MIDI number -> key.
export const PIANO_KEY_MAP = new Map(
  PIANO_KEYS.map((key) => [key.midi, key]),
);
