# Save, Follow and post actions

The product rules behind every bookmark, Follow control and post action in Ana.

## Follow vs Save

| | Means | Applies to |
|---|---|---|
| **Follow** | Keep a relationship; see relevant updates | People, Production Houses |
| **Save** | Privately keep something to revisit | Posts, Roles, Projects |

**Not saveable:** People and Production Houses (use Follow), Credits and Project associations (professional records), Messages, Notifications, Trust and Admin records.

Words: "Save" in text, the bookmark as the icon, **Saved** as the one screen title. There is no separate "Bookmarks".

## Saved destination

- One private **Saved** screen (`saved` route, `src/screens/profile/SavedScreen.tsx`).
- Filters: **All · Posts · Roles · Projects** (filter chips, with counts). All shows each kind in its own family, the most recently saved kind first, with "See all" switching the filter.
- Each kind keeps its composition family: Posts in the media grid (opening the post stream), Roles as role rows, Projects as poster tiles.
- **Entry:** one tap from your own Profile, the bookmark utility button in the profile header ("Saved"). It appears only on your own profile, never to visitors, and is not in Settings or the bottom navigation. "Your activity" also links to it.
- Saved is never a public profile section.

## State

- One source of truth in the store: `saved: { kind, id, at }[]`, read through `isSaved(kind, id)` and changed by `toggleSave(id, kind)`. Every bookmark (Home card, Role Detail, Project Detail, post stream, Home and Profile posts) reads it, so an item shows saved everywhere at once.
- Tapping a saved bookmark unsaves it, everywhere, with no confirmation.
- The control confirms itself (press, fill, settle; see the motion system). No toast, except while acting for a house, where a short toast says it went to your personal account.
- **Identity:** Save belongs to the person. Acting as a Production House never creates a house collection.
- The list is per person and resets when the prototype switches persona.

## Lifecycle and privacy

Privacy and blocking always win over a save. Saved resolves every item at read time:

| Case | Behaviour |
|---|---|
| Saved role closes or is filled | Stays, marked "Role closed" / "Role filled" |
| Saved project still public | Stays |
| Saved project made private | Withheld |
| Saved post deleted | Withheld |
| Author or house blocked (either way) | Withheld |
| Role made private | Withheld |

Withheld items are counted ("1 saved item is no longer available to you") and never shown.

## Post actions

Every post (the Discover stream, Home "Latest posts", Profile posts) has:

- **Header:** avatar, name, role · time (project context below the caption when there is one), and **More** (⋯) on the right.
- **Action row** under the work: **Like** (with its count), **Share** (the existing share sheet), **Save** (right-aligned bookmark).
- **No comments:** no comment button, count, composer or "View comments". The `comments` field in seed data is unused internally and never shown.
- The Discover Posts grid stays media-only: no actions on tiles, only the small set/video marks.

### More menu and Report Post

- Someone else's post: **Share post**, **Report post**. Report uses the existing trust flow (reasons, optional note, "Also block" afterwards). The payload carries type = Post, the post id, the author and the reason; the reporter is visible to Ana staff only, and the author is told nothing about who reported.
- Your own post: **Share post** only. Editing and deleting posts don't exist in the prototype yet; this is a documented gap, not a hidden feature.
- Opening Report is neutral; only "Also block" (a destructive confirmation) is red.
- In the prototype the report is recorded in `src/state/reports.ts` for QA (there is no report store in the shared world).
