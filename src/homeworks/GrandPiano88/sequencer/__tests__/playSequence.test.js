import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PLAYBACK_SPEEDS, playSequence } from '../playSequence';

// C4 at t=0 for 100 ms, then E4 at t=200 for 100 ms.
const MELODY = Object.freeze([
  { midi: 60, freqHz: 261.63, durationMs: 100, deltaMs: 0 },
  { midi: 64, freqHz: 329.63, durationMs: 100, deltaMs: 200 },
]);

describe('playSequence', () => {
  let log;
  let options;
  let start; // fake-clock time when playback started

  beforeEach(() => {
    vi.useFakeTimers();
    log = [];
    options = {
      now: () => Date.now(), // faked together with the timers
      onNoteOn: (midi) => log.push(`on:${midi}@${Date.now() - start}`),
      onNoteOff: (midi) => log.push(`off:${midi}@${Date.now() - start}`),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const play = (events, extra = {}) => {
    start = Date.now();
    return playSequence(events, { ...options, ...extra });
  };

  it('supports 0.5x, 1x and 2x', () => {
    expect(PLAYBACK_SPEEDS).toEqual([0.5, 1, 2]);
  });

  it('replays events in FIFO order with the recorded timing', async () => {
    const done = play(MELODY);

    await vi.advanceTimersByTimeAsync(300);
    await done;

    expect(log).toEqual(['on:60@0', 'off:60@100', 'on:64@200', 'off:64@300']);
  });

  it('plays twice as fast at 2x', async () => {
    const done = play(MELODY, { speed: 2 });

    await vi.advanceTimersByTimeAsync(150);
    await done;

    expect(log).toEqual(['on:60@0', 'off:60@50', 'on:64@100', 'off:64@150']);
  });

  it('plays twice as slow at 0.5x', async () => {
    const done = play(MELODY, { speed: 0.5 });

    await vi.advanceTimersByTimeAsync(600);
    await done;

    expect(log).toEqual(['on:60@0', 'off:60@200', 'on:64@400', 'off:64@600']);
  });

  it('reports which event is playing', async () => {
    const onEventStart = vi.fn();
    const done = play(MELODY, { onEventStart });

    await vi.advanceTimersByTimeAsync(300);
    await done;

    expect(onEventStart.mock.calls).toEqual([[0], [1]]);
  });

  it('rejects an unsupported speed', async () => {
    await expect(play(MELODY, { speed: 3 })).rejects.toThrow(RangeError);
  });

  it('stops immediately on abort and releases sounding notes', async () => {
    const controller = new AbortController();
    const done = play(MELODY, { signal: controller.signal });

    // Attach the rejection handler before aborting.
    const assertion = expect(done).rejects.toMatchObject({ name: 'AbortError' });

    await vi.advanceTimersByTimeAsync(50); // C4 is sounding
    controller.abort(new DOMException('Stopped', 'AbortError'));
    await assertion;

    await vi.advanceTimersByTimeAsync(1000); // nothing else may play

    expect(log).toEqual(['on:60@0', 'off:60@50']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not cut a re-struck note short', async () => {
    // Same key twice: the 1st note-off and the 2nd note-on both land at t=100.
    const repeated = [
      { midi: 60, freqHz: 261.63, durationMs: 100, deltaMs: 0 },
      { midi: 60, freqHz: 261.63, durationMs: 100, deltaMs: 100 },
    ];

    const done = play(repeated);

    await vi.advanceTimersByTimeAsync(150);
    expect(log.at(-1)).toBe('on:60@100'); // still sounding

    await vi.advanceTimersByTimeAsync(50);
    await done;
    expect(log.at(-1)).toBe('off:60@200');
  });

  it('finishes immediately for an empty recording', async () => {
    await expect(play([])).resolves.toBeUndefined();
  });
});
