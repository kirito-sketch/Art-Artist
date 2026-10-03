import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { IndustryEvent } from '../data/types';
import { AUDITION_MESSAGE, CHILDREN_MESSAGE, listable, priceLabel, PROMISE_MESSAGE, validateDraft, type EventDraft } from './events';

const NOW = Date.UTC(2026, 9, 3, 9);
const house = { verified: true, kind: 'org' as const };
const person = { verified: true, kind: 'person' as const };
const ev = (p: Partial<IndustryEvent> = {}): IndustryEvent => ({ id: 'e', type: 'meetup', title: 'Camera crew evening', hostId: 'konark', city: 'Hyderabad', venue: 'Konark office', start: NOW + 3 * 864e5, price: { kind: 'free' }, summary: 'Meet the camera team.', status: 'scheduled', ...p });
const draft = (p: Partial<EventDraft> = {}): EventDraft => ({ type: 'meetup', title: 'Camera crew evening', summary: 'Meet the camera team.', city: 'Hyderabad', venue: 'Konark office', start: NOW + 864e5, price: { kind: 'free' }, ...p });

test('a scheduled event from a verified host is listed', () => assert.equal(listable(ev(), house, NOW), true));
test('an unverified host is never listed', () => assert.equal(listable(ev(), { verified: false, kind: 'person' }, NOW), false));
test('past and cancelled events are hidden', () => {
  assert.equal(listable(ev({ start: NOW - 864e5 }), house, NOW), false);
  assert.equal(listable(ev({ status: 'cancelled' }), house, NOW), false);
});
test('events under review are visible to nobody but the host (not listable)', () => assert.equal(listable(ev({ status: 'under_review' }), person, NOW), false));
test('auditions are roles: hidden whether free or paid', () => {
  assert.equal(listable(ev({ title: 'Open auditions for a feature' }), house, NOW), false);
  assert.equal(listable(ev({ title: 'Casting call', price: { kind: 'paid', amount: '₹500' } }), house, NOW), false);
});
test('a reviewed event may mention casting directors... but not auditions it runs', () => assert.equal(listable(ev({ title: 'Talk: how casting calls work', reviewed: true }), house, NOW), true));
test('nothing targeting children is listed', () => assert.equal(listable(ev({ title: 'Acting workshop for kids' }), house, NOW), false));
test('a paid event that promises a role is never listed', () => assert.equal(listable(ev({ summary: 'Get a role in our next film', price: { kind: 'paid', amount: '₹2,000' } }), house, NOW), false));
test('price is always labelled', () => {
  assert.equal(priceLabel(ev()), 'Free');
  assert.equal(priceLabel(ev({ price: { kind: 'paid', amount: '₹1,500' } })), '₹1,500');
});

test('a complete free draft from a verified house goes live', () => assert.deepEqual(validateDraft(draft(), house, NOW), { ok: true, errors: {}, review: 'live' }));
test('a paid draft from an individual waits for review', () => assert.equal(validateDraft(draft({ price: { kind: 'paid', amount: '₹1,500' } }), person, NOW).review, 'under_review'));
test('a paid draft from a verified house goes live', () => assert.equal(validateDraft(draft({ price: { kind: 'paid', amount: '₹500' } }), house, NOW).review, 'live'));
test('unverified hosts are told how to fix it', () => assert.equal(validateDraft(draft(), { verified: false, kind: 'person' }, NOW).errors.host, 'Verify your identity to host events.'));
test('auditions are redirected to roles', () => assert.equal(validateDraft(draft({ title: 'Auditions for lead role' }), house, NOW).errors.title, AUDITION_MESSAGE));
test('children are not an event audience', () => assert.equal(validateDraft(draft({ summary: 'For child actors aged 8 to 12' }), house, NOW).errors.title, CHILDREN_MESSAGE));
test('paid events cannot promise roles', () => assert.equal(validateDraft(draft({ summary: 'Best performers get a role', price: { kind: 'paid', amount: '₹999' } }), house, NOW).errors.summary, PROMISE_MESSAGE));
test('missing fields each get their own message', () => {
  const e = validateDraft({ title: '', summary: '', city: '', venue: '' }, house, NOW).errors;
  for (const k of ['type', 'title', 'summary', 'city', 'venue', 'start', 'price'] as const) assert.ok(e[k], k);
});
test('past dates and bad links are caught', () => {
  const e = validateDraft(draft({ start: NOW - 1000, link: 'tickets.com' }), house, NOW).errors;
  assert.ok(e.start && e.link);
});
test('a paid price needs an amount', () => assert.ok(validateDraft(draft({ price: { kind: 'paid', amount: '' } }), house, NOW).errors.price));
