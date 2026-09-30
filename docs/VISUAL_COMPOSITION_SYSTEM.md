# Ana Visual Composition System

**Status:** Working visual-direction document  
**Purpose:** Define how Ana creates visual variety without becoming fragmented.  
**Primary principle:** **Variation in composition, consistency in grammar.**  
**Current visual baseline:** Minimal, with the Editorial Workbench direction (proposed; see `docs/VISUAL_DIRECTION.md`)  
**Applies to:** Individual, Production House, shared Project/Role/Credit surfaces, onboarding, trust surfaces, and internal design work.  
**Does not replace:** Product architecture, interaction rules, component system, or motion specification.

---

## 1. Why this document exists

Ana has a strong product structure, but many current screens rely on the same visual pattern:

- white page
- heading
- rounded card
- image
- text
- CTA

That creates consistency, but too much repetition makes the product feel generic and visually flat.

The goal is **not** to make every section look different.

The goal is to create a small set of approved composition patterns that can vary by content type while still feeling unmistakably like the same Ana product.

Ana should feel:

- cinematic
- editorial
- tactile
- professional
- modern
- calm
- visually alive
- trustworthy

Ana should **not** feel:

- like a social media clone
- like a corporate HR dashboard
- like a collection of unrelated Dribbble screens
- over-decorated
- over-animated
- inconsistent between Individual and Production House experiences
- like every section is a white card with text

---

# 2. Core principle

## Variation in composition, consistency in grammar

The layout pattern may change.

The design language must not.

Ana can use:

- cinematic cards
- portrait cards
- poster rails
- editorial rows
- record cards
- object tiles

But these must still share the same:

- typography system
- spacing system
- page margins
- colour logic
- radius family
- icon language
- image-treatment philosophy
- surface/elevation logic
- CTA hierarchy
- interaction semantics
- motion personality

The user should experience different **rhythms**, not different **brands**.

---

## 2.1 Visual thesis (added after the four-screen proof)

> **Ana looks like work in progress, set with editorial calm.** Real stills lead. Production artefacts supply the grammar (the frame label, the title card, the call sheet, the record). The tools of each craft appear as tactile objects. Everything sits on a warm paper ground, and depth appears only where it carries hierarchy.

## 2.2 Ana signatures

These four elements are shared by every composition family. They are what makes different compositions read as one product.

| Signature | What it is | Rule |
|---|---|---|
| **Frame label** | Small-caps label (11.5 px, 700, +0.09em) on a smoked plate, used for status on media: stage, kind, closing, privacy | Every status written on an image is a Frame Label. There are no pills on media. Tones: Plate (default), Paper, Urgent (red text only). |
| **Title card** | A project without public artwork, shown as its title on the dark surface with a thin red rule | Never show an empty grey box or a lock-only placeholder for work. |
| **Call sheet** | A two-column grid of small-caps field names and values with hairlines | Used for the facts of a role or project. Never an icon list, which reads as a settings screen. |
| **Record** | A white surface with a hairline border and no shadow, holding credits, associations and amendments | Trust objects never get decorative depth, tint or objects. |

# 3. What must remain consistent everywhere

These are the cohesion rules.

## 3.1 Typography

No section or screen may invent its own typography scale.

All compositions must use the approved Ana text hierarchy.

At minimum:

- Display / Hero
- H1
- H2
- H3
- Title
- Body
- Body Small
- Label
- Caption / Metadata
- Button / Action

Differences between compositions should come from hierarchy and placement, not arbitrary type styling.

---

## 3.2 Spacing

All screens must use the same spacing rhythm.

Do not introduce one-off spacing because a composition “looks better” with an arbitrary value.

Use the approved spacing scale from the design system.

Page margins should remain consistent within the same breakpoint/device.

---

## 3.3 Radius family

Not every component needs the exact same radius.

However, all radii must belong to one approved family.

For example:

- Small
- Medium
- Large
- Card
- Pill
- Full

A cinematic card may use a larger radius than a compact record card, but both should still feel related.

---

## 3.4 Iconography

Use one icon language.

Do not mix:

- filled icons from one family
- thin line icons from another
- hand-drawn icons
- emoji
- 3D objects as functional icons

3D/illustrated objects are expressive content, not replacements for core interface icons.

---

## 3.5 Colour

Ana should remain primarily neutral and content-led.

Colour should come from:

- project imagery
- portraits
- craft-object families
- status accents
- a controlled Ana brand accent
- rare expressive backgrounds

