import { memo, useId } from 'react';

import { AIRDROP_WINDOW_MS, DROP_PHASES } from '../data/arenaData';
import { formatCountdown, formatVnd } from '../data/formatters';
import { usePubgAirdropTimer } from '../hooks/usePubgAirdropTimer';

import './CrateCard.css';

const PHASE_LABELS = Object.freeze({
  [DROP_PHASES.WARMUP]: 'Warm-up',
  [DROP_PHASES.AIRDROP_LIVE]: 'Airdrop live',
  [DROP_PHASES.LOOTED_OUT]: 'Looted out',
  [DROP_PHASES.EXPIRED]: 'Expired',
});

/**
 * One ticket / crate drop.
 * The phase is DERIVED from two zero-drift timers and the stock:
 * no phase state that could go out of sync.
 */
export const CrateCard = memo(function CrateCard({
  drop,
  isPending,
  status,
  serverOffsetMs = 0,
  onClaim,
}) {
  const titleId = useId();

  const opening = usePubgAirdropTimer(drop.dropEpochMs, serverOffsetMs);
  const closing = usePubgAirdropTimer(drop.dropEpochMs + AIRDROP_WINDOW_MS, serverOffsetMs);

  let phase = DROP_PHASES.AIRDROP_LIVE;

  if (!opening.isLive) {
    phase = DROP_PHASES.WARMUP;
  } else if (drop.remainingStock <= 0) {
    phase = DROP_PHASES.LOOTED_OUT;
  } else if (closing.isLive) {
    phase = DROP_PHASES.EXPIRED;
  }

  const canClaim = phase === DROP_PHASES.AIRDROP_LIVE && !isPending;

  const handleClick = () => {
    if (canClaim) {
      onClaim(drop.id);
    }
  };

  return (
    <article className={`crate-card crate-card--${phase.toLowerCase()}`} aria-labelledby={titleId}>
      <p className="crate-card__phase">{PHASE_LABELS[phase]}</p>

      <h3 id={titleId} className="crate-card__title">
        {drop.title}
      </h3>

      <p className="crate-card__price">{formatVnd(drop.priceVnd)}</p>

      <dl className="crate-card__facts">
        {phase === DROP_PHASES.WARMUP && (
          <div>
            <dt>Drops in</dt>
            <dd>
              <time>{formatCountdown(opening.remainingMs)}</time>
            </dd>
          </div>
        )}

        {phase === DROP_PHASES.AIRDROP_LIVE && (
          <div>
            <dt>Closes in</dt>
            <dd>
              <time>{formatCountdown(closing.remainingMs)}</time>
            </dd>
          </div>
        )}

        <div>
          <dt>In stock</dt>
          <dd>{drop.remainingStock}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="crate-card__claim"
        aria-disabled={!canClaim}
        aria-busy={isPending}
        onClick={handleClick}
      >
        {isPending ? 'Claiming…' : 'Claim'}
      </button>

      <output className={`crate-card__status crate-card__status--${status?.type ?? 'idle'}`} aria-live="polite">
        {status?.message ?? ''}
      </output>
    </article>
  );
});
