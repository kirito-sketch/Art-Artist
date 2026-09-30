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
| ~~Glass check of every new screen~~ | Done. |
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
| Production-side credit authority: when several companies are attached, can only the lead issue credits or co-producers too; which members may publish | Talking to houses that co-produce. (That individuals never self-claim credits is **decided**, see DECISIONS.md §6.) |
| Independent work without a production house | Who becomes the trusted credit issuer? Separate trust design, not yet started. Never self-claiming. For now project pages say "Credits for independent projects are not verified yet." |
| Who acts for a house (owner, line producer, coordinator) and on whose phone | Decides whether switching must be one tap. |

## LATER

| Item | Why later |
|---|---|
| Onboarding and sign-in, organisation verification, sales-led house onboarding | Important, but the architecture must settle first. |
| Guardian and minor profiles | Must be designed carefully and does not shape the core IA. Minors stay out of search until then. |
| Fine arts experience | Same model (organisation → work → person → participation → credit); pressure-test each concept, do not design screens. |
| Film news | Undecided who publishes. The product works without it. |
| Inbox split by identity | Only if members report mixing personal and house conversations. |
| Visual direction final pick | Minimal is the working baseline for new work (see DECISIONS.md §10); Glass archived pending confirmation. Home is decided: Large Cards. |

## Decisions taken in this pass

- **Credits originate from the production.** Individuals receive, accept or correct. They never add, claim, request or ask to verify a credit. See DECISIONS.md §6.
- **Any action that publishes or communicates shows who it comes from.** Composers show the author (you or the house), conversations say "Replying as", review actions say "Message as Konark Pictures", and responding to a role is personal only: acting as a house, the role page offers "Switch to you" instead of Respond.

- **Comments: removed from posts.** Public comment threads are a social-media pattern that invites performance and noise, not collaboration. The professional needs they cover are served elsewhere: appreciation (Like), a private reaction (Message the author), and interest in work (Show interest on roles). *Validate:* whether people miss public praise on work posts; if yes, consider "Notes from collaborators" on projects, not comments on posts.
- **Report** always leads to a reason, an optional detail, a clear promise (Ana reviews it, the person is not told who reported), and an offer to block. **Block** hides both sides from each other everywhere (profiles, search, interest, messages) and is undone from Settings or the blocked profile.
- **Share** copies a link or sends it inside Ana. Nothing more.

## NEXT pass: what was designed (30 Sep 2026)

### Loading and error states, only where a task is interrupted
Pattern: idle → in progress → success → failure → retry, inline wherever possible. Test with **Test states → Actions fail once** (first try fails, retry works) and **Slow network**.

| Action | In progress | Failure | Retry |
|---|---|---|---|
| Show interest | Button spinner | "Couldn't send your interest. Nothing was shared." | Button becomes "Try again" |
| Respond to a role | Button spinner | "Couldn't send. Your answers are kept" | "Try again" |
| Accept a credit | Button spinner | Toast: "Couldn't accept the credit. Nothing changed." | Toast "Retry" |
| Request a credit correction | Button spinner | Inline error | "Try again" |
| Send a message | "Sending…" under the bubble | Bubble dims, "Not delivered · Tap to retry" | Tap |
| Edit a role | Button spinner | "Couldn't save. Your edits are kept." | "Try again" |
| Save profile | Save spinner | Banner: "Couldn't save. Your changes are still here." | Save again |
| Search | Skeleton rows | "Search didn't load. Your search is kept." | "Try again" |
| Project / production page | Skeleton hero and lines | "Couldn't load this project/page" | "Try again" |

Publishing a post or role already had its own progress bar and failure. No separate screens were added.

### After showing interest (decided, simplest model)
- **Withdraw any time** until the poster starts a conversation or the role closes. Undo is offered for a few seconds.
- **Nothing to edit.** Interest is your live profile plus an optional note. To change what they see, update your profile. To change the note, withdraw and show interest again. This keeps Interest from turning into an application form.
- **Once they've messaged you**, Withdraw disappears: the role page says "In conversation · Changed your mind? Say so in the chat" with "Open chat". Silent withdrawal mid-conversation would be rude and confusing.
- **The poster isn't notified** of a withdrawal. The person simply leaves the interested list.
- **The poster sees withdrawals, quietly.** No notification, but the person stays in the list, greyed, as "No longer interested". Nobody the poster reviewed or saved silently vanishes.

