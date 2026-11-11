
import { useCallback, useEffect, useRef, useState } from 'react';

import { DRUM_PADS, DRUM_PAD_MAP } from './data/drumPads';
import { getDrumPadById } from './data/drumPads';
import { DrumAudioEngine } from './audio/DrumAudioEngine';
import { useDrumKeyboard } from './hooks/useDrumKeyboard';

import DrumPadGrid from './components/DrumPadGrid';

import './DrumMachine.css';

function DrumMachine() {
  // Create one audio engine for this component instance.
  const [audioEngine] = useState(
    () => new DrumAudioEngine(),
  );

  // Track the pad that was most recently triggered.
  const [activePadId, setActivePadId] = useState(null);

  // Display audio errors if the browser does not support Web Audio.
  const [audioError, setAudioError] = useState('');

  // Store the active timer for cleanup.
  const activeTimerRef = useRef(null);

  // Trigger the corresponding drum sound.
  const handleTriggerPad = useCallback(
    (padId) => {
      const pad = getDrumPadById(padId);

      if (!pad) {
        return;
      }

      setActivePadId(padId);

      if (activeTimerRef.current !== null) {
        clearTimeout(activeTimerRef.current);
      }

      activeTimerRef.current = setTimeout(() => {
        setActivePadId(null);
        activeTimerRef.current = null;
      }, 150);

      audioEngine.triggerPad(pad.soundType).catch(() => {
        setAudioError(
          'Unable to play audio. Please check your browser audio support.',
        );
      });
    },
    [audioEngine],
  );

  // Connect physical keyboard shortcuts.
  const { pressedPadIds } = useDrumKeyboard(
    DRUM_PAD_MAP,
    handleTriggerPad,
  );

  // Release resources when the component unmounts.
  useEffect(() => {
    return () => {
      if (activeTimerRef.current !== null) {
        clearTimeout(activeTimerRef.current);
      }

      void audioEngine.dispose();
    };
  }, [audioEngine]);

  return (
    <main className="drum-machine">
      <header className="drum-machine__header">
        <p className="drum-machine__eyebrow">
          PRODUCTION STUDIO
        </p>

        <h1>Interactive Drum Kit</h1>

        <p className="drum-machine__subtitle">
          Create your rhythm. Play with your keyboard or mouse.
        </p>
      </header>

      <section
        className="drum-machine__studio"
        aria-label="Drum kit control panel"
      >
        <div className="drum-machine__toolbar">
          <span className="drum-machine__status">
            <span
              className="drum-machine__status-dot"
              aria-hidden="true"
            />
            AUDIO STUDIO READY
          </span>

          <span className="drum-machine__pad-count">
            {DRUM_PADS.length} DRUM PADS
          </span>
        </div>

        <DrumPadGrid
          pads={DRUM_PADS}
          pressedPadIds={pressedPadIds}
          activePadId={activePadId}
          onTrigger={handleTriggerPad}
        />

        <p className="drum-machine__instruction">
          Press W, A, S, D, J, K, L or click a pad to play.
        </p>

        {audioError && (
          <p
            className="drum-machine__error"
            role="alert"
          >
            {audioError}
          </p>
        )}
      </section>

      <footer className="drum-machine__footer">
        <p>SCIS / PRODUCTION STUDIO / DRUM MACHINE</p>
      </footer>
    </main>
  );
}

export default DrumMachine;
