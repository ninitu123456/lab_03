import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { abortableDelay, isAbortError } from '../abortableDelay';

describe('abortableDelay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after the given time', async () => {
    const onDone = vi.fn();

    abortableDelay(100).then(onDone);

    await vi.advanceTimersByTimeAsync(99);
    expect(onDone).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(onDone).toHaveBeenCalled();
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort(new DOMException('Stopped', 'AbortError'));

    await expect(abortableDelay(100, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('rejects on abort and clears its timer', async () => {
    const controller = new AbortController();
    const promise = abortableDelay(1000, controller.signal);

    controller.abort(new DOMException('Stopped', 'AbortError'));

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('detects abort errors', () => {
    expect(isAbortError(new DOMException('x', 'AbortError'))).toBe(true);
    expect(isAbortError(new Error('x'))).toBe(false);
  });
});
