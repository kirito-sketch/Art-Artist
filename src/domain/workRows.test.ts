import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Media } from '../data/types';
import { workRows } from './workRows';

const m = (w: number, h: number): Media => ({ id: `${w}x${h}`, kind: 'image', src: 'x.jpg', width: w, height: h });

test('landscape work gets its own full row at its natural shape', () => {
  assert.deepEqual(workRows([m(2200, 1000), m(1600, 900)]), [{ items: [0], ratio: 2.2 }, { items: [1], ratio: 1600 / 900 }]);
});
test('consecutive portraits share a row; order never changes', () => {
  const rows = workRows([m(800, 1000), m(800, 1000), m(2000, 1000), m(800, 1000)]);
  assert.deepEqual(rows.map((r) => r.items), [[0, 1], [2], [3]]);
  assert.equal(rows[0].ratio, .8);
});
test('a lone portrait is bounded to 4:5 and a very wide frame to 2.39:1', () => {
  assert.equal(workRows([m(500, 1000)])[0].ratio, .8);
  assert.equal(workRows([m(3000, 1000)])[0].ratio, 2.39);
});
test('every item appears exactly once', () => {
  const list = [m(800, 1000), m(2000, 1000), m(800, 1000), m(1000, 1000), m(800, 1000)];
  assert.deepEqual(workRows(list).flatMap((r) => r.items), [0, 1, 2, 3, 4]);
});
