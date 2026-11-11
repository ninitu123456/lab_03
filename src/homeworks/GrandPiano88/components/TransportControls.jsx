import { memo, useId } from 'react';

import { PLAYBACK_SPEEDS } from '../sequencer/playSequence';

import './TransportControls.css';

/**
 * Record / Play / Stop Sequence controls.
 *
 * aria-disabled (instead of disabled) keeps focus on a button
 * whose action is temporarily unavailable, so keyboard users
 * never lose their place when playback starts or stops.
 */
export const TransportControls = memo(function TransportControls({
  status,
  noteCount,
  durationMs,
  speed,
  message,
  onSpeedChange,
  onToggleRecording,
  onPlay,
  onStop,
}) {
  const speedSelectId = useId();

  const isRecording = status === 'recording';
  const isPlaying = status === 'playing';

  const canRecord = !isPlaying;
  const canPlay = status === 'idle' && noteCount > 0;
  const canStop = isPlaying;

  return (
    <>
      <div className="transport__buttons" role="group" aria-label="Recorder controls">
        <button
          type="button"
          className="transport__button transport__button--record"
          aria-pressed={isRecording}
          aria-disabled={!canRecord}
          onClick={onToggleRecording}
        >
          <span className="transport__dot" aria-hidden="true" />
          Record
        </button>

        <button
          type="button"
          className="transport__button"
          aria-disabled={!canPlay}
          onClick={onPlay}
        >
          Play
        </button>

        <button
          type="button"
          className="transport__button"
          aria-disabled={!canStop}
          onClick={onStop}
        >
          Stop Sequence
        </button>
      </div>

      <p className="transport__field">
        <label htmlFor={speedSelectId}>Playback speed</label>
        <select
          id={speedSelectId}
          value={speed}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
        >
          {PLAYBACK_SPEEDS.map((option) => (
            <option key={option} value={option}>
              {option}x
            </option>
          ))}
        </select>
      </p>

      <p className="transport__summary">
        Recording: <strong>{noteCount}</strong> {noteCount === 1 ? 'note' : 'notes'} ·{' '}
        <strong>{(durationMs / 1000).toFixed(1)} s</strong>
      </p>

      <output className="transport__status" aria-live="polite" aria-atomic="true">
        {message}
      </output>
    </>
  );
});
