import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getComposition, memoryKV } from './session';
import { NOW, c, types } from './fixtures';

test('a new cinematographer with no network still gets three genuine units', () => {
  const r = getComposition(
    () => ({
      candidates: [],
      personal: null,
      coldStart: [
        c({ type: 'projectUpdates', objectId: 'telugu-feature', significance: 'high', leadable: true, place: 1 }),
        c({ type: 'people', objectId: 'local-crew', place: 1 }),
        c({ type: 'post', objectId: 'local-work', place: 1 }),
      ],
    }),
    { now: NOW, sessionKey: 'new', kv: memoryKV() },
  );
  assert.equal(r.lead?.objectId, 'telugu-feature');
  assert.deepEqual(types(r.middle), ['people', 'post']);
});
test('if cold-start sources are empty too, the page is shorter, never filled with weak items', () => {
  const r = getComposition(() => ({ candidates: [], personal: null, coldStart: [c({ type: 'people', quality: 0.2 })] }), { now: NOW, sessionKey: 'x', kv: memoryKV() });
  assert.equal(r.lead, null);
  assert.equal(r.middle.length, 0);
});
