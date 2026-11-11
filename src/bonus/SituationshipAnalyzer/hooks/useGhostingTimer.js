import { useEffect, useRef } from 'react';

export const GHOSTING_TIMEOUT_MS = 5000;

/**
 * "Seen không rep" timer.
 *
 * While `pendingMessage` is set, waits for the partner's reply for at most
 * `timeoutMs`. Exactly one outcome happens:
 *   - reply arrives in time  -> onReply(reply)
 *   - nobody replies         -> onTimeout()
 *   - message cleared ("Dừng lại"), new message, or unmount
 *                            -> nothing; pending work is aborted
 *
 * One AbortController per message cancels BOTH the reply promise and the
 * timeout, so no timer or promise outlives the component.
 */
export function useGhostingTimer({
  pendingMessage,
  waitForReply,
  onReply,
  onTimeout,
  timeoutMs = GHOSTING_TIMEOUT_MS,
}) {
  // Latest callbacks without restarting the timer on every render.
  const callbacksRef = useRef({ onReply, onTimeout });

  useEffect(() => {
    callbacksRef.current = { onReply, onTimeout };
  });

  useEffect(() => {
    if (!pendingMessage) {
      return undefined;
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort(new DOMException('Seen, no reply.', 'AbortError'));
      callbacksRef.current.onTimeout();
    }, timeoutMs);

    waitForReply(pendingMessage, controller.signal).then(
      (reply) => {
        clearTimeout(timeoutId);
        callbacksRef.current.onReply(reply);
      },
      () => {
        // Aborted (timeout, "Dừng lại", new message, unmount): nothing to do.
      },
    );

    return () => {
      clearTimeout(timeoutId);
      controller.abort(new DOMException('Ghosting timer cleaned up.', 'AbortError'));
    };
  }, [pendingMessage, waitForReply, timeoutMs]);
}
