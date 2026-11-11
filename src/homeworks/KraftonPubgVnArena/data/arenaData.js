/**
 * KRAFTON x PUBG Vietnam Arena – domain data.
 *
 * SAMPLE DATA for Lab 03 only (not official PVS results).
 * Every record is frozen: components can read it, never mutate it.
 */

export const DROP_PHASES = Object.freeze({
  WARMUP: 'WARMUP',
  AIRDROP_LIVE: 'AIRDROP_LIVE',
  LOOTED_OUT: 'LOOTED_OUT',
  EXPIRED: 'EXPIRED',
});

// How long a drop stays claimable after it goes live.
export const AIRDROP_WINDOW_MS = 10 * 60 * 1000;

const freezeAll = (items) => Object.freeze(items.map((item) => Object.freeze(item)));

/** @type {ReadonlyArray<PubgVnSquadStanding>} */
export const SQUAD_STANDINGS = freezeAll([
  { squadId: 'te', squadName: 'The Expendables', wwcdCount: 3, placementPts: 58, killPts: 61 },
  { squadId: 'ces', squadName: 'Cerberus Esports', wwcdCount: 2, placementPts: 64, killPts: 49 },
  { squadId: 'roy', squadName: 'Roy Esports', wwcdCount: 2, placementPts: 51, killPts: 57 },
  { squadId: 'agg', squadName: 'AGG', wwcdCount: 1, placementPts: 47, killPts: 44 },
]);

/**
 * Crate drops relative to `now`, so the demo always has
 * one live drop and upcoming drops.
 *
 * @param {number} now - epoch ms
 * @returns {ReadonlyArray<PubgCrateDrop>}
 */
export function createCrateDrops(now = Date.now()) {
  return freezeAll([
    {
      id: 'vip-pass',
      title: 'PVS Finals VIP Pass + 5,000 G-Coin',
      priceVnd: 1_250_000,
      remainingStock: 5,
      dropEpochMs: now - 60_000, // live now
    },
    {
      id: 'gcoin-crate',
      title: 'G-Coin Contraband Crate (1,800 G-Coin)',
      priceVnd: 450_000,
      remainingStock: 12,
      dropEpochMs: now + 90_000, // in 1.5 minutes
    },
    {
      id: 'standard-ticket',
      title: 'PVS Grand Finals Standard Ticket',
      priceVnd: 350_000,
      remainingStock: 40,
      dropEpochMs: now + 15 * 60_000, // in 15 minutes
    },
  ]);
}

/**
 * Pure phase derivation: no state, computed from time and stock.
 */
export function getDropPhase(drop, remainingMs, now = Date.now()) {
  if (remainingMs > 0) {
    return DROP_PHASES.WARMUP;
  }

  if (drop.remainingStock <= 0) {
    return DROP_PHASES.LOOTED_OUT;
  }

  if (now >= drop.dropEpochMs + AIRDROP_WINDOW_MS) {
    return DROP_PHASES.EXPIRED;
  }

  return DROP_PHASES.AIRDROP_LIVE;
}

/**
 * @typedef {Object} PubgCrateDrop
 * @property {string} id
 * @property {string} title
 * @property {number} priceVnd
 * @property {number} remainingStock
 * @property {number} dropEpochMs
 */

/**
 * @typedef {Object} PubgVnSquadStanding
 * @property {string} squadId
 * @property {string} squadName
 * @property {number} wwcdCount  Winner Winner Chicken Dinner count
 * @property {number} placementPts
 * @property {number} killPts
 */
