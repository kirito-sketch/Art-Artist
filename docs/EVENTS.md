# Events

Screenings, premieres, workshops, industry meetups, festivals and markets. Events are an object type tied to the graph (a host, an optional project, optional speakers). They have **no tab of their own and no ticketing**.

## Switch

Off by default. Turn on with `?events=on`, or `?next` (Events and the new Home). Events are always off on `/test`, so the Home comparison changes one thing only. The stakeholder direction puts the core professional workflow (casting, jobs, profiles, credits, discovery) before secondary social features, so Events stay off until the founder turns them on.

## Rules (`src/domain/events.ts`, unit-tested)

These follow the stakeholder principles.

- **No paid access to opportunities.**
  - Auditions and casting are roles, never events. A draft that reads like an audition is refused with "Auditions and casting are roles, not events. Open a role instead."
  - A paid event can never promise a role, an audition or selection.
- **Children.** Events are for adults. Nothing may be aimed at under-18s, and a minor can never host. Work involving children goes through a role, where the guardian responds.
- **Who can host.** Verified production houses and verified adult individuals. Anyone else sees "Verify your identity to host events."
- **Review.**
  - Free events go live, and so do paid events from houses.
  - Paid events from individuals go to the team first ("Under review"), and only the host can see them until then.
- **Price is always shown.** People pay the host directly, and Art and Artist never takes money. Every event page says "Art and Artist never charges to apply or audition."
- **What anyone can see** (`listable`): scheduled, not past, a verified adult host, and none of the rules above broken. Hosts also see their own events while under review or after cancelling.

## Where events appear

| Place | What |
| --- | --- |
| Discover › Events | Filters for City, When (next 7 or 30 days) and Type. Empty state: "No events match. Try another city or date." |
| Event page | What, when, where and price at the top. Interested, a "Tickets and details" link (opens the host's site), host, project, speakers, summary. More menu: Report (for others), or Edit and Cancel (for the host). |
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

`event_opened`, `event_saved`, `event_unsaved`, `event_created` (type, paid, review, linked, host kind) and `event_cancelled`, with object type `event`.

## Seed

`seedEvents(now)` in `src/data/seed.ts` has ten events. Six are shown. Four are hidden on purpose so the rules can be seen working:

- an unverified host;
- a cancelled event;
- a past event;
- a paid "open auditions" listing.

## Accessibility

- Every ticket has one accessible name with the date, the venue, the price and any status.
- Composer errors sit next to their field. A failed publish moves focus to the first field that needs attention.
- Discover's tab row scrolls by itself, so the page never scrolls sideways.
- axe: 0 violations on Discover events, the event page, its menu, the composer (empty and with errors) and Notifications, in light and dark.
