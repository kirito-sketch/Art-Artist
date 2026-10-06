# Home events, See all, onboarding and the profile: approved direction

Status: **approved**. This document is the source of truth for these areas. Where it touches a frozen rule (credits, house permissions, collaboration Interest, messaging, role lifecycle, credit acceptance and disputes), the frozen rule wins. Conflicts are listed in §15.

## What existed before (audit)

| Area | Before | Gap |
| --- | --- | --- |
| Onboarding | Sign in (Apple, Google or email + code) → consent → About you (photo optional, name, main craft) → What brings you here (intent, city, start date for work intents) | No phone, languages or travel; nothing about the person's work |
| Edit Profile | One long form for every craft: photo, name, "What you do", city, other crafts, specialisation, languages, about, gear, availability, portfolio | Not role-aware, no structured skills, no privacy controls, the reel can't be edited |
| Completion | One Home card (portfolio → availability → bio); "Later" hides a step for good | Not role-aware; no phone; no rule for when prompts stop |
| Events on Home | District Home: top 3 upcoming events by city then date | One organiser could fill all three slots |
| Section links | Current Home and Discover: the title is the link ("Title ›"). District: "See all" on the right. District mosaic: "See more in Discover" below. HomeNext: "See more" | Three patterns, two labels, one action |
| Discover feed | Grid → vertical feed (images swipe inline, "1 / N") → **tap opens a lightbox** | A third layer showing the same picture again |

---

## 1. Events on Home

**Decision: Direction A, static.**

- One large event and two secondary event rows, all three visible.
- No auto-scroll, no cards growing into focus, no pagination dots, no layout shift, no rotation while the section is on screen.
- "See all" in the section header opens the full Events destination (Discover › Events).
- Home already has motion (the spotlight with video). Events must not add another moving element. The section should feel editorial, not like advertising: one strong image, a crisp date tag and generous spacing. The only motion is press feedback and the image fading in on load.
- **Accessibility:** each card is one link whose label carries title, date, place and price. Save is a separate 44 px button. The secondary rows are a list. Reduced motion changes nothing, because nothing moves.

## 2. Which events appear on Home

Home picks by **relevance to the person, not organiser size or payment**. The Events destination lists every eligible event **by date**, which is the fairness mechanism.

**Pool:** the existing listing rules (verified host; no auditions or casting; nothing for children; no paid event that promises roles), plus:
- scheduled, and starts within 21 days (or is running now)
- not from someone the viewer blocked
- not already marked Interested by the viewer

**Score** (implemented in `src/domain/eventRank.ts`):

