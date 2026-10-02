# Art and Artist accessibility audit (WCAG 2.2 AA)

Audit only. Nothing in the product was changed. Date: 2 Oct 2026. Build: current `claude/ana-product-strategy-in22y2`.

**Scope: the Art and Artist app only**, in both the Individual and Production House experiences. The `/test`
research environment, the `/research` dashboard, the access password page and the prototype side console are
out of scope.

## Verdict

The visual layer is in better shape than the interaction layer. Real buttons are used almost everywhere, the
global focus ring is strong, icon buttons are always named, reduced motion is respected and text over photos
is readable. What fails is structural: **the app keeps every tab, every covered screen and the page behind every
sheet in the keyboard and screen-reader order**. A keyboard user on Home presses Tab 152 times before reaching
the bottom navigation, and two out of three of those stops are on controls they cannot see. Sheets never
receive focus. On a phone with a screen reader, a sheet has no control that closes it.

These are a handful of root causes in shared components (`App.tsx` Phone shell, `Sheet`, `PressCard`, tokens),
so most of the fix count is small even though the issue count is large.

| Severity | Count | Nature |
|---|---|---|
| A. Critical | 4 | Focus and layering in the app shell and sheets |
| B. High | 12 | Nested controls, names, contrast tokens, forms, focus on inputs, toasts |
| C. Medium | 14 | Headings and landmarks, status messages, targets, truncation, patterns, error prevention |
| D. Low | 8 | Labels with context, ring consistency, polish |

## How this was tested

| Method | What it covered |
|---|---|
| Code review | `ui/primitives.tsx`, `Sheet.tsx`, `chrome.tsx`, `App.tsx` (Phone shell, MediaViewer), `nav/TabBar.tsx`, `entry/Entry.tsx`, `screens/**`, `legal/**`, all app CSS |
| axe-core 4 (WCAG 2.0/2.1/2.2 A and AA + best practice) | 38 app states across both experiences, including entry flows. Installed in a scratch folder only; **no dependency was added to the project** |
| Rendered contrast sweep | Every visible text node, placeholder and icon in 15 states, computed from real rendered colours and blended backgrounds. Text over photos measured against the actual photo pixels (crop behind the text, 5th percentile) |
| Keyboard | Scripted Tab, Shift+Tab, Enter, Space, Escape through Home, Discover, role detail, sheets and Create, logging where focus lands, whether it is visible, and which layer it is in |
| Accessible names | Every control in the top layer of 22 states: name, role, state, size, label association |
| Headings and landmarks | Heading outline and landmarks for 16 screens |
| Zoom and reflow | 320 CSS px (equal to 400% zoom), 320 px with all type tokens at 1.5x, 390 px with WCAG 1.4.12 text spacing, 150/200/250% zoom, clipping and horizontal scroll detection |
| Reduced motion | `prefers-reduced-motion: reduce` emulated, transforms sampled during tab switch and screen push, running animations listed |
| Focus visibility | Close-up captures of the ring on cards, chips, tab bar, Create, fields and buttons |
| Focus not obscured | Overlap of each focused element with the floating tab bar at 390x844 |

Personas covered: Kiran (established individual), Tara (early career), Konark Pictures (busy house),
Tidewater Films (small house, cold start), signed-out entry flows.

**Not covered, and why.** No real screen reader (VoiceOver, TalkBack, NVDA) is available in this environment;
screen-reader findings come from the DOM, ARIA and axe, and need confirming on devices. Windows forced-colours
mode was not tested. Physical-device zoom and OS text-size settings were not tested. A few house-mode routes
(house profile tab) were reviewed in code only because the scripted navigation did not reach them.

---

## A. Critical

### A1. Invisible tabs stay in the keyboard order
- **Screen / component:** App shell, `src/App.tsx` (`Phone`, the four `.tab-layer`s). Every screen.
- **Issue:** All four tabs stay mounted for scroll memory. Inactive tabs get `aria-hidden="true"`, `opacity: 0` and `pointer-events: none`, but their controls stay focusable. On Home (Kiran) there are 157 tab stops; **99 are inside the invisible Discover, Inbox and Profile tabs**, and the bottom navigation is stop **152**. Focus visibly disappears for about 100 presses. axe: `aria-hidden-focus` on every screen.
- **Why it matters:** A keyboard user cannot see where they are most of the time and cannot reach navigation in reasonable effort. Screen readers land on controls that are hidden from them (announced as blank or wrong).
- **WCAG:** 2.4.3 Focus Order, 2.4.7 Focus Visible, 1.3.2 Meaningful Sequence, 4.1.2 Name, Role, Value.
- **Suggested fix:** Put `inert` on inactive tab layers (keeps them mounted and keeps scroll position). Remove `aria-hidden` once `inert` is there.
- **Scope:** Global (one place).

