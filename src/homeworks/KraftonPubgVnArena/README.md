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
