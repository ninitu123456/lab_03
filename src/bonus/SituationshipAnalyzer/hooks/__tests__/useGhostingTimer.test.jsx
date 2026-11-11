import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockPartner } from '../../model/mockPartner';
import { GHOSTING_TIMEOUT_MS, useGhostingTimer } from '../useGhostingTimer';

const MESSAGE = Object.freeze({ id: 'm1', text: 'Tối nay rảnh không?' });

const ghostingPartner = createMockPartner({ random: () => 0.99 }); // never replies
const replyingPartner = createMockPartner({ random: () => 0, replyDelayMs: 2000 }); // replies at 2 s

describe('useGhostingTimer', () => {
  let onReply;
  let onTimeout;

  beforeEach(() => {
    vi.useFakeTimers();
    onReply = vi.fn();
    onTimeout = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderTimer = (partner, pendingMessage = MESSAGE) =>
    renderHook(
      ({ message }) =>
        useGhostingTimer({
          pendingMessage: message,
          waitForReply: partner.waitForReply,
          onReply,
          onTimeout,
        }),
      { initialProps: { message: pendingMessage } },
    );

  it('does nothing without a pending message', () => {
    renderTimer(ghostingPartner, null);

    expect(vi.getTimerCount()).toBe(0);
  });

  it('times out after 5 s of "seen, no reply"', async () => {
    renderTimer(ghostingPartner);

    await act(() => vi.advanceTimersByTimeAsync(GHOSTING_TIMEOUT_MS - 1));
    expect(onTimeout).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(onReply).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports a reply that arrives in time and cancels the timeout', async () => {
    renderTimer(replyingPartner);

    await act(() => vi.advanceTimersByTimeAsync(2000));

    expect(onReply).toHaveBeenCalledWith(expect.objectContaining({ messageId: 'm1' }));

    await act(() => vi.advanceTimersByTimeAsync(GHOSTING_TIMEOUT_MS));
    expect(onTimeout).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('"Dừng lại" (message cleared) aborts the wait and the timeout', async () => {
    const waitForReply = vi.fn(ghostingPartner.waitForReply);
    const { rerender } = renderHook(
      ({ message }) => useGhostingTimer({ pendingMessage: message, waitForReply, onReply, onTimeout }),
      { initialProps: { message: MESSAGE } },
    );

    const signal = waitForReply.mock.calls[0][1];

    rerender({ message: null });
    await act(() => vi.advanceTimersByTimeAsync(GHOSTING_TIMEOUT_MS * 2));

    expect(signal.aborted).toBe(true);
    expect(onTimeout).not.toHaveBeenCalled();
    expect(onReply).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('a new message restarts the 5 s window', async () => {
    const { rerender } = renderTimer(ghostingPartner);

    await act(() => vi.advanceTimersByTimeAsync(4000));
    rerender({ message: { id: 'm2', text: 'Ngủ chưa?' } });
    await act(() => vi.advanceTimersByTimeAsync(4000));

    expect(onTimeout).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('cleans up on unmount (no leaked timer or promise)', async () => {
    const { unmount } = renderTimer(replyingPartner);

    unmount();
    await vi.advanceTimersByTimeAsync(GHOSTING_TIMEOUT_MS * 2);

    expect(onReply).not.toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not restart the timer when only the callbacks change', async () => {
    const { rerender } = renderHook(
      ({ tick }) =>
        useGhostingTimer({
          pendingMessage: MESSAGE,
          waitForReply: ghostingPartner.waitForReply,
          onReply: () => onReply(tick),
          onTimeout: () => onTimeout(tick),
        }),
      { initialProps: { tick: 1 } },
    );

    await act(() => vi.advanceTimersByTimeAsync(3000));
    rerender({ tick: 2 }); // new callback identities
    await act(() => vi.advanceTimersByTimeAsync(2000));

    expect(onTimeout).toHaveBeenCalledWith(2); // fired at 5 s, latest callback
  });
});
