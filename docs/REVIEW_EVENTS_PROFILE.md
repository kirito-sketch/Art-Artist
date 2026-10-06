# Product review: Home events, See all, and the profile

Status: proposal for approval. Nothing in the prototype has changed yet.

## What exists today (audit)

| Area | Today | Gap |
| --- | --- | --- |
| Onboarding | Sign in (Apple, Google or email + code) → consent → **About you**: photo (optional), name, main craft → **What brings you here**: intent, city, start date (work intents only). | No phone number. No languages, travel or experience, so Home and search know only craft and city. |
| Edit Profile | One long form: photo, name, "What you do", city, other crafts (up to 4), specialisation, languages, about, gear, then rows for availability, portfolio and credits. | One form for every craft. Nothing role-specific, no structured skills, no privacy controls. Free-text "gear" mixes cameras, software and instruments. |
| Completion prompts | Home shows one "Next step" card: portfolio, then availability, then bio. "Later" hides that step for good. | Not role-aware. Doesn't cover languages or craft details. No rule for when prompts stop. |
| Events on Home | District Home: top 3 upcoming visible events, your city first, then soonest. Current Home: at most one event, only when it's high or medium significance (`eventHomeCandidates`). | No fairness rule: one large organiser with many events can fill all three slots. |
| Section links | Current Home and Discover: the whole title is the link ("Opportunities for you ›"). District Home: "See all" text on the right. District mosaic: "See more in Discover ›" link **below** the section. HomeNext: "See more". | Three patterns and two labels for the same action. |

---

## 1. Home events: carousel behaviour

**Recommendation: no auto-scroll, and no cards growing into the large state. Keep Direction A static and user-controlled.**

