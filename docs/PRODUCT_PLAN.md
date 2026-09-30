# Product plan: this phase

30 Sep 2026. Purpose check for every item: does it help creative people and organisations **discover each other, establish trusted identity, find opportunities, collaborate, and build a credible record of work**? If it only helps run a production, it does not belong in Ana.

Mental model:
- **Individual Ana:** my career, my work, people and opportunities around me.
- **Organisation Ana:** our projects, our presence, people and opportunities around our work.

## NOW (understood well enough to build)

| Item | Why now |
|---|---|
| **Active identity** (who am I acting as) | Acting for a house with your own face in the tab bar is a trust bug. The model is small: one person, a list of organisations they may act for, one switch. |
| **Organisation profile (one public page)** | Company bylines are dead ends, and a house acting on Ana needs a Profile tab. One page serves both: visitors see it, members see the same page with edit affordances. No separate "company page". |
| **Public project page** | Credits and posters already point to projects. Opening one must show what it is, who made it, who is credited and whether it is hiring. This is not the house's private workspace. |
| **Search across entities** | Search only filtered the current tab. People type a name or title without knowing which tab it lives in. |
| **Comments decision** | An icon that does nothing. Decided: removed (see below). |
| **Share, Report, Block** | Trust and safety. The consequences are well understood from other networks; no reason to wait. |

## NEXT (after NOW is stable)

| Item | Why next |
|---|---|
| Glass check of every new screen | Both directions stay active until one is chosen. |
| Loading and error states on search, project, organisation and send-message | Only where a real person would hit them. |
| Withdraw or edit a sent response; edit or close a published collaboration | Real, frequent, but depends on the interest model staying as is. |
| Settings shell (privacy, blocked people, notifications, signed-in organisations) | Needed once Block exists, but nothing else depends on it. |
| Organisation-aware Create and Notifications | Once the identity model is agreed. |

## VALIDATE (prototype lightly, do not lock)

| Hypothesis | What would change our mind |
|---|---|
| House Home: which of three models (see exploration doc) | Watching two production managers open it on a real day. |
| One object for requirement and opportunity, with visibility Private, Open, Filled | If no house would ever keep a need private inside Ana, drop Private. |
| The word "Need" (house side) vs "Role" (creative side) for the same object | Card-sort with both sides. |
| Responses to a house role reuse the existing Interest model (no ATS) | If houses receive 100+ responses per role, they may need sorting and shortlisting. |
| Credit authority: the lead production proposes, each person confirms, disputes go back to the proposer | Co-productions and independent films with no house. |
| Who acts for a house (owner, line producer, coordinator) and on whose phone | Decides whether switching must be one tap. |

## LATER

| Item | Why later |
|---|---|
| Onboarding and sign-in, organisation verification, sales-led house onboarding | Important, but the architecture must settle first. |
| Guardian and minor profiles | Must be designed carefully and does not shape the core IA. Minors stay out of search until then. |
| Fine arts experience | Same model (organisation → work → person → participation → credit); pressure-test each concept, do not design screens. |
| Film news | Undecided who publishes. The product works without it. |
| Inbox split by identity | Only if members report mixing personal and house conversations. |
| Visual direction final pick, Home A vs B | Postponed decisions; both kept intact. |

## Decisions taken in this pass

- **Comments: removed from posts.** Public comment threads are a social-media pattern that invites performance and noise, not collaboration. The professional needs they cover are served elsewhere: appreciation (Like), a private reaction (Message the author), and interest in work (Show interest on roles). *Validate:* whether people miss public praise on work posts; if yes, consider "Notes from collaborators" on projects, not comments on posts.
- **Report** always leads to a reason, an optional detail, a clear promise (Ana reviews it, the person is not told who reported), and an offer to block. **Block** hides both sides from each other everywhere (profiles, search, interest, messages) and is undone from Settings or the blocked profile.
- **Share** copies a link or sends it inside Ana. Nothing more.
