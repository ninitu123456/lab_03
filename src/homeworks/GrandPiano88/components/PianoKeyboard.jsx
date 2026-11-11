import { memo, useEffect, useRef, useState } from 'react';

import { PIANO_KEYS } from '../data/pianoNotes';
import { PianoKey } from './PianoKey';

import './PianoKeyboard.css';

// Middle C: initial keyboard focus and scroll position.
const MIDDLE_C_MIDI = 60;

/**
 * Renders all 88 keys from generated data (no hardcoded tags).
 *
 * Accessibility:
 * - Roving tabindex: the whole keyboard is ONE Tab stop.
 * - ArrowLeft / ArrowRight / Home / End move focus between keys.
 * - Keys stay in MIDI order in the DOM, so screen readers
 *   and focus order follow the musical order (A0 -> C8).
 */
export const PianoKeyboard = memo(function PianoKeyboard({
  keys = PIANO_KEYS,
  pressedNotes,
  onNoteOn,
  onNoteOff,
}) {
  const scrollerRef = useRef(null);
  const [focusedMidi, setFocusedMidi] = useState(MIDDLE_C_MIDI);

  // 1. Center Middle C once on mount (narrow screens start mid-keyboard).
  useEffect(() => {
    const scroller = scrollerRef.current;
    const middleC = scroller?.querySelector(`[data-midi="${MIDDLE_C_MIDI}"]`);

    if (!scroller || !middleC) {
      return;
    }

    scroller.scrollLeft =
      middleC.offsetLeft - scroller.clientWidth / 2 + middleC.offsetWidth / 2;
  }, []);

  // 2. Move focus to another key (roving tabindex).
  const focusKey = (midi) => {
    setFocusedMidi(midi);
    scrollerRef.current
      ?.querySelector(`[data-midi="${midi}"]`)
      ?.focus();
  };

  // 3. Arrow-key navigation, handled once on the group (event delegation).
  const handleKeyDown = (event) => {
    const currentIndex = keys.findIndex((key) => key.midi === focusedMidi);
    let nextIndex;

    switch (event.code) {
      case 'ArrowRight':
        nextIndex = Math.min(currentIndex + 1, keys.length - 1);
        break;
      case 'ArrowLeft':
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = keys.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    focusKey(keys[nextIndex].midi);
  };

  // 4. Keep roving focus in sync when a key is focused by click / Tab.
  const handleFocus = (event) => {
    const midi = Number(event.target.dataset.midi);

    if (Number.isInteger(midi)) {
      setFocusedMidi(midi);
    }
  };

  return (
    <div className="piano-keyboard__scroller" ref={scrollerRef}>
      <div
        role="group"
        aria-label="88-key piano keyboard, A0 to C8. Use arrow keys to move, Space or Enter to play."
        className="piano-keyboard"
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
      >
        {keys.map((key) => (
          <PianoKey
            key={key.id}
            midi={key.midi}
            noteName={key.noteName}
            isBlack={key.isBlack}
            isPressed={pressedNotes.has(key.midi)}
            whiteIndex={key.whiteIndex}
            tabIndex={key.midi === focusedMidi ? 0 : -1}
            onNoteOn={onNoteOn}
            onNoteOff={onNoteOff}
          />
        ))}
      </div>
    </div>
  );
});
