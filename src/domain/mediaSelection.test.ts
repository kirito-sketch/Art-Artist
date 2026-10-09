import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { Media } from '../data/types';
import { addMedia, addMessage, isSessionMedia, MEDIA_LIMIT, moveBy, moveMedia, portfolioSplit, removeMedia, selectionStatus } from './mediaSelection';

const img = (i: number, src = `s-${i}.jpg`) => ({ id: `m${i}`, kind: 'image', src }) as Media;
const vid = (i: number) => ({ id: `v${i}`, kind: 'video', src: `blob:v${i}` }) as Media;
const ids = (ms: Media[]) => ms.map((m) => m.id);

test('adds in order after the current items, ignoring duplicates', () => {
  const r = addMedia([img(1)], [img(2), img(1), img(3), img(2)]);
  assert.deepEqual(ids(r.selection), ['m1', 'm2', 'm3']);
  assert.equal(r.overLimit, 0);
});

test('stops at the limit and reports how many were left out', () => {
  const start = Array.from({ length: MEDIA_LIMIT - 1 }, (_, i) => img(i));
  const r = addMedia(start, [img(100), img(101), img(102)]);
  assert.equal(r.selection.length, MEDIA_LIMIT);
  assert.equal(r.overLimit, 2);
  assert.match(addMessage(r) ?? '', /limit: 10/);
});

test('a single-item surface replaces its item', () => {
  const r = addMedia([img(1)], [img(2), img(3)], { limit: 1 });
  assert.deepEqual(ids(r.selection), ['m2']);
  assert.equal(r.overLimit, 1);
});

test('wrong kinds are refused with a reason', () => {
  const r = addMedia([], [img(1), vid(1)], { kind: 'image' });
  assert.deepEqual(ids(r.selection), ['m1']);
  assert.equal(r.wrongKind, 1);
  assert.match(addMessage(r, { kind: 'image' }) ?? '', /Only photos/);
});

test('remove and move keep everything else in order', () => {
  const s = [img(1), img(2), img(3), img(4)];
  assert.deepEqual(ids(removeMedia(s, 'm2')), ['m1', 'm3', 'm4']);
  assert.deepEqual(ids(moveMedia(s, 'm4', 0)), ['m4', 'm1', 'm2', 'm3']);
  assert.deepEqual(ids(moveMedia(s, 'm1', 99)), ['m2', 'm3', 'm4', 'm1']);
  assert.deepEqual(ids(moveBy(s, 'm1', -1)), ['m1', 'm2', 'm3', 'm4']);
  assert.deepEqual(ids(moveBy(s, 'm2', 1)), ['m1', 'm3', 'm2', 'm4']);
  assert.deepEqual(ids(moveMedia(s, 'missing', 0)), ids(s));
});

test('status, session media and the portfolio split', () => {
  assert.deepEqual(selectionStatus([img(1), img(2)]), { count: 2, limit: 10, full: false, label: '2 of 10' });
  assert.equal(selectionStatus([img(1)], { limit: 1 }).full, true);
  assert.equal(isSessionMedia(vid(1)), true);
  assert.equal(isSessionMedia(img(1, 'data:image/jpeg;base64,x')), true);
  assert.equal(isSessionMedia(img(1, '/images/a.jpg')), false);
  assert.deepEqual(portfolioSplit([img(1), vid(1), img(2)]), { images: [img(1), img(2)], videos: 1 });
});
