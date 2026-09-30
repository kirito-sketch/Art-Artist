# Edge case testing system

The goal is not a screen for every strange situation. It is Ana behaving intentionally under unusual conditions. For every scenario the first question is **What should Ana do?** Only then: does that need UI, interaction handling, a business rule, a backend constraint, an automated test, a legal decision or research?

## Four layers, kept apart

| Layer | Who it is for | Where | What it can see |
|---|---|---|---|
| Normal prototype | Stakeholder walkthroughs | `/` | The console. Its only link to testing is Advanced → Testing → Open Edge Case Lab, with a quiet "P0: N remaining". |
| Research Mode | Participant sessions | `?research` or Start research session | Nothing internal. It strips `?scenario` and `?lab` and ignores both. Reload is a clean reset. Shift+E exits. |
| Edge Case Lab | Design, QA, developers, Claude | `?lab` | The full catalogue, the automated results, and links to every reproducible scenario. |
| Automated regression | CI and anyone changing rules | `npm run test:edge` | Records and public surfaces only. No UI. |

## One product, many fixtures

There is one Profile, one Role page, one project workspace, and so on. A scenario never has its own screen. It is a **fixture**: the canonical app, started in a precise state.

- `src/qa/scenarios/`: the manifest, the single source of truth. Every scenario has a stable ID (`EC-<AREA>-<NNN>`), priority, risks, kinds (Visual, Interaction, Logic), expected behaviour, needs, status, and, where the prototype can show it, a fixture.
- `src/qa/fixtures.ts`: named changes to the records (for example `unverify:konark` or `proposed:kiran:kaal:DoP:Camera`). They use the same domain actions as the product.
- `src/qa/boot.ts`: reads `?scenario=ID` once per page load, applies the fixture to that load's fresh seed, and sets persona, acting identity, credit authority, memberships, blocks, test states, route, sheet and surface.
- `src/domain/`: every change to shared records (projects, roles, associations, credits, Interest) and every "who can see what" rule. The store calls these, and so do the checks, so a check tests the code the app runs.
- `src/qa/checks.ts`: automated assertions (AC-01 to AC-30). Each starts from the canonical records and restores them afterwards.
- `docs/EDGE_CASE_MATRIX.md`: generated. Never edit it by hand.

## Determinism

- **Opening a scenario:** always a fresh page load from the canonical seed, plus that scenario's fixture.
- **Reset scenario:** reloads the same link, so the result is identical.
- **Exit to prototype:** loads the plain prototype, so nothing from the scenario survives.
- **Nothing is persisted.** A scenario cannot touch the seed that the normal prototype or Research Mode start from.
- **Copy link:** gives anyone the same starting state.

## Working rules

1. **Adding a scenario:** append it to its area with the next number. Never renumber, and never reuse a removed number.
2. **Staging:** fixtures and checks come first for P0, in this order: identity, privacy, credits, verification, deletion and integrity, permissions, blocking, concurrency, authentication, moderation. P1 and P2 wait for review.
3. **When a scenario fails:**
   1. Record it.
   2. Classify it: missing rule, missing UI state, logic bug, privacy bug, or data problem.
   3. Fix the canonical behaviour (usually in `src/domain`).
   4. Rerun the scenario.

   Never add a special case for a fixture.
4. **Regenerating:** run `npm run test:edge` after any change to the manifest or the rules. It prints the checks, rewrites the matrix, and refreshes `src/qa/last-run.json` (which the console's count reads).
