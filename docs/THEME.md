# Appearance and theme

Settings › Appearance: **System** (default), **Light** or **Dark**. Applies at once (no Save), is stored on
this device (`localStorage` key `aa-appearance`) and survives restarts. With System the app follows the
phone, live, both ways.

## Architecture

| Piece | Where |
|---|---|
| Choice, resolution, live system listener, crossfade | `src/ui/theme.ts` (`useAppearance`, `useTheme`, `setAppearance`, `enableTheme`) |
| First-paint resolution (no light flash) and the surface gate | `src/ui/themeCore.ts`, inlined into `<head>` by `vite.config.ts` |
| Light values | `src/styles/tokens.css`, `src/styles/expression.css` (surfaces), `src/styles/a11y.css` (text contrast) |
| Dark values and the few component exceptions | `src/styles/theme-dark.css` |

The resolved theme is `<html data-theme="light|dark">`. It is set **only on the normal app**: `/test`,
`/research`, research sessions, the moderation console and the internal QA pages never receive it, so they
look exactly as before on any phone. Only the default look takes the dark theme (the prototype's
alternative looks keep their own palettes). Studio and the stage around the phone stay light.

## Semantic tokens

Components use tokens, not light or dark colours. Dark redefines the same tokens.

| Role | Token | Light | Dark |
|---|---|---|---|
| Page ground | `--base` / `--bg` | #f6f4f0 / #ffffff | #121110 / #141312 |
| Quiet section | `--tint` | #efebe4 | #191816 |
| Raised object (cards) | `--raised` | #ffffff | #1e1c1a |
| Sheets, footers | `--surface` | #ffffff | #1d1b19 |
| Grouped / fill / strong fill | `--grouped`, `--fill`, `--fill-strong` | #f2f2f7, #f2f2f7, #e5e5ea | #211f1c, #262421, #322f2b |
| Placeholder ground | `--surface-2` (new) | #ececec | #2a2724 |
| Divider / hairline | `--line`, `--hairline` | #e5e5ea, rgba(40,30,20,.1) | rgba(255,244,230,.12), .10 |
| Overlay | `--scrim` | rgba(0,0,0,.32) | rgba(0,0,0,.6) |
| Text primary / secondary / tertiary | `--text`, `--text-2`, `--text-3` | #111, #5f5f64, #68686d | #f3efe9, #b4ada3, #9a948b |
| Primary button | `--primary`, `--on-primary` | #111 / #fff | #f3efe9 / #141312 |
| Action fill | `--action` | #275c50 | #2f7565 (white text 5.4:1) |
| Action as text or icon | `--action-ink` (new) | = `--action` | #8fcab8 (10:1 on the page) |
| Accent as text | `--accent-ink` (new) | = `--accent` | #8fcab8 |
| Selected surfaces | `--action-tint`, `--action-tint-strong` | green 10%, 18% | green 14%, 24% |
| Verified / available / error | `--verified`, `--available`, `--available-text`, `--danger` | #1f5af6, #1e9e5a, #126b40, #b83127 | #7fa6ff, #34c27a, #63cf98, #c9443a |
| Error as text | `--danger-ink` (new) | = `--danger` | #f0675b |
| Floating controls, tab bar | `--float-bg`, `--float-fg`, `--bar-bg` | white 95%, #111, white 90% | charcoal 82%, #f3efe9, charcoal 90% |
| Secondary button edge | `--btn-edge` | rgba(40,30,20,.16) | rgba(255,244,230,.16) |
| Shadows | `--shadow-float`, `--shadow-card`, `--shadow-2`, `--shadow-3` | warm, soft | deeper, with a hairline edge |

The brand green is kept: fills use it (lifted one step in dark for contrast); text and icons use the new ink
tokens, so links and selected states stay readable on dark. 34 CSS declarations moved from `--action`,
`--accent` and `--danger` to their ink tokens (identical in light).

## Component exceptions in dark

Hard-coded light values that would break on dark, now handled in `theme-dark.css`: floating buttons and
paper labels on photos (dark glass), skeleton shimmer, tab-bar rings, toggle knob, credit seal, toasts
(elevated dark, not the inverted primary), production house monograms (graphite, not a light tile), draft
tags, the confirmed-state chip, Sign in with Apple (white per Apple's dark guidance), the logo PNG (ink
lightened, red drop kept), the Create surface (its colour animation now takes the theme's colours), the
launch splash (dark ground, light ink) and the app's ground behind the safe areas. Artwork stays as drawn:
craft illustrations, the share QR code (white, for scanning) and photography.

## Change

A 280 ms colour crossfade (background, text, border, fill, stroke, shadow) when the theme changes; none
with Reduce Motion. No other motion.
