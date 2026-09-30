# Organisations on Ana: exploration

Status: **hypotheses, not architecture.** Nothing here is a confirmed feature or navigation item until a real production house has used it. Prototype panel: "Kiran, acting for Konark" (busy house) and "Kiran, acting for Tidewater" (quiet house), with House Home A/B/C and House profile A/B toggles.

**Individual Ana:** my career, my work, people and opportunities around me.
**Organisation Ana:** our projects, our presence, people and opportunities around our work.

## 1. Concept audit

| Concept | Does it need to exist? | Verdict (hypothesis) |
|---|---|---|
| Production House Home | Yes, a house acting on Ana needs a starting point. It is not a dashboard. | Kept, three models under test (section 4). |
| Project (public) | Yes. Credits, posters, roles and filmographies all point to it. | One object internally ("Work"). **Users only ever see Project, Film or Series** (Exhibition or Show in fine arts). Built as the public project page. |
| Project workspace | Only the private layer of a Work: roles not yet open, invites not yet accepted, corrections asked. | Kept thin. Not a production-management tool: no schedules, call sheets, budgets or tasks. |
| Members | Yes, as permission only. | People who may act for the house. Lives in settings, never a product surface. |
| Team / Crew | No. | Dropped. "People on this project" is the credits list in progress. No roster, no HR. "Worked with" on the profile is derived from accepted credits, never managed. |
| Requirement and Opportunity | One object. | A role on a Work, with visibility. Private → Open on Ana → Filled. |
| "Need" | Working name only. | The house side says "Roles to fill"; individuals see a "Role". Validate the words with both sides. |
| Applicants | No new system. | Responses reuse the existing **Interest** model: people show interest, the poster reviews profiles and chooses whom to message. The house review sheet is the same sheet individuals use. |
| Credits | Yes, strategically central. | **Decided:** issued by the production, accepted or corrected by the person, public only once accepted. Never initiated by the person (section 6). |
| Company page | Not separately. | **One organisation profile** serves visitors and members. |

Test against Ana's purpose: every kept concept helps people discover each other, trust each other or build a record. Anything that only helps run a shoot stays out.

## 2. Model

```
Organisation ─┬─ Work (project) ── Role (private | open | filled) ── Interest ── Person
   │          └─ Work ── Engagement (invited → credited) ── Credit (proposed → accepted | correction asked)
   └─ Membership (person may act for organisation; permission only)
Person owns their identity, portfolio and accepted credits, across any number of organisations and crafts.
```

Fine-arts check: Gallery → Exhibition → Artist → Participation. Same shape: organisation, work, person, engagement, credit. Only the words shown change.

## 3. Active identity

