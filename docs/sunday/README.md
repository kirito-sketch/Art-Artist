# Sunday approval pack

Everything for the client meeting on Sunday 11 October 2026, in one folder. Diagrams render on GitHub.

The same content is on the meeting page, where each decision can be marked Agreed, Changed or Deferred during the meeting.

| # | Document | What the client approves |
|---|---|---|
| 0 | [Brief](../SUNDAY_BRIEF.md) | Where Ana is, what's built, what's decided, the decisions needed |
| 1 | [People, relationships and permissions](1-people-and-permissions.md) | Personas, account types, how people relate, who can do what |
| 2 | [Information architecture](2-information-architecture.md) | Tabs and screens for a personal account and a house account |
| 3 | [Connection map](3-connection-map.md) | How journeys hand off between people, and what each side sees |
| 4 | [Journeys](4-journeys.md) | Nine core journeys with their branches and edge-case coverage |
| 5 | [Lifecycles](5-lifecycles.md) | States of projects, roles, interest, credits, verification and accounts |
| 6 | [Epics](6-epics.md) | What v1 must do, with acceptance points, and what's out |
| 7 | [Open decisions from edge cases](7-open-decisions.md) | 118 open cases condensed into 13 themes |
| 8 | [Glossary, notifications, metrics, launch](8-glossary-notifications-metrics.md) | Words, who gets told what, how success is measured, launch steps |

**How to read status.** Everything in these documents describes the prototype as it runs today, checked screen by screen on 9 October 2026. Anything not built is marked **proposed** (it comes from the edge-case catalogue or from a recommendation and needs approval).

Corrections made in the audit of 9 October: Home sections listed as they appear (From your network, Events near you and Film talk were missing; the section after This week changes with why you're here); "Filled another way" counts as Filled, not Closed; role edits show on the role page rather than as a notification; project cancel and unshare, verification restriction and revocation, asking a house for more evidence, and the house-verified notification are proposals, not built; ranking guardrails trimmed to what the code does; the house Home, house page, profile and settings contents listed as built; the moderation console's actions and how to open it; the onboarding phone step only applies to invites.

Diagrams follow the [diagram-design](https://github.com/cathrynlavery/diagram-design) system (one idea per diagram, at most 9 boxes, right-angle connectors, one accent colour) in Ana's colours, and pass its geometry and accessibility checks. They live in `diagrams/` as SVG files that switch to dark mode with the viewer.

Source material: `docs/EDGE_CASE_MATRIX.md` (520 cases, re-run 9 October 2026), `docs/PERSONA_BRIDGES.md`, `docs/DECISIONS.md`, and the prototype itself.

After Sunday: outcomes go into `docs/DECISIONS.md`; agreed changes are made in the prototype first, then these documents are updated.
