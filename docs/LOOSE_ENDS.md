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
| Active identity | Tab avatar shows the house while acting; switch from the house name or your own name. |

## Unfinished (dead ends or toasts standing in for a screen)

- Settings: toast only (next: privacy, blocked people, notifications, organisations you act for). "Edit page" for a house: toast.
- Discover redesign from the scalability audit: not built.
- Personal projects on a profile (Salt, Chai & Rain) aren't Works yet, so they don't open.
- Messaging a house opens a conversation, but the Inbox doesn't yet separate personal and house conversations.
- Loading and error states exist only for "For you". Message send failure, withdrawing or editing a sent response, and editing or closing a published collaboration are missing.
- No onboarding or sign-in, no privacy or discoverability settings, no guardian flow for minors.
- Video playback is a placeholder. Headshots were never received as files, so people are monograms.
- Glass checked on house Home, organisation page, search and project page. Not yet on Edit Profile and Notifications.

## Exploring

- Production house experience (docs/PRODUCTION_HOUSE_EXPLORATION.md). Prototype panel: "Konark Pictures · acting for the house".

## Postponed decisions (need a call)

- Minimal vs Glass (both active per DECISIONS.md).
- Home layout A (full-screen slides) vs B (large cards).

## Needs stakeholder or user validation

- Whether people expect notification history at all, or treat it as a to-do list they want to empty.
- Whether "What you do" should be one free-text role or chosen crafts (affects search and fine arts later).
- The four production-house hypotheses below.
