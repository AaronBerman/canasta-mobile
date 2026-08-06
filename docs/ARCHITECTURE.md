# Architecture

## Layers

```
┌─────────────────────────────────────────┐
│  Mobile UI — Expo / React Native        │  mobile/
├─────────────────────────────────────────┤
│  Hooks & services                     │  match, hand, rules storage
├─────────────────────────────────────────┤
│  src/core/  — Rules Engine (TypeScript) │  authoritative logic, Vitest
├─────────────────────────────────────────┤
│  src/ai/    — AI Decision Layer         │  local-only (single player)
├─────────────────────────────────────────┤
│  src/multiplayer/ — Session Models      │  future online play (not in app bundle)
└─────────────────────────────────────────┘
         │                    │
         ▼                    ▼
   Local state          Game Server (future)
```

## Core engine (`src/core/`)

Pure functions and immutable state transitions. No I/O. The same module runs:

- On-device for **single-player** and **campaign**
- On a **server** for future multiplayer (authoritative validation)
- On a **client** for optimistic UI preview (reconciled with server)

| Module | Responsibility |
|--------|----------------|
| `cards.ts` | Card types, rank values, wild detection |
| `deck.ts` | Shuffling, dealing |
| `melds.ts` | Meld validation, canasta detection, point values |
| `rules.ts` | Pile take, freeze, `openingPointsIfDiscardTaken`, go-out checks |
| `meld-selection.ts` | Meld planning, discard-top meld value |
| `turn-manager.ts` | Turn phases, actions, match lifecycle |
| `game-status.ts` | Opening requirements, go-out blockers |
| `scoring.ts` | Hand and cumulative scoring |
| `game-rules.ts` | Presets and `GameRules` schema |
| `game-state.ts` | Players, teams, match state |

Tests: `src/core/game.test.ts` (run `npm test` from repo root).

## AI layer (`src/ai/`)

Strategy pattern with shared `CardCounter` (Hard / Medium).

```
createAIStrategy(difficulty)
 ├── EasyStrategy    — greedy meld + go out
 ├── MediumStrategy  — canasta balance + basic defense
 └── HardStrategy    — card counting + inference + blocking
```

`ai-executor.ts` runs a full AI turn (draw → meld → discard). Mobile schedules turns via `useGameMatch` with difficulty-scaled delay (`mobile/utils/ai-timing.ts`).

Opening discard evaluation uses `openingPointsIfDiscardTaken()` — not whole-pile meld sums.

## Mobile app (`mobile/`)

| Area | Notes |
|------|--------|
| `engine/` | Metro alias into `src/`; `match.ts` avoids multiplayer imports |
| `hooks/game/` | Split match / hand / actions from monolithic hook |
| `components/game/GameScreenLayout.tsx` | Shared SP + campaign layout, landscape support |
| `components/game/GameHeaderPanel.tsx` | Combined score / requirements / phase header |
| Services | AsyncStorage for rules, cosmetics, campaign progress |

Orientation: `useWindowDimensions()` + conditional layout; native `"orientation": "default"` in `app.json`.

## Multiplayer (`src/multiplayer/`)

Planned — not shipped in v0.1.

- Friends list, lobby, seat map
- WebSocket sync with server validating via `src/core/`

Recommended stack when ready: JWT auth, Node + Socket.io or Supabase Realtime, PostgreSQL for users and match history.

## CI/CD

`.gitlab-ci.yml` runs typecheck and engine tests on push. Add EAS Build stages when publishing to stores.

## Related docs

- [MOBILE_APP.md](MOBILE_APP.md) — routes and native builds
- [PERFORMANCE.md](PERFORMANCE.md) — bundle splitting
- [store/README.md](store/README.md) — release checklist
