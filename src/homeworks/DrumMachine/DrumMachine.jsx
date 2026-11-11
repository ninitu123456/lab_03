import { useCallback, useEffect, useRef, useState } from 'react';

import { DRUM_PADS, DRUM_PAD_MAP, getDrumPadById } from './data/drumPads';
import { DrumAudioEngine } from './audio/DrumAudioEngine';
import { useDrumKeyboard } from './hooks/useDrumKeyboard';

import DrumPadGrid from './components/DrumPadGrid';

import './DrumMachine.css';
import DecibelMeter from './components/DecibelMeter';
function DrumMachine() {
  const [audioEngine] = useState(
    () => new DrumAudioEngine(),
  );

  const [activePadId, setActivePadId] = useState(null);
  const [audioError, setAudioError] = useState('');

  // Store the eight most recent drum hits.
  const [hitLog, setHitLog] = useState([]);

  const activeTimerRef = useRef(null);
  const hitSequenceRef = useRef(0);

  const handleTriggerPad = useCallback(
    (padId) => {
      const pad = getDrumPadById(padId);

      if (!pad) {
        return;
      }

      // Update the visual active state.
      setActivePadId(padId);

      if (activeTimerRef.current !== null) {
        clearTimeout(activeTimerRef.current);
      }

      activeTimerRef.current = setTimeout(() => {
        setActivePadId(null);
        activeTimerRef.current = null;
      }, 150);

      // Add a new entry to the hit log.
      const newHit = {
        id: ++hitSequenceRef.current,
        name: pad.name,
        keyLabel: pad.keyLabel,
        time: new Date().toLocaleTimeString(),
      };

      setHitLog((previous) => [
        newHit,
        ...previous,
      ].slice(0, 8));

      // Play the corresponding sound.
      audioEngine.triggerPad(pad.soundType).catch(() => {
        setAudioError(
          'Unable to play audio. Please check your browser audio support.',
        );
      });
    },
    [audioEngine],
  );

  const { pressedPadIds } = useDrumKeyboard(
    DRUM_PAD_MAP,
    handleTriggerPad,
  );

  useEffect(() => {
    return () => {
      if (activeTimerRef.current !== null) {
        clearTimeout(activeTimerRef.current);
      }

      void audioEngine.dispose();
    };
  }, [audioEngine]);

  const latestHit = hitLog[0];

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
        aria-labelledby="drum-studio-heading"
      >
        <h2
          id="drum-studio-heading"
          className="drum-machine__section-heading"
        >
          Drum Pad Controller
        </h2>

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

        <DecibelMeter audioEngine={audioEngine} />
        
        <p className="drum-machine__instruction">
          Press W, A, S, D, J, K, L or click a pad to play.
          Use Tab to navigate between pads.
        </p>

        {audioError && (
          <p
            className="drum-machine__error"
            role="alert"
          >
            {audioError}
          </p>
        )}

        {/* Screen reader announcement */}
        <output
          className="drum-machine__live-status"
          aria-live="polite"
          aria-atomic="true"
        >
          {latestHit
            ? `${latestHit.name} played`
            : 'No drum hits yet'}
        </output>

        {/* Visual hit history */}
        <section
          className="drum-machine__hit-log"
          aria-labelledby="hit-log-heading"
        >
          <div className="drum-machine__hit-log-header">
            <h2 id="hit-log-heading">
              Recent Hits
            </h2>

            <span>{hitLog.length} / 8</span>
          </div>

          {hitLog.length === 0 ? (
            <p className="drum-machine__empty-log">
              No hits recorded. Start playing!
            </p>
          ) : (
            <ol className="drum-machine__hit-list">
              {hitLog.map((hit) => (
                <li key={hit.id}>
                  <span className="hit-log__key">
                    {hit.keyLabel}
                  </span>

                  <span className="hit-log__name">
                    {hit.name}
                  </span>

                  <time className="hit-log__time">
                    {hit.time}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </section>
      </section>

      <footer className="drum-machine__footer">
        <p>SCIS / PRODUCTION STUDIO / DRUM MACHINE</p>
      </footer>
    </main>
  );
}

export default DrumMachine;