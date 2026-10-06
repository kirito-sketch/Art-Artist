# Home, Discover, Search and Spotlight: review of the designer proposal

Status: **proposal for approval.** Nothing in the prototype has changed. Frozen rules (credits, house permissions, Interest, messaging, role lifecycle, events V1) are untouched by everything here.

## 0. What exists today (audit)

| Surface | Current version | District version |
| --- | --- | --- |
| Home | Composed by intent (`homeOrder`): Opportunities for you, People in your world, Happening on Art and Artist, Projects, Posts in your craft, Out this Friday, one event, one completion prompt | Location header and 5 tiles (Events, Projects, People, Opportunities, Reviews), Spotlight (auto-advancing carousel, 5 projects), completion prompt, New work in your craft (3 posts), Events (3, ranked), Out this Friday, Continue where you left off, Picked for you (Free this month, Crews forming, projects in your language), Camera crew near you (4 people), end |
| Discover | Search field and **type tabs**: Posts, People, Opportunities, Projects, Events. Reviews are reached through Projects' "Out this week" and "Top rated" filters, and from Home | Search field, Saved, and the **posts grid only**. No type switching. Tiles on Home open a separate "browse" page per type |
| Search | Inside Discover. Typing shows results grouped across People, Projects and Opportunities, and "See all" narrows to one | Same field. "See all" pushes a separate browse page |
| Spotlight | n/a | **Rule-based, not hand-curated**: shared non-independent projects with artwork, sorted by being made now, then house in your city, then year. Projects only |

**Findings**

1. **The navigation gap is real, but it's District-only, and it comes from having two destinations per type.** A Home tile opens a pushed "browse" page. Discover has no type switch. Going from People to Opportunities means Back → Home → tile.
2. **District Home is missing the core professional job.** There's no "Opportunities for you" section. For someone looking for work, roles only appear as a "Looking for…" line on spotlight cards and as the "Crews forming" collection. This conflicts with the stakeholder principle "core professional workflow comes first".
3. **Duplication on District Home:**
   - "Picked for you › Free this month" and "Camera crew near you" use the same filter (your department, your city), so they show the same people.
   - Spotlight (projects being made), "Crews forming" and "Projects in your language" overlap.
4. **Spotlight fails the "if it disappeared" test today.** The user loses five project posters that mostly reappear in Crews forming and Discover › Projects. It's a nice-looking carousel without a distinct job.
5. **The craft logic is hard-coded in more than one place:** the `DEPT` map in `DistrictHome.tsx` and `FAMILIES` in `data/crafts.ts`. That is the actual scalability risk, not hand curation. `CraftDef` already carries `domain: 'film' | 'art'`, which is the right seed for growth.

---

## 1. Debate: content types inside Discover

**Agree:** Discover must let you switch type. Exploring is moving sideways between kinds of things; making people go back to Home to change type is a navigation bug.

**Disagree with part of the framing:** the distinction "Home categories = launch points, Discover categories = switching" is right about *entry*, but it shouldn't mean two *destinations*. Today a tile opens a different page from the one Discover would show. That's the duplication.

**Better architecture:** **one destination per content type: Discover with that type selected.** Home tiles become shortcuts into it. No separate browse pages.

### The questions

1. **Should every Home category exist inside Discover?** Yes, every tile maps to exactly one Discover type, so there's never a type you can only reach from Home. The reverse doesn't hold: Discover can have a type that isn't a tile (Posts).
2. **Is a horizontal chip/tab row right?** Yes: one compact, scrollable row under the search field, with the selected chip filled. Current version already has this (icon tabs); District gets the compact chip form. No category grid in Discover.
3. **A default "For you" view?** **No, not by that name.** "For you" is Home's job, and a mixed personal feed in Discover would duplicate Home and Spotlight. Discover's default is **Posts**: the visual wall of work, lightly personalised (your craft first, then wider). It's what District Discover already is, and "Posts" is the existing frozen name ("work" is never the generic word).
4. **Too filter-heavy?** It would be with two persistent rows. Rule:
   - the type row is the only persistent row;
   - each type keeps its existing facet bar (one bar, at most two visible facets plus "Filters"), shown only inside that type;
   - Posts has one facet (craft).
