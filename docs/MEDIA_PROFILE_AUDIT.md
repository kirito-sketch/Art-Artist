# Media aspect ratios and profile UX: audit and changes

October 2026. An audit of the recent media and profile work (commits `9732bdc` to `40a0504`), then fixes. No image or video was generated, replaced, downloaded or edited. Post content, credits, project information and content order are unchanged.

## 1. What the existing media library actually contains

Every delivered file was measured.

| Folder | Files | Shape |
| --- | --- | --- |
| `images/covers` | 12 | All landscape, 2.0:1 to 2.34:1 (wider than 16:9) |
| `images/people` | 22 | All 4:5 portraits (headshots) |
| `images/tiles` | 5 | Square icons (interface, not content) |
| `images/posts` | 1 | 4:5 (a video poster frame added by an earlier commit, `66c90ea`) |
| `images/stills`, `images/posters` | 0 | **Empty.** Every seed still and poster renders its fallback cover |
| `video/*.mp4` | 6 | All 400 × 500 (4:5) |

So the honest mix is **landscape film stills plus 4:5 portraits**. There is **no square professional work, no true poster (2:3) and no 9:16 video** in the library. The variety below comes only from showing these two real shapes truthfully; nothing is cropped to manufacture a third.

## 2. Problems found in the recent implementation

