import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, createMockClaimServer } from '../../api/mockClaimServer';
import { useOptimisticClaim } from '../useOptimisticClaim';

const NOW = 1_800_000_000_000;
const LATENCY = 500;

const DROPS = Object.freeze([
  Object.freeze({ id: 'vip', title: 'VIP Pass', priceVnd: 1_250_000, remainingStock: 3, dropEpochMs: NOW - 1000 }),
  Object.freeze({ id: 'crate', title: 'G-Coin Crate', priceVnd: 450_000, remainingStock: 1, dropEpochMs: NOW - 1000 }),
]);

const stockOf = (result, id) => result.current.drops.find((drop) => drop.id === id).remainingStock;

describe('useOptimisticClaim', () => {
  let server;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    server = createMockClaimServer({ drops: DROPS, latencyMs: LATENCY });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderClaim = (claimDrop = server.claimDrop) =>
    renderHook(() => useOptimisticClaim(DROPS, claimDrop));

  it('decrements stock optimistically before the server answers', () => {
    const { result } = renderClaim();

    act(() => {
      result.current.claim('vip');
    });

    expect(stockOf(result, 'vip')).toBe(2);
    expect(result.current.pendingDropIds.has('vip')).toBe(true);
    expect(server.getStock('vip')).toBe(3); // server not reached yet
  });

  it('reconciles with the server on success', async () => {
    const { result } = renderClaim();

    act(() => {
      result.current.claim('vip');
    });
    await act(() => vi.advanceTimersByTimeAsync(LATENCY));

    expect(stockOf(result, 'vip')).toBe(2);
    expect(server.getStock('vip')).toBe(2);
    expect(result.current.pendingDropIds.has('vip')).toBe(false);
    expect(result.current.statusByDrop.vip.type).toBe('success');
  });

  it('locks double clicks: only ONE request per drop while in flight', async () => {
    const claimDrop = vi.fn(server.claimDrop);
    const { result } = renderClaim(claimDrop);

    act(() => {
      result.current.claim('vip');
      result.current.claim('vip');
      result.current.claim('vip');
    });
    await act(() => vi.advanceTimersByTimeAsync(LATENCY));

    expect(claimDrop).toHaveBeenCalledTimes(1);
    expect(stockOf(result, 'vip')).toBe(2);
  });

  it('rolls back on 409 Conflict and shows the server truth', async () => {
    const { result } = renderClaim();

    // Another player takes the last crate on the server.
    server.simulateRivalClaims('crate', 1);

    act(() => {
      result.current.claim('crate');
    });
    expect(stockOf(result, 'crate')).toBe(0); // optimistic

    await act(() => vi.advanceTimersByTimeAsync(LATENCY));

    expect(stockOf(result, 'crate')).toBe(0); // looted out on the server
    expect(result.current.statusByDrop.crate.type).toBe('conflict');
    expect(result.current.statusByDrop.crate.message).toMatch(/rolled back/i);
    expect(result.current.pendingDropIds.has('crate')).toBe(false);
  });

  it('restores the previous stock on other errors', async () => {
    const failing = vi.fn(async () => {
      throw new ApiError(500, 'SERVER_ERROR', 'Server unavailable.');
    });
    const { result } = renderClaim(failing);

    await act(async () => {
      await result.current.claim('vip');
    });

    expect(stockOf(result, 'vip')).toBe(3); // rolled back
    expect(result.current.statusByDrop.vip.type).toBe('error');
  });

  it('allows a new claim after the previous one finished', async () => {
    const { result } = renderClaim();

    act(() => {
      result.current.claim('vip');
    });
    await act(() => vi.advanceTimersByTimeAsync(LATENCY));

    act(() => {
      result.current.claim('vip');
    });
    await act(() => vi.advanceTimersByTimeAsync(LATENCY));

    expect(stockOf(result, 'vip')).toBe(1);
    expect(server.getStock('vip')).toBe(1);
  });

  it('ignores claims for a drop that is already empty', () => {
    const claimDrop = vi.fn(server.claimDrop);
    const empty = [{ ...DROPS[1], remainingStock: 0 }];
    const { result } = renderHook(() => useOptimisticClaim(empty, claimDrop));

    act(() => {
      result.current.claim('crate');
    });

    expect(claimDrop).not.toHaveBeenCalled();
  });

  it('aborts pending requests on unmount', async () => {
    const { result, unmount } = renderClaim();

    act(() => {
      result.current.claim('vip');
    });
    unmount();
    await vi.advanceTimersByTimeAsync(LATENCY);

    expect(server.getStock('vip')).toBe(3); // request never reached the server
    expect(vi.getTimerCount()).toBe(0);
  });
});
