/**
 * Abortable delay.
 *
 * Resolves after `ms` milliseconds, or rejects with the signal's
 * reason (an AbortError) as soon as the signal is aborted.
 * The timer and the listener are always cleaned up: no leaks.
 */
export function abortableDelay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const handleAbort = () => {
      clearTimeout(timerId);
      reject(signal.reason);
    };

    const timerId = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, Math.max(0, ms));

    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

/**
 * True when an error was caused by cancellation, not a real failure.
 */
export function isAbortError(error) {
  return error?.name === 'AbortError';
}
