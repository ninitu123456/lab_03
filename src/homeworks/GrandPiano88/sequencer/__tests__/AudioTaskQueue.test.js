import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { abortableDelay } from '../abortableDelay';
import { AudioTaskQueue } from '../AudioTaskQueue';

describe('AudioTaskQueue', () => {
  let queue;

  beforeEach(() => {
    vi.useFakeTimers();
    queue = new AudioTaskQueue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs tasks one at a time in FIFO order', async () => {
    const log = [];

    const makeTask = (name, ms) => async (signal) => {
      log.push(`${name}:start`);
      await abortableDelay(ms, signal);
      log.push(`${name}:end`);
      return name;
    };

    const results = Promise.all([
      queue.enqueue(makeTask('A', 300)),
      queue.enqueue(makeTask('B', 100)),
      queue.enqueue(makeTask('C', 200)),
    ]);

    expect(queue.size).toBe(3);

    await vi.advanceTimersByTimeAsync(600);

    expect(await results).toEqual(['A', 'B', 'C']);
    expect(log).toEqual([
      'A:start', 'A:end',
      'B:start', 'B:end',
      'C:start', 'C:end',
    ]);
    expect(queue.size).toBe(0);
  });

  it('keeps running after a task fails', async () => {
    const failing = queue.enqueue(async () => {
      throw new Error('boom');
    });
    const next = queue.enqueue(async () => 'still runs');

    await expect(failing).rejects.toThrow('boom');
    await expect(next).resolves.toBe('still runs');
  });

  it('abortAll cancels the running task and rejects waiting tasks', async () => {
    const running = queue.enqueue((signal) => abortableDelay(1000, signal));
    const waiting = queue.enqueue(async () => 'never');

    await vi.advanceTimersByTimeAsync(100);
    queue.abortAll();

    await expect(running).rejects.toMatchObject({ name: 'AbortError' });
    await expect(waiting).rejects.toMatchObject({ name: 'AbortError' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('is still usable after abortAll', async () => {
    queue.abortAll();

    await expect(queue.enqueue(async () => 'ok')).resolves.toBe('ok');
  });

  it('rejects non-function tasks', () => {
    expect(() => queue.enqueue('not a task')).toThrow(TypeError);
  });
});
