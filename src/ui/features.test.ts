import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignHomeArm, parseFeatures } from './features';

const q = (s: string) => new URLSearchParams(s);
test('defaults: the New (District) Home, Events on', () => assert.deepEqual(parseFeatures(q(''), null), { home: 'district', events: true }));
test('?home=legacy and ?home=current open the Legacy Home', () => {
  assert.equal(parseFeatures(q('home=legacy'), null).home, 'current');
  assert.equal(parseFeatures(q('home=current'), null).home, 'current');
});
test('?home=next opens the earlier experiment', () => assert.deepEqual(parseFeatures(q('home=next'), null), { home: 'next', events: true }));
test('?home=district opens the New Home', () => assert.equal(parseFeatures(q('home=district'), null).home, 'district'));
test('?events=off hides Events', () => assert.deepEqual(parseFeatures(q('events=off'), null), { home: 'district', events: false }));
test('a stored off is kept', () => assert.deepEqual(parseFeatures(q(''), { events: false }), { home: 'district', events: false }));
test('?events=on turns on Events only', () => assert.deepEqual(parseFeatures(q('events=on'), null), { home: 'district', events: true }));
test('?next turns on both', () => assert.deepEqual(parseFeatures(q('next'), null), { home: 'next', events: true }));
test('a Home remembered by an earlier debug or Compare visit is never used', () => {
  for (const home of ['current', 'next'] as const) assert.equal(parseFeatures(q(''), { home, events: true }).home, 'district');
});
test('query overrides storage for Events, and applies to Home for this load only', () => assert.deepEqual(parseFeatures(q('home=current&events=off'), { events: true }), { home: 'current', events: false }));
test('junk is ignored', () => assert.deepEqual(parseFeatures(q('home=banana&events=maybe'), null), { home: 'district', events: true }));

test('home arm: old studies always current, comparison study splits and can be pinned', () => {
  assert.equal(assignHomeArm('aa-v30', null, () => 0.1), 'current');
  assert.equal(assignHomeArm('aa-v30', 'next'), 'current');
  assert.equal(assignHomeArm('aa-individual-short-v1', null, () => 0.1), 'next');
  assert.equal(assignHomeArm('aa-individual-short-v1', null, () => 0.9), 'current');
  assert.equal(assignHomeArm('aa-individual-short-v1', 'current', () => 0.1), 'current');
  let next = 0;
  for (let i = 0; i < 1000; i++) if (assignHomeArm('aa-individual-short-v1', null, () => i / 1000) === 'next') next++;
  assert.equal(next, 500);
});
