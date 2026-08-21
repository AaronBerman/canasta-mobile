# Mobile App Guide

Expo React Native client for **iOS** and **Android** (Expo SDK 54).

## Quick start

```bash
cd mobile
npm install
npx expo start
```

- Press **i** for iOS simulator, **a** for Android emulator, or scan the QR code with **Expo Go**
- After changing `app.json` (orientation, icons, bundle ID), run a **native rebuild**:

```bash
npx expo prebuild --clean
npx expo run:android   # or run:ios
```

### Clean reinstall (after SDK change)

```powershell
cd mobile
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npx expo start -c
```

## Screens & routes

| Route | Purpose |
|-------|---------|
| `/` | Home — stats, cosmetic preview, navigation |
| `/game` | Single-player match (full turn loop) |
| `/campaign` | Campaign map (50 levels) |
| `/campaign/[levelId]` | Play a campaign level |
| `/settings` | Unified settings (tabs below) |
| `/settings?tab=ai` | AI difficulty (partner + opponents) |
| `/settings?tab=customize` | Card backs, fonts, table skins |
| `/settings?tab=rules` | House rules presets and overrides |
| `/multiplayer` | Online room codes (**dev only** — hidden when `EXPO_PUBLIC_MULTIPLAYER_ENABLED` is not `true`) |
| `/customize`, `/rules` | Redirect to `/settings` with the matching tab |

## Orientation

`app.json` sets `"orientation": "default"` so the app auto-rotates.

- **Portrait** — table above, hand dock below
- **Landscape** — table left, hand + action bar right (~340px dock)

Layout adapts via `useLayoutOrientation()` and `GameScreenLayout`.

## Project layout

```
mobile/
├── app/                         # Expo Router screens
├── components/
│   ├── cards/                   # PlayingCard, CardBackView, DiscardPileView
│   ├── cosmetics/               # Preview and customize UI
│   ├── game/                    # Board, hand, header, action bar, modals
│   ├── settings/                # Settings tab panels
│   └── table/                   # GameTable (skins)
├── constants/campaign/          # Levels, deals, objectives
├── constants/cosmetics/         # Unlock catalog
├── engine/                      # Metro bridge into ../src/
├── hooks/
│   ├── useSinglePlayerGame.ts   # Orchestrator
│   ├── game/
│   │   ├── useGameMatch.ts      # Match lifecycle, AI timer
│   │   ├── usePlayerHand.ts     # Hand groups, selection, meld planning
│   │   └── usePlayerActions.ts  # Draw, meld, discard, undo
│   ├── useCampaignGame.ts
│   ├── useLayoutOrientation.ts
│   └── useDiscardZone.ts
├── services/                    # AsyncStorage, rules, campaign, ads stub
└── stores/                      # Cosmetics React context
```

## Game UI

### Header panel (`GameHeaderPanel`)

Single combined banner at the top of the table:

1. **Score & turn** — team scores, target, opponent hand counts, active player / “thinking…”
2. **Campaign objective** (campaign levels only)
3. **Requirements** — opening meld progress, canastas, go-out blockers
4. **Turn phases** — draw → meld → discard step indicator (your turn)

### Game hook

`useSinglePlayerGame()` coordinates:

- Match state from `createSinglePlayerMatch()`
- Human actions (draw, meld, discard, undo)
- AI turn loop with **difficulty-scaled thinking delay** (~1.4–3.0s before each AI action)
- Hand-end progress for cosmetic unlocks
- Next hand / new match

See [GAMEPLAY.md](GAMEPLAY.md) for turn flow details.

## Gestures

Cards use `react-native-gesture-handler` + Reanimated:

- **Tap** — toggle selection
- **Pan** — reorder within hand; drag toward discard zone to discard

`GestureHandlerRootView` wraps the app in `app/_layout.tsx`.

## App icons & splash

Assets in `mobile/assets/`:

| File | Use |
|------|-----|
| `icon.png` | 1024×1024 app icon |
| `splash-icon.png` | Splash screen |
| `adaptive-icon.png` | Android adaptive foreground |

Referenced in `app.json`.

## Shared engine

Game logic is **not** duplicated in mobile. Import via `engine/index.ts`:

```typescript
import { createSinglePlayerMatch, drawStock, layMeld } from '../engine/index';
```

Metro watches the monorepo root (`metro.config.js`).

## Store builds

### Before EAS build — fix expo doctor

From `mobile/`:

```powershell
npm install
npx expo-doctor
```

If `android/` was ever committed to git, untrack it so EAS runs Prebuild (required for `app.json` icon/orientation to apply):

```powershell
git rm -r --cached mobile/android
git commit -m "Stop tracking generated android folder for CNG"
```

Local `mobile/android/` can stay on disk for `expo run:android`; it must not be in git or EAS uploads.

`.easignore` at the repo root excludes `mobile/android/`, `mobile/ios/`, and `mobile/.expo/` from cloud uploads.

### Google Play (v1 — offline, no multiplayer)

From **`mobile/`** (where `eas.json` lives):

```powershell
cd mobile
npm run eas:android
```

This syncs `../src` → `mobile/shared-src/` then runs EAS. Install [Git for Windows](https://git-scm.com/download/win) if EAS warns about missing version control.

See **[store/PLAY_STORE_V1.md](../docs/store/PLAY_STORE_V1.md)** for the full Play Console checklist.

Production builds set `EXPO_PUBLIC_MULTIPLAYER_ENABLED=false` in `eas.json`. To test multiplayer locally:

```bash
# mobile/.env (not committed) or shell
set EXPO_PUBLIC_MULTIPLAYER_ENABLED=true
npx expo start
```

### TestFlight / iOS (when ready)

```bash
eas build --platform ios --profile production
```

See [store/README.md](store/README.md) for listing copy, privacy policy, and asset requirements.

Requires Apple Developer and Google Play Console accounts.

## Related docs

- [GAMEPLAY.md](GAMEPLAY.md) — controls and campaign
- [CUSTOM_RULES.md](CUSTOM_RULES.md) — presets and JSON
- [COSMETICS.md](COSMETICS.md) — unlock system
- [PERFORMANCE.md](PERFORMANCE.md) — bundle and runtime notes
