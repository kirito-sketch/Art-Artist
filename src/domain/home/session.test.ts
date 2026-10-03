import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getComposition, memoryKV, type HomeInput } from './session';
import { NOW, c } from './fixtures';

const input = (n: number, personal: HomeInput['personal'] = null): HomeInput => ({
  candidates: [c({ type: 'people', objectId: `p${n}` }), c({ type: 'house', objectId: `h${n}` }), c({ type: 'post', objectId: `w${n}`, significance: 'high', leadable: true })],
  personal,
  coldStart: [],
});

test('stable within a session even if the inputs change', () => {
  const kv = memoryKV();
  const a = getComposition(() => input(1), { now: NOW, sessionKey: 's1', kv });
  const b = getComposition(() => input(2), { now: NOW + 60_000, sessionKey: 's1', kv });
  assert.deepEqual(b.middle.map((x) => x.id), a.middle.map((x) => x.id));
  assert.equal(b.lead?.id, a.lead?.id);
});
test('a new session (fresh launch or refresh) recomposes', () => {
  const kv = memoryKV();
  const a = getComposition(() => input(1), { now: NOW, sessionKey: 's1', kv });
  const b = getComposition(() => input(2), { now: NOW + 60_000, sessionKey: 's2', kv });
  assert.notDeepEqual(b.middle.map((x) => x.id), a.middle.map((x) => x.id));
});
test('urgent personal news enters an already composed Home without moving anything else', () => {
  const kv = memoryKV();
  const a = getComposition(() => input(1), { now: NOW, sessionKey: 's1', kv });
  const news = { id: 'n1', text: 'Saffron Reel Studios added you to Kaaval as Director of Photography.', actorId: 'saffron', at: NOW + 1000, urgent: true };
  const b = getComposition(() => input(2, news), { now: NOW + 2000, sessionKey: 's1', kv });
  assert.equal(b.personal?.id, 'n1');
  assert.deepEqual(b.middle.map((x) => x.id), a.middle.map((x) => x.id));
});
test('non-urgent news waits for the next session', () => {
  const kv = memoryKV();
  getComposition(() => input(1), { now: NOW, sessionKey: 's1', kv });
  const news = { id: 'n2', text: 'Konark Pictures started a new project.', actorId: 'konark', at: NOW + 1000, urgent: false };
  assert.equal(getComposition(() => input(1, news), { now: NOW + 2000, sessionKey: 's1', kv }).personal, null);
  assert.equal(getComposition(() => input(1, news), { now: NOW + 3000, sessionKey: 's2', kv }).personal?.id, 'n2');
});
test('what was shown is not repeated next session, unless the page would fall below the minimum', () => {
  const kv = memoryKV();
  const a = getComposition(() => input(1), { now: NOW, sessionKey: 's1', kv });
  const both = (): HomeInput => ({ ...input(1), candidates: [...input(1).candidates.map((x, i) => ({ ...x, id: a.middle[i]?.id ?? x.id, objectId: a.middle[i]?.objectId ?? x.objectId })), ...input(3).candidates] });
  const b = getComposition(both, { now: NOW + 864e5, sessionKey: 's2', kv });
  const shown = new Set(a.middle.map((x) => x.id));
  assert.ok(b.middle.every((x) => !shown.has(x.id)), 'repeated an unchanged item');
});
