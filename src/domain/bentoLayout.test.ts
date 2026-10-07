import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { Media } from '../data/types';
import { bentoGroups } from './bentoLayout';

const item = (ratio: number, i = 0) => ({ media: [{ id: `m-${i}`, kind: 'image', src: `source-${i}.jpg`, width: ratio * 1000, height: 1000 } as Media] });
test('Bento partitions every count into contiguous complete rectangles without reordering', () => {
  for (let count = 0; count <= 100; count++) {
    const items = Array.from({ length: count }, (_, i) => item([.8, 16 / 9, 1, 2 / 3][i % 4], i));
    const before = JSON.stringify(items), groups = bentoGroups(items);
    assert.deepEqual(groups.flatMap(g => Array.from({ length: g.count }, (_, i) => g.start + i)), items.map((_, i) => i));
    assert.ok(groups.every(g => g.count >= 1 && g.count <= 4 && g.slots.length === g.count && g.ratio > 0));
    assert.deepEqual(bentoGroups(items), groups);
    assert.equal(JSON.stringify(items), before);
  }
});
test('leftovers have explicit one, two, three and four item layouts', () => {
  assert.equal(bentoGroups([item(1)])[0].pattern, 'single');
  assert.equal(bentoGroups([item(.8), item(.8)])[0].pattern, 'pair');
  assert.equal(bentoGroups([item(1), item(1), item(1)])[0].count, 3);
  assert.equal(bentoGroups(Array.from({ length: 4 }, () => item(1)))[0].pattern, 'quad');
  assert.deepEqual(bentoGroups(Array.from({ length: 7 }, () => item(1))).map(g => g.count), [3, 4]);
  assert.deepEqual(bentoGroups(Array.from({ length: 10 }, () => item(1))).map(g => g.count), [3, 3, 4]);
});
test('declared source ratios select from the four valid patterns without swapping items', () => {
  for (const [ratios, pattern] of [
    [[.8, 1.6, 1.6], 'tall-left'], [[1.6, .8, 1.6], 'tall-right'],
    [[1.8, .9, .9], 'wide-top'], [[.9, .9, 1.8], 'wide-bottom'],
  ] as const) assert.equal(bentoGroups(ratios.map(r => item(r)))[0].pattern, pattern);
  assert.equal(bentoGroups([item(16 / 9), item(16 / 9), item(16 / 9)])[0].pattern, 'wide-top');
});
test('unknown, poster, carousel and video previews reserve geometry before loading', () => {
  const inputs = [{ media: [] }, { media: [{ ...item(2 / 3).media[0], contentType: 'artwork' } as Media] }, { media: [{ ...item(9 / 16).media[0], kind: 'video' } as Media] }, { media: [item(.8).media[0], item(16 / 9).media[0]] }, { media: [{ id: 'unknown', kind: 'image', src: 'missing.jpg' } as Media] }];
  assert.deepEqual(bentoGroups(inputs).map(g => g.count), [3, 2]);
  assert.ok(bentoGroups(inputs).every(g => Number.isFinite(g.ratio)));
});
