/**
 * Asynchronous FIFO replay of recorded note events.
 *
 * Events ({ midi, freqHz, durationMs, deltaMs }) are played in
 * queue order. Speed 2 plays twice as fast, 0.5 twice as slow.
 */

import { abortableDelay, isAbortError } from './abortableDelay';

export const PLAYBACK_SPEEDS = Object.freeze([0.5, 1, 2]);

function ignoreAbort(error) {
  if (!isAbortError(error)) {
    throw error;
  }
}

/**
 * Plays a recording. Resolves when the last note ends.
 * Rejects with an AbortError when `signal` is aborted; every note
 * that is still sounding is released first, so nothing gets stuck.
 */
export async function playSequence(
  events,
  {
    speed = 1,
    signal,
    onNoteOn,
    onNoteOff,
    onEventStart,
    now = () => performance.now(),
  },
) {
  if (!PLAYBACK_SPEEDS.includes(speed)) {
    throw new RangeError(`Playback speed must be one of ${PLAYBACK_SPEEDS.join(', ')}.`);
  }

  signal?.throwIfAborted();

  // midi -> unique token of the voice that currently owns this key.
  // A late note-off of an OLD voice must not cut a NEW voice short.
  const soundingNotes = new Map();
  const pendingReleases = [];

  // Anti-drift: every time is measured from ONE start point,
  // so small timer delays never accumulate across many notes.
  const startedAt = now();
  let onsetMs = 0;

  try {
    for (const [index, event] of events.entries()) {
      onsetMs += event.deltaMs / speed;

      await abortableDelay(startedAt + onsetMs - now(), signal);

      const token = Symbol(event.midi);
      soundingNotes.set(event.midi, token);
      onNoteOn(event.midi, event);
      onEventStart?.(index);

      const releaseAt = startedAt + onsetMs + event.durationMs / speed;

      pendingReleases.push(
        abortableDelay(releaseAt - now(), signal).then(() => {
          if (soundingNotes.get(event.midi) === token) {
            soundingNotes.delete(event.midi);
            onNoteOff(event.midi);
          }
        }, ignoreAbort),
      );
    }

    await Promise.all(pendingReleases);
    signal?.throwIfAborted();
  } finally {
    // Stopped early (or failed): silence everything still sounding.
    for (const midi of soundingNotes.keys()) {
      onNoteOff(midi);
    }

    soundingNotes.clear();
  }
}
