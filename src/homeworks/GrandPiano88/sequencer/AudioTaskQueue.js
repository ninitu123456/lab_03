/**
 * AudioTaskQueue (evolved from Lab 2 HW2)
 *
 * Runs asynchronous audio tasks strictly ONE AT A TIME,
 * in FIFO order (first enqueued, first executed).
 *
 * Every task receives an AbortSignal. abortAll() cancels the
 * running task AND rejects every task still waiting.
 */

function createAbortReason() {
  return new DOMException('Audio task queue was stopped.', 'AbortError');
}

export class AudioTaskQueue {
  constructor() {
    this.pendingTasks = []; // FIFO: push to the end, shift from the front.
    this.isRunning = false;
    this.controller = new AbortController();
  }

  // Tasks waiting + the task currently running.
  get size() {
    return this.pendingTasks.length + (this.isRunning ? 1 : 0);
  }

  /**
   * Adds a task to the end of the queue.
   *
   * @param {(signal: AbortSignal) => Promise<any>} task
   * @returns {Promise<any>} Settles with the task's own result.
   */
  enqueue(task) {
    if (typeof task !== 'function') {
      throw new TypeError('AudioTaskQueue.enqueue expects a function.');
    }

    return new Promise((resolve, reject) => {
      this.pendingTasks.push({
        task,
        resolve,
        reject,
        signal: this.controller.signal,
      });

      void this.drain();
    });
  }

  // Executes queued tasks sequentially until the queue is empty.
  async drain() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      while (this.pendingTasks.length > 0) {
        const entry = this.pendingTasks.shift();

        try {
          entry.signal.throwIfAborted();
          entry.resolve(await entry.task(entry.signal));
        } catch (error) {
          // One failing task never blocks the tasks behind it.
          entry.reject(error);
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  // Cancels the running task and rejects all waiting tasks.
  abortAll(reason = createAbortReason()) {
    const waitingTasks = this.pendingTasks.splice(0);

    this.controller.abort(reason);

    // Fresh controller: the queue stays usable after a stop.
    this.controller = new AbortController();

    for (const entry of waitingTasks) {
      entry.reject(reason);
    }
  }
}
