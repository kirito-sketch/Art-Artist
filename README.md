# Ana · V2 mobile prototype

A working prototype of Ana (Art & Artist), the professional platform for film and entertainment
professionals. The reasoning behind every structural decision is in
[`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md). Read that first.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
```

On a desktop browser the app renders inside an iPhone-sized frame with a **prototype control panel**
beside it. On a phone-width viewport it runs full screen.

## What's in this iteration

| Area | What works |
| --- | --- |
| **Shell** | Floating pill tab bar (Home · Discover · Create · Inbox · Profile) with an animated selection pill, raised Create button that rotates into a close control, header notifications, stack navigation with per-route transitions, drag-to-dismiss sheets, toasts with undo. |
| **Home** | Collapsing cinematic header with editable availability, For You carousel (snap, peeking, progress dashes, end card), official vs peer cards, match reasons, deadlines, save with feedback, ranked and grouped network activity, capped Latest Posts, finite "That's a wrap" end. |
| **Opportunity** | Verified production house or peer author, facts, "Why you're seeing this", per-role audition details, role-specific questions, no-fee trust note with report. CTA adapts: Respond (official), Message (collab with DMs on), Show interest (DMs off), Review interest (your own), disabled offline, and a record once sent. |
| **Create** | Persona-aware sheet. One post composer for text, photos and video with media limit, remove, "Also add to portfolio", discard confirmation and background publishing with progress, failure, retry and keep-draft. Two-step collaboration composer (Looking for someone / Available for work) with live card preview and the direct-message setting. |
| **Discover** | Search-first with recent searches, animated scope chips (All, Opportunities, People, Projects, Collaborations, Following), filters, browse by craft, recently credited projects, grouped results and no-result state. |
| **Inbox** | Context chip on every thread, organisation-owned threads, interest review queue where the creator starts the conversation, conversation view with pinned context card. |
| **Profile** | Identity, availability, credibility strip, private "Only you see this" (Saved, My responses, My collabs), Overview / Credits / Work / Posts, production-issued credits with report flow, portfolio and self-described projects, private and removed profile states. |

### Prototype controls

| Control | Shows |
| --- | --- |
| Kiran · Cinematographer / Tara · Actor | For You changes by profession; Tara also demonstrates a sparse network with no posts. |
| New user | Two broad matches, "Sharpen your matches" card, network section transforms into suggested people, posts hidden. |
| Slow network | Skeletons, then content. |
| For You fails | Inline error with retry; the rest of Home still works. |
| Offline | Banner, responses disabled with an explanation, uploads wait for connection. |
| Publishing fails | Upload stops partway; retry or keep the draft. |

## Code map

```
src/
  styles/tokens.css        colour, type, spacing, radii, motion tokens
  styles/*.css             base, component and screen styles
  ui/                      primitives (Pressable, PressCard, Button, Avatar, TypeBadge, Chip,
                           Segmented, Toggle, Skeleton, EmptyState), Sheet, Still, chrome
  nav/TabBar.tsx           floating pill navigation
  state/store.tsx          navigation stack, sheets and product behaviour
  state/selectors.ts       recommendation, network ranking and derived data
  data/                    types and realistic sample content
  screens/                 home, opportunity, create, discover, inbox, profile, sheets
  dev/PrototypeControls    evaluation panel (not product UI)
```

### Visual system in one paragraph

Warm near-black surfaces (graded, not grey), warm off-white text, one brand accent (tungsten amber).
Each trust type owns one hue and one icon and never lends it out: **crew job** tungsten with a
clapperboard, **casting call** coral with a megaphone, **collaboration** sage, outlined, with a
handshake. Verified marks are cool blue. Display type is Instrument Serif for names, titles and
section heads; UI type is Inter Tight. Motion is spring-based and reserved for state changes: press
compression, tab pill, sheet physics, save burst, staggered first reveal, publish progress.

### Media

Image hosts are not reachable from the environment this was built in, so every media slot renders a
procedural, seeded "cinematic still" (`src/ui/Still.tsx`). Pass a real `src` on any `Media` object and
it is used instead; if it fails to load, the designed missing-media state appears.
