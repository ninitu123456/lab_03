import { describe, expect, it } from 'vitest';

import {
  ACTORS,
  appendSignal,
  createEffortSignal,
  getRedFlag,
  summarizeEffort,
} from '../effortSignals';
import { PHASES } from '../relationshipMachine';

const em = (steps) => createEffortSignal({ actor: ACTORS.EM, steps });
const aiDo = (steps) => createEffortSignal({ actor: ACTORS.AI_DO, steps });

describe('effort signals', () => {
  it('creates frozen signals with the asymmetric multipliers', () => {
    const signal = em(100);

    expect(signal).toMatchObject({ actor: 'EM', steps: 100, multiplier: 0.1, impact: 10 });
    expect(aiDo(1)).toMatchObject({ multiplier: 50, impact: 50 });
    expect(Object.isFrozen(signal)).toBe(true);
    expect(signal.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('validates the actor and the number of steps', () => {
    expect(() => createEffortSignal({ actor: 'ANH', steps: 1 })).toThrow(RangeError);
    expect(() => em(0)).toThrow(RangeError);
    expect(() => em(1.5)).toThrow(RangeError);
    expect(() => em(1001)).toThrow(RangeError);
  });

  it('appends immutably ([...prev, signal])', () => {
    const empty = Object.freeze([]);
    const log = appendSignal(empty, em(1));

    expect(empty).toHaveLength(0);
    expect(log).toHaveLength(1);
    expect(Object.isFrozen(log)).toBe(true);
  });

  it('"Em cố trăm lần" (100 x 0.1) is less than "ai đó một phần" (1 x 50)', () => {
    let log = Object.freeze([]);

    // 100 separate tries of 1 step each: no floating point drift.
    for (let i = 0; i < 100; i += 1) {
      log = appendSignal(log, em(1));
    }
    log = appendSignal(log, aiDo(1));

    expect(summarizeEffort(log)).toEqual({
      emSteps: 100,
      emScore: 10,
      rivalSteps: 1,
      rivalScore: 50,
    });
  });

  it('summarizes an empty log to zero', () => {
    expect(summarizeEffort([])).toEqual({ emSteps: 0, emScore: 0, rivalSteps: 0, rivalScore: 0 });
  });
});

describe('getRedFlag', () => {
  it('raises a red flag while dating without love and losing on effort', () => {
    const verdict = getRedFlag(PHASES.DATING_NO_LOVE, { emScore: 10, rivalScore: 50 });

    expect(verdict.level).toBe('RED_FLAG');
    expect(verdict.message).toContain('Hẹn hò nhưng không yêu');
  });

  it('is stable when the effort is not lopsided', () => {
    expect(getRedFlag(PHASES.DATING_NO_LOVE, { emScore: 60, rivalScore: 50 }).level).toBe('OK');
  });

  it('never raises a red flag after official love or an exit', () => {
    const lopsided = { emScore: 1, rivalScore: 999 };

    expect(getRedFlag(PHASES.OFFICIAL_LOVE, lopsided).level).toBe('OK');
    expect(getRedFlag(PHASES.GHOSTED_EXIT, lopsided).level).toBe('EXIT');
  });
});
