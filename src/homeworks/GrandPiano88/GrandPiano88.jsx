import { useCallback, useEffect, useState } from 'react';

import { MAX_VOICES, PianoAudioEngine } from './audio/PianoAudioEngine';
import { PianoKeyboard } from './components/PianoKeyboard';
import { TransportControls } from './components/TransportControls';
import { PIANO_KEY_MAP } from './data/pianoNotes';
import {
  COMPUTER_KEY_MAP,
  useComputerKeyboardPiano,
} from './hooks/useComputerKeyboardPiano';
import { usePianoSequencer } from './hooks/usePianoSequencer';

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

  // 1. Sound + key highlight. Used by the user AND by playback.
  //    Returns the frequency, or null when audio is unavailable.
  const playNote = useCallback(
    (midi) => {
      let freqHz;

      try {
        freqHz = audioEngine.noteOn(midi);
      } catch {
        setAudioError(
          'Unable to play audio. Your browser may not support the Web Audio API.',
        );
        return null;
      }

      setPressedNotes((previous) => addNote(previous, midi));
      return freqHz;
    },
    [audioEngine],
  );

  const releaseNote = useCallback(
    (midi) => {
      audioEngine.noteOff(midi);
      setPressedNotes((previous) => removeNote(previous, midi));
    },
    [audioEngine],
  );

  // 2. Recorder + FIFO replay. Playback calls playNote/releaseNote,
  //    so replayed notes light up the keys too (visual feedback).
  const sequencer = usePianoSequencer({
    onNoteOn: playNote,
    onNoteOff: releaseNote,
  });

  const { recordNoteOn, recordNoteOff } = sequencer;

  // 3. Notes played by the USER are also recorded.
  //    All callbacks stay stable -> React.memo keeps working.
  const handleNoteOn = useCallback(
    (midi) => {
      const freqHz = playNote(midi);

      if (freqHz !== null) {
        recordNoteOn(midi, freqHz);
      }
    },
    [playNote, recordNoteOn],
  );

  const handleNoteOff = useCallback(
    (midi) => {
      releaseNote(midi);
      recordNoteOff(midi);
    },
    [releaseNote, recordNoteOff],
  );

  // 4. Computer keyboard input (e.code).
  useComputerKeyboardPiano(handleNoteOn, handleNoteOff);

  // 5. Release the AudioContext on unmount.
  useEffect(() => {
    return () => {
      void audioEngine.dispose();
    };
  }, [audioEngine]);

  // 6. Derived during render, no extra state.
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
        aria-labelledby="piano-recorder-heading"
      >
        <h2 id="piano-recorder-heading">Recorder</h2>

        <TransportControls
          status={sequencer.status}
          noteCount={sequencer.recording.length}
          durationMs={sequencer.durationMs}
          speed={sequencer.speed}
          message={sequencer.message}
          onSpeedChange={sequencer.setSpeed}
          onToggleRecording={sequencer.toggleRecording}
          onPlay={sequencer.play}
          onStop={sequencer.stop}
        />
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