Do not colour-code every screen or every profession.

All expressive colours must come from the approved palette.

---

## 3.6 Interaction semantics

The same action should behave the same way across the product.

Examples:

- Save always looks and behaves like Save.
- Follow always uses the same state model.
- Show Interest follows the same interaction semantics.
- Credits always use the same trust/record language.
- Destructive actions always follow the same confirmation logic.

Composition may vary. Meaning must not.

## 3.8 Added cohesion constraints

- **One display title per screen.** Display (40 px) names the one piece of work or person the screen is about. Section titles stay at 22 px.
- **At most one expressive band per screen.** Sand is for craft objects and relationship highlights. Everything else sits on the base.
- **Red is a mark, never a sentence.** Attention is a small dot or Urgent frame-label text. Whole lines of red text are not allowed.
- **Faces sit on the work.** People connected to a project (interested, on the project) appear as overlapping faces on or beside its image, not as a separate list, wherever space allows.

---

## 3.7 Motion personality

Motion may vary in intensity but not in character.

All Ana motion should feel:

- smooth
- tactile
- deliberate
- restrained
- physically plausible

Avoid:

- random bounce
- excessive elastic motion
- constant looping
- unrelated easing curves
- novelty motion in serious trust flows

A separate Motion & Microinteraction System will define timing and patterns.

---

# 4. Visual intensity levels

Not every Ana surface should be equally expressive.

## Level 1 — High identity

Use stronger visual composition, depth, colour and expressive media.

Best for:

- Splash
- Onboarding
- Individual Home
- Discover
- Production House Home
- Empty states
- Milestone moments
- Craft exploration

These are the places where Ana earns memorability.

---

## Level 2 — Medium identity

Use strong hierarchy and media, but keep function in control.

Best for:

- Individual Profile
- Production House Profile
- Project Detail
- Role Detail
- Search
- Portfolio
- Public project pages

These surfaces should feel designed and distinctive, but not theatrical.

---

## Level 3 — Quiet / functional

Keep visual expression restrained.

Best for:

- Edit Profile
- Settings
- Privacy
- Terms
- Report
- Block
- Credit correction forms
- Account deletion
- Admin / Moderation
- Destructive confirmations
- Error recovery

These screens should feel like Ana because of the shared grammar, not because of decorative expression.

---

# 5. Approved composition families

Ana should use a small set of reusable composition families.

These are not isolated component styles. They are layout/content patterns.

---

## 5.1 Cinematic Card

### Best for

- Roles
- Major projects
- Featured opportunities
- Important production activity

### Character

- image-led
- high visual impact
- minimal text
- strong hierarchy
- controlled overlay
- medium depth

### Structure

- large full-bleed image
- optional status chip
- title
- one or two lines of essential metadata
- optional save/share action
- minimal CTA clutter

### Can use

- gradient overlay
- floating status
- controlled depth
- subtle image parallax

### Avoid

- dense text
- long descriptions
- too many buttons
- white-card-with-thumbnail treatment

---

## 5.2 Editorial Row

### Best for

- network activity
- notifications
- lightweight updates
- recency-driven content
- informational streams

### Character

- mostly unboxed
- compact
- text-forward
- low depth
- strong rhythm through spacing/dividers

### Structure

- avatar / small image
- action text
- secondary metadata
- optional small thumbnail
- divider

### Avoid

- wrapping every row in a card
- unnecessary shadows
- large decorative containers

---

## 5.3 Portrait Card

### Best for

- people discovery
- suggested creatives
- collaborator recommendations
- “Worked with”

### Character

- face-led
- human
- lighter than project cards
- medium expression

### Structure

- portrait may overlap or break card boundary
- name
- craft
- one useful context line
- optional compact action

### Can use

- circular or offset portrait
- subtle background tint
- controlled overlap
- gentle depth

### Proven structure

The person's own credited work sits as a still across the top. Their portrait (64 px) breaks the still's lower edge. Below it: name, craft, one context line (availability with the green dot, or a credit), and one compact action.

The work still carries the image while portrait photography is missing. It must be real work connected to the person, never generic imagery.

### Avoid

- LinkedIn-style résumé density
- excessive stats
- multiple CTAs

---

## 5.4 Poster / Stills Rail

### Best for

- projects
- films
- portfolio work
- current productions
- visual work

### Character

- media-first
- horizontal rhythm
- varied aspect ratios where appropriate
- low UI chrome

### Structure

- portrait poster or still
- project title
- concise metadata
- optional status

