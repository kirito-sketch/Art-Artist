# Production house: exploration

Status: hypotheses, not architecture. The lifecycle doc (docs/production-lifecycle.html) is an input, not a spec. Prototype: panel option "Konark Pictures · acting for the house". Code: src/screens/production/Production.tsx.

## Jobs to be done

When a house acts on Ana, a person is doing one of these:

1. **Find someone for a gap on a project.** "We lost our DoP two weeks before the shoot."
2. **Decide on people who responded.** Review interest, shortlist, reply.
3. **Know who is on a project** so credits are right at the end.
4. **Publish and fix credits** after release, including disputes.
5. **Look credible** to people deciding whether to respond (house page, past work).
6. **Let the right colleagues act** for the house without sharing one login.

Not a job: running payroll, schedules, contracts or HR. Other tools do that. Ana is where the house meets people and where credits become true.

## Concept decisions (each a hypothesis)

### H1. "Team" is two unrelated things, and neither is a product
- **Members** are people allowed to act for the house. That is a permission, set once in settings. No screen beyond a list and a role.
- **People on a project** are collaborators for that project only. This is the credits list in progress: invited, then confirmed, then published at wrap.
- Dropped: "Team Management" and "Crew Management". Nobody is employed by the house between projects.
- *Validate:* do houses think of "our people" across projects (a roster) or only per project? If a roster matters, it is probably just "people we've credited before", derived, not managed.

### H2. Requirement and opportunity are one object: a Need
- A need is a position on a project. Visibility is a state: **Private** (house only) → **Open on Ana** (discoverable, people respond) → **Filled** (becomes a person on the project).
- Most needs are filled by phone. Private needs still matter because they become credits.
- *Validate:* will houses list private needs at all, or only when they want to open them? If only the latter, "Private" disappears and a need is just an opportunity.

### H3. The house lands on its projects, not a dashboard
- Prototyped: a project list, with a "Needs a decision" strip above it that appears only when something is waiting (interest to review, a disputed credit, unaccepted invites).
- *Validate:* with 1 to 3 active projects the list is enough. A house with 10+ in flight may need a queue first.

### H4. Acting as the house is a mode of the same app, not a separate app
- Switching changes Home only. Discover, Inbox and Profile are unchanged in this pass.
- *Validate:* who actually uses it? If it's a line producer on their own phone, they need fast switching between self and house, and an Inbox that separates the two.

## Home options considered

| Option | Assumption | Question to validate |
|---|---|---|
| **A. Project-first with conditional attention strip** (prototyped) | Houses think in projects; urgent items are few. | Do they open the app to check a project or to clear decisions? |
| B. Work queue / dashboard first | Volume of responses is high and daily. | How many responses does an open need get per day in reality? |
| C. Ana Home adapted (same feed, house lens) | The house also browses talent like an individual. | Does anyone at a house browse without a specific gap? |

## What is prototyped vs not

Prototyped: house Home, project page (needs with Open on Ana, Review into the existing opportunity screen, people by department with invited/confirmed, credits with a dispute), switching in the panel.

Not prototyped (on purpose): creating a project or need (toast), adding a person (toast), member permissions, house profile page, Inbox split, credit publishing flow, identity switcher inside the app.

## Next validation (cheapest first)

1. Show A to two line producers or production managers; ask them to find the dispute and open the Colourist need. Watch where they look first.
2. Ask three houses how many needs per project they would list, and whether any would stay private.
3. Ask who in the house would hold the phone.
