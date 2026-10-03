import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFeatures } from './features';

const q = (s: string) => new URLSearchParams(s);
test('defaults: current Home, Events off', () => assert.deepEqual(parseFeatures(q(''), null), { home: 'current', events: false }));
test('?home=next turns on the new Home only', () => assert.deepEqual(parseFeatures(q('home=next'), null), { home: 'next', events: false }));
test('?events=on turns on Events only', () => assert.deepEqual(parseFeatures(q('events=on'), null), { home: 'current', events: true }));
test('?next turns on both', () => assert.deepEqual(parseFeatures(q('next'), null), { home: 'next', events: true }));
test('stored choice is kept without a query', () => assert.deepEqual(parseFeatures(q(''), { home: 'next', events: true }), { home: 'next', events: true }));
test('query overrides storage', () => assert.deepEqual(parseFeatures(q('home=current&events=off'), { home: 'next', events: true }), { home: 'current', events: false }));
test('junk is ignored', () => assert.deepEqual(parseFeatures(q('home=banana&events=maybe'), null), { home: 'current', events: false }));