### A2. Opening a screen does not move focus, and the covered screen stays reachable
- **Screen / component:** App shell route stack (`.route-layer`). Role detail, project, profiles, thread, settings, composers, everything pushed.
- **Issue:** After opening a role from Discover, focus stays where it was (or falls to `body`). The covered Discover screen keeps all its controls: **94 tab stops before the first control on the visible screen**. Nothing tells a screen reader the screen changed. Going back does not return focus to the card that opened it.
- **Why it matters:** Keyboard users tab through a screen they cannot see. Screen-reader users do not know a new screen opened and keep reading the old one.
- **WCAG:** 2.4.3 Focus Order, 1.3.2, 4.1.3 Status Messages (context change not conveyed).
- **Suggested fix:** Make every layer under the top route `inert`. On push, move focus to the new screen's `h1` (`tabIndex={-1}`) or to Back. On pop, restore focus to the element that opened it.
- **Scope:** Global.

### A3. Sheets and dialogs never receive focus and do not contain it
- **Screen / component:** `src/ui/Sheet.tsx` (all 19 sheets: Show interest, Notifications, Availability, Intent, Respond, Review interest, Report, Share, More, Edit role, Close role, Block, New project, and others), `CreateSurface`, and the house project sheets in `production/Create.tsx`.
- **Issue:** Sheets declare `role="dialog" aria-modal="true"` but focus is not moved in, Tab is not contained, the page behind stays reachable, and focus is not returned on close. With Show interest open, **40 Tab presses never entered the sheet**; all landed behind it. Escape does close sheets (global handler), which is good.
- **Why it matters:** Keyboard users cannot reach sheet content without tabbing through the whole app. Screen readers are told it is modal, then allowed to wander behind it.
- **WCAG:** 2.4.3 Focus Order, 4.1.2, 1.3.1.
- **Suggested fix:** In `Sheet`: on open, focus the first field or the title; contain Tab inside; mark the rest of the phone `inert`; on close, restore focus to the opener. Label with `aria-labelledby` pointing at the title. Same for `CreateSurface` and the house project sheets.
- **Scope:** Global (one component plus its siblings).

### A4. On a phone, a screen-reader user cannot close a sheet
- **Screen / component:** `Sheet.tsx`, `CreateSurface`.
- **Issue:** Sheets close by dragging the grabber, tapping the backdrop or pressing Escape. The grabber is a drag-only `span`, the backdrop is an unnamed `div` that is not focusable, and phones have no Escape key (the VoiceOver "escape" gesture does not fire a `keydown`). Sheets have no Close or Done control. Notifications, Share, More, Report, Availability are all affected.
- **Why it matters:** A VoiceOver or TalkBack user can open a sheet and be unable to leave it.
- **WCAG:** 2.1.1 Keyboard, 2.5.1 Pointer Gestures / 2.5.7 Dragging Movements (drag is the only labelled path), 4.1.2.
- **Suggested fix:** Give every sheet an accessible Close button (visible, or visually hidden as the first element, see Design decisions). Support the screen-reader escape gesture via the dialog's dismiss action where the platform allows.
- **Scope:** Global.

---

## B. High

### B1. Cards are buttons that contain other buttons
- **Screen / component:** `PressCard` (37 uses): Home role cards with Save, portrait cards with Follow, Discover person rows with Follow, Inbox threads with Review / Confirm, house home, poster tiles.
- **Issue:** The card is a `div role="button"` and the Follow, Save, Review or Confirm buttons sit inside it. axe `nested-interactive`: 112 portrait cards, 70 role cards, 13 rows, 5 threads across the states tested. Cards without an explicit label get a run-on name: "Aditi GhoshLine Producer · Hyderabad 2 verified credits".
- **Why it matters:** In `role="button"`, children are presentational. Screen readers may announce the card as one button and never reach Follow, Save or Review inside it. The workaround is to open the item and act there.
- **WCAG:** 4.1.2, 1.3.1.
- **Suggested fix:** Make the card a plain container (`article` or `li`) whose title is the real button or link, stretched over the card with a pseudo-element for the tap area. Keep Follow / Save / Review as sibling buttons. Give rows a concise label (name, role, availability).
- **Scope:** Global (`PressCard` and its callers).

### B2. Image buttons with no name
- **Screen / component:** Portfolio grid on own and other profiles (`grid-item`), project stills, post media.
- **Issue:** The button contains only an image with `alt=""`. Announced as "button". 6 on own profile, 3 on a person profile, 2 on a project. axe `button-name`.
- **Why it matters:** Screen-reader users hear a row of unlabelled buttons in the portfolio, the core of a creative profile.
- **WCAG:** 4.1.2, 1.1.1.
- **Suggested fix:** Label from the work: caption, project title or "Still 2 of 6, Neela Akasham".
- **Scope:** Global (grid and media components).

### B3. Work images have no text alternative
- **Screen / component:** `Photo` (45 of 46 uses pass no `alt`), media viewer, portfolio, stills, post media.
- **Issue:** Every image is `alt=""`. That is right for thumbnails beside a visible title (role cards, poster tiles, avatars), but wrong where the image is the content: the media viewer, portfolio, stills and post photos.
- **Why it matters:** The work itself is invisible to screen-reader users on a platform about creative work.
- **WCAG:** 1.1.1 Non-text Content.
- **Suggested fix:** Add an optional caption or alt field to media data; use it in viewer, grid and post contexts; keep `alt=""` where a visible title already says it. Short and contextual, not descriptive essays.
- **Scope:** Global (data plus `Photo` callers).

