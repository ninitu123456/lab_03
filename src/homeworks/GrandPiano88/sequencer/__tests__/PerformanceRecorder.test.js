import { beforeEach, describe, expect, it } from 'vitest';

import {
  PerformanceRecorder,
  getRecordingDurationMs,
} from '../PerformanceRecorder';

describe('PerformanceRecorder', () => {
  let time;
  let recorder;

  // Fake clock: tests move time forward explicitly.
  const advance = (ms) => {
    time += ms;
  };

  beforeEach(() => {
    time = 1000;
    recorder = new PerformanceRecorder({ now: () => time });
  });

  it('ignores notes when not recording', () => {
    expect(recorder.recordNoteOn(60, 261.63)).toBe(false);
    expect(recorder.getEvents()).toEqual([]);
  });

  it('records { midi, freqHz, durationMs, deltaMs } for each note', () => {
    recorder.start();

    advance(200);
    recorder.recordNoteOn(60, 261.63);
    advance(300);
    recorder.recordNoteOff(60);

    expect(recorder.stop()).toEqual([
      { midi: 60, freqHz: 261.63, durationMs: 300, deltaMs: 200 },
    ]);
  });

  it('measures deltaMs from the previous note start', () => {
    recorder.start();

    recorder.recordNoteOn(60, 261.63); // t = 0
    advance(100);
    recorder.recordNoteOff(60);
    advance(150);
    recorder.recordNoteOn(62, 293.66); // t = 250
    advance(100);
    recorder.recordNoteOff(62);

    const [first, second] = recorder.stop();

    expect(first.deltaMs).toBe(0);
    expect(second.deltaMs).toBe(250);
  });

  it('keeps FIFO start order when a chord is released out of order', () => {
    recorder.start();

    recorder.recordNoteOn(60, 261.63); // C4
    advance(10);
    recorder.recordNoteOn(64, 329.63); // E4
    advance(10);
    recorder.recordNoteOn(67, 392); // G4
    advance(500);

    // Released in reverse order.
    recorder.recordNoteOff(67);
    advance(50);
    recorder.recordNoteOff(60);
    advance(50);
    recorder.recordNoteOff(64);

    const events = recorder.stop();

    expect(events.map((event) => event.midi)).toEqual([60, 64, 67]);
    expect(events.map((event) => event.durationMs)).toEqual([570, 610, 500]);
  });

  it('closes notes that are still held when recording stops', () => {
    recorder.start();

    recorder.recordNoteOn(60, 261.63);
    advance(400);

    const [event] = recorder.stop();

    expect(event.durationMs).toBe(400);
    expect(recorder.isRecording).toBe(false);
  });

  it('closes the previous note when the same key is pressed again', () => {
    recorder.start();

    recorder.recordNoteOn(60, 261.63);
    advance(100);
    recorder.recordNoteOn(60, 261.63);
    advance(100);

    const events = recorder.stop();

    expect(events).toHaveLength(2);
    expect(events[0].durationMs).toBe(100);
  });

  it('returns an immutable snapshot', () => {
    recorder.start();
    recorder.recordNoteOn(60, 261.63);

    const events = recorder.stop();

    expect(Object.isFrozen(events)).toBe(true);
    expect(Object.isFrozen(events[0])).toBe(true);
    expect(events[0]).not.toHaveProperty('startedAt');
  });

  it('starts a fresh take when recording starts again', () => {
    recorder.start();
    recorder.recordNoteOn(60, 261.63);
    recorder.stop();

    recorder.start();

    expect(recorder.getEvents()).toEqual([]);
  });

  it('stops accepting notes after the safety limit', () => {
    const limited = new PerformanceRecorder({ now: () => time, maxEvents: 2 });

    limited.start();
    limited.recordNoteOn(60, 261.63);
    limited.recordNoteOn(62, 293.66);

    expect(limited.recordNoteOn(64, 329.63)).toBe(false);
    expect(limited.stop()).toHaveLength(2);
  });

  it('rejects invalid note data', () => {
    recorder.start();

    expect(() => recorder.recordNoteOn('60', 261.63)).toThrow(TypeError);
    expect(() => recorder.recordNoteOn(60, Number.NaN)).toThrow(TypeError);
  });
});

describe('getRecordingDurationMs', () => {
  it('returns when the last note finishes', () => {
    const events = [
      { midi: 60, freqHz: 261.63, durationMs: 1000, deltaMs: 0 }, // ends 1000
      { midi: 64, freqHz: 329.63, durationMs: 200, deltaMs: 300 }, // ends 500
    ];

    expect(getRecordingDurationMs(events)).toBe(1000);
  });

  it('returns 0 for an empty recording', () => {
    expect(getRecordingDurationMs([])).toBe(0);
  });
});
