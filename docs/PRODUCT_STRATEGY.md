# Ana: product strategy for the V2 prototype

This document is the reasoning behind the prototype in `src/`. It reviews the context we inherited
(stakeholder responses, the feed-to-relevance pivot, the Frame 11 Home exploration) and states what we
kept, what we changed and why.

---

## 1. The core product promise

> **Find the right work. Prove the work you've done.**

Ana is where film and entertainment professionals get matched with legitimate work and collaborators,
and where their professional record is trustworthy because the people who made the films confirm it.

Two things make that promise defensible, and every surface should reinforce them:

| Pillar | What it means in the product |
| --- | --- |
| **Legitimate opportunity** | Official casting calls and crew jobs come only from verified production houses. Peer collaborations are welcome but are always labelled as peer, never dressed up as official. Nobody pays to apply. |
| **Authoritative identity** | Official credits are issued by production houses, not self-claimed. Portfolio, reels and self-described projects sit alongside credits but are visibly a different kind of evidence. |

Social posting exists because working people like to share work and moments from set. It is a supporting
layer that feeds identity and relationships. It is not the reason anyone opens Ana.

For the other side of the market, the promise reads: **"Find credible people for this role, fast, and
talk to them in context."**

---

## 2. What each destination is for

| Destination | Job to be done | The question it answers | What it is not |
| --- | --- | --- | --- |
| **Home** | A short, finite briefing of what is professionally relevant to me right now. | "Is there anything I should act on?" | An endless feed, a dashboard of every module, a notifications list. |
| **Discover** | Search-first exploration of the whole ecosystem: opportunities, people, projects, collaborations, and posts from people I follow. | "What else is out there?" / "Find me X." | Another personalised feed. It is the breadth layer. |
| **Create** | Put something into the network: a post (text, images, video) or a structured collaboration. Persona-aware. | "What do I want the industry to know?" | A content-type picker. One composer per intent, not per media type. |
| **Inbox** | Professional conversations, each anchored to the role, job, collaboration, project or credit that started it, plus interest received on my collaborations. | "Who needs a reply, and about what?" | Context-free DMs. |
| **Profile** | My professional identity: role, availability, credits, reel, portfolio, projects, collaborations. Posts last. Also a private "only you see this" strip for Saved and My responses. | "Why should someone hire or work with me?" | An Instagram grid with a follower count as the headline. |

Notifications live behind the header bell and contain only things **addressed to me** (a credit added
to my profile, a production replied to my response, someone showed interest in my collaboration).
Things **about other people** belong in From Your Network. Keeping that split stops the two from
duplicating each other.

---

## 3. What I would change or challenge

These are the changes the prototype makes, in rough order of impact.

1. **Home must be finite.** The feed problem was not only "posts at the top", it was infinity. Home now
   ends with a caught-up state. Latest Posts shows up to three, then hands off to Discover → Following.
   A finite Home is a stronger positioning signal than any visual choice.

2. **The Frame 11 hero spends the first viewport on a greeting.** "Good evening, Kiran / Director of
   Photography · Hyderabad" tells Kiran nothing new. The header keeps the cinematic feel but becomes
   shorter and does a job: it shows **availability**, the single input that most changes what For You
   recommends, and lets you change it in one tap. The header also drops the `+` and avatar buttons,
   which duplicated the Create and Profile tabs.

