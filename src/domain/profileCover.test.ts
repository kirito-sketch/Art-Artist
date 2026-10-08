import { test } from 'node:test';
import assert from 'node:assert/strict';
import { profileCoverPosition, resolveProfileCover } from './profileCover';
import type { Media } from '../data/types';
const image: Media = { id: 'frame', kind: 'image', src: '/frame.jpg' };
test('automatic and explicitly chosen portraits use the full featured image', () => {
  const portrait: Media = { id: 'portrait', kind: 'image', src: '/portrait.jpg' };
  assert.equal(resolveProfileCover(undefined, [image], [], undefined, portrait).media, portrait);
  assert.equal(resolveProfileCover({ kind: 'portrait' }, [image], [], undefined, portrait).media, portrait);
  assert.equal(resolveProfileCover({ kind: 'portfolio', mediaId: image.id }, [image], [], undefined, portrait).media, image);
});
test('focal positions preserve a chosen crop and constrain invalid persisted coordinates', () => {
  assert.equal(profileCoverPosition({ kind: 'portrait', focal: { x: 30, y: 20 } }), '30% 20%');
  assert.equal(profileCoverPosition({ kind: 'portrait', focal: { x: -5, y: 110 } }), '0% 100%');
  assert.equal(profileCoverPosition({ kind: 'portrait', focal: { x: NaN, y: Infinity } }), '50% 35%');
});
test('profile cover uses chosen portfolio image without changing work order', () => {
  assert.deepEqual(resolveProfileCover({ kind: 'portfolio', mediaId: 'frame' }, [image], []), { media: image, showreel: false });
});
test('removed or ineligible project cannot leak into cover', () => {
  assert.equal(resolveProfileCover({ kind: 'project', projectId: 'private' }, [], []).media, undefined);
  assert.equal(resolveProfileCover({ kind: 'portfolio', mediaId: 'removed' }, [image], []).media, image);
});
test('native drafts never become public profile covers', () => {
  assert.deepEqual(resolveProfileCover({ kind: 'showreel' }, [], [], { url: 'blob:private', title: 'Draft', cover: image, source: { kind: 'native', status: 'draft' } }), { media: undefined, showreel: false });
});
test('valid showreel hero is a poster with a play affordance', () => {
  assert.deepEqual(resolveProfileCover({ kind: 'showreel' }, [], [], { url: 'https://vimeo.com/123456789', title: 'Reel', cover: image }), { media: image, showreel: true });
});
test('empty profiles receive no portrait or invented professional artwork', () => {
  assert.deepEqual(resolveProfileCover(undefined, [], []), { media: undefined, showreel: false });
});
