import { useEffect, useState } from 'react';

// How often the visible countdown is refreshed while the tab is active.
export const TIMER_TICK_MS = 200;

/**
 * Zero-drift airdrop countdown (evolved from Lab 2 createAntiDriftTimer).
 *
 * Never counts down with `s => s - 1`: background tabs are throttled,
 * so missed ticks would make the timer lag. Instead the remaining time is
 * always RECOMPUTED from the target epoch and the current clock:
 *
 *   remainingMs = max(0, targetEpochMs - (Date.now() + serverOffsetMs))
 *
 * Only the clock reading is state; remainingMs is derived during render,
 * so a new targetEpochMs is reflected immediately.
 *
 * @param {number} targetEpochMs  Server time when the drop goes live.
 * @param {number} serverOffsetMs serverTime - localTime (clock skew).
 */
export function usePubgAirdropTimer(targetEpochMs, serverOffsetMs = 0) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    let timerId = null;

    const syncClock = () => {
      const now = Date.now();
      setNowMs(now);

      // Drop is live: stop ticking, nothing left to count.
      if (targetEpochMs - (now + serverOffsetMs) <= 0 && timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    // Tab wakes up after being throttled: resync immediately.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncClock();
      }
    };

    if (targetEpochMs - (Date.now() + serverOffsetMs) > 0) {
      timerId = window.setInterval(syncClock, TIMER_TICK_MS);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerId !== null) {
        window.clearInterval(timerId);
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [targetEpochMs, serverOffsetMs]);

  const remainingMs = Math.max(0, targetEpochMs - (nowMs + serverOffsetMs));

  return { remainingMs, isLive: remainingMs === 0 };
}
