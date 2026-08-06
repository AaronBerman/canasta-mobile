# Store release checklist

Draft materials for **Apple App Store**, **Google Play**, and **Steam** (future). Replace `[PLACEHOLDERS]` before submission.

**App name:** Canasta Table  
**Subtitle:** Classic rules. Your way.
**Bundle ID (iOS):** `com.canasta.mobile`  
**Package (Android):** `com.canasta.mobile`  
**Version:** 1.0.0 (Play Store v1 — offline, multiplayer disabled)  
**Category:** Games → Card / Board  
**Content rating (expected):** Everyone / PEGI 3 / ESRB Everyone — no violence, no user-generated content, no chat in v0.1  

---

## Before you submit (all platforms)

- [ ] Final app icon 1024×1024 (no transparency for Apple)
- [ ] Privacy policy URL hosted publicly ([privacy-policy-draft.md](privacy-policy-draft.md))
- [ ] Support email or support URL
- [ ] Age rating questionnaire completed
- [ ] Test on physical iOS + Android devices (portrait + landscape)
- [ ] Production build via EAS (`eas build --platform android --profile production`)
- [ ] Multiplayer disabled — `EXPO_PUBLIC_MULTIPLAYER_ENABLED=false` (default in `eas.json`)
- [ ] No debug logging or test ad units in release build
- [ ] Review [assets-checklist.md](assets-checklist.md) for screenshots and video

---

## Platform guides

| Platform | Doc |
|----------|-----|
| **Google Play v1 launch** | **[PLAY_STORE_V1.md](PLAY_STORE_V1.md)** — offline build, step-by-step |
| Apple App Store | [apple-app-store.md](apple-app-store.md) |
| Google Play | [google-play.md](google-play.md) |
| Steam | [steam.md](steam.md) |

---

## Shared listing copy

Use these as the source of truth; trim per platform character limits.

### Short description (≈80 chars)

> Partnership Canasta vs AI. Quick Game, 50-level campaign, and your house rules.

### Full description

**Canasta Table** — *Classic rules. Your way.* — brings American partnership Canasta to your phone and tablet. Jump into a **Quick Game** (Relaxed rules, 3,500 pts), play a full match with your **house rules**, or learn in a **60-second intro** and **50-level campaign**.

**Features**

- **Quick Game** — instant Relaxed-rules match (3,500 target, faster than Classic 5,000)  
- **Full Match** — 4-player partnership Canasta with smart AI; uses your Settings rules  
- **Campaign** — 60-second intro, then 50 tutorial and challenge levels  
- **House Rules** — Classic, Relaxed, and Speed presets; customize target score, canastas to go out, frozen pile, and more  
- **AI Difficulty** — set partner and opponent skill separately  
- **Cosmetics** — unlock card backs, fonts, and table felts through play  
- **Portrait & Landscape** — rotate freely; layout adapts automatically  
- **Offline play** — no account required for single-player and campaign  

**Coming later**

- Online multiplayer with friends  
- Optional rewarded ads for cosmetic unlocks  

Canasta is a trademark associated with classic card-game rules; this app is an independent implementation for entertainment.

### Keywords / tags (comma-separated)

Canasta, card game, rummy, partnership, offline, single player, AI, campaign, classic, board game, tablet

### Promotional text (Apple — 170 chars max, updatable without review)

> New: 50-level Campaign mode! Customize house rules, AI difficulty, and table cosmetics. Play in portrait or landscape.

---

## Legal & support placeholders

| Field | Placeholder |
|-------|-------------|
| Developer / seller name | `[Your Developer Name LLC]` |
| Support email | `support@[yourdomain].com` |
| Marketing URL | `https://[yourdomain].com/canasta` |
| Privacy policy URL | `https://[yourdomain].com/canasta/privacy` |
| Copyright | `© 2026 [Your Developer Name]` |

---

## Monetization (v0.1 plan)

Document accurately in store forms:

| Item | v0.1 status |
|------|-------------|
| Price | Free |
| In-app purchases | None (cosmetics via gameplay / future ads) |
| Ads | Stub only — declare **No ads** until AdMob is live |
| Subscription | None |
| Account required | No |

Update store listings when ads or IAP ship.

---

## Export compliance (US)

Canasta Mobile uses standard HTTPS for any future online features only. For v0.1 offline builds:

- **Uses encryption?** Typically **Yes** (OS-provided HTTPS stack in Expo/React Native)
- **Exempt?** Often qualifies for ERN exemption as mass-market app — confirm with Apple export questions at submission

---

## Related engineering docs

- [MOBILE_APP.md](../MOBILE_APP.md) — EAS build commands  
- [PRIVACY_POLICY draft](privacy-policy-draft.md)  
- [Assets checklist](assets-checklist.md)
