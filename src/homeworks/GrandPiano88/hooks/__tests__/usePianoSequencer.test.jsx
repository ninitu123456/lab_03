import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePianoSequencer } from '../usePianoSequencer';

describe('usePianoSequencer', () => {
  let onNoteOn;
  let onNoteOff;

  beforeEach(() => {
    vi.useFakeTimers();
    onNoteOn = vi.fn();
    onNoteOff = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderSequencer = () =>
    renderHook(() =>
      usePianoSequencer({
        onNoteOn,
        onNoteOff,
        now: () => Date.now(), // faked together with the timers
      }),
    );

  // Records C4 (200 ms) then E4 (200 ms), 300 ms apart.
  const recordMelody = (result) => {
    act(() => result.current.toggleRecording());

    act(() => result.current.recordNoteOn(60, 261.63));
    act(() => vi.advanceTimersByTime(200));
    act(() => result.current.recordNoteOff(60));
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current.recordNoteOn(64, 329.63));
    act(() => vi.advanceTimersByTime(200));
    act(() => result.current.recordNoteOff(64));

    act(() => result.current.toggleRecording());
  };

  it('starts idle with an empty recording', () => {
    const { result } = renderSequencer();

    expect(result.current.status).toBe('idle');
    expect(result.current.recording).toEqual([]);
    expect(result.current.speed).toBe(1);
  });

  it('records notes into the FIFO queue', () => {
    const { result } = renderSequencer();

    recordMelody(result);

    expect(result.current.status).toBe('idle');
    expect(result.current.recording).toEqual([
      { midi: 60, freqHz: 261.63, durationMs: 200, deltaMs: 0 },
      { midi: 64, freqHz: 329.63, durationMs: 200, deltaMs: 300 },
    ]);
    expect(result.current.durationMs).toBe(500);
    expect(result.current.message).toMatch(/recorded 2 notes/i);
  });

  it('replays the recording and returns to idle', async () => {
    const { result } = renderSequencer();

    recordMelody(result);
    act(() => result.current.play());

    expect(result.current.status).toBe('playing');

    await act(() => vi.advanceTimersByTimeAsync(500));

    expect(onNoteOn.mock.calls).toEqual([[60], [64]]);
    expect(onNoteOff.mock.calls).toEqual([[60], [64]]);
    expect(result.current.status).toBe('idle');
    expect(result.current.message).toBe('Playback finished.');
  });

  it('replays twice as fast at 2x', async () => {
    const { result } = renderSequencer();

    recordMelody(result);
    act(() => result.current.setSpeed(2));
    act(() => result.current.play());

    await act(() => vi.advanceTimersByTimeAsync(250));

    expect(onNoteOff).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('idle');
  });

  it('Stop Sequence cancels playback and silences sounding notes', async () => {
    const { result } = renderSequencer();

    recordMelody(result);
    act(() => result.current.play());

    await act(() => vi.advanceTimersByTimeAsync(100)); // C4 sounding
    act(() => result.current.stop());
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(onNoteOn.mock.calls).toEqual([[60]]); // E4 never plays
    expect(onNoteOff.mock.calls).toEqual([[60]]); // C4 released
    expect(result.current.status).toBe('idle');
    expect(result.current.message).toBe('Playback stopped.');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels playback on unmount', async () => {
    const { result, unmount } = renderSequencer();

    recordMelody(result);
    act(() => result.current.play());
    await act(() => vi.advanceTimersByTimeAsync(100));

    unmount();
    await vi.advanceTimersByTimeAsync(1000);

    expect(onNoteOn).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ignores Play when there is nothing recorded', () => {
    const { result } = renderSequencer();

    act(() => result.current.play());

    expect(result.current.status).toBe('idle');
  });

  it('ignores Record while playing', async () => {
    const { result } = renderSequencer();

    recordMelody(result);
    act(() => result.current.play());
    act(() => result.current.toggleRecording());

    expect(result.current.status).toBe('playing');

    await act(() => vi.advanceTimersByTimeAsync(500));
  });

  it('does not record notes outside a recording session', () => {
    const { result } = renderSequencer();

    act(() => result.current.recordNoteOn(60, 261.63));
    act(() => result.current.toggleRecording());
    act(() => result.current.toggleRecording());

    expect(result.current.recording).toEqual([]);
    expect(result.current.message).toMatch(/no notes were recorded/i);
  });
});
