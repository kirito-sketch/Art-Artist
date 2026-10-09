# Ana: stakeholder brief

For the client meeting on Sunday 11 October 2026. One-off document: after the meeting its outcomes move into `docs/DECISIONS.md` and this file is archived.

**What we need from the meeting:** approval of v1 scope, answers to the decisions marked **Sunday** below, and sign-off (or change requests) on the latest design work. Everything else can be decided later without blocking anyone.

---

## 1. Where Ana is today

Ana is a **complete, clickable prototype** of the product, not yet a working app.

- **What is real:** every screen, flow and state you can tap through; the business rules behind them (who can do what, how credits work, how Home and Discover choose what to show), written as tested code; and the research tool (/test and /research) that records real participants on a real database.
- **What is simulated:** all data is sample data (people, houses, projects, roles); sign-in with Apple, Google and email is simulated; nothing a user does is saved after the session; uploads stay on the device.
- **What doesn't exist yet:** a production backend, real accounts, real media storage, push notifications, and the native iOS and Android apps.

The next phase turns this prototype into the real product: a native app (Flutter or React Native) on a real backend. The prototype stays as the design reference and the research tool.

**How production houses work in the live product.** Only individuals sign up and sign in on their own. Art and Artist's sales and marketing team visits each production house, agrees that it joins, and creates the house's account internally; a member of the house's team then signs in to that house account. The prototype shows the house side by letting Aditi switch from her own profile into Konark Pictures. That switch is only a way to demonstrate both sides in one prototype; it won't exist in the live app.

## 2. What is built in the prototype

Status: **Built** (complete in the prototype) · **Partial** (works, with known gaps) · **Not built**.

### Individuals (film professionals)

| Area | What it covers | Status |
|---|---|---|
| Welcome, sign-in, sign-up | Intro screens, Apple / Google / email with code, returning vs new account routing, resume an interrupted sign-up, Before you join (consent), Back works everywhere | Built (simulated providers) |
| Onboarding | Name and craft, what you're here for, where you work, add your work (optional). People joining from a house invite get an optional phone step instead | Built |
| Home | City header and tiles, then This week, a section that follows why you're here (Opportunities for you, Collaborations and roles, or People for your project), From your network, Events near you, Film talk, New work, People near you; a first-run Home for new people | Built |
| Discover and search | Posts grid and stream, People, Opportunities, Projects, Events, Reviews; search across everything; craft filters | Built |
| Profile | Hero, showreel, Selected work, verified credits, independent projects, professional information, availability, edit profile in sections, privacy, cover photo | Built |
| Credits | "Waiting for your confirmation" on your profile: Accept or "Something's wrong"; ask to amend an accepted credit; only accepted credits are public; no self-claiming anywhere | Built |
| Opportunities and Interest | Role pages, Show interest with an optional note, withdraw with undo, status after a conversation starts | Built |
| Posts and Create | Post composer (multiple photos and video, reorder, reposition, cover), collaboration posts, events, Open to work | Built |
| Messaging | Inbox, new message, conversations with chat heads, options (mute, report, block), send failure and retry | Built. The prototype's You / house / All filter and "Switch to reply" exist only because it switches identities; the live app won't need them |
| Notifications | Needs you, Earlier, mark all as read | Built (the filter by identity exists only because the prototype switches identities) |
| Saved | Saved posts, roles, projects and people | Built |
| Events | Event pages, attendance requests, capacity, reminders, create an event | Built (free events only) |
| Film reviews | Rate and review released films, person and film review pages | Built |
| Settings and your data | Account (change phone or email with a code, ways to sign in, two-step verification, signed-in devices), privacy, notifications, blocked people, help and report a problem, your data | Built |
| Trust and safety | Report (reason, promise, offer to block), Block (both sides hidden everywhere) | Built |

### Production houses

| Area | What it covers | Status |
|---|---|---|
| House access | Live product: the account is created by Art and Artist's team and a house team member signs in. Prototype: an invite link and a self-serve setup screen, both superseded | Prototype differs from the live model |
| Using the house account | Prototype: Aditi switches from her profile into the house, and every action says who it comes from. Live: the house account is used on its own, with no switching | Prototype differs from the live model |
| House profile | Public page: Now making, Made by us, Hiring, Worked with, Upcoming events | Built |
| House Home | Needs you, Your projects, Open roles, People for your roles, Your events, Your released films | Built |
| Projects | Private projects, working titles, drafts, share on Ana, cinematic project page with trailer | Built |
| Trailers | Upload and manage trailer and teaser versions by language; required for public projects in post-production or released | Built (upload is session-only) |
| Roles | Publish, edit location, dates and description (role, craft and project are fixed), close with an outcome, reopen a closed role, Open a new role after a filled one | Built |
| Responses | Review interest, message as the house | Built |
| Team and credits | Add people to a project, issue credits, corrections | Built |
| House settings | Page, verification status, credit authority, notifications | Built. Members and "stop acting for a house" follow the switching model and will change |

