import { describe, expect, it, vi } from 'vitest';

import { scheduleRelease, validateEnvelope } from '../adsr';

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
});
