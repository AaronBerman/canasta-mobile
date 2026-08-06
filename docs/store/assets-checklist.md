# Store assets checklist

Visual and marketing assets for App Store, Play Store, and Steam. Create under `marketing/` (gitignored) or your design tool — paths below are suggestions.

---

## Brand

| Asset | Size | Notes |
|-------|------|-------|
| App icon source | 1024 × 1024 PNG | From `mobile/assets/icon.png`; no alpha for Apple |
| Adaptive icon foreground | 1024 × 1024 PNG | `mobile/assets/adaptive-icon.png` |
| Logo (wordmark) | SVG + PNG | For feature graphic and Steam header |
| Primary color | `#1a472a` | Felt green from splash |
| UI accent | `#fbbf24` | Gold buttons / highlights |

---

## Screenshot storyboard (recommended 5–8 shots)

Capture on **real device** or simulator at highest resolution.

| # | Screen | Caption idea |
|---|--------|----------------|
| 1 | Home | "Single Player, Campaign, and Settings" |
| 2 | Game (portrait) | "Classic partnership Canasta vs AI" |
| 3 | Game (landscape) | "Adaptive layout — rotate your device" |
| 4 | Header close-up | "Score, requirements, and turn phases at a glance" |
| 5 | Campaign map | "50 levels from tutorial to challenge" |
| 6 | Settings → House Rules | "Classic, Relaxed, or Speed — or customize" |
| 7 | Settings → Customize | "Unlock card backs, fonts, and table skins" |
| 8 | Hand result / level complete | "Track progress and earn unlocks" |

### iOS screenshot sizes

| Device | Portrait | Landscape |
|--------|----------|-----------|
| iPhone 6.7" | 1290 × 2796 | 2796 × 1290 |
| iPad 12.9" | 2048 × 2732 | 2732 × 2048 |

### Android

| Type | Aspect | Min count |
|------|--------|-----------|
| Phone | 9:16 or 16:9 | 2 |
| 7" tablet | Optional | 1 |
| 10" tablet | Optional | 1 |
| Feature graphic | 1024 × 500 | 1 |

### Steam

| Asset | Size |
|-------|------|
| Screenshots | 1920 × 1080 recommended |
| Header capsule | 460 × 215 |
| Main capsule | 616 × 353 |

---

## Optional video trailer (30–60s)

Storyboard:

1. Logo title (2s)  
2. Deal animation / table reveal (5s)  
3. Meld and discard gameplay (10s)  
4. Campaign map swipe (5s)  
5. Settings / house rules flash (5s)  
6. Landscape rotate (5s)  
7. End card: "Canasta Mobile — Free on iOS & Android" (3s)  

Formats:

- **App Store Preview:** device-specific, H.264, no clickable CTAs in first frame  
- **Play Store:** YouTube link  
- **Steam:** MP4 1920×1080 uploaded to Steamworks  

---

## Localization (future)

Priority languages if you expand:

| Language | Store listing | In-app |
|----------|---------------|--------|
| English (US) | v1 | v1 |
| Spanish | v1.1 | later |
| Portuguese (BR) | v1.1 | later |

Keep screenshot captions in Photoshop/Figma layers for easy translation.

---

## Pre-submission QA on captures

- [ ] Status bar clean (full battery or hidden in simulator)  
- [ ] No debug banners  
- [ ] Readable text at thumbnail size  
- [ ] Consistent dark theme (`#0f172a` background)  
- [ ] Show actual app UI — no misleading art  

---

## File naming convention

```
marketing/
├── icon-1024.png
├── feature-graphic-1024x500.png
├── ios/
│   ├── iphone-67-01-home.png
│   └── ...
├── android/
│   ├── phone-01-home.png
│   └── feature-graphic.png
└── steam/
    ├── capsule-header.png
    └── screenshot-01.png
```

Add `marketing/` to `.gitignore` if assets are large; keep this checklist in repo.
