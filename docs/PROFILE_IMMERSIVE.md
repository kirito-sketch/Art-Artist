# Individual Profile introduction

The New Home direction now uses an immersive Individual Profile. Production House profile layout and permissions are unchanged. Explicit Legacy Home retains the earlier short profile cover treatment.

## First viewport

The selected portrait or featured work fills the first viewport with cover cropping. There is no separate avatar. Name, primary craft, city/languages, actual public accepted-credit count and existing years-active data are centred in the lower-middle over a layered teal readability gradient. Follow stays primary and Message secondary, side by side with equal 48px targets in a restrained glass surround. Following uses an opaque pale green fill, dark text, check mark and the existing pressed state (10.44:1 text contrast); Follow uses opaque Ana green and white (7.68:1). These media-overlay colours remain the same in both themes. Owners have a compact Edit profile action. Top controls are Back when relevant, Share and Settings/More; personal Save is available in More. There is no live presence indicator. Explore work is a quiet affordance above the bottom navigation.

The hero uses the actual phone viewport and safe-area tokens, not Compare frame dimensions. It naturally scrolls away. A compact name/header appears after most of the hero has left view. The rounded surface below uses the current light/dark theme. Showreel, portfolio, featured work, credits and posts precede deeper professional details and private owner management.

## Cover selection

Edit profile → Profile image & crop opens the existing Portfolio & showreel editor. Profile cover stores `ProfileExtra.profileCover`, a reference to automatic selection, the profile portrait, a portfolio media ID, an eligible public project ID, or the published showreel. Horizontal and vertical focus controls store a bounded focal position on that reference and preview the crop. The resolver checks eligibility again when rendering. Removed/private projects cannot supply cover art. Choosing artwork never adds or claims a credit. External work links remain links rather than fabricated thumbnails.

Automatic selection uses the existing profile portrait, then a portfolio image, eligible project artwork, or a public showreel poster. Explicit featured work overrides this order. With no image, a designed Ana typographic/graphic fallback appears. Images use cover cropping and focal positioning without stretching.

A showreel cover is a static poster. A valid playable reel provides Play showreel, opening the existing player only after a tap. Invalid legacy demo URLs remain unavailable rather than pretending to play. Private native-upload drafts never appear in the public hero.

Storage follows the existing prototype profile store: edits survive in-app navigation for the session, but are not server-persisted across reloads. Production persistence remains future infrastructure, as with other profile edits.

## Unchanged boundaries

Private/blocked/removed-profile gates run before media resolution. Public credit counts use the existing accepted-and-public credit selector. Production-side credit creation, acceptance/correction, Follow, messaging eligibility, identity-specific actions and field visibility use their existing implementations. No new permissions are introduced.
