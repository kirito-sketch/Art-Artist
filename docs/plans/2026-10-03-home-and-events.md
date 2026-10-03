# Home (fixed frame, composed middle) and Events Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the agreed Home architecture behind a switch, so `/test` can compare it with today's Home, and add curated Events as a graph-linked object type that appears where it belongs, with no new tab.

**Product spec (read first):**
- *Art and Artist Home Direction*, version 2: https://claude.ai/artifact/GmcWnvH51YewrLGJCk6QPS
- The Events decisions in this plan's section 0.

**Architecture:**
- **Home is a pure, deterministic composer.** It lives in `src/domain/home/` and runs: candidates, then significance filter, then ranking, then composition rules, then the session snapshot. It feeds a new `HomeNext` screen. The fixed frame (header, lead, personal news, end) is UI; the middle is whatever the composer returns.
- **Today's `HomeScreen` stays untouched** and remains the default. A variant switch picks the Home.
- **Events** are seed data plus a selector module. They plug into:
  - Discover (a new `events` scope);
  - project and house pages;
  - Saved (a new `event` kind, labelled "Interested");
  - Notifications (reminders);
  - the composer (a new candidate type, capped at 1).

**Tech stack:** React 18, Vite, TypeScript, the existing store (`src/state/store.tsx`) and seed data (`src/data/seed.ts`), and esbuild plus `node --test` for unit tests (same bundling pattern as `scripts/edge.mjs`). Browser checks use Playwright scripts like the existing walkthroughs.

---

## 0. Decisions this plan builds on (do not re-open while executing)

**Home:**
- A finite page with a fixed frame:
  - header with search and bell;
  - lead: a project or work, never a role;
  - personal news: one item, written as news, never counts;
  - a composed middle;
  - end: "You're up to date" plus Find links.
- **Ranking order:** relationship, then significance, then professional relevance (craft and intent), then location and language, then freshness.
- **Composition rules:**
  - no two units of the same type next to each other;
  - at most one opportunity, never above the third middle unit;
  - caps per type;
  - large and compact units alternate;
  - no padding below the quality bar;
  - no repeats unless something materially changed.
- **Significance:** high and medium only on Home; low never appears. Only high can be the lead.
- **Freshness:** candidates from the last seven days. Compose once per session and keep it stable. Recompose on a fresh launch or pull to refresh. Urgent personal news may enter the personal-news position on the next Home load.
- **Cold start:** at least three units, sourced in order: craft and place, active projects, people, work, houses.
- **No weekly-edition wording**, and no big heading on Home.

