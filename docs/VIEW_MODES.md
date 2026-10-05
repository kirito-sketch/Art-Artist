# View modes (normal prototype only)

The normal Art and Artist prototype has two presentations. `/test` and `/research` never use them.

| Mode | What you see |
|---|---|
| Prototype | The simulated phone on the desktop canvas. Personas and QA tools are in Studio (`/studio`, docs/STUDIO.md). |
| App | Only the product, filling the viewport. No bezel, fake status bar or home indicator. Real safe areas. On a desktop the app is a centred column up to 480 px wide. |

## Switching

- **Prototype mode on a desktop:** no control on the page; App mode is a Studio link (`/?view=app`).
- **App mode, or Prototype mode on a phone :** a small translucent "View" tab on the left edge of the screen, in the page gutter. Tap it to show `Prototype | App`; it collapses again after a choice. It is a development control, styled as a tool, and never appears in the installed app.

## Which mode opens

1. Launched from the Home Screen (standalone): always App mode, with no View control.
2. `?view=app` or `?view=prototype` in the URL: applied, remembered, and removed from the address bar.
3. The remembered choice: `localStorage` key `aa_view_mode` (`prototype` or `app`).
4. No choice yet: App mode on phone-sized screens (600 px wide or less), Prototype mode on larger screens.

## Add to Home Screen

`/manifest.webmanifest` (name and short_name "Art and Artist", display standalone, start_url and scope `/`, portrait), icons in `/icons/`, `apple-touch-icon`, `apple-mobile-web-app-*` meta and `viewport-fit=cover`. These are added only on the normal app, so `/test` and `/research` are unchanged. Static files are public through the access gate, so the manifest and icons load before signing in.

Steps: open the app URL in Safari, enter the access password, choose App if needed, Share, Add to Home Screen.

## Launch splash (Home Screen app only)

The installed app plays the logo animation as a launch layer. Safari, Prototype mode, `/test` and `/research` never show it.

- **Standalone** is `isStandalone()` in `src/dev/viewMode.tsx`: `matchMedia('(display-mode: standalone)')` or iOS `navigator.standalone`. The inline boot script in `index.html` uses the same test.
- **Cold start:** `index.html` already contains the splash (inlined at build time from `src/ui/splashCore.ts` and `src/styles/splash.css`), so the first paint after the iOS launch screen is the splash ground, never the grey prototype canvas. Every other page removes it before the first paint. The mark starts when the app has rendered and the main thread is free (the brush draw runs on the main thread), and `src/ui/LaunchSplash.tsx` takes it over.
- **A launch is a new execution context, and only that.** The splash is owed once per page load of the installed app. Whether it is still owed is an in-memory flag (`hasPlayedLaunchSplash`, `src/ui/launchSession.ts`): set when the splash has finished and left, never persisted (no localStorage, cookie or timer), so the next genuine launch has it again. It is independent of onboarding, sign-in and every other app state.
- **Resume is not a launch.** Switching to another app and back, Home, the phone locking, any amount of time in the background, `visibilitychange`, `focus`, `pageshow` (including bfcache restores), route changes and remounts do not play it. Nothing listens for them. The screen, scroll position, sheets, persona and unfinished work are exactly as left. There is no time threshold.
- **What iOS can and cannot tell us.** iOS exposes no "the user force-quit this app" event. The only observable difference is whether it created a new page (the old one ended: the splash plays) or kept the old one alive (nothing reloads, so nothing replays). If iOS restores an old context, the existing screen is preserved rather than replaying a false splash.
- **Onboarding:** the launch splash sits above whatever state the app opens in (Home, or the entry flow). While it is owed, onboarding starts under it at its first screen instead of drawing a second mark; an entry started after the launch (for example a house invite) keeps its own splash.
- **Mark and app are separate states:** the app renders underneath (inert, and unpainted so arriving images cost nothing while the mark draws). The splash leaves only when the mark's final animation has ended AND the screen underneath has its fonts and on-screen images decoded; the app is then painted under the finished, static mark, and the splash fades (300ms) and is removed after the fade. Capped at 4s from the start on a slow network.
- **Once per launch:** the mark pauses if the app is hidden mid-splash and continues from the same frame (it never restarts).
- **State:** the splash never remounts or resets the app: the screen, open sheets, persona and saved items are exactly as left. A remounted splash component stays off once it has played.
- **Access password:** unchanged. A cold start loads the page, so an expired access cookie shows the password page first (served before the app), then the splash after signing in. A resume from memory never asks again.

**Known limitation:** an iPhone Home Screen app keeps its own cookies, separate from Safari, so the first launch shows the access password page once (the access cookie then lasts 7 days, as in the browser). The icons are drawn from the current 80 px logo; a high-resolution mark would make them sharper.
