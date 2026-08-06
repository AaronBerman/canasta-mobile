# Google Play — v1.0 release (multiplayer off)

Ship **Canasta Table** to the Play Store as a **fully offline** app. Multiplayer is disabled in production builds; code remains in the repo for a later update.

---

## What’s in the v1.0 build

| Feature | Included |
|---------|----------|
| Quick Game | Yes |
| Full Match (house rules) | Yes |
| Campaign (intro + 50 levels) | Yes |
| Cosmetics | Yes (gameplay unlocks) |
| Multiplayer | **No** — hidden via feature flag |
| Ads / IAP | **No** |

Feature flag: `EXPO_PUBLIC_MULTIPLAYER_ENABLED=false` in `mobile/eas.json` → `production` profile.

---

## One-time setup

1. **Google Play Console** — [play.google.com/console](https://play.google.com/console) ($25 one-time)
2. **Expo EAS** — [expo.dev](https://expo.dev) account (free tier works)
3. **Privacy policy** — host `docs/store/privacy-policy-draft.md` at a public URL (required)
4. **Support email** — e.g. `support@yourdomain.com`

---

## Build the release AAB

From the **`mobile/`** directory:

```bash
cd mobile
npm install -g eas-cli
eas login
npm run eas:android
```

`npm run eas:android` syncs the game engine (`../src` → `mobile/shared-src/`) then runs `eas build`.

Install **Git** for Windows if EAS warns about missing version control ([git-scm.com](https://git-scm.com/download/win)).

This produces an **Android App Bundle (`.aab`)** with multiplayer **disabled**.

Download the build from the Expo dashboard when it finishes.

---

## Play Console checklist

### 1. Create app

- App name: **Canasta Table**
- Default language: English
- App or game: **Game**
- Free or paid: **Free**

### 2. Store listing

| Field | Value |
|-------|--------|
| Short description (80 chars) | Partnership Canasta vs AI. Quick Game, 50-level campaign, house rules. |
| Full description | Copy from [README.md](README.md) shared section — **omit multiplayer** |
| App icon | 512×512 PNG from `mobile/assets/icon.png` |
| Feature graphic | 1024×500 PNG |
| Screenshots | Min 2 phone — home, in-game, campaign |

### 3. Content rating

Complete the IARC questionnaire. Expect **Everyone** (no violence, no UGC, no chat).

### 4. Data safety

| Question | v1.0 answer |
|----------|-------------|
| Collect or share user data? | **No** data sent to your servers |
| Data encrypted in transit | N/A (offline-only) |
| Data stored on device | Yes — progress, settings, unlocks (local only) |
| Account required | **No** |
| Contains ads | **No** |
| In-app purchases | **No** |

### 5. App access

- All features available without login
- Reviewer notes: *“Offline single-player card game. Open app → Quick Game or Campaign. No account or network required.”*

### 6. Upload & release

1. **Release** → **Testing** → **Internal testing** (recommended first)
2. Create release → Upload AAB from EAS
3. Add release notes: *“Initial release — offline Canasta vs AI, campaign, house rules.”*
4. Roll out to internal testers → verify on device
5. Promote to **Production** when ready

Optional: `eas submit --platform android --profile production` after configuring a Play service account.

---

## Verify multiplayer is off

Before submitting, install the production AAB/APK and confirm:

- [ ] Home screen has **no Multiplayer** button
- [ ] Quick Game, Full Match, Campaign, Settings all work **airplane mode on**
- [ ] No crash when opening app without network

---

## Enable multiplayer later

1. Deploy game server (see [MULTIPLAYER.md](../MULTIPLAYER.md))
2. Set `EXPO_PUBLIC_MULTIPLAYER_URL=wss://your-server`
3. Change production env in `eas.json`: `"EXPO_PUBLIC_MULTIPLAYER_ENABLED": "true"`
4. Update Data safety + privacy policy (online play)
5. Ship v1.1 with “Play with friends” in listing

---

## Related docs

- [google-play.md](google-play.md) — full field reference
- [README.md](README.md) — shared listing copy
- [privacy-policy-draft.md](privacy-policy-draft.md)
- [assets-checklist.md](assets-checklist.md)
- [MOBILE_APP.md](../MOBILE_APP.md) — Expo / EAS details
