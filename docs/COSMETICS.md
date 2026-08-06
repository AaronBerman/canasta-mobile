# Cosmetics & Unlock System

Players can customize three visual categories. Items are stored locally (AsyncStorage) and unlock through ads or single-player progress.

## Categories

| Category | What it changes |
|----------|-----------------|
| **Card Backs** | Face-down card appearance (pattern + colors) |
| **Font Styles** | Rank and suit typography on card faces |
| **Table Skins** | Felt gradient, rail color, table accent |

## Unlock Methods

| Method | How it works |
|--------|--------------|
| `default` | Owned from the start |
| `rewarded_ad` | Player watches a rewarded video (`ad-reward-service.ts`) |
| `single_player_win` | Unlocks after N cumulative single-player hand wins |
| `single_player_milestone` | Unlocks after N cumulative single-player points |

## Catalog

All items live in `constants/cosmetics/catalog.ts`. To add a new cosmetic:

1. Add an entry to the appropriate array (`CARD_BACKS`, `FONT_STYLES`, or `TABLE_SKINS`)
2. Set `unlock.method` and optional `threshold`
3. Define visual properties (`pattern`, `fontFamily`, `gradient`, etc.)

## Key Files

```
mobile/
├── constants/cosmetics/
│   ├── types.ts       # Type definitions
│   └── catalog.ts     # All unlockable items
├── services/
│   ├── cosmetics-storage.ts   # AsyncStorage + progress tracking
│   └── ad-reward-service.ts   # Rewarded ad stub (swap for AdMob)
└── stores/
    └── cosmetics-store.tsx    # React context for UI
```

## Recording Single-Player Progress

When a hand ends, call:

```typescript
import { recordSinglePlayerResult } from '../services/cosmetics-storage';

const { cosmetics, newlyUnlocked } = await recordSinglePlayerResult(won, pointsScored);
// Show toast for each id in newlyUnlocked
```

## Integrating Real Ads

Replace the stub in `ad-reward-service.ts` with `react-native-google-mobile-ads` or `expo-ads-admob`:

```typescript
// Resolve true only after onRewarded fires
const adCompleted = await showRewardedAd();
```

Set your ad unit id in `adServiceConfig.rewardedUnitId`.

## Persistence Keys

- `@canasta/cosmetics` — unlocked IDs + selected items
- `@canasta/progress` — single-player wins and points
- `@canasta/game-rules` — house rules (see [CUSTOM_RULES.md](../CUSTOM_RULES.md))
- `@canasta/ai-difficulty` — partner and opponent AI levels
- `@canasta/campaign` — campaign level completion and stars
