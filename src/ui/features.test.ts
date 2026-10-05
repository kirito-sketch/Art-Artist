import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignHomeArm, parseFeatures } from './features';

const q = (s: string) => new URLSearchParams(s);
test('defaults: current Home, Events on', () => assert.deepEqual(parseFeatures(q(''), null), { home: 'current', events: true }));
test('?home=next turns on the new Home', () => assert.deepEqual(parseFeatures(q('home=next'), null), { home: 'next', events: true }));
test('?events=off hides Events', () => assert.deepEqual(parseFeatures(q('events=off'), null), { home: 'current', events: false }));
test('a stored off is kept', () => assert.deepEqual(parseFeatures(q(''), { home: 'current', events: false }), { home: 'current', events: false }));
test('?events=on turns on Events only', () => assert.deepEqual(parseFeatures(q('events=on'), null), { home: 'current', events: true }));
test('?next turns on both', () => assert.deepEqual(parseFeatures(q('next'), null), { home: 'next', events: true }));
test('stored choice is kept without a query', () => assert.deepEqual(parseFeatures(q(''), { home: 'next', events: true }), { home: 'next', events: true }));
test('query overrides storage', () => assert.deepEqual(parseFeatures(q('home=current&events=off'), { home: 'next', events: true }), { home: 'current', events: false }));
test('junk is ignored', () => assert.deepEqual(parseFeatures(q('home=banana&events=maybe'), null), { home: 'current', events: true }));

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
