import { useEffect, useRef } from 'react';

// Physical keys laid out like a piano, starting at Middle C (MIDI 60):
// A  W  S  E  D  F  T  G  Y  H  U  J  K  O  L
// C4 C# D  D# E  F  F# G  G# A  A# B  C5 C# D5
const MIDDLE_C_MIDI = 60;
const PIANO_ROW_LETTERS = 'AWSEDFTGYHUJKOL';

export const COMPUTER_KEY_MAP = new Map(
  [...PIANO_ROW_LETTERS].map((letter, index) => [
    `Key${letter}`,
    MIDDLE_C_MIDI + index,
  ]),
);

// Elements where shortcuts must not fire.
const IGNORED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isTypingTarget(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  return (
    IGNORED_TAGS.has(target.tagName) ||
    target.isContentEditable ||
    Boolean(target.closest('[contenteditable="true"]'))
  );
}

/**
 * Plays the piano from the computer keyboard using e.code
 * (physical key position, so Vietnamese IME such as UniKey
 * never breaks the shortcuts).
 */
export function useComputerKeyboardPiano(
  onNoteOn,
  onNoteOff,
  { keyMap = COMPUTER_KEY_MAP, isEnabled = true } = {},
) {
  // 1. Always call the LATEST callbacks without re-subscribing.
  //    Re-subscribing would lose the held-key state (see HW1 audit).
  const callbacksRef = useRef({ onNoteOn, onNoteOff });

  useEffect(() => {
    callbacksRef.current = { onNoteOn, onNoteOff };
  });

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    // 2. Physical key code -> MIDI note currently held.
    const heldCodes = new Map();

    const releaseCode = (code) => {
      const midi = heldCodes.get(code);

      if (midi === undefined) {
        return;
      }

      heldCodes.delete(code);
      callbacksRef.current.onNoteOff(midi);
    };

    const releaseAll = () => {
      [...heldCodes.keys()].forEach(releaseCode);
    };

    // 3. keydown: anti-repeat guard + input focus isolation.
    const handleKeyDown = (event) => {
      if (event.repeat) {
        return;
      }

      // Leave browser shortcuts such as Ctrl+S / Cmd+W alone.
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      const midi = keyMap.get(event.code);

      if (midi === undefined) {
        return;
      }

      event.preventDefault();

      if (heldCodes.has(event.code)) {
        return;
      }

      heldCodes.set(event.code, midi);
      callbacksRef.current.onNoteOn(midi);
    };

    const handleKeyUp = (event) => {
      releaseCode(event.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 4. Window lost focus: keyup will never arrive, so release now.
    window.addEventListener('blur', releaseAll);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', releaseAll);

      // 5. No stuck notes after unmount or disable.
      releaseAll();
    };
  }, [keyMap, isEnabled]);
}
