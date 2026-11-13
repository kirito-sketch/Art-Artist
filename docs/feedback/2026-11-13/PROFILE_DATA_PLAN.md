# Profile data: collecting the Master Database without a long sign-up

13 November 2026. Source: the client's `Art_Artist_Master_Database_Structured.xlsx` (16 tabs, 61 distinct fields). The client says every field is required. Comparison page for the client: https://claude.ai/artifact/NnbsbqAUurFgocHhZdMQ4y

## Principles

1. Value before the sign-up wall; sign-up itself is one tap (Google, Apple, then email).
2. Ask one or two things at a time, spread over sessions, never one long form.
3. Ask when the answer is useful (role type when applying to a casting call, artwork price when adding an artwork).
4. Never ask what can be worked out: state and country come from the city, industry is pre-selected from languages.
5. Chips, not typing. Almost every sheet field is a list.
6. A person sees the basics plus their own craft's fields, never all 61.
7. "Required" means required for an action, not for sign-up (the three gates below).
8. Show progress and what it unlocks; say how long it takes.
9. Let people say "Later" and back off; nudge rarely, with a real reason.
10. Say why a field is asked and who sees it; sensitive fields stay private by default and are never required.
11. Measure drop-off per step and completion per gate.

## Three gates

| Gate | When | What |
|---|---|---|
| 1. Account | Onboarding | Name, email, main craft, role within the craft, city, languages, industry, availability. State and country are filled from the city. |
| 2. Be found and act | Before applying, messaging or posting a role | Level, types of work, every non-sensitive detail field of the main craft, Instagram (or "I don't have one"), verified mobile, one piece of work. |
| 3. Artwork | When a fine artist adds a piece | Type, sale status, price range (only for sale or commission), framed, certificate, reproduction rights. A piece without them is a draft only the artist sees. |

Until gate 2 is met a person can browse, follow, save and read. A blocked action opens only the missing items, one per screen, and then carries on with the action.

## Built in stage 1

- Data (`src/data/profileSchema.ts`, `crafts.ts`, `taxonomy.ts`): new crafts Photography, Dance & choreography and seven fine arts disciplines; roles per craft; levels; industries; city to state; a details set for every craft (Direction, Writing, Music, Art department, Costume, Make-up and hair, VFX, Dance, Photography, Art practice) and the sheet's missing options in Camera, Editing, Acting and Sound; one merged Types of work list.
- Gate logic (`src/domain/profileGates.ts`, unit-tested): what a person still owes, in asking order, with a time for each item.
- Onboarding (`src/entry/Entry.tsx`): role chips under the chosen craft; industry chips on Where you work, pre-selected from languages.
- Finish your profile (`src/screens/profile/FinishProfile.tsx`): the checklist card on Home and on your own profile, the one-question sheet, and `gated()` on Show interest, Message (opportunity, profile, new message) and Looking for someone.
- Edit profile: city, state and country; role and level; industries; Instagram.
- Profile: role, level and industries shown; Instagram as a link.
- Kiran, Tara and Aditi are seeded complete so demos and walkthroughs are not stopped by the checklist. Nothing changes in `/test`.

## Defaults taken, pending the client

| Question | Default in the build |
|---|---|
| Other crafts allowed | 4 for film; 3 for fine arts (the client's note) |
| Platform, Content type, Open for | Merged into one Types of work list |
| Industry list | The sheet's five plus Marathi, Bengali, Gujarati, Punjabi, Odia, International |
| Incomplete profiles | Still visible and searchable; only applying, messaging and posting a role are blocked |
| Camera lists | Models (ARRI Alexa 35…), converted to brands for any export |

## Built in stage 2

- Artwork details (`src/screens/profile/ArtworkDetails.tsx`, rules in `src/domain/profileGates.ts`): when a fine artist adds pieces in Your work, one sheet per piece asks the six artwork fields as chips; "Later" keeps the piece as a draft. Each piece in the editor and on the profile carries a short label ("For sale · ₹10k–50k", or "Draft · only you"). Drafts are left out of the profile, its cover and its viewer for everyone but the artist.
- Asked after an upload (`askAfterUpload` in `FinishProfile.tsx`): saving a new reel or new images asks the one detail that describes the work in that craft, if it is still empty: camera for camera crafts, software for editors and VFX, tools for sound, medium for artists, and so on. Once per session, in place of the Saved toast.

## Next

- Stage 3, needs the client's approval: browse before sign-up (two taps, then a real preview of opportunities, events and films; no individual profiles before sign-in).
- Export in the sheet's layout; drop-off measurement per step.
