# Loose ends audit

30 Sep 2026. Covers the prototype as published. Respects docs/DECISIONS.md.

## Resolved in this pass

| Item | Decision |
|---|---|
| Notifications bulk action | **Mark all as read**, not Clear all. Credits, messages and interest are history people come back to. After marking: header reads "No new notifications", items move under "Earlier" (dimmed), nothing is deleted. Tapping one item marks only that item. Closing the sheet no longer silently marks everything read. |
| Edit Profile | Full flow. Photo, name and role (required, inline errors), city, languages, about (400 limit with counter), gear. Save is disabled until something changes, then shows loading and a "Profile updated" toast. Cancel with changes asks to discard. Availability opens its sheet. Credits are not editable here because productions issue them. |
| Own-profile work status | The row opens the Availability sheet instead of doing nothing. |

## Unfinished (dead ends or toasts standing in for a screen)

- Settings, Share profile, Share role, Report and Block: toast only.
- Production or company name in a byline: toast, no company page.
- Project posters in Discover: no project page for individuals (one now exists for the house, see exploration).
- Post comments button: does nothing.
- Discover redesign from the scalability audit: not built. Search has no results page.
- Loading and error states exist only for "For you". Message send failure, withdrawing or editing a sent response, and editing or closing a published collaboration are missing.
- No onboarding or sign-in, no privacy or discoverability settings, no guardian flow for minors.
- Video playback is a placeholder. Headshots were never received as files, so people are monograms.
- Glass look has not been re-checked on Edit Profile, Notifications or the production screens.
- Tab bar avatar still shows the person while acting for the house.

## Exploring

- Production house experience (docs/PRODUCTION_HOUSE_EXPLORATION.md). Prototype panel: "Konark Pictures · acting for the house".

## Postponed decisions (need a call)

- Minimal vs Glass (both active per DECISIONS.md).
- Home layout A (full-screen slides) vs B (large cards).

## Needs stakeholder or user validation

- Whether people expect notification history at all, or treat it as a to-do list they want to empty.
- Whether "What you do" should be one free-text role or chosen crafts (affects search and fine arts later).
- The four production-house hypotheses below.
