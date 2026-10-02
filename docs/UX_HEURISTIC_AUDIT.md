# UX heuristic audit: the current Art and Artist mobile app

Status: audit only. Nothing in the product was changed. Every recommendation waits for review.

Build audited: V30 plus later polish (bottom navigation, layout system, splash), normal app, App mode at
390 × 844 and 375 × 667, on the local dev server. Personas inspected: Kiran Varma (Director of
Photography, intent Find work and switched to Find people for a project), Tara Menon (Actor, Find work),
Konark Pictures (a Production House, acting as Aditi). Screens: Home (four variants), Discover (all four
modes and the house toggle), Inbox, Notifications, Create, own profile, another person's profile, a
house profile, a role, the Show interest sheet, the intent sheet, a message send.

---

## 0. Method and evidence model

**Framework:** Nielsen's ten heuristics (Part 1), then a mobile review, an IA review, a Home audit and
the topic deep dives the brief asked for. Each finding goes from what was said to the need behind it,
the problem, the supporting evidence and the smallest response.

**Evidence strength used throughout**

| Label | Meaning here |
|---|---|
| STRONG | Several participants and behavioural evidence. Includes V29 findings recorded in docs/V30.md (43 sessions, 85 task attempts) where the current build still shows the same cause |
| MODERATE | More than one signal ("some participants", or a research signal that this audit can see a cause for in the product), or one clearly observed usability failure |
| WEAK | One participant's preference or suggestion |
| PRODUCT RULE | A client or stakeholder decision |
| BUG | An objective implementation problem |
| HEURISTIC | An expert finding from this inspection, with no participant evidence yet. It is never weighted like research evidence; it explains *why* a signal may be happening |

Where the brief says "some participants" without a count, this audit treats it as MODERATE and says so.

**What the product already answered (do not re-propose).** V30 already responded to several of these
signals. The audit checks whether those responses work rather than proposing them again:

| Earlier signal | What V30 built | Still a problem? |
|---|---|---|
| "Projects to watch" read as something to stream | Renamed to "Projects you could join" / "Projects and production houses" | The wrong-model risk moved, see F9 |
| Home read as job-heavy and as a compressed sitemap | Five fixed modules, ordered by intent and stage | Ordering changed, visual weight did not, see F3 |
| A director wanted to keep people for later | Private Save on people (separate from Follow) | Exists, but hard to find, see F7 |
| People discovery | People is the first Discover mode, craft chips, filters, availability | Strong in Discover; weak signals elsewhere, see F6 |
| Blank screen after sending a message | Likely cause removed; not reproduced | Not reproduced again here (390 × 844, 375 × 667); unverified on an iPhone, see F12 |

**Key measurements (current build)**

| Screen | Words on screen | Of which secondary / helper text | Length | Sections |
|---|---|---|---|---|
| Home, Kiran, Find work | 321 | about 250 | 2.9 screens | 5 |
| Home, Kiran, Find people | 373 | about 286 | 2.9 screens | 5 |
| Home, Tara (actor) | 289 | about 218 | 2.9 screens | 5 |
| Home, Konark (house) | 122 | about 50 | 2.3 screens | 4 |
| Discover › People | 270 | about 216 | 3.2 screens | list |
| Role (Director of Photography) | 143 | 63 | 1.9 screens | 2 + details |
| Show interest sheet | 85 | about 50 explanatory | 1 sheet | 3 questions |
| Another person's profile | 76 | 61 | 2.2 screens | 3 |

Home carries four horizontal rails, one vertical activity list, and a helper line under almost every
section title. On a 667 px phone, Discover's chrome (title, two-line description, search, mode tabs, two
chip rows, count) uses roughly 42 % of the first viewport before the first result.

---

## 1. Research signals, triaged

| Signal | Strength | What they were trying to achieve | Probable UX problem | Supported by the product? | Smallest response |
|---|---|---|---|---|---|
| Too much text | MODERATE | Scan and decide quickly | Helper lines under every section, two-line activity rows, repeated explanations (F4) | Yes: about 75 % of Home's words are secondary | Cut and collapse copy (DO NOW) |
| Home feels overloaded | MODERATE (STRONG in V29) | Know what matters today | Same events shown in three places; four rails; big cards (F2, F3, F4) | Yes | Copy cuts, activity cap, lighter opportunity weight outside Find work |
| Home too focused on jobs | MODERATE (STRONG in V29) | See the network, not a job board | Full-bleed opportunity cards dominate even when they are not first (F3) | Yes | Opportunity cards compact unless intent is Find work |
| Directors come mainly to find people | MODERATE | Crew a project | Director craft already defaults to Find people; people cards lack context (F6) | Partly | Network context on person cards (TEST) |
| Difficulty discovering Posts | MODERATE | Browse creative work | "Work" means four things; the Home work tray has no way into Posts (F1) | Yes, a concrete dead end | "See all" on the tray, one name for the content (DO NOW) |
| People discovery not prominent enough | MODERATE | Find the right person fast | Strong in Discover; on a Find work Home people sit third (F6) | Partly | Ordering is intent-driven already; test before changing |
| Save useful people for later | WEAK now (two rounds) | Remember someone without contacting them | Save exists but only as an unlabelled header icon (F7) | Yes, discoverability | Make the existing Save findable (TEST, small) |
| Mind map of connections by craft | WEAK | Understand and navigate my network | No view of the network at all; no "worked with" for people (F8) | Yes, the need is real | Credit-based "worked with" and grouping by craft (PROTOTYPE); no graph |
| Networking meetups / events | WEAK | Reasons to meet beyond jobs | Product has no non-job reason to gather (F10) | Unclear | Validate with a post format, not a tab (TEST later) |
| "Projects to watch" wrong mental model | STRONG (V29) | Understand what a project is | Renamed; "could join" now implies a join action that does not exist (F9) | Residual | Test the label; do not rename again blind |
| Not tailored enough to a director | WEAK | Feel the product is for them | Intent lever is a small grey pill; craft-specific language is thin (F5) | Partly | Make the current intent visible (TEST) |
| Messaging permissions questioned | WEAK | Feel safe / understand who can reach me | No visible statement of who can message me (F11) | Partly | Clarify, research; no permissions system yet |
| Houses: Follow only, not Message | PRODUCT RULE | Protect houses from unsolicited DMs | Implemented correctly; profile shows Follow only | Verified | Keep |
| Blank screen after sending a message | BUG | Send a message | Not reproduced in Chromium; unverified on iOS (F12) | Unknown | Verify on a real iPhone; keep the fix |
| Visual design generally liked | MODERATE (positive) | — | — | — | Protect: changes stay inside the current visual language |

