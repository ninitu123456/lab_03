# KRAFTON x PUBG Vietnam Arena – Homework 3

## 1. Overview

A React 19 esports page for the PUBG Vietnam Series (PVS) Finals:
airdrop countdowns, optimistic ticket / G-Coin crate claims, a squad
leaderboard and a filterable kill feed.

> All squads, standings, prices and kill-feed entries are **sample data**
> for this lab. They are not official KRAFTON or PVS results.

## 2. Core Requirements

- `usePubgAirdropTimer(targetEpochMs, serverOffsetMs)`: zero-drift countdown,
  re-synced immediately on `visibilitychange`.
- Drop phases: `WARMUP` | `AIRDROP_LIVE` | `LOOTED_OUT` | `EXPIRED`.
- Optimistic claim: in-flight `claimId` lock, optimistic stock decrement,
  automatic rollback on HTTP `409 Conflict`.
- Prices formatted with `Intl.NumberFormat('vi-VN')` (VND ₫).
- Leaderboard of Vietnamese squads, filtered and sorted by WWCD,
  placement points and kill points (derived state).
- Kill feed filter with a virtualized list.
- WCAG 2.2 AA, no horizontal scroll at 375 px.

## 3. Project Structure

```text
KraftonPubgVnArena/
├── data/        Domain data and formatters
├── hooks/       Timer and optimistic claim hooks
├── api/         Mock claim server (409 Conflict)
├── components/  Crate cards, leaderboard, kill feed
└── README.md
```

## 4. Usage

| Area | How to use it |
|---|---|
| Airdrops | Press **Claim** on a live drop. Stock drops at once (optimistic) and is confirmed about 0.7 s later. |
| 409 demo | Press **Simulate rivals looting the VIP Pass**, then **Claim** the VIP Pass: the claim is rolled back. |
| Countdown | The G-Coin crate goes live 90 s after the page opens; the standard ticket after 15 min. |
| Leaderboard | Search a squad, sort by total / WWCD / placement / kill points, filter by minimum WWCD. |
| Kill feed | Filter by squad (as killer or victim), weapon, or headshots only. Only the visible rows are rendered. |

## 5. Verification

```bash
npm run test -- --run
npm run lint
npm run build
```

- Evidence screenshots: `evidence/hw3-pubg-arena/` (zero-drift freeze test, optimistic claim, 409 rollback, virtualized feed, 375 px, Lighthouse 100).
- AI issues found during development: `AI_FAILURE_AUDIT.md`, Issues 11–13.
