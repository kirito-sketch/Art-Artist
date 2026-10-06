import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { IndustryEvent } from '../data/types';
import {
  acceptRequest,
  canManageEvent,
  confirmedCount,
  eventForActor,
  eventState,
  requestPlace,
  requestsForOrganiser,
  requestsOpen,
  resolvePending,
  withdrawRequest,
  type EventRequest,
} from './eventAttendance';
import { validateDraft } from './events';
const now = Date.UTC(2026, 9, 6, 12);
const event = (patch: Partial<IndustryEvent> = {}): IndustryEvent => ({
  id: 'table',
  type: 'meetup',
  hostId: 'house',
  title: 'Table read',
  city: 'Mumbai',
  venue: 'Studio',
  start: now + 864e5,
  status: 'scheduled',
  price: { kind: 'free' },
  summary: 'Two scripts and a discussion.',
  capacity: 1,
  ...patch,
});
const host = { viewerId: 'member', acting: 'house', memberships: ['house'] };
const visitor = { viewerId: 'person', acting: 'self', memberships: [] };
const req = (e: IndustryEvent, rs: EventRequest[], who = 'person') => {
  const r = requestPlace(e, rs, who, `${who}@example.com`, 'Looking forward to the reading', now);
  assert.ok(typeof r !== 'string');
  return r;
};
test('attendance is a unique private request, validates email, and never becomes an immediate confirmation', () => {
  const e = event(),
    rs: EventRequest[] = [];
  assert.equal(typeof requestPlace(e, rs, 'person', 'invalid', '', now), 'string');
  const r = req(e, rs);
  assert.equal(r.status, 'pending');
  assert.equal(confirmedCount(e, rs), 0);
  assert.equal(typeof requestPlace(e, rs, 'person', 'person@example.com', '', now), 'string');
  assert.equal(rs.length, 1);
  assert.equal(typeof requestPlace(e, rs, 'other', 'other@example.com', 'x'.repeat(301), now), 'string');
});
test('organiser identity and membership are required for review and acceptance', () => {
  const e = event(),
    rs: EventRequest[] = [];
  const r = req(e, rs);
  for (const a of [visitor, { ...host, acting: 'self' }, { ...host, memberships: [] }]) {
    assert.equal(canManageEvent(e, a), false);
    assert.deepEqual(requestsForOrganiser(e, rs, a), []);
    assert.equal(typeof acceptRequest(e, rs, r.id, a, now), 'string');
  }
  assert.equal(requestsForOrganiser(e, rs, host)[0].email, 'person@example.com');
  assert.equal(typeof acceptRequest(e, rs, r.id, host, now), 'object');
});
test('full does not reject pending people; withdrawal releases capacity and another request can be accepted', () => {
  const e = event(),
    rs: EventRequest[] = [];
  const one = req(e, rs),
    two = req(e, rs, 'other');
  acceptRequest(e, rs, one.id, host, now);
  assert.equal(eventState(e, rs, now), 'Full');
  assert.equal(requestsOpen(e, rs, now), false);
  assert.deepEqual(resolvePending(e, rs, now), []);
  assert.equal(two.status, 'pending');
  assert.equal(typeof acceptRequest(e, rs, two.id, host, now), 'string');
  assert.equal(withdrawRequest(e, rs, 'person', now), true);
  assert.equal(requestsOpen(e, rs, now), true);
  assert.equal(typeof acceptRequest(e, rs, two.id, host, now), 'object');
  assert.equal(confirmedCount(e, rs), 1);
});
test('closing and start resolve pending requests once, without revoking confirmed places', () => {
  for (const mode of ['closed', 'start']) {
    const e = event({ capacity: undefined }),
      rs: EventRequest[] = [];
    const one = req(e, rs),
      two = req(e, rs, 'other');
    acceptRequest(e, rs, one.id, host, now);
    if (mode === 'closed') e.status = 'closed';
    const clock = mode === 'start' ? e.start : now;
    assert.deepEqual(
      resolvePending(e, rs, clock).map((r) => r.id),
      [two.id],
    );
    assert.deepEqual(resolvePending(e, rs, clock), []);
    assert.equal(one.status, 'confirmed');
    assert.equal(two.status, 'not-accommodated');
    assert.equal(requestsOpen(e, rs, clock), false);
  }
});
test('joining URL is hidden until confirmed, private contact stays in authorised requests, cancelled events revoke attendee joining access', () => {
  const e = event({
      location: 'online',
      joiningUrl: 'https://example.com/private-room',
    }),
    rs: EventRequest[] = [];
  const r = req(e, rs);
  assert.equal(eventForActor(e, rs, visitor).joiningUrl, undefined);
  assert.equal(eventForActor(e, rs, host).joiningUrl, e.joiningUrl);
  acceptRequest(e, rs, r.id, host, now);
  assert.equal(eventForActor(e, rs, visitor).joiningUrl, e.joiningUrl);
  assert.equal(eventForActor(e, rs, { viewerId: 'other', acting: 'self', memberships: [] }).joiningUrl, undefined);
  e.status = 'cancelled';
  assert.equal(eventForActor(e, rs, visitor).joiningUrl, undefined);
  assert.equal(requestsOpen(e, rs, now), false);
});
test('a withdrawn request can be sent again as the same record while requests remain open', () => {
  const e = event(),
    rs: EventRequest[] = [];
  const r = req(e, rs);
  assert.equal(withdrawRequest(e, rs, 'person', now), true);
  assert.equal(req(e, rs).id, r.id);
  assert.equal(rs.length, 1);
  assert.equal(r.status, 'pending');
  assert.equal(withdrawRequest(e, rs, 'person', e.start), false);
});
test('capacity, end time and online schema are validated while event categories remain bounded', () => {
  const hostFacts = { kind: 'org' as const, verified: true };
  const e = event();
  assert.ok(validateDraft({ ...e, capacity: 0 }, hostFacts, now).errors.capacity);
  assert.ok(validateDraft({ ...e, capacity: 1.5 }, hostFacts, now).errors.capacity);
  assert.ok(validateDraft({ ...e, end: e.start - 1 }, hostFacts, now).errors.end);
  assert.equal(
    validateDraft(
      {
        ...e,
        city: '',
        venue: '',
        location: 'online',
        joiningUrl: 'https://example.com/meeting',
      },
      hostFacts,
      now,
    ).ok,
    true,
  );
  assert.ok(validateDraft({ ...e, joiningUrl: 'javascript:alert(1)' }, hostFacts, now).errors.joiningUrl);
});
