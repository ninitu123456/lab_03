import { describe, expect, it } from 'vitest';

import {
  EVENTS,
  INITIAL_MACHINE_STATE,
  PHASES,
  TRANSITIONS,
  canTransition,
  relationshipReducer,
  transition,
} from '../relationshipMachine';

const run = (events, state = INITIAL_MACHINE_STATE) =>
  events.reduce((current, type) => relationshipReducer(current, { type }), state);

describe('relationship state machine', () => {
  it('has exactly four phases (no boolean soup)', () => {
    expect(Object.values(PHASES)).toEqual([
      'FRIENDS',
      'DATING_NO_LOVE',
      'OFFICIAL_LOVE',
      'GHOSTED_EXIT',
    ]);
    expect(Object.keys(TRANSITIONS)).toEqual(Object.values(PHASES));
  });

  it('starts in DATING_NO_LOVE ("Hẹn hò nhưng không yêu")', () => {
    expect(INITIAL_MACHINE_STATE.phase).toBe(PHASES.DATING_NO_LOVE);
  });

  it('moves to OFFICIAL_LOVE only on mutual commitment', () => {
    expect(transition(PHASES.DATING_NO_LOVE, EVENTS.MUTUAL_COMMITMENT)).toBe(PHASES.OFFICIAL_LOVE);
  });

  it('exits on a reply timeout or on "Dừng lại"', () => {
    expect(transition(PHASES.DATING_NO_LOVE, EVENTS.REPLY_TIMEOUT)).toBe(PHASES.GHOSTED_EXIT);
    expect(transition(PHASES.DATING_NO_LOVE, EVENTS.STOP)).toBe(PHASES.GHOSTED_EXIT);
  });

  it('ignores illegal transitions', () => {
    // Friends cannot jump straight to official love.
    expect(canTransition(PHASES.FRIENDS, EVENTS.MUTUAL_COMMITMENT)).toBe(false);
    expect(transition(PHASES.FRIENDS, EVENTS.MUTUAL_COMMITMENT)).toBe(PHASES.FRIENDS);
  });

  it('rejects unknown phases', () => {
    expect(() => transition('IT_IS_COMPLICATED', EVENTS.STOP)).toThrow(RangeError);
  });

  it('records an immutable history of accepted transitions', () => {
    const state = run([EVENTS.STOP, EVENTS.RESET, EVENTS.START_DATING]);

    expect(state.phase).toBe(PHASES.DATING_NO_LOVE);
    expect(state.history).toEqual([
      { from: 'DATING_NO_LOVE', to: 'GHOSTED_EXIT', event: 'STOP' },
      { from: 'GHOSTED_EXIT', to: 'FRIENDS', event: 'RESET' },
      { from: 'FRIENDS', to: 'DATING_NO_LOVE', event: 'START_DATING' },
    ]);
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.history)).toBe(true);
  });

  it('returns the SAME state object for an illegal event (no re-render)', () => {
    const state = run([EVENTS.MUTUAL_COMMITMENT]); // now OFFICIAL_LOVE

    expect(relationshipReducer(state, { type: EVENTS.REPLY_TIMEOUT })).toBe(state);
  });

  it('never mutates the previous state', () => {
    const before = INITIAL_MACHINE_STATE;
    const after = relationshipReducer(before, { type: EVENTS.STOP });

    expect(before.phase).toBe(PHASES.DATING_NO_LOVE);
    expect(before.history).toHaveLength(0);
    expect(after).not.toBe(before);
  });
});