---

## Part 1. Nielsen's heuristics

### 1. Visibility of system status

Works well:
- Active tab: filled icon, green label, avatar ring (recent work).
- Follow becomes "Following"; Save fills its bookmark and the first save says where Saved lives.
- Show interest turns the role's action bar into "Interest sent"; Home cards show it too.
- Active filters show a count ("Filters · 2"); changing intent toasts "Home updated for: Find people for a project".
- Pending credits appear on Home, in Notifications and on your profile.
- Loading and error states exist for search (with Try again) and for sheets.

Problems:
- **H1.1 Where am I acting as?** For a house member the identity is in the Home header ("Konark Pictures · Acting for the house"), but not on Discover, Inbox or a profile. Saving while acting toasts that it went to your personal account, which is good; other actions rely on memory. HEURISTIC. TEST with house participants.
- **H1.2 Interest status after you leave the role.** You can see "Interest sent" on the role and its card, but there is no single place listing what you have shown interest in apart from Inbox rows that appear only when the house replies. HEURISTIC. LATER (a "Your activity" entry exists on your profile; check whether it lists interests).
- **H1.3 The intent that is shaping Home is easy to miss** (see F5).

### 2. Match between system and the real world

- **H2.1 "Work" is overloaded (F1).** "Recent work in cinematography" (posts), "Selected work" (portfolio), "Get to the work" (jobs, in the intro), "Made by us" / "Worked with" (projects and credits), "Show interest in the work". Industry people say *reel*, *stills*, *credits*, *posts*, *jobs*, *gigs*. One word for four objects makes Posts hard to find. MODERATE.
- **H2.2 "Projects you could join"** implies a join action. You actually show interest in a role on the project. "Hiring" is the true state. WEAK / HEURISTIC (F9).
- **H2.3 "Opportunities"** is general on purpose (roles, casting, collaborations). It works in Discover; on Home the actor variant "Casting and roles for you" is better language. Keep.
- **H2.4 "Interest" / "Show interest"** is clear once explained, and the role states the model ("Konark Pictures sees your profile and decides whether to message you"). Keep.
- **H2.5 "Verified credits"** is strong, industry-true and distinctive. The two-line explanation on every profile is redundant after the first read (F4).
- **H2.6 "Available"** matches the industry's "available from 15 Oct" well. Keep.
- **H2.7 "Activity that matters"** mixes your obligations (confirm a credit, review interest) with other people's news ("Meera Krishnan was credited on Monsoon Letters"). The second kind does not "matter" to most people today. HEURISTIC (F2).
- **H2.8 "Collaborations"** (Inbox filter, profile section) means unpaid or passion projects. Reasonable; confirm in research that "Collaboration" is not read as "any joint work".

### 3. User control and freedom

Works well: Back on every route; sheets close by X, swipe and Escape; Undo on withdrawing interest and
responses; Remove asks first; Follow toggles back; Edit profile asks before discarding; intent can be
changed at any time; identity can be switched from the house header.

Problems:
- **H3.1 Show interest has no draft.** Closing the sheet mid-answer loses the answers. HEURISTIC. LATER.
- **H3.2 Credits: accept is one tap and final in the UI.** Accepting puts the credit on your public profile; "Something wrong?" exists before acceptance, but no "undo accept" was found. Accepting is the intended path and is reversible through the house, so a confirmation is not justified; a short Undo toast would be. HEURISTIC. TEST.

### 4. Consistency and standards

- **H4.1 Save is not consistent across objects.** Roles show a bookmark on the card; posts show a bookmark in the action row; people can only be saved from a small header icon on their profile (not from cards, though docs/V30.md says Home people cards allow it when hiring: a documentation/implementation mismatch to settle). MODERATE with F7.
- **H4.2 Person cards differ by surface.** The Home portrait card (Follow), the Discover row (Follow / Following), the Worked-with avatar (no action) and the search row are each different. That is acceptable for different densities; the *information* differs too (availability on one, verified credits on another). HEURISTIC; harmonise the line, not the layout.
- **H4.3 Opportunity cards change size by section** (full-bleed hero on Home, compact row in Discover and on the house page). The hero on a hiring Home is the inconsistency that matters (F3).
- **H4.4 Section "See all" is inconsistent.** People, Opportunities and Projects have it; the creative-work tray does not (F1); Activity has it only when there is more.
- **H4.5 Mobile conventions:** bottom tab bar, sticky action bars, bottom sheets and horizontal rails all follow iOS/Android norms. Good.

### 5. Error prevention

- Destructive actions (remove a collaborator, withdraw) already confirm or offer Undo. Do not add more confirmations.
- **H5.1 Acting as a house while messaging or following.** A house member may act for the house without meaning to. The header label exists only on Home. HEURISTIC. TEST with houses.
- **H5.2 Posting an opportunity publicly** (Create → Looking for someone) is public immediately; a preview step exists in the composer. Keep.
- Dates and amounts are now picked and digits-only. Good.

