import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keysOf, pruneSeen, withoutSeen } from './seen';
import { NOW, c } from './fixtures';

test('an item shown in an earlier session is not shown again', () => {
  const x = c({});
  assert.deepEqual(withoutSeen([x], { [`${x.id}@1`]: NOW - 864e5 }), []);
});
test('it returns once something material changed (new version)', () => {
  const x = c({ version: '2' });
  assert.equal(withoutSeen([x], { [`${x.id}@1`]: NOW - 864e5 }).length, 1);
});
test('nothing seen hides nothing', () => assert.equal(withoutSeen([c({}), c({})], {}).length, 2));
test('keysOf covers the lead and the middle', () => {
  const lead = c({});
  const m = c({});
  assert.deepEqual(keysOf({ lead, personal: null, middle: [m], composedAt: NOW }).sort(), [`${lead.id}@1`, `${m.id}@1`].sort());
});
test('seen keys expire after three days and the list stays small', () => {
  const seen = { a: NOW - 4 * 864e5, b: NOW - 864e5 };
  assert.deepEqual(Object.keys(pruneSeen(seen, NOW)), ['b']);
});
