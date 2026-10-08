# Individual Profile introduction

The New Home direction now uses an immersive Individual Profile. Production House profile layout and permissions are unchanged. Explicit Legacy Home retains the earlier short profile cover treatment.

## First viewport

The selected portrait or featured work fills the first viewport with cover cropping. There is no separate avatar. Name, primary craft, city/languages, actual public accepted-credit count and existing years-active data are centred in the lower-middle over a smooth, neutral black readability gradient. The gradient follows the measured identity position, including shorter phones and wrapped languages. There is no green tint, opaque lower panel or separate glass identity card.

Follow stays primary and Message secondary, side by side with equal 48px targets in a translucent glass surround. Follow has restrained emphasis; Following adds a light selected fill, dark readable text and a checkmark, alongside its existing pressed state. Message and the compact owner Edit profile button remain translucent. Top circular controls use neutral glass. These media-overlay colours remain the same in both themes. Top controls are Back when relevant, Share and Settings/More; personal Save is available in More. There is no live presence indicator. Explore work remains above bottom navigation.

The hero uses the actual phone viewport and safe-area tokens, not Compare frame dimensions. It naturally scrolls away. A compact name/header appears after most of the hero has left view. The rounded surface below uses the current light/dark theme. Showreel, portfolio, featured work, credits and posts precede deeper professional details and private owner management.

About stays in the regular profile, before role-aware skills/details. Self and other profiles share `ProfileScreen`, `ProfileHeroMedia`, the same gradient/glass/layout and scroll treatment. Only ownership actions and existing private controls differ. The hero remains one viewport on short phones, with compact typography and spacing rather than a taller artificial canvas.

Older safe-framing and glass-panel choices no longer restore the split-image/green-panel composition. Image selection and focal coordinates are preserved; old glass identity placement resolves to lower-middle. Edit profile retains image selection, horizontal/vertical focal controls and lower-middle/slightly-higher identity placement, with a full-bleed preview matching the current phone aspect ratio.

`profileHeroCrop` uses actual loaded dimensions and the container size. It centres the marked subject horizontally and brings it toward the clear upper image when crop overflow permits, clamping offsets so no edges are uncovered. Close portrait frames also use a restrained, fixed 10% overscan anchored at the bottom, raising facial details above the lower title region. It does not detect faces. A wide frame without vertical overflow cannot be panned vertically; use the preview to choose a suitable subject/crop and identity position. Parallax scaling is disabled for the immersive hero so the chosen crop stays stable while the screen naturally scrolls away.

Validation includes close/full-body portraits, dark/bright photos, wide work and left/right subjects, for both ownership states at 320×568, 393×852 and 430×932 in light/dark mode. Professional data and production permissions remain unchanged.

## Cover selection

Edit profile → Profile image & crop opens the existing Portfolio & showreel editor. Profile cover stores `ProfileExtra.profileCover`, a reference to automatic selection, the profile portrait, a portfolio media ID, an eligible public project ID, or the published showreel. Horizontal and vertical focus controls store a bounded focal position on that reference and preview the crop. The resolver checks eligibility again when rendering. Removed/private projects cannot supply cover art. Choosing artwork never adds or claims a credit. External work links remain links rather than fabricated thumbnails.

Automatic selection uses the existing profile portrait, then a portfolio image, eligible project artwork, or a public showreel poster. Explicit featured work overrides this order. With no image, a designed Ana typographic/graphic fallback appears. Images use cover cropping and focal positioning without stretching.

A showreel cover is a static poster. A valid playable reel provides Play showreel, opening the existing player only after a tap. Invalid legacy demo URLs remain unavailable rather than pretending to play. Private native-upload drafts never appear in the public hero.

Storage follows the existing prototype profile store: edits survive in-app navigation for the session, but are not server-persisted across reloads. Production persistence remains future infrastructure, as with other profile edits.

## Unchanged boundaries

Private/blocked/removed-profile gates run before media resolution. Public credit counts use the existing accepted-and-public credit selector. Production-side credit creation, acceptance/correction, Follow, messaging eligibility, identity-specific actions and field visibility use their existing implementations. No new permissions are introduced.