### Avoid

- forcing every project into the same thumbnail ratio
- excessive cards around already-strong imagery

---

## 5.5 Object Tile

### Best for

- craft discovery
- onboarding
- category exploration
- empty states
- occasional branded moments

### Character

- expressive
- illustrated or 3D/pseudo-3D
- colour-led
- tactile
- high identity

### Examples

- Cinematography — cinema lens / matte box
- Direction — monitor / viewfinder
- Editing — timeline / playhead
- Sound — microphone / waveform
- Acting — annotated script pages
- Production Design — miniature set / material swatches
- Costume — fabric / wardrobe tag
- Lighting — Fresnel
- Colour — grading wheels
- Writing — bound screenplay

### Rendering decision

Objects are **pseudo-3D layered vector**, not flat illustration, rendered bitmaps or real-time 3D. They are sharp at every size, light, themable, and animatable by layer (shadow, body and back are separate groups, so motion can tilt, lift or parallax them without new art). Rendered 3D is reserved as a later production upgrade for hero moments, and must follow the same art spec.

### Art spec

- **Perspective:** three-quarter, seen slightly from above.
- **Key light:** top-left.
- **Shadow:** one soft contact shadow, below and slightly right.
- **Materials:** graphite, aluminium, glass, amber `#c99a4e`, clay `#b8735a`, sage `#6f8b83`.
- **Red:** Ana red appears only as one small indicator.
- **Detail:** readable at 64 px, with no outlines.

The first four objects are lens, timeline, microphone and material swatches.

On Home, the tiles sit together on one sand band. Colour comes from the objects, not from a background per craft.

### Rules

All objects must share:

- one lighting direction
- one material language
- one perspective logic
- one shadow system
- one level of detail
- one overall art direction

### Avoid

- emoji
- random illustration styles
- stock 3D objects from unrelated libraries
- using objects as functional UI icons

---

## 5.6 Record Card

### Best for

- verified credits
- project associations
- waiting credits
- correction/amendment states
- official professional records

### Character

- trustworthy
- structured
- quiet
- low decoration
- high clarity

### Structure

- project / production
- role / credit
- status
- one clear action if needed
- record/history context where relevant

### Can use

- subtle verification marker
- restrained status colour
- minimal elevation

### Avoid

- decorative 3D
- playful animation
- loud colour
- social-style engagement treatment

---

# 6. Surface and depth system

Ana should not treat every object as if it lives on the same plane.

Use four surface levels.

Tokens (proven on the four representative screens):

| Level | Token | Value |
|---|---|---|
| 0 Base | `--base` | warm paper `#f6f4f0` |
| 1 Content | none | unboxed on the base; hairlines `--hairline` |
| 2 Elevated | `--raised` + `--shadow-2` | white, one warm soft shadow |
| 3 Floating | `--shadow-3` + blur | tab bar, action bar, float buttons, sheets |

## Level 0 — Base

Main app background.

Use warm or neutral base surfaces.

Purpose:

- breathing room
- page foundation
- low visual noise

---

## Level 1 — Content

Normal content sections.

Examples:

- editorial rows
- text blocks
- simple list items
- normal form fields

Often no visible shadow is needed.

---

## Level 2 — Elevated

Use for content that needs separation or emphasis.

Examples:

- cinematic cards
- portrait cards
- important project modules
- information sheets overlapping media

Use controlled shadow/elevation.

---

## Level 3 — Floating

Use sparingly.

Examples:

- bottom navigation
- contextual action bar
- floating filter/search
- action menu
- sheets
- overlay controls

These should clearly sit above the content plane.

---

# 7. Background strategy

Avoid a single endless white canvas.

Approved page/section background behaviours:

## Base neutral

Primary app background.

## Raised white

Cards/sheets when separation is useful.

## Quiet tinted section

Very subtle grey/warm tint for rhythm between large Home sections.

## Expressive section

Controlled colour field for:

- craft exploration
- onboarding
- selected empty states
- occasional brand moments

## Dark cinematic surface

`--dark #151413`. Quiet tint is `--tint #efebe4`; the expressive section is `--sand #e8dfcf`.

Rare.

Use only when media genuinely benefits from a dark environment.

Examples:

- immersive media viewer
- selected project moments
- potentially production visuals

Do not introduce dark sections randomly.

---

# 8. Image language

Ana is a creative-industry product. Real creative work should do more visual work.

## 8.1 Projects

Use:

- strong artwork
- film stills
- posters
- behind-the-scenes imagery

