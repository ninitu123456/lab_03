/**
 * "Hẹn Hò Nhưng Không Yêu" finite state machine.
 *
 * BAD (boolean soup): isDating=true, isLoved=false, hasTitle=false ...
 *   3 booleans = 8 combinations, most of them contradictory
 *   (e.g. isLoved=true but isDating=false and hasTitle=true).
 *
 * GOOD: exactly ONE phase at a time, and only the transitions listed
 * below are possible. Contradictory UI states cannot be represented.
 */

export const PHASES = Object.freeze({
  FRIENDS: 'FRIENDS',
  DATING_NO_LOVE: 'DATING_NO_LOVE', // 'Hẹn hò nhưng không yêu'
  OFFICIAL_LOVE: 'OFFICIAL_LOVE', // verified mutual commitment
  GHOSTED_EXIT: 'GHOSTED_EXIT', // left with self-respect, memory freed
});

export const EVENTS = Object.freeze({
  START_DATING: 'START_DATING',
  MUTUAL_COMMITMENT: 'MUTUAL_COMMITMENT',
  REPLY_TIMEOUT: 'REPLY_TIMEOUT', // 'Seen không rep'
  STOP: 'STOP', // 'Dừng lại'
  BREAK_UP: 'BREAK_UP',
  RESET: 'RESET',
});

// phase -> event -> next phase. Anything not listed is ignored.
export const TRANSITIONS = Object.freeze({
  [PHASES.FRIENDS]: Object.freeze({
    [EVENTS.START_DATING]: PHASES.DATING_NO_LOVE,
  }),
  [PHASES.DATING_NO_LOVE]: Object.freeze({
    [EVENTS.MUTUAL_COMMITMENT]: PHASES.OFFICIAL_LOVE,
    [EVENTS.REPLY_TIMEOUT]: PHASES.GHOSTED_EXIT,
    [EVENTS.STOP]: PHASES.GHOSTED_EXIT,
  }),
  [PHASES.OFFICIAL_LOVE]: Object.freeze({
    [EVENTS.BREAK_UP]: PHASES.GHOSTED_EXIT,
  }),
  [PHASES.GHOSTED_EXIT]: Object.freeze({
    [EVENTS.RESET]: PHASES.FRIENDS,
  }),
});

export function canTransition(phase, event) {
  return Boolean(TRANSITIONS[phase]?.[event]);
}

/** Pure: returns the next phase, or the same phase for an illegal event. */
export function transition(phase, event) {
  if (!(phase in TRANSITIONS)) {
    throw new RangeError(`Unknown phase: ${phase}`);
  }

  return TRANSITIONS[phase][event] ?? phase;
}

export const INITIAL_MACHINE_STATE = Object.freeze({
  phase: PHASES.DATING_NO_LOVE,
  history: Object.freeze([]),
});

/**
 * Reducer for useReducer: keeps the phase and an immutable history
 * of accepted transitions. Illegal events return the SAME state object,
 * so React skips the re-render.
 */
export function relationshipReducer(state, action) {
  const next = transition(state.phase, action.type);

  if (next === state.phase) {
    return state;
  }

  return Object.freeze({
    phase: next,
    history: Object.freeze([
      ...state.history,
      Object.freeze({ from: state.phase, to: next, event: action.type }),
    ]),
  });
}
