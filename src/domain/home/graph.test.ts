import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as seed from '../../data/seed';
import { creditedOn, reasonForPerson, sharedProject, workedWith } from './graph';

test('Kiran has worked with Meera (Monsoon Letters) and Rhea and Sameer (Kaaval)', () => {
  const w = workedWith('kiran');
  for (const id of ['meera', 'rhea', 'sameer']) assert.ok(w.has(id), id);
  assert.ok(!w.has('kiran'));
});
test('people credited on a project', () => assert.ok(creditedOn('kaaval').includes('rhea')));
test('shared project names the film', () => assert.equal(sharedProject('kiran', 'meera')?.title, 'Monsoon Letters'));
test('reason prefers a direct working relationship', () => assert.equal(reasonForPerson('kiran', 'meera'), 'Worked with you on Monsoon Letters'));
test('then collaborators of collaborators', () => {
  const second = seed.people.map((p) => reasonForPerson('meera', p.id)).filter((r) => r && !r.startsWith('Worked with you'));
  assert.ok(second.length > 0 && second.every((r) => /^Worked with \w+ on |people you've worked with/.test(r!)), second.join(' | '));
});
test('no reason when there is no relationship', () => assert.equal(reasonForPerson('kiran', 'omar'), null));
test('never a reason about yourself', () => assert.equal(reasonForPerson('kiran', 'kiran'), null));
