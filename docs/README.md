# Documentation index

## Product & gameplay

- **[MULTIPLAYER.md](MULTIPLAYER.md)** — Online room codes (beta), server setup
- **[ROADMAP.md](ROADMAP.md)** — Shipped milestones, brand, onboarding, and launch plan
- **[GAME_DESIGN.md](GAME_DESIGN.md)** — Rules, scoring, AI behavior, roadmap
- **[GAMEPLAY.md](GAMEPLAY.md)** — Single-player and campaign UX, controls, turn flow
- **[CUSTOM_RULES.md](CUSTOM_RULES.md)** — House rule presets and overrides
- **[COSMETICS.md](COSMETICS.md)** — Unlock system and ad integration

## Engineering

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Engine, AI, mobile app, future multiplayer
- **[MOBILE_APP.md](MOBILE_APP.md)** — Expo setup, routes, hooks, native builds
- **[PERFORMANCE.md](PERFORMANCE.md)** — Bundle size, memoization, deferred loading
- **[GITLAB_SETUP.md](GITLAB_SETUP.md)** — CI and repository setup

## Store release (draft)

- **[store/README.md](store/README.md)** — Master checklist and shared copy
- **[store/PLAY_STORE_V1.md](store/PLAY_STORE_V1.md)** — Google Play v1 launch (offline, multiplayer off)
- **[store/apple-app-store.md](store/apple-app-store.md)** — App Store Connect fields
- **[store/google-play.md](store/google-play.md)** — Play Console fields
- **[store/steam.md](store/steam.md)** — Steamworks listing (future desktop port)
- **[store/privacy-policy-draft.md](store/privacy-policy-draft.md)** — Privacy policy template
- **[store/assets-checklist.md](store/assets-checklist.md)** — Icons, screenshots, trailers

## Recent rule clarifications (engine)

Documented in **GAME_DESIGN.md** and **GAMEPLAY.md**:

- **Opening meld + discard** — When evaluating whether a team may take the discard pile before their first meld, only the **top discard card** may contribute points (buried pile cards never count).
- **Frozen pile** — If the discard pile is frozen, the top card does **not** count toward the opening meld threshold. Staged table melds alone must meet the requirement; you still need a legal natural pair in hand to take a frozen pile when allowed.

Implementation: `openingPointsIfDiscardTaken()` in `src/core/rules.ts`.
