# Ana visual direction: Editorial Workbench

**Status:** Proposed. Proven on four screens in the coded prototype. Awaiting review.
**Framework:** `docs/VISUAL_COMPOSITION_SYSTEM.md` (the structural rules this direction fills in).
**Scope:** Individual Home (Large Cards), Production House Home (Slate), Individual Profile, Role Detail. Nothing else was restyled.
**Unchanged:** product architecture, flows, bridge model, rules and copy. Figma migration paused.

---

## 1. Audit of the current visual language

**What works and stays:**
- The calm neutral base.
- Strong SF typography.
- The overlapped sheet on photo heroes (Profile, Role).
- The cinematic role cards on Home.
- One icon family.
- The floating tab bar with the red Create button.
- The disciplined use of colour for state.

The foundation is sound. The problem is monotony, not ugliness.

**Where it falls short**

| Problem | Where you see it |
|---|---|
| **Generic.** Remove the logo and Ana could be any iOS product. Nothing belongs to film or to making work. | Every screen |
| **Repetitive.** Each section is a heading, then a list or card, then a heading. Section after section has the same weight and rhythm. | Home, House Home, Profile |
| **White on white.** Page, sheet, card, footer and header are all `#fff`, so hierarchy relies entirely on type weight. | Everywhere; most visible on Home and Slate below the fold |
| **Rounded-box reflex.** Grey rounded containers are used whether or not grouping helps (availability row, pending credit tint, lock circles, empty poster boxes). | Profile, Slate |
| **Imagery shrinks after the fold.** Only the first card is image-led; after that, images become 44 to 72 px thumbnails. | Home network/posts, Slate rows, Search |
| **Weak depth model.** One shadow value is used for everything, and there is no deliberate surface level. Floating chrome and content cards feel the same. | Home cards vs. tab bar |
| **Colour used as alarm.** Red appears as whole sentences of text ("Sameer Ali asked to correct…") and as a pink-tinted credit card, so trust events read as errors. | Slate "Around your work", Profile "Waiting for you" |
| **Social or LinkedIn cues.** A centred name, a follower-style stats row and a centred "Edit profile" read as Instagram. The credit list reads as a résumé. | Profile |
| **Administrative House side.** A small project card, a text list of notifications, a grey locked placeholder poster and plain people rows make it a production-management dashboard with one photo on top. | House Home |
| **Status as generic pills.** The white rounded "Closes in 4 days" pill is the same component as every chip; nothing identifies it as production metadata. | Home, Role |
| **Facts as a settings list.** Location, dates and language use the same icon rows as Settings, so Role Detail mid-screen looks like a form. | Role Detail |
| **No creative objects.** Crafts appear only as line icons (Discover tiles) or text. There is no brand moment beyond the logo. | Home, Discover |
| **Empty and success states are generic.** Empty states are centred grey text; success is a black toast. Ana's character never shows. | Across the app (not redesigned in this pass) |

---

## 2. Territories considered

| | A. Cinematic Editorial | B. Studio Portfolio | C. Production Workbench |
|---|---|---|---|
| Idea | Dark, film-journal pages, huge type on stills | Gallery white, captions, a serif, catalogue calm | The artefacts of making: slates, call sheets, contact sheets, the tools themselves |
| Distinctive | High, but close to streaming apps | Medium: many portfolio sites look like this | High and specific to Ana's audience |
| Cohesion / scale | Hard: trust and settings screens fight a dark world | Easy | Good, if kept as a grammar, not decoration |
| Relation to making | Watching films, not making them | Showing finished work | Making work: the closest fit |
| Fine Arts later | Weak | Strong | Strong (studio, materials, tools) |
| Houses | Good for hero moments, bad for density | Turns the House into a catalogue | Natural: a slate is literally a House tool |
| Trust screens | Poor | Good | Good: call sheets and records are trust objects |
| Motion | Parallax, cinematic cuts | Very little | Tactile: objects, labels, sheets, playheads |
| Gimmick risk | Medium (red-carpet drift) | Low | Medium if literal (fake tape, clapboards) |
| Dates quickly | Yes (dark-mode fashion) | Slowly | Slowly, if abstracted |

