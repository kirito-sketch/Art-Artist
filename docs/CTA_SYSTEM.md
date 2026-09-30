# Ana CTA system

One hierarchy for every action in Ana. Colour never decides importance on its own: position, size and fill do. Code: `Button`, `FollowButton` and `IconButton` in `src/ui/primitives.tsx`; styles in `src/styles/components.css` (`.btn--*`).

## The families

| Family | Treatment | Used for | Never for |
|---|---|---|---|
| **Primary** (`primary`) | Graphite fill, light text, pill | The one task action in a decision area: Show interest, Continue, Next, Save changes, Confirm, Send, Accept, Accept revision, Complete setup, Publish, Message (on a profile) | More than one per decision area; anything destructive |
| **Secondary** (`secondary`, `outline` is the same) | Raised white, graphite text, a warm 1 px edge | Follow, Edit profile, View project, Something wrong?, Keep current, Compare, Withdraw, Switch to you, Download my data, Cancel in a destructive confirmation | Carrying the main task when a primary is present |
| **Selected / completed** (`selected`) | Tonal fill (`--tint`), graphite text, a check where it helps | Following, and any "done" state a control keeps showing | A new colour for a state |
| **Tertiary** (`plain`, `.link`) | Text or icon only | Learn more, Skip, See all, Clear all, Later, Cancel where low risk, overflow | Anything that needs to be found at a glance |
| **On media** (`light`, `.icon-btn--float`) | White float over imagery | Back, Share, Save over heroes and cards | Plain paper surfaces |
| **Destructive** (`danger`) | Semantic red fill | The final confirmation of Delete, Remove, Discard, Block, Suspend, Deactivate | Sign out, Continue, attention, waiting, correction, pending |

## Ana red is a mark, not a button colour

Red appears as: the global Create +, the unread and attention dot, the active tab mark, the title-card rule, a selected check, the filled Save bookmark, the Urgent frame label text. It is never a primary button. Semantic destructive red (`--danger`) is a separate token used only by the destructive family and inline errors.

## Green is state

Green marks availability and success (the availability dot, "Available from"). It is never a button.

## States

| State | Primary | Secondary | Selected | Tertiary |
|---|---|---|---|---|
| Default | graphite | raised + edge | tint | text |
| Pressed | scale 0.96, spring | scale 0.96 | scale 0.96 | scale 0.96 |
| Loading | spinner replaces the icon, label kept, width kept, `aria-busy` | same | n/a | n/a |
| Disabled | 35 % opacity, no press | 35 % opacity | n/a | 35 % opacity |
| Completed / sent | the decision area changes to a status line plus a secondary action (e.g. "Interest sent" + Withdraw) | n/a | n/a | n/a |
| Following | n/a | Follow | Following ✓ | n/a |

The completed state of Show interest is a status in the action bar ("Interest sent · Tidewater will message you if it's a fit") with Withdraw as secondary; after withdrawal the bar returns to Show interest (the existing model: withdrawing is not a rejection, and the production's side keeps the record as "No longer interested"). Motion for these transitions is specified in MOTION_MICROINTERACTION_SYSTEM.md.

## Rules

1. One primary per decision area. Two equal choices are both secondary.
2. In a destructive confirmation, the destructive action is red and Cancel is secondary (the safe choice stays as easy to hit).
3. Follow is secondary on every surface: lists, portrait cards, profiles, production houses. It is one component (`FollowButton`).
4. Attention text is ink with a red dot (`.meta--attention`), never a red sentence. Waiting text is neutral.
5. No screen defines its own button colour.

## Audit mapping (Phase 1, current → canonical)

| Action | Where | Before | After |
|---|---|---|---|
| Follow | Discover People, Home people rows, Portrait Cards | Outline | Secondary |
| Following | same | Grey fill | Selected with check |
| Follow | Person profile, House page | **Primary** (graphite) | Secondary |
| Following | Person profile, House page | Grey fill | Selected with check |
| Message | Person profile, House page | Outline | Primary (the one task action there) |
| Every `secondary` | whole app (32 uses) | Cool grey fill `#f2f2f7` | Raised white with a warm edge |
| Every `outline` | whole app (9 uses) | White with grey edge | Same component as secondary |
| Something wrong? / Compare | Profile, pending credit | Plain text | Secondary |
| Keep current / Something wrong? | House project, credit decision | Plain text | Secondary |
| Sign out | Settings row and confirmation | Red row, **red** button | Neutral row, primary button |
| Continue (towards account deletion) | Your data | **Red** | Primary; only "Deactivate and delete" is red |
| "Verification pending" | House page | Red text | Neutral meta |
| Says this isn't right / Asked: … / Asked to amend | House project people list | Red text lines | Ink text with a red attention dot |
| Add when you're available | New person's profile | Red text | Tertiary underlined link |
| Show interest, Accept, Accept revision, Continue, Next, Publish, Send, Confirm, Complete setup | everywhere | Primary | Primary (unchanged) |
| Discard, Block, Also block, Delete account, Remove from project, Deactivate and delete | confirmations | Red | Red (unchanged; genuinely destructive) |
| Create + | tab bar | Red | Red (brand mark; unchanged) |
| Save | cards, heroes | Float, red when saved | Unchanged (a selected mark) |
| Report | overflow and sheets | Row / link | Tertiary (unchanged) |
| Filters, craft chips | Discover | Chip, graphite when on | Unchanged (selection, not a CTA) |
