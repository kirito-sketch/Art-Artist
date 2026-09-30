# Loose ends audit

30 Sep 2026. Covers the prototype as published. Respects docs/DECISIONS.md.

## Resolved in this pass

| Item | Decision |
|---|---|
| Notifications bulk action | **Mark all as read**, not Clear all. Credits, messages and interest are history people come back to. After marking: header reads "No new notifications", items move under "Earlier" (dimmed), nothing is deleted. Tapping one item marks only that item. Closing the sheet no longer silently marks everything read. |
| Edit Profile | Full flow. Photo, name and role (required, inline errors), city, languages, about (400 limit with counter), gear. Save is disabled until something changes, then shows loading and a "Profile updated" toast. Cancel with changes asks to discard. Availability opens its sheet. Credits are not editable here because productions issue them. |
| Own-profile work status | The row opens the Availability sheet instead of doing nothing. |
| Search | Typing searches everything at once: Productions, People, Projects, Roles, each with "See all". Clearing returns to the tabs. Blocked people and houses never appear. |
| Public project page | Opens from credits, posters, search and bylines. Productions (co-productions labelled), your own credit with "Something wrong?", hiring roles, accepted credits by department, stills. |
| Organisation page | One page for visitors and for members acting as the house. Replaces the byline toast. |
| Comments | Removed from posts. Reasoning in docs/PRODUCT_PLAN.md. |
| Share | Sheet: send to a recent conversation, copy link, share outside Ana. Profiles, projects, roles, organisations. |
| Report | Reason, optional detail, sending state, a clear promise (24 hours, reporter not revealed), offer to block. From profiles, organisations, projects and roles. |
| Block | Confirmation that states consequences; blocked profile shows "You blocked X" with Unblock; hidden from search. |
| Active identity | Tab avatar shows the house while acting; switch from the house name or your own name. Composers, conversations and interest review say who the action comes from; responding while acting offers "Switch to you". |
| Receiving a credit | "Waiting for you" on your own profile: Accept or Something wrong? (correction). Nothing is public until accepted. No self-claim action exists anywhere. |
| Independent projects | Salt, Chai & Rain and Two Rooms open a project page marked independent: "Credits for independent projects are not verified yet." Who issues credits without a house is an open question. |
| Key action states | Sending, failure and retry on interest, respond, accept credit, correction, messages, role edit, profile save; loading and error on search, project and production pages. |
| Interest after sending | Withdraw with undo until a conversation starts or the role closes; nothing to edit; poster not notified. |
| Edit and close a role | Title and project fixed; location, dates, description editable; material changes shown to interested people; close with an outcome; reopen. |
| Settings | Personal and house settings shells, kept separate. |
| Notifications | Owned by an identity, filtered by who you're acting as, All with owner labels. Opening an item never switches identity; the house workspace shows "viewing as yourself" with an explicit Switch, and actions stay disabled until then. |
| Interest model | Model A (one Interest, optional answers) is the default; Respond is kept as model B for comparison (VALIDATE). |
| Withdrawal, poster side | Withdrawn people stay in the poster's list, greyed, "No longer interested". No notification. |
| Filled roles | Can't be reopened; "Open a new role" keeps the filled record. Closed roles can be reopened. |
| Glass QA | Settings, withdrawal, edit and close role, failure and retry, notifications, credit accept and correct, message retry. Fixed: invisible Undo on white Glass toasts, unreadable notes, a stretched banner avatar, error contrast. |
| Regression check | Notifications (mark all as read, Earlier) and Edit Profile (validation, dirty Save, discard) re-checked in Minimal and Glass after the latest changes. |
| Prototype panel | Rebuilt as three steps: who is using Ana, what to compare for that person (each option tagged Working, Alternative, Reference or Undecided), look. Archived looks and test states are collapsed. |

## Unfinished (dead ends or toasts standing in for a screen)

- Settings rows are mostly read-only (account fields, security). Leaving an organisation isn't built.
- Production-house loose ends are tracked in docs/PRODUCTION_HOUSE_EXPLORATION.md §8.
- Discover redesign from the scalability audit: not built.
- Messaging a house opens a conversation, but the Inbox doesn't yet separate personal and house conversations.
- Loading and error states exist only for "For you". Message send failure, withdrawing or editing a sent response, and editing or closing a published collaboration are missing.
- No onboarding or sign-in, no privacy or discoverability settings, no guardian flow for minors.
- Video playback is a placeholder. Headshots were never received as files, so people are monograms.
- Glass checked on all current screens.

## Exploring

- Production house experience (docs/PRODUCTION_HOUSE_EXPLORATION.md). Prototype panel: "Konark Pictures · acting for the house".

## Postponed decisions (need a call)

- Minimal vs Glass (both active per DECISIONS.md).
- Home layout A (full-screen slides) vs B (large cards).

## Needs stakeholder or user validation

- Whether people expect notification history at all, or treat it as a to-do list they want to empty.
- Whether "What you do" should be one free-text role or chosen crafts (affects search and fine arts later).
- The four production-house hypotheses below.