| Question | Recommendation | Why |
| --- | --- | --- |
| Auto-scroll? | **No.** | Home already has one moving element (the spotlight, with video). Two auto-moving areas compete for attention, and the eye can't settle on either. Events are decision content (date, place, price) that people need time to read. Anything that moves on its own for more than 5 seconds needs a pause control (WCAG 2.2.2), which adds UI. |
| Should each card become the big card as it comes into focus? | **No.** | The page height would change as cards grow and shrink, so everything below jumps. The big card means "best match for you". If every card takes a turn, that meaning is lost. |
| User-controlled? | **Yes, and static.** Nothing needs swiping: three events, all visible. | The only interactions are tap to open, save, and See all. |
| How many visible? | **Three:** one big card and two compact rows. | Enough to show range without becoming a listing. |
| Pagination dots? | **None.** Nothing is paged. The indicator is "See all" in the section header. | Dots promise more cards to swipe through. Here "more" lives on the Events page. |
| How to feel premium without noise | One strong image (the event's film, the host's current project, or the host's work), a crisp date tag, and generous spacing. No gradients beyond the one that keeps text readable. The only motion is press feedback and the image fading in on load. | Restraint reads as premium. The spotlight above already supplies the motion. |
| Accessibility | Each card is one link whose label carries title, date, place and price. Save is a separate 44 px button. The two rows are a real list. The heading is an h2. | |
| Reduced motion | Nothing to change: the section is static. Press feedback is a colour change only under Reduce Motion. | |

---

## 2. Which events appear on Home

**Principle:** Home is a short, personal preview chosen by relevance, not by size or payment. The Events page is the complete, fair listing. Every organiser is guaranteed a place there; Home is never a guarantee.

### Eligible pool
Uses the existing listing rules: verified host, no auditions or casting, nothing for children, no paid events that promise roles. On top of that: scheduled, starts within the next 21 days (or is running now), not cancelled, not from anyone the viewer blocked, and not something the viewer has already marked Interested (it's already in their Saved and reminders).

### Score (each signal capped, so no single one dominates)

| Signal | Points | Notes |
| --- | --- | --- |
| You're credited on the film being screened | +5 | Always the big card |
| Same city as you | +3 | Online events +1.5. Another city +1 if you're open to travel, else 0 |
| Craft fit | +3 when the event's audience includes your craft, +1 when it's for the whole industry | Needs a new "who it's for" field on events (multi-select crafts, or "Everyone") |
| People you know | +2 when someone you follow or worked with is hosting or speaking | Uses the existing `eventReason` |
| Date | +2 within 7 days, +1 within 14, +0.5 within 21 | Sooner wins ties |
| New | +1 for 72 hours after it's published | Gives small organisers a first look |
| Interest from others | up to +1 (log of the Interested count, capped) | Kept small so popularity doesn't snowball |
| Editorial "Ana pick" | +1.5 | Curation team only. At most one per city per week. Never sold |
| Paid promotion | **Not a signal** | See below |

### Rules applied after scoring
1. **One event per organiser** in the three slots.
2. **At most two of the same type** (screening, meetup, workshop, talk, festival).
3. **Fair rotation:** among events within 10% of each other's score, the one shown to you least in the last 7 days goes first.
4. **Fatigue:** an event shown as the big card 3 times without a tap gives way to the next.
5. **Stability:** the selection is fixed for the session and recomputed once a day, so Home doesn't reshuffle while you look.
6. **Fewer than 3 eligible events:** show what there is (1 big card, or 1 + 1). None: hide the section.
7. **Title follows the content:** "Events near you" when the big card is in your city; otherwise "Events coming up".

### Answers to the specific questions
- **Rotate?** Yes, daily and by impressions (rules 3 to 5), never on a timer while you're looking.
- **Personalised?** Yes, with understandable signals (city, craft, people you know). A brand-new person with no signals gets city, then soonest, then variety of type.
- **"All events" destination?** Yes. Home's "See all" opens the Events page (Discover › Events), which lists **every** eligible event **by date**, not by score, with filters for city, date and type. Chronological order is the fairness guarantee.
- **Discoverability when not featured:** the Events page; the host's profile; the film's page (Screenings); a notification to people who follow the host; search; and the "New" boost on Home for 72 hours.
- **What is "featured"?** An **algorithmic state** with one capped editorial input. There's no visible "Featured" label (it would imply everyone else is second class). Paid placement on Home: **not in v1**. If it's ever added, it gets its own slot, clearly marked "Promoted", is never one of the three relevance slots, and is never for anything that leads to a role (this fits "no paid access to opportunities").

---

## 3. "See all" consistency

**Finding:** Discover doesn't need a different interaction. Discover's search results already use the same section header as Home. The odd ones out are District Home's "See more in Discover ›" link below the mosaic, and "See more" on HomeNext. "See more" and "See all" mean the same thing in all three places, so it's purely inconsistency. Separately, current Home makes the whole title the link with a chevron, while District uses a visible "See all" on the right.

**The rule**

1. A section that previews a longer list has a header with the **title on the left** and **"See all" on the right**: a visible text button, at least 44 px tall.
2. **"See all" always navigates** to the complete list for that section, opening with the same scope and title.
3. Show "See all" **only when there is more** than the section shows.
4. **"Show more" expands in place** (a long bio, a truncated review). It never navigates.
5. Never "See more", "View all", "More" or "Explore" for this. Never a link below the section, except at the end of the page (the "You're up to date" end card).

One component, `SectionHeader`, renders this everywhere: Home (both versions), Discover search results, Saved, the film page, the profile and Reviews.

---

## 4. What to ask, and when

### Onboarding (proposed: 4 short screens, each with one job)

| Screen | Field | Required? | Why |
| --- | --- | --- | --- |
| Sign in | Email (or Apple/Google, which supply email) | **Required** | Account, recovery, legal notices. Never shown. |
| About you | Full name (as credited) | **Required** | Credits are issued to this name |
| | Profile photo | Optional, encouraged | A strong trust signal, but a blocker if forced. Asked again later |
| | Main craft | **Required** | Drives Home, Discover, search and the craft-specific profile |
| Your number | Mobile number, verified by OTP | **Required** (see below) | |
| Where you work | City | **Required** | Home, "near you", search |
| | Languages you work in | Optional, suggested from the city (Hyderabad → Telugu, Hindi, English) | High value for matching, one tap |
| | Open to travel | Optional toggle | Widens what Home shows; productions filter by it |
| What brings you here | Intent (find work, hire, collaborate, look around) | **Required** (exists today) | Shapes Home; changeable any time |
| | Available from | Optional, only for "find work" | Exists today |

**Why phone is required (and private):**
- Productions add crew by phone. Associations and credits already store `pending: { name, phone }` for people not on Ana, and a verified number is how those attach to the right person.
- One verified number per person is the strongest guard against fake and impersonation profiles (already a top report reason).
- Productions need a way to reach a person they've shortlisted.

Asking only when someone first shows interest or accepts a credit would interrupt them at the worst moment, and would leave credits added by phone unclaimed. The number is never shown on the profile. It's never searchable by anyone except a production adding crew to its own project, and that search returns no indication of whether an account exists (an invite is sent either way).

**Considered and not asked at onboarding:** secondary crafts, experience, about, portfolio, skills, physical attributes, gender, date of birth.

### Later: profile completion (the same fields, in Edit Profile)

| Field | Asked how |
| --- | --- |
| Profile photo (if skipped) | First completion prompt |
| Showreel and portfolio | Prompt after the photo |
| Other crafts (up to 4), specialisation | Prompt, and in Edit Profile › Crafts |
| Experience (years, as a range: under 2, 2 to 5, 5 to 10, 10+) | Edit Profile › About |
| About (400 characters) | Prompt |
| Skills (structured, see §6) | Role-specific prompt |
| Craft details (see §6) | Role-specific prompt |
| Types of work you want (feature, series, short, ad, music video, theatre, documentary) | Edit Profile › Work preferences |
| Links (IMDb, Instagram, website) | Edit Profile › About |
| Representation (agent or manager contact, actors) | Edit Profile › Contact and privacy |

### Craft-specific (only for people with that craft as main or other craft)
See §6.

---

## 5. Edit Profile: information architecture

Today's single long form becomes **an overview of sections**. Each row opens a short page, and each row shows what's filled in ("Telugu, Hindi, English"). The same section pages are used by onboarding and by completion prompts, so there is **one data model and one set of field components**.

```
Edit profile
├─ Photo and name            photo, name, headline (generated from crafts; can be edited)
├─ Crafts                    main craft, other crafts (up to 4), specialisation
├─ [Craft] details           one row per craft you have, e.g. "Acting details", "Camera details"
├─ Skills                    structured skills by category, optional level
├─ Languages                 languages, plus accents and dialects for performers
├─ Work                      showreel and portfolio · credits (issued by productions) · independent projects
├─ About                     bio, experience range, links
├─ Availability and travel   available from, open to travel, types of work
└─ Contact and privacy       phone (verified, private), email (private), representation,
                             who can see your sensitive details
```

---

## 6. Role-based profile model

```
Profile
├─ Universal fields          everyone (name, photo, city, crafts, languages, about, availability…)
├─ Skills                    ids from one shared skills list (each with an optional level)
└─ Attributes                values keyed by attribute id, from the sets your crafts switch on

Craft definition (one per craft, in data)
├─ attributeSets             which sets of details appear for this craft
├─ skillCategories           which skill categories to suggest first
└─ searchFilters             which attributes productions can filter by for this craft

Attribute definition (one per field, defined once and reused across crafts)
├─ id, label, type           choice · multi-choice · range · number + unit · short text
├─ visibility default        public · signed in · verified productions only · private
├─ filterable                yes or no (and by whom)
└─ sensitive                 yes: never prompted from Home, never required
```

Adding a craft means writing one definition, not building a new screen. Attributes are shared: "Driving" is one skill that both an actor and a stunt performer can have.

| Craft | Details set (examples) | Skill categories suggested first |
| --- | --- | --- |
| Actor / performer | Playing age range · height · build · hair · eyes · roles you can play (optional) · accents | Dance, combat and stunts, riding and driving, water, music and voice, sports |
| Stunt performer | Specialities (fights, falls, fire, car, horse, wire) · certifications · safety training | Combat, riding and driving, water, sports |
| Cinematographer / camera | Camera systems · formats (anamorphic, large format) · specialisations (night, aerial, underwater, documentary) · owns kit | Camera systems, movement (Steadicam, gimbal, drone licence) |
| Editor / colourist | Software (Avid, Premiere, Resolve) · genres · formats (feature, series, ads) · own suite | Post software |
| Sound | Recording or post · specialisations (location, mixing, Foley, Atmos) · own kit | Sound software and kit |
| Makeup and hair | Specialities (prosthetics, period, ageing, SFX) | Techniques |
| Costume | Specialities (period, contemporary, couture) · stitching in-house | Techniques |
| Director / writer | Genres · formats · languages written in | Writing software |
| Production | Departments run · budget scale · locations managed | Production software |

### Skills: structured, not free text (§7)
- **One searchable list** grouped into categories: Dance (Bharatanatyam, Kathak, Kuchipudi, contemporary, hip-hop…), Combat and stunts (martial arts, sword, wire work…), Riding and driving (horse riding, two-wheeler, car, heavy vehicle), Water (swimming, diving), Music and voice (singing styles, instruments), Sports, Languages and accents, Software, Camera systems.
- **Multi-select**, with search and synonyms ("Bharatnatyam" finds Bharatanatyam).
- **Optional level, three steps only:** Learning · Good · Can perform on camera. No stars or percentages.
- **Certification** only where it matters (stunts, diving, drone): a yes/no with the certificate's name.
- **Unlisted skill:** "Add ‘Kalaripayattu’" creates a custom skill. It shows on the profile right away and becomes a filter once the team merges or approves it. That keeps the list clean without blocking people.
- **Limits:** up to 25 skills, so the profile stays a portfolio, not a résumé.

---

## 8. Progressive completion

| Question | Recommendation |
| --- | --- |
| Asked immediately | The onboarding table above, nothing more |
| Asked later, in order | Photo → showreel/portfolio → languages (if skipped) → craft details → about → skills. Then nothing |
| Triggers | (a) **Home card**: one at a time, at most once per session, in the order above. (b) **In context**: showing interest in a casting role that filters by playing age asks for it right there, as a one-question sheet. (c) **Missed searches**: "You weren't in 4 searches for Telugu-speaking 1st ACs this week. Add your languages", only when it's true |
| Completion percentage? | **No.** A percentage pushes people to fill irrelevant or sensitive fields, and it never feels done. Instead, your own profile shows a short **"Ways to be found"** checklist (3 to 5 items for your craft), visible only to you, which disappears when done |
| Role-specific? | Yes. Craft-details prompts use your craft's label ("Add your camera systems") |
| When the card disappears | When the step is done. "Later" hides that step for 14 days. After 3 "Later"s in a row, no Home prompts for 30 days. When everything in the checklist is done, never again |
| Sensitive fields | Never prompted from Home. Only in Edit Profile or in context of a role that needs them |
| Same fields as Edit Profile | Every prompt opens the same section page Edit Profile opens. Nothing is stored twice |

---

## 9. Privacy and sensitive attributes

| Field | Needed? | Required | Who sees it by default | Filterable | Can hide |
| --- | --- | --- | --- | --- | --- |
| Phone | Yes (identity, credits, contact) | Yes, verified | **Nobody.** You share it in a conversation with one tap | No (only exact match when a house adds crew; never reveals whether an account exists) | Always hidden |
| Email | Yes (account) | Yes | Nobody | No | Always hidden |
| Date of birth | **No.** Don't collect. The 18+ confirmation at sign-up covers the legal need | No | n/a | n/a | n/a |
| Playing age range (performers) | Yes, for casting | No | Signed-in members | Yes | Yes |
| Height (performers, stunts) | Useful for casting and doubles | No | **Verified productions only** | Verified productions only | Yes, or make public |
| Build, hair, eyes (performers) | Useful for casting | No | Verified productions only | Verified productions only | Yes, or make public |
| Body measurements | **No.** Don't collect. Fittings happen after hiring, directly with the costume team; storing them invites harassment | n/a | n/a | n/a | n/a |
| Gender | Not required for anyone. Performers may optionally list "roles you can play" (for example men, women, non-binary) | No | Verified productions only | Verified productions only | Yes |
| Caste, religion, ethnicity, skin tone | **Never collected or filterable** | n/a | n/a | n/a | n/a |
| City | Yes | Yes | Everyone (city only, never an area or address) | Yes | No (it's how work is matched) |
| Languages, skills, crafts | Yes | Languages optional | Everyone | Yes | Per item |
| Availability | Yes | No | Everyone sees "Available from"; your calendar stays private | Yes | Yes |

Safety rules that come with this:
- Filtering by physical attributes is available **only to verified production accounts**. Not to individuals, not to unverified houses.
- Searches using sensitive filters are logged for Trust and Safety.
- Everyone on Ana is 18+, so no child can be found through these filters (existing principle).
- Contact details are never public by default. Sharing a number is an explicit act in one conversation.
- Talent data is never sold or exported in bulk (existing principle). There is no bulk export of filtered results.

---

## 10. Screens and components that change

| Change | Where |
| --- | --- |
| Home events: fixed Direction A, the new ranking rule, title follows content; remove the `?dhev` options | `DistrictHome.tsx`, new `domain/eventRank.ts` (+ unit tests), `district.css` |
| Events gain "who it's for" | `IndustryEvent` type, seed events, event composer (one multi-select) |
| Section header: title left, "See all" text right; remove the bottom "See more in Discover" link and "See more" on HomeNext | `ui/primitives.tsx` (`SectionHeader`), `DistrictHome.tsx`, `HomeNext.tsx`, CSS |
| Onboarding: new "Your number" screen (OTP); "Where you work" adds languages and travel; intent moves to its own screen | `entry/Entry.tsx`, `createPerson` in the store |
| Profile data: phone (private), experience range, skills, attributes, work types, links, privacy settings | `data/types.ts` (`Person`), new `data/profileSchema.ts` (crafts → attribute sets, skills list) |
| Edit Profile: overview of sections, each a page; craft details and skills built from the schema | `screens/profile/EditProfile.tsx`, new section components shared with onboarding |
| Completion: Home card order and rules; "Ways to be found" checklist on your own profile; in-context ask for casting roles | `screens/home/FirstHome.tsx`, `ProfileScreen.tsx`, the show-interest sheet |
| Profile display: skills and craft details on the profile, respecting visibility | `ProfileScreen.tsx` |
| Discover: skill and attribute filters per craft (attribute filters for verified productions only) | `DiscoverScreen.tsx` |

Not changing: credits, roles, messaging, houses, events pages, reviews, and the rest of Home.
