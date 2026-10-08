import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { Media } from '../data/types';
import { coversGrid, selectedWorkBento, SELECTED_WORK_MAX } from './selectedWork';

const m = (ratio: number, i: number) => ({ id: `m-${i}`, kind: 'image', src: `s-${i}.jpg`, width: ratio * 1000, height: 1000 }) as Media;
const shapes = [16 / 9, 4 / 5, 1, 2 / 3, 3 / 2];

test('every count from 0 to 12 fills its grid exactly once, in order, in at most two rows', () => {
  for (const lead of shapes)
    for (let n = 0; n <= 12; n++) {
      const media = Array.from({ length: n }, (_, i) => m(i === 0 ? lead : shapes[(i + 1) % shapes.length], i));
      const b = selectedWorkBento(media);
      const shown = Math.min(n, SELECTED_WORK_MAX);
      assert.equal(b.tiles.length, shown);
      assert.deepEqual(b.tiles.map((x) => x.index), Array.from({ length: shown }, (_, i) => i));
      assert.ok(b.rows <= 2);
      assert.equal(b.more, Math.max(0, n - SELECTED_WORK_MAX));
      if (n) assert.ok(coversGrid(b), `holes at n=${n}, lead=${lead}`);
      assert.deepEqual(selectedWorkBento(media), b);
    }
});

test('a portrait first piece leads with a tall tile; a landscape one with a wide or large tile', () => {
  for (const n of [3, 4, 5]) {
    const tall = selectedWorkBento(Array.from({ length: n }, (_, i) => m(i ? 16 / 9 : 4 / 5, i))).tiles[0];
    assert.deepEqual([tall.colSpan, tall.rowSpan], [1, 2]);
    const wide = selectedWorkBento(Array.from({ length: n }, (_, i) => m(16 / 9, i))).tiles[0];
    assert.equal(wide.colSpan, 2);
  }
});

test('one and two pieces stay a single row', () => {
  assert.equal(selectedWorkBento([m(16 / 9, 0)]).cellRatio, 16 / 9);
  assert.equal(selectedWorkBento([m(16 / 9, 0), m(16 / 9, 1)]).cellRatio, 4 / 3);
  assert.equal(selectedWorkBento([m(4 / 5, 0), m(16 / 9, 1)]).cellRatio, 1);
});