**Recommendation: C, disciplined by B and lit by A.** In practice that means:
- **From C:** the production workbench provides the grammar: frame labels, title cards, the call sheet, the record family and the tools as objects.
- **From B:** the studio calm provides the ground: warm paper, generous space, unboxed rows.
- **From A:** the cinematic confidence is kept for imagery only: full-bleed heroes and large cards.

Each territory alone fails a need:
- A alone makes the House side and trust screens heavy.
- B alone is quiet but anonymous.
- C alone risks costume.

Together they give a recognisable system that scales down to Settings without decoration.

---

## 3. Visual thesis

> **Ana looks like work in progress, set with editorial calm.** Real stills lead. Production artefacts supply the grammar: the frame label, the title card, the call sheet, the record. The tools of each craft appear as tactile objects. Everything sits on a warm paper ground, with depth only where it carries hierarchy.

This refines "Minimal structure + cinematic/editorial expression + tactile creative objects". It keeps all three, and it names *where* each one lives so that it scales past one Home screen:
- **Structure:** paper ground, spacing, type.
- **Expression:** imagery and objects.
- **Tactility:** depth levels and objects.

---

## 4. What changed on the four screens

The before and after sequences are in the review page and in the scratch captures (`vis/ba-*.png`). Composition mapping per screen:

### Individual Home (High identity)

| Section | Family | Surface |
|---|---|---|
| Roles for you | Cinematic Card (frame label replaces pill) | Level 2 |
| People worth knowing (new placement of existing suggestions) | Portrait Card: work still behind, face breaking the edge | Level 2 |
| From your network | Editorial Row, unboxed, hairlines | Level 1 |
| Explore your craft | Object Tile on the sand band; objects break the tile top | Expressive band |
| Projects to watch | Poster / Stills rail; lead poster larger (4:5 vs 2:3) | Level 1 with image shadow |
| Production houses | Wide editorial card: 16:9 current work, house avatar overlapping | Level 1 |
| Latest posts | Unchanged editorial posts | Level 1 |

- **Rhythm:** peak, human, quiet, brand moment, media, editorial, quiet.
- **Removed:** the pill component on cards and the white page under everything.
- **Colour:** stills, the objects and the sand band. Nothing else.

### Production House Home: Slate (High identity)

| Section | Family | Surface |
|---|---|---|
| Lead project | Cinematic slate: 470 px artwork, frame labels (stage, Not announced), display title, **working strip** on the image (faces of interested people, open roles, items to review) | Level 2 |
| Around your work | Editorial Row. Attention is a small red mark, not red sentences | Level 1 |
| Open roles (existing data, now shown) | Compact role cards: project still, role, faces of interested people | Level 2 |
| Our slate | Poster rail; an unannounced project is a **dark title card** (title plus "Private"), never a grey lock box | Level 1 |
| For roles you haven't opened | Portrait Card, the same family as the Individual Home | Level 2 |

- **Kept:** the Slate information architecture and the identity switcher.
- **Removed:** chip counters, red text and the grey placeholder poster.
- **Why it's no longer a dashboard:** the work is still the centre, and every operational signal sits on the work or on a face.

### Individual Profile (Medium identity)

- **Order:** Person, Craft, Work, Credibility.
- **Person:**
  - Taller portrait hero.
  - A left-aligned name at display size under a small-caps **craft label** ("CINEMATOGRAPHY").
  - The role, and "verified credits" marked with the verification tick.
  - Availability as an unboxed hairline row.
- **Owner only:** a "Waiting for you" record comes next.
- **Craft:** the showreel as a Cinematic Card, then the portfolio as a **stills mosaic** (mixed spans, one contact-sheet block) instead of a uniform 3×3 grid.
- **Work:** credits as posters with a record footer, then independent projects as editorial rows.
- **Credibility:** "Projects you're on" as record rows (square record mark, not a grey circle), then About.
- **Removed:**
  - the centred Instagram header;
  - the pink tint on pending credits, which is now a white record with a hairline;
  - the grey availability box.

### Role Detail (Medium identity)

