/**
 * Asymmetric effort ("Em cố trăm lần chẳng bằng ai đó một phần").
 *
 * Every interaction is an IMMUTABLE signal appended to a log.
 * Scores are never stored: they are derived from the log when needed.
 */

import { PHASES } from './relationshipMachine';

export const ACTORS = Object.freeze({
  EM: 'EM', // "Em cố trăm lần"
  AI_DO: 'AI_DO', // "Ai đó một phần"
});

// Same weights as the course reference component.
export const EFFORT_MULTIPLIERS = Object.freeze({
  [ACTORS.EM]: 0.1,
  [ACTORS.AI_DO]: 50,
});

export const MAX_STEPS_PER_SIGNAL = 1000;

// Round to 2 decimals: 100 x 0.1 must be exactly 10, not 9.999999999.
const round2 = (value) => Math.round(value * 100) / 100;

/**
 * @returns {Readonly<{id:string, actor:string, steps:number, multiplier:number, impact:number}>}
 */
export function createEffortSignal({ actor, steps }) {
  if (!(actor in EFFORT_MULTIPLIERS)) {
    throw new RangeError(`Unknown actor: ${actor}`);
  }

  if (!Number.isInteger(steps) || steps < 1 || steps > MAX_STEPS_PER_SIGNAL) {
    throw new RangeError(`Steps must be an integer from 1 to ${MAX_STEPS_PER_SIGNAL}.`);
  }

  const multiplier = EFFORT_MULTIPLIERS[actor];

  return Object.freeze({
    id: crypto.randomUUID(),
    actor,
    steps,
    multiplier,
    impact: round2(steps * multiplier),
  });
}

/** Immutable append: [...previous, signal]. */
export function appendSignal(log, signal) {
  return Object.freeze([...log, signal]);
}

/** Pure derived totals. */
export function summarizeEffort(log) {
  const totals = log.reduce(
    (sum, signal) => {
      const key = signal.actor === ACTORS.EM ? 'em' : 'rival';

      return {
        ...sum,
        [`${key}Steps`]: sum[`${key}Steps`] + signal.steps,
        [`${key}Score`]: sum[`${key}Score`] + signal.impact,
      };
    },
    { emSteps: 0, emScore: 0, rivalSteps: 0, rivalScore: 0 },
  );

  return Object.freeze({
    ...totals,
    emScore: round2(totals.emScore),
    rivalScore: round2(totals.rivalScore),
  });
}

/**
 * Pure red-flag verdict from the phase and the derived scores.
 */
export function getRedFlag(phase, { emScore, rivalScore }) {
  if (phase === PHASES.GHOSTED_EXIT) {
    return Object.freeze({
      level: 'EXIT',
      message: 'Đã dừng lại: thoát khỏi situationship, bộ nhớ đã được giải phóng.',
    });
  }

  if (phase === PHASES.OFFICIAL_LOVE) {
    return Object.freeze({ level: 'OK', message: '[OK] Cam kết hai chiều đã được xác nhận.' });
  }

  if (phase === PHASES.DATING_NO_LOVE && emScore < rivalScore) {
    return Object.freeze({
      level: 'RED_FLAG',
      message: `[RED-FLAG] Hẹn hò nhưng không yêu: em ${emScore} điểm, ai đó ${rivalScore} điểm. Giải phóng bộ nhớ!`,
    });
  }

  return Object.freeze({ level: 'OK', message: '[OK] Stable' });
}
