import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePubgAirdropTimer } from '../usePubgAirdropTimer';

const START = 1_800_000_000_000;

function setVisibility(state) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('usePubgAirdropTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });

  afterEach(() => {
    vi.useRealTimers();
    setVisibility('visible');
  });

  it('computes the remaining time from the target epoch', () => {
    const { result } = renderHook(() => usePubgAirdropTimer(START + 10_000));

    expect(result.current).toEqual({ remainingMs: 10_000, isLive: false });
  });

  it('counts down while the tab is active', () => {
    const { result } = renderHook(() => usePubgAirdropTimer(START + 10_000));

    act(() => vi.advanceTimersByTime(3000));

    expect(result.current.remainingMs).toBe(7000);
  });

  it('goes live at zero and stops ticking', () => {
    const { result } = renderHook(() => usePubgAirdropTimer(START + 1000));

    act(() => vi.advanceTimersByTime(1000));

    expect(result.current).toEqual({ remainingMs: 0, isLive: true });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('applies the server clock offset', () => {
    // Server clock is 2 s ahead of the local clock.
    const { result } = renderHook(() => usePubgAirdropTimer(START + 10_000, 2000));

    expect(result.current.remainingMs).toBe(8000);
  });

  it('does not drift when the background tab skips ticks', () => {
    const { result } = renderHook(() => usePubgAirdropTimer(START + 60_000));

    // Throttled tab: 45 s pass but NO interval callback runs.
    setVisibility('hidden');
    act(() => vi.setSystemTime(START + 45_000));

    expect(result.current.remainingMs).toBe(60_000); // stale, not yet resynced

    // Tab wakes up: resync immediately from the real clock.
    act(() => setVisibility('visible'));

    expect(result.current.remainingMs).toBe(15_000);
  });

  it('reflects a new target immediately', () => {
    const { result, rerender } = renderHook(
      ({ target }) => usePubgAirdropTimer(target),
      { initialProps: { target: START + 10_000 } },
    );

    rerender({ target: START + 30_000 });

    expect(result.current.remainingMs).toBe(30_000);
  });

  it('cleans up the interval and listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => usePubgAirdropTimer(START + 10_000));

    unmount();

    expect(vi.getTimerCount()).toBe(0);
    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});
