import { useId, useRef, useState } from 'react';

import { WEAPONS, filterKillFeed, formatMatchTime } from '../data/killFeed';
import { getVirtualWindow } from '../data/virtualWindow';

import './KillFeed.css';

// Must match .kill-feed__row height and .kill-feed__viewport height in CSS.
export const ROW_HEIGHT = 56;
export const VIEWPORT_HEIGHT = 336;

/**
 * Filterable, virtualized kill feed.
 * Only ~12 of the (possibly hundreds of) entries exist in the DOM.
 */
export function KillFeed({ entries, squads }) {
  const squadId = useId();
  const weaponId = useId();
  const headshotId = useId();

  const viewportRef = useRef(null);
  const [filters, setFilters] = useState({ squadId: 'all', weapon: 'all', headshotsOnly: false });
  const [scrollTop, setScrollTop] = useState(0);

  // Derived: filtered list + visible window, recomputed during render.
  const visibleEntries = filterKillFeed(entries, filters);
  const { startIndex, endIndex, offsetY, totalHeight } = getVirtualWindow({
    itemCount: visibleEntries.length,
    rowHeight: ROW_HEIGHT,
    viewportHeight: VIEWPORT_HEIGHT,
    scrollTop,
  });

  // A new filter starts at the top of the feed (done in the event, not an effect).
  const updateFilter = (name, value) => {
    setFilters((previous) => ({ ...previous, [name]: value }));
    setScrollTop(0);

    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
    }
  };

  return (
    <>
      <div className="kill-feed__controls">
        <p className="kill-feed__field">
          <label htmlFor={squadId}>Squad</label>
          <select
            id={squadId}
            value={filters.squadId}
            onChange={(event) => updateFilter('squadId', event.target.value)}
          >
            <option value="all">All squads</option>
            {squads.map((squad) => (
              <option key={squad.squadId} value={squad.squadId}>
                {squad.squadName}
              </option>
            ))}
          </select>
        </p>

        <p className="kill-feed__field">
          <label htmlFor={weaponId}>Weapon</label>
          <select
            id={weaponId}
            value={filters.weapon}
            onChange={(event) => updateFilter('weapon', event.target.value)}
          >
            <option value="all">All weapons</option>
            {WEAPONS.map((weapon) => (
              <option key={weapon} value={weapon}>
                {weapon}
              </option>
            ))}
          </select>
        </p>

        <p className="kill-feed__check">
          <input
            id={headshotId}
            type="checkbox"
            checked={filters.headshotsOnly}
            onChange={(event) => updateFilter('headshotsOnly', event.target.checked)}
          />
          <label htmlFor={headshotId}>Headshots only</label>
        </p>
      </div>

      <output className="kill-feed__count" aria-live="polite">
        {visibleEntries.length} of {entries.length} kills
      </output>

      <div
        ref={viewportRef}
        className="kill-feed__viewport"
        role="region"
        aria-label="Kill feed, newest first"
        tabIndex={0}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        {visibleEntries.length === 0 ? (
          <p className="kill-feed__empty">No kills match these filters.</p>
        ) : (
          <div className="kill-feed__spacer" style={{ height: totalHeight }}>
            <ol className="kill-feed__list" style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleEntries.slice(startIndex, endIndex).map((entry, index) => (
                <li
                  key={entry.id}
                  className="kill-feed__row"
                  aria-setsize={visibleEntries.length}
                  aria-posinset={startIndex + index + 1}
                >
                  <span className="kill-feed__line">
                    <strong>{entry.killer}</strong> eliminated <strong>{entry.victim}</strong>
                  </span>
                  <span className="kill-feed__meta">
                    <time>{formatMatchTime(entry.matchSecond)}</time> · {entry.weapon}
                    {entry.isHeadshot && <span className="kill-feed__headshot"> · Headshot</span>}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </>
  );
}
