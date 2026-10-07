import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveProfileCover } from './profileCover';
import type { Media } from '../data/types';
const image: Media = { id: 'frame', kind: 'image', src: '/frame.jpg' };
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
