# Ana CTA system

One hierarchy for every action in Ana. Colour never decides importance on its own: position, size and fill do. Code: `Button`, `FollowButton`, `IconButton` and `SaveButton`; tokens in `src/styles/tokens.css`; styles in `src/styles/components.css` and `src/styles/expression.css`.

## Colour roles

| Role | Token | Value | Used for |
|---|---|---|---|
| Environment | `--base`, `--raised`, `--tint`, `--sand` | warm paper and neutrals | surfaces |
| Type and structure | `--text`, `--dark` | graphite / ink | headings, body, neutral icons, title cards, toasts, chat bubbles, house-logo fallback |
| **Ana action** | `--action` | **#275C50** | primary actions, Create, selected states, the active mark, focus, saved |
| Action states | `--action-pressed` `#1E4A40`, `--action-hover` `#22534A`, `--action-tint` (10 %), `--action-tint-strong` (18 %), `--action-disabled`, `--on-action` white, `--focus-ring` | | pressed, hover, selected surfaces, disabled, text on green, focus |
| Accent (as a mark) | `--accent` = `var(--action)` | | dots, rules, the attention mark, urgent frame-label text |
| Danger | `--danger` | #D83A2E | destructive confirmations and genuine errors only |

Never hard-code `#275C50`; use the token. Red is no longer a brand colour.

## The families

| Family | Treatment | Used for | Never for |
|---|---|---|---|
| **Primary** (`primary`) | `--action` fill, white text, pill; pressed `--action-pressed` | The one task action in a decision area: Show interest, Continue, Next, Save changes, Confirm, Send, Message, Accept, Accept revision, Publish, Complete setup | More than one per decision area; anything destructive |
| **Secondary** (`secondary`, `outline` is the same) | Raised white, ink text, a warm 1 px edge | Follow, Edit profile, View project, Something wrong?, Keep current, Compare, Withdraw, Switch to you, Cancel in a destructive confirmation | Carrying the main task when a primary is present |
| **Selected** (`selected`) | `--action-tint` fill, `--action` text, a check | Following, and any "done" state a control keeps showing | A new colour for a state |
| **Tertiary** (`plain`, `.link`) | Text or icon only, ink or `--action` | Learn more, Skip, See all, Clear all, Later, Cancel where low risk | Anything that must be found at a glance |
| **Utility** (`.icon-btn--float`, `.save--floating`) | Light near-white circle, ink icon, soft float shadow and a faint warm edge | Back, Share, Save, More over media | Being filled with the action colour. Only Save has a selected state: its glyph turns `--action` and fills |
| **Destructive** (`danger`) | `--danger` fill | The final confirmation of Delete, Remove, Discard, Block, Suspend, Deactivate | Sign out, Continue, Report (opening it), attention, waiting, correction, pending |
| **Filter** (`.chip`, `.craft`) | Its own component: warm surface by default; solid `--action` fill with white text when selected; faded when disabled; tactile press | Discover modes, role kinds, craft filters, Saved filters | Button styling of any kind |
| **Disabled** | 35 % opacity, no press | any family | |

## Global Create +

`--action` disc with white +, a soft green shadow; open state × on `--action-pressed`. It morphs into the Create surface (green → white) and back. Create is constructive, so it is never red.

## Follow and Save

- **Follow** (People, Production Houses): Follow is secondary; Following is selected (green tint, green check and text). One component, `FollowButton`.
- **Save** (Posts, Roles, Projects): the bookmark glyph, neutral by default, `--action` and filled when saved. Over media it lives in the utility circle; in a post's action row it is a plain icon. See docs/SAVE_MODEL.md.

## States

| State | Primary | Secondary | Selected | Utility | Filter |
|---|---|---|---|---|---|
| Default | green fill | raised + edge | green tint | light circle, ink icon | warm surface |
| Pressed | scale 0.96, `--action-pressed` | scale 0.96 | scale 0.96 | scale 0.8–0.9 | scale 0.95 |
| Focus | `--focus-ring` outline | same | same | same | same |
| Loading | spinner, label kept, `aria-busy` | same | n/a | n/a | n/a |
| Disabled | 35 % | 35 % | n/a | n/a | 40 % |
| Completed / sent | the decision area becomes a status line ("Interest sent ✓") plus a secondary action | | | | |
| Selected | | | Following ✓ | Save glyph green, filled | green fill, white text |

## Rules

1. One primary per decision area. Two equal choices are both secondary.
2. In a destructive confirmation the destructive action is red and Cancel is secondary.
3. Utility controls are never primary: Back, Share and More are always neutral.
4. Attention is ink text led by a small green dot (`.meta--attention`), never a coloured sentence. Waiting is neutral.
5. Report opens neutrally; only a genuinely destructive confirmation inside it (Block) is red.
6. No screen defines its own button colour.

## Audit mapping (this pass: black/red → green)

| Element | Before | After |
|---|---|---|
| Every primary button | Graphite fill | `--action` fill |
| Create + | Red disc, red shadow | `--action` disc, green shadow; × on `--action-pressed` |
| Active tab mark, unread dots, title-card rule, attention dot, note-tile rule | Red | `--action` |
| Active underline (Discover modes, tabs) | Ink | `--action` |
| Following | Grey/tonal, ink | Green tint, green check and text |
| Saved bookmark | Red glyph | Green glyph, filled |
| Liked heart | Red | Green |
| "Interest sent" check | Ink disc | Green disc |
| Composer send, chat send, filter chips selected, craft filter selected | Graphite | `--action` |
| Utility controls over media | Dark slate plates (Phase 1) | Light floating circles (restored) |
| Craft filter default | Cool grey `#f2f2f7` (vanished on paper) | Warm `--tint` |
| Inactive tab icons | 2.2:1 grey | `--text-2`, 5:1 |
| Destructive rows (Delete account, Remove from project, Block) | Hard-coded red | `--danger` |
| Errors (publish failed, inline errors) | Red | `--danger` (unchanged meaning) |

Earlier mapping (Phase 1) still holds: Follow is one secondary component everywhere; Message is the primary on a profile; Sign out and the first delete step are not destructive; Something wrong? / Keep current / Compare are secondary.

## Intentionally not green or not changed

- The Ana logo artwork keeps its own red mark (a brand asset, not an interface colour).
- The placeholder craft-object drawings keep a tiny red indicator; they are temporary art to be replaced by the supplied asset family.
- The archived alternative looks (Glass, Bold, Doodle) in `looks.css` are not part of the approved direction and were not restyled.
- Graphite stays for type, toasts, chat bubbles from you, title cards and house-logo fallbacks: structure, not action.