### 6. Recognition rather than recall (the most important heuristic here)

- **H6.1 Where do posts live? (F1)** On Home they are "Recent work"; in Discover they are the fourth mode, "Posts"; on a profile "Posts" sits under "Selected work". There is no path from Home's tray to all posts. MODERATE.
- **H6.2 Where did my saved person go? (F7)** Saved lives on your own profile, reached by a small "Saved" link near the top; you are told once, on the first save. HEURISTIC + WEAK.
- **H6.3 Where do I act on things? (F2)** The same item (3 people interested; a credit to confirm) is in Home's Activity, Inbox and Notifications. Which is the source of truth is not clear. MODERATE.
- **H6.4 How do I find someone I saw earlier?** Search covers people; there is no "recently viewed". Follow or Save are the memory tools. LATER; test first.
- **H6.5 Where is my network?** There is no Following or Followers list and no way to browse your network (F8). WEAK as a request, real as a gap.

### 7. Flexibility and efficiency of use

- One Home serves every intent through ordering, titles and ranking (`src/domain/relevance.ts`). That is the right architecture; do not build persona Homes.
- **H7.1 The lever is hidden (F5).** The whole personalisation model hangs on a small grey "Find work ▾" pill.
- **H7.2 Directors:** the director craft defaults to Find people, so a director's Home leads with people. But the person card offers only Follow, no craft quick filter on Home, and no network context, so a director still has to go to Discover to do real crewing. MODERATE (F6).
- **H7.3 Houses:** the slate Home ("Around your work", Open roles, Our slate, "For roles you haven't opened") is efficient and focused. Keep.
- **H7.4 Accelerators that exist:** inline Inbox actions (Review, Confirm 12 Oct), Discover craft chips, "My crafts". Good.

### 8. Aesthetic and minimalist design (major focus)

The visual language is strong and liked; the issue is **density and repetition**, not style.

- **H8.1 Helper line under every section title** ("Based on your craft, location and availability.", "Being made now, hiring first.", "Your craft, and the people who hire.", "From people in your craft, then the community."). Each is sensible alone; together they double the reading load. MODERATE (F4).
- **H8.2 Activity rows run to three lines** with an instruction line ("Review them and choose who to message", "Confirm or flag it on your profile"). The action is already implied by the row and its chevron. MODERATE.
- **H8.3 The opportunity hero card** takes about 70 % of the first viewport on Find work Homes. Beautiful, but it reads as "job board" at a glance (F3).
- **H8.4 Four horizontal rails** on one Home: most items sit off-screen, and each rail asks for a separate horizontal gesture. HEURISTIC; watch in testing before cutting.
- **H8.5 Discover's two-line description** is repeated on every mode and pushes results down. REDUNDANT.
- **H8.6 The verified-credits explanation** appears in full on every profile. EDUCATIONAL; once is enough.
- **H8.7 The Show interest sheet** opens with a 50-word, three-step explanation every time. EDUCATIONAL; needed the first time, not the fifth.

### 9. Help users recognise, diagnose and recover from errors

Works well: plain-language errors ("Couldn't send your interest. Nothing was shared.", "Search didn't load. Try again."); inline field errors in sign-up; images fall back to a placeholder.

Problems:
- **H9.1 A failed message says why but not what next** ("Couldn't send. You can't message each other."). Fine for blocks; for a network failure the text must be kept and a retry offered. HEURISTIC; verify behaviour.
- **H9.2 A disputed credit** ("You asked: … will send a corrected credit") explains the state well. Keep.
- **H9.3 Incomplete profile:** "Add your work" is a single dismissible next step. Good restraint.

### 10. Help and documentation

The product mostly explains itself through state (Interest sent, Following, Pending). Where it
explains with paragraphs, the explanation is repeated every time (credits note, interest steps, section
"why" lines, Discover description). Recommendation: **explain once, then show state**: first-use
copy in full, later a one-line version with "How this works" on tap. No new help centre, no tooltips
tour.

---

## Part 2. Mobile-specific review

| Area | Finding | Strength | Response |
|---|---|---|---|
| Thumb reach | Primary actions are low (sticky Show interest, Follow on cards, tab bar). Save, Share and notifications are top corners, which suits secondary actions | HEURISTIC | Keep |
| Bottom navigation | Clear, labelled, Create dominant; content clears the bar | Verified | Keep |
| Bottom sheets | Consistent; close by X, swipe, Escape; sticky actions above the bar | Verified | Keep |
| Touch targets | 44 px or more (accessibility pass) | Verified | Keep |
| Information density | Home and Discover are text-dense for a phone (Part 9) | MODERATE | Copy pass (DO NOW) |
| Carousels | Four rails on Home; rails hide most items; no item count | HEURISTIC | Test before cutting rails |
| Scrolling | Home is about 2.9 screens. Reasonable, but helper copy adds a full screen of reading | MODERATE | Copy pass |
| First viewport | Find work: one hero card fills it. Discover: chrome takes about 42 % on a 667 px phone | MODERATE | Compact cards outside Find work; drop Discover's description |
| Keyboard | Message field and composer pad for the keyboard; Show interest answers sit in a tall sheet | Verified for messages | Keep; test long answers on small phones |
| Persistent CTAs | Role has a sticky price + Show interest bar. Good | Verified | Keep |
| Safe areas | Respected (App mode) | Verified | Keep |
| One-handed use | Discover chip rows scroll sideways at mid-height; fine | HEURISTIC | Keep |
| Text length | Two-line titles clamp; activity rows run to three lines | MODERATE | Shorten rows |

The app does not feel like a compressed website; the risk is *reading load*, not layout.

---

## Part 3. Information architecture

**Destinations and their jobs as built**

