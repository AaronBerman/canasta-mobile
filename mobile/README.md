# Canasta Table — Expo App

*Classic rules. Your way.*

React Native (Expo) client for iOS and Android.

## Run

```bash
npm install
npx expo start
```

## Screens

| Route | Description |
|-------|-------------|
| `/` | Home — preview, stats, navigation |
| `/game` | Single-player table with live cosmetics |
| `/customize` | Browse/unlock/equip card backs, fonts, table skins |

## Customization

Players earn cosmetics by:

- **Watching rewarded ads** — Royal Gold card back, Playfair font, Midnight table, etc.
- **Single-player wins** — Diamond Weave back (5 wins), Ocean table (10 wins)
- **Single-player points milestones** — Oswald font (500 pts), Vintage table (1,000 pts)

Changes persist via AsyncStorage and preview live on the home and game screens.

## Shared Engine

Game logic imports from `../src/` through `engine/index.ts`. Metro is configured in `metro.config.js` to watch the monorepo root.

## Adding App Icons

Add PNGs to `assets/` and update `app.json`:

- `icon.png` (1024×1024)
- `splash-icon.png`
- `adaptive-icon.png` (Android)

See [../docs/COSMETICS.md](../docs/COSMETICS.md) for the full cosmetics documentation.
