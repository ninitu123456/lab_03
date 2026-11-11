/**
 * Mock claim server (in-memory, no network).
 *
 * Behaves like a real inventory API:
 * - Network latency.
 * - HTTP 409 Conflict when the drop is looted out.
 * - HTTP 425 Too Early before the drop time.
 * - Idempotent: the same claimId never decrements stock twice.
 * - Abortable: an aborted request never changes server stock.
 */

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function isConflictError(error) {
  return error instanceof ApiError && error.status === 409;
}

function delay(ms, signal) {
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
    }, ms);

    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

export function createMockClaimServer({
  drops,
  latencyMs = 600,
  now = () => Date.now(),
}) {
  // Server-side truth, separate from the UI's optimistic copy.
  const stockById = new Map(drops.map((drop) => [drop.id, drop.remainingStock]));
  const dropTimeById = new Map(drops.map((drop) => [drop.id, drop.dropEpochMs]));
  const processedClaims = new Map(); // claimId -> response

  async function claimDrop({ dropId, claimId, signal }) {
    await delay(latencyMs, signal);

    // Idempotency: a retried request returns the original answer.
    if (processedClaims.has(claimId)) {
      return processedClaims.get(claimId);
    }

    if (!stockById.has(dropId)) {
      throw new ApiError(404, 'DROP_NOT_FOUND', 'This drop does not exist.');
    }

    if (now() < dropTimeById.get(dropId)) {
      throw new ApiError(425, 'DROP_NOT_LIVE', 'This airdrop is not live yet.');
    }

    const stock = stockById.get(dropId);

    if (stock <= 0) {
      throw new ApiError(409, 'LOOTED_OUT', 'Looted out! Another player claimed the last item.');
    }

    stockById.set(dropId, stock - 1);

    const response = Object.freeze({ claimId, dropId, remainingStock: stock - 1 });
    processedClaims.set(claimId, response);

    return response;
  }

  return {
    claimDrop,
    getStock: (dropId) => stockById.get(dropId),
    // Demo helper: other players grab items, so a 409 can be reproduced.
    simulateRivalClaims(dropId, count) {
      stockById.set(dropId, Math.max(0, stockById.get(dropId) - count));
    },
  };
}
