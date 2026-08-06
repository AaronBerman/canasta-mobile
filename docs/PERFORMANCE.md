# Performance & bundle size

This project is structured for a small mobile bundle, fast cold start, and room to grow without rewrites.

## Architecture

```
src/                    Pure TypeScript game engine (shared, testable)
  match-factory.ts      Match bootstrap — no multiplayer imports
  core/                 Rules, turns, scoring
  ai/                   Strategies + executor
  multiplayer/          Future online play (not bundled in mobile)

mobile/
  engine/               Metro bridge into src/ (no .js extension issues)
    match.ts            Imports match-factory only — skips lobby/friends
  constants/campaign/
    levels-data.ts      Level metadata (map screen)
    levels.ts           Full levels + deal builders (play screen)
    deals.ts            Scripted deals (loaded only when playing)
```

## What we optimize

### Bundle size
- **Mobile match entry** (`mobile/engine/match.ts`) imports `src/match-factory.ts` instead of `src/index.ts`, so unused multiplayer modules are not pulled into the app bundle.
- **Campaign map** uses `level-index.ts` → `levels-data.ts` and never imports `deals.ts`.
- **Removed unused deps**: `expo-file-system`, `semver`, direct `@react-native/virtualized-lists` (already provided by React Native).

### Startup speed
- **Deferred fonts**: Home screen uses system font by default. Cosmetic fonts load via `useCosmeticFonts()` only on game, campaign, and customize screens.
- **Metro `inlineRequires`**: Enabled in `metro.config.js` so modules load on first use, not all at launch.
- **No splash font gate**: Root layout hides splash immediately instead of blocking on font downloads.

### Runtime
- **`React.memo`** on `GameBoard`, `PlayerHand`, `PlayingCard`, `DraggableCard` — fewer table re-renders
- **`GameScreenLayout`** — shared SP/campaign shell; memoized `otherPlayers` and stable discard callbacks
- **`useDiscardZone`** — discard Y stored in a ref to avoid layout measure loops
- **Campaign `FlatList` tuning**: `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, `removeClippedSubviews`
- **AI thinking delay** — state updates batched per AI turn, not per card animation

## Adding features without bloat

| Feature | Where to add | Avoid |
|--------|--------------|--------|
| New rule / turn logic | `src/core/` | Duplicating logic in mobile |
| New campaign level | `levels-data.ts` + deal in `deals.ts` | Importing `deals` from map UI |
| New screen | `mobile/app/` (expo-router) | Importing full engine barrel if only types needed |
| Multiplayer | `src/multiplayer/` + new mobile service | Importing lobby from `mobile/engine/index.ts` |
| Heavy UI (ads, analytics) | Lazy `import()` inside the screen that needs it | Top-level imports in `_layout.tsx` |

## Production builds

Run a production bundle analyze when changing dependencies:

```bash
cd mobile
npx expo export --platform android
```

For release APK/IPA, use EAS Build with `expo-optimization` defaults. Font packages only ship the three weights referenced in `useCosmeticFonts.ts`.

## Tests

Engine tests live in `src/core/game.test.ts` and run from the repo root:

```bash
npm test
```

Keep hot paths (turn manager, meld selection) covered there — mobile UI stays thin.
