import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { IndustryEvent } from '../data/types';
import { eventScore, eventsTitle, rankHomeEvents, type RankContext } from './eventRank';

const NOW = Date.UTC(2026, 9, 6, 6);
const D = 864e5;
const ev = (p: Partial<IndustryEvent> = {}): IndustryEvent => ({ id: 'e', type: 'meetup', title: 'T', hostId: 'h', city: 'Hyderabad', venue: 'V', start: NOW + 3 * D, price: { kind: 'free' }, summary: '', status: 'scheduled', ...p });
const ctx = (p: Partial<RankContext> = {}): RankContext => ({ now: NOW, city: 'Hyderabad', craft: 'cinematographer', creditedFilms: [], network: [], followedHouses: [], interested: [], blocked: [], seen: {}, ...p });

test('city, craft and the network raise an event; popularity barely does', () => {
  const base = eventScore(ev({ city: 'Mumbai' }), ctx());
  assert.ok(eventScore(ev(), ctx()) > base);
  assert.ok(eventScore(ev({ audience: ['cinematographer'] }), ctx()) > eventScore(ev({ audience: ['actor'] }), ctx()));
  assert.ok(eventScore(ev({ audience: ['camera'] }), ctx()) > eventScore(ev({ audience: ['actor'] }), ctx()), 'related craft counts');
  assert.ok(eventScore(ev({ hostId: 'meera' }), ctx({ network: ['meera'] })) > eventScore(ev(), ctx()));
  assert.ok(eventScore(ev({ interestedCount: 5000 }), ctx()) - eventScore(ev(), ctx()) <= 1, 'popularity is capped');
});

test('a screening of your own film always leads', () => {
  const list = rankHomeEvents([ev({ id: 'a', audience: ['cinematographer'] }), ev({ id: 'own', hostId: 'x', city: 'Mumbai', type: 'screening', projectId: 'kaaval' })], ctx({ creditedFilms: ['kaaval'] }));
  assert.equal(list[0].id, 'own');
});

test('one event per organiser and at most two of a type', () => {
  const list = rankHomeEvents(
    [ev({ id: 'a', hostId: 'big' }), ev({ id: 'b', hostId: 'big' }), ev({ id: 'c', hostId: 'big' }), ev({ id: 'd', hostId: 's1' }), ev({ id: 'e', hostId: 's2' }), ev({ id: 'f', hostId: 's3', type: 'workshop', city: 'Mumbai' })],
    ctx(),
  );
  assert.equal(list.length, 3);
  assert.equal(new Set(list.map((x) => x.hostId)).size, 3);
  assert.ok(list.filter((x) => x.type === 'meetup').length <= 2);
});

test('the pool: soon, scheduled, not blocked, not already Interested, not ignored three times', () => {
  const list = rankHomeEvents(
    [ev({ id: 'far', start: NOW + 30 * D }), ev({ id: 'gone', status: 'cancelled', hostId: 'h2' }), ev({ id: 'blk', hostId: 'bad' }), ev({ id: 'int', hostId: 'h3' }), ev({ id: 'ign', hostId: 'h4' }), ev({ id: 'ok', hostId: 'h5' })],
    ctx({ blocked: ['bad'], interested: ['int'], seen: { ign: { shown: 3 } } }),
  );
  assert.deepEqual(list.map((x) => x.id), ['ok']);
});

test('an ignored event comes back once it has been opened', () => {
  assert.equal(rankHomeEvents([ev({ id: 'x' })], ctx({ seen: { x: { shown: 5, opened: true } } })).length, 1);
});

test('near-ties go to the event this person has seen less', () => {
  const list = rankHomeEvents([ev({ id: 'old', hostId: 'a' }), ev({ id: 'fresh', hostId: 'b' })], ctx({ seen: { old: { shown: 2 } } }));
  assert.equal(list[0].id, 'fresh');
});

test('the title follows the large event', () => {
  assert.equal(eventsTitle([ev()], 'Hyderabad'), 'Events near you');
  assert.equal(eventsTitle([ev({ city: 'Mumbai' })], 'Hyderabad'), 'Events coming up');
});
