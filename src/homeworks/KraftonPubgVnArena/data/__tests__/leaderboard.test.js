import { describe, expect, it } from 'vitest';

import { SQUAD_STANDINGS } from '../arenaData';
import { SORT_OPTIONS, getTotalPoints, rankSquads } from '../leaderboard';

const names = (rows) => rows.map((row) => row.squadName);

describe('leaderboard', () => {
  it('offers the WWCD, placement and kill sort options', () => {
    expect(SORT_OPTIONS.map((option) => option.key)).toEqual([
      'totalPts',
      'wwcdCount',
      'placementPts',
      'killPts',
    ]);
  });

  it('computes total points as placement + kill points', () => {
    expect(getTotalPoints({ placementPts: 58, killPts: 61 })).toBe(119);
  });

  it('ranks by total points by default', () => {
    const rows = rankSquads(SQUAD_STANDINGS);

    // TE 119, CES 113, ROY 108, AGG 91
    expect(names(rows)).toEqual(['The Expendables', 'Cerberus Esports', 'Roy Esports', 'AGG']);
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3, 4]);
    expect(rows[0].totalPts).toBe(119);
  });

  it('sorts by kill points', () => {
    expect(names(rankSquads(SQUAD_STANDINGS, { sortBy: 'killPts' }))).toEqual([
      'The Expendables',
      'Roy Esports',
      'Cerberus Esports',
      'AGG',
    ]);
  });

  it('sorts by placement points', () => {
    expect(names(rankSquads(SQUAD_STANDINGS, { sortBy: 'placementPts' }))[0]).toBe('Cerberus Esports');
  });

  it('breaks WWCD ties with total points', () => {
    // CES and ROY both have 2 WWCD; CES has more total points.
    expect(names(rankSquads(SQUAD_STANDINGS, { sortBy: 'wwcdCount' }))).toEqual([
      'The Expendables',
      'Cerberus Esports',
      'Roy Esports',
      'AGG',
    ]);
  });

  it('keeps the original rank when searching', () => {
    const rows = rankSquads(SQUAD_STANDINGS, { query: '  ROY ' });

    expect(names(rows)).toEqual(['Roy Esports']);
    expect(rows[0].rank).toBe(3);
  });

  it('filters by minimum WWCD count', () => {
    expect(names(rankSquads(SQUAD_STANDINGS, { minWwcd: 2 }))).toEqual([
      'The Expendables',
      'Cerberus Esports',
      'Roy Esports',
    ]);
  });

  it('never mutates the input and returns frozen rows', () => {
    const before = JSON.stringify(SQUAD_STANDINGS);
    const rows = rankSquads(SQUAD_STANDINGS, { sortBy: 'killPts' });

    expect(JSON.stringify(SQUAD_STANDINGS)).toBe(before);
    expect(Object.isFrozen(rows)).toBe(true);
    expect(Object.isFrozen(rows[0])).toBe(true);
  });

  it('rejects an unknown sort key', () => {
    expect(() => rankSquads(SQUAD_STANDINGS, { sortBy: 'kd' })).toThrow(RangeError);
  });
});
