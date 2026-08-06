# Canasta Mobile — Game Design

## Overview

American Canasta played on mobile with partnership teams. The core engine lives in `src/core/` and is UI-agnostic so any mobile framework can consume it.

## Player Counts

| Players | Format |
|---------|--------|
| **4 (default SP)** | 2 teams of 2 — partners sit across the table |
| **2 (MP)** | Head-to-head; each player plays both hands of a partnership or solo variant (configurable) |
| **6 / 8 (MP)** | Two tables running in parallel, or custom house rules (documented in lobby) |

Single-player mode is fixed at **4 players** (you + partner + 2 AI opponents).

## Deck

- 2 standard 52-card decks + **4 jokers** = **108 cards**
- Ranks: A, 2–10, J, Q, K (each appears twice per suit except jokers)
- **Wild cards**: Jokers and twos
- **Natural cards**: everything else
- **Red threes**: auto-meld to side pile; replacement card drawn

## Deal

- 4 players: **11 cards** each; remainder is stock; top card starts discard (if wild, next card is turned until natural, then pile is **frozen**)

## Turn Sequence

1. **Draw** — one card from stock, OR take the entire discard pile (if allowed)
2. **Meld** (optional) — lay valid melds on the table
3. **Discard** — exactly one card to end the turn

## Melds

- Minimum **3 cards** of the same rank
- Wild cards in a meld: **cannot exceed natural cards** (e.g. max 1 wild in a 3-card meld)
- **Canasta** — meld of **7+** cards of the same rank (natural or mixed)
- **Initial meld requirement** (team score):

| Team Score | Minimum Initial Meld |
|------------|---------------------|
| 0 – 1,495 | 50 |
| 1,500 – 2,995 | 90 |
| 3,000+ | 120 |

## Discard Pile

- **Frozen** when the pile contains a wild or a red 3 (classic rules)
- **Wild or red 3 on top** — pile cannot be taken
- **Natural on top, frozen below** — take requires **two naturals** of the top rank in hand
- **Black 3 on top** — pile permanently blocked (when rule enabled)
- **One-card freeze** (optional) — cannot discard a single card matching the current top rank

### Opening meld when taking the discard

Before a team’s first meld, taking the discard pile is allowed only if opening requirements are met:

| Condition | Rule |
|-----------|------|
| Which discard cards count | **Top card only** — buried cards never add opening points |
| Frozen pile | Top card **does not** count toward opening points; staged table melds must reach the threshold alone |
| After take | Player must meld the top card before skip/discard |

Implemented in `openingPointsIfDiscardTaken()` and `canTakeDiscardPile()` (`src/core/rules.ts`).

## Going Out

Requirements (configurable via house rules):

1. Team has **required canastas** (`canastasRequiredToGoOut`, default 1; 0 = none in Speed preset)
2. Player melds or discards their last card
3. Optionally: partner must have **taken the discard pile** at least once (`requirePartnerTookDiscard`, classic default)

## Scoring (per hand)

| Item | Points |
|------|--------|
| Red three (each) | +100 (+200 if all four held) |
| Black three in meld | 5 each |
| 4–7 card meld (per card) | rank value |
| Canasta (natural) | 500 bonus |
| Canasta (mixed) | 300 bonus |
| Going out | 100 bonus |
| Cards left in hand | subtract rank values |
| Red threes left in hand | −500 each |

Rank values: Joker 50, A/2 20, K–8 face value, 4–7 pip value, black 3 = 5.

## AI Difficulty

### Easy

- Always meld when legal
- Take discard pile whenever allowed and it enables a meld
- Go out at first opportunity
- Discard highest deadwood card with no blocking logic

### Medium

- Meld when it improves team position but may hold cards for a canasta
- Considers initial meld threshold
- Avoids discarding cards opponents likely want (basic rank frequency)
- Sometimes freezes pile intentionally with a wild discard

### Hard

- **Card counting** — tracks every seen card (discards, melds, red threes)
- **Inference** — estimates opponent ranks from pick-up patterns and meld history
- **Blocking** — discards safe cards; freezes pile when opponents need the top rank
- **Team optimization** — delays going out to build natural canastas; feeds partner via controlled discards
- **Defensive** — avoids helping opponents complete canastas

## Multiplayer — Friends & Lobby

1. User maintains a **friends list** (invite by username / link)
2. Host creates a lobby, selects **2–8 seats**, assigns teams
3. Friends receive push notification / in-app invite
4. Game state syncs via authoritative server (see Architecture doc)
5. Reconnection and turn timers supported

## Milestones

- [x] Core rules engine & types
- [x] AI strategies (easy / medium / hard)
- [x] Engine unit tests (Vitest)
- [x] Expo mobile UI — single player, campaign, settings, cosmetics
- [x] Landscape + portrait layouts
- [ ] Rewarded ads (production AdMob)
- [ ] Friends & auth backend
- [ ] Real-time multiplayer server
- [ ] App store / Play Store release
- [ ] Steam (optional desktop port)
