# Notifications and Settings: UX and visual audit

Scope: the normal mobile app only. Home, Discover, profiles, Inbox, Create, projects, credit logic,
messaging logic, `/test` and `/research` are out of scope and unchanged.

Method: code review (`src/screens/sheets/Sheets.tsx` › `Notifications`, `src/screens/settings/*`,
notification creation in `src/domain/actions.ts`, seeds in `src/data/seed.ts` and `src/state/world.ts`)
and captures at 390 × 844 for Kiran (busy individual), Tara (one notification), Aditi personally (a member
of two houses, nothing personal) and Aditi acting for Konark Pictures.

## What each surface is for

| Surface | Question it answers | Owns |
|---|---|---|
| Home › Waiting on you | What needs me right now? | At most three rows: credits to confirm, interest to review, replies waiting |
| Notifications | What has happened around my professional activity? | Everything that happened to you or your house, then news from your network, read and unread |
| Inbox | Who am I talking to? | Conversations |

Overlap is deliberate in one direction only: an event that needs you appears on Home *and* as a
notification (the record of what happened). Notifications never becomes a task list, and Home never
becomes a log.

## Current state (before)

**Notifications** is a sheet from the Home bell (the unread count is on the bell's accessible name and
a dot). Grouping: "3 new" (large heading) › rows › "Earlier" (small label) › rows › "From your network"
(small label) › network rows. Identity chips (You · each house · All) appear for house members. Each
row: avatar 40, one sentence, time, unread dot. Read rows are grey. Network rows reuse Home's
`NetworkRow`: bold names, 44 px avatars, photo thumbnails.

Types and destinations:

| Type | Example | Tap goes to | OK? |
|---|---|---|---|
| Credit issued to you | "Blue Lotus Originals issued you a credit on Fault Lines · S1. Accept it to make it official." | Your profile (Waiting for your confirmation) or the association | Yes |
| Revised / kept credit | "… proposed a revised credit on …" | Association | Yes |
| Credit public | "Your credit from Tidewater Films is public: …" | Your profile | Yes |
| Added to a project | "Konark Pictures added you to Neela Akasham as …" | Association | Yes |
| Interest in your collaboration | "3 people are interested in your 1st AC collaboration" | Review interest sheet | Yes |
| Role filled / closed (you showed interest) | "… filled DoP on … Thanks for your interest." | The role | Yes |
| Message / reply | "Konark Pictures replied about Director of Photography" | The conversation | Yes |
| Follow | "Zoya Khan followed you" | Their profile | Yes |
| House: interest in a role | "Vikram Sen and 2 others are interested in …" | House project workspace (review there) | Yes |
| House: correction / amendment / accepted / "isn't right" | "Sameer Ali asked to correct a credit on Neeli Raat: …" | House project workspace | Yes |
| House: credits public | "Monsoon Letters: all 6 credits are now public" | The public project | Yes |
| Network: credited | "Meera Krishnan was credited on Monsoon Letters" | Their profile | Yes |
| Network: added a project | "Nandini Rao added the project Kaaval" | **A full-screen photo** | **No** |
| Network: looking for (collab) | "Arjun Rao is looking for a gaffer in Mumbai" | The collaboration | Yes |
| Network: available | "Rhea Kapoor is available from 5 Oct" | Their profile | Yes |

**Settings** (personal, from the gear on your own profile): 9 groups (10 for a house member), 23 to 25
rows, about 2.7 screens: Account (name, phone, email, read-only) · Your content (Saved, Your activity) ·
Privacy and discoverability · Notifications · Blocked · Organisations you can act for · Legal and safety
(5 rows) · Your data (one row: "Agreements, download, delete account") · Help (one row) · Security
(two-step, devices, Sign out). Rows sit in grey rounded containers; two rows have icons, the rest none.

