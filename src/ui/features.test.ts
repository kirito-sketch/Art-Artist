import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignHomeArm, parseFeatures } from './features';

const q = (s: string) => new URLSearchParams(s);
test('legacy alias remains an explicit comparison override', () => assert.equal(parseFeatures(q('home=legacy'), null).home, 'current'));
test('defaults: District Home, Events on', () => assert.deepEqual(parseFeatures(q(''), null), { home: 'district', events: true }));
test('?home=next turns on the new Home', () => assert.deepEqual(parseFeatures(q('home=next'), null), { home: 'next', events: true }));
test('?events=off hides Events', () => assert.deepEqual(parseFeatures(q('events=off'), null), { home: 'district', events: false }));
test('a stored off is kept', () => assert.deepEqual(parseFeatures(q(''), { home: 'district', events: false }), { home: 'district', events: false }));
test('?events=on turns on Events only', () => assert.deepEqual(parseFeatures(q('events=on'), null), { home: 'district', events: true }));
test('?next turns on both', () => assert.deepEqual(parseFeatures(q('next'), null), { home: 'next', events: true }));
test('stored Home choice never overrides product default', () => assert.deepEqual(parseFeatures(q(''), { home: 'next', events: true }), { home: 'district', events: true }));
test('query overrides storage', () => assert.deepEqual(parseFeatures(q('home=current&events=off'), { home: 'next', events: true }), { home: 'current', events: false }));
test('junk is ignored', () => assert.deepEqual(parseFeatures(q('home=banana&events=maybe'), null), { home: 'district', events: true }));

test('research always uses product default unless URL explicitly pins a debug arm', () => {
  for (const study of ['aa-v30', 'aa-individual-short-v1']) {
    assert.equal(assignHomeArm(study, null, () => 0.1), 'district');
    assert.equal(assignHomeArm(study, null, () => 0.9), 'district');
    assert.equal(assignHomeArm(study, 'current'), 'current');
    assert.equal(assignHomeArm(study, 'district'), 'district');
  }
});
