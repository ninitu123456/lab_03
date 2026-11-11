/**
 * Kill feed: SAMPLE match events generated deterministically
 * (same seed -> same feed), so tests and screenshots are stable.
 * Player handles are fictional.
 */

import { SQUAD_STANDINGS } from './arenaData';

export const WEAPONS = Object.freeze(['M416', 'AKM', 'Beryl M762', 'Kar98k', 'AWM', 'Mini14', 'UMP45', 'S12K']);

const SQUAD_TAGS = Object.freeze({ te: 'TE', ces: 'CES', roy: 'ROY', agg: 'AGG' });
const CALLSIGNS = Object.freeze(['Viper', 'Ghost', 'Rambo', 'Lynx', 'Bolt', 'Shadow', 'Tiger', 'Falcon']);

// Small deterministic PRNG (mulberry32).
function createRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (random, items) => items[Math.floor(random() * items.length)];

/**
 * @returns {ReadonlyArray<{id:string, matchSecond:number, killerSquadId:string,
 *   killer:string, victimSquadId:string, victim:string, weapon:string, isHeadshot:boolean}>}
 */
export function createKillFeed(count = 500, seed = 2026) {
  const random = createRandom(seed);
  const squadIds = SQUAD_STANDINGS.map((squad) => squad.squadId);
  const entries = [];
  let matchSecond = 0;

  for (let index = 0; index < count; index += 1) {
    const killerSquadId = pick(random, squadIds);
    const victimSquadId = pick(random, squadIds.filter((id) => id !== killerSquadId));

    matchSecond += 1 + Math.floor(random() * 12);

    entries.push(
      Object.freeze({
        id: `kill-${index + 1}`,
        matchSecond,
        killerSquadId,
        killer: `${SQUAD_TAGS[killerSquadId]}.${pick(random, CALLSIGNS)}`,
        victimSquadId,
        victim: `${SQUAD_TAGS[victimSquadId]}.${pick(random, CALLSIGNS)}`,
        weapon: pick(random, WEAPONS),
        isHeadshot: random() < 0.3,
      }),
    );
  }

  // Newest kill first, like an in-game feed.
  return Object.freeze(entries.reverse());
}

/**
 * Pure filter (derived state).
 * squadId: entries where the squad is the killer OR the victim.
 */
export function filterKillFeed(entries, { squadId = 'all', weapon = 'all', headshotsOnly = false } = {}) {
  return entries.filter(
    (entry) =>
      (squadId === 'all' || entry.killerSquadId === squadId || entry.victimSquadId === squadId) &&
      (weapon === 'all' || entry.weapon === weapon) &&
      (!headshotsOnly || entry.isHeadshot),
  );
}

/** 754 -> "12:34" (match clock) */
export function formatMatchTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