| # | Problem | Cause | Fix |
| --- | --- | --- | --- |
| 1 | Landscape stills shown with empty bands or as "unknown" | Geometry lookup ignored the fallback actually shown (stills/posters are never delivered), so seed stills were treated as unknown and set to Fit | One lookup, `knownGeometry` (declared size, then measured file, then measured poster, then measured fallback) used by every surface |
| 2 | A Bento tile showed a small picture inside a large empty frame (Vikram's video) | The renderer swapped in the video's poster and dropped the video's declared 400 × 500, making it "unknown" and letterboxed | A video's poster keeps the video's geometry; a Bento tile always fills its own shape (focal-aware), except typographic artwork |
| 3 | Cinematic stills (2.0 to 2.34:1) were letterboxed in Posts | Post range capped at 1.91:1 | Post range is 3:4 to 2.39:1: stills show whole, no bands, no crop |
| 4 | Ishaan's 4:5 portrait was cropped to a square only to add variety | Seed set an explicit square framing | Removed; it shows at its natural 4:5 |
| 5 | Landscape film stills cropped into 4:5 portrait cards (about 36% of the frame kept) on credits and house cards | Fixed 0.8 ratio for credit and project cards | One shared rule, `cardRatio`: a set of cards is 16:9 when its shown sources are landscape, else 4:5; one shape per rail |
| 6 | Profile "Selected work" left an orphan tile and shrank landscape work into half-width squares | Fixed two-column grid | `workRows`: landscape work full width at its natural shape; consecutive portraits paired; order kept; nothing cropped |
| 7 | The house's events all showed the same Neela still | Event art fell back to the house's lead project for every event | Events with no image of their own show their date tile (New version) |
| 8 | A mixed carousel (4:5 cover, two wide stills) left the stills in a tall frame about 60% empty | The first slide always set the frame | Square frame for mixed orientations; least-band frame otherwise |
| 9 | Blocked house's event still on the Legacy Home | Pinned example skipped the block check | Fixed earlier this session (`83b8b6e`) |

Also noted, not changed (outside this scope or needs a decision):

- `images/posts/vikram-video-poster.jpg` is a derived image (a frame extracted from an existing video) added in `66c90ea`. It is left in place because the video post depends on it.
- Two demo posts (`p-sameer-portrait`, `p-ishaan-square`) use headshots as "work". They were kept because post content is not to be changed, but headshots as work posts weaken credibility; real work images would be better when they exist.
- The house "Edit page" button shows a toast only (house details are set up with Art and Artist). It looks like a primary action that does nothing.

## 3. Supported aspect ratios (final rules)

Instagram's feed (third-party guides, October 2026) accepts 3:4 to 1.91:1, defaults to 4:5, and moved the profile grid preview to 3:4 in 2025. Art and Artist follows that, with one deliberate difference for film.

| Ratio | Where | Rule |
| --- | --- | --- |
| 3:4 (0.75) | Posts | Tallest image shown at its natural shape; taller is bounded and Fit |
| 4:5 (0.8) | Posts, portrait cards | The default portrait |
| 1:1 | Posts | Supported when the source is square; never manufactured |
| 16:9 (1.78) | Landscape cards (credits, house projects) | The card shape for landscape stills |
| 1.91:1 | Posts | Explicit creator choice "Landscape" |
| 2.39:1 | Posts, Selected work | **Widest shown whole.** Cinemascope frames keep their composition: filmmakers must not lose the sides of a frame. This is wider than Instagram on purpose |
| 9:16 | Video posts | Genuine vertical video only (none in the library yet) |

- **Original files are never changed.** Framing is per-destination metadata (`Media.presentations`), applied with CSS.
- **Maximum height:** images stop at 3:4 (1.33 × width); a lone portrait in Selected work stops at 4:5.
- **Post media vs thumbnails:** posts show the source's natural shape; Bento tiles, cards and avatars have their own shapes and crop with focal points. A tile's shape never changes the post.
- **Carousels:** one frame for the whole carousel, so it never jumps. If the slides mix portrait and landscape, the frame is square (the 4:5 cover nearly full width, wide stills with modest bands). If they share an orientation, the frame is the slide shape that leaves the least empty band, weighting the cover. Slides Fit inside unless the creator chose Fill; an explicit creator frame always wins. (Before: the first slide decided, so a 4:5 cover left wide stills about 60% empty.)
- Code: `src/domain/mediaLayout.ts` (`knownGeometry`, `mediaRatio`), `src/domain/mediaPresentation.ts` (presets, `cardRatio`, `displayedSource`), `src/domain/workRows.ts`, `src/domain/bentoLayout.ts`.

## 4. How visual variety improved using existing media

- Landscape stills now look landscape everywhere (posts, Selected work, credits, house projects) instead of being squeezed into portrait cards or letterboxed. Next to the 4:5 people images, that gives a real portrait/landscape rhythm.
- Bento keeps its approved deterministic patterns; the one broken tile now fills.
- Selected work alternates full-width landscape rows with portrait pairs when a person has both.
- Limitation: with only two shapes in the library (wide stills and 4:5 portraits), there is no square or 9:16 in the content. That can only come from real uploads.

## 5. Individual profile

Findings:

1. The first screen was only a full-screen headshot, with no sign of work below.
2. Self-declared independent projects sat above production-confirmed credits.
3. Availability, the hirer's first question, was near the bottom.
4. "Featured work" and "Links" were two adjacent link sections before credits.
5. Landscape work was cropped to portrait cards and squares.
6. Tara's hero framed her hair and ear, not her face.

Implemented (New version only):

1. The hero leaves the top of the work sheet visible above the tab bar.
2. Order is now: Showreel, Selected work, Verified credits, Independent projects, Posts, About, Skills and details, then Featured work and Links together, Work preferences, Reviews.
3. An "Open to work from …" pill sits under the name when the person is available.
4. Selected work uses `workRows`; credit cards follow `cardRatio`.
5. Tara's hero has a stored focal point on her face (framing metadata only; her photo has her face at the edge, so this is as good as the source allows).

Credit rules are unchanged: only productions issue credits, and the person accepts or disputes.

## 6. Production-house profile

Findings:

- "Now making" and "Made by us" cropped landscape stills into 4:5 portrait cards.
- Every event showed the same project image.

Implemented (New version only):

- Landscape 16:9 cards for current projects (with stage label and open roles) and for released films (with score).
- Events without their own image show their date.

Identity switching, permissions, verification and credit issuance are unchanged.

## 7. Verification

Unit tests (including new tests for geometry, Bento fill, video posters, card shape and work rows), typecheck, production build, browser captures at 393 × 852 in light and dark (Discover, post stream, own and visitor individual profiles, house admin and visitor views, and a new-user launch), and the regression suite. These are browser-emulated phone viewports, not a physical phone.
