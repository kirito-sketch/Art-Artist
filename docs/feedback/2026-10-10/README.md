# Stakeholder feedback, 10 October 2026

Collected by Arun after the client review. Recorded as said, with our reading of each point. **Nothing here is decided or built yet**; the next step is to agree what to change.

## Feedback

### Home

| # | They said | Our reading |
|---|---|---|
| 1 | Remove the spotlight (This week) pause and play buttons | Remove the button under the This week carousel. It exists for WCAG 2.2.2 (moving content must be stoppable), so the carousel should then stop auto-advancing and move only when swiped |
| 2 | Film Talk shows one film and a small suggestion. If the signed-in person has reviewed the film, hide the suggestion; if not, show it | Add the rule. The "Seen it? Rate and review" prompt only appears for films the person hasn't reviewed |
| 3 | Only one film is shown now; think about how it works with several films and how suggestions behave then | Open design question: with several films the single prompt doesn't fit. Options to compare (a prompt per unreviewed film, or one prompt for the most likely film) |
| 4 | New work (the bento grid) isn't working; find another way to show it | Replace the 3-post mosaic with a different representation; needs options |
| 5 | "You're up to date" at the end of Home isn't needed; maybe something else | Replace the end of Home with something useful, or nothing |
| 6 | Sections look plain; treat each section differently, like District does | Give Home rhythm: sections differ in surface, layout, header and scale (District by Zomato as the model) |

### Everywhere

| # | They said | Our reading |
|---|---|---|
| 7 | Headings, text and typography feel too big; see what sizes other apps use and correct it | Benchmark type scales from reference apps and reduce ours (today: 34 px titles, 62 sizes in use; `docs/premium/VISUAL_MATERIALS.md`) |
| 8 | The white of the cards, on Home and elsewhere, isn't sitting right | Rethink the card surface (colour, edge, shadow, or no card) against the page ground |
| 9 | The teal-green brand colour isn't working; find another | New brand and action colour. System-wide: buttons, Follow, Save, tab bar, + button, links. Needs options shown on real screens |

### Discover

| # | They said | Our reading |
|---|---|---|
| 10 | Consider Airbnb's embossed, 3D tabs for Discover | Try tactile, 3D-rendered icons for Discover's category tabs (Posts, People, Opportunities, Projects, Events, Reviews) |

### Profiles

