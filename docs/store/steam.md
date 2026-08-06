# Steam listing (future)

Steam is **not required** for the current mobile-first release. This doc prepares a listing if you ship a **desktop build** (e.g. Expo web/Electron, React Native Windows, or a web wrapper).

---

## Feasibility summary

| Approach | Effort | Notes |
|----------|--------|-------|
| **Expo web** (`expo start --web`) | Medium | Touch-first UI may need mouse/keyboard polish |
| **Electron wrapper** around web build | Medium–High | Common for mobile-first ports |
| **React Native Windows** | High | Separate native target |
| **Steam Deck** | Extra QA | Verify landscape layout + controller (optional) |

Recommendation: ship iOS/Android first; prototype web build before paying Steam Direct fee ($100 USD per app, recoupable).

---

## Steamworks checklist

- [ ] Steamworks partner account  
- [ ] Pay Steam Direct fee  
- [ ] App ID assigned  
- [ ] Build pipeline (depot) for Windows ± macOS ± Linux  
- [ ] Steam Cloud (optional — local save sync)  
- [ ] Achievements (optional)  
- [ ] Trading cards (optional, post-launch)  

---

## Store page fields

| Field | Draft |
|-------|--------|
| Game name | Canasta Mobile |
| Developer | [Your Developer Name] |
| Publisher | Same as developer (unless publishing under label) |
| Release date | TBD |
| Price | Free or $4.99–$9.99 (your choice — card games often $4.99) |
| Categories | **Casual**, **Strategy**, **Indie** |
| Tags | Card Game, Turn-Based, Singleplayer, 2D, Family Friendly, Relaxing, Classic |

Steam allows ~20 tags — prioritize: Card Game, Singleplayer, Turn-Based Strategy, Casual, Indie, 2D, Family Friendly, Touch-Friendly (if applicable).

---

## Short description (Steam limit ~300 chars)

> Classic American partnership Canasta against AI. Play solo with a smart partner, tackle a 50-level campaign, and customize house rules. Portrait and landscape. No account required for offline play.

---

## About this game (long description)

Use the **Full description** from [README.md](README.md), plus desktop-specific notes:

**PC features (when ready)**

- Play with mouse — click to select, drag to discard  
- Keyboard shortcuts (suggested): `D` draw, `M` meld, `S` skip, `U` undo  
- Windowed and fullscreen  
- Steam Deck verified (goal — test touch + 1280×800 landscape)  

**System requirements (draft — adjust after profiling)**

Minimum:

- **OS:** Windows 10 64-bit / macOS 11 / Ubuntu 22.04  
- **Processor:** Dual-core 2 GHz  
- **Memory:** 4 GB RAM  
- **Graphics:** Integrated GPU  
- **Storage:** 500 MB  
- **Sound:** Optional  

Recommended: same — game is lightweight.

---

## Assets (Steam)

| Asset | Size | Notes |
|-------|------|-------|
| Header capsule | 460 × 215 | Key art + logo |
| Small capsule | 231 × 87 | |
| Main capsule | 616 × 353 | |
| Hero capsule | 3840 × 1240 | Optional |
| Logo | Transparent PNG | |
| Screenshots | 1920×1080 or 1280×720 | At least 5 — landscape gameplay |
| Trailer | 1920×1080 MP4 | 30–90 seconds |

Reuse mobile screenshots where possible; capture **landscape PC window** for primary carousel.

---

## Legal & content survey

| Question | Expected answer |
|----------|-----------------|
| Violence | None |
| Sexual content | None |
| Online interactions | None in v0.1; disclose if multiplayer added |
| User-generated content | None |
| Gambling | No real-money gambling |

---

## Multiplayer on Steam (future)

If you add online play:

- Disclose in description  
- Steam networking or custom server  
- Moderation plan if chat is added  
- Update privacy policy  

---

## Depots & branches

Suggested structure:

```
canasta-windows
canasta-macos      (optional)
canasta-linux      (optional — Proton may run Windows build)
```

Default branch: `public`  
Beta branch: `beta` for testers

---

## When to skip Steam

Skip if you stay mobile-only. Apple App Store and Google Play are sufficient for Canasta Mobile v0.1.

Revisit Steam when:

- Web/desktop build is stable  
- You want discoverability among PC card-game players  
- Steam Deck layout is tested  

---

## Related

- [README.md](README.md) — shared copy  
- [assets-checklist.md](assets-checklist.md) — screenshot ideas  
- [MOBILE_APP.md](../MOBILE_APP.md) — current Expo targets