**House settings** (from the house profile, only while acting for the house): Page (view, Edit page,
verification) · Who can act for this house · Credit authority (with a "Fixed / Open question … prototype
assumption" note) · House notifications. Personal and house settings never mix: correct.

## Findings

Severity: 3 = blocks or misleads, 2 = slows or confuses, 1 = polish.

### Notifications

| # | Issue | Evidence in current UI | Heuristic / principle | Sev | Proposed change | Class |
|---|---|---|---|---|---|---|
| N1 | Network news outweighs things that happened to you | Network rows have bold names, larger avatars and photo thumbnails; your own rows are plain text, and read ones grey | Visual hierarchy should follow relevance (H8, aesthetic and minimalist; brief: network lower than personal) | 2 | A quieter network row in Notifications: smaller avatar, no thumbnail, secondary text colour, name not bold | FIX |
| N2 | Inconsistent group headings | "3 new" is a large heading; "Earlier" and "From your network" are small grey labels | Consistency and standards (H4) | 1 | One label style: "New", "Earlier", "From your network"; "Mark all as read" sits on the New label | FIX |
| N3 | Rows read as paragraphs; WHO is not scannable | One sentence, no emphasis on who; instructions appended ("Accept it to make it official.", "Thanks for your interest."); detail after a colon runs on ("…on Neeli Raat: Chief Lighting Technician, not Gaffer") | Recognition over recall; minimalist copy (H6, H8) | 2 | Display only: the actor's name in semibold, trailing instruction sentences dropped, text after the first colon on its own context line. Stored text is unchanged | FIX |
| N4 | You can't tell which new items need a response | An issued credit and a follow look the same | Visibility of system status (H1) | 2 | A small "To review" in the time line on unread items that ask for a decision (credit to accept, correction or amendment to answer, interest to review). No inline accept: accepting a credit needs the role details and the correction path | IMPROVE |
| N5 | Double empty message, and no proper empty state | Aditi personally: "No new notifications" then "Nothing here yet." | Error prevention / clear status (H1, H9) | 2 | One quiet state: "You're all caught up" + "New activity around your work and network will appear here." If another identity has new items, one link to view them | FIX |
| N6 | "Added the project" opens a photo | Tapping "Nandini Rao added the project Kaaval" opens the media viewer | Match between system and real world: a notification opens what it describes (H2) | 2 | In Notifications, project events open the public project when one exists, else the person | FIX |
| N7 | Message notifications repeat Inbox (and Home) | "Konark Pictures replied…" is in Notifications, on Home and in Inbox | Brief: surfaces must not copy one another | 2 | Kept: it is the only signal that reaches you while you act as another identity (a house message while you're yourself), and an existing walkthrough relies on it. Revisit with a push-notification model | NEEDS VALIDATION |
| N8 | Bell says "2 new" while "You" is empty (house member) | Aditi personally; the 2 are Konark's | Visibility (H1) | 1 | Kept: the chips show "Konark Pictures · 2"; the new empty state adds a link to them (N5) | KEEP |
| N9 | Long lists | Sheet scrolls; network capped at 5 + See all into "Your network" | | — | Keep | KEEP |
| N10 | Read / unread | Small dot + dark text vs grey | | — | Keep the dot and colour; add the semibold actor name only while unread | KEEP |

### Settings

| # | Issue | Evidence in current UI | Heuristic / principle | Sev | Proposed change | Class |
|---|---|---|---|---|---|---|
| S1 | Too many small groups; slow to scan | 9–10 groups, three with a single row (Your data, Help, Blocked when empty), 2.7 screens | Minimalist design (H8); chunking | 2 | Six groups: Account and security · Privacy and safety · Notifications · Houses you act for (members only) · Help and legal · Your data; then Sign out and Delete account on their own | FIX |
| S2 | Settings repeats the profile | "Your content" (Saved, Your activity) with the note "Also on your profile."; read-only Name | Profile vs settings separation (brief) | 2 | Remove "Your content" (both stay on your profile). Name opens Edit profile instead of being a dead read-only row | FIX |
| S3 | Delete account is hidden | Only reachable through "Agreements, download, delete account" | Visibility; user control (H1, H3) | 2 | "Delete account" row at the bottom (destructive text, opens the existing delete flow); "Your data" row for agreements and download | FIX |
| S4 | A chevron that doesn't navigate | "Who can message me ›" silently flips Everyone / People I know on tap | Consistency (H4); system status (H1) | 2 | Opens a small sheet with the two options as radios (same values, same local state) | FIX |
| S5 | Sign out buried in Security, same weight as info rows | Last row of "Security" | Consequence should match prominence | 1 | Its own quiet row near the bottom, above Delete account; existing confirm sheet kept | FIX |
| S6 | Blocked list grows Settings | Each blocked person is a row with a button inside Settings | Settings should stay short | 1 | "Blocked accounts" row with a count, opening a sheet with the same list and Unblock buttons; "None" without chevron when empty | IMPROVE |
| S7 | Too many explanatory notes | 5 notes under groups | Minimalist copy (H8) | 1 | Keep two short ones (credits are always public; house notifications live in each house's settings, members only) | FIX |
| S8 | Cards for a utility screen; icons on 2 of 23 rows | Grey rounded containers per group; icons only on Saved and Your activity | Brief: quieter than Home/Profile; consistent row system | 1 | Flat rows on the page background with inset hairlines and section labels; no decorative icons (avatars stay where they identify someone) | IMPROVE |
| S9 | House settings: a dead-end row | "Edit page ›" shows a toast "not designed yet" | Don't offer what doesn't work (H5) | 2 | Remove the row until the feature exists | FIX |
| S10 | House settings: internal design note visible | "Open question: … The list above is a prototype assumption." | Internal information shown to users | 2 | One user-facing line: "Credits on this house's projects are issued by the house, never by the person credited." The open question moves to a code comment | FIX |
| S11 | Houses you act for duplicates the identity switcher | Rows switch identity (and so open that house's settings) | Don't duplicate switching | 1 | Kept: the group is about membership status, and tapping opens that house's settings, which is the only way in from personal settings. Renamed "Houses you act for" | KEEP |
| S12 | Messaging permission is not enforced | "Who can message me" is local state only | F11 in the heuristic audit | — | Not extended or wired up | NEEDS VALIDATION |
| S13 | Personal vs house separation | House settings appear only while acting for the house, personal only as yourself | | — | Keep | KEEP |

## Implementation record

Implemented: every FIX and the two IMPROVE items (N4, S6, S8). Not implemented: N7 and S12 (NEEDS
VALIDATION). Kept: N8, N9, N10, S11, S13.

One bug found during verification and fixed: Kiran's seeded "Konark Pictures replied about Director of
Photography" pointed at a conversation id that `world.ts` had merged into the shared thread
`th-konark-kiran`, so it opened "Conversation unavailable". The seed now points at the thread
(`src/data/seed.ts`).

### Information architecture

**Notifications, before:** "3 new" (heading) · rows · Earlier · rows · From your network (heavier rows).
Empty: "No new notifications" + "Nothing here yet."

**Notifications, after:** [identity chips, house members only] · NEW (+ Mark all as read) · EARLIER · FROM
YOUR NETWORK (lighter rows, 5 + See all). One label style. Empty: "You're all caught up / New activity
around your work and network will appear here." plus, when another identity has news, "Konark Pictures
has 2 new".

Row: avatar · **Who** what[:] · detail line (only when the text has one) · time [· To review].

**Settings, before (personal):** Account · Your content · Privacy and discoverability · Notifications ·
Blocked · Organisations you can act for · Legal and safety · Your data · Help · Security (with Sign out).
2.6–2.8 screens.

**Settings, after (personal):** Account and security (Name › Edit profile, Phone, Email, Two-step
verification, Signed-in devices) · Privacy and safety (Show me in search, Show when I'm available, Who
can message me › sheet, Blocked accounts › sheet) · Notifications (4 toggles) · Houses you act for
(members only) · Help and legal (Contact support, Terms, Privacy Policy, Community guidelines, How
reporting works, How blocking works) · Your data (Agreements and download) · Sign out · Delete account.
2.1–2.4 screens.

**House settings, after:** Page (house, Verification) · Who can act for this house · Credit authority (one
user-facing line) · House notifications.

### Files

`src/screens/sheets/Sheets.tsx` (Notifications), `src/screens/home/NetworkActivity.tsx` (opt-in `quiet`
variant; Home is unchanged), `src/screens/settings/Settings.tsx`, `src/screens/settings/YourData.tsx`
(`start="delete"`), `src/state/store.tsx` and `src/App.tsx` (`yourData` route takes `step`),
`src/data/seed.ts` (deep link), `src/styles/refine.css`.
