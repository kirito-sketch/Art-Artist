# House creation flows: proposal (not built)

For review before building. Order: **Create project → Open a role → Add a person (which proposes their credit).** Every step passes the creep guard: it helps a house present its work, find people, or establish who worked on what. Nothing here schedules, budgets, assigns tasks or manages crew.

## Information architecture

```
House Home (Slate)
 ├─ [+] New project ─────────────┐
 └─ project card ─► Workspace    │
                     ├─ Roles to fill ─► [Add role] ─► role (Only your house ▸ Open on Ana ▸ Filled / Closed)
                     │                                    └─ interest ─► review ─► message
                     │                                    └─ Filled through Ana ─► "Add to project?" ─┐
                     ├─ On this project ─► [Add person] ◄─────────────────────────────────────────────┘
                     │                        └─ proposed credit ─► person: Accept / Something wrong?
                     └─ Share on Ana ─► public project page
Create menu (acting as house): Open a role ─► pick a project (or New project) ─► Add role
```

One role object from private need to public opportunity to filled. One person-on-project object that *is* the proposed credit. No separate "requirement", "applicant", "crew member" or "invite" objects.

## A. Create project

**Job:** establish that the project exists, privately, in seconds. Indian projects reveal themselves gradually, so the project can exist long before a title, cast or poster are public.

**Minimum (3 fields, one sheet):**
1. **Working title.** Can be "Untitled" plus format and language; the public title comes later.
2. **Format:** Feature, Series, Short, Documentary, Music video, Ad film.
3. **Language(s).**

Stage defaults to Development. Everything else is optional and added later: logline, city, dates, artwork, stills, co-production.

**Visibility:** a new project is **only visible to the house.** "Share on Ana" publishes its public page. After that, the page shows only what has been filled in, and people appear only once their credit is accepted. A still-secret cast stays secret because nothing is public until each person accepts *and* the project is shared.

**Co-production:** add another house; it becomes attached only when that house accepts. The first house is the lead. *Validate:* who may issue credits on a co-production.

**Independent project** (a person acting as themselves): the same three fields, published as the person's independent work. Credits aren't available: the page says "Credits for independent projects are not verified yet." Creating a project gives nobody credit authority. Who can issue credits here is an open trust problem, deliberately left unsolved.

*Validate:* is a working title plus format and language enough for houses to bother? Would they create projects before announcing, or only at announcement?

## B. Open a role

**Job:** say what the project needs, privately or on Ana. This is the one role object (requirement = opportunity = the working word "Need").

**Entry points:** Workspace → Roles to fill → Add role; or Create → Open a role → pick a project.

**Fields (one sheet):**
- **Role / craft** (required; picks the department)
- **What it involves** (short)
- **When** (dates or "approx. Nov") and **where**
- **Paid / unpaid**, optional range
- **Up to 3 optional questions** (model A: optional answers, not a form)
- **Visibility:** *Only your house* or *Open on Ana* (default Open; *validate* whether anyone keeps roles private)

**After publishing:** the edit and close rules already built apply (title, craft and project fixed; material changes shown to people who showed interest; Filled vs Closed).

**Bridge to C:** closing a role as "Filled through Ana" offers **"Add [person] to the project?"**, which prefills step C. The role's record and the person's future credit link up without a separate hiring object.

## C. Add a person and propose their credit

**Job:** record who worked on the project, so the credit is true. Not crew management.

**Proposal: adding a person *is* proposing their credit.** One step, not "invite" and then "credit" as two stages. The earlier prototype's separate "Invited" state disappears.

**Flow (one sheet):**
1. **Find the person** on Ana (search by name or craft). Not on Ana yet: add by phone. It stays pending until they join; nothing is public.
2. **Credit as:** the credit line exactly as it should read ("DoP, Episodes 3–5", "Amma").
3. **Department** (prefilled from the craft).
4. **Propose.** Needs credit authority in the house (who holds it: *validate*). Members without it can *prepare* a credit that someone with authority proposes.

**The person** gets "Waiting for you" (already built): **Accept**, or **Something wrong?** (correction, or "I didn't work on this").
**Public** only when the person accepts *and* the project is shared on Ana.
**At wrap** (later): a "Review all credits" list to propose everything remaining at once. It is still the same object.

**Explicitly out:** contact sheets, call times, pay, contracts, schedules, availability planning, departments as org charts.

## What to build first (suggested)

1. The New project sheet plus "Share on Ana" (small; makes "+" real).
2. The Add role sheet in the workspace (reuses the existing role page and interest).
3. The Add person sheet that proposes a credit, plus the "Filled through Ana → Add to project?" bridge.

## Open questions carried forward

- Credit authority inside a house, and on co-productions.
- Independent-project credit issuer.
- Whether "Only your house" roles are used at all.
- Whether houses create projects before announcing them.
- People not yet on Ana: how long a pending credit waits, and what they see when they join.
