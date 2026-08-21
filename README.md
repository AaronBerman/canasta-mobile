# Canasta Table

*Classic rules. Your way.*

Classic partnership Canasta for iOS and Android — Quick Game, full matches vs AI, a 60-second intro plus 50-level campaign, customizable house rules, and unlockable cosmetics.

Built with **Expo (React Native)** and a shared **TypeScript rules engine** in `src/` so gameplay logic is testable and reusable for future multiplayer.

## Quick start

```bash
# Engine tests (repo root)
npm install
npm test

# Mobile app
cd mobile
npm install
npx expo start
```

Use **Expo SDK 54** with Expo Go, or run a dev build after native changes (`npx expo prebuild`).

## Features

- **Quick Game** — Relaxed rules, 3,500-point target (faster than Classic 5,000)
- **Full Match** — 4-player partnership Canasta using your Settings house rules
- **Campaign** — 60-second intro hand, then 50 tutorial and challenge levels
- **Settings** — AI difficulty, cosmetics, and house rules in one screen
- **House Rules** — presets (Classic, Relaxed, Speed) plus per-field overrides
- **Cosmetics** — card backs, fonts, and table skins unlocked through play
- **Multiplayer (beta)** — online room codes vs friends (+ AI fill); see [docs/MULTIPLAYER.md](docs/MULTIPLAYER.md) *(disabled in Play Store v1 — enable with `EXPO_PUBLIC_MULTIPLAYER_ENABLED`)*

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/MOBILE_APP.md](docs/MOBILE_APP.md) | Expo app structure, screens, builds |
| [docs/GAMEPLAY.md](docs/GAMEPLAY.md) | Turn flow, controls, progress |
| [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) | Rules reference and design goals |
| [docs/CUSTOM_RULES.md](docs/CUSTOM_RULES.md) | Presets and customizable fields |
| [docs/COSMETICS.md](docs/COSMETICS.md) | Unlock catalog and ads integration |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Engine, AI, and mobile layers |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md) | Bundle size and runtime optimizations |
| [docs/store/README.md](docs/store/README.md) | App Store, Play Store, and Steam listing prep |

## Project layout

```
canasta-mobile/
├── src/           # Shared game engine + AI (Vitest)
├── mobile/        # Expo React Native app
├── docs/          # Design, gameplay, and store docs
└── rules/         # Example custom rules JSON
```

A longer command reference is in [docs/usage.html](docs/usage.html).

## License

Private. All rights reserved. See [LICENSE](LICENSE). Changes: [CHANGELOG.md](CHANGELOG.md). How to report a problem: [SECURITY.md](SECURITY.md).

See store docs before public release.