**Events:**
- **Curated** by the team at first (seeded in the prototype). No hosting by users yet.
- **Types:** `screening` (screenings and premieres), `workshop`, `meetup`, `festival`. Auditions are never events; they stay roles.
- **Every event has a host** (a house or a verified person) and can link a project and speakers.
- **Where they appear** (no tab):
  - Discover scope;
  - project page;
  - house page;
  - profile ("Speaking at" and "Hosting" only);
  - Saved ("Interested", private);
  - Notifications (reminders);
  - Home (a compact middle unit, cap 1; your own project's premiere is high significance and may lead).
- **Trust rules:**
  - the host must be verified;
  - price is always shown (or "Free");
  - an event can never ask for a fee for an audition or a role;
  - Report is available as for posts and roles.
- **Not built:** ticketing, payments, RSVP management, public attendee lists, event chat, user-created events.

**Test:**
- `/test` assigns each new session to `current` or `next` Home, 50/50, recorded on the session.
- The composer itself is not user-tested.


## 0b. Added decisions (3 October 2026, after the stakeholder responses)

**Switches:**
- `?home=next` turns on the new Home and `?events=on` turns on Events. Both are off in the default app. `?next` turns on both, for review.
- `/test` sets only the Home switch (50/50). Events stay off for both arms, so the comparison isn't mixed with a second change.
- Why Events are switched off by default: the stakeholder direction says to prioritise the core professional workflow (casting, jobs, profiles, credits, discovery) before secondary social features. Events are built and reviewable, but off until the founder turns them on.

**Who can create events:**
- Verified production houses and verified adult individuals. Unverified accounts see "Verify your identity to host events".
- Entry points: an Event option in the Create sheet, and "Add a screening" on a house's project page (which links the project).
- Free events from verified hosts go live at once. Paid events from verified houses go live at once. Paid events from individuals are "Under review", visible only to the host; in the prototype the review is simulated.
- Hosts can edit and cancel. People marked Interested are notified of changes and cancellations.

**Stakeholder rules applied to events:**
- **No paid access to opportunities.** An event can never sell access to a role, audition or registration. Audition or casting wording is redirected to "Open a role instead". Paid events may not promise roles.
- **Child safety.** No event may target under-18 participants or name a child as host or speaker. Child profiles are never linked to events.
- **Credits stay authoritative.** Linking an event to a project never creates or implies a credit.
- **Data minimisation.** Interest is private, and attendance is never collected beyond the Interested toggle.
- **Reports** use the existing escalation levels. An event report goes to Trust and Safety (level 2), or Child Safety (level 3) when it involves a minor.

**Whimsy, in the app's craft language and never at the cost of clarity:**
1. **"That's a wrap."** The end of Home is a small clapperboard that claps once, with today's golden hour for your city ("Golden hour in Hyderabad today: 5:41 to 6:08 pm"), computed on the device. It is useful and surprising for a film person, and it changes every day.
2. **Event cards as ticket stubs:** a perforated date stub. Marking Interested punches the stub.
3. **"Take 2."** Refreshing Home shows a one-line slate ("Take 2") while it recomposes.

All motion is transform or opacity only. Reduce Motion gives a still version with identical information. Nothing loops, there's no confetti, and there's no gamification.

**Heuristics and accessibility gates for every task:**
- Clear status, the user's language, user control (undo or cancel), consistency with existing components, error prevention (form rules), recognition over recall.
- Targets of at least 44 px, labels on everything, focus order, screen-reader text for visual-only elements (the clapper and the ticket stub), contrast AA in light and dark.

## Execution order and milestones

| Milestone | Tasks | Ships |
|---|---|---|
| M1 Foundations | 1 to 3 | Unit test runner, Home variant switch, research event names |
| M2 Composer | 4 to 10 | Pure composer with full unit tests, no UI |
| M3 Home UI | 11 to 16 | `HomeNext` behind `?home=next`, search in header, personal news, end, session stability, Notifications "Needs you" |
| M4 Supply | 17 to 18 | Project updates and credit-relationship candidates |
| M5 Events | 19 to 27 | Event data, rules, Discover scope, detail screen, project and house sections, Saved "Interested", reminders, Home candidate, Report |
| M6 Test and ship | 28 to 31 | `/test` 50/50 assignment, Study health split by variant, QA, docs, deploy |

Commit after every task. Push after every milestone (Vercel deploys). Run the regression suite before each push.

---

## M1: Foundations

### Task 1: Unit test runner

**Files:**
- Create: `scripts/unit.mjs`
- Modify: `package.json` (scripts)
- Test: `src/domain/home/smoke.test.ts` (temporary, deleted in Task 4)

**Step 1: Write the runner** (bundle each `*.test.ts` with esbuild, then run `node --test`):
```js
// Bundles every src/**/*.test.ts for node (they import app TypeScript) and runs them with node:test.
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const find = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? find(p) : p.endsWith('.test.ts') ? [p] : []; });
const entries = find('src');
const outdir = 'node_modules/.cache/unit';
mkdirSync(outdir, { recursive: true });
await build({ entryPoints: entries, bundle: true, platform: 'node', format: 'esm', outdir, outbase: 'src', outExtension: { '.js': '.mjs' }, logLevel: 'error' });
const files = entries.map((e) => join(outdir, e.replace(/^src\//, '').replace(/\.ts$/, '.mjs')));
const r = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(r.status ?? 1);
```

**Step 2:** Add `"test:unit": "node scripts/unit.mjs"` to `package.json` scripts.

**Step 3: Write a smoke test** `src/domain/home/smoke.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
test('runner works', () => assert.equal(1 + 1, 2));
```

**Step 4:** Run `npm run test:unit`. Expected: `# pass 1`, `# fail 0`.

**Step 5:** Commit: `test: add unit test runner (esbuild + node:test)`.

### Task 2: Home variant switch

**Files:**
- Create: `src/ui/homeVariant.ts`
- Test: `src/ui/homeVariant.test.ts`

**Behaviour:**
- `current` (default) or `next`.
- On `/test`, the variant comes from the test session (Task 28).
- Elsewhere it comes from `?home=next` or `?home=current`, persisted in `localStorage['aa-home']`.

**Step 1: Failing test:**
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHomeVariant } from './homeVariant';
test('defaults to current', () => assert.equal(parseHomeVariant(null, null), 'current'));
test('query wins over storage', () => assert.equal(parseHomeVariant('next', 'current'), 'next'));
test('storage used when no query', () => assert.equal(parseHomeVariant(null, 'next'), 'next'));
test('junk ignored', () => assert.equal(parseHomeVariant('banana', 'x'), 'current'));
```

**Step 2:** Run `npm run test:unit`. Expected: FAIL (module not found).

**Step 3: Implement:**
```ts
import { useSyncExternalStore } from 'react';
export type HomeVariant = 'current' | 'next';
const KEY = 'aa-home';
const ok = (v: string | null): v is HomeVariant => v === 'current' || v === 'next';
export const parseHomeVariant = (query: string | null, stored: string | null): HomeVariant => (ok(query) ? query : ok(stored) ? stored : 'current');
let variant: HomeVariant = 'current';
try {
  const q = new URLSearchParams(location.search).get('home');
  variant = parseHomeVariant(q, localStorage.getItem(KEY));
  if (ok(q)) localStorage.setItem(KEY, q);
} catch { /* storage blocked: default */ }
const subs = new Set<() => void>();
export function setHomeVariant(v: HomeVariant) { variant = v; try { localStorage.setItem(KEY, v); } catch { /* ignore */ } subs.forEach((f) => f()); }
export const useHomeVariant = () => useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => variant, () => 'current' as HomeVariant);
```
Guard `location` and `localStorage` with `typeof window !== 'undefined'` so the module bundles for node.

**Step 4:** Run the tests. Expected: 4 pass.

**Step 5:** In `src/App.tsx`, where the Home tab renders `<HomeScreen …/>`, render `variant === 'next' ? <HomeNext …/> : <HomeScreen …/>`. Until Task 11, `HomeNext` is a placeholder re-exporting `HomeScreen`. Commit: `feat(home): variant switch (?home=next), default current`.

### Task 3: Research event names for the new surfaces

**Files:** Modify `src/research-data/taxonomy.ts`, `src/research-data/ResearchObserver.tsx`, `src/research-dashboard/labels.ts`.

- **Add to `RESEARCH_EVENTS`:**
  - `home_unit_opened` (metadata: `unit`, `position`, `reason`);
  - `home_end_reached`;
  - `home_search_opened`;
  - `event_opened`, `event_saved`, `event_unsaved`.
- **Add `'event'`** to `RESEARCH_OBJECT_TYPES`.
- **Labels:** "Opened from Home: {unit} (position n)", "Reached the end of Home", "Opened search from Home", "Opened event: {title}", "Interested in event", "No longer interested".
- **Observer:** extend `SAVE_EVENT` with `event: ['event_saved', 'event_unsaved']`, and map the route `{ name: 'event' }` to `event_opened`.
- **Verify:** `npm run typecheck`, then `node scripts/research/e2e.mjs` against the local backend (41/41 for both studies).
- **Commit:** `feat(research): events for Home units and Events`.

---

## M2: The composer (pure, fully unit-tested)

All files live in `src/domain/home/`. No React and no store imports: the composer takes plain data in and returns plain data, so it is deterministic and testable.

### Task 4: Types

**Files:** Create `src/domain/home/types.ts`. Delete `smoke.test.ts`.

```ts
/** What a Home unit is. A new content type joins by adding one entry here, a form and a cap. */
export type UnitType = 'lead' | 'personal' | 'people' | 'post' | 'projectUpdates' | 'opportunity' | 'house' | 'creditRelation' | 'event';
export type Size = 'large' | 'compact';
export type Significance = 'high' | 'medium' | 'low';

