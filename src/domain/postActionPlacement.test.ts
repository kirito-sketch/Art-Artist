import { test } from 'node:test';
import assert from 'node:assert/strict';
import { postActionPlacement } from './postActionPlacement';
import type { Media } from '../data/types';
const media: Media = { id: 'm', kind: 'image', src: '/photo.jpg', width: 400, height: 400 };
test('lower-right focal subjects raise the pill; upper and left subjects retain the usual corner', () => {
  const frame = { width: 360, height: 360 };
  assert.equal(postActionPlacement({ ...media, focal: { x: 85, y: 85 } }, frame, false).bottom, 148);
  assert.equal(postActionPlacement({ ...media, focal: { x: 85, y: 20 } }, frame, false).bottom, 12);
  assert.equal(postActionPlacement({ ...media, focal: { x: 10, y: 85 } }, frame, false).bottom, 12);
});
test('video always reserves native control space, including after a focal adjustment', () => {
  const frame = { width: 320, height: 240 };
  assert.equal(postActionPlacement(media, frame, true).bottom, 80);
  assert.ok(postActionPlacement({ ...media, focal: { x: 90, y: 55 } }, frame, true).bottom >= 80);
});
test('artwork without a declared subject reserves more lower-edge space; invalid focal values stay finite', () => {
  const frame = { width: 360, height: 480 };
  assert.equal(postActionPlacement({ ...media, contentType: 'artwork' }, frame, false).bottom, 80);
  assert.ok(Number.isFinite(postActionPlacement({ ...media, focal: { x: NaN, y: Infinity } }, frame, false).bottom));
});

test('short video with a right-side subject can move the shared pill to the opposite corner', () => {
  assert.deepEqual(postActionPlacement({ ...media, focal: { x: 90, y: 30 } }, { width: 300, height: 197 }, true), { bottom: 80, side: 'left' });
});
