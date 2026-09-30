# Version 18 consolidation

One model everywhere, the demo data cleaned up, and record integrity written down. No new features.

## 1. One project model

Every project, including the older Konark samples, is now the same kind of record (`src/state/world.ts`):

| Record | What it is | Public? |
|---|---|---|
| Project | Owned by a house (lead) or a person (independent); may have co-producing houses | Only after "Share on Ana" |
| Role | Belongs to a project: private → open on Ana → filled / closed | Open roles only |
| Added to project | "This production currently associates you with this project in this working role" | Never |
| Credit | Production-issued: prepared → proposed → accepted / correction | Accepted credits on shared projects only |

**Migrated:**
- **Neela Akasham** (pre-production, shared): DoP and Journalist roles open; Colourist and Gaffer private; Ishaan, Lakshmi and Sana added (no credits, because the work isn't done).
- **Neeli Raat** (released): 8 accepted credits, plus Sameer's credit in correction.
- **Monsoon Letters**: now a Tidewater project with Konark as co-producer.
- **Backwaters**: now a Tidewater project with its open role.
- **Kaal**: a private, unannounced Konark series.
- **Other houses' films** (Kaaval, Fault Lines) use the same records.
- **Independent projects** (Salt, Chai & Rain, Two Rooms) are owned by people and carry no credits.

**Removed:** the legacy house workspace and its separate private-data map. Every house project opens the same workspace; profiles, project pages, production pages, search and Slate all read the same records.

## 2. Contradictions found while migrating

1. **Kiran was both a Konark member and a DoP candidate Konark was evaluating.** He is now only a cinematographer. **Aditi Ghosh**, a freelance line producer with Konark and Tidewater, is the house-side persona. The DoP conversation is the same thread seen from both sides: Kiran's inbox, and Aditi's inbox "as Konark Pictures".
2. **Neela Akasham showed accepted credits on a film still in pre-production** (and "Lakshmi accepted the credit as Amma"). That contradicts "selected is not credited". It now has private associations only, and the public page says credits appear once issued and accepted.
3. **"Invited" people** on the old Neela workspace implied a job offer. They are now "Added" associations.
4. **Profile credits came from a separate hard-coded list**, which could disagree with project pages (for example, network events said Sana and three others were credited on Fault Lines, but the project didn't list them). Credits now derive only from accepted credit records; the Fault Lines camera team was added so both agree.
5. **Kiran's "pending" Blue Lotus credit lived outside the project model.** It is now a proposed credit on Fault Lines.
6. **House notifications sat in Kiran's personal list.** They now belong to Konark.
7. **Konark's roles lived in the general listings with no project.** They now belong to Neela Akasham (and Tidewater's to Backwaters). Other houses' roles remain plain listings: the demo can't act for those houses, and they behave identically from the individual side.
8. **Removing someone could have taken an accepted credit with them.** Removal is now blocked once a credit is accepted ("changes go through a correction with them").
9. **Private artwork could reach a public role** if added before sharing. Roles now use a generic image until the project is shared.
10. **A released film's workspace offered "Add role".** Hidden unless roles already exist.

## 3. Project publication: proposed rules (not built)

Principle: **a house controls what it publishes, but can't casually erase professional records that other people have accepted.**

States: **Private → Public → (later) Archived.** There is no "unshare".

| Situation | Rule |
|---|---|
| Accidentally published, no accepted credits yet | "Withdraw announcement" returns it to private. Allowed only while no accepted credits exist. Open roles close and interested people are told. |
| Announced, then cancelled | Stays public, marked **Cancelled**. If nobody accepted a credit, the house may withdraw it as above. |
| Upcoming project should be less visible | Edit what's shown (title back to "Untitled…", remove artwork or logline). The page stays; there's no hiding switch. |
| Completed film with accepted credits | Can never be withdrawn. The project page stays so each credit keeps its context. |
| House no longer wants to promote an old project | **Archive**: leaves "Now making" and discovery, still reachable from credits and profiles, credits untouched. |
| Correcting an accepted credit | Only through a correction the person agrees to, never a unilateral delete. |

*Validate:* how often projects are cancelled after announcement, and whether a house would want "Archive".

## 4. Privacy audit: private project with a public role

What a public role on an unannounced project reveals: the public name ("Untitled Telugu feature"), the house, format, languages, stage, and the role's own details. Opening such a role now shows a disclosure first (what people will see, what they won't, and "keep the title out of the description"). The same disclosure appears in Add role.

| Surface | Checked | Result |
|---|---|---|
| Role page, cards, RoleRow | Project field is the public name | OK |
| Role image | Private artwork used to be copied | **Fixed**: generic image until shared |
| Search | Matches role title, public name and house only; projects only when shared | OK |
| Share sheet and links | Uses role and public name | OK |
| Messages | Conversation context uses the public name | OK |
| House notifications (interest) | Public name | OK |
| Notifications to the added person | Show the working title | **Deliberate:** they're inside the project. *Validate* whether houses expect the working title to stay secret even from people they've added. |
| Profiles | Associations and unaccepted credits only on the person's own profile; accepted credits only once the project is shared | OK |
| Production page | Only shared projects, open roles, accepted credits | OK |
| Project page | Not shared → "This project isn't public" | OK |
| Recommendations (For you) | Only open roles | OK |
| Role description | Free text written by the house | Can't be guaranteed; the disclosure warns |
| People not on Ana | Name and phone stay in the workspace; the phone is never displayed | OK |

## 5. Identity audit: "who am I acting as?"

| Action | How identity shows before commit | Result |
|---|---|---|
| Create project | "Only Konark Pictures sees this" in the sheet | OK |
| Share project | "Konark Pictures as the production" in the preview | OK |
| Open / edit / close role | Only the house can see owner controls; the workspace needs you to act as that house | OK |
| Show interest / respond | Personal only; acting as a house shows "Switch to you" | OK |
| Message | "Replying as …" in conversations; **now** "Message as Konark Pictures" on profiles | Fixed |
| Fill role → add person | Sheet says the house tells them privately | OK |
| Remove person, issue or prepare credit | Workspace actions disabled unless acting as the lead house; credit preview names the house | OK |
| Accept credit / request correction | Personal; **now** acting as a house shows "Switch to you to respond" | Fixed |
| Post | Composer shows the author | OK |
| Edit house information | Workspace details and house settings only when acting for that house | OK |
| Follow, save, report, block while acting as a house | Still personal and unlabelled | Minor; *validate* whether houses follow or report as the house |

## 6. Profiles: two kinds of evidence

- **Credits**, marked with the verified icon: "issued by productions and accepted by [name]".
- **Independent projects**: "shared by [name]; roles on independent work aren't verified yet."
- Your own unshared independent projects and private associations appear only to you, under "Projects you're on".

Independent credit authority remains unresolved: creating a project never grants it.

## 7. People not on Ana (future behaviour, not built)

Today it's a private placeholder inside one project (name, phone). It is not a profile, isn't searchable, isn't public, and can't be credited.

Intended later: the house sends an invite to that phone. When the person joins Ana with the same verified number, they're shown "Konark Pictures added you to [project] as [role]" and confirm it's them. The placeholder links to their real account, becomes a normal association, and credits become possible. Never auto-merge on name. One phone number maps to at most one person.

## 8. Not built on purpose

Bulk "Issue credits" at wrap · publication states beyond Private/Public · a permissions hierarchy beyond member and "can issue credits" · linking people not on Ana · new visual variants.
