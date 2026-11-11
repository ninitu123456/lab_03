/**
 * Mock "ai đó" who may or may not reply ("seen không rep").
 *
 * waitForReply() resolves with a reply after `replyDelayMs`, or never
 * settles on its own when ignored. Either way it rejects with the
 * signal's AbortError as soon as the caller aborts, and leaves no timer.
 */

const REPLIES = Object.freeze(['ok', 'haha', 'đang bận', 'mai nói nha']);

export function createMockPartner({
  replyChance = 0.3,
  replyDelayMs = 2000,
  random = Math.random,
} = {}) {
  function waitForReply(message, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }

      const willReply = random() < replyChance;
      let timerId = null;

      const handleAbort = () => {
        if (timerId !== null) {
          clearTimeout(timerId);
        }
        reject(signal.reason);
      };

      signal?.addEventListener('abort', handleAbort, { once: true });

      if (willReply) {
        timerId = setTimeout(() => {
          signal?.removeEventListener('abort', handleAbort);
          resolve(Object.freeze({
            messageId: message.id,
            text: REPLIES[Math.floor(random() * REPLIES.length)],
          }));
        }, replyDelayMs);
      }
      // Otherwise: seen, no reply. Only an abort can settle the promise.
    });
  }

  return { waitForReply };
}
