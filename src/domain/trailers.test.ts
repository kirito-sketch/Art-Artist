import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { Trailer } from '../state/world';
import { orderVersions, trailerFileError, trailerGate, trailerMetadataError } from './trailers';

const t = (o: Partial<Trailer> = {}): Trailer => ({ id: 'x', kind: 'trailer', language: 'Telugu', url: 'blob:x', status: 'published', ...o });

test('D7: a new project needs a published trailer to be public at post-production or released', () => {
  for (const stage of ['Post-production', 'Released'] as const) {
    assert.ok(trailerGate({ stage, shared: false, trailerRule: true }, { shared: true }));
    assert.ok(trailerGate({ stage, shared: false, trailerRule: true, trailers: [t({ status: 'draft' })] }, { shared: true }), 'a draft does not count');
    assert.equal(trailerGate({ stage, shared: false, trailerRule: true, trailers: [t()] }, { shared: true }), null);
  }
});
test('D7: drafts, early stages and existing projects are exempt', () => {
  for (const stage of ['Development', 'Pre-production', 'Shooting'] as const) assert.equal(trailerGate({ stage, shared: false, trailerRule: true }, { shared: true }), null);
  assert.equal(trailerGate({ stage: 'Released', shared: false, trailerRule: true }), null, 'not being shared');
  assert.equal(trailerGate({ stage: 'Released', shared: true }), null, 'seeded projects keep their fallback');
  assert.ok(trailerGate({ stage: 'Shooting', shared: true, trailerRule: true }, { stage: 'Post-production' }), 'moving a public project on needs one too');
});
test('versions: the project languages first, trailers before teasers', () => {
  const list = [t({ id: 'a', language: 'Hindi', kind: 'teaser' }), t({ id: 'b', language: 'Tamil' }), t({ id: 'c', language: 'Hindi' })];
  assert.deepEqual(orderVersions(list, ['Tamil', 'Hindi']).map((x) => x.id), ['b', 'c', 'a']);
});
test('upload limits', () => {
  assert.equal(trailerFileError({ name: 'a.mp4', type: 'video/mp4', size: 10 }), null);
  assert.ok(trailerFileError({ name: 'a.gif', type: 'image/gif', size: 10 }));
  assert.ok(trailerFileError({ name: 'a.mp4', type: 'video/mp4', size: 0 }));
  assert.ok(trailerFileError({ name: 'a.mp4', type: 'video/mp4', size: 600 * 1024 * 1024 }));
  assert.equal(trailerMetadataError(120, 1920, 1080), null);
  assert.ok(trailerMetadataError(400, 1920, 1080));
  assert.ok(trailerMetadataError(60, 3840, 2160));
  assert.ok(trailerMetadataError(NaN, 0, 0));
});
