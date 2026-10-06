# Events

Screenings, premieres, workshops, industry meetups, festivals and markets. Events are an object type tied to the graph (a host, an optional project, optional speakers). They have **no tab of their own and no ticketing**.

## V1 (active)

Ana has no internal moderation team yet, so V1 makes no promise that anyone at Ana reviews events.

- **Free events only.** The composer doesn't ask about price. Every V1 event is free.
- **Immediate publishing.** Once the required fields are valid, "Publish event" makes it live at once. The automated rules still run (verified adult host, no auditions or casting, nothing aimed at children). There's no "Send for review", no review queue and no "checked by the team" copy.
- **Optional registration or RSVP link.** Price and registration are separate: a free event can still need registration (Google Forms, BookMyShow free registration, the organiser's site). On the event page the link is a "Register" button.
- **Paid events aren't available.** The composer has no paid option. (The approved alternative, a disabled "Paid events · Coming soon" row, wasn't needed: the preferred option is not to ask about price at all.)

**V1 fields:**
- Event type
- Title
- Date
- Time
- City
- Venue
- Optional registration or RSVP link
- Optional cover image (without one, the event uses its film's or its host's imagery)
- What happens
- Organiser: whoever is creating it, or the house they act for

The CTA is "Publish event".

**Architecture.** The data model keeps the future shape. `price` is the pricing type, `{ kind: 'free' } | { kind: 'paid'; amount }`, and `status` keeps `'under_review'`. V1 only ever writes `free` and never writes `under_review`. The switch is `EVENT_CAPABILITIES.paidEvents` in `src/domain/events.ts`. It's off, nothing in the product turns it on, and with it off:
- `validateDraft` treats a missing price as free, refuses a paid draft ("Paid events are coming later.") and always returns `review: 'live'`;
- `listable` never shows a paid record.

Unit tests cover V1, and cover the future paid flow by switching paid events on.

## Future: not active in V1

Designed and kept for when Ana has the operational capacity to moderate. None of it appears in the app today.

- **Paid events.** Free / Paid selection, price, an external tickets link, "the price is always shown; people pay the host directly; Art and Artist never takes money".
- **Organiser eligibility.** Who may sell tickets (for example verified houses first, then verified individuals with a track record).
- **Review states.** Draft → **Send for review** → **In review** → one of:
  - Approved → Live
  - Changes requested → Edit → Resubmit
  - Rejected

  A paid event from an individual waits for review; a paid event from a verified house goes live. Only the host can see an event while it's in review.
- **Internal review screen** (admin):
  - event preview
  - organiser information
  - price and tickets URL
  - safety and risk checks (promises of roles, auditions, children, misleading price)
  - Approve & publish · Request changes · Reject · Escalate
- **Rules that only apply to paid events:** a paid event can never promise a role, an audition or selection.
- **Already in the code, behind the switch:** the paid fields and "Send for review" in `EventComposer.tsx`, the "Under review" banner on the event page and ticket, and `review: 'under_review'` in `validateDraft`. The review states beyond under review, eligibility and the admin screen are specified here only.

## Switch

**On by default** in the app: Discover has an Events tab, Create has Event, project, house and profile pages show their events, Saved and Notifications include them, and Home shows at most one event (today's Home places it after the core professional modules; the new Home composes it like any other unit, cap 1). `?events=off` hides them on this device; `?events=on` brings them back. On `/test` Events stay off so the Home comparison changes one thing only.

## Rules (`src/domain/events.ts`, unit-tested)

These follow the stakeholder principles.

- **No paid access to opportunities.**
  - Auditions and casting are roles, never events. A draft that reads like an audition is refused with "Auditions and casting are roles, not events. Open a role instead."
  - A paid event can never promise a role, an audition or selection.
- **Children.** Events are for adults. Nothing may be aimed at under-18s, and a minor can never host. Work involving children goes through a role, where the guardian responds.
- **Who can host.** Verified production houses and verified adult individuals. Anyone else sees "Verify your identity to host events."
- **Publishing (V1).** Every event goes live once it's valid. Nothing waits for review (see Future for the paid-event review model).
- **Price is always shown.** In V1 that's "Free". Every event page says "Art and Artist never charges to apply or audition."
- **What anyone can see** (`listable`): scheduled, not past, free (in V1), a verified adult host, and none of the rules above broken. Hosts also see their own events after cancelling.

## Where events appear

| Place | What |
| --- | --- |
| Discover › Events | Filters for City, When (next 7 or 30 days) and Type. Empty state: "No events match. Try another city or date." |
| Event page | What, when, where and price ("Free") at the top. Interested, a "Register" button when there's a registration link (opens the host's site), host, project, speakers, summary. More menu: Report (for others), or Edit and Cancel (for the host). |
| Project page | "Screenings". The lead house gets "Add a screening". |
| House page | "Upcoming events" |
| Profile | "Hosting" and "Speaking at" |
| Saved | "Events", private. Past events drop off, and cancelled ones stay, marked. |
| Notifications | "Coming up": Interested events from 48 hours before (Today, Tomorrow), plus changes and cancellations. These are derived from the event, so they can never drift from it. |
| Create menu | "Event", or "Event by {house}" when acting for a house |
| New Home | A compact "Coming up" unit, cap 1. A screening of a film you're credited on is high significance and can lead. |

## Interested

Interested is private, like every save, and nobody is told. On a card it is a 44px round ticket toggle. On the page it is a labelled button. Marking it punches a small hole through the ticket, once; under Reduce Motion it simply appears.

## Reports

Event reports have their own reasons:

- Asks for money for a role or audition
- Not a real event
- Misleading price or details
- Involves a child
- Something else

Each report carries an escalation level (`src/state/reports.ts`): anything about a child goes to **Child Safety**; money, fake or misleading listings go to **Trust and Safety**; everything else goes to **Support**. Admin is the final level.

## Research events

`event_opened`, `event_saved`, `event_unsaved`, `event_created` (type, paid, review, linked, host kind, registration, cover; in V1 paid is always false and review always live) and `event_cancelled`, with object type `event`.

## Seed

`seedEvents(now)` in `src/data/seed.ts` has thirteen events. Nine are shown. Four are hidden on purpose so the rules can be seen working:

- an unverified host;
- a cancelled event;
- a past event;
- an "open auditions" listing.

Every seeded event is free. The workshop and the film market keep a registration link.

## Accessibility

- Every ticket has one accessible name with the date, the venue, the price and any status.
- Composer errors sit next to their field. A failed publish moves focus to the first field that needs attention.
- Discover's tab row scrolls by itself, so the page never scrolls sideways.
- axe: 0 violations on Discover events, the event page, its menu, the composer (empty and with errors) and Notifications, in light and dark.
