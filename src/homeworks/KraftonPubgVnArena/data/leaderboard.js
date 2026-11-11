/**
 * Leaderboard as PURE derived state.
 *
 * The UI stores only the user's choices (sort key, search, filter).
 * The ranked list is recomputed from the immutable standings during
 * render, never copied into extra state that could go stale.
 */

export const SORT_OPTIONS = Object.freeze([
  Object.freeze({ key: 'totalPts', label: 'Total points' }),
  Object.freeze({ key: 'wwcdCount', label: 'WWCD (Chicken Dinners)' }),
  Object.freeze({ key: 'placementPts', label: 'Placement points' }),
  Object.freeze({ key: 'killPts', label: 'Kill points' }),
]);

const SORT_KEYS = new Set(SORT_OPTIONS.map((option) => option.key));

export function getTotalPoints(squad) {
  return squad.placementPts + squad.killPts;
}

// PUBG-style tie-breakers after the chosen key:
// total points -> WWCD -> placement points -> kill points -> name.
const TIE_BREAKERS = ['totalPts', 'wwcdCount', 'placementPts', 'killPts'];

function compareSquads(sortBy) {
  const keys = [sortBy, ...TIE_BREAKERS.filter((key) => key !== sortBy)];

  return (a, b) => {
    for (const key of keys) {
      if (b[key] !== a[key]) {
        return b[key] - a[key]; // higher is better
      }
    }

    return a.squadName.localeCompare(b.squadName);
  };
}

/**
 * @param {ReadonlyArray<object>} standings
 * @param {{ sortBy?: string, query?: string, minWwcd?: number }} options
 * @returns {ReadonlyArray<object>} frozen rows with totalPts and rank
 */
export function rankSquads(standings, { sortBy = 'totalPts', query = '', minWwcd = 0 } = {}) {
  if (!SORT_KEYS.has(sortBy)) {
    throw new RangeError(`Unknown sort key: ${sortBy}`);
  }

  // 1. Rank the FULL field, so a search never changes a squad's rank.
  const ranked = standings
    .map((squad) => ({ ...squad, totalPts: getTotalPoints(squad) }))
    .toSorted(compareSquads(sortBy))
    .map((squad, index) => Object.freeze({ ...squad, rank: index + 1 }));

  // 2. Then filter what is shown.
  const needle = query.trim().toLocaleLowerCase('vi-VN');

  return Object.freeze(
    ranked.filter(
      (squad) =>
        squad.wwcdCount >= minWwcd &&
        squad.squadName.toLocaleLowerCase('vi-VN').includes(needle),
    ),
  );
}