- **One person, many organisations.** The account is always a person. Organisations are identities that person may act as.
- **The switch lives on the identity itself.** Tap the house name on Home, or your own name on your profile (a chevron shows there's more than one identity). One sheet lists you and each house, with a check on the current one.
- **Always visible.** The tab bar avatar becomes the house logo (rounded square, not a circle) while you act for it. Switching from the Profile tab keeps you on Profile, so you see the change happen.
- **Your identity never becomes the house's.** The sheet says so.

| Surface | Changes when acting for a house? | Why |
|---|---|---|
| Home | Yes | Different job: our work, not my career. |
| Profile tab | Yes: opens the house's public page | You are presenting as the house. |
| Tab bar avatar | Yes | Always answers "who am I acting as". |
| Create | Yes: "Open a role", "Post as house"; no "Available for work" | A house is never available for work. |
| Interest review | Yes: the house's roles | Same sheet, different owner. |
| Role pages | Yes: house roles show "Review" instead of "Respond" | Ownership follows the identity. |
| Discover and search | No | A house discovers people the same way a person does. |
| Inbox | Not yet | Split only if members report mixing personal and house conversations. **Validate.** |
| Notifications | Not yet | Likely per identity; wait until Inbox is decided. |
| Saved | Not yet | Probably personal. **Validate.** |

## 4. House Home: three models

All share the header (house identity + switch) and never show personal content.

| | A. Slate (recommended) | B. Pulse | C. Queue |
|---|---|---|---|
| Philosophy | Our work first, as artwork. Signals sit on the project they belong to. | What is happening around our work first. | Decisions first. |
| First thing | The most active project, full-bleed, with its live signals (interested, roles open, invites pending). | "Around your work": interest with faces, credit corrections, credits going public. | "Needs a decision" counts, then a plain project list. |
| Then | Around your work (3 items), our slate (posters, including a private project), people for roles not yet opened. | People for your roles, then the slate as a small shelf. | Nothing else. |
| Left out | Counters, charts, task lists. | A featured project. | Artwork, activity, people. |
| Assumes | Houses have 1 to 3 live projects and think in projects. | Response volume is high enough that activity is the reason to open the app. | Houses open Ana only to clear decisions. |
| Validate | Do they open it to check a project or to act on people? | How many responses per open role per day? | Would a house miss the network feeling? (If not, Ana is a tool to them.) |

**Why A:** it's project-first without being a list. It feels like a film company's wall, not a back office, and still surfaces everything that needs a decision on the project it belongs to. B is the fallback if real response volume is high. C stays as the stakeholder reference for "what an admin dashboard would look like".

Quiet state (Tidewater): nothing in production. Home says so plainly, offers "Start a project", and the slate still shows past work.

## 5. House profile: public identity

What a creative wants to know when they land here, in order: **Who are they? What are they making now? Have people like me worked with them, and did it go well? Are they hiring?**

| | A. Work first (recommended) | B. Hiring first | C. Reputation first (not built) |
|---|---|---|---|
| Order | Identity → Now making → Made by us → Worked with → Hiring | Identity → Hiring → Now making → Made by us → Worked with | Identity → Worked with → Made by us → Now making → Hiring |
| Assumes | Creatives judge a house by its work before its roles. | Most visits come from a role and want more roles. | Trust (who has worked there) is the deciding factor. |
| Validate | Where do visits come from: roles, credits or search? | Same. | Would creatives read "Worked with" as endorsement? It isn't one, it's accepted credits. |

Rules: "Worked with" is derived from accepted credits only, so a house can't curate its reputation. Members see the same page with "Edit page" and "Open a role" instead of Follow and Message, plus a line saying "This is how people on Ana see us". Co-productions show on both houses' pages, labelled.

## 6. Credits

**Decided (DECISIONS.md §6).** Credits originate from the production:

Production adds the person to the project → assigns the role → the person receives the credit → **Accept** (public) or **Something wrong?** (correction or dispute, back to the production) → only accepted credits appear anywhere public.

An ordinary user has no Add, Claim, Request or Verify credit action anywhere. They only react to credits that already exist. In the prototype: Kiran has a credit from Blue Lotus waiting on his profile ("Waiting for you": Accept or Something wrong?), a notification points to it, and "Something wrong?" also sits on every accepted credit on a project page.

Still to validate, all on the production side:
- Several companies on one film: can only the lead production issue credits, or co-producers too?
- Which members of a house may publish credits?
- If a house declines a correction: suggested rule, the credit stays unpublished for that person, never published against their will.

**Independent work** (no traditional production) is a separate case. It is **not** solved by letting people credit themselves. For now, independent projects (Salt, Chai & Rain, Two Rooms) open a project page that shows who made it and states plainly that it carries no credits, because only a production can issue a credit on Ana.

## 3b. Identity on actions

Anything that publishes or communicates must say who it comes from:
- Post and role composers show the author: your name, or the house's.
- Conversations show "Replying as yourself" or "Replying as Konark Pictures"; the identity is stored with the conversation when it starts.
- Reviewing interest as a house: "Message as Konark Pictures".
- Responding to or showing interest in a role is always personal. Acting as a house, the role page shows "Responses are personal" with **Switch to you**, which switches without leaving the page.

## 7. Not built on purpose

Creating a project or role flow (toast), adding people to a project, member management, editing the house page, Inbox and notifications per identity, credit publishing at wrap.
