import { useId, useState } from 'react';

import { SORT_OPTIONS, rankSquads } from '../data/leaderboard';

import './SquadLeaderboard.css';

const COLUMNS = Object.freeze([
  { key: 'wwcdCount', label: 'WWCD' },
  { key: 'placementPts', label: 'Placement' },
  { key: 'killPts', label: 'Kills' },
  { key: 'totalPts', label: 'Total' },
]);

const WWCD_FILTERS = Object.freeze([0, 1, 2, 3]);

/**
 * PVS squad leaderboard.
 * State holds ONLY the user's choices; the ranked rows are derived
 * during render with the pure rankSquads() function.
 */
export function SquadLeaderboard({ standings }) {
  const searchId = useId();
  const sortId = useId();
  const wwcdId = useId();

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('totalPts');
  const [minWwcd, setMinWwcd] = useState(0);

  // Derived state: no useEffect, no copy of the list in state.
  const rows = rankSquads(standings, { sortBy, query, minWwcd });

  return (
    <>
      <div className="leaderboard__controls">
        <p className="leaderboard__field">
          <label htmlFor={searchId}>Search squad</label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </p>

        <p className="leaderboard__field">
          <label htmlFor={sortId}>Sort by</label>
          <select id={sortId} value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </p>

        <p className="leaderboard__field">
          <label htmlFor={wwcdId}>Minimum WWCD</label>
          <select
            id={wwcdId}
            value={minWwcd}
            onChange={(event) => setMinWwcd(Number(event.target.value))}
          >
            {WWCD_FILTERS.map((count) => (
              <option key={count} value={count}>
                {count === 0 ? 'Any' : `${count}+`}
              </option>
            ))}
          </select>
        </p>
      </div>

      <output className="leaderboard__count" aria-live="polite">
        Showing {rows.length} of {standings.length} squads
      </output>

      {/* Scrolls on its own at 375 px, so the page never scrolls sideways. */}
      <div className="leaderboard__scroller" role="region" aria-label="Squad standings table" tabIndex={0}>
        <table className="leaderboard__table">
          <caption>PVS Grand Finals standings (sample data)</caption>

          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Squad</th>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={column.key === sortBy ? 'descending' : undefined}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 2} className="leaderboard__empty">
                  No squads match your search.
                </td>
              </tr>
            ) : (
              rows.map((squad) => (
                <tr key={squad.squadId}>
                  <td>#{squad.rank}</td>
                  <th scope="row">{squad.squadName}</th>
                  {COLUMNS.map((column) => (
                    <td key={column.key}>{squad[column.key]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