| Signal | Points |
| --- | --- |
| Screening of a film you're credited on | +5 |
| Same city | +3 (online +1.5; another city +1 if you're open to travel) |
| Your craft, or a related craft, among the event's audience | +3 / +1.5 (an event for everyone +1) |
| People in your network hosting or speaking | +2 |
| Hosted by a production house you follow | +1.5 |
| Starts within 7 / 14 / 21 days | +2 / +1 / +0.5 |
| Published in the last 72 hours | +1 |
| Interest from others | up to +1 (log scale, capped) |
| Editorial pick (curation team, at most one per city per week, never sold) | +1.5 |
| Paid promotion | not a signal |

**Diversity, applied after scoring:**
- at most one event per organiser
- at most two of the same type
- an event seen 3 times without a tap steps aside
- among scores within 10% of each other, the one shown to this person least goes first

**Rotation:** the choice is fixed for the session and recalculated daily, or after a meaningful change such as the person moving city, changing craft, marking Interested or blocking someone. It never rotates while the section is being viewed.

**Title follows the content:** "Events near you" when the large event is in the person's city; otherwise "Events coming up". With fewer than three eligible events, show what there is. With none, hide the section.

**Language:** the three events are never labelled "Featured". If paid promotion is added later, it is a separate placement marked "Promoted", outside the three personal picks, and it never influences ranking for jobs or casting.

**Discoverability for events not on Home:**
- the Events destination (complete, by date)
- search
- the organiser's profile
- the film or project page (Screenings)
- notifications to people who follow the organiser

## 3. See all

One component, `SectionHeader`, everywhere in Home (both versions) and Discover:

1. **Title on the left, "See all" on the right**, as a visible text button at least 44 px tall.
2. "See all" **navigates** to the complete destination or list for that section.
3. It shows **only when more exists** than the section shows.
4. The **title is never a hidden link.**
5. **"Show more" only expands in place** (a bio, a long caption, a review).
6. No "See more", "View all" or "More" for navigation, and no links below a section that do the same as See all. "See more in Discover" is removed.

## 4. Onboarding

Onboarding is not profile completion. It establishes who the person is, creates a meaningful first profile, personalises Home and Discover, allows basic discovery, and records why the person is here.

| Screen | Field | |
| --- | --- | --- |
| Sign in | Email, or Apple / Google | Required (authentication) |
| About you | Name as credited | **Required** |
| | Main craft | **Required** |
| | Profile photo | Recommended, skippable |
| Your mobile | Mobile number, verified by code | Recommended, **Skip for now** |
| What brings you here | Intent: find work, hire, collaborate, look around | **Required** |
| Where you work | City | **Required** |
| | Languages you work in (suggested from the city) | Recommended, skippable |
| | Open to travel | Recommended, skippable |
| | Available from (find-work intent only) | Recommended, skippable |
| Add your work | Showreel link · portfolio images · a work link, worded for the craft | Optional, **Skip** |

Every answer writes to the same profile fields that Edit Profile and completion prompts use.

## 5. Phone number

**Why Ana wants it:**
- matching people productions added by phone
- attaching those records, and later credits, to the right person
- one verified number per person, against duplicate and fake accounts
- trusted production workflows later

**Model:**
- **Sign-up never requires it.** Email, Apple or Google gets the person into Ana. Onboarding asks for a mobile number with "Skip for now".
- **After onboarding** it is the first completion item, explained by its benefit: "**Verify your mobile number.** Helps us match production credits and keep your professional record connected to you."
- **Verification is required only where Ana must establish that this account is the person in an existing record:**
  1. Confirming a project record a production created against that phone number ("Konark Pictures added you to Neela Akasham as Assistant Director: is this you?"). This is the existing frozen rule (CONSOLIDATION §7; EC-PEND-003, EC-PEND-005): never auto-merged, confirmed by the person, one number belongs to one person. Credits on that record become possible only after it's linked, exactly as today.
  2. Accepting an invitation sent to a phone number (invites bind to the address or number they were sent to; EC-HOUSE-013, EC-AUTH-014).
  3. Changing a verified number (the new number is verified first; EC-LINK-005).
  4. Account recovery through the phone (EC-AUTH-009).
- **Reviewed and deliberately not gated:** showing interest in a role, messaging, posting, following, saving, reviewing films, creating or hosting events, accepting a credit issued to your account by name (it was never matched by phone), editing the profile, and acting for a house through an email invite.

**Privacy:** the number is never shown on the profile and never automatically visible to production houses. **Ana holding a verified number** (identity) and **the person sharing their contact with someone** (a deliberate act in one conversation) are separate actions with separate controls.

## 6. Edit Profile

Edit Profile is an overview of sections. Each row opens a focused page and shows what's filled in.

```
Edit profile
├─ Photo & name            photo, name as credited, headline (from crafts, editable)
├─ Crafts                  main craft, other crafts (up to 4), specialisation
├─ <Craft> details         one row per craft with a details set ("Acting details", "Camera details")
├─ Skills                  structured skills, grouped
├─ Languages               languages; accents for performers
├─ Portfolio & showreel    reel, images, work links (worded for the craft)
├─ Work                    credits (issued by productions) · independent projects
├─ About                   bio, experience, links
├─ Availability & travel   available from, open to travel, types of work
└─ Contact & privacy       mobile (verify), email, visibility of sensitive details
```

Onboarding, completion prompts and Edit Profile all update the **same fields** (`Person` plus `src/state/profile.ts`). Nothing is stored twice.

## 7. Showreels, portfolio and media

**v1 sources, given the current architecture** (no video hosting):

| Kind | v1 | Why |
| --- | --- | --- |
| Showreel | An **external link** (YouTube, Vimeo, Google Drive) with a title, an optional uploaded cover image and an optional duration | Hosting and transcoding video is expensive and unnecessary for v1; reels already live on these services |
| Portfolio images | **Uploaded images**, ordered | Images are cheap to store and are the core evidence for many crafts |
| Work links | External links with a label (a project page, a scene clip, a writing sample page) | Covers crafts whose work isn't images |
| Uploaded video clips | Later | |

**Profile order:** the showreel (if any) comes first. Then images in the person's order; **the first image is the cover**, used on cards and as the profile backdrop. Then links.

**Editing (Edit Profile › Portfolio & showreel):**
- add, replace or remove the showreel; edit its title, link and cover
- add and remove images; reorder them; "Make cover" moves an image to first
- add, edit and remove links
- changing one item never requires deleting the rest

**Worded for the craft** (`src/data/profileSchema.ts`, `work`):

| Craft | Reel | Images | Links |
| --- | --- | --- | --- |
| Acting | Showreel / scene clips | Headshots and stills | Scene clips |
| Cinematography, camera, lighting | Reel | Frames | Projects |
| Editing, colour, VFX | Reel | Frames | Sequences and projects |
| Make-up & hair, costume, production design | (none by default) | Portfolio | Projects |
| Writing | (none) | (none) | Writing samples and projects (links only; no public files in v1) |
| Sound, music | Reel | Session photos | Tracks and projects |

**Onboarding:** an optional "Add your work" step after the essentials. Never required, never blocking.

**After onboarding:** "Add your work" is a high-value completion item, worded for the craft ("Add a showreel so productions can see your work" for an actor; "Add frames from your work" for a cinematographer; "Add a writing sample link" for a writer).

## 8. Craft-specific profiles

The model (`src/data/profileSchema.ts`):
- **Craft definitions** switch on **detail sets** and suggest **skill categories**.
- **Fields** are defined once (type, options, default visibility, sensitive or not, whether it's a future filter) and reused across crafts.
- A person sees a detail set only if their main or other crafts switch it on. A writer never sees acting fields.
- Adding a craft means adding a definition, not a screen.

**Fully defined in v1** (others fall back to the universal profile and skills):

| Craft | Details | Skill categories first |
| --- | --- | --- |
| Acting | Playing age · height · build · hair · eyes · accents | Dance · combat & stunts · riding & driving · water · music & voice · sports |
| Cinematography (also camera, lighting) | Camera systems · formats · specialisations · owns kit | Camera movement |
| Editing (also colour) | Software · formats · genres · specialisations | (software lives in details) |
| Sound (also music) | Areas (location recording, mixing, sound design, Foley, Atmos) · tools · owns kit | Music & voice |

## 9. Skills

- One **searchable predefined list**, in **categories**, multi-select, with synonyms ("Bharatnatyam" finds Bharatanatyam).
- **Add an unlisted skill:** it's saved on the profile as "suggested". It shows on the profile, but isn't a filter until the team approves it.
- **Limit:** 20 skills (prevents keyword stuffing).
- **Level only where it helps casting decisions**, set per category:

| Category | Level? | Levels |
| --- | --- | --- |
| Riding & driving, Water, Combat & stunts | Yes | Basic · Confident · Performance standard (combat & stunts can add a certification) |
| Dance, Music & voice | Yes | Trained · Professional |
| Sports | No | |
| Camera movement (Steadicam, gimbal, drone) | No level; drone can add a licence | |
| Software | Not a skill: listed in craft details, no level | |
| Languages | Separate field, no level | |

No field exists only because it can be structured. Each one serves production discovery, matching, profile understanding, recommendations or casting decisions.

## 10. Progressive completion

- **One prompt at a time**, on Home, **at most once per session**, after the first section.
- **"Later" snoozes that prompt for 14 days.** After **3 "Later"s in a row**, no Home prompts for **30 days**.
- **No percentage.**
- **Order (role-aware):** verify mobile → profile photo → add your work (worded for the craft) → languages → availability (find-work intent) → craft details → skills. Sensitive physical attributes are **never** prompted from Home; they're asked only in Edit Profile or when relevant.
- **"Ways to be found"** on your own profile: the same items as a private checklist, visible only to you, non-judgemental, with "Hide" once you've seen it. It disappears when everything is done.
- Every prompt and checklist item opens **the same Edit Profile section page**.

## 11. Privacy

**Never collected** (unless a clear future reason appears and is reviewed): caste, religion, ethnicity, body measurements, date of birth. The 18+ confirmation at sign-up handles age.

**Contact:** phone and email are private. Sharing them is a deliberate act in a conversation.

**Visibility levels**, shown next to a field as it's entered:

| Level | Meaning |
| --- | --- |
| Private | Only Ana and account systems use it |
| Productions | Visible to people acting for a verified production house |
| Public | On the public profile |

| Field | Default | Choices |
| --- | --- | --- |
| Phone, email | Private | Private only |
| Playing age | Public | Public · Productions · Private |
| Height, build, hair, eyes | Productions | Public · Productions · Private |
| Accents, skills, languages, crafts, craft details (non-physical) | Public | Public |
| City | Public, city level only | Never an address or area |
| Availability | Public "Available from" | Calendar stays private |

Future physical filters will be available only to verified production accounts, and their use will be logged.

## 12. Discover: grid → feed → media

The hierarchy:
- **Grid** is for browsing.
- **Vertical feed** is for viewing, with context.
- **Full-screen viewer** is only where detailed inspection is the point.

Not every piece of content uses all three.

- **Grid:** tap → the vertical feed at that post.
- **Feed:** media is part of the post. **Tapping an image does nothing.** Several images **swipe inline** with "1 / 5". A video toggles play and pause. No lightbox.
- **Home and profile post cards:** tapping the media opens the same feed at that post (the expanded state), not a lightbox.

## 13. When a full-screen viewer is right

**Use it** where inspecting the media is the point:
- a person's portfolio images (frames, looks, costumes, sets)
- a project's stills
- a showreel's cover

It has swipe between images, a clear close and back, and no nesting.

**Don't use it** for post images in feeds, avatars, cards, or anything already shown at a comfortable size.

## 14. Search and filtering

Not built now. The data is structured so it can be built later: crafts, languages, skills (ids), city, availability, travel and craft details are separate fields, never buried in bios.

Later: casting filters, production search tools, missed-search prompts, matching controls.

## 15. Frozen rules: conflicts found

| Rule | Interaction | Resolution |
| --- | --- | --- |
| People not on Ana (CONSOLIDATION §7 and §8: linking was "future, not built") | Phone verification makes linking possible | Built exactly as §7 defines it: a confirmation step, never automatic, one number per person, a "Not me" option. The linked record becomes a normal association. Credits follow the unchanged credit rules |
| Credits are issued by productions and accepted by the person | No change. A record found by phone is an association, not a credit | Preserved |
| Collaboration Interest, messaging, role lifecycle, house permissions | Phone verification is not added as a gate | Preserved |

## 16. Screens and components

| Change | Where |
| --- | --- |
| Events: Direction A, ranking and diversity, title follows content | `screens/home/DistrictHome.tsx`, `domain/eventRank.ts` (+ tests), `data/seed.ts` (event audience), `styles/district.css` |
| Section header | `ui/primitives.tsx` (`SectionHeader`), `screens/home/DistrictHome.tsx`, `screens/home/HomeNext.tsx`, CSS |
| Profile data | `data/types.ts`, `data/profileSchema.ts`, `state/profile.ts` (+ tests), seed |
| Onboarding | `entry/Entry.tsx`, `state/store.tsx` (`createPerson`) |
| Edit Profile | `screens/profile/EditProfile.tsx` and the section pages in `screens/profile/editSections.tsx` |
| Completion and checklist | `screens/home/FirstHome.tsx`, `screens/profile/ProfileScreen.tsx` |
| Phone linking | `state/profile.ts`, `domain/actions.ts` (`linkPendingByPhone`), the Contact & privacy page |
| Profile display | `screens/profile/ProfileScreen.tsx` (skills, details by visibility, reel link, links) |
| Discover media | `screens/discover/PostStream.tsx`, `screens/home/PostCard.tsx` |
