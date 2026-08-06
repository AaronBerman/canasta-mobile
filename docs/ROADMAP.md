# Canasta Table — Product Roadmap

This document tracks shipped improvements, in-progress growth work, and planned milestones for **Canasta Table** (*Classic rules. Your way.*).

Last updated: August 2026

---

## Vision

Make classic American partnership Canasta approachable for new players while respecting how experienced groups play — fast entry, clear tutorials, tunable house rules, and a polished table experience on phone and tablet.

---

## Phase 0 — Foundation (Shipped)

Core mobile port and stability work completed before the rebrand.

| Milestone | Status | Notes |
|-----------|--------|-------|
| Shared game engine (`src/`) + React Native shell | ✅ | Expo SDK 54, 4-player partnership Canasta |
| Single-player vs AI | ✅ | Partner + two opponents, difficulty settings |
| Campaign mode (50 levels) | ✅ | 15 tutorial + 35 challenge scenarios |
| House rules & presets | ✅ | Classic, Relaxed, Speed, Tutorial + custom overrides |
| Cosmetics (card backs, felts, fonts) | ✅ | Unlock via wins, campaign milestones |
| Portrait & landscape | ✅ | `orientation: default`, adaptive `GameScreenLayout` |
| Unified game header | ✅ | Score, objectives, phases in `GameHeaderPanel` |
| AI thinking delay | ✅ | Difficulty-scaled pause so turns feel deliberate |
| Opening meld + discard rules | ✅ | Top discard counts toward opening points; frozen pile exception |
| Runtime stability | ✅ | Memo import fix, discard-zone flicker loop, max update depth |
| Documentation | ✅ | `docs/` gameplay, architecture, performance, store drafts |

---

## Phase 1 — Brand & First Impression (In progress)

| Milestone | Status | Notes |
|-----------|--------|-------|
| Rebrand to **Canasta Table** | ✅ | App name, home title, tagline |
| Tagline: *Classic rules. Your way.* | ✅ | Home screen + store copy source |
| App icon (green felt + card / “C”) | 🟡 | Spec in `mobile/assets/ICON.md`; replace PNGs before store submit |
| Store listing copy refresh | 🟡 | Update `docs/store/*` with new name before submission |
| Splash / adaptive icon alignment | 🟡 | `#1a472a` felt green already in `app.json` |

### Icon guidelines

- **Readable at 29×29** — one focal element (bold **C** or single card)
- **Green felt base** — `#1a472a` (matches splash)
- **Avoid** busy spreads, tiny rank/suit detail, gradients that muddy at small size
- **Deliverables:** `icon.png`, `adaptive-icon.png`, `splash-icon.png` (see `assets-checklist.md`)

---

## Phase 2 — Onboarding (Shipped)

| Milestone | Status | Notes |
|-----------|--------|-------|
| 60-second intro before campaign map | ✅ | `/campaign/intro` — one guided hand |
| Objective: draw → meld → discard | ✅ | `intro_first_hand` objective + scripted deal |
| Skip for returning players | ✅ | `introTutorialCompleted` flag; auto-skip if campaign progress exists |
| Full tutorial path (levels 1–15) | ✅ | Unchanged — follows intro on campaign map |

**Flow:** Home → Campaign → (first visit) Quick Start intro → Level map → Level 1…

---

## Phase 3 — Instant Play (Shipped)

| Milestone | Status | Notes |
|-----------|--------|-------|
| **Quick Game** on home | ✅ | Primary CTA — Relaxed rules, 3,500 target |
| Full Match | ✅ | Uses house rules from Settings |
| Mode label in header | ✅ | `Quick Game` vs `Full Match` |

**Why Relaxed for Quick Game:** Lower opening meld (50 pts), no partner-discard requirement, 3,500 target vs Classic 5,000 — shorter sessions for “play now” intent.

---

## Phase 4 — Pre-Launch Polish (Next)

| Milestone | Priority | Notes |
|-----------|----------|-------|
| Final icon & screenshot pass | High | Physical device captures, landscape + portrait |
| Privacy policy hosted | High | Draft in `docs/store/privacy-policy-draft.md` |
| EAS production builds | High | iOS + Android |
| App Store / Play metadata | Medium | Trim shared copy to char limits |
| Steam page (optional) | Low | Draft in `docs/store/steam.md` |
| Tutorial skip / replay from Settings | Low | Let users reset intro from campaign reset |

---

## Phase 5 — Growth (Planned)

| Milestone | Priority | Notes |
|-----------|----------|-------|
| ASO keyword pass | Medium | “Canasta”, “card game”, “offline”, “partnership” |
| Share hand result / invite | Medium | Deep link to Quick Game |
| Rewarded ads for cosmetics | Medium | Stub exists — declare in stores when live |
| Online multiplayer | Disabled in v1.0 Play Store build | Hidden via `EXPO_PUBLIC_MULTIPLAYER_ENABLED`; enable in v1.1+ after server deploy |
| Daily challenge / streak | Later | Retention hook |
| iPad-optimized layout | Later | Wider meld panel, larger hand fan |

---

## Phase 6 — Live Ops (Future)

| Milestone | Notes |
|-----------|-------|
| Seasonal table felts | Limited-time cosmetics |
| New campaign chapter | Levels 51+ |
| Rule preset packs | Regional / family variants |
| Localization | ES, PT-BR priority for card-game markets |

---

## Engineering backlog (non-roadmap)

Items that improve quality but are invisible to store listings:

- [ ] Unit test coverage for intro objective + quick-game rules wiring
- [ ] E2E smoke: home → quick game → one hand
- [ ] Campaign intro analytics event (when analytics added)
- [ ] Bundle size audit before 1.0

---

## How to update this doc

1. Move rows from **Next** → **Shipped** when merged.
2. Add new rows under the appropriate phase with status emoji: ✅ 🟡 ⬜.
3. Link to PRs or doc paths in **Notes** when helpful.
4. Bump **Last updated** at the top.

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [README.md](../README.md) | Project overview |
| [MOBILE_APP.md](MOBILE_APP.md) | Build & run |
| [GAMEPLAY.md](GAMEPLAY.md) | Rules reference |
| [docs/store/README.md](store/README.md) | Store submission checklist |
| [mobile/assets/ICON.md](../mobile/assets/ICON.md) | Icon art brief |
