import { memo } from 'react';

import './PianoKey.css';

// Keys that activate a focused piano key (W3C e.code, never keyCode).
const ACTIVATION_CODES = new Set(['Space', 'Enter', 'NumpadEnter']);

/**
 * One piano key.
 *
 * Wrapped in React.memo: it only re-renders when one of its own
 * primitive props changes (in practice: isPressed flips).
 * The parent MUST pass stable onNoteOn / onNoteOff callbacks.
 */
export const PianoKey = memo(function PianoKey({
  midi,
  noteName,
  isBlack,
  isPressed,
  whiteIndex,
  tabIndex = 0,
  onNoteOn,
  onNoteOff,
}) {
  // 1. Mouse / touch / pen.
  const handlePointerDown = (event) => {
    // Only the primary button (left click / touch / pen tip).
    if (event.button !== 0) {
      return;
    }

    // Keep receiving pointerup even if the pointer leaves the key.
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onNoteOn(midi);
  };

  const handlePointerEnd = () => {
    onNoteOff(midi);
  };

  // 2. Keyboard (WCAG 2.1.1): Space / Enter on the focused key.
  const handleKeyDown = (event) => {
    if (!ACTIVATION_CODES.has(event.code)) {
      return;
    }

    event.preventDefault();

    // Block OS auto-repeat while the key is held.
    if (event.repeat) {
      return;
    }

    onNoteOn(midi);
  };

  const handleKeyUp = (event) => {
    if (!ACTIVATION_CODES.has(event.code)) {
      return;
    }

    event.preventDefault();
    onNoteOff(midi);
  };

  return (
    <button
      type="button"
      className={`piano-key ${isBlack ? 'piano-key--black' : 'piano-key--white'}`}
      style={{ '--white-index': whiteIndex }}
      aria-pressed={isPressed}
      tabIndex={tabIndex}
      data-midi={midi}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className="piano-key__label">{noteName}</span>
    </button>
  );
});