- **Hero:** 500 px, confident crop, a frame label on the image ("CREW JOB", with "CLOSES IN 4 DAYS" when urgent).
- **Sheet:** a paper sheet overlaps the hero by 40 px and carries the image's tint.
- **Title:** display title, and a byline with the house mark.
- **Relationship signal:** "You worked with Tidewater before" becomes a sand strip, colour through meaning.
- **Facts:** a **call sheet**, a two-column grid of Location, Dates, Language and Pay under small-caps labels and hairlines, replacing the icon list.
- **Action bar:** floats (Level 3, blurred), keeps pay, close date and **Show interest**, with a soft fade underneath so content never crowds it.
- **Unchanged:** About, Questions and the trust line.

---

## 5. Craft objects

**Status after the hardening pass:** the objects in the prototype are **placeholders**. Their concept (a craft shown by its tool) and placement (on the Home sand band, breaking the tile top) are approved. The final artwork is a **Craft Object Asset** family supplied externally; it is not drawn or refined in code.

- **Object Tile** (UI component, owned by the design system) and **Craft Object Asset** (artwork, supplied separately) are different things. The tile holds the asset in a fixed square slot, so the supplied transparent WebP/PNG drops in without layout change. See VISUAL_COMPOSITION_SYSTEM.md 5.5 for the tile and asset specs.
- **Motion (V1):** assets are single raster objects, animated as a whole with small tilt, lift, scale and a contact shadow that answers the lift. No separated vector layers are required. Layered, Rive or true 3D assets are reserved for specific future signature interactions where they demonstrably add value.

**The family spec (applies to every future object):**
- **Perspective:** three-quarter, seen slightly from above.
- **Key light:** top-left. Highlights sit on upper-left edges; lower-right faces fall into shade.
- **Shadow:** none in the file. The tile draws one soft contact shadow, the same for every object.
- **Materials:** graphite (anodised), aluminium (brushed), glass, and three warm neutrals (amber `#c99a4e`, clay `#b8735a`, sage `#6f8b83`). The Ana red appears only as one tiny indicator (tally light, playhead, index dot).
- **Detail:** readable at 64 px, never photographic, no outlines.

**The first four (placeholders now, supplied later):**
- **Cinematography:** cine prime with a focus ring and a red index dot.
- **Editing:** a timeline slab with three tracks and a red playhead.
- **Sound:** a capsule microphone with a waveform behind it.
- **Production design:** a fan of fabric, timber and paint-chip samples on a brass pivot.

Objects are content, never UI icons, and never appear on trust, legal or destructive surfaces.

---

## 6. Colour, background and depth

**Surfaces:**
- **Level 0 base:** warm paper `--base #f6f4f0`.
- **Level 1 content:** unboxed on the paper.
- **Level 2 raised:** white `--raised`, with one warm shadow (`--shadow-2`).
- **Level 3 floating:** blurred, with `--shadow-3`.

**Bands:**
- **Quiet tint** `--tint #efebe4` is available for rhythm.
- **Expressive sand** `--sand #e8dfcf` is used only for the craft band and relationship highlights.
- **Dark** `--dark #151413` is used only for title cards (and, later, media viewers).

**Colour:**
- Stays neutral.
- Hue comes from stills, the objects and meaning: available (green), verified (blue), attention (a small red mark or red frame-label text), and Ana red on Create and inside objects.
- No colour per craft, no gradients beyond image scrims.

**Depth audit:**
- **Level 2:** cinematic cards, portrait cards, compact roles, the lead project and the showreel.
- **Flat:** editorial rows, the call sheet and records (a hairline, no shadow).
- **Level 3:** only the tab bar, the role action bar, float buttons and sheets.

---

## 7. Typography

The SF family is sufficient, and no font was added.

Two additions give it editorial personality:
- **A display size (40 px, weight 800, tracking −0.045em)** for the one title per screen that names the work or person: the project on Slate, the name on Profile, the role on Role Detail.
- **A small-caps label (11.5 px, 700, +0.09em)** used for every piece of production metadata: frame labels, the craft label, and call-sheet field names.

Metadata got quieter; section titles stay at 22 px.

A serif could add warmth later (Fine Arts), but it is not needed for this direction. Flagged, not introduced.

---

## 8. Cohesion audit (four screens side by side)