| # | They said | Our reading |
|---|---|---|
| 11 | Own profile: as you scroll, it becomes text-heavy and doesn't look good | Lower sections need visual structure and imagery, not runs of text |
| 12 | Other people's profiles look extremely empty. They should show what your own profile shows; the only difference is Edit on yours and Follow on theirs | Parity of public content between own and others' profiles. Private-by-design items (pending credits, Projects you're on, private tools) stay owner-only |

### Sharing (from the WhatsApp reference)

| # | They said | Our reading |
|---|---|---|
| 13 | Work and profile sharing have no in-app sharing to connections (they go straight to the phone's share sheet). This week has in-app sharing but not outside sharing | Make every Share the same: send to people on Ana **and** share outside (phone share sheet, copy link). Confirmed in code: posts and profiles call the phone share sheet directly; items without a link (This week, events, roles, projects, houses) show recent people but "Share outside" only shows a placeholder message; sending to a person doesn't create a message |

## References

| File | What it is | What we take from it |
|---|---|---|
| `ref-share-whatsapp.webp` | Sai Charan's WhatsApp message with a screen recording: sharing a post opens only the iOS share sheet | Point 13 above |
| `ref-flow-home.png` | Home screen of Flow (Wispr Flow) | Typography: a serif display heading at a modest size with a small sans line under it; body and labels small and quiet. Surfaces: a soft lilac-grey ground, white cards with large radii and a very soft shadow, so cards float gently instead of sitting as hard white blocks. Tactility: the app icons sit in **embossed, raised discs** (the soft 3D feel they mean in point 10). Tab bar: floating pill, selected tab in a tonal capsule, quiet icons |
| `ref-wabi-onboarding-frames.jpg` (from a Mobbin screen recording) | Wabi's welcome and sign-in | The welcome builds itself: starts on "Meet Wabi." with a single + button; glossy circular images bubble up out of the +, the headline completes line by line, then the Google and Apple buttons fade in. A second screen ("A new era of software is here") has a glowing orb and "Swipe up to enter". A strong model for Ana's welcome (crafts and work flowing out of the + that later becomes Create), and for the premium entrance |

## Second round (Arun, with three screen recordings)

**Arun's notes:** in District, the cards and the background are the same colour; ours puts plain white cards on a warm grey-beige ground (`--base #f6f4f0`), which creates dissonance. Our typography is wrong in heading size, font, letter spacing, hierarchy, and the space between heading and body. District's Home has a section on a soft grey gradient with a big 3D object, which creates visual interest and breaks the monotony. Our first-run screens are images with a Next button; the reference has real motion graphics.

| File | What it is | What we take from it |
|---|---|---|
| `ref-district-home.jpg` | District (Zomato) Home, scrolled top to bottom | **One surface:** white page, white cards; cards are defined by a hairline edge and very light shadow, not by a different colour. The only tints are deliberate: a lavender wash behind the header, pastel category tiles, purple offer strips. **Type:** section titles about 17 px, semibold (not heavy), normal letter spacing; card titles about 14 px medium; meta about 12 px grey; about 12 px from a section title to its content, about 32 px between sections. **Every section is a different format:** pastel category tiles with 3D icons; big spotlight posters; a small-card rail ("Continue where you left off"); editorial cards with serif italic display type on pastel panels ("Leaving your toxic job"); photo cards with rating chips and offer strips; a full-bleed banner on a grey gradient with a big 3D object ("Book your salon visit"); grey-gradient tiles with large 3D sport objects ("Go out and play"); dark movie posters with "17.4k+ are hyped!" |
| `ref-netflix-rails.jpg`, `ref-netflix-tabbar-reflections.jpg` (from 60fps.design) | Netflix Home | **The main point (Arun): as the top rail glides, its colours reflect in the bottom navigation.** Frame by frame, the glass tab bar's rim picks up each poster's colour as it passes (purple, teal, red, orange), although the rail is well above the bar. The glass reads as lit by the content, not just blurring what is directly behind it. Also: dark, poster-first. The recording shows the top poster rail being swiped back and forth: fluid momentum, settling exactly on a poster, while the rail below stays put. Small section titles (about 16 px semibold), posters carry their own title art and badges ("Emmy Nominee"), glass tab bar with the profile avatar as the last tab |
| `ref-atlys-onboarding.jpg` (from 60fps.design) | Atlys first-run intro | A continuous motion sequence on one screen, not slides with Next: soft grey ripple rings behind a centred mark; short lines replace each other ("now, it's so much more" → "a new era of travel is here"); a gradient ring loads round the mark; a light flash reveals the logo; "meet your personal AI travel agent"; "Search anything" while photo cards fly in at angles in 3D; one pastel-gradient Continue button throughout. Calm grey ground, tiny lower-case type, all the richness in motion |

## Typography rule: no all-caps tracked labels (Arun)

The small labels set in capitals with wide letter spacing above titles, such as "TIDEWATER FILMS · FOR 2 DAYS" in green on the This week card (`ref-no-caps-labels.webp`), are not to appear anywhere in the app. They read as a generic, machine-made pattern, not as Ana.

- Labels are sentence case, normal letter spacing, set by size, weight and colour alone (for example "Tidewater Films · for 2 days" in a smaller, quieter style above the title).
- Applies to every surface: cards, kickers, frame labels on photos, section labels, badges, the moderation console and /test included.
- Today there are 28 `text-transform: uppercase` rules across 9 stylesheets, nearly all with added letter spacing. All of them go when typography is reworked.
- Exceptions only where capitals are the content itself (a film's own title art, an abbreviation like "AC" or "DoP").

## Not yet asked

- What the Flow and Wabi references are meant for exactly (our reading above is an assumption).
- Any brand-colour direction they already like.

## Third round (Arun's answers and the client's palettes)

- **Ground colour:** not pure white; like Atlys. Measured from the recording: a cool, very light grey (about `#F2F2F3`, a hint of lilac at the top) that deepens towards the bottom of the screen.
- **This week:** auto-advance is fine (District has no pause button); only the button goes.
- **Pick up where you left off:** not convinced; dropped from the proposal.
- **Film Talk and New work:** both need a real presentation, including what happens with several films, and New work needs a clear purpose.
- **Buttons:** in the references buttons aren't one flat brand colour (Atlys: pastel gradient; Airbnb: pink to magenta gradient; Wabi: black and white). Explore that route.
- **Client palettes** (`ref-client-palettes.png`, a suggestion to consider, not a decision): a cool slate scale `#06141B #11212D #253745 #4A5C6A #9BA8AB #CCD0CF`, and a warm earth scale `#2A0800 #775144 #C09891 #BEA8A7 #F4DBD8`.
- **Profile monotony:** use District and Airbnb as references. Airbnb's listing detail (`ref-airbnb-listing-1.jpg`, `-2.jpg`) stays rich all the way down: a centred rating moment with laurels, a raised host card with a stats column, facts as icon rows, long text cut at four lines with "Show more", review cards in a sideways rail, thin dividers, and a sticky bar with the price and a gradient Reserve button.

## Fourth round: answers and the chosen colours

- **Film Talk quote:** from anyone. People you follow come first when they have reviewed the film.
- **Accent and gradient:** Arun asked us to choose. Chosen (to be confirmed once seen on real screens):

| Role | Value | Contrast |
|---|---|---|
| Ground | `#F2F2F4` cool light grey (Atlys-like), deepening to `#DEDDE0` in gradient sections | |
| Cards | `#F8F8F9` with a hairline edge and soft shadow | |
| Text and primary buttons | `#06141B` ink (client palette 1) | 16.7:1 on the ground |
| Secondary text | `#4A5C6A` (client palette 1) | 6.2:1 |
| Accent, as text and icons (links, selected tab, small marks) | `#9A5800` deep amber | 5.0:1 on the ground |
| Accent, as a fill (strips like "Closes in 2 days", badges, the + button) | `#F0B24A` amber with ink text | 9.9:1 |
| Signature gradient (Continue, Show interest, Accept credit, Publish) | `#F4DBD8` blush to `#F6E7CF` warm cream, ink text | 14 to 15:1 |
| Dark mode grounds | `#06141B`, `#11212D`, `#253745` (client palette 1); amber fill stays `#F0B24A` | 8.7:1 on `#11212D` |
| Errors | `#D83A2E` red, kept apart from amber | |

Why amber: cool slate shadows with warm amber highlights is the classic "teal and orange" film grade, so the palette itself says cinema. It sits far from the error red, reads as golden-hour light, and the blush-to-cream gradient comes from the client's warm palette.

## Client liked: Airbnb Explore (for Discover)

`ref-airbnb-explore-tabs.webp`, with the category tabs highlighted. What it is: a large white pill search bar; category tabs as raised pills, each with a small 3D icon (All, Homes, Experiences, Services), the selected one pressed in (inset, slightly darker); below, sections with a title, a grey subtitle and a round arrow button instead of "See all", each a rail of large rounded image cards with a small badge pill ("Original"), a save heart, a two-line title, place and one detail line.

Proposed for Discover: the same structure. Search pill on top; raised 3D-icon tabs for All, Posts, People, Opportunities, Projects, Events, Reviews (adds **All**, a new curated overview, as the default instead of Posts); under All, titled rails per type with a subtitle and arrow ("Verified productions hiring · Roles from houses Ana has checked", "Crew in Hyderabad", "Releasing this month"); choosing a tab shows that type's full results as today. Cards follow the Airbnb card: rounded image, a badge pill ("Verified", "Open role", "Premiere"), save, two-line title, place, one detail.

## Discover posts by type, and the credit celebration post (Arun)

**Problem.** The Discover grid is a bento: fixed-shape slots, media cropped to fit, post text never shown, and text-only posts squeezed into a square "note". It only suits image-only posts. People can post image only, image with text, video only, video with text, and text only.

**Proposal: a two-column masonry instead of the bento.** Every tile keeps its media's own shape (within limits), so nothing is cropped into a slot, and each post type has a tile made for it:

| Post | Tile |
|---|---|
| Image only | The image at its own shape (between 4:5 tall and 1.91:1 wide), the author's face and name small in the corner |
| Image with text | The image, then the first two lines of the text below it on the card |
| Video only | The cover frame with a duration chip; the tile nearest the middle of the screen plays muted, one at a time |
| Video with text | As video, with two lines of text below |
| Text only | A typographic tile: the words set in the editorial serif on a soft tinted panel (blush, slate or amber tint), up to about six lines, then "…" |
| Several images | The first image with a small stack mark |
| Credit celebration | A full-width cinematic tile across both columns (below) |

Ordering stays in feed order, each tile going to the shorter column; two text tiles never sit side by side; a full-width moment breaks the grid every so often.

**Credit celebration post.** When someone accepts a credit, Ana creates a celebratory post, like LinkedIn's new-job posts.

- **When:** the credit is accepted and the project is public. For a private project it waits and appears when the house shares the project. Never for a private "added to a project" association.
- **Consent:** the accept step shows a preview with "Share with your network", on by default; the person can add a line and can hide or delete the post later. Deleting the post never touches the credit.
- **Look:** the one dark, cinematic card in a light feed. The project's key art full-bleed (or its trailer, muted), a dark gradient; the person's portrait in a circle with the verified seal; a serif headline ("Kiran Varma is credited as Director of Photography on Kaaval"); the house logo with its verified mark; stage or release date; faces of other people you know on the same film.
- **Motion:** on first view the seal stamps in (the existing credit-accepted moment) and a slow light sweep crosses the poster. No confetti.
- **Response:** a single "Congratulate" reaction with a count, plus Message.
- **Grouping:** several people credited on the same film in a week become one card ("6 crew credited on Kaaval this week") with their faces.
- **Where:** a full-width tile in Discover, and the lead item in Home's From your network.
