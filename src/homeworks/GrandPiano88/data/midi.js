
/**
 * MIDI Utilities
 *
 * Provides helper functions for converting MIDI note numbers
 * into frequencies and musical note names.
 */

// Standard MIDI range.
export const MIDI_MIN = 0;
export const MIDI_MAX = 127;

// Standard piano range: A0 to C8.
export const PIANO_MIN_MIDI = 21;
export const PIANO_MAX_MIDI = 108;

// Standard tuning reference.
export const A4_FREQUENCY = 440;
export const A4_MIDI = 69;

// Number of semitones in one octave.
export const SEMITONES_PER_OCTAVE = 12;

// Musical note names using sharps.
export const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

/**
 * Validates a MIDI note number.
 *
 * @param {number} midi - MIDI note number.
 * @returns {boolean}
 */
export function isValidMidiNote(midi) {
  return (
    Number.isInteger(midi) &&
    midi >= MIDI_MIN &&
    midi <= MIDI_MAX
  );
}

/**
 * Converts a MIDI note number to its frequency.
 *
 * Formula:
 * frequency = 440 * 2^((midi - 69) / 12)
 *
 * @param {number} midi - MIDI note number.
 * @returns {number} Frequency in Hz.
 */
export function midiToFrequency(midi) {
  if (!isValidMidiNote(midi)) {
    throw new RangeError('MIDI note must be an integer between 0 and 127.');
  }

  return (
    A4_FREQUENCY *
    2 ** ((midi - A4_MIDI) / SEMITONES_PER_OCTAVE)
  );
}

/**
 * Converts a MIDI note number to a musical note name.
 *
 * Examples:
 * 60 -> C4
 * 69 -> A4
 * 108 -> C8
 *
 * @param {number} midi - MIDI note number.
 * @returns {string} Musical note name.
 */
export function midiToNoteName(midi) {
  if (!isValidMidiNote(midi)) {
    throw new RangeError('MIDI note must be an integer between 0 and 127.');
  }

  const noteIndex = midi % SEMITONES_PER_OCTAVE;

  const octave = Math.floor(
    midi / SEMITONES_PER_OCTAVE,
  ) - 1;

  return `${NOTE_NAMES[noteIndex]}${octave}`;
}