3. **For You cards must explain themselves.** Each card carries a match line ("Your role · 12 km ·
   your dates are free") and a deadline. Relevance you cannot see reads as random. The first card
   is larger, the next one peeks so the carousel reads as a set, and the rail ends in a "See all in
   Discover" card rather than an arbitrary dot count.

4. **Trust must be visible in the card structure, not just a tag colour.** Official opportunities lead
   with the verified production house and full-bleed production imagery. Collaborations lead with the
   person who posted them, use a quieter framed layout and say "Peer collaboration". You should be able
   to tell them apart at thumbnail size, in greyscale.

5. **"Available for work" is a profile state, not just a post.** Posting availability as a
   collaboration card is right for broadcasting it, but availability also has to drive recommendations,
   show on the profile and expire. In the prototype, publishing an Available collaboration also sets
   your profile availability, and the Home header reflects it. One source of truth.

6. **Portfolio work comes from the same composer.** Adding a still or reel is the most
   credibility-building thing an individual does, and it generates the richest network events. Rather
   than a third Create path, the post composer offers "Also add to portfolio" whenever media is
   attached. One composer, two outcomes.

7. **From Your Network is ranked and grouped, not chronological.** Credits outrank projects, projects
   outrank availability, availability outranks portfolio updates. Several people credited on the same
   title collapse into one event. It shows at most five items on Home.

8. **Discover is search-first.** The search field is the headline of the screen. Browse entry points are
   generated from real taxonomy (crafts, cities, open opportunities, recently added projects), never
   editorial picks we cannot staff.

9. **Inbox threads carry a context chip and an owner.** Organisation-owned threads (a production's
   casting team) are marked as such. Interest received on collaborations with DMs off appears as a
   review queue at the top of Inbox; the creator initiates the conversation.

10. **No fake pipeline states.** Responding to a job produces a record ("You sent your profile,
    reel and 3 answers on 29 Sep"). We never show Shortlisted / Rejected, per the stakeholder decision.

11. **Production-house Home should be a workbench, not a feed.** Responses waiting per active role,
    roles closing soon, credits to confirm. It shares every component but not the hierarchy. (Designed
    here, scheduled after the individual flows.)

What I kept deliberately: the five-tab navigation. The journeys support it: the two highest-frequency
jobs (check what is new, reply to people) are Home and Inbox; Create earns the centre because
collaborations are a core supply source; Discover absorbs everything Home deliberately leaves out.

---

## 4. Information architecture

```
Home (finite briefing)
├── Header: Ana · notifications bell
├── Status strip: greeting + availability (tap → Availability sheet)
├── For You            → Opportunity detail → Respond / Message / Show interest
├── From Your Network  → Profile · Credit · Project · Collaboration
├── Latest Posts (≤3)  → Post detail · "More in Discover → Following"
└── Caught up

Discover
├── Search (people, roles, projects, collaborations, posts)
├── Scope: All · Opportunities · People · Projects · Collaborations · Following
├── Browse by craft (taxonomy)            → filtered People
├── Open opportunities near you (filters) → Opportunity detail
└── Recently added projects               → Project

Create (sheet, persona-aware)
├── Individual: Post · Collaboration (Looking for someone / Available for work)
└── Production house: Casting call · Crew job · Project · Post

Inbox
├── Interest received (collabs with DMs off) → review profiles → start conversation
├── Filters: All · Productions · Collaborations
└── Conversation (pinned context card, org ownership, permissions)

Profile (own)
├── Identity: role, location, experience, languages, availability
├── Only you: Saved · My responses · My collaborations
├── Overview: showreel, about, top credits
├── Credits (official, production-issued; report incorrect)
├── Portfolio (stills, reels) · Projects (self-described)
└── Posts

Notifications (header sheet): addressed-to-me events only
```

Child/minor profiles never appear in Discover people results, For You, or network events, and cannot be
messaged. The guardian is the operational account. The prototype has no minor data, and the IA has no
surface that would contradict this.

---

## 5. Individual Home hierarchy

| # | Block | Weight | Rules |
| --- | --- | --- | --- |
| 0 | Header | Light | Wordmark, bell with unread dot. Collapses into a blurred bar on scroll. |
| 1 | Status strip | Medium | Greeting, role · city, availability pill. For a new user: a "sharpen your matches" prompt instead. |
| 2 | **For You** | **Heaviest** | Horizontal snap carousel of 3–8 items, hero-sized first card, visible trust type, match reason, deadline, save. Ends with "See all N in Discover". Fewer than 3 matches: show what exists plus an honest widen-your-search card. |
| 3 | **From Your Network** | Medium | Up to 5 ranked, grouped events. Rich rows only for media events. Empty: transforms into "People in your craft nearby" (generated), or disappears for returning users with nothing new. |
| 4 | Latest Posts | Light | Up to 3 compact posts. Hidden entirely when there are none. Link to Following. |
| 5 | Caught up | Minimal | Finite end. |

---

## 6. Assumptions made to start

- **Market:** India-first (Hyderabad, Mumbai, Chennai, Kochi), multilingual productions, ₹ compensation.
- **Platform:** iOS-first. The prototype is a React web app in an iPhone-sized frame (393 × 852) so it can
  be evaluated in any browser; components map 1:1 to native equivalents.
- **Theme:** dark, warm, cinematic by default. A light theme is not in scope for this iteration.
- **Recommendation inputs exist:** role(s), city and travel radius, availability dates, experience,
  languages. Match reasons are derived from these.
- **Verification states exist** for production houses and identities, per the stakeholder document.
- **Imagery:** no licensed media is available in this environment, so the prototype renders procedural
  "cinematic stills" (seeded, per project). Every media component accepts a real image URL, and missing
  media has its own designed state.
- **Primary sample user:** Kiran Varma, Director of Photography, Hyderabad, 11 years. A second persona
  (Tara Menon, actor, Mumbai) demonstrates that For You changes by profession.
- **No backend.** State is local and resets on reload. A prototype control panel (outside the phone)
  switches scenarios: new user, loading, offline, publish failure.

---

## 7. What this iteration builds, and what comes next

**Built:** the navigation shell, Individual Home at full fidelity, opportunity detail with all four
response models, Create (post and collaboration), Discover, Inbox with interest review, Profile with
credits and a private workspace, notifications, availability, and the loading / empty / error /
offline / failed-publish states. See the README for the scenario controls.

**Next, in priority order:**

1. **Production-house Home (workbench).** Same components, different hierarchy:
   - *Needs you:* new responses per active role, with counts and the oldest waiting time.
   - *Active roles:* each role with its own audition location and closing date (stakeholder change
     for page 9), responses, and a one-tap "Share role".
   - *Credits to confirm:* crew and cast on wrapped projects who don't have a credit yet.
   - *Talent you viewed recently*, for continuity between sessions.
   - Create becomes: Casting call · Crew job · Project · Post. Publishing an official role requires
     verification; unverified houses see the verification path instead of the composer.
2. **Response review for productions:** private shortlist, direct contact without a shortlist,
   role-specific question answers side by side. No status is ever shown back to the applicant.
3. **Guardian accounts:** guardian-operated profiles for minors, never searchable, never messageable,
   with privacy controls that state clearly whose settings are being changed.
4. **Onboarding:** progressive, opportunity-first (stakeholder page 5). Role and city are enough to
   show For You; everything else is asked for in context, as the "Sharpen your matches" card does.
