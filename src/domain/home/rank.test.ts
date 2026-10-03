import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rank } from './rank';
import { NOW, c } from './fixtures';

test('relationship outranks significance', () => {
  const a = c({ relationship: 0.9, significance: 'medium' });
  const b = c({ relationship: 0.2, significance: 'high' });
  assert.deepEqual(rank([b, a]).map((x) => x.id), [a.id, b.id]);
});
test('with equal relationship, high beats medium', () => {
  const a = c({ significance: 'medium' });
  const b = c({ significance: 'high' });
  assert.deepEqual(rank([a, b]).map((x) => x.id), [b.id, a.id]);
});
test('then professional, then place, then the newer change', () => {
  const pro = c({ professional: 0.8 });
  const place = c({ place: 0.8 });
  const fresh = c({ at: NOW - 1000 });
  const old = c({ at: NOW - 5 * 864e5 });
  assert.deepEqual(rank([old, fresh, place, pro]).map((x) => x.id), [pro.id, place.id, fresh.id, old.id]);
});
test('tiny differences inside a 0.05 band do not decide; the next key does', () => {
  const a = c({ relationship: 0.51, significance: 'medium' });
  const b = c({ relationship: 0.5, significance: 'high' });
  assert.equal(rank([a, b])[0].id, b.id);
});
test('stable for identical candidates', () => {
  const x = c({ objectId: 'b', at: NOW });
  const y = c({ objectId: 'a', at: NOW });
  assert.deepEqual(rank([x, y]).map((z) => z.id), [y.id, x.id]);
});