### B4. The lightest grey is used for text people need to read
- **Screen / component:** Token `--text-3 #aeaeb2` (21 CSS uses): composer placeholders, date field "Choose", search placeholder, "You're all caught up", hints, row chevrons, disabled-looking icons.
- **Issue:** 1.98:1 on grouped `#f2f2f7`, 2.01:1 on paper `#f6f4f0`, 2.21:1 on white. In the collab composer the placeholders ("Who do you need?", "Project title", "Amount", "Add details") are the only visible labels.
- **Why it matters:** Low-vision users cannot read field prompts or end-of-list messages.
- **WCAG:** 1.4.3 Contrast (Minimum), 1.4.11 for meaningful icons.
- **Suggested fix:** Keep `--text-3` for decoration only; give placeholders and meta text a token that reaches 4.5:1 on paper and grouped. Colour choice is yours (see Design decisions).
- **Scope:** Global (token).

### B5. Status colours too light for text
- **Screen / component:** `--available #1e9e5a` as text ("Available from 5 Oct" in Discover rows), `--danger #d83a2e` as text on paper ("Remove from project", inline errors).
- **Issue:** Available green: 3.14:1 on paper, 3.45:1 on white, 2.90:1 on tint. Danger red: 4.19:1 on paper (passes on white at 4.60).
- **Why it matters:** Availability is a key decision signal for hiring; errors must be readable.
- **WCAG:** 1.4.3.
- **Suggested fix:** Darker text variants of both (keep the bright green for the dot, which only needs 3:1 against its white ring).
- **Scope:** Global (tokens).

### B6. Composer fields rely on placeholders as their label
- **Screen / component:** Collab composer (role, project title, location, amount, details), post composer text, message field, Discover search.
- **Issue:** Most have an `aria-label` (good for screen readers) but the only visible label is placeholder text that disappears on typing, and that placeholder is the 2:1 grey from B4.
- **Why it matters:** People with memory or attention difficulties lose the prompt as soon as they type; low-vision users cannot read it in the first place.
- **WCAG:** 3.3.2 Labels or Instructions, 1.4.3.
- **Suggested fix:** Persistent visible labels in rows (iOS-style inline label on the left, value on the right), as the composer already does for Start, End and Type.
- **Scope:** Local (composers), pattern global.

### B7. Form errors are not identified to assistive technology, and disabled buttons do not say why
- **Screen / component:** Sign-in (`field-error` for unknown email, wrong password), sign-up (Continue disabled until the email looks valid and the password has 8 characters), Edit role save failure, show-interest send failure, invite mismatch.
- **Issue:** Error text is plain `<p>`: no `role="alert"`, no `aria-invalid`, not linked with `aria-describedby`. The password hint is not associated either. On sign-up the button just stays disabled with no message about what is missing. There is no `aria-describedby` anywhere in the app; `aria-invalid` appears zero times.
- **Why it matters:** Screen-reader users do not hear that sign-in failed. Everyone with a disabled Continue has to guess what is wrong.
- **WCAG:** 3.3.1 Error Identification, 3.3.3 Error Suggestion, 4.1.3 Status Messages, 1.3.1.
- **Suggested fix:** A `Field` pattern with hint and error slots wired through `aria-describedby`, `aria-invalid` on error, errors announced with `role="alert"`. Either explain what is missing beside a disabled button or enable it and show errors on submit.
- **Scope:** Global (Field component) plus local call sites.

### B8. No autocomplete on personal data fields
- **Screen / component:** Sign-up and sign-in email and password, account name, phone in Add person.
- **Issue:** No `autocomplete` attribute on any field in the app.
- **Why it matters:** People with motor or cognitive disabilities depend on autofill and password managers.
- **WCAG:** 1.3.5 Identify Input Purpose.
- **Suggested fix:** `email`, `current-password` / `new-password`, `name`, `tel`.
- **Scope:** Local (Entry.tsx, Create.tsx).

### B9. Text inputs show no focus indicator
- **Screen / component:** Discover search, message field, post composer text, project title input, composer row inputs and selects (`.search input`, `.convo-field`, `.composer-text`, `.title-input`, `.row-input`, `.row-select`, `.money-field-input` in rows).
- **Issue:** `outline: none` with no replacement. Confirmed in the keyboard run: Discover search focused with no indicator. (`.field` and the new date and money fields in `.field` boxes do have a replacement ring.)
- **Why it matters:** Keyboard users cannot see they are in the field.
- **WCAG:** 2.4.7 Focus Visible.
- **Suggested fix:** A focus-within ring on the containing row or search pill, matching `.field:focus`.
- **Scope:** Global (CSS).

