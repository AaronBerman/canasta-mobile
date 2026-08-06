# Custom House Rules

Canasta Mobile supports configurable rules without code changes.

1. **In-app** — **Settings → House Rules** (presets + overrides)
2. **JSON file** — `rules/custom.example.json` for developers/testers
3. **Code** — `buildCustomRules()` in the shared engine

---

## Presets

| ID | Name | Highlights |
|----|------|------------|
| `classic` | Classic American | 5,000 target, partner discard required, 1 canasta to go out |
| `relaxed` | Relaxed | 3,500 target, no partner discard rule, no one-card freeze |
| `speed` | Speed Canasta | 2,500 target, no canasta required, no frozen pile |

Select a preset in the app, then override individual fields if desired.

```typescript
import { RULE_PRESETS } from './src/core/game-rules';

const rules = RULE_PRESETS.relaxed;
```

---

## In-app customization

**Settings → House Rules** (`/settings?tab=rules`):

1. Pick a base preset
2. Override individual settings
3. Save — stored at `@canasta/game-rules` in AsyncStorage

Settings apply to the **next** Single Player match (not mid-hand).

### Customizable fields

| Field | Type | Description |
|-------|------|-------------|
| `targetScore` | number | Match-winning cumulative score |
| `cardsPerHand` | number | Cards dealt per player (7–15) |
| `requirePartnerTookDiscard` | boolean | Partner must have taken discard pile to go out |
| `canastasRequiredToGoOut` | number (0–4) | Canastas (7+ card melds) required to go out; **0 = none** |
| `allowTakeDiscardPile` | boolean | Allow taking the entire discard pile |
| `frozenPileEnabled` | boolean | Wild or red 3 in pile freezes it — need 2 naturals matching top to take |
| `blackThreeBlocksPile` | boolean | Black 3 on top blocks taking the pile |
| `oneCardFreezeRule` | boolean | Cannot discard a single card matching the pile top rank |
| `naturalCanastaBonus` | number | Bonus for all-natural canasta |
| `mixedCanastaBonus` | number | Bonus for mixed canasta |
| `goingOutBonus` | number | Bonus for going out |

Legacy boolean `requireCanastaToGoOut` migrates to `canastasRequiredToGoOut` (true → 1, false → 0) on load.

---

## Opening meld & discard pile (engine)

These behaviors are **not** toggles — they follow classic American Canasta and are enforced in `src/core/rules.ts`:

| Rule | Behavior |
|------|----------|
| Top card only | Only the **top** discard card may add points when checking if a take satisfies the opening meld |
| Frozen pile | If the pile is frozen, the top card **does not** count toward opening points; staged table melds must meet the threshold on their own |

See [GAMEPLAY.md](GAMEPLAY.md) for player-facing explanation.

---

## JSON rules file (developer)

Copy `rules/custom.example.json` and adjust values:

```typescript
import customRules from '../rules/custom.example.json';
import { validateRules } from './src/core/game-rules';

const errors = validateRules(customRules);
if (errors.length === 0) {
  createSinglePlayerMatch({ humanSeat: 0, aiDifficulties: ['easy','medium','hard'], rules: customRules });
}
```

The JSON schema matches `GameRules` in `src/core/game-rules.ts`.

---

## Building rules in code

```typescript
import { buildCustomRules } from './src/core/game-rules';

const myRules = buildCustomRules('classic', {
  name: 'Friday Night',
  targetScore: 3000,
  canastasRequiredToGoOut: 2,
  requirePartnerTookDiscard: false,
  goingOutBonus: 150,
});
```

Use `validateRules(myRules)` before starting a match.

---

## Initial meld thresholds

Override `initialMeldThresholds` for custom score brackets:

```typescript
initialMeldThresholds: [
  { upToScore: 999, minPoints: 40 },
  { upToScore: 2499, minPoints: 70 },
  { upToScore: Infinity, minPoints: 100 },
]
```

Default classic brackets: 50 / 90 / 120 by team score.

---

## How rules flow through the engine

```
GameRules
  ├── turn-manager.ts   (deal size, go-out checks, meld minimum)
  ├── rules.ts          (discard pile, openingPointsIfDiscardTaken, freeze)
  ├── game-status.ts    (requirement UI info)
  └── scoring.ts        (bonuses, red three values)
```

All rule-dependent functions accept an optional `rules` parameter defaulting to `CLASSIC_RULES`.

---

## Adding a new preset

1. Add a `GameRules` object in `src/core/game-rules.ts`
2. Register it in `RULE_PRESETS`
3. It appears in the House Rules preset list via `getPresetList()`