5. **Should Search be separate from Discover?** **No separate surface in V1.** The bottom bar is fixed (Home, Discover, Create, Inbox, Profile), and a fifth destination would cost more than it gives. Search is a *mode* of Discover: focusing the field shows results as you type.
6. **When content types grow?** A content type earns a chip only if it has its own browsing job and real supply. Otherwise it's a filter or sort inside a parent. For example: "Out this week" is a Reviews view; "Shows" for Fine Arts would be a kind of Project or Event. Cap: about 7 chips. Industries are never chips (see §8).
7. **Active state and history:**
   - Switching chips replaces the view; it doesn't push history.
   - Discover remembers the last chip, its scroll and its query while the app is open (the tab stays mounted, as today).
   - A Home tile switches to the Discover tab with that chip selected.
   - Opening an item pushes it; Back returns to the same chip, scroll and query.
8. **Searching while in People:**
   - **Scoped to People**, with a first row "Search all of Art and Artist for '…'".
   - From Posts (the default), search is global and grouped, as today.
   - The search field's placeholder names the scope.
9. **Does switching chips keep state?**
   - The **query carries over** (re-run in the new type).
   - **Filters are per type** and remembered per type for the session. They differ by type (a People "Available" filter means nothing for Events), so they can't carry over.
10. **A better architecture?** Yes, the one above, plus a **content-type registry**: one list that drives Home tiles, Discover chips, search groups and which types Spotlight may use. Adding a type is one entry, not edits across four screens.

## 2. Responsibilities

The proposed model is close; I'd sharpen it to keep each surface honest:

| Surface | Job | Test |
| --- | --- | --- |
| **Home** | "What needs me, and what's worth knowing, today." Short, personal, finite, changes daily. Leads with your own professional job (opportunities for people finding work, crew and projects for people hiring) | If an item would be just as useful next month, it belongs in Discover, not Home |
| **Discover** | "Look around Art and Artist, by type." Complete, browsable, filterable, stable. Lightly personalised ordering, never hiding things | Everything eligible is reachable here; Home only previews |
| **Search** | "I know the name or the thing." Query-first retrieval inside Discover: people, houses, projects, roles, events, films | Typing a name finds it in one step from Discover |

## 3. Spotlight verdict: **keep it, but redefine it**

**Today** Spotlight would not be missed (finding 4). The designer's worry about hand curation per craft doesn't match the current build, which is already rule-based, but the underlying point stands: it has no distinct job.

**Redefined job:** "The few things across Art and Artist that are unusually relevant or time-sensitive for you this week, whatever kind of thing they are." That passes the test: without it, you'd have to scan four sections to find the two things that actually matter today. It is the synthesis; the sections are the inventory.

That only holds with two rules:
- **No duplication:** anything in Spotlight is removed from the sections below on the same Home.
- **Mixed types, by design:** if it's all projects, it's just another projects shelf and should be removed instead.

If we aren't willing to adopt those two rules, I'd **remove** Spotlight rather than keep a decorative carousel.

## 4. Spotlight ranking model (V1, deterministic)

**Eligible types and what makes each "spotlight-worthy" (a trigger):**

| Type | Trigger (must be true to be eligible) |
| --- | --- |
| Role on a project | Open, fits your main or other crafts (or a related craft), and closes within 7 days or was posted within 3 days |
| Project | Just changed stage (for example now shooting), or is crewing in your city |
| New work (post) | From someone you follow or worked with, posted within 3 days |
| Event | Within 7 days, in your city or online, passes the events rules |
| Release | Out this week with enough ratings (the reviews rule) |

People are not Spotlight items. They have their own section, and a portrait in a cinematic carousel reads as an ad.

