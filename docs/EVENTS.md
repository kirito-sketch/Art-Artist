# Events — approved V1

Events are free gatherings hosted by verified adult individuals or verified Production Houses. V1 uses **Request to attend** only. Publishing is immediate after validation; attendance requires the organiser's acceptance. There is no active payment, ticketing, external registration or moderation workflow.

## Creation → attendee mapping

| Organiser enters | Required | Card | Event detail / management |
| --- | --- | --- | --- |
| Title, up to 80 characters | Yes | Title | Main heading |
| Category | Yes | Subtle metadata | Subtle category above heading |
| Cover image | No, recommended | Thumbnail | Hero; otherwise a deliberate calendar/Ana fallback, or associated project artwork |
| Date and start time | Yes | Date/time | Key details; Indian time, explicit end if supplied |
| End date/time | No | — | End time; must follow start |
| Physical / online | Yes, physical default | City or Online | Venue/map or confirmed-only joining details |
| City and venue | For physical events | City | Key details and venue with View on map |
| Online joining URL | No | Never | Only the active organiser or personally confirmed attendee; cancelled events revoke attendee access |
| What happens | Yes | — | About: purpose, expectations and intended audience |
| Audience crafts | No | — | Who this is for; informational, never eligibility gates |
| Maximum attendees | No | Full when reached | Host confirmed count and remaining places; attendee total capacity, without scarcity promotions |
| More information URL | No | — | Secondary information link; never Register or a second attendance CTA |
| Existing active identity | Automatic | Organiser name | Hosted by card, profile navigation, verification and Follow |
| Associated project | From project entry | Relevant artwork | Project association retained in the event record |
| Attendance method | Fixed | Free · Places by request | Request to attend; no redundant method field |
| Price | Fixed free | Free | Free; no price/payment inputs |

Categories: Screening or premiere; Workshop or masterclass; Meetup or networking; Panel or talk; Festival or market; Exhibition; Other. Audition/casting wording is caught during creation and offers **Create a Role** through the existing project/role picker. Generic Event Detail carries no role application/audition warning.

## Attendance and privacy

A request always belongs to the signed-in **person**, even when they currently act for a house. It collects a valid email (account email prefilled when known), with explicit notice that this event organiser receives it, and an optional note of up to 300 characters. The request email is separate from account email and never becomes public profile information.

Only the exact active organiser can review requests: the personal owner acting as self, or an authorised member acting for the hosting house. Membership alone does not silently switch identity. Other members get an explicit Switch to organiser action. Review shows photo, name, craft/city, note and request contact. **Accept** is the only selection action; there is no Decline workflow.

| Attendee state | Screen | Transition |
| --- | --- | --- |
| Not requested | Request to attend | Email/note → pending |
| Pending | Request sent | Organiser accepts, attendee withdraws, or requests close/start |
| Confirmed | Place confirmed | Joining details available; can give up place before start |
| Withdrawn | Withdrawal acknowledgement | Can request again while requests remain open, using the same record |
| Not accommodated | Requests closed; “We couldn’t offer you a place at this event.” | Final state for that event |
| Cancelled event | Event cancelled | No request or joining action |

**Save** is an independent private bookmark. It does not submit a request, imply attendance, reveal contact, notify the organiser or generate attendance reminders. Duplicate pending/confirmed requests are refused.

## Lifecycle and capacity

Composer input remains an unpublished local draft until Publish event; no saved-draft capability is claimed. Published events are Upcoming or Today, with derived Full/Ended and explicit Closed/Cancelled states. With no explicit end, the event remains visible until the end of its calendar day in India.

Requests and acceptance stop at event start. Optional capacity limits **confirmed places**, not pending requests. Full pauses new requests and acceptance but keeps pending people in case someone gives up a place. Withdrawal releases a confirmed place. Closing requests or reaching start resolves remaining pending requests exactly once, without revoking existing confirmed places. Cancel notifies pending and confirmed attendees and prevents further attendance actions. Capacity cannot be edited below confirmed attendance; material edits retain confirmed places and notify participants.

## Notifications

| Trigger | Attendee | Organiser |
| --- | --- | --- |
| Request submitted | Inline/sheet Request sent confirmation | New request notification |
| Acceptance | Place confirmed notification and state | Updated confirmed/remaining counts |
| Capacity reached | Existing state; pending requests preserved | Capacity reached notification |
| Close or event start | Pending people receive couldn't-accommodate notice | Requests resolved in management |
| Material time/location/joining change | Pending and confirmed participants receive change notice | Editor confirmation |
| Cancellation | Pending and confirmed participants receive cancellation notice | Cancellation confirmation |
| Upcoming event | One derived reminder within 48 hours for confirmed places | — |

Notifications are actual shared Ana notification records linked to Event Detail. Email addresses are collected for organiser coordination; **no automated email delivery is implemented or claimed**. Changes/cancellation have one actual notification, rather than an additional duplicate derived reminder.

## Surfaces and implementation

Discover, Home, house/profile/project sections and Saved use the same event card. Detail, composer, request sheet and organiser request sheet use the shared identity model in both Current and District experiences. Existing feature flag behavior remains: Events default on; `?events=off` hides them; `/test` retains its existing comparison configuration.

`src/domain/events.ts` validates creation. `src/domain/eventAttendance.ts` owns request uniqueness, permissions, capacity, lifecycle and joining-link redaction; unit tests exercise those boundaries. Store actions repeat permission/validation checks before mutations. Contact records live in `src/state/eventAttendance.ts`; account-email defaults there are fictitious demo addresses, not public contact data. Event report reasons/escalation remain available through the existing Report flow.

This is a session-backed prototype: events, requests and new notifications do not survive a reload. Client-side permission/redaction checks demonstrate the intended flow; a production implementation requires authenticated server access control, durable request storage, atomic seat allocation, a background lifecycle worker and an email provider before claiming multi-device privacy or email delivery.

## Future paid architecture — inactive

The type model and `EVENT_CAPABILITIES.paidEvents` retain future pricing/review states, and domain tests still cover that future policy. The switch stays false. Future work may add price, external ticket providers/payment, eligibility and review/approval, once operational ownership exists. Current V1 screens expose none of those capabilities or a paid moderation team.

## Home attendance example

Home features **Camera crew evening** by Konark Pictures with 20 places and the caption **Private attendance requests**. The example stays in District's event shelf, separate from Spotlight, and also appears in Current Home. Kiran starts with no attendance request and can try the email/note flow. Konark starts with two clearly fictitious pending requests from Sameer and Sana; their event contact addresses use example.com and appear only in organiser review. Hosts can accept these requests or a new request submitted during the session.
