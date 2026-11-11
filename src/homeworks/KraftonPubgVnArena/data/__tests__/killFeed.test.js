import { describe, expect, it } from 'vitest';

import { createKillFeed, filterKillFeed, formatMatchTime } from '../killFeed';
import { getVirtualWindow } from '../virtualWindow';

describe('kill feed data', () => {
  const feed = createKillFeed(500);

  it('generates the requested number of frozen entries', () => {
    expect(feed).toHaveLength(500);
    expect(Object.isFrozen(feed)).toBe(true);
    expect(Object.isFrozen(feed[0])).toBe(true);
  });

  it('is deterministic for the same seed', () => {
    expect(createKillFeed(50, 7)).toEqual(createKillFeed(50, 7));
  });

  it('never lists a squad killing itself', () => {
    expect(feed.every((entry) => entry.killerSquadId !== entry.victimSquadId)).toBe(true);
  });

  it('lists the newest kill first', () => {
    expect(feed[0].matchSecond).toBeGreaterThan(feed.at(-1).matchSecond);
  });

  it('filters by squad as killer OR victim', () => {
    const rows = filterKillFeed(feed, { squadId: 'agg' });

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((entry) => entry.killerSquadId === 'agg' || entry.victimSquadId === 'agg')).toBe(true);
  });

  it('combines weapon and headshot filters', () => {
    const rows = filterKillFeed(feed, { weapon: 'AWM', headshotsOnly: true });

    expect(rows.every((entry) => entry.weapon === 'AWM' && entry.isHeadshot)).toBe(true);
  });

  it('formats the match clock', () => {
    expect(formatMatchTime(754)).toBe('12:34');
  });
});

describe('getVirtualWindow', () => {
  const base = { itemCount: 500, rowHeight: 50, viewportHeight: 300, overscan: 2 };

  it('renders only the visible rows plus overscan at the top', () => {
    expect(getVirtualWindow({ ...base, scrollTop: 0 })).toEqual({
      startIndex: 0,
      endIndex: 8, // 6 visible + 2 overscan
      offsetY: 0,
      totalHeight: 25_000,
    });
  });

  it('moves the window when scrolling', () => {
    const window = getVirtualWindow({ ...base, scrollTop: 5000 }); // row 100 at top

    expect(window.startIndex).toBe(98);
    expect(window.endIndex).toBe(108);
    expect(window.offsetY).toBe(98 * 50);
  });

  it('clamps a stale scrollTop after the list shrinks', () => {
    const window = getVirtualWindow({ ...base, itemCount: 4, scrollTop: 9999 });

    expect(window).toMatchObject({ startIndex: 0, endIndex: 4 });
  });

  it('handles an empty list', () => {
    expect(getVirtualWindow({ ...base, itemCount: 0, scrollTop: 0 })).toMatchObject({
      startIndex: 0,
      endIndex: 0,
      totalHeight: 0,
    });
  });
});