**Score** (reusing `eventRank`'s style, each signal capped):
- relationship: you're credited, someone you follow or worked with is involved, or a house you follow
- craft fit: main craft, other crafts, related family
- place: your city, online, or open to travel
- language match
- urgency or recency: closes soon, starts soon, new
- capped interest

**Diversity:**
- 5 cards at most;
- the first 3 must be at least 2 different types;
- at most 2 of any type;
- at most 1 per organiser or person.

**One universal slot:** the highest-scoring item for all of Art and Artist in your city or country (for example the week's best-reviewed release, or a festival), whatever your craft. That's the deliberate window out of the bubble.

**Editorial:** an optional pin, at most one at a time, *global* (never per craft). It can occupy the universal slot. The system never needs editors to work.

**Cadence:** computed once per session (stable while you look), recalculated daily or after a meaningful change (Interested, Save, a follow, a block). It's the same rule as Events.

**Prominence:** the carousel already makes the centred card prominent. All cards are the same size, so mixed types don't produce visual chaos.

**Labels:** every card gets **one** kicker that combines type and reason, in the badge that already exists. For example:
- "Crew forming · needs a DoP"
- "New work · Vikram Sen"
- "Event · Sat, Hyderabad"
- "Out this week · ★ 4.1"

There's no separate "Recommended because…" line.

**Not in V1:** behavioural models, collaborative filtering, dwell time, "gaining engagement" velocity, emerging-talent detection. They need data volume Art and Artist won't have at launch. The pure scoring functions are the place they'd slot in later as extra signals.

## 5. Spotlight justification

| If Spotlight disappeared… | Today | Redefined |
| --- | --- | --- |
| What's lost | Five project posters, most of which appear again below | The one place that pulls the few urgent or relevant things from every type into one glance |
| Verdict | Redundant | Earns its space, as long as the no-duplication and mixed-type rules hold |

## 6. Mixed content in Spotlight

- **Mixed types:** yes. That's the whole reason to keep it.
- **How users understand each card:** through the single kicker (type and reason) plus the card body, which is already type-shaped (a role shows "Looking for", an event shows a date, a release shows its score).
- **Content-type labels:** yes, merged into the kicker, never stacked with a separate reason line.
- **Diversity rules:** yes (see above), so it never turns into five opportunities.
- **One card more prominent:** the carousel centre already is. No special hero size.
- **Visual consistency:** same card frame, same image ratio, same kicker slot. Only the body line differs by type.
- **Personalised or universal:** mostly personal, plus one universal slot.

## 7. Home personalisation map (District Home, proposed)

| Section | Class | Note |
| --- | --- | --- |
| Tiles | Universal | Navigation into Discover |
| Spotlight | Lightly personalised, plus 1 universal slot | Mixed types, deduplicated against everything below |
| Completion prompt | Personal | One at a time (frozen) |
| **Opportunities for you** (new on District Home) | **Strongly personalised** | Craft, other crafts, related family, city, language, availability. 3 compact rows; See all opens Discover › Opportunities. Shown first after Spotlight when the intent is finding work or collaborating |
| New work | Network-based, then light craft | People you follow or worked with first, then your craft family, then wider. Rename from "New work in cinematography", so it stops being craft-only |
| Events | Contextual/local, light personal | Existing ranking |
| Out this Friday | Universal | Industry-wide, the same for everyone in a week. It's a counterweight to the bubble |
| Continue where you left off | Personal history | Kept; small |
| People near you | Contextual/local, light craft | Your department first, but not only. "Available" shown on the card instead of a separate shelf |
| Picked for you (collections) | **Remove** | Duplicates People near you and Spotlight. Its useful part ("available") becomes a marker |

**Current version Home:** already intent-composed and strongly personalised where it should be (Opportunities for you, People in your world), with Out this Friday and Happening on Art and Artist as broader sections. No structural change proposed beyond the shared Discover rules.

## 8. Scalability

| Question | Answer |
| --- | --- |
| Does it scale across crafts? | Yes. Nothing is designed per craft. Craft enters only as data: the craft's family (related crafts) and department label, the profile detail sets (already data), and ranking signals |
| Craft-specific vs generic | Generic: every surface, ranking function, content type and section. Craft-specific (as data only): family membership, department label ("Camera crew near you"), profile detail sets, work wording |
| Taxonomy | **Domain → family → craft.** Film → Camera (Cinematography, Camera crew, Lighting) → craft. Fine Arts → Visual (Painting, Illustration…) → craft. Add `family` and use the existing `domain` on `CraftDef`. Remove the hard-coded `DEPT` and `FAMILIES` maps |
| Would Spotlight ranking still work? | Yes. Its signals are relationship, place, recency and craft-family fit, none of which assume film. "Release" generalises to "a work out now" (a show, an exhibition) later |
| Too many Discover chips? | No. Content types are domain-agnostic (people, opportunities, projects, events, posts, reviews). A new field adds crafts, not types |
| Industries as another level of navigation? | Not a level. A **domain filter** inside Discover's facets ("Film · Fine Arts · All"), defaulting to your own domain. It appears only once a second domain has real supply. Home stays domain-scoped by your profile, plus the universal slot |
| Decide now | (1) the content-type registry; (2) taxonomy with domain and family, as data; (3) ranking as pure, tested functions sharing one signal library; (4) one candidate shape for Home items (`domain/home/types.ts` already has `Candidate`) |

## 9. Explaining recommendations

**Show a reason only when it's specific, true and not already said:**
- a relationship: "Konark Pictures, which you follow", "Vikram is crewing", "You're credited on this";
- a time fact: "Closes in 3 days", "Sat";
- a place fact, only when it's not your city or it's online.

**Never:**
- generic phrases ("Recommended for you", "Relevant to cinematography");
- a reason in a section whose title already says it (no "Near you" on cards under "People near you");
- more than one reason per card;
- a reason stacked on a type badge.

Spotlight is the only section where every card carries a kicker.

## 10. District: borrow and don't borrow

| Borrow | Don't borrow |
| --- | --- |
| Category tiles as visual shortcuts | Tiles as separate destinations (District's services are separate businesses; Art and Artist's types are one network) |
| A cinematic spotlight carousel as the page's single moment of motion | A curated, promotional spotlight (in District it's paid and editorial; Art and Artist promised no paid access to opportunities) |
| A soft ambient glow, location in the header | Consumer "offers" framing, a discount-like urgency |
| Shelves with varied shapes | Shelves that exist to fill the page (Picked for you) |

## 11. Recommendation

1. **One destination per content type:** Discover with a chip row (Posts · People · Opportunities · Projects · Events · Reviews). Home tiles and every "See all" open it with the right chip. Remove the separate browse pages.
2. **Search stays in Discover:** scoped to the selected chip, with "Search all of Art and Artist", global from Posts. The query carries across chips; filters stay per chip.
3. **Spotlight: keep, redefine:** mixed types by trigger, deterministic score, diversity quotas, one universal slot, deduplicated against the rest of Home, one kicker per card, stable per session.
4. **District Home:** add Opportunities for you, remove Picked for you, open up New work and People near you beyond your craft.
5. **Data:** a content-type registry; taxonomy domain → family → craft; ranking as pure functions.

## 12. Changes if approved

| Area | Change | Files |
| --- | --- | --- |
| Content types | Registry: id, label, icon, tile art, search group, enabled (Events switch, Reviews) | new `src/domain/contentTypes.ts` |
| Discover (District) | Chip row under search, default Posts. Each chip renders the existing type view (Reviews renders the Reviews page content). Scoped search plus a "Search all" row; query kept across chips; per-chip filters | `screens/discover/DiscoverScreen.tsx`, `screens/reviews/ReviewsScreen.tsx` (content extracted into a component), CSS |
| Discover (current) | Adds a Reviews tab (same content), scoped search rules | `DiscoverScreen.tsx` |
| Navigation | Tiles and See all switch to the Discover tab with a chip. The `browse` route is removed | `App.tsx` (tab and scope state), `state/store.tsx` (route), `DistrictHome.tsx` |
| Spotlight | `domain/spotlight.ts` (+ tests): triggers, score, diversity, universal slot, editorial pin. The card renders by type with one kicker. Home deduplicates sections against it | new `src/domain/spotlight.ts`, `DistrictHome.tsx` |
| District Home sections | Add Opportunities for you (3 rows); remove Picked for you; New work goes network-first; People near you by family with an Available marker | `DistrictHome.tsx`, `district.css` |
| Taxonomy | `family` on each craft; the `DEPT` map and `relatedCrafts` derive from it | `data/crafts.ts`, `DistrictHome.tsx` |
| Docs | This review becomes the approved direction; DISTRICT.md updated | `docs/` |

**Not changing:** current version Home composition; credits, roles, Interest, messaging, house rules; events V1; profile system; the theme and glow.
