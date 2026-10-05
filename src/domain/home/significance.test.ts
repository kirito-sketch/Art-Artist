import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canLead, eligible } from './significance';
import { NOW, c } from './fixtures';

test('low-significance activity never reaches Home', () => assert.deepEqual(eligible([c({ significance: 'low' })], NOW), []));
test('older than seven days is out of the window', () => assert.deepEqual(eligible([c({ at: NOW - 8 * 864e5 })], NOW), []));
test('below the quality bar is never shown (no padding)', () => assert.deepEqual(eligible([c({ quality: 0.3 })], NOW), []));
test('medium and high are kept', () => assert.equal(eligible([c({}), c({ significance: 'high' })], NOW).length, 2));
test('only high, leadable items can lead', () => {
  assert.equal(canLead(c({ significance: 'medium', leadable: true })), false);
  assert.equal(canLead(c({ significance: 'high', leadable: false })), false);
  assert.equal(canLead(c({ significance: 'high', leadable: true })), true);
});
test('a role can never lead, even if marked leadable by mistake', () => assert.equal(canLead(c({ type: 'opportunity', significance: 'high', leadable: true })), false));
test('an event is never eligible for Home, however significant', () => assert.deepEqual(eligible([c({ type: 'event', significance: 'high', leadable: true })], NOW), []));
test('an event can never lead', () => assert.equal(canLead(c({ type: 'event', significance: 'high', leadable: true })), false));
