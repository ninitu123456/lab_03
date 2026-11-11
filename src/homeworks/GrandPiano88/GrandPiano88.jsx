import { useCallback, useEffect, useState } from 'react';

import { MAX_VOICES, PianoAudioEngine } from './audio/PianoAudioEngine';
import { PianoKeyboard } from './components/PianoKeyboard';
import { PIANO_KEY_MAP } from './data/pianoNotes';
import {
  COMPUTER_KEY_MAP,
  useComputerKeyboardPiano,
} from './hooks/useComputerKeyboardPiano';

import './GrandPiano88.css';

// Immutable Set helpers: return the SAME Set when nothing changes,
// so React can bail out of a useless re-render.
function addNote(previous, midi) {
  if (previous.has(midi)) {
    return previous;
  }

  const next = new Set(previous);
  next.add(midi);
  return next;
}

function removeNote(previous, midi) {
  if (!previous.has(midi)) {
    return previous;
  }

  const next = new Set(previous);
  next.delete(midi);
  return next;
}

// Shortcut legend, computed once from the key map.
const SHORTCUT_LEGEND = [...COMPUTER_KEY_MAP].map(([code, midi]) => ({
  code,
  letter: code.replace('Key', ''),
  noteName: PIANO_KEY_MAP.get(midi).noteName,
}));

function GrandPiano88() {
  const [audioEngine] = useState(() => new PianoAudioEngine());
  const [pressedNotes, setPressedNotes] = useState(() => new Set());
  const [audioError, setAudioError] = useState('');

  // 1. Stable callbacks: required for React.memo on all 88 keys.
  const handleNoteOn = useCallback(
    (midi) => {
      try {
        audioEngine.noteOn(midi);
      } catch {
        setAudioError(
          'Unable to play audio. Your browser may not support the Web Audio API.',
        );
        return;
      }

      setPressedNotes((previous) => addNote(previous, midi));
    },
    [audioEngine],
  );

  const handleNoteOff = useCallback(
    (midi) => {
      audioEngine.noteOff(midi);
      setPressedNotes((previous) => removeNote(previous, midi));
    },
    [audioEngine],
  );

  // 2. Computer keyboard input (e.code).
  useComputerKeyboardPiano(handleNoteOn, handleNoteOff);

  // 3. Release the AudioContext on unmount.
  useEffect(() => {
    return () => {
      void audioEngine.dispose();
    };
  }, [audioEngine]);

  // 4. Derived during render, no extra state.
  const heldNoteNames = [...pressedNotes]
    .toSorted((a, b) => a - b)
    .map((midi) => PIANO_KEY_MAP.get(midi).noteName)
    .join(' ');

  return (
    <main className="grand-piano">
      <header className="grand-piano__header">
        <p className="grand-piano__eyebrow">HOMEWORK 2</p>
        <h1>Grand Piano 88</h1>
        <p className="grand-piano__subtitle">
          88-key polyphonic piano. Up to {MAX_VOICES} notes sound at once;
          the oldest note is replaced first.
        </p>
      </header>

      <section
        className="grand-piano__panel"
        aria-labelledby="piano-keyboard-heading"
      >
        <h2 id="piano-keyboard-heading">Keyboard</h2>

        <PianoKeyboard
          pressedNotes={pressedNotes}
          onNoteOn={handleNoteOn}
          onNoteOff={handleNoteOff}
        />

        <p className="grand-piano__held">
          Held notes: <strong>{heldNoteNames || 'none'}</strong>
        </p>

        {audioError && (
          <p className="grand-piano__error" role="alert">
            {audioError}
          </p>
        )}
      </section>

      <section
        className="grand-piano__panel"
        aria-labelledby="piano-shortcuts-heading"
      >
        <h2 id="piano-shortcuts-heading">Computer keyboard shortcuts</h2>

        <ul className="grand-piano__legend">
          {SHORTCUT_LEGEND.map((item) => (
            <li key={item.code}>
              <kbd>{item.letter}</kbd>
              <span>{item.noteName}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default GrandPiano88;