### B10. Toasts with Undo vanish before a keyboard or screen-reader user can reach them
- **Screen / component:** `ToastHost` in `chrome.tsx`, timing in `store.tsx` (2.6 s, or 4.2 s with an action). Withdraw interest, withdraw response.
- **Issue:** The toast is announced (`aria-live="polite"`, good) but its Undo button sits at the end of the DOM, behind hundreds of tab stops (A1), and disappears after 4.2 s. There is no way to pause or extend it.
- **Why it matters:** The only quick recovery path is effectively mouse-only.
- **WCAG:** 2.2.1 Timing Adjustable, 2.1.1.
- **Suggested fix:** Keep action toasts until dismissed (or at least 10 s), pause on hover and focus, and keep the in-place recovery (the role already shows "Withdrawn. You can show interest again").
- **Scope:** Global.

### B11. Selected state of choice chips is visual only
- **Screen / component:** 16 raw chip toggles not using the `Chip` primitive: Add role (quick roles, Paid / Unpaid), New project (format, languages, stage), Edit profile (languages, crafts), House setup (city, work).
- **Issue:** Selection is shown by the green fill only; no `aria-pressed`, `aria-checked` or radio semantics.
- **Why it matters:** A screen-reader user creating a role cannot tell whether Paid or Unpaid is chosen.
- **WCAG:** 4.1.2, 1.3.1.
- **Suggested fix:** Use `Chip` (already has `aria-pressed`) for multi-select and a radiogroup for single choice.
- **Scope:** Global (replace raw markup).

### B12. Long posts can only be expanded with a mouse or touch
- **Screen / component:** `PostCard` (`<p onClick={() => setExpanded(true)}>`).
- **Issue:** The clamped text expands on click of a paragraph; it is not focusable and has no "more" control.
- **Why it matters:** Sighted keyboard users cannot read the rest of a long post.
- **WCAG:** 2.1.1 Keyboard.
- **Suggested fix:** A real "More" button after the clamped text.
- **Scope:** Local.

---

## C. Medium

### C1. Headings: no h1 on Home, none in a thread, sheets always h3
- **Screen / component:** Individual Home and House Home start at h2. Conversation thread has no heading. All sheet titles are `h3` (axe `heading-order`). Create surface title is a `<p>`. Mounted tabs mean several h1s exist in the DOM at once (fixed by A1).
- **Why it matters:** Heading navigation is the main way screen-reader users skim.
- **WCAG:** 1.3.1, 2.4.6.
- **Suggested fix:** Visually hidden h1 on Home ("Home" / house name), thread partner as h1, sheet titles as h2, Create title as a heading.
- **Scope:** Global plus local.

### C2. No main landmark, no bypass, one page title for everything
- **Screen / component:** Whole app. `index.html` title "Art and Artist Prototype" never changes in the product (only Lab and Dashboard set titles). No `<main>`; several `<header>` banners per view (axe `landmark-no-duplicate-banner`, `landmark-unique`).
- **WCAG:** 1.3.1, 2.4.1 Bypass Blocks, 2.4.2 Page Titled.
- **Suggested fix:** `<main>` on the active layer only, page title per screen ("Neela Akasham, project · Art and Artist"), headers scoped so only one banner is exposed.
- **Scope:** Global.