export interface Candidate {
  id: string;                 // stable: `${type}:${objectId}` (material changes bump `version`)
  type: Exclude<UnitType, 'lead' | 'personal'>;
  objectId: string;
  version: string;            // changes when something material changes (stage, crew, date)
  significance: Significance;
  /** 0..1 each; ranking compares them in this order. */
  relationship: number;       // credits, worked-with, follows
  professional: number;       // craft, adjacent craft, intent
  place: number;              // city, language
  at: number;                 // epoch ms of the change (freshness)
  quality: number;            // 0..1; below QUALITY_BAR never shown
  reason?: string;            // one line, only when not self-explanatory
  /** Can this candidate lead? (project or work with a visual) */
  leadable: boolean;
}

export interface PersonalNews { id: string; text: string; action?: { label: string; route: unknown }; at: number; urgent: boolean }

export interface Composition {
  lead: Candidate | null;
  personal: PersonalNews | null;
  middle: Candidate[];
  composedAt: number;
}

export const SIZE: Record<Candidate['type'], Size> = { people: 'large', post: 'large', projectUpdates: 'compact', opportunity: 'compact', house: 'compact', creditRelation: 'compact', event: 'compact' };
export const CAP: Record<Candidate['type'], number> = { people: 1, post: 2, projectUpdates: 1, opportunity: 1, house: 1, creditRelation: 1, event: 1 };
export const QUALITY_BAR = 0.5;
export const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const MIN_UNITS = 3;
export const OPPORTUNITY_MIN_POSITION = 2; // zero-based: never above the third middle unit
```
Commit: `feat(home): composer types`.

### Task 5: Significance filter

**Files:** Create `significance.ts` and `significance.test.ts`.

**Step 1: Failing tests:**
- Low-significance candidates are dropped.
- Candidates older than the window are dropped.
- Candidates below `QUALITY_BAR` are dropped.
- `canLead` is true only for `high` and `leadable`.

```ts
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { eligible, canLead } from './significance';
import { c } from './fixtures';
const now = Date.UTC(2026, 9, 3);
test('drops low', () => assert.deepEqual(eligible([c({ significance: 'low' })], now), []));
test('drops stale', () => assert.deepEqual(eligible([c({ at: now - 8 * 864e5 })], now), []));
test('drops weak', () => assert.deepEqual(eligible([c({ quality: 0.3 })], now), []));
test('keeps medium', () => assert.equal(eligible([c({})], now).length, 1));
test('only high can lead', () => { assert.equal(canLead(c({ significance: 'medium', leadable: true })), false); assert.equal(canLead(c({ significance: 'high', leadable: true })), true); });
```

**Step 1b: Create the test helper** `src/domain/home/fixtures.ts` (a candidate factory used by every test):
```ts
import type { Candidate } from './types';
let n = 0;
export const c = (p: Partial<Candidate>): Candidate => ({ id: `post:${++n}`, type: 'post', objectId: String(n), version: '1', significance: 'medium', relationship: 0, professional: 0, place: 0, at: Date.UTC(2026, 9, 2), quality: 0.8, leadable: false, ...p });
```

**Step 2:** Run. Expected: FAIL.

**Step 3: Implement:**
```ts
import { QUALITY_BAR, WINDOW_MS, type Candidate } from './types';
export const eligible = (cs: Candidate[], now: number) => cs.filter((x) => x.significance !== 'low' && now - x.at <= WINDOW_MS && x.quality >= QUALITY_BAR);
export const canLead = (x: Candidate) => x.leadable && x.significance === 'high';
```

**Step 4:** Run. Expected: PASS. **Step 5:** Commit: `feat(home): significance and quality filter`.

### Task 6: Ranking

**Files:** Create `rank.ts` and `rank.test.ts`.

**Order:** relationship, then significance (high above medium), then professional, then place, then freshness. Use a lexicographic comparison with 0.05 tolerance bands, so a tiny relationship edge doesn't beat a big significance gap only by accident. The tests make this explicit.

**Tests:**
1. A higher relationship beats higher significance.
2. With relationship equal, high beats medium.
3. With both equal, professional, then place, then the newer item wins.
4. The order is stable for identical candidates (sorted by `id`).

```ts
export const SIG = { high: 2, medium: 1, low: 0 } as const;
const band = (x: number) => Math.round(x / 0.05);
export function rank(cs: Candidate[]): Candidate[] {
  return [...cs].sort((a, b) =>
    band(b.relationship) - band(a.relationship) ||
    SIG[b.significance] - SIG[a.significance] ||
    band(b.professional) - band(a.professional) ||
    band(b.place) - band(a.place) ||
    b.at - a.at ||
    a.id.localeCompare(b.id));
}
```
Red, green, then commit: `feat(home): ranking`.

### Task 7: Composition rules

**Files:** Create `compose.ts` and `compose.test.ts`.

**Tests** (write all of them first):
1. No two units of the same type are next to each other, given ranked `[post, post, people]`. Expect `[post, people, post]`.
2. At most one opportunity. Two opportunities rank first; expect only one, and at index ≥ 2.
3. An opportunity is never above the third middle unit. A top-ranked opportunity lands at index 2 when there are at least two other units; with fewer, it is dropped rather than placed early.
4. Caps: three posts in the pool gives two at most.
5. Rhythm: large and compact alternate where the pool allows it (`[people, post, house, projectUpdates]` becomes large, compact, large, compact).
6. No padding: a pool of two eligible candidates gives a middle of two.
7. The lead is chosen first. It is the highest-ranked `canLead` candidate, it is excluded from the middle, and it is never an opportunity.
8. The middle is capped at 8 units.

**Algorithm** (greedy over the ranked list):
```ts
export function compose(ranked: Candidate[], personal: PersonalNews | null, now: number): Composition {
  const leadIdx = ranked.findIndex((x) => canLead(x) && x.type !== 'opportunity');
  const lead = leadIdx >= 0 ? ranked[leadIdx] : null;
  const pool = ranked.filter((_, i) => i !== leadIdx);
  const middle: Candidate[] = []; const used: Record<string, number> = {};
  const fits = (x: Candidate, at: number) => {
    if ((used[x.type] ?? 0) >= CAP[x.type]) return false;
    if (x.type === 'opportunity' && at < OPPORTUNITY_MIN_POSITION) return false;
    const prev = middle[at - 1];
    if (prev && prev.type === x.type) return false;
    return true;
  };
  const wantSize = () => (middle.length ? (SIZE[middle[middle.length - 1].type] === 'large' ? 'compact' : 'large') : 'large');
  const left = [...pool];
  while (left.length && middle.length < 8) {
    const at = middle.length;
    // Prefer the best-ranked unit that fits and keeps the rhythm; otherwise the best that fits.
    let i = left.findIndex((x) => fits(x, at) && SIZE[x.type] === wantSize());
    if (i < 0) i = left.findIndex((x) => fits(x, at));
    if (i < 0) break;
    const [x] = left.splice(i, 1); middle.push(x); used[x.type] = (used[x.type] ?? 0) + 1;
  }
  return { lead, personal, middle, composedAt: now };
}
```
**Note for test 3:** an opportunity that cannot be placed at or after index 2 stays in `left` and is dropped at the end. That is the "no early role" rule.

Red, green, then commit: `feat(home): composition rules`.

### Task 8: No repeats unless material change

**Files:** Create `seen.ts` and `seen.test.ts`.

- `seenKey = id + '@' + version`.
- `withoutSeen(cs, seen)` removes candidates whose `seenKey` was in a previous session's composition.
- `remember(composition)` returns the keys shown.
- Storage: `localStorage['aa-home-seen']`, keeping the last 200 keys with timestamps and dropping keys older than 14 days. Put the read/write in `session.ts` (Task 9); `seen.ts` stays pure.

**Tests:**
- A candidate shown last session is hidden.
- After its `version` changes (for example a stage change), it is shown again.
- With nothing seen, nothing is hidden.

Commit: `feat(home): no repeats unless something changed`.

### Task 9: Session stability

**Files:** Create `session.ts` and `session.test.ts`.

**Rules:**
- `getComposition(input, now, store)` returns the stored composition while the session is fresh.
- A session is fresh while the app hasn't been relaunched and the user hasn't refreshed. Model it as: the session key is stored in `sessionStorage['aa-home-session']`, and a new key is created on a fresh page load or `refresh()`.
- **Urgent personal news exception:** if the stored composition has no personal news (or an older one) and the input has urgent personal news, swap only the `personal` field.
- **Tests** (inject a fake storage):
  1. Two calls in one session return identical middle ids, even if the input changed.
  2. `refresh()` recomposes.
  3. Urgent personal news replaces `personal` without changing the middle.
  4. Non-urgent news waits for the next session.

Commit: `feat(home): stable within a session, recompose on launch or refresh`.

### Task 10: Cold start

**Files:** Create `coldStart.ts` and `coldStart.test.ts`.

If the composition has fewer than `MIN_UNITS` (counting the lead), top it up from cold-start sources in this order:
1. craft plus city or language;
2. high-quality active projects;
3. relevant people;
4. strong professional work;
5. houses active in that ecosystem.

Sources are passed in already ranked. The same composition rules apply. Never add anything below the quality bar.

**Tests:**
- A new cinematographer in Hyderabad with an empty network gets: a lead (an active Telugu production in Hyderabad), people, and a post.
- If the cold-start sources are also empty, the result is shorter than 3 and has no filler.

Commit: `feat(home): cold start sourcing`.

**M2 check:** `npm run test:unit` all pass, then `npm run typecheck`.

---

## M3: Home UI behind the switch

### Task 11: Candidate adapters (store data to candidates)

**Files:** Create `src/domain/home/candidates.ts`, which may import `src/domain/relevance.ts`, `src/data/seed.ts` and `src/state/world.ts`.

| Candidate | Source | How it's scored |
|---|---|---|
| `people` | `peopleFor(me, intent, following, signals)` | The top 3 make **one** people candidate. Relationship is 1 if any of them has a verified credit with you or with someone you worked with, otherwise 0.4 for followed-adjacent and 0 otherwise. Professional and place come from the tier (1 → 1, 2 → 0.6, 3 → 0.3). Reason: the person's `why`. |
| `post` | `workFor(me, following, userPosts)` | Leadable when it has media. Significance is medium ("meaningful professional post"). |
| `projectUpdates` | Project updates (Task 17) | One candidate holding the top 3 rows. |
| `opportunity` | `opportunitiesFor(…)` | Significance is high only for tier 1 with dates that fit, otherwise medium. Never leadable. |
| `house` | `housesFor(me)[0]` | Medium. |
| `creditRelation` | Task 18 | |
| `event` | Task 25 | |

Personal news comes from `notifications`. Use the most recent unread item of kind `credit` or `interest` from a house or person. Write it as news: `"{Actor} added you to {Project} as {role}"` or `"{House} is interested in you for {role}"`. Action: Review, which goes to the existing route. **Never build counts.** The test enforces this: the text must not match `/\d+ (things|credits|interests)|need your attention/`.

**Unit tests:** use seed personas (Kiran, and a fresh new person) and assert the candidate counts, types and that no text has counts. Commit.

### Task 12: `HomeNext` screen: the frame

**Files:**
- Create `src/screens/home/HomeNext.tsx` and `src/screens/home/units.tsx`.
- Modify `src/styles/screens.css`, adding a `.hn-` block.

**Layout:**
- **Header:** logo, a search pill ("People, projects, roles"; `aria-label="Search people, projects and roles"`), and the bell exactly as in `HomeScreen` today.
- **Lead:** a full-bleed visual card using `Photo`, a stage tag, the title, a meta line and a reason line with a face stack. It reuses the `shared.work(id)` layoutId so the shared-element transition into the project works.
- **Personal news:** a single compact row (house or person avatar, the sentence, and a Review button). Rendered only when `personal`.
- **Middle:** `composition.middle.map(unit => <Unit …/>)`.
- **End:** "You're up to date. New things arrive as projects move and people share work." plus Find chips: People, Projects, Roles, Houses, Events. Each calls `goDiscover(scope)`.
- **No heading text** beyond the screen-reader `<h1 className="sr-only">Home</h1>`.
- **No intent chip.** Intent stays in onboarding and Profile settings and is used only for ranking.
- **Unit components** reuse existing primitives: `PortraitCard` (people), `PostCard`, `RoleRow` (opportunity), `FollowButton` (house), and a new compact `EventRow` (Task 25).

**Instrumentation:** every unit press calls `research.track('home_unit_opened', { metadata: { unit, position, reason: !!reason } })`. An IntersectionObserver on the end block tracks `home_end_reached` once per session.

**Verify** with Playwright (`?home=next`, Kiran) by screenshotting the first viewport and the full page. Commit.

### Task 13: Search pill opens Discover search

**Files:** Modify `HomeNext.tsx` and `src/screens/discover/DiscoverScreen.tsx`.

- **The pill:** `goDiscover('all-search')` plus `research.track('home_search_opened')`.
- **Discover:** accept a `focusSearch` flag (through the existing `goDiscover(scope, craft)` signature, adding an optional third argument). On mount, focus the search input.
- **Check:** the keyboard opens on mobile and Back returns to Home at the same scroll position.

Commit.

### Task 14: Pull to refresh and session wiring

**Files:** Modify `HomeNext.tsx`.

- Use `getComposition` (Task 9) in a `useMemo` keyed on the session key.
- Pull to refresh is the existing overscroll gesture if there is one; otherwise a "Refresh" item in the end block. It calls `refresh()` and recomposes.
- Write the seen keys (Task 8) on unmount.
- **Playwright check:** open a project from Home, go back, and the middle ids are identical. Reload, and it may differ.

Commit.

### Task 15: Notifications "Needs you"

**Files:** Modify the Notifications sheet in `src/screens/sheets/Sheets.tsx`.

- When the variant is `next`, group the unread `credit` and `interest` notifications at the top under "Needs you", then the rest under "Earlier".
- With `current`, nothing changes.
- **Check:** that the a11y heading order stays valid.

Commit.

### Task 16: M3 QA

- Run the Playwright walkthrough of `?home=next` for Kiran (busy), a new cinematographer (cold start) and a quiet week (fixture: no unread credits).
- **Assertions:**
  - The lead is never a role.
  - No two adjacent units share a type.
  - There is at most one opportunity, at index ≥ 2.
  - Personal news has no counts.
  - The end block is present.
  - Today's Home is unchanged without the flag (pixel diff 0% at 390×844).
- Run axe on HomeNext: 0 violations.
- Run `reg.sh`, then push M1 to M3.

---

## M4: Supply that keeps Home alive

### Task 17: Project updates

**Files:**
- Modify `src/data/types.ts` to add `ProjectUpdate { id; projectId; kind: 'stage' | 'crew' | 'dates'; from?; to; at; actorIds?: string[] }`.
- Modify `src/data/seed.ts` to add `projectUpdates` (8 to 10 records within the last 7 days, relative to `Date.now()` at load, so the prototype always has fresh news).
- Modify `src/domain/home/candidates.ts`.

**Significance:**

| Change | Level |
|---|---|
| Stage moved to `Shooting` (entered production) | High |
| Crew attached with a major role (DoP, Director, Editor, Production Designer) | High |
| Someone you worked with joined | High |
| Any other stage change | Medium |
| Minor crew addition | Medium |
| Metadata-only change | Low (never emitted as a candidate) |

**Unit tests** for the mapping. Commit.

### Task 18: Credit-relationship candidates and reason lines

**Files:** Create `src/domain/home/graph.ts` and `graph.test.ts`.

- `workedWith(meId)`: people sharing a verified credit project with me, from `publicCreditsFor` (`src/domain/discovery.ts`).
- `collaboratorsOf(id)`: the same for anyone.
- `reasonFor(personId)`: a priority list of reasons:
  1. "Worked with {X} on {Project}"
  2. "{n} people you've worked with have worked with them"
  3. craft and city
- A `creditRelation` candidate: "Meera and Vikram were both verified on Kaaval", built from a new verified credit (within 7 days) between two people in your network. Significance: medium.

**Tests** on seed data (Kiran's credits on Kaaval and Fault Lines). Commit, then push M4.

---

## M5: Events (curated)

### Task 19: Event type and seed

**Files:** Modify `src/data/types.ts` and `src/data/seed.ts`.

```ts
export type EventType = 'screening' | 'workshop' | 'meetup' | 'festival';
export interface IndustryEvent {
  id: string; type: EventType; title: string;
  hostId: string;              // org or person; must be verified (Task 20)
  projectId?: string;          // a screening/premiere of a project
  speakerIds?: string[];
  city: string; venue: string;
  start: string; end?: string; // ISO
  price: { kind: 'free' } | { kind: 'paid'; amount: string } ;
  link?: string;               // external tickets/info, opens outside
  status: 'scheduled' | 'cancelled';
  summary: string;
  /** Set by the curation team after a manual check (see Task 20). */
  reviewed?: boolean;
}
```

**Seed:** 10 events relative to now, across Hyderabad, Mumbai, Kochi and Chennai:
- a Kaaval festival screening (Kiran is credited on it);
- a Konark Pictures crew meetup in Hyderabad;
- a colour-grading workshop hosted by Rhea (verified), priced;
- a Tidewater documentary screening;
- one festival market;
- one cancelled event.

Dates fall 2 to 30 days ahead, plus one in the past (it must not show).

Commit.

### Task 20: Event rules (trust) as pure functions

**Files:** Create `src/domain/events.ts` and `events.test.ts`.

```ts
export function listable(e: IndustryEvent, isVerified: (id: string) => boolean, now: number): boolean {
  if (e.status !== 'scheduled') return false;
  if (Date.parse(e.end ?? e.start) < now) return false;
  if (!isVerified(e.hostId)) return false;
  // Auditions and casting are roles, never events (and never for a fee). A reviewed seed entry can opt out
  // when the words mean something else, e.g. a talk by casting directors.
  if (/audition|casting/i.test(e.title + ' ' + e.summary) && !e.reviewed) return false;
  return true;
}
export const priceLabel = (e: IndustryEvent) => (e.price.kind === 'free' ? 'Free' : e.price.amount);
```

**Tests:**
- An unverified host is hidden.
- A past event is hidden.
- A cancelled event is hidden.
- An audition is hidden whether it is paid or free, because auditions are roles.
- A reviewed event that mentions casting directors is shown.
- `priceLabel` always returns a value.

Commit.

### Task 21: Event selectors and the Discover scope

**Files:**
- Create `src/state/events.ts` (`eventsFor(me)`, ranked: your project, then people you've worked with or follow speaking or hosting, then city, then craft relevance from the speakers' crafts, then date).
- Modify `DiscoverScreen.tsx`: add `'events'` to `Scope` and a filter bar with City, When (This week, This month, Any time) and Type, using the existing `FilterBar` and `Facet` components (`docs/DISCOVER_FILTERS.md`). Show rows using `EventRow`.

**Playwright check:** the Events scope lists 9 (the cancelled and past ones are hidden), the filters narrow the list, and an empty state reads "No events match. Try another city or date." Commit.

### Task 22: Event detail screen

**Files:**
- Modify `src/state/store.tsx`, adding `| { name: 'event'; id: string }` to `Route`.
- Create `src/screens/event/EventScreen.tsx`.
- Modify `src/App.tsx` (route switch).

**Content:**
- hero (the project artwork if linked, otherwise a typographic header);
- the type tag;
- title, date and time, venue and city, and price;
- the host (tappable, goes to the house or person);
- the linked project (tappable);
- speakers;
- the summary;
- "Interested", a toggle that saves privately (Task 23);
- "Tickets and details", which opens the external link in a new tab, shown only if a link exists;
- the kebab menu with Report (Task 27).

**Playwright check:** open the screen from Discover and from a project page; Back returns correctly. Commit.

### Task 23: Saved "Interested"

**Files:** Modify `src/state/store.tsx` (`SavedKind` gains `'event'`), `src/screens/profile/SavedScreen.tsx` (an "Events" group sorted by date, with past events dropping off) and the observer (Task 3).

- **Copy:** the button reads "Interested" with a filled state. The toast follows the existing first-save pattern.
- **Privacy:** never visible to anyone else (`docs/SAVE_MODEL.md` rules).

Commit.

### Task 24: Project, house and profile placements

**Files:** Modify `src/screens/org/WorkScreen.tsx` (project), `src/screens/org/OrgScreen.tsx` (house) and `src/screens/profile/ProfileScreen.tsx`.

- **Project page:** a "Screenings" section with upcoming events whose `projectId` matches. It is hidden when there are none.
- **House page:** an "Upcoming events" section with events hosted by the house. Hidden when there are none.
- **Profile:** "Speaking at" for upcoming events where the person is a speaker or host. Interest is never shown.
- **Playwright check** on Kaaval's project page, Konark's house page and Rhea's profile. Commit.

### Task 25: Events in Home (candidate) and the `EventRow` unit

**Files:** Modify `src/domain/home/candidates.ts` and `units.tsx`.

- **The candidate:** the top event from `eventsFor(me)` within 14 days. Even though the Home window is 7 days, events are about the coming two weeks, so `at` is set to "now" for in-window events.
- **Significance:**

| Event | Level |
|---|---|
| A screening or premiere of a project you're credited on | High (leadable, using the project artwork) |
| People you've worked with are speaking or hosting | Medium |
| In your city and your craft | Medium |
| Otherwise | Low (never on Home) |

- **Cap:** 1. **Size:** compact.
- **`EventRow`:** date block (day and month), title, venue and city, price, and a reason line.

**Unit test:** Kiran gets the Kaaval screening as a candidate with significance `high`. Commit.

### Task 26: Event reminders in Notifications

**Files:** Modify `src/state/store.tsx` (derive notifications) and `Sheets.tsx`.

- For events saved as Interested starting within 48 hours, add a derived notification: "{title} starts tomorrow at {time} · {venue}". It opens the event.
- Derived means it is computed, not stored, so un-saving removes it.
- **Not personal news on Home:** a reminder is something to do, so it stays in Notifications only.

Commit.

### Task 27: Report an event

**Files:** Reuse the report flow (`src/state/reports.ts` and the report sheet). Add `'event'` as a reportable kind, with reasons: "Asks for money for a role or audition", "Not a real event", "Misleading", "Something else". Check it on the event screen. Commit, then push M5.

---

## M6: Test and ship

### Task 28: `/test` assigns a Home variant

**Files:** Modify `src/research-data/TestMode.tsx` and `src/ui/homeVariant.ts`.

- On session start, pick `current` or `next` at random 50/50.
- Store it in the test state (`aa-test-state.homeVariant`) and call `setHomeVariant`.
- Record it with `research.track('session_started', …)`, which already exists; add the metadata `homeVariant`.
- A resumed session keeps its variant.
- Sessions on the old study always get `current`.
- **No participant-facing change.**
- **Playwright check:** across 20 fresh sessions, both variants appear; a reload keeps the variant.

Commit.

### Task 29: Study health split by Home variant

**Files:** Modify `src/research-dashboard/health.ts` and `Dashboard.tsx`.

- Read `homeVariant` from each session's `session_started` event.
- Add a "Home version" filter (All, Current, New) to the Study health header.
- Add a small comparison table for the three measures in the direction doc:
  - answers to "What is Art and Artist mainly useful for?" side by side;
  - scenario 2 and 4 time, finish rate and stuck count, by variant;
  - "What would make you come back?" answers by variant.

Commit.

### Task 30: Full QA

- `npm run test:unit` and `npm run typecheck`.
- `reg.sh`: walkthroughs, smoke, launch, views, mobile, focus flow, the `/test` flows, resume, old session and a11y.
- The new walkthroughs `home-next.cjs` (Task 16) and `events.cjs` (Tasks 21 to 27).
- Research e2e on both studies; the edge suite at its baseline.
- Run `/test` end to end on both variants at desktop and 390×844.

### Task 31: Docs and deploy

- Write `docs/HOME.md`: frame, composer, rules, significance, session, cold start, how to add a unit type.
- Write `docs/EVENTS.md`: model, placements, trust rules, curation process, what isn't built.
- Update `docs/RESEARCH_TEST_MODE.md` (variant assignment) and `docs/RESEARCH_DASHBOARD.md` (the variant split).
- Commit, push and check the Vercel status. Report results with screenshots of both Homes, the Events surfaces and Study health.

---

## Out of scope (deliberately)

- **Production House Home.** It gets the same frame and composer with a different candidate pool, as a follow-up plan once the individual Home is validated.
- **User-created events, public attendance, "people who were there".** These are Events phases 3 and 4, after validation.
- **Machine-learned ranking.** The rules are enough until supply outgrows them.
- **Changing today's Home.** It stays as the control until the `/test` comparison is read.