What all four share:
- **Type:** the same scale (display, section 22, item 17, meta 15, label 11.5).
- **Layout:** the same 20 px gutter and radius family (14, 20, 28).
- **Surfaces:** the same paper ground, and the same frame label on every image.
- **Depth:** the same two shadows.
- **Controls:** the same black primary and outline secondary buttons, the same tab bar, the same verified tick.

Individual and House share Portrait Cards, the poster rail, frame labels, faces and the cinematic lead. The House is denser (working strip, open roles), not a different product.

Simplified during the audit:
- Stage labels shrink on small posters rather than wrapping.
- House activity rows dropped to regular weight so they don't shout.
- The status bar now takes the paper on canvas screens.
- The call sheet never leaves an orphan cell.

**Would someone believe these are four screens from one app?** Yes. See the cohesion board on the review page.

---

## 9. What makes Ana recognisable in five seconds

A combination, not a mascot:
1. **Warm paper ground** with work images that are allowed to be big.
2. **Small-caps frame labels** on images, like a label on a film can.
3. **Display-weight names of work and people**, left-aligned, set tight.
4. **Tactile craft objects** in one consistent light, used sparingly.
5. **Dark title cards** for unannounced work, with a thin red rule.
6. **The call sheet and the record**: hairline grids and quiet records where trust matters.
7. **Faces sitting on the work**: portraits breaking card edges and interest stacked on the slate.

---

## 10. Implementation notes

- **Code:**
  - `src/styles/expression.css` holds the tokens and families, scoped with `.canvas` and the `v-*` screen classes.
  - `src/ui/compose.tsx` holds FrameLabel, PortraitCard, PosterTile, TitleCard, ObjectTile, HouseFeature, CallSheet and Faces.
  - `src/ui/craft.tsx` holds the placeholder drawings and the `CRAFT_OBJECTS` list, where supplied assets are registered.
  - `?specimen` is the design-system test page: typography stress test, Telugu fixture, the Object Tile slot, surfaces and the red states.
- **One direction only:** no console switch was added. Archived Home and Slate variants are unchanged references.
- **Content gap:** person portrait photography still does not exist in the prototype (every person falls back to initials). The hardening pass could not generate fixtures (no image-generation credit was available), so crop and scale were proven with neutral crop targets on the specimen page. Supplying `public/images/people/{id}.jpg` per docs/IMAGE_PROMPTS.md makes portraits appear with no code change.

### Components and tokens to update when Figma resumes

- **New variables:**
  - `base`, `raised`, `tint`, `sand`, `dark`, `hairline`
  - `shadow-2`, `shadow-3` (effect styles)
  - `t-display`, `label` (text styles: Display/Work 40, Label/Caps 11.5)
- **New components:**
  - Frame Label (Plate, Paper, Urgent)
  - Portrait Card
  - Poster Tile (Standard, Lead)
  - Title Card (Locked on or off)
  - Object Tile (with a fixed asset slot; the Craft Object Assets are imported as images, not built as components)
  - House Feature
  - Call Sheet (and Cell)
  - Faces Stack
  - Role Compact
  - Slate Lead with Working Strip
  - Stills Mosaic
  - Record Row
- **Updated components:**
  - Cinematic Role Card (frame label instead of Pill)
  - Pending Credit (record surface)
  - Profile Header (left-aligned, craft label, display name)
  - Role Header (frame labels, byline mark, 40 px overlap)
  - Role Action Bar (floating Level 3)
  - Status Bar (paper tone)
- **Retired:** the Pill usage on media (Pill remains for non-media chips); the grey locked poster.

Product architecture is unchanged. This pass touched only presentation files and section order. The Figma migration remains paused on Page 03, after Flows B and C; it resumes at Flow D once this direction is approved.

---

## 11. Hardening pass (summary)

The rules are in VISUAL_COMPOSITION_SYSTEM.md 3.2, 3.3, 3.8, 3.9 and 5.5. What changed in code:

- **Object Tile:** fixed asset slot, tokens for size and overhang, separate contact shadow, motion hooks, responsive grid, two-line label, the whole tile as one named button.
- **Type:** the display title steps 40, 36, 32, 30 by length (Telugu one step down), with three lines at most; separators never start a line; rail titles take two lines.
- **Telugu:** Noto Sans Telugu fallback, automatic `lang="te"`, caps labels without transform or tracking, whole-akshara initials.
- **Colour:** Role sheet image tint removed; secondary text darkened on sand (3.8:1 to about 6:1); the Slate's pink "to review" text became white with a red dot; the correction line on Profile is no longer red.
- **Consistency:** local shadows replaced with shadow-2 or removed; radii 6, 12 and 26 moved into the family (xs, s, xl); spacing 22, 26, 30, 34 and 46 moved onto the scale.
- **Accessibility:** the plate label is darker (0.52 to 0.62, 4.3:1 to 5.9:1 on the brightest stills); the Role Detail's floating controls get a paper bar once the hero has scrolled away, so they never sit on text; portrait-card context wraps to two lines instead of cutting mid-word.

---

## 12. Stakeholder corrections (Phase 1)

Editorial Workbench stays the single direction. These changes strengthen its Ana-specific layer.

**Discover → Posts.** A tight three-column contact sheet of the work (4:5 tiles, 2 px gaps, no captions or counters). A set of frames and a clip carry a small mark; a text-only post is a note tile with the title-card rule. Tapping opens a vertical stream (`posts` route) at that post; the rest follow. Back returns to the same grid position and filter, because the Discover tab stays mounted underneath. Discover now sits on the paper canvas. Posts in Discover are everyone's public posts (followed people first, blocked excluded); Home's "Latest posts" stays limited to people you follow.

**CTA system.** See docs/CTA_SYSTEM.md: graphite primary, one raised secondary family, a tonal selected state, text tertiary, red only for destructive confirmations and as a mark.

**First-run Home.** A new person's Home opens on "Your world on Ana": their craft and city as a caps kicker, their craft object (or three real stills for crafts without one), one line built from onboarding (craft, city, languages, availability), and a call sheet of what Ana already has for them (roles, people, projects, houses). Then roles matched on craft (and city where true), people in their craft with the reason, one quiet next step, projects, and houses (their city first). No network, posts or activity appear until they exist. Sections carry `data-world` for the Phase 2 onboarding transition.

### Airbnb-pattern audit

| Pattern | Where | Decision | Ana interpretation |
|---|---|---|---|
| Large rounded image card with a white heart bubble | Home roles, posters | Adapt | Frame label for status; Save is a light utility circle whose glyph turns green when saved (cleanup pass) |
| White circular floating controls over a hero | Role, Profile, Project, House | Keep (restored in the cleanup pass) | One light utility circle on every hero; the Phase 1 slate plates were not approved |
| Category bar of pictogram tabs | Discover | Adapt | An editorial section index: words, left-aligned, ink rule under the active one |
| Search pill with a drop shadow | Discover | Adapt | Raised white field with a hairline, no shadow |
| White sheet overlapping the hero | Role, Profile | Keep (good platform UX) | Kicker set as a caps production line; facts as a call sheet |
| Wide "experience" image cards | Home production houses | Adapt | The house's current stage as a frame label on its still; the house signs the card |
| Horizontal card carousels | Home, Slate | Keep | Poster rail with a larger lead and title cards for unannounced work |
| Floating bottom navigation | Everywhere | Keep | Ana green Create +, active mark as a green dot |
| Generic category tiles | Home | Already Ana | Object Tiles holding craft objects |

---

## 13. Final cleanup pass (before lock)

- **Colour hierarchy:** warm paper and neutrals (environment), graphite (type, structure), **Ana green `#275C50`** as the single action and brand-interaction colour (`--action` and its states), real work as the colour of the screen, and red only for destructive confirmations and genuine errors. Black primary buttons and the red Create are gone. Details in docs/CTA_SYSTEM.md.
- **Utility controls:** the light floating circles are restored on every media hero (Profile, Role, Project, House); Save shows its state in a green filled glyph.
- **Filters:** a separate component. Discover → People craft tiles regain the earlier "tile that reads against the page, solid when selected" logic, in warm tones with a green selected fill.
- **Save, Follow and posts:** Save is for Posts, Roles and Projects; Follow for People and Production Houses; one private Saved screen one tap from your own Profile; every post has Like, Share, Save and More, no comments, and Report post in More. See docs/SAVE_MODEL.md.
- **Header:** status bar, Ana header and page are one paper surface on primary screens; the header scrolls away.