Allow:

- full bleed
- larger crops
- poster ratios
- cinematic landscapes

Avoid:

- shrinking all imagery into tiny thumbnails
- unnecessary white containers around media

---

## 8.2 Roles

Role discovery should feel desirable and visual.

Use cinematic imagery where available.

If the parent project is private:

- use the approved generic/public-safe visual
- never leak private artwork or title

---

## 8.3 Profiles

Individual:

- strong portrait
- craft
- portfolio
- verified work

Production House:

- current work
- past work
- people
- open roles

Imagery should carry identity.

---

## 8.4 Controlled grid-breaking

Some expressive content may break strict card boundaries.

Approved examples:

- portrait overlapping card edge
- 3D craft object extending outside tile
- floating status chip over image
- stacked card preview
- overlapping avatars

Do not use asymmetry everywhere.

Use it where it creates identity or hierarchy.

---

# 9. Section rhythm

Adjacent sections should not automatically use the same composition.

This is especially important on Home and Discover.

## Example — Individual Home

### Roles for you
Cinematic Cards

### People worth knowing
Portrait Cards

### From your network
Editorial Rows

### Projects to watch
Poster / Stills Rail

### Explore your craft
Object Tiles

### Production Houses
Wide Editorial / Project-led cards

The page still uses the same typography, spacing and interaction rules.

Only the composition changes.

---

## Example — Production House Home

### Current production
Large Slate / Cinematic project treatment

### Around your work
Editorial activity

### Open roles
Compact Role cards: project still, role, faces of the people interested

### Projects
Poster / Project rail, with Title Cards for unannounced work

### People relevant to roles
Portrait Cards (the same family as the Individual Home)

The lead project carries a **working strip** on its image: faces of interested people, open roles, and items to review. Operational signals sit on the work.

Do not turn the page into a task dashboard.

---

# 10. Screen-specific composition rules

## 10.1 Individual Home

**Intensity:** High

Goals:

- opportunities should feel desirable
- people should feel human
- network activity should feel lightweight
- projects should feel visual
- craft discovery should carry brand identity

Avoid:

- every section becoming a rounded white card
- repeating identical rails
- excessive visual competition

---

## 10.2 Production House Home

**Intensity:** High

Goals:

- feel like a living production slate
- projects remain central
- activity and decisions sit around the work
- keep creative energy

Avoid:

- admin-dashboard appearance
- tables
- task-manager visual language
- excessive operational chrome

---

## 10.3 Individual Profile

**Intensity:** Medium

Proven order:
1. Person: portrait, craft label, display name, role, verified credits, availability.
2. The owner's pending records.
3. Craft: showreel, then a stills mosaic.
4. Work: credits (posters with a record footer), then independent projects.
5. Credibility: projects you're on, as records.
6. About.

The name is left-aligned; a centred header reads as social media.

Goals:

- person first
- craft second
- work third
- credibility/records clear
- portfolio visually strong

Avoid:

- Instagram clone
- LinkedIn résumé
- overly social metrics

---

## 10.4 Production House Profile

**Intensity:** Medium–High

Goals:

- studio identity
- Now making
- past work
- Worked with
- open roles
- About

Feel closer to a compact creative studio portfolio than a corporate company page.

---

## 10.5 Role Detail

**Intensity:** Medium

Recommended composition (proven):

- 500 px hero with a frame label on the image
- a paper sheet overlapping the hero by 40 px
- a relationship highlight on sand when there is one ("You worked with Tidewater before")
- facts as a call sheet
- the action bar floating at Level 3 over a soft fade
- strong media hero
- floating back/share/save
- information surface overlapping the hero
- clear title
- production house
- role metadata
- sticky interest/compensation action area

Avoid:

- plain white page with stacked text
- over-decoration
- too many containers

---

## 10.6 Project Detail

**Intensity:** Medium–High

Goals:

- artwork leads
- project identity strong
- accepted public credits structured
- open roles visible but secondary
- production attribution clear

---

## 10.7 Credits

**Intensity:** Low–Medium

Credits are records.

Trust and clarity dominate expression.

The meaningful expression belongs to state transitions, not decorative styling.

---

## 10.8 Settings / Trust / Legal / Admin

**Intensity:** Low

These surfaces stay quiet.

Use:

- strong spacing
- clear hierarchy
- simple rows
- restrained surfaces

No decorative objects unless part of a useful empty state.

---

# 11. Container rules

## Rule 1

**Never use a container unless the content benefits from being grouped.**

