# Google Play Store listing

Google Play Console checklist for **Canasta Table** — **v1.0 ships offline only** (multiplayer disabled). See **[PLAY_STORE_V1.md](PLAY_STORE_V1.md)** for the step-by-step launch guide.

---

## Store listing

| Field | Draft |
|-------|--------|
| App name | Canasta Table |
| Short description (80 chars) | Classic partnership Canasta vs AI. Campaign, house rules, custom tables. |
| Full description (4000 chars) | Use full text from [README.md](README.md) |

### Tags (Play Games / discovery)

Select where available:

- Card
- Board
- Single player
- Offline
- Casual

---

## Graphic assets

| Asset | Spec | File (suggested) |
|-------|------|------------------|
| App icon | 512 × 512 PNG | Export from `mobile/assets/icon.png` |
| Feature graphic | 1024 × 500 PNG | Marketing banner — table + logo |
| Phone screenshots | 16:9 or 9:16, min 2 | See [assets-checklist.md](assets-checklist.md) |
| 7" tablet | Optional | Landscape game recommended |
| 10" tablet | Optional | Same |

**Promo video (YouTube URL):** Optional — 30–120s gameplay montage.

---

## Categorization

| Field | Value |
|-------|--------|
| Application type | App |
| Category | Game |
| Tags | Card, Board, Single player |
| Content rating | Complete IARC questionnaire — expect **Everyone** |
| Target audience | Adults and children (no directed ads to children if ads added later) |
| News app | No |
| COVID contact tracing | No |

---

## Data safety form

Align with [privacy-policy-draft.md](privacy-policy-draft.md). For **v0.1 offline**:

| Question | Answer |
|----------|--------|
| Collect or share user data? | No personal data transmitted to servers |
| Data encrypted in transit | N/A for offline-only |
| Data stored locally | Game progress, settings, unlocks on device |
| Users can request deletion | Clear app data / uninstall |
| Account registration | No |

If you add AdMob or analytics later, **update this form before release**.

---

## App access

| Field | Value |
|-------|--------|
| Restricted features | None — fully accessible offline |
| Instructions for reviewers | Same as Apple notes in [apple-app-store.md](apple-app-store.md) |

---

## Pricing & distribution

| Field | Value |
|-------|--------|
| Price | Free |
| Countries | All (or your chosen list) |
| Contains ads | **No** (v0.1) — change when ads ship |
| In-app purchases | No |
| Play Pass | Opt in later if desired |

---

## Technical

| Item | Value |
|------|--------|
| Package name | `com.canasta.mobile` |
| Version code | Increment integer each upload (start at `1`) |
| Version name | `0.1.0` |
| Min SDK | Set by Expo prebuild (document in release notes) |
| Target SDK | Latest required by Play (Expo manages) |
| Permissions | Review merged `AndroidManifest.xml` after prebuild — expect minimal (network for Expo updates only) |

### Build upload

```bash
cd mobile
eas build --platform android --profile production
eas submit --platform android
```

Or upload AAB manually to Play Console → Production / Internal testing.

---

## Release tracks

Recommended path:

1. **Internal testing** — team devices  
2. **Closed testing** — wider beta  
3. **Production** — public  

---

## Store presence — contact details

| Field | Value |
|-------|--------|
| Developer email | `support@[yourdomain].com` |
| Website | `https://[yourdomain].com/canasta` |
| Privacy policy | **Required** — public URL |

---

## Android-specific marketing bullets

Use in full description or feature graphic callouts:

- Works offline — play anywhere  
- Portrait and landscape  
- 50-level Campaign tutorial  
- Customize Classic, Relaxed, or Speed rules  
- No account needed  

---

## Future: Play Games Services

Optional later:

- Achievements (campaign progress, wins)  
- Cloud save (requires backend)  

Not required for v0.1.