| Destination | Intended job | What it actually contains | Clear? |
|---|---|---|---|
| Home | What matters to me now | Opportunities, projects, people, activity (obligations plus network news), creative work | Mostly; overloaded by duplicated activity and repeated copy |
| Discover | Look for something deliberately | People (with houses as a toggle), Opportunities, Projects, Posts | Clear for people and roles; Posts is easy to miss |
| Inbox | Conversations | Conversations plus interest received and credit messages, with inline actions | Mostly; overlaps Notifications |
| Notifications (bell, Home only) | What happened | Credits, replies, interest, follows | Overlaps Inbox and Home Activity |
| Profile | Who I am, my record | Identity, credits, reel, selected work, about, projects, collaborations, posts, plus private Saved and Your activity links | Clear |
| Create | Make something | Post, Looking for someone, Available for work, Start an independent project | Clear; good scope |

**Are we mixing jobs too heavily?** The mixing that hurts is **activity**: obligations (confirm, review),
conversations and social news are spread across Home, Inbox and Notifications with no single owner.
Content discovery (posts), people discovery and opportunities are reasonably separated in Discover;
on Home they are intentionally mixed (that is Home's job) and ordered by intent.

**Discover modes**

| Mode | Purpose understood? | Note |
|---|---|---|
| People | Yes | Strongest mode. Houses as a toggle chip works but hides houses from casual browsing; acceptable |
| Opportunities | Yes | Kind chips + My crafts. Good |
| Projects | Mostly | Posters with stage. "Projects" vs "Opportunities" overlap for people looking for work |
| Posts | Weak | Last mode, often cut off on narrow phones; reached from nowhere on Home |

**Smallest IA moves:** one name and a way in for posts (F1); one owner per kind of activity (F2). No
new tabs.

---

## Part 4. Home audit

### Find work Home (Kiran, Director of Photography)

| # | Section | Purpose | Primary user | Importance | Frequency | Belongs on Home? | Overlap | Copy |
|---|---|---|---|---|---|---|---|---|
| 1 | Opportunities for you (hero cards) | Paid work that fits | Anyone looking for work | High for this intent | Daily while looking | Yes, first | "Projects you could join" (hiring) | Helper line repeats the intent ("Based on your craft, location and availability") |
| 2 | Projects you could join | Productions being made, hiring | Work seekers, curious | Medium | Weekly | Yes, lower | Overlaps #1 (hiring) | "Being made now, hiring first." can go; the card says Hiring 2 |
| 3 | People in your world | People in your craft and who hire | Everyone | High | Weekly | Yes | Activity faces | Helper line can go |
| 4 | Activity that matters | Obligations + network news | Established users | High for obligations, low for news | Daily | Obligations yes; news belongs in Notifications | Inbox, Notifications | Rows run to three lines |
| 5 | Recent work in cinematography | Proof of an active community | Everyone | Medium-low | Occasional | Yes, last, small | Discover › Posts | No "See all"; "work" naming |

### Find people Home (Kiran switched to Find people for a project; directors default here)

Order: People for your next project → Activity → Projects and production houses → **Opportunities in your
craft (full-size hero cards)** → Recent work. The people-first order is right. The problem is weight:
the fourth section is still the biggest visual object on the page, so the Home still *looks* like a job
board to someone who came to hire (F3).

### House Home (Konark Pictures)

Slate hero → Around your work → Open roles → Our slate → For roles you haven't opened. Focused, 122 words,
no helper lines. This is the model of restraint the individual Home should move towards.

### Proposed priority model (no new modules)

Keep the five modules and the intent ordering. Change three things:

1. **Weight follows intent, not just order.** Opportunity hero cards only when intent is Find work (or Collaborate for collaborations). Everywhere else, opportunities use the compact row card already used in Discover and on the house page.
2. **Activity on Home = what you owe.** At most three rows of obligations (credits to confirm, interest to review, replies waiting); network news moves to Notifications. When there is nothing owed, the section shows public "Happening on Art and Artist" only for first-time users, as now.
3. **One helper line per Home, not per section.** Keep it on the first section (it explains personalisation once); drop the rest.

Whether ordering should respond to *craft* beyond intent (e.g. actors see directors and producers) is
already partly built ("Directors and producers" for actors). Do not add more craft-specific rules until
research shows a gap.

---

## Part 5. People discovery

| Surface | Strength | Gap |
|---|---|---|
| Discover › People | First mode; craft chips for all 15 crafts; availability and verified-credit count on rows; filters for city, travel, experience, language | None critical |
| Search | Covers people and houses | No recently viewed |
| Home people tray | Intent-aware titles; availability first when hiring | No reason "why this person" beyond craft and city; no craft quick filter |
| Person card | Name, craft, availability, Follow | No network context (mutuals, worked with, credited with) |
| Profile | Credits first, Follow primary, Message secondary, Save (icon) | No "worked with" on people; Save hard to find |
| Network | None | No way to browse who you follow or have worked with |

**Simplest useful response:** add *one line of network context* to person cards and profiles, derived
from data the product already trusts: verified credits. Examples, all computable today: "Worked with you
on Monsoon Letters", "Credited with Konark Pictures", "3 people you follow worked with her". This
answers "why should I look at this person" without a graph, a new tab or new data. PROTOTYPE / TEST.

---

## Part 6. Network intelligence (the need behind "mind map")

**What the participant said:** a mind map of my connections, by craft.
**What they were trying to achieve:** understand who I know, by role, and who they can lead me to.
**The opportunity:** Art and Artist has something a follower graph does not: **verified credits link
people through real projects**. That makes "who has actually worked with whom" a trustworthy signal,
distinct from LinkedIn connections or Instagram follows.

Candidate concepts, smallest first:

| Concept | Data needed | Mobile fit | Recommendation |
|---|---|---|---|
| "Worked with" on person profiles (as houses already have) | Credits (exists) | List, perfect | PROTOTYPE first |
| Network context line on person cards | Credits + follows (exist) | One line | PROTOTYPE with the above |
| Your network grouped by craft (a list with craft headings) | Follows + credits | Grouped list | LATER, after a Following list exists |
| Frequent collaborators | Credits over time | Small rail | LATER |
| Second-degree discovery ("people your collaborators worked with") | Credits graph | Ranked list | LATER; powerful for crewing |
| Connection path ("you → Meera → Rhea") | Graph | Text path | LATER |
| Visual graph / tree | Graph + layout | Poor on a phone | DO NOT build for mobile; possible web view later |

Mobile: grouped lists and one-line context. A graph belongs, if anywhere, on a large screen later.

---

## Part 7. Saving people

**Behaviour behind the request:** "I found someone useful but I'm not ready to contact them."

| Concept | Public? | Signals intent to them? | Fits the behaviour? |
|---|---|---|---|
| Follow | Yes (they are notified: "Zoya Khan followed you") | Yes, social | Partly: good for "I want to see their work", wrong for "shortlist for a job" |
| Save (exists, private) | No | No | Yes: this is exactly the private shortlist |
| Message | n/a | Yes, direct | No: too strong |
| Interest | n/a | Individual → role only | No |

**Conclusion:** the behaviour is already covered by the private Save built in V30. The gap is
**findability**, not a missing feature: Save is an unlabelled bookmark in the profile header, not on
person cards, and Saved is a small link on your own profile.

Future forms, and their implications, if testing shows Save is not enough:
- **Lists / folders** ("Gaffers for Neela Akasham"): useful for directors and houses; adds management overhead; fine as a later evolution of Save.
- **House talent pool** (shared by a house's members): a team feature that drifts towards an ATS; only with house evidence.
- Do not build a separate "Save person" feature: it would duplicate Save.

Smallest response: make Save visible where people are evaluated (a labelled control on the profile; on
cards only when the intent is Find people), and confirm in testing that people find Saved again. TEST.

---

## Part 8. Events and networking

**Need:** reasons to meet and stay in touch through Art and Artist when not job-hunting.
**Fit:** plausible (festivals, screenings, workshops and crew meetups are real in the industry) but
evidence is one participant. An Events tab would add a destination, moderation, dates, location and
RSVP logic, and pull the product towards a social platform.

Low-risk validation, in order:
1. **Ask** in the next round how participants find screenings, workshops and meetups today, and whether they would use Art and Artist for it.
2. **A post with an event shape** (date, place, a "who's going" count) in Create → Post, appearing in Discover › Posts and Home's work tray. No new tab.
3. Only with clear pull: an Event content type with its own filter in Discover.

Do not add Events to the navigation.

---

## Part 9. Copy and content density

Classification key: ESSENTIAL (needed now), SECONDARY (useful deeper), REDUNDANT (repeats the
obvious), EDUCATIONAL (first use), SYSTEM (status, error, instruction).

### Home

| Copy | Class | Recommendation |
|---|---|---|
| Section titles | ESSENTIAL | Keep |
| "Based on your craft, location and availability." | EDUCATIONAL | Keep once (first section) or move into the intent sheet |
| "Being made now, hiring first." / "Your craft, and the people who hire." / "From people in your craft, then the community." / "Other crafts, available and nearby first." | REDUNDANT | Remove |
| Activity row second lines ("Review them and choose who to message", "Confirm or flag it on your profile") | REDUNDANT | Remove; the row and chevron carry it |
| Network news rows ("X was credited on Y", "X added the project Z") | SECONDARY | Move to Notifications |
| Card meta (house, city, dates) | ESSENTIAL | Keep |
| "You're all caught up" | SYSTEM | Keep |

### Discover

| Copy | Class | Recommendation |
|---|---|---|
| "Search and explore people, opportunities, projects and work." | REDUNDANT | Remove (the tabs say it) |
| Mode-specific search placeholder | ESSENTIAL | Keep |
| "21 people" | SYSTEM | Keep |
| Row lines: craft · city, availability, verified credits | ESSENTIAL | Keep; this is the right density |

### Profile (another person)

| Copy | Class | Recommendation |
|---|---|---|
| "Issued by the production and confirmed by Vikram. No one can add their own credits." | EDUCATIONAL | Collapse to a one-line "Verified credits" with "How credits work" on tap, after first view |
| "2 verified credits · 14 years active" | ESSENTIAL | Keep |

### Role and Show interest

| Copy | Class | Recommendation |
|---|---|---|
| "Konark Pictures sees your profile and decides whether to message you" | ESSENTIAL | Keep |
| About + requirements | ESSENTIAL | Keep |
| "Art and Artist never charges to apply or audition. Report" | SYSTEM (trust) | Keep |
| Three-step interest explanation (about 50 words) | EDUCATIONAL | Full the first time; afterwards one line + "How interest works" |
| "Everything below is optional. Nothing needs uploading: paste a link if you have one." | SYSTEM | Keep, shorten to one sentence |

### Intent sheet

| Copy | Class | Recommendation |
|---|---|---|
| "Home puts what matters for this first. Everything else is still in Discover." | EDUCATIONAL | Keep (this is where it belongs) |

---

## Part 10. Persona and intent differences

| Perspective | What they come for | How the product serves it | Where it assumes the same goal |
|---|---|---|---|
| Actor | Casting, directors | "Casting and roles for you", "Directors and producers" | Credits model assumes a production issues every credit; theatre and ad work may not fit (research question) |
| Cinematographer | Roles, crew to work with, reel | Strong: roles, people in craft, reel and credits | None major |
| Director | Crew and cast, projects | Defaults to Find people; people first | Opportunity hero cards still dominate; person cards offer only Follow; no network context |
| Editor | Post work, collaborators | Craft roles exist since V30 | Home work tray ("recent work") is image-led; editors' work is time-based |
| Production designer | Projects being made, houses | Projects rail; adjacent crafts | Little beyond the shared model; fine |
| Freelancer (any craft) | Availability, next job | "Available for work" in Create; availability on cards | Good |
| Production House | Hire, run the slate, issue credits | Dedicated slate Home; Follow-only profile (rule) | Acting identity visible only on Home (H1.1) |

Conclusion: the shared model with intent ordering is right. The gaps are about **weight** (job cards
on non-job Homes) and **context** (why this person), not about separate screens.

---

## Findings register

Each finding: issue · evidence · strength · underlying need · heuristics · why it matters · response · decision.

**F1. "Work" means four things, and posts have no way in from Home**
- Evidence: signal "difficulty discovering Posts"; product: Home tray "Recent work in …" has no "See all"; Discover calls them Posts (fourth mode); profiles have "Selected work" and "Posts"; the intro says "Get to the work" about jobs.
- Strength: MODERATE (signal + a concrete dead end in the product).
- Need: browse creative work from people in my craft; know where it lives.
- Heuristics: 2, 4, 6.
- Why: content that cannot be found does not make the network feel alive, and the naming makes Discover harder to predict.
- Response: add "See all" on the Home tray, opening Discover › Posts filtered to the craft; use one term for posts across Home and Discover (e.g. title the tray "Posts in cinematography"). No new placement.
- Decision: **DO NOW**.

**F2. The same event lives in three places**
- Evidence: "3 people interested" appears in Home Activity, Inbox and Notifications; credits appear in Home Activity, Notifications, Inbox and Profile. Signal: Home overloaded.
- Strength: MODERATE.
- Need: one place to see what needs me, one place to talk, one log of what happened.
- Heuristics: 6, 8, 4.
- Why: duplication adds reading load and makes the user wonder which copy is the real one.
- Response: smallest step: Home Activity shows only what you owe (cap three rows, one line each, link to the rest); network news goes to Notifications. A full notification restructure is not proposed.
- Decision: **DO NOW** (the cap and the news move); **TEST** anything larger.

**F3. Opportunity cards dominate Homes that are not about work**
- Evidence: V29 finding (Home read as job-heavy even when hiring); current signals "Home too focused on jobs", "directors come to find people"; product: full-bleed hero cards on Find people Homes (fourth section, still the largest object).
- Strength: MODERATE to STRONG.
- Need: Home should look like the job I came to do.
- Heuristics: 8, 7, 2.
- Why: first impressions decide whether a director thinks the product is for them.
- Response: hero cards only for Find work (and Collaborate); compact row cards elsewhere. Same data, same order.
- Decision: **DO NOW** (small, uses an existing card).

**F4. Repeated explanatory copy**
- Evidence: signal "too much text"; metrics: about 75 % of Home's words are helper or secondary text; the same explanations repeat on every profile, every Show interest, every Discover mode.
- Strength: MODERATE.
- Need: scan and decide without reading paragraphs.
- Heuristics: 8, 10.
- Why: reading load is the main cause of "overloaded" in an otherwise clear layout.
- Response: the Part 9 cuts: one helper line per Home, one-line activity rows, remove Discover's description, collapse the credits and interest explanations after first use.
- Decision: **DO NOW**.

**F5. The intent lever is nearly invisible**
- Evidence: one participant did not feel the product was tailored to a director; product: personalisation hangs on a small grey "Find work ▾" pill.
- Strength: WEAK (+ HEURISTIC).
- Need: feel the product understands what I'm here for, and change it easily.
- Heuristics: 1, 7.
- Why: if people do not notice intent, the main personalisation investment is wasted.
- Response: test whether participants notice and use the pill; if not, show the current intent as text the first time Home loads ("Showing: Find work ▾").
- Decision: **TEST**.

**F6. Person cards give no reason to look**
- Evidence: signals "directors come to find people", "people discovery not prominent enough"; product: cards show craft, city, availability, Follow; no network context anywhere for people.
- Strength: MODERATE.
- Need: find relevant collaborators fast and trust why they are suggested.
- Heuristics: 7, 6, 2.
- Why: crewing is the director's and the house's core job; context turns a directory into a network.
- Response: one network-context line from verified credits ("Worked with you on …", "Credited with Konark Pictures", "3 people you follow worked with her").
- Decision: **PROTOTYPE / TEST**.

**F7. Saving people exists but is hard to find**
- Evidence: one participant this round, one director in V29 (two rounds, single voices); product: Save is an unlabelled header bookmark on profiles only; the V30 doc says Home cards allow it when hiring, the build does not.
- Strength: WEAK to MODERATE.
- Need: keep someone for later without contacting them.
- Heuristics: 6, 4.
- Why: building a second "save person" would duplicate a feature people cannot find.
- Response: make the existing Save visible (labelled on profiles; on cards only for Find people); settle the doc/build mismatch; test retrieval from Saved.
- Decision: **TEST** (no new feature).

**F8. No way to see or use your network**
- Evidence: one participant's mind-map suggestion; product: no Following/Followers lists, no "worked with" for people.
- Strength: WEAK (need plausible, solution unproven).
- Need: understand and navigate my professional network.
- Heuristics: 6, 7.
- Response: start with F6 (credit-based context) and "Worked with" on person profiles; grouped network list later; no graph on mobile.
- Decision: **PROTOTYPE** ("worked with") / **LATER** (network list) / **DO NOT IMPLEMENT LITERALLY** (mind map).

**F9. "Projects you could join" implies an action that does not exist**
- Evidence: V29 "Projects to watch" confusion (fixed); product: "join" is not an action; you show interest in roles.
- Strength: HEURISTIC (residual of a STRONG finding).
- Need: understand what a project is and how to get on it.
- Response: test labels such as "Projects hiring" / "Being made now" with participants before renaming.
- Decision: **TEST**.

**F10. Events and meetups**
- Evidence: one participant.
- Strength: WEAK.
- Need: reasons to meet beyond jobs.
- Response: research question first; then an event-shaped post. No tab.
- Decision: **LATER** / **DO NOT IMPLEMENT LITERALLY** (as a tab).

**F11. Who can message me is not visible**
- Evidence: one participant questioned messaging permissions; product rule: houses have Follow only; anyone can message an individual from their profile; an empty thread explains once.
- Strength: WEAK + PRODUCT RULE.
- Need: feel safe and in control of who reaches me; understand why I can or cannot message.
- Response: research what worried them (spam? houses? hierarchy?); meanwhile keep Block clear. No permissions system.
- Decision: **TEST** (research), **DO NOT IMPLEMENT** permissions yet.

**F12. Blank screen after sending a message**
- Evidence: earlier BUG report; V30 removed the likely cause; re-tested here on 390 × 844 and 375 × 667 (message appears, page does not jump, no errors). Not tested on a real iPhone.
- Strength: BUG (status: unverified on iOS).
- Response: verify on iOS Safari and the installed app in the next round; if it recurs, capture the console.
- Decision: **DO NOW** (verification only).

**F13. Network news on Home**
- Evidence: product: "Meera Krishnan was credited on Monsoon Letters", "Nandini Rao added the project Kaaval" under "Activity that matters"; signal: Home overloaded.
- Strength: HEURISTIC + MODERATE (overload).
- Response: part of F2 (move to Notifications).
- Decision: **DO NOW** with F2.

**F14. Acting identity is only visible on Home (houses)**
- Evidence: product inspection.
- Strength: HEURISTIC.
- Response: test with house members whether they lose track of who they are acting as.
- Decision: **TEST**.

**F15. Show interest loses answers when closed; accept credit has no undo**
- Evidence: product inspection.
- Strength: HEURISTIC.
- Response: an Undo toast after accepting a credit; draft retention later.
- Decision: **LATER** (low risk today).

---

## Final prioritisation

### A. Fix now (strong or moderate evidence, or an obvious problem; all small, inside the current design)

1. **Copy pass** (F4): one helper line per Home; one-line activity rows; remove Discover's description; collapse the credits and interest explanations after first use.
2. **Activity on Home = what you owe** (F2, F13): cap at three one-line rows; network news to Notifications.
3. **Opportunity weight follows intent** (F3): hero cards only for Find work / Collaborate; compact cards elsewhere.
4. **A way into posts** (F1): "See all" on Home's tray to Discover › Posts; one name for posts.
5. **Verify the message bug on a real iPhone** (F12).

### B. Prototype / validate

1. Network-context line on person cards and "Worked with" on person profiles, from verified credits (F6, F8).
2. Save visibility for people, and retrieval from Saved (F7).
3. Intent visibility ("Showing: Find work ▾") and whether people use intent at all (F5).
4. Project label comprehension ("could join" vs "hiring") (F9).
5. Acting-identity awareness for house members (F14).
6. Messaging-safety worries (F11).

### C. Later

1. Your network grouped by craft (after a Following list exists).
2. Second-degree discovery and connection paths for crewing.
3. Saved lists / folders.
4. Event-shaped posts, if research shows pull (F10).
5. Show interest drafts; Undo after accepting a credit (F15).
6. Recently viewed people.

### D. Do not implement literally

| Suggestion | Useful need | Why not literally | Better response |
|---|---|---|---|
| Mind map of connections | Understand and navigate my network | Graphs are poor on phones and need dense data | Credit-based "worked with", grouped lists; graph only on web later |
| Events tab | Reasons to meet | A destination with moderation and RSVP for one voice; drifts social | Research question, then an event-shaped post |
| "Save person" as a new feature | Shortlist without contact | Already exists (private Save) | Make Save findable |
| Persona-specific Homes ("a director Home") | Feel the product is for me | Splits the product; intent ordering already exists | Weight follows intent; visible intent |
| Messaging permission system | Feel safe | No evidence of misuse; the rule is clear for houses | Research the worry; keep Block clear |
| Removing Home sections to fix overload | Less to read | Overload comes from copy and duplication, not module count | Copy pass and activity cap |

---

## Also provided

### 1. Top 5 systemic UX problems

1. Explanations repeat everywhere instead of appearing once (copy density).
2. Activity has no single owner (Home, Inbox, Notifications).
3. Visual weight contradicts intent (job hero cards on non-job Homes).
4. "Work" names four different things; posts have no entry from Home.
5. People suggestions carry no network context, so discovery feels like a directory.

### 2. Top 5 smallest changes likely to help most

1. Delete the per-section helper lines (keep one per Home).
2. One-line activity rows, owed items only, cap of three.
3. Compact opportunity cards outside Find work.
4. "See all" from Home's work tray into Discover › Posts.
5. Remove Discover's two-line description.

### 3. Features not to add on current feedback alone

Mind map; Events tab; separate "save person"; persona Homes; messaging permissions; Followers/Following
screens as a social feature; notification restructuring beyond the activity cap; more Home modules; more
feeds.

### 4. Research questions for the next round

1. When you open Art and Artist, what do you expect to see first, and does Home match it? (by declared intent)
2. Did you notice the intent pill? What did you think it did? Did you change it?
3. Find a gaffer available in Hyderabad you could trust: how do you decide whom to contact? What would make you more confident?
4. You found someone interesting but aren't ready to message: what do you do? (observe Follow vs Save; can they find Saved again?)
5. Where would you look for creative work posts from people in your craft?
6. What does "Projects you could join" mean to you? How would you get on one?
7. Who should be able to message you, and what worried you about messaging?
8. How do you find screenings, workshops and meetups today? Would you use Art and Artist for that?
9. How do you keep track of people you've worked with? What do you need from that list?
10. Credits you've done that no production would issue (theatre, ads, independent work): how should those appear?

### 5. Where more behavioural evidence is needed

Intent usage; whether network context changes whom people follow or contact; Save vs Follow behaviour;
Posts browsing behaviour; house members' identity switching; whether Home is opened daily or only after
notifications; real-device messaging (iOS).

### 6. Features that may be solving the wrong problem

- **Home network news under "Activity that matters":** solves "the community feels alive"; costs focus for people who came to act.
- **"Projects you could join" on Find work Homes:** largely duplicates the opportunities above it.
- **Intent as a hidden control:** solves personalisation for people who never discover it.
- **Explanations on every view:** solve first-use comprehension on every use.

### 7. Drift watch

| Drift | Where it shows | Guard |
|---|---|---|
| Generic jobs marketplace | Full-bleed job cards lead most Homes; pay on cards | Weight follows intent; credits and people stay first-class |
| Instagram clone | Discover › Posts grid; like counts on posts | Keep posts subordinate (contained tray, deliberate mode); avoid feeds and counts as rewards |
| ATS | House "For roles you haven't opened", interest review queues | Keep houses deciding by people and work, not pipelines and stages; no candidate scoring |
| Generic social network | "X followed you", follower notifications, network news | Keep social signals quiet; make relationships about work (credits, projects) |

### 8. Where Art and Artist can be more distinctly useful

- **Verified collaboration as the network.** "Worked with" and "credited with" are trustworthy because productions issue credits. No general network has this.
- **Credit-backed search.** "Cinematographers with verified feature credits in Telugu, available in November" answers a real crewing question.
- **Project-shaped discovery.** "Who worked on Monsoon Letters" is how the industry actually finds people.
- **Availability plus credibility together** on every person card: the two things a director checks first.
- **A professional record that travels.** The verified credits list as the reason to keep a profile current.

---

## Implementation record: high-confidence pass (F1, F2, F3, F4, F13; F12 verification)

Only the DO NOW findings were implemented. F5 to F11, F14 and F15 are unchanged and still need
validation. The production house Home is unchanged (slate, Around your work, Open roles, Our slate;
Follow only, no Message on public house profiles).

| Finding | Change | Where |
|---|---|---|
| F4 copy | One helper line per Home, only on the first section (`Context` shows `why` for the lead section only). Removed: "Being made now, hiring first.", "Your craft, and the people who hire.", "From people in your craft, then the community.", "Other crafts, available and nearby first.", "Your craft and city, then credible professionals.", "Credits issued, projects starting, people becoming available." Card metadata and tier notes kept. | `src/screens/home/HomeScreen.tsx` |
| F2 / F13 activity | "Activity that matters" is now "Waiting on you": credits to confirm, interest to review, replies waiting. One line per row, max 3 rows, no instruction lines; "See all" (to Notifications) appears if more than 3 exist. Blocked people never appear. Network news (credited on, added a project, available) moved to Notifications › "From your network" (5 rows + See all to the existing network screen). New people who owe nothing still see "Happening on Art and Artist" (3 rows). | `HomeScreen.tsx`, `src/screens/sheets/Sheets.tsx` |
| F3 weight | Large opportunity cards only for Find work and Collaborate. Find people for a project, Grow my network and Just exploring use the existing compact `RoleRow` (Discover, house pages), max 3, See all to Discover › Opportunities. Same data, same order. | `HomeScreen.tsx` |
| F1 naming | Home tray "Recent work in …" is now "Posts in …" / "Posts from the community". Profile "Selected work" is now "Portfolio" ("Showreel and portfolio" in Edit profile, "Add to your portfolio"). Intro card "Get to the work" (jobs) is now "Find your next role". Model: Posts (social), Portfolio (stills/reel), Projects (productions), Opportunities (roles). | `HomeScreen.tsx`, `ProfileScreen.tsx`, `EditProfile.tsx`, `FirstHome.tsx`, `Entry.tsx` |
| F1 entry | The Home posts tray title is a See all link (same pattern as every Home section) into Discover › Posts, narrowed to the viewer's craft. Discover › Posts gained the same craft chip row as People (only crafts that have posts; "All crafts" clears it). Posts' structure is unchanged, so an event-shaped post can still be tested later. | `src/App.tsx`, `src/screens/discover/DiscoverScreen.tsx` |
| F4 Discover | Removed "Search and explore people, opportunities, projects and work." First result moves up 39px (352 → 313 at 390 × 844). | `DiscoverScreen.tsx` |
| F4 credits | "Issued by productions, confirmed by {name}." plus "How credits work", which opens the full explanation in place (`HowItWorks`, aria-expanded). Credit logic unchanged. | `ProfileScreen.tsx`, `src/ui/primitives.tsx` |
| F4 interest | Full three steps the first time. Once the person has shown interest in another role: "{House} sees your profile and decides whether to message you." plus "How interest works". Optional-fields line shortened to "All optional. Paste a link if you have one." Interaction model unchanged. | `Sheets.tsx` |
| F12 | Not reproduced in Chromium (mobile emulation) at 375 × 667, 390 × 844, 393 × 852, 430 × 932: message shown, no page jump, no errors. No WebKit or physical iPhone was available, so iOS Safari and the installed app remain unverified. No fix was made. | |

Measured (Chromium, App mode, 390 × 844; same at other sizes):

| Screen | Words before → after | Helper words before → after | Large opportunity cards |
|---|---|---|---|
| Kiran, Find work | 321 → 262 | 41 → 7 | 6 → 6 |
| Kiran, Find people | 373 → 263 | 40 → 0 | 6 → 0 |
| Tara, Find work | 289 → 228 | 27 → 7 | 4 → 4 |
| House (Konark) | 122 → 122 | 0 → 0 | n/a |
