import { useCallback, useEffect, useRef, useState } from 'react';

import { isAbortError } from '../sequencer/abortableDelay';
import { AudioTaskQueue } from '../sequencer/AudioTaskQueue';
import {
  PerformanceRecorder,
  getRecordingDurationMs,
} from '../sequencer/PerformanceRecorder';
import { playSequence } from '../sequencer/playSequence';

const EMPTY_RECORDING = Object.freeze([]);

function formatSeconds(ms) {
  return `${(ms / 1000).toFixed(1)} s`;
}

// "1 note", "2 notes"
export function formatNoteCount(count) {
  return `${count} ${count === 1 ? 'note' : 'notes'}`;
}

/**
 * Connects the FIFO recorder, the AudioTaskQueue and the
 * abortable replay to React state.
 *
 * status: 'idle' | 'recording' | 'playing'
 */
export function usePianoSequencer({ onNoteOn, onNoteOff, now }) {
  const [recorder] = useState(() => new PerformanceRecorder(now ? { now } : undefined));
  const [queue] = useState(() => new AudioTaskQueue());

  const [status, setStatus] = useState('idle');
  const [recording, setRecording] = useState(EMPTY_RECORDING);
  const [speed, setSpeed] = useState(1);
  const [message, setMessage] = useState('No recording yet. Press Record to start.');

  // Latest playback callbacks, without re-creating play().
  const callbacksRef = useRef({ onNoteOn, onNoteOff });

  useEffect(() => {
    callbacksRef.current = { onNoteOn, onNoteOff };
  });

  // 1. Called by the page for every note the USER plays.
  const recordNoteOn = useCallback(
    (midi, freqHz) => {
      recorder.recordNoteOn(midi, freqHz);
    },
    [recorder],
  );

  const recordNoteOff = useCallback(
    (midi) => {
      recorder.recordNoteOff(midi);
    },
    [recorder],
  );

  // 2. Record / stop recording (one toggle button).
  const toggleRecording = useCallback(() => {
    if (status === 'playing') {
      return;
    }

    if (status === 'recording') {
      const events = recorder.stop();

      setRecording(events);
      setStatus('idle');
      setMessage(
        events.length > 0
          ? `Recorded ${formatNoteCount(events.length)} (${formatSeconds(getRecordingDurationMs(events))}).`
          : 'Recording stopped. No notes were recorded.',
      );
      return;
    }

    recorder.start();
    setStatus('recording');
    setMessage('Recording. Play some notes, then press Record again to stop.');
  }, [recorder, status]);

  // 3. Replay the recording through the FIFO AudioTaskQueue.
  const play = useCallback(() => {
    if (status !== 'idle' || recording.length === 0) {
      return;
    }

    setStatus('playing');
    setMessage(`Playing ${formatNoteCount(recording.length)} at ${speed}x.`);

    queue
      .enqueue((signal) =>
        playSequence(recording, {
          speed,
          signal,
          now,
          onNoteOn: (midi) => callbacksRef.current.onNoteOn(midi),
          onNoteOff: (midi) => callbacksRef.current.onNoteOff(midi),
        }),
      )
      .then(() => {
        setStatus('idle');
        setMessage('Playback finished.');
      })
      .catch((error) => {
        // Stop Sequence / unmount: already handled, not a failure.
        if (isAbortError(error)) {
          return;
        }

        setStatus('idle');
        setMessage(`Playback failed: ${error.message}`);
      });
  }, [queue, recording, speed, status, now]);

  // 4. Stop Sequence: cancel every scheduled note immediately.
  const stop = useCallback(() => {
    if (status !== 'playing') {
      return;
    }

    queue.abortAll();
    setStatus('idle');
    setMessage('Playback stopped.');
  }, [queue, status]);

  // 5. Unmount: cancel pending playback promises (no leaks).
  useEffect(() => {
    return () => {
      queue.abortAll();
    };
  }, [queue]);

  return {
    status,
    recording,
    durationMs: getRecordingDurationMs(recording),
    speed,
    setSpeed,
    message,
    recordNoteOn,
    recordNoteOff,
    toggleRecording,
    play,
    stop,
  };
}
