import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, createMockClaimServer, isConflictError } from '../mockClaimServer';

const NOW = 1_800_000_000_000;

const DROPS = [
  { id: 'live', remainingStock: 2, dropEpochMs: NOW - 1000 },
  { id: 'later', remainingStock: 5, dropEpochMs: NOW + 60_000 },
];

describe('mock claim server', () => {
  let server;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    server = createMockClaimServer({ drops: DROPS, latencyMs: 500 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Starts a request and lets the fake network finish.
  async function claim(dropId, claimId, signal) {
    const request = server.claimDrop({ dropId, claimId, signal });
    request.catch(() => {}); // avoid unhandled rejection before we await
    await vi.advanceTimersByTimeAsync(500);
    return request;
  }

  it('decrements server stock after the network latency', async () => {
    const request = server.claimDrop({ dropId: 'live', claimId: 'c1' });

    expect(server.getStock('live')).toBe(2); // still in flight

    await vi.advanceTimersByTimeAsync(500);

    await expect(request).resolves.toEqual({ claimId: 'c1', dropId: 'live', remainingStock: 1 });
    expect(server.getStock('live')).toBe(1);
  });

  it('answers 409 Conflict when the drop is looted out', async () => {
    await claim('live', 'c1');
    await claim('live', 'c2');

    const error = await claim('live', 'c3').catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(isConflictError(error)).toBe(true);
    expect(server.getStock('live')).toBe(0);
  });

  it('is idempotent for a retried claimId', async () => {
    const first = await claim('live', 'same-id');
    const retry = await claim('live', 'same-id');

    expect(retry).toEqual(first);
    expect(server.getStock('live')).toBe(1); // decremented only once
  });

  it('answers 425 before the drop time', async () => {
    const error = await claim('later', 'c1').catch((caught) => caught);

    expect(error.status).toBe(425);
    expect(isConflictError(error)).toBe(false);
  });

  it('never changes stock when the request is aborted', async () => {
    const controller = new AbortController();
    const request = server.claimDrop({ dropId: 'live', claimId: 'c1', signal: controller.signal });

    controller.abort(new DOMException('Cancelled', 'AbortError'));

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(1000);
    expect(server.getStock('live')).toBe(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('can simulate rival players to reproduce a 409', async () => {
    server.simulateRivalClaims('live', 99);

    const error = await claim('live', 'c1').catch((caught) => caught);

    expect(isConflictError(error)).toBe(true);
  });
});
