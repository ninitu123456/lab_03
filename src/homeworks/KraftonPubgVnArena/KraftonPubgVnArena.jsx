import { useState } from 'react';

import { createMockClaimServer } from './api/mockClaimServer';
import { CrateCard } from './components/CrateCard';
import { KillFeed } from './components/KillFeed';
import { SquadLeaderboard } from './components/SquadLeaderboard';
import { SQUAD_STANDINGS, createCrateDrops } from './data/arenaData';
import { createKillFeed } from './data/killFeed';
import { useOptimisticClaim } from './hooks/useOptimisticClaim';

import './KraftonPubgVnArena.css';

// Local clock is treated as server time in this demo (no skew).
const SERVER_OFFSET_MS = 0;
const DEMO_DROP_ID = 'vip-pass';

function createArena() {
  const drops = createCrateDrops(Date.now());

  return {
    drops,
    server: createMockClaimServer({ drops, latencyMs: 700 }),
    killFeed: createKillFeed(500),
  };
}

function KraftonPubgVnArena() {
  // Created once per mount: server state survives re-renders.
  const [arena] = useState(createArena);
  const [demoMessage, setDemoMessage] = useState('');

  const { drops, pendingDropIds, statusByDrop, claim } = useOptimisticClaim(
    arena.drops,
    arena.server.claimDrop,
  );

  const simulateRivals = () => {
    arena.server.simulateRivalClaims(DEMO_DROP_ID, Number.MAX_SAFE_INTEGER);
    setDemoMessage(
      'Rival players looted every VIP Pass on the server. Your screen still shows stock, so your next claim will be rejected with 409 and rolled back.',
    );
  };

  return (
    <main className="pubg-arena">
      <header className="pubg-arena__header">
        <p className="pubg-arena__eyebrow">HOMEWORK 3 · PVS FINALS</p>
        <h1>PUBG Vietnam Airdrop Arena</h1>
        <p className="pubg-arena__subtitle">
          Claim Grand Finals tickets and G-Coin crates, follow the squads and the kill feed.
        </p>
        <p className="pubg-arena__disclaimer">
          Fan-made lab project. Squads, standings, prices and kills are sample data.
        </p>
      </header>

      <section className="pubg-arena__panel" aria-labelledby="arena-drops-heading">
        <h2 id="arena-drops-heading">Airdrops</h2>

        <ul className="pubg-arena__drops">
          {drops.map((drop) => (
            <li key={drop.id}>
              <CrateCard
                drop={drop}
                isPending={pendingDropIds.has(drop.id)}
                status={statusByDrop[drop.id]}
                serverOffsetMs={SERVER_OFFSET_MS}
                onClaim={claim}
              />
            </li>
          ))}
        </ul>

        <div className="pubg-arena__demo">
          <h3>Demo: reproduce a 409 Conflict</h3>
          <button type="button" className="pubg-arena__demo-button" onClick={simulateRivals}>
            Simulate rivals looting the VIP Pass
          </button>
          <output aria-live="polite">{demoMessage}</output>
        </div>
      </section>

      <section className="pubg-arena__panel" aria-labelledby="arena-leaderboard-heading">
        <h2 id="arena-leaderboard-heading">Squad leaderboard</h2>
        <SquadLeaderboard standings={SQUAD_STANDINGS} />
      </section>

      <section className="pubg-arena__panel" aria-labelledby="arena-feed-heading">
        <h2 id="arena-feed-heading">Kill feed</h2>
        <KillFeed entries={arena.killFeed} squads={SQUAD_STANDINGS} />
      </section>
    </main>
  );
}

export default KraftonPubgVnArena;