### Editing vs closing a role (decided, simple)
- **Can't change:** role title, craft, project. People showed interest in *that*. To change them, close and open a new role.
- **Can change:** location, dates, description (and pay once it's editable).
- **Material changes** (location, dates, pay) are shown to everyone who already showed interest: the poster sees "3 people who showed interest will see that the dates changed", and those people see "Updated since you showed interest: dates" on the role.
- **Closing** asks for an outcome: Filled through Ana, Filled another way, No longer needed, Project paused. States stay **Open → Filled / Closed**. Everyone who showed interest is told the outcome instead of hearing nothing. Closed roles leave Discover and search and keep their history.
- **Closed can be reopened. Filled cannot.** Filled records who was chosen; changing it would rewrite history. "Open a new role" creates a fresh role for the same craft and project, and the filled one stays on record.
- No ATS statuses (shortlisted, interviewing, rejected).

### Settings (shell)
- **Personal** (acting as yourself): Account, Privacy and discoverability, Notifications, Blocked, Organisations you can act for, Security and sign out.
- **House** (acting for a house): Page (view, edit, verification), Who can act for this house (owner, members, "can issue credits"), House notifications.
- They never mix. Members live in house settings, not a "team" product.
- **Credit authority is its own group**, separating the fixed rule (credits come from the house, never from the person credited) from the open question (who inside the house holds it: owner only, chosen members, or a person per project, and how co-productions work). No permissions matrix yet.

### Notifications and identity (hypothesis, validate)
- **Ownership:** each notification belongs to the identity that must act on it. Personal: credits issued to you, messages, your collaborations. House: interest in the house's roles, credit corrections, member or project actions.
- **One surface, filtered.** It opens filtered to whoever you're acting as; chips switch between You, each house, and All. In All, house items say "For Konark Pictures".
- **Opening an item never changes your identity.** Compared: (A) tap switches identity automatically, then opens; (B) tap opens the destination with a clear "viewing as yourself" banner, and any action needs an explicit Switch. **B is kept:** it never acts as the wrong identity *and* never changes identity unexpectedly. In the house workspace, actions stay disabled until you switch.
- House Home has its own bell, which shows a dot only for that house's items.
- *Validate:* do members want house notifications at all when acting as themselves, or only inside the house?

### Identity-safe creation (kept)
Every consequential action shows who is performing it before you commit: composers show the author, conversations say "Replying as", interest review says "Message as" the house, and responding to a role is personal only.

## Interest vs Respond (VALIDATE)

| | A. One Interest model everywhere (working hypothesis) | B. Interest for collaborations + Respond for crew and casting |
|---|---|---|
| What the person sends | Their profile, an optional note, optional short answers to up to 3 role questions | Collaborations: profile + note. Crew/casting: a form with required answers, reel and credits toggles |
| What the poster does | Reviews profiles (answers shown if given), decides whether to message | Same, but reads structured responses |
| Risk | Posters may get less signal on busy roles | Slides toward an application system: required forms, then stages, shortlists, rejections |
| What would justify B | Evidence that houses receive so many responses that they can't decide without required, comparable answers. We don't have that evidence. |

The prototype defaults to A. B stays in the panel ("Crew and casting roles") for comparison. Neither has resumes, stages, pipelines, shortlists or rejected statuses.

## Decided vs hypotheses (current)

**Phase status:** Version 18 consolidates the model. Feature expansion is paused until the first production-house interviews (docs/VALIDATION_PLAN.md).

**Decided:** individuals can't self-claim credits · one account with separate personal and house contexts · the house profile is its public identity · comments removed · Mark all as read, not Clear all · members are permissions, not team management · Minimal and Glass active, Bold and Doodle archived.

**Decided since:** Large Cards is the individual Home · one primary design by default · Slate and Work first are the primary house designs (alternatives archived).

**Hypotheses:** Slate and Work first still need validating with houses · "Need" wording · private roles · Interest vs structured responses · identity-aware notification behaviour · production-side credit authority · independent-project credit authority · project publication lifecycle.