### C3. Status changes are not announced
- **Screen / component:** Discover result counts ("21 people") update silently; skeletons use `aria-busy` only; `PageError` is not announced; the publish bar (Posting… / Posted / Couldn't post) is not live; Button `loading` spinner's "Loading" label is on a plain `span` and never read.
- **WCAG:** 4.1.3 Status Messages.
- **Suggested fix:** One polite live region for counts and publish progress, `role="alert"` for errors, `role="status"` text in the loading button.
- **Scope:** Global.

### C4. ARIA labels on elements that cannot carry them
- **Screen / component:** Logo `span aria-label` (axe `aria-prohibited-attr` on most screens), splash loader "Loading", onboarding progress "Step 1 of 2", intro dots wrapper "Screen 1 of 3", Button spinner.
- **Why it matters:** These names are silently dropped, so the step position and loading state are never announced.
- **WCAG:** 4.1.2, 1.3.1.
- **Suggested fix:** `role="img"` for the logo (or hide it), `role="status"` text for loaders, `role="progressbar"` or visible text for steps.
- **Scope:** Global.

### C5. Dialogs with an empty name
- **Screen / component:** More, Post menu and Block sheets pass `title=""`; `aria-label={title ?? 'Sheet'}` keeps the empty string.
- **WCAG:** 4.1.2.
- **Suggested fix:** Always name the dialog ("More options for Tara Menon", "Block Tara Menon").
- **Scope:** Local plus `Sheet` default.

### C6. Toggle names that change with state
- **Screen / component:** `SaveButton` ("Save" ⇄ "Remove from Saved" plus `aria-pressed`), `FollowButton` ("Follow X" ⇄ "Following X" plus `aria-pressed`).
- **Issue:** Both the name and the pressed state change, so screen readers say "Remove from Saved, toggle button, pressed". Six identical "Save" buttons on Home say nothing about what they save.
- **WCAG:** 4.1.2, 2.4.6.
- **Suggested fix:** Stable name with the object ("Save Director of Photography role", "Follow Konark Pictures") and `aria-pressed` for the state.
- **Scope:** Global (two components).

### C7. Unread and new are shown by a dot only
- **Screen / component:** Inbox thread dot, tab bar Inbox dot (name stays "Inbox"), notification rows.
- **WCAG:** 1.3.1, 1.4.1 Use of Color (shape helps visually, but nothing is exposed to screen readers).
- **Suggested fix:** "Inbox, 2 unread" as the tab name; visually hidden "Unread" in thread rows.
- **Scope:** Global.

### C8. Single-choice groups and tabs do not use arrow keys
- **Screen / component:** Onboarding craft grid, intent list, "When can you start?" segmented control, Discover scope `Tabs`.
- **Issue:** Correct roles and `aria-checked` / `aria-selected`, but every option is a separate tab stop and arrows do nothing; tabs have no `tabpanel` / `aria-controls`.
- **WCAG:** 4.1.2 (expected interaction for the role), 2.1.1 works via Tab so not blocking.
- **Suggested fix:** Roving tabindex with arrow keys in a shared radiogroup helper and in `Tabs`.
- **Scope:** Global.

### C9. Touch targets
- **Screen / component:** See table. AA (2.5.8) needs 24x24; the target here is 44x44.

| Control | Size (CSS px) | AA 24 | Goal 44 |
|---|---|---|---|
| Back, Share, More, Settings (floating icon buttons) | 40x40 | Pass | Short |
| Save on Home cards | 36x36 | Pass | Short |
| Follow, Review, Accept, View, Confirm (small buttons) | 33 to 36 tall | Pass | Short |
| Chips and filters | 36 tall | Pass | Short |
| Toggles | 51x31 | Pass | Short |
| Section title links | 26 tall | Pass | Short |
| Inline links ("Clear", "See details") | 18 to 23 tall | Borderline (spacing) | Short |
| Message send | 36x36 | Pass | Short |
| Search clear | 28x28 | Pass | Short |
| Password show / hide | about 18 to 24 | Borderline | Short |
| Row selects in composer | 22 tall | Fail | Short |
| Media viewer dots | 6x6 | Fail | Short |
| Intro screen dots | under 24 (axe `target-size`) | Fail | Short |

- **Suggested fix:** Invisible hit areas (padding or a pseudo-element) so most visuals stay the same size.
- **Scope:** Global.

### C10. Truncation hides content at small widths and larger text
- **Screen / component:** Portrait card context ("Hires crew · Hyderabad"), poster tile meta (house names), credit rail issuer names, role pay line ("₹22k–28k / day"), feature card text at 1.5x. Fixed-height cards (portrait 235, poster 168x210, feature 420) clip rather than grow.
- **Measured:** 5 truncated items on Home at 320 px with default text; 19 with type at 1.5x; 15 with 1.4.12 text spacing. No horizontal page scroll anywhere (good).
- **WCAG:** 1.4.4 Resize Text, 1.4.10 Reflow, 1.4.12 Text Spacing.
- **Suggested fix:** Allow two lines and let cards grow (needs a decision on uniform card sizes).
- **Scope:** Global (card components).

### C11. Contrast failures beyond the tokens above

| Where | Foreground | Background | Ratio | Needs |
|---|---|---|---|---|
| `--text-2` on tint band | #6e6e73 | #efebe4 | 4.27 | 4.5 |
| `--text-2` on sand (where the override is missing) | #6e6e73 | #e8dfcf | 3.84 | 4.5 |
| `--text-2` on fill-strong (initials avatar) | #6e6e73 | #e5e5ea | 4.04 | 4.5 (decorative, see D5) |
| Focus ring on dark surfaces (viewer, intro, dark cards) | #275c50 | #151413 | 2.39 | 3 |
| Identity switch label while visible | #575552 | #151413 | 2.48 | 4.5 |

- **WCAG:** 1.4.3, 1.4.11.
- **Scope:** Global (tokens and ring).

### C12. Media viewer depends on swipe and tiny dots
- **Screen / component:** `MediaViewer` in `App.tsx`.
- **Issue:** Next and previous by swipe or 6 px dots only; no arrow keys; dots named "Item 1" with no current state. Dismiss by vertical drag or Close (Close is labelled, good).
- **WCAG:** 2.5.8 Target Size, 2.1.1 (works through dots, poorly), 4.1.2 for the current dot.
- **Suggested fix:** Previous / Next buttons, arrow keys, `aria-current` on the dot.
- **Scope:** Local.

### C13. Telugu text read with an English voice outside a few components
- **Screen / component:** `scriptLang()` sets `lang` in `compose.tsx` (frame labels, person tiles). Profile h1, project titles, posts and messages do not.
- **WCAG:** 3.1.2 Language of Parts.
- **Suggested fix:** Apply `scriptLang` in the shared title and text components.
- **Scope:** Global.

### C14. High-impact actions with no confirmation or undo
- **Screen / component:** House: "Remove from project" (one tap, no confirm, no undo). Person: "Accept" on a pending credit (one tap, and the credit then "can't be removed or edited").
- **WCAG:** 3.3.4 Error Prevention (Legal, Financial, Data) applies to deleting user data (the association); best practice for the credit.
- **Suggested fix:** Undo for removal; a short confirmation for accepting a permanent credit (product decision).
- **Scope:** Local.

---

## D. Low

| # | Screen / component | Issue | WCAG | Fix | Scope |
|---|---|---|---|---|---|
| D1 | Detail headers | "Share", "More" without object; house project has two "View" buttons; Inbox "Review" | 2.4.6 | "Share Neela Akasham", "View Gaffer role", "Review 3 interested for 1st AC" | Global |
| D2 | Focus ring | Forced `border-radius: 8px` on every focus ring, so pill and round controls get a squared ring | 2.4.7 (consistency) | Inherit the control's radius | Global |
| D3 | Floating tab bar | 12 of 53 focus stops on Home sit partly under it (up to 67%), none fully hidden: passes AA 2.4.11, fails AAA 2.4.12 | 2.4.11 / 2.4.12 | `scroll-padding-bottom` equal to the bar | Global |
| D4 | Disabled primary buttons | White on 35% action is 1.92:1 (disabled is exempt) | n/a | Fine to keep; pair with B7 messaging | Global |
| D5 | Initials avatars | #6e6e73 on #e5e5ea 4.04:1; avatar is `aria-hidden` and the name is beside it | 1.4.3 | Darken with the C11 change | Global |
| D6 | Identity switch overlay | Transient label contrast while it fades | 1.4.3 | Darker label | Local |
| D7 | Repeated stops | Portrait card and its Follow button, rows and their Follow, are separate stops for the same person | 2.4.3 | Resolved by B1 | Global |
| D8 | Copy | See Language section | 3.3.2, 2.4.6 | Targeted wording only | Local |

---

## Language and comprehension

Only copy that can cause comprehension problems; no general rewrite.

- **"Something wrong?"** on a pending credit opens the dispute path. The consequence (reporting the credit to the house) is not clear from the label.
- **"Acting as" / "Act for"** for switching to a house reads as the acting craft in a film product. Worth a second look.
- **Interest vocabulary is inconsistent:** "Show interest" (person), "Interested" (house sheet title), "Respond", "Review". One verb per side would help.
- **"Open on Art and Artist"** is a visibility setting but reads as an action button.
- **"Confirm 12 Oct"** on an Inbox thread preview does not say what is being confirmed.
- **"Review", "View"** without objects (D1).
- **Disabled Continue on sign-up** gives no instruction (B7).
- **Placeholders as instructions** disappear on typing (B6).

## Error prevention review

| Action | Current protection | Assessment |
|---|---|---|
| Unfollow | One tap, reversible | Fine |
| Remove from Saved | One tap, reversible | Fine |
| Withdraw interest / response | One tap, Undo toast (4.2 s), can show interest again | Fine once B10 is fixed |
| Close role | Sheet with reasons | Good |
| Block | Confirmation sheet | Good |
| Report | Multi-step sheet | Good |
| Delete account | "Are you sure?" screen | Good |
| Remove from project (house) | None | C14 |
| Accept credit (permanent) | None | C14, decision |

---

## 1. Already accessible: keep as is

- `lang="en"`, zoom allowed in the viewport meta, no horizontal page scroll at 320 px, full-screen layout below 520 px.
- Global `:focus-visible` ring: 2 px #275c50 (7.0:1 on paper), offset, visible on buttons, cards, chips, tab bar and Create (verified by capture).
- Bottom navigation: `<nav aria-label="Main">`, `aria-current="page"`, text labels, Create has `aria-expanded` and `aria-haspopup`, the Profile tab name includes the house when acting for one.
- Almost every control is a real `<button>` (`Pressable` is a motion button); only five click handlers sit on non-interactive elements.
- `IconButton` requires a label, so every icon-only button is named; the password field has Show / Hide password.
- `PressCard` handles Enter and Space; Home role cards and portrait cards carry concise labels, and portrait labels include ", available".
- `FollowButton` uses `aria-pressed` and the person's name; `Toggle` is `role="switch"` with a label; `Chip` uses `aria-pressed`; the consent checkbox is a labelled `role="checkbox"`; onboarding choices are radiogroups.
- Auth fields are wrapped in `<label>`; Edit profile fields use `for`.
- Reduced motion: `MotionConfig reducedMotion="user"` plus a global CSS rule. Screen push becomes instant, object tilt is removed, opacity feedback stays. Nothing autoplays or flashes.
- Toasts are in a polite live region; the identity switch is announced through `role="status"`.
- Escape closes the open sheet, then the top screen; closing Create with Escape leaves focus on the Create button.
- Avatars and the status bar are hidden from screen readers; decorative images use `alt=""`.
- Text over photos sits on scrims: 12 to 19:1 measured against the real image pixels on visible cards.
- Main text 17:1 on paper; white on the action colour 7.7:1; `--text-2` on paper 4.62:1; the sand band already darkens secondary text to 6.2:1.
- Dates are calendar-only and money is digits-only with a numeric keypad; both are labelled.
- Destructive confirmations exist for close role, block, report and delete account.

## 2. Global issues to solve once in the component layer

| Fix | Resolves | Where |
|---|---|---|
| `inert` on inactive tab layers and on everything under the top route | A1, A2, D7, part of C1 | `App.tsx` Phone |
| Route focus: focus new screen heading on push, restore on pop | A2 | Route stack |
| Dialog behaviour: focus in, contain, `inert` background, restore, `aria-labelledby`, accessible Close | A3, A4, C5 | `Sheet`, `CreateSurface`, house project sheets |
| Card pattern with a single real link or button and sibling actions | B1, D7 | `PressCard` |
| Contrast tokens for meta / placeholder text, available text, danger text, ring on dark | B4, B5, C11, D5 | `tokens.css`, `expression.css` |
| Focus-within ring for inline inputs and selects | B9 | CSS |
| `Field` with hint and error wiring, `aria-invalid`, alerts | B7 | New shared component |
| Stable names on toggles with object context | C6, D1 | `SaveButton`, `FollowButton`, `IconButton` callers |
| Action toasts that persist and pause | B10 | `ToastHost`, store |
| Live region service for counts, progress, errors | C3 | `chrome.tsx` |
| Radiogroup helper and arrow keys in `Tabs` | C8, B11 | `primitives.tsx` |
| Hit-area utility class | C9 | CSS |
| `scriptLang` in shared text components | C13 | `compose.tsx`, `primitives.tsx` |
| `<main>`, single banner, per-screen document title, hidden h1 | C1, C2 | App shell |

## 3. Screen-specific issues

| Screen | Issues |
|---|---|
| Splash / intro | Intro dots under 24 px (C9), "Screen n of 3" not announced (C4), loader not announced (C4) |
| Sign-up / sign-in | No autocomplete (B8), errors not announced or linked (B7), disabled Continue unexplained (B7), password toggle target (C9), step progress not announced (C4) |
| Onboarding | Radiogroups without arrow keys (C8), date field fine |
| Home (individual) | No h1 (C1), nested Save and Follow in cards (B1), six "Save" with no object (C6), truncated card meta (C10), "You're all caught up" at 2:1 (B4) |
| Home (house, cold start) | No h1 (C1), nested controls in rows (B1) |
| Discover / Search | Search has no focus ring (B9), result count not announced (C3), Follow inside rows (B1), "Available from" green at 3.1:1 (B5), tabs without arrows (C8) |
| Role detail | Save / Share without object (C6, D1), focus not moved on open (A2) |
| Show interest | Sheet focus (A3), no close for screen readers (A4), send failure not announced (B7) |
| Project detail | Stills unnamed (B2, B3) |
| Person profile | Portfolio unnamed (B2, B3), "More" dialog unnamed (C5) |
| Production house profile | "Share" / "More" without object (D1), More sheet unnamed (C5) |
| Messages | Thread has no heading (C1), message field no focus ring (B9), unread dot only (C7), "Confirm 12 Oct" unclear |
| Create | Title not a heading (C1), surface focus (A3) |
| Collab composer | Placeholder labels (B6) at 2:1 (B4), row selects 22 px (C9), row inputs no focus ring (B9) |
| Post composer | Text field no focus ring (B9), long post expansion mouse-only (B12) |
| Profile (own) | Portfolio unnamed (B2), Accept credit irreversible (C14), "Something wrong?" unclear |
| Edit profile | Language / craft chips without state (B11) |
| Projects and credits (house) | Remove from project unconfirmed (C14), two "View" buttons (D1), chips without state in Add role (B11) |
| Settings | Toggles fine; header duplication (C2) |
| Media viewer | Swipe / 6 px dots only, no arrows, images without alt (C12, B3), ring on black 2.4:1 (C11) |
| Empty states | Fine semantically; "You're all caught up" contrast (B4) |
| Error states | `PageError` not announced, no focus move (C3) |
| Loading states | Skeletons only `aria-busy`; spinner label dropped (C3, C4) |

## 4. Top 10 fixes by impact

1. **`inert` on inactive tabs and covered screens** (A1, A2). One change; removes about two thirds of all tab stops and every invisible focus.
2. **Dialog behaviour in `Sheet` and `CreateSurface`** (A3, C5): focus in, contain, restore, label.
3. **An accessible Close on every sheet** (A4): unblocks screen-reader users on phones.
4. **Focus to the new screen on push, back to the opener on pop** (A2).
5. **Card pattern without nested buttons** (B1): makes Follow, Save and Review reachable for screen readers everywhere.
6. **Contrast tokens** for placeholder and meta text, availability and danger text, and the ring on dark (B4, B5, C11).
7. **Forms:** visible labels in composers, error wiring and announcements, autocomplete, explain disabled Continue (B6, B7, B8).
8. **Names:** image buttons, Save and Share with their object, stable toggle names (B2, B3, C6, D1).
9. **Focus ring on inline inputs** (B9) and **action toasts that persist** (B10).
10. **State exposure and structure:** chip selection, unread counts, h1 per screen, `<main>`, page titles (B11, C7, C1, C2).

## 5. Components that need accessibility states added

| Component | Missing |
|---|---|
| `Sheet` | Focus management, `aria-labelledby`, Close control, non-empty name |
| `CreateSurface` | Same as Sheet |
| `PressCard` | Restructure (no nested controls); concise label |
| `SaveButton` | Stable name with object; keep `aria-pressed` |
| `FollowButton` | Stable name; keep `aria-pressed` |
| Raw chip toggles | `aria-pressed` or radio semantics |
| `Tabs` | `tabpanel`, `aria-controls`, arrow keys |
| Radiogroups (onboarding) | Roving tabindex, arrow keys |
| `Button` (`loading`) | Announced loading text |
| Field pattern | `aria-invalid`, `aria-describedby` for hint and error, required state |
| `DateField` / `MoneyField` | Invalid and required states, hint association |
| `ToastHost` | Persist when actionable, pause on focus |
| `PublishBar` | Live region |
| `PageSkeleton` / `PageError` | Status / alert announcement |
| Inbox thread, tab bar Inbox | Unread exposed in the name |
| `Photo` | Meaningful `alt` where the image is the content |
| Media viewer dots | `aria-current`, larger targets, Previous / Next |
| Onboarding progress, intro dots | Announced step position |

## 6. Issues that need design decisions rather than only code

- **Sheet close:** a visible Close or Done in every sheet header, or a visually hidden one for screen readers only.
- **Grey and status colours:** new values for `--text-3` as text, the available green as text and danger on paper. These are brand palette choices.
- **Uniform card sizes** (168x210 posters, fixed portrait and feature cards) versus letting text wrap to two lines.
- **Composer labels:** inline row labels ("Role", "Project", "Amount") replacing placeholder-only rows.
- **Disabled Continue:** explain beside the button, or enable it and validate on submit.
- **Undo policy:** how long action toasts stay, and whether Undo also appears in place.
- **Confirmation** for Remove from project and for accepting a permanent credit.
- **Touch targets:** whether 40 px icon buttons and 36 px Save grow visibly or only gain invisible hit area.
- **Focus target on screen push:** the screen heading or the Back button.
- **Terminology:** "Acting as", "Something wrong?", one verb set for interest.

## 7. Fixes that could visibly change the design

- Darker placeholder, hint and meta grey; darker availability green text; darker red on paper.
- Visible Close or Done on sheets.
- Inline labels in the composer rows.
- Cards that grow to two lines, breaking the uniform card grid.
- Visible size increase for 40 px icon buttons, 36 px Save and 33 to 36 px small buttons if hit areas are not kept invisible.
- New focus treatment on the search pill, message field and composer rows.
- Error text under fields and explanatory text beside disabled buttons.
- A visible "Unread" or count where only a dot is used today.
- Previous / Next controls in the media viewer.

Everything else (`inert`, focus management, names, ARIA states, live regions, landmarks, titles, autocomplete,
arrow keys, `lang`) is invisible to sighted mouse users.

---

## Appendix: automated results (axe-core, unique issues)

| Rule | Where | Notes |
|---|---|---|
| `aria-hidden-focus` | Every product state | Hidden tab layers (A1) |
| `nested-interactive` | Home, Discover, Inbox, house home, entry flows | Card pattern (B1) |
| `button-name` | Profiles, project | Portfolio and stills (B2) |
| `aria-prohibited-attr` | Most states | Logo, loader, progress (C4) |
| `heading-order` | Sheets | h3 titles (C1) |
| `landmark-no-duplicate-banner`, `landmark-unique` | Pushed screens | Multiple headers (C2) |
| `color-contrast` | Discover, thread, add role | Under-reports inside the scaled phone; the manual sweep found more (B4, B5, C11) |
| `target-size` | Intro dots | C9 |
| `region` | Home | Content outside landmarks (C2) |

As expected, axe found none of the critical issues in section A: those came from the keyboard runs.

## Appendix: token contrast matrix

| Foreground | White | Paper #f6f4f0 | Grouped #f2f2f7 | Tint #efebe4 | Sand #e8dfcf | Dark #151413 |
|---|---|---|---|---|---|---|
| text #111 | 18.88 | 17.19 | 16.92 | 15.89 | 14.29 | n/a |
| text-2 #6e6e73 | 5.07 | 4.62 | 4.54 | **4.27** | **3.84** | n/a |
| text-3 #aeaeb2 | **2.21** | **2.01** | **1.98** | **1.86** | **1.67** | 8.32 |
| action #275c50 | 7.68 | 7.00 | 6.89 | 6.47 | 5.81 | **2.39** |
| available #1e9e5a | **3.45** | **3.14** | **3.09** | **2.90** | **2.61** | 5.34 |
| danger #d83a2e | 4.60 | **4.19** | **4.12** | **3.87** | **3.48** | 4.00 |
| verified #1f5af6 | 5.45 | 4.96 | 4.89 | 4.59 | **4.12** | 3.37 |

Bold: below 4.5:1 for normal text (or below 3:1 for the ring on dark).
