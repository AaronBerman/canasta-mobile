# Single-Player Gameplay

## Overview

Single-player mode is **4-player partnership Canasta**: **you + AI partner** vs **two AI opponents**. The engine runs the full turn loop for all AI seats.

**Campaign mode** uses the same engine with scripted deals, per-level objectives, and no SP progress recording (cosmetic unlocks still apply on campaign completion where configured).

## Turn flow

Each turn has three phases:

| Phase | Human actions | AI behavior |
|-------|---------------|-------------|
| **Draw** | Draw stock, or take discard pile (if legal) | AI waits briefly (“thinking…”), then draws or takes |
| **Meld** | Select cards → Meld, or Skip | AI lays melds then skips |
| **Discard** | Select one card → Discard, or drag to discard zone | AI discards |

After discarding, play passes clockwise.

### Pre-draw melding (opening)

Before drawing, a team that has **not** yet completed their opening meld may lay staged melds from hand. Staged points count toward the opening threshold shown in the header. You must meet the threshold before finishing the turn (draw/skip path) or taking the discard pile.

## Discard pile & opening meld

When deciding if your team may **take the discard pile** before the first meld:

1. **Only the top card** can contribute opening points — cards buried in the pile never count.
2. If the pile is **frozen**, the top card does **not** count toward the opening threshold. Your **staged table melds alone** must meet the requirement. You still need two matching naturals in hand to take a frozen pile (when the top is not wild).
3. After taking the pile, you **must meld the top card** before skipping meld or discarding.

Engine helper: `openingPointsIfDiscardTaken()` in `src/core/rules.ts`.

## Controls

- **Tap a card** — select/deselect (multi-select for melds)
- **Tap a group tag** — select/deselect a meld group
- **Re-group** — auto-sort hand into sets
- **Drag a card** — reorder within hand; drag toward the discard pile to discard
- **Action bar** — context buttons per phase (draw, take pile, meld, skip, undo)

## AI seats & timing

Non-human seats use **Easy**, **Medium**, or **Hard** strategies (configurable in **Settings → AI Difficulty**).

Before each AI action, a **thinking delay** runs (roughly 1.4s / 2.0s / 2.6s base by difficulty, plus small random jitter). The header shows “*Player* is thinking…” during the wait.

## Scoring & match end

- Each hand scores melds, canasta bonuses, red threes, going-out bonus, minus cards left in hand
- Cumulative team scores carry across hands
- First team to reach **target score** (default 5,000) wins the match
- Hand results in single-player trigger **cosmetic progress** (wins and points milestones)

## Progress & unlocks

When a single-player hand ends, the app calls `recordSinglePlayerResult(won, points)`:

- **Wins** count toward win-based unlocks
- **Points scored** count toward milestone unlocks
- New unlocks appear in the hand-result modal

Campaign levels use separate completion storage (`campaign-storage.ts`).

## Settings

Open **Settings** from the home screen:

| Tab | Contents |
|-----|----------|
| AI Difficulty | Partner and opponent levels |
| Customize | Card backs, fonts, table skins |
| House Rules | Preset + overrides (applies to **next** SP match) |

Legacy routes `/customize` and `/rules` redirect here.

## Architecture

```
mobile/hooks/useSinglePlayerGame.ts   ← orchestrator
mobile/hooks/game/useGameMatch.ts     ← match + AI timer
mobile/hooks/game/usePlayerHand.ts    ← hand + meld selection
mobile/hooks/game/usePlayerActions.ts ← player actions
src/core/turn-manager.ts              ← authoritative turn logic
src/core/rules.ts                     ← pile take + opening points
src/ai/ai-executor.ts                 ← full AI turns
```

The mobile layer never implements rules directly — all actions go through `turn-manager` so multiplayer can share the same engine later.

## Starting a new game

Single-player loads **House Rules** from AsyncStorage (`@canasta/game-rules`). Change rules under **Settings → House Rules** before starting **Single Player**.

See [CUSTOM_RULES.md](CUSTOM_RULES.md) for all fields.
