# House creation flows

**Status: built (Version 17).** Test in the prototype: pick Konark in the panel, then Tara, then Konark again; the shared records survive switching.

For review before building. Order: **Create project → Open a role → Add a person to the project → Issue their credit later.**

**Rule: being selected to work on something is not the same as having earned an official credit.** Project association and credit are two separate records. Every step passes the creep guard: it helps a house present its work, find people, or establish who worked on what. Nothing here schedules, budgets, assigns tasks or manages crew.

## Information architecture

```
House Home (Slate)
 ├─ [+] New project ─────────────┐
 └─ project card ─► Workspace    │
                     ├─ Roles to fill ─► [Add role] ─► role (Only your house ▸ Open on Ana ▸ Filled / Closed)
                     │                                    └─ interest ─► review ─► message
                     │                                    └─ Filled through Ana ─► "Add to project?" ─┐
                     ├─ On this project ─► [Add to project] ◄─────────────────────────────────────────┘
                     │        └─ association (private: house + person) ── later ──► [Issue credit]
                     │                                                               └─ credit proposed ─► person: Accept / Something wrong? ─► public
                     └─ Share on Ana ─► public project page
Create menu (acting as house): Open a role ─► pick a project (or New project) ─► Add role
```

Three objects, no more: the **role** (private need → open on Ana → filled or closed), the **association** (this person is on this project), and the **credit** (the production officially issues it). No "requirement", "applicant", "crew member" or "invite" objects.

```
Association:  Added to project ──► (ends: Left project / Removed)          private to the house and the person
Credit:       Proposed ──► Accepted ──► public (once the project is shared)
                      └──► Correction asked ──► re-proposed
```

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

## C. Add a person to the project, then issue their credit

**Job:** record privately who is working on the project, and later make the credit official. Not crew management.

### C1. Add to project (association)

- **From an Ana role:** "Filled through Ana" → **"Add [person] to the project?"** → association created with the role's craft prefilled.
- **From outside Ana:** Workspace → On this project → **Add to project** → find the person on Ana (or add by phone; pending until they join) → working role (e.g. "1st AC") → department.
- **Visibility:** private to the house and the person. Never a public roster. The person sees it as "Konark Pictures added you to Neela Akasham · 1st AC", with **That's not right** (removes it). There is nothing to accept yet: this is not a credit.
- **Changes over time:** the working role can be edited; the person can **leave** or be **removed**. Neither leaves a public trace.
- **Terminology:** "Added to project", or "On project" in lists. Not "Invited", which suggests offering the job, and not "Crew".

### C2. Issue credit (later, when the production is ready)

- From the person's row: **Issue credit** → final credit line exactly as it should read ("DoP, Episodes 3–5") → department → **Propose**.
- Needs credit authority in the house (who holds it: *validate*). Members without it can **prepare** a credit for someone with authority to propose.
- The person gets **Waiting for you**: **Accept**, or **Something wrong?** (correction, or "I didn't work on this"). Public only when accepted **and** the project is shared on Ana.
- **At wrap** (later): "Issue credits" lists everyone added who has no credit yet, to propose in one pass. Each credit is still its own record.

### Shortcut when the credit is already known

The Add sheet offers two buttons: **Add to project** and **Add and issue credit**. The second creates the association *and* a proposed credit in one go. They are still two records, and the credit can still be corrected or withdrawn independently.

**Explicitly out:** contact sheets, call times, pay, contracts, schedules, availability planning, departments as org charts.

## What to build first (suggested)

1. The New project sheet plus "Share on Ana" (small; makes "+" real).
2. The Add role sheet in the workspace (reuses the existing role page and interest).
3. The Add to project sheet (with "Add and issue credit"), the "Filled through Ana → Add to project?" bridge, and Issue credit on a person's row.

## Open questions carried forward

- Credit authority inside a house, and on co-productions.
- Independent-project credit issuer.
- Whether "Only your house" roles are used at all.
- Whether houses create projects before announcing them.
- People not yet on Ana: how long a pending association or credit waits, and what they see when they join.
- Should the person be told when they're added to a project, or only when a credit is proposed? (Current proposal: told, privately, so a wrong association can be removed early.)

## Decisions from review (built)

- **Notify for transparency, not permission.** When a production adds someone: "Konark Pictures added you to Project X as Colourist", with **View** and **This isn't right**. There is no Accept. "This isn't right" marks the association as needing review and tells the production, which can correct the working role (this clears the flag) or remove the person. Nothing about it becomes public.
- **Added is never styled like a credit.** People see private associations in "Projects you're on" (lock icon, "They aren't credits"), separate from "Waiting for you" (credits to accept).
- **Working role stays editable** while someone is only added. The credit line is written when the credit is issued.
- **Multilingual:** projects hold a list of languages, and creation allows several.
- **Share on Ana** lists exactly what becomes public (title or "Untitled Telugu feature", format, languages, stage, production, logline and artwork if added, open roles, accepted credits) and what stays private (working title, people added, private roles, credits not yet accepted). Roles opened before sharing show as part of "Untitled Telugu feature".
- **Not on Ana:** a private placeholder (name and phone) inside the project only. Not a profile, not searchable, not on the public page, and it can't be credited until the person joins. Linking it to a real account later is not designed.
- **Credit authority:** without it, a member can *prepare* a credit ("Credit prepared"), and someone authorised issues it. The panel toggle "Kiran can issue credits" shows both paths. Who holds authority remains open.
- **Independent projects** can be created and can have private associations. "Issue credit" isn't available: "Credits for independent projects aren't available yet."
- **No bulk "Issue credits" pass yet.** It stays documented as a possible wrap-time tool once single credits are proven.

## End-to-end story (tested)

Konark creates private "Project Monsoon" → adds the role "Supporting · Sister", open on Ana (appears as "Untitled Telugu feature") → Tara shows interest with an optional answer → Konark is notified, closes the role as Filled through Ana, picks Tara, and adds her to the project (role prefilled) → Tara is told privately, with View and This isn't right → Konark issues the credit "Anjali (Sister)", Cast, with a preview → Konark shares the project as "Varsham" after seeing what becomes public → Tara accepts under Waiting for you → the credit appears on Tara's profile and on Varsham's public page, and Konark is notified.

Also tested: Add and issue credit (two records), a credit prepared without authority, a person not on Ana, and "This isn't right" reaching the house.
