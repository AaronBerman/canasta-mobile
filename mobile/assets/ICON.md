# Canasta Table — App Icon Brief

Replace `icon.png`, `adaptive-icon.png`, and `splash-icon.png` before store submission.

## Concept

**Green felt table** + **one clear focal mark** — either a bold **“C”** monogram or a **single playing card** (not a fanned hand).

## Requirements

| Requirement | Detail |
|-------------|--------|
| Background | Casino green `#1a472a` (matches `app.json` splash) |
| Focal element | White or cream **C**, or one card with large rank/suit |
| Small-size test | Must read clearly at 29×29 pt (iOS) / 48dp (Android) |
| Avoid | Busy spreads, thin lines, small text, photoreal clutter |
| Apple | 1024×1024 PNG, **no transparency** |
| Android adaptive | Foreground PNG with safe zone; background `#1a472a` |

## Files

| File | Use |
|------|-----|
| `icon.png` | iOS / Expo main icon |
| `adaptive-icon.png` | Android foreground |
| `splash-icon.png` | Splash screen (can match icon or use wordless C) |

## After replacing assets

```bash
cd mobile
npx expo prebuild --clean   # if using native projects
```

## Draft asset

A generated draft may be saved as `icon-canasta-table-draft.png` in the repo root or assets folder — refine in Figma/Illustrator before production export.
