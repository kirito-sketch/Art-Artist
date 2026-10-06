import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { needsAvailability, toggleOnboardingIntent } from './onboardingIntents';

test('goals can be combined and deselected, including the final goal', () => {
  const two = toggleOnboardingIntent(['work'], 'network');
  assert.deepEqual(two, ['work', 'network']);
  assert.deepEqual(toggleOnboardingIntent(two, 'work'), ['network']);
  assert.deepEqual(toggleOnboardingIntent(['network'], 'network'), []);
});

test('a fourth goal does not replace a selected goal', () => {
  assert.deepEqual(toggleOnboardingIntent(['work', 'hire', 'network'], 'collaborate'), ['work', 'hire', 'network']);
  assert.deepEqual(toggleOnboardingIntent(['work', 'hire'], 'collaborate'), ['work', 'hire', 'collaborate']);
});

test('exploring is exclusive in both directions, including at the limit', () => {
  assert.deepEqual(toggleOnboardingIntent(['work', 'hire', 'network'], 'explore'), ['explore']);
  assert.deepEqual(toggleOnboardingIntent(['explore'], 'hire'), ['hire']);
});

test('availability is asked when any goal involves joining work', () => {
  assert.equal(needsAvailability(['hire', 'network', 'work']), true);
  assert.equal(needsAvailability(['network', 'collaborate']), true);
  assert.equal(needsAvailability(['hire', 'network']), false);
  assert.equal(needsAvailability(['explore']), false);
  assert.equal(needsAvailability([]), false);
});
