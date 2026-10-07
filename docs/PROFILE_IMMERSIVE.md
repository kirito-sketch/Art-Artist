# Individual Profile introduction

The New Home direction now uses an immersive Individual Profile. Production House profile layout and permissions are unchanged. Explicit Legacy Home retains the earlier short profile cover treatment.

## First viewport

Professional work fills the usable viewport above the bottom navigation. Identity, portrait, primary craft, city/languages, actual public accepted-credit count and existing years-active data sit over a readability gradient. Follow stays primary and Message secondary for other people. Owners have Edit profile and Change profile cover. Share, personal Save and Settings/overflow retain their existing handlers. There is no live presence indicator.

The hero uses the actual phone viewport and safe-area tokens, not Compare frame dimensions. It naturally scrolls away. A compact name/header appears after most of the hero has left view. The rounded surface below uses the current light/dark theme. Showreel, portfolio, featured work, credits and posts precede deeper professional details and private owner management.

## Cover selection

Edit profile → Portfolio & showreel → Profile cover stores `ProfileExtra.profileCover`, a reference to automatic professional work, a portfolio media ID, an eligible public project ID, or the published showreel. The resolver checks eligibility again when rendering. Removed/private projects cannot supply cover art. Choosing artwork never adds or claims a credit. External work links remain links rather than fabricated thumbnails.

Automatic selection uses a portfolio image, eligible project artwork, then a public showreel poster. With no work, a designed Ana typographic/graphic fallback appears. The profile portrait is never stretched into a background.

A showreel cover is a static poster. A valid playable reel provides Play showreel, opening the existing player only after a tap. Invalid legacy demo URLs remain unavailable rather than pretending to play. Private native-upload drafts never appear in the public hero.

Storage follows the existing prototype profile store: edits survive in-app navigation for the session, but are not server-persisted across reloads. Production persistence remains future infrastructure, as with other profile edits.

## Unchanged boundaries

Private/blocked/removed-profile gates run before media resolution. Public credit counts use the existing accepted-and-public credit selector. Production-side credit creation, acceptance/correction, Follow, messaging eligibility, identity-specific actions and field visibility use their existing implementations. No new permissions are introduced.
