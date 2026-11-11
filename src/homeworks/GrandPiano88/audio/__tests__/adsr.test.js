import { describe, expect, it, vi } from 'vitest';

import {
  SILENT_GAIN,
  scheduleFadeOut,
  scheduleRelease,
  validateEnvelope,
} from '../adsr';


describe('ADSR Envelope', () => {
  it('rejects invalid envelope values', () => {
    expect(() =>
      validateEnvelope({ attack: -1, decay: 0, sustain: 0.5, release: 0 }),
    ).toThrow(RangeError);

    expect(() =>
      validateEnvelope({ attack: 0, decay: 0, sustain: 1.5, release: 0 }),
    ).toThrow(RangeError);
  });

  it('accepts a valid envelope', () => {
    const envelope = { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 };
    expect(validateEnvelope(envelope)).toBe(envelope);
  });

  it('uses cancelAndHoldAtTime when available', () => {
    const param = {
      cancelAndHoldAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    };

    const endTime = scheduleRelease(param, 2, {
      attack: 0,
      decay: 0,
      sustain: 1,
      release: 0.5,
    });

    expect(param.cancelAndHoldAtTime).toHaveBeenCalledWith(2);
    expect(param.cancelScheduledValues).not.toHaveBeenCalled();
    expect(param.linearRampToValueAtTime).toHaveBeenCalledWith(0, 2.5);
    expect(endTime).toBe(2.5);
  });
    it('schedules a click-free exponential fade-out', () => {
    const param = {
      value: 0.5,
      cancelScheduledValues: vi.fn(),
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    };

    const endTime = scheduleFadeOut(param, 1, 0.04);

    // Fallback path: hold the current value, then ramp down.
    expect(param.cancelScheduledValues).toHaveBeenCalledWith(1);
    expect(param.setValueAtTime).toHaveBeenCalledWith(0.5, 1);
    expect(param.exponentialRampToValueAtTime).toHaveBeenCalledWith(SILENT_GAIN, 1.04);
    expect(endTime).toBe(1.04);
  });
});