A card is not a default background.

## Rule 2

If content can work as:

- text
- image
- divider
- spacing

do not automatically add a rounded white card.

## Rule 3

Cards should have a reason:

- interaction
- grouping
- elevation
- media
- state
- hierarchy

## Rule 4

Do not stack card-inside-card unless the hierarchy genuinely requires it.

---

# 12. Colour rules

Use colour to support hierarchy and identity.

Good uses:

- craft objects
- project imagery
- active status
- selected filters
- occasional section background
- success/attention state

Avoid:

- random gradients
- rainbow craft categories
- colouring every card
- using colour instead of hierarchy
- inconsistent status colours

---

# 13. Cohesion between Individual and Production House experiences

The two personas must feel like one product.

They may differ in content density and emphasis, but not visual grammar.

Shared objects must look related on both sides.

Examples:

- A Role viewed by an Individual and owned by a House must clearly be the same underlying Role.
- A Project public page and private Workspace can differ in function, but share project identity.
- A Credit proposal and accepted Credit must belong to the same record visual family.
- An Individual Profile viewed by a House must not become an unrelated ATS screen.
- A Production House Profile viewed by an Individual and by a member must be the same page with different actions.

No persona may introduce a separate visual brand.

---

# 14. Do / Don’t examples

## Do

Use large project imagery where the work itself carries identity.

## Don’t

Wrap strong media in unnecessary white cards.

---

## Do

Use editorial rows for lightweight activity.

## Don’t

Turn every update into a raised container.

---

## Do

Use 3D/object treatments in expressive discovery moments.

## Don’t

Use 3D objects in Privacy, Report, Legal or destructive flows.

---

## Do

Allow controlled overlap and depth.

## Don’t

Make every screen float on multiple shadows.

---

## Do

Keep one component language.

## Don’t

Invent screen-specific buttons, pills or icons.

---

## Do

Create visual variation through composition.

## Don’t

Create visual variation by inventing a new style per section.

---

# 15. Representative screen mapping

Before propagating the system across Ana, validate it on four screens.

## Screen 1 — Individual Home

Must prove:

- section rhythm
- multiple composition families
- object language
- controlled colour
- depth
- strong hierarchy

---

## Screen 2 — Production House Home

Must prove:

- Ana still feels creative when information density increases
- Slate remains central
- organisation experience does not become enterprise software

---

## Screen 3 — Individual Profile

Must prove:

- quieter pages still feel recognisably Ana
- portrait, work and records coexist
- social-media resemblance is reduced

---

## Screen 4 — Role Detail

Must prove:

- expressive media can coexist with transactional clarity
- sticky action area
- hierarchy remains strong
- visual identity does not interfere with task completion

---

# 16. Visual Expression Pass process

Do not redesign the full product immediately.

Use this order:

1. Audit the four representative screens.
2. Apply the composition families.
3. Improve hierarchy and imagery.
4. Introduce controlled depth.
5. Introduce object language where appropriate.
6. Check cohesion across all four.
7. Remove anything that feels decorative or inconsistent.
8. Lock the visual composition system.
9. Define the Motion & Microinteraction System separately.
10. Only then propagate to all canonical screens.
11. Resume the full Figma migration after approval.

---

# 17. Figma migration rule

The current Claude → Figma migration remains paused during the Visual Expression Pass.

Do not continue mass migration using the old visual language.

After the new visual composition system is approved:

- update Figma foundations if necessary
- update existing component library
- update representative screens
- validate component integrity
- then resume migration from where it stopped

Do not restart from scratch unless technically necessary.

---

# 18. Success criteria

The visual system succeeds if:

- Ana feels richer without feeling busier.
- Home sections have visual rhythm.
- Individual and Production House experiences feel like one product.
- Important work is image-led.
- Functional screens stay clear.
- Credits still feel trustworthy.
- 3D/object language feels intentional rather than decorative.
- no section looks like an unrelated app.
- the system can be reproduced by another designer.
- Claude can apply it without inventing arbitrary new styles.
- visual variation comes from composition, not inconsistency.

---

# 19. Anchor principle

Whenever deciding whether to introduce a new visual treatment, ask:

> **Does this create useful hierarchy or Ana-specific character while still obeying the existing visual grammar?**

If yes, use it.

If it only makes the screen look more decorated, do not.

---

## Final rule

> **Ana should feel cohesive first, expressive second.**

The goal is not to make every screen memorable.

The goal is to make the product as a whole memorable.
