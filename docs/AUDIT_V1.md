# Audit of prototype v1

Measured in Chromium at 393 × 852. "First screen" means what is visible before scrolling.

## The numbers

| Screen | Text items | Words | Font sizes | Boxed surfaces | Pills | Serif items |
| --- | --- | --- | --- | --- | --- | --- |
| Home, first screen | 98 | 251 | **13** (7px to 64px) | **13** | **10** | 16 |
| Home, whole page | | **465** | | | | |
| Opportunity, first screen | 29 | 98 | 8 | 8 | 5 | 3 |
| Discover, first screen | 44 | 86 | 7 | 5 | 3 | 7 |
| Inbox, first screen | 39 | 134 | 9 | 2 | 0 | 3 |
| Profile, first screen | 31 | 51 | 9 | 7 | 3 | 4 |
| Create sheet | 10 | **51** | 5 | 4 | 0 | 3 |
| Collab composer | 11 fields, **24 chip options** shown at once | | | | | |

(The Home first-screen count includes carousel cards to the right of the fold.) A "focused" Home that is
2,853px tall and holds 465 words is not focused. A menu with three choices should not need 51 words.

## Root causes

1. **Designed from the data model outward.** Every field an object had got rendered wherever the object
   appeared. The For You card is the detail page shrunk down, not a decision aid.
2. **Explaining the system inside the UI.** Screen subtitles, footnotes, "Why you're seeing this",
   "Only you see this", "you start the conversation". Product rationale leaked into copy because the
   design did not carry it on its own.
3. **Saying the same thing two or three times.** Peer status is stated three ways on one card. Verified is
   stated as an icon and again in words. Language appears in the project line and as a fact.
4. **Labels instead of form.** Badges and chips for everything: ten pills on the first Home screen.
5. **No type system in practice.** Thirteen sizes on one screen, the display serif on sixteen items,
   important text at 11 to 13px.
6. **A box around everything.** Thirteen bordered or filled surfaces on the first Home screen, so none
   of them reads as the important one.
7. **Decoration that implies activity.** Pulsing "New", carousel dashes, end cards, craft counts such as
   "1,840" that nothing backs.
8. **The best space spent on the user.** The largest text on Home is the user's own first name (40px).
   The first opportunity starts below the fold's midpoint.

## Screen by screen

### Home
- **Hero:** four lines ("Ana", "Good morning,", "Kiran", availability pill with three facts) that tell the
  user nothing new. Both the hero and the collapsed header render "Ana".
- **Section header:** "For You" + "6 matches this week" + "See all". The count is noise.
- **Official card, 13 elements:** type badge, "Closes in 4 days", logo, production name, verified tick,
  role, project, format and language, location, dates, pay, three match reasons, arrow, save.
  - "Your role" appears on every card. In For You it carries zero information.
  - Three colours on one card: amber badge, blue tick, amber match line.
- **Collab card, 13 elements:** author, role, time, "Collaboration" badge, "Looking for" kicker, title,
  project, format, three facts, match line, "Interest only" chip. Badge, kicker and chip all say
  "peer collaboration".
- **Carousel extras:** eight progress dashes and an end card ("13 open roles and collaborations across
  Ana") that exist to fill space.
- **Network rows:** sentences built from bold, regular, italic-serif and grey fragments, followed by
  "Camera department · added by Blue Lotus Originals", a verified icon, time and a chevron. The
  collaboration row then repeats its own sentence as chips (Collaboration · Mumbai · 22–23 Oct).
  Project and portfolio rows inline a strip of three images. All rows sit in one bordered box, under a
  pulsing "New" label.
- **Posts:** each in a card, with role, time, "On Salt Water", four actions with counts. Full social
  chrome on the layer we said was secondary.
- **End:** "That's a wrap for now" plus two sentences.

### Opportunity
- Three pieces of meta before the title: "Crew job", "Closes in 4 days", "Posted 1d ago".
- Facts as four boxed tiles, each with a label ("Location") above a value that doesn't need one.
- Production card says "Verified production house" next to a verified tick.
- "Why you're seeing this" box repeats the match reasons already shown on the card.
- "What Konark will ask" is preceded by a sentence explaining that questions are role-specific.
- A trust paragraph on every role.
- Language appears in the project line and again as a fact.

### Discover
- Subtitle "Roles, people and work across Ana" describes the screen instead of doing anything.
- Six scope chips, then "Open roles · 11 open now · See all" before any content.
- Every row: badge, role, production, then "project · city · pay".
- Craft counts (1,840, 9,210) are invented.

### Inbox
- Subtitle "Every conversation shows what it's about" is a design rationale shipped as copy.
- Interest banner: "3 people are interested · 1st AC · Salt 2 · you start the conversation" + three avatars.
- Each thread: name, time, a context tag with label and detail, and two lines of message. Four lines per row.

### Profile
- First screen is spent on chips (experience, languages, ID verified), an availability bar, two buttons, a
  stat strip, and a dashed "Only you see this" box showing **0 Saved, 0 My responses**.
- The showreel, the strongest proof of the person's work, is below the fold.
- Private tools sit inside the public identity.

### Create
- Sheet: title, subtitle "Share with the industry", a description under every option that restates its
  title, and a footnote about verified production houses. 51 words for three choices.
- Collaboration composer: 11 fields on one page, 24 chip options visible, a "1/2" counter, and a disabled
  button whose label lists what is missing.

## Rules for v2

1. **A surface shows only what is needed to decide whether to tap.** Everything else lives one level down.
2. **Say a thing once.** One trust signal per object.
3. **No explanatory copy.** If a feature needs a sentence to be understood, redesign it. Exceptions: errors,
   empty states, and consent or safety moments at the point of action (for example "Kabir reviews
   interest before messaging").
4. **At most one badge per item, one primary action per screen, five type sizes across the app.**
5. **No numbers we cannot back.** No counts for the sake of liveliness.
6. **Surfaces only for tappable image objects.** Lists use hairlines.
7. **Budgets:**

   | Element | Budget |
   | --- | --- |
   | For You card | Image + 3 text lines (role; production ✓; place · dates) + at most one pill |
   | Network row | Avatar + 1 sentence + time; one thumbnail only if the event is media |
   | Inbox row | Name + time; context line; last message |
   | Detail first screen | Image, title, production, 3 icon facts, one action |
   | Create sheet | Under 15 words |

## Example: the For You card

| v1 (13 elements) | v2 (5 elements) |
| --- | --- |
| Crew job badge · Closes in 4 days · save · KP logo · Konark Pictures · ✓ · Director of Photography · Neela Akasham · Feature film · Telugu · Hyderabad & Araku · 18 Oct – 30 Nov · ₹22k–28k / day · Your role · 12 km away · Your dates are free · → | Image with "Closes in 4 days" · **Director of Photography** · Konark Pictures ✓ · Hyderabad · 18 Oct – 30 Nov · (save on the image) |

Pay, project, format, language and match reasons move to the detail page. Only a match reason that is
genuinely surprising ("You shot Season 1") may replace the place line.

---

## v2 result

Same measurements, same viewport.

| Screen | v1 words (first screen) | v2 words | v1 font sizes | v2 font sizes | v1 boxed surfaces | v2 |
| --- | --- | --- | --- | --- | --- | --- |
| Home | 251 | **86** | 13 | 5 | 13 | 1 |
| Home, whole page | 465 words, 2,853px | **200 words, 1,775px** | | | | |
| Opportunity | 98 | **65** | 8 | 4 | 8 | 0 |
| Create sheet | 51 | **8** | 5 | 1 | 4 | 1 |

(Font sizes exclude status bar and avatar monograms.)
