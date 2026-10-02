# View modes (normal prototype only)

The normal Art and Artist prototype has two presentations. `/test` and `/research` never use them.

| Mode | What you see |
|---|---|
| Prototype | The simulated phone on the desktop canvas, with the persona and QA console beside it. |
| App | Only the product, filling the viewport. No bezel, console, fake status bar or home indicator. Real safe areas. On a desktop the app is a centred column up to 480 px wide. |

## Switching

- **Prototype mode:** the `Prototype | App` switch sits at the top of the console, next to the title.
- **App mode, or Prototype mode on a phone (where the console is hidden):** a small translucent "View" tab on the left edge of the screen, in the page gutter. Tap it to show `Prototype | App`; it collapses again after a choice. It is a development control, styled as a tool, and never appears in the installed app.

## Which mode opens

1. Launched from the Home Screen (standalone): always App mode, with no View control.
2. `?view=app` or `?view=prototype` in the URL: applied, remembered, and removed from the address bar.
3. The remembered choice: `localStorage` key `aa_view_mode` (`prototype` or `app`).
4. No choice yet: App mode on phone-sized screens (600 px wide or less), Prototype mode on larger screens.

## Add to Home Screen

`/manifest.webmanifest` (name and short_name "Art and Artist", display standalone, start_url and scope `/`, portrait), icons in `/icons/`, `apple-touch-icon`, `apple-mobile-web-app-*` meta and `viewport-fit=cover`. These are added only on the normal app, so `/test` and `/research` are unchanged. Static files are public through the access gate, so the manifest and icons load before signing in.

Steps: open the app URL in Safari, enter the access password, choose App if needed, Share, Add to Home Screen.

**Known limitation:** an iPhone Home Screen app keeps its own cookies, separate from Safari, so the first launch shows the access password page once (the access cookie then lasts 7 days, as in the browser). The icons are drawn from the current 80 px logo; a high-resolution mark would make them sharper.
