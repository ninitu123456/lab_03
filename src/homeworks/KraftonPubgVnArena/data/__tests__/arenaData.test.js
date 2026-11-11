import { describe, expect, it } from 'vitest';

import {
  AIRDROP_WINDOW_MS,
  DROP_PHASES,
  SQUAD_STANDINGS,
  createCrateDrops,
  getDropPhase,
} from '../arenaData';
import { formatCountdown, formatVnd } from '../formatters';

const NOW = 1_800_000_000_000;

describe('arena data', () => {
  it('contains the four Vietnamese squads', () => {
    expect(SQUAD_STANDINGS.map((squad) => squad.squadName)).toEqual([
      'The Expendables',
      'Cerberus Esports',
      'Roy Esports',
      'AGG',
    ]);
  });

  it('is immutable', () => {
    const drops = createCrateDrops(NOW);

    expect(Object.isFrozen(SQUAD_STANDINGS)).toBe(true);
    expect(Object.isFrozen(SQUAD_STANDINGS[0])).toBe(true);
    expect(Object.isFrozen(drops[0])).toBe(true);
  });

  it('creates one live drop and later drops relative to now', () => {
    const [live, soon] = createCrateDrops(NOW);

    expect(live.dropEpochMs).toBeLessThan(NOW);
    expect(soon.dropEpochMs).toBeGreaterThan(NOW);
  });
});

describe('getDropPhase', () => {
  const drop = { remainingStock: 3, dropEpochMs: NOW };

  it('is WARMUP before the drop time', () => {
    expect(getDropPhase(drop, 5000, NOW - 5000)).toBe(DROP_PHASES.WARMUP);
  });

  it('is AIRDROP_LIVE when the countdown reaches zero', () => {
    expect(getDropPhase(drop, 0, NOW)).toBe(DROP_PHASES.AIRDROP_LIVE);
  });

  it('is LOOTED_OUT when stock is gone', () => {
    expect(getDropPhase({ ...drop, remainingStock: 0 }, 0, NOW)).toBe(DROP_PHASES.LOOTED_OUT);
  });

  it('is EXPIRED after the airdrop window', () => {
    expect(getDropPhase(drop, 0, NOW + AIRDROP_WINDOW_MS)).toBe(DROP_PHASES.EXPIRED);
  });
});

describe('formatters', () => {
  it('formats VND with vi-VN grouping and the ₫ sign', () => {
    // vi-VN uses "." for thousands and a non-breaking space before ₫.
    expect(formatVnd(1_250_000)).toMatch(/^1\.250\.000\s₫$/);
  });

  it('rejects invalid amounts', () => {
    expect(() => formatVnd(Number.NaN)).toThrow(TypeError);
  });

  it('formats countdowns', () => {
    expect(formatCountdown(90_500)).toBe('01:31');
    expect(formatCountdown(3_725_000)).toBe('1:02:05');
    expect(formatCountdown(-10)).toBe('00:00');
  });
});
