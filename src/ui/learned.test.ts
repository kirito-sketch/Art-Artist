import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasLearned, markLearned, resetLearned } from './learned';

test('nothing is learned at first', () => {
  resetLearned();
  assert.equal(hasLearned('kiran', 'interest'), false);
});
test('a lesson is learned once, per account', () => {
  resetLearned();
  markLearned('kiran', 'interest');
  markLearned('kiran', 'interest');
  assert.equal(hasLearned('kiran', 'interest'), true);
  assert.equal(hasLearned('kiran', 'credits'), false);
  assert.equal(hasLearned('tara', 'interest'), false);
});
test('"Later" is kept per step', () => {
  resetLearned();
  markLearned('kiran', 'later:portfolio');
  assert.equal(hasLearned('kiran', 'later:portfolio'), true);
  assert.equal(hasLearned('kiran', 'later:availability'), false);
});
