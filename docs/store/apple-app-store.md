# Apple App Store listing

App Store Connect checklist for **Canasta Mobile**. Copy fields from [README.md](README.md) shared section unless noted.

---

## App information

| Field | Value |
|-------|--------|
| Name | Canasta Table |
| Subtitle | Classic rules. Your way. |
| Subtitle (30 chars) | Classic partnership Canasta |
| Primary category | Games |
| Secondary category | Card (or Board) |
| Content rights | Does not contain third-party content requiring documentation |
| Age rating | Complete questionnaire — expect **4+** / low maturity |

---

## Version information (per release)

| Field | Draft |
|-------|--------|
| Version | 0.1.0 |
| Copyright | © 2026 [Your Developer Name] |
| What's New | Initial release: Single Player, 50-level Campaign, house rules, cosmetics, landscape support. |

### Description (4000 char max)

Use **Full description** from [README.md](README.md).

### Promotional text (170 chars)

> New: 50-level Campaign! Customize house rules, AI difficulty, and table looks. Play Canasta offline in portrait or landscape.

### Keywords (100 chars, comma-separated, no spaces after commas)

```
canasta,card,partnership,rummy,offline,singleplayer,campaign,classic,board,ai
```

---

## URLs

| Field | URL |
|-------|-----|
| Support URL | `https://[yourdomain].com/canasta/support` |
| Marketing URL (optional) | `https://[yourdomain].com/canasta` |
| Privacy Policy URL | **Required** — `https://[yourdomain].com/canasta/privacy` |

---

## App Privacy (nutrition labels)

Based on **v0.1 offline** build. Update if you add analytics, ads, or accounts.

| Data type | Collected? | Linked to user? | Tracking? |
|-----------|------------|-----------------|-----------|
| Contact info | No | — | — |
| Identifiers | No | — | — |
| Usage data | No (until analytics) | — | — |
| Diagnostics | Optional crash logs if enabled later | — | — |
| Gameplay content | Stored **on device only** (progress, settings) | No | No |

**Privacy practices declaration:** Data Not Collected (for pure offline v0.1) OR Data Not Linked to You for local-only storage — confirm with legal review.

---

## Screenshots (required)

See [assets-checklist.md](assets-checklist.md).

| Device class | Size (pixels) | Minimum set |
|--------------|---------------|-------------|
| iPhone 6.7" | 1290 × 2796 | 3–10 screenshots |
| iPhone 6.5" | 1284 × 2778 | 3–10 (if supporting) |
| iPad Pro 12.9" | 2048 × 2732 | Required if `supportsTablet: true` |

Suggested scenes:

1. Home screen with Single Player / Campaign / Settings  
2. Active game — table, hand, combined header (score + requirements)  
3. Campaign map  
4. Settings — House Rules  
5. Landscape gameplay  

---

## App Review notes

Paste into **Notes for Review**:

```
Canasta Mobile is an offline single-player card game. No login is required.

To test:
1. Tap "Single Player" on the home screen.
2. Tap a card to select; use action bar to Draw / Meld / Discard.
3. Settings (gear on home) → House Rules to change presets.

Campaign: tap "Campaign (50 Levels)" on home.

The app does not use location, camera, or microphone. No ads in this build.
```

Provide a **demo account** only if you add online features later.

---

## Technical

| Item | Value |
|------|--------|
| Bundle ID | `com.canasta.mobile` |
| SKU | `canasta-mobile-ios` (your choice) |
| Encryption | Answer export compliance questions; likely exempt mass-market |
| Sign in with Apple | Not required until third-party login is offered |
| iPad | Supported (`supportsTablet: true` in app.json) |
| Orientation | Portrait + landscape |

### Build upload

```bash
cd mobile
eas build --platform ios --profile production
eas submit --platform ios
```

---

## In-app purchases & subscriptions

None for v0.1. Disable IAP capability in App Store Connect until ready.

---

## Trademark note

If the display name **Canasta** is contested, consider subtitle emphasis: *Canasta Mobile — Classic Card Game* and ensure description states independent implementation.
