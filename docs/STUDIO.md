# Studio

Studio (`/studio`) replaced the prototype console (October 2026). The app itself (`/`) now shows only the phone, like the real product. Everything for reviewing and testing lives on one separate page, behind the same shared password as the app.

## What's on it

| Section | What it does |
| --- | --- |
| Explore as | Opens the app as Kiran, Tara, Konark Pictures or Tidewater Films. Also today's Home or the new Home, and App mode (full screen). |
| Flows | New person onboarding, sign in, accepting a house invite, a policy update. |
| Test states | New user, slow network, offline, For you fails, posting fails, actions fail once; for houses, Aditi can't issue credits and pending houses verified. A notice above the phone says when one is on. |
| Testing and research | Edge Case Lab, `/test`, `/research`, a moderated research session, the moderation console, motion review, the type and component specimen. |
| Archive | Earlier directions as screenshots (`public/studio/archive/`): full-screen slides Home, Pulse and Queue house Homes, Hiring-first house page, the separate Respond form, the Glass, Bold and Doodle looks. Their code was removed; git history has it. |
| Product status | Decided, being validated, deferred. The legal placeholder note. |

## Links into the app

Every Studio item is a plain link, so it can be shared. The app reads these once at load (`src/dev/deepLink.tsx`); nothing persists, so reloading the link starts it again.

| Parameter | Values |
| --- | --- |
| `as` | `kiran`, `tara`, `konark`, `tidewater` (houses open as Aditi acting for the house) |
| `flow` | `new`, `signin`, `invite`, `policy` |
| `state` | comma-separated: `newUser`, `loading`, `offline`, `forYouError`, `failPublish`, `actionsFail`, `noIssue`, `housesVerified` |
| `home` | `next`, `current` |
| `view` | `app`, `prototype` |
| `from=studio` | shows a small "Studio" link outside the phone (hidden at phone width) |

Example: `/?as=konark&state=noIssue&from=studio`.

## What changed for testing

- A link always starts fresh. Switching persona while keeping what you just did (a house issues a credit, the person accepts it) is no longer a click; walkthrough scripts do it through a development-only hook, `window.__anaAs(persona)`, and open flows with `window.__anaFlow(flow)`. Neither exists in production builds.
- `/test` and `/research` are unchanged.
