/**
 * ADSR Envelope
 *
 * Schedules Attack, Decay, Sustain and Release stages
 * on a Web Audio AudioParam (usually GainNode.gain).
 */

export const DEFAULT_ADSR = Object.freeze({
  attack: 0.01, // Seconds to reach peak volume.
  decay: 0.25, // Seconds to fall to the sustain level.
  sustain: 0.6, // Sustain level as a ratio of peak (0..1).
  release: 0.35, // Seconds to fade out after note off.
});

/**
 * Validates an ADSR envelope.
 *
 * @param {{attack:number, decay:number, sustain:number, release:number}} envelope
 * @returns {object} The same envelope when valid.
 */
export function validateEnvelope(envelope) {
  const { attack, decay, sustain, release } = envelope;
  const isValidTime = (value) => Number.isFinite(value) && value >= 0;

  if (!isValidTime(attack) || !isValidTime(decay) || !isValidTime(release)) {
    throw new RangeError('ADSR times must be non-negative numbers.');
  }

  if (!Number.isFinite(sustain) || sustain < 0 || sustain > 1) {
    throw new RangeError('ADSR sustain must be between 0 and 1.');
  }

  return envelope;
}

/**
 * Freezes the param at its current value from `time` onward,
 * so a release starting mid-attack does not jump in volume.
 */
function holdCurrentValue(param, time) {
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(time);
    return;
  }

  // Fallback for browsers without cancelAndHoldAtTime (e.g. Firefox).
  const currentValue = param.value;
  param.cancelScheduledValues(time);
  param.setValueAtTime(currentValue, time);
}

/**
 * Schedules Attack -> Decay -> Sustain.
 *
 * @returns {number} Time when the sustain stage begins.
 */
export function scheduleAttackDecay(param, startTime, peak, envelope = DEFAULT_ADSR) {
  const { attack, decay, sustain } = validateEnvelope(envelope);
  const attackEnd = startTime + attack;
  const decayEnd = attackEnd + decay;

  param.cancelScheduledValues(startTime);
  param.setValueAtTime(0, startTime);
  param.linearRampToValueAtTime(peak, attackEnd);
  param.linearRampToValueAtTime(peak * sustain, decayEnd);

  return decayEnd;
}

/**
 * Schedules the Release stage.
 *
 * @returns {number} Time when the sound becomes silent.
 */
export function scheduleRelease(param, releaseTime, envelope = DEFAULT_ADSR) {
  const { release } = validateEnvelope(envelope);
  const endTime = releaseTime + release;

  holdCurrentValue(param, releaseTime);
  param.linearRampToValueAtTime(0, endTime);

  return endTime;
}
