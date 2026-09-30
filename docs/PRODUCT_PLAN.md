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
| Visual direction final pick, Home A vs B | Postponed decisions; both kept intact. |

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
- **Crew and casting "Respond"** (profile, reel, answers) follows the same rules and gets Withdraw too. *Validate:* Respond with questions is closer to an application than Interest. Should house roles use plain Interest instead?

### Editing vs closing a role (decided, simple)
- **Can't change:** role title, craft, project. People showed interest in *that*. To change them, close and open a new role.
- **Can change:** location, dates, description (and pay once it's editable).
- **Material changes** (location, dates, pay) are shown to everyone who already showed interest: the poster sees "3 people who showed interest will see that the dates changed", and those people see "Updated since you showed interest: dates" on the role.
- **Closing** asks for an outcome: Filled through Ana, Filled another way, No longer needed, Project paused. States stay **Open → Filled / Closed**. Everyone who showed interest is told the outcome instead of hearing nothing. Closed roles leave Discover and search, keep their history, and can be reopened.
- No ATS statuses (shortlisted, interviewing, rejected).

### Settings (shell)
- **Personal** (acting as yourself): Account, Privacy and discoverability, Notifications, Blocked, Organisations you can act for, Security and sign out.
- **House** (acting for a house): Page (view, edit, verification), Who can act for this house (owner, members, "can issue credits"), House notifications.
- They never mix. Members live in house settings, not a "team" product. *Hypothesis:* the owner-plus-members model with a separate credit permission.

### Notifications and identity (hypothesis, validate)
- **Ownership:** each notification belongs to the identity that must act on it. Personal: credits issued to you, messages, your collaborations. House: interest in the house's roles, credit corrections, member or project actions.
- **One surface, filtered.** It opens filtered to whoever you're acting as; chips switch between You, each house, and All. In All, house items say "For Konark Pictures".
- **Opening a house item switches identity first** (with a toast), so you can't act as the wrong identity.
- House Home has its own bell, which shows a dot only for that house's items.
- *Validate:* do members want house notifications at all when acting as themselves, or only inside the house?

### Identity-safe creation (kept)
Every consequential action shows who is performing it before you commit: composers show the author, conversations say "Replying as", interest review says "Message as" the house, and responding to a role is personal only.
