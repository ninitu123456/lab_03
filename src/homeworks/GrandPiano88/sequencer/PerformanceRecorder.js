/**
 * Performance Recorder
 *
 * Records a piano performance into a FIFO queue of note events:
 *
 *   { midi, freqHz, durationMs, deltaMs }
 *
 * - deltaMs:    time since the PREVIOUS note started
 *               (the first note: time since recording started).
 * - durationMs: how long the note was held.
 *
 * Events stay in the order the notes STARTED (first in, first out),
 * even when notes are released in a different order (chords).
 */

// Safety cap so a forgotten recording cannot grow memory forever.
export const MAX_RECORDED_EVENTS = 2000;

export class PerformanceRecorder {
  constructor({ now = () => performance.now(), maxEvents = MAX_RECORDED_EVENTS } = {}) {
    // Injectable clock: real time in the app, fake time in tests.
    this.now = now;
    this.maxEvents = maxEvents;

    this.isRecording = false;
    this.events = []; // FIFO: push to the end, replay from the start.
    this.pendingByMidi = new Map(); // midi -> event still being held
    this.recordingStartedAt = 0;
    this.lastNoteStartedAt = 0;
  }

  // 1. Start a fresh recording (previous take is discarded).
  start() {
    this.clear();
    this.isRecording = true;
    this.recordingStartedAt = this.now();
    this.lastNoteStartedAt = this.recordingStartedAt;
  }

  // 2. A note started.
  recordNoteOn(midi, freqHz) {
    if (!this.isRecording) {
      return false;
    }

    if (!Number.isInteger(midi) || !Number.isFinite(freqHz)) {
      throw new TypeError('recordNoteOn expects an integer midi and a numeric freqHz.');
    }

    if (this.events.length >= this.maxEvents) {
      return false;
    }

    const startedAt = this.now();

    // Same key pressed again before release: close the old note first.
    if (this.pendingByMidi.has(midi)) {
      this.recordNoteOff(midi);
    }

    const event = {
      midi,
      freqHz,
      durationMs: 0,
      deltaMs: Math.round(startedAt - this.lastNoteStartedAt),
      startedAt,
    };

    this.events.push(event);
    this.pendingByMidi.set(midi, event);
    this.lastNoteStartedAt = startedAt;

    return true;
  }

  // 3. A note was released.
  recordNoteOff(midi) {
    const event = this.pendingByMidi.get(midi);

    if (!event) {
      return false;
    }

    event.durationMs = Math.round(this.now() - event.startedAt);
    this.pendingByMidi.delete(midi);

    return true;
  }

  // 4. Stop recording; notes still held are closed at "now".
  stop() {
    for (const midi of [...this.pendingByMidi.keys()]) {
      this.recordNoteOff(midi);
    }

    this.isRecording = false;

    return this.getEvents();
  }

  // 5. Immutable snapshot of the FIFO queue (internal fields removed).
  getEvents() {
    return Object.freeze(
      this.events.map(({ midi, freqHz, durationMs, deltaMs }) =>
        Object.freeze({ midi, freqHz, durationMs, deltaMs }),
      ),
    );
  }

  // 6. Forget everything.
  clear() {
    this.events = [];
    this.pendingByMidi.clear();
    this.isRecording = false;
  }
}

/**
 * Total length of a recording in milliseconds
 * (when the last note finishes).
 */
export function getRecordingDurationMs(events) {
  let onsetMs = 0;
  let endMs = 0;

  for (const event of events) {
    onsetMs += event.deltaMs;
    endMs = Math.max(endMs, onsetMs + event.durationMs);
  }

  return endMs;
}