### Behind the scenes

| Area | Status |
|---|---|
| Moderation console (reports queue; dismiss, warn, remove, restrict, suspend, escalate; moderators can't delete credits). Opens separately from the app (`?admin`) | Built (prototype) |
| Legal documents and re-consent when terms change | Built (placeholder text, needs legal review) |
| Research: /test participant mode and /research dashboard | Built and live on a real database |

### Known gaps

Not built: linking a person who was added before they joined Ana · bulk credits (deliberately) · the internal tool Art and Artist's team uses to create house accounts · guardian flow for minors (18+ at launch) · persistent media storage.

## 3. Already decided (for confirmation, not re-discussion)

1. Credits come from the production. People accept or correct them; nobody can claim, create or request their own.
2. Profiles belong to people. One person can work with many houses, freelance, across several crafts.
3. Production houses are separate accounts. Art and Artist's sales team brings each house on and creates its account; a house team member signs in to it. Houses don't sign up themselves, and nobody switches between a personal profile and a house (decided 9 October).
4. Individuals sign in with Apple, Google and email. Phone is for verification only, never a separate login.
5. A house can't publish roles, issue credits or appear in search until it's verified.
6. 18+ only at launch. Children are never discoverable.
7. Deleting an account removes the profile; accepted credits stay on the film under the person's name (legal review pending).
8. No paid access: no fees to apply, no paid ranking.
9. No public comments on posts; Like, Share, Save and Message instead.
10. Follow, Save, Report and Block belong to the account that does them.
11. Fine arts is part of Ana later, in the same app. Film first.
12. The product works without film news.

## 4. Decisions needed

**Sunday** = needed at this meeting because it blocks the next phase. **Later** = can wait for research or legal input.

### A. Scope and platform

| # | Decision | Options | Recommendation | When |
|---|---|---|---|---|
| A1 | **Mobile technology** | Flutter or React Native | Whichever the development team knows best. If neutral, React Native, because the existing rules and data types carry over directly | Sunday |
| A2 | **Backend** | Supabase or another platform | Supabase: already used for research, covers sign-in, database, permissions and media storage, free to start | Sunday |
| A3 | **v1 scope** | Everything in section 2, or a focused first release | Focused v1: individuals (sign-up, profile, credits, Discover, opportunities, Interest, messaging, posts, saved, follow) and verified houses (house page, projects, roles, responses, adding people, credits, trailers). Events and film reviews follow in v1.1 | Sunday |
| A4 | **Launch market and language** | India-wide or chosen cities; English only or with Telugu and others | Chosen cities first (the prototype assumes Hyderabad and Mumbai), English at launch, other languages next | Sunday |
| A5 | **Who builds the backend** | Same team as the app, or separate | One team owns both for v1, to keep rules in one place | Sunday |
| A6 | **Monthly running budget** | A ceiling for hosting, email codes, storage and video | Agree a ceiling; v1 can start on free tiers | Sunday |

### B. Product rules

| # | Decision | Options | Recommendation | When |
|---|---|---|---|---|
| B1 | **Who can issue credits from a house account**, and how co-productions work | Anyone signed in to the house account, or only named people; lead producer only or co-producers too | The house account issues credits; if several people sign in, Art and Artist's team marks who may issue them. Lead production only for v1 | Sunday |
| B9 | **Who signs in to a house account** | One shared login, or several named team members each with their own sign-in | Named team members, each with their own sign-in, added and removed by Art and Artist's team on the house's request. Shared logins can't be traced or safely revoked | Sunday |
| B10 | **Can a house team member also have a personal account?** | Yes, separately (sign out and in, or a second account on the device), or no | Yes. Their personal profile and the house account stay fully separate; credits they earn personally come to their personal account | Sunday |
| B11 | **Is a house verified when its account is created?** | Verified at creation (sales checks documents during the visit), or created as pending | Verified at creation, since Art and Artist's team has met the house and checked its documents | Sunday |
| B2 | **Credits for independent projects** (shorts, student films, music videos) | Design a trusted issuer now, or keep them unverified | Keep "not verified yet" for v1; design the issuer after launch | Sunday |
| B3 | **What the sales team checks before creating a house account** | Which documents, who signs off | Company registration or GST, and a named contact at the house; signed off by the sales lead | Sunday |
| B4 | Interest model | One Interest (profile plus optional note) or a structured application for crew and casting | One Interest for v1; revisit if houses get too many responses to judge | Later (research) |
| B5 | Working titles visible to people added to a project | Visible or hidden | Visible (current); revisit if houses ask for codenames | Later |
| B6 | Film reviews | Can productions reply? Shown outside Ana? Do rating-only entries count? | No replies in v1; shareable links yes; ratings count | Later (if reviews are v1.1) |
| B7 | Film news | In or out | Out of v1 | Sunday (confirm) |
| B8 | Notifications | History you come back to, or a to-do list | History with "Needs you" on top (current) | Later (research) |

### C. Trust, safety and legal

| # | Decision | Recommendation | When |
|---|---|---|---|
| C1 | **Who moderates at Ana**, response time for urgent reports, appeals | A named person for v1; urgent reports within 24 hours; appeals by support email | Sunday (owner) |
| C2 | **Legal review** of terms, privacy, consent wording, 18+, deletion and credit retention, verification claims | Engage a lawyer before beta; Indian data protection law (DPDP Act) is the likely regime | Sunday (owner and timing) |
| C3 | Data retention periods (reports, audit logs, consent records) | From the legal review | Later |
| C4 | Minors (guardian flow) | Stay 18+ at launch | Confirm Sunday |

### D. Design

| # | Decision | Recommendation | When |
|---|---|---|---|
| D1 | **Visual direction** | Minimal, with the glass navigation bar that was approved later. Older records still say glass is archived; this needs one clear answer. On iOS and Android, use each platform's own blur | Sunday |
| D2 | **Approve the latest design rounds**: Home (Stage 5), all Create flows (Stage 6), sign-in and onboarding, plus this week's review fixes (project page Save beside Share, Sign in layout) | Approve, or list changes | Sunday |
| D3 | Posters | The prototype's fictional films use supplied generated posters; real productions only ever use their own | Confirm |

### E. How Home and Discover choose what to show

The rules exist and are tested. We need agreement on the **goals and guardrails**, not the formulas. The weights get tuned with real usage after launch.

| Surface | Proposed goal | Guardrails |
|---|---|---|
| The section after This week | Follows why you're here: finding work shows open roles for your craft, best fit first; collaborating shows collaborations first; hiring shows people for your project | Only open roles; never your own; never from people or houses you blocked |
| This week | The few most relevant or time-sensitive things this week, of mixed kinds (up to 5) | At most 2 of a kind; never people |
| People near you | Your department first, then the departments you work beside; available people first in each | Never minors; never blocked people |
| New work | People you follow or worked with first, then your department, then everyone | Not limited to one craft |
| Events near you | The events most relevant to you | Never ranked by organiser size or payment; variety and a fair tie-break |

**Ask on Sunday:** are these the right goals, and is anything missing from the guardrails?

## 5. What to show in the meeting

1. **New person:** welcome, sign up with Google, Before you join, onboarding, first Home.
2. **Kiran (cinematographer):** Home, an opportunity, Show interest, Discover, profile with credits, accept a credit, create a post.
3. **The Konark Pictures house account:** house Home, a project with trailer, publish a role, review interest, issue a credit. (In the prototype you get there by switching from Aditi; explain that the live app signs in to the house account directly.)
4. **Safety:** report and block from a profile.

The prototype's Studio page has direct links to each persona and state.

## 6. Expected changes after Sunday

Visual, flow, micro-interaction and animation changes are expected and cheap at this stage. How they're handled:

1. Each change is made in the prototype first, so everyone can see it.
2. Each change gets one dated line in `DECISIONS.md`.
3. Design and journey documentation is written **after** these changes settle, so nothing is written twice.

## 7. After the meeting

| Step | Output | Depends on |
|---|---|---|
| Record outcomes | `DECISIONS.md` updated | Sunday |
| Prototype changes | Requested visual and flow changes made and reviewed | Sunday feedback |
| Product rules | `PRODUCT.md`: scope, roles and permissions, numbered rules, lifecycles, ranking goals | A3, B1 to B3 |
| Journeys | `CAPABILITIES.md`: every v1 journey, its screens and states | Prototype changes settled |
| Design system | `DESIGN.md`: tokens, components, motion, platform notes | Prototype changes settled |
| Architecture | `ARCHITECTURE.md`: stack, backend, data, auth, media, operations | A1, A2, A5 |
| Build | v1 backlog in the issue tracker, then development | All of the above |
