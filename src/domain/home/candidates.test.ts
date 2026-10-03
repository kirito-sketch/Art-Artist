import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as seed from '../../data/seed';
import type { Person } from '../../data/types';
import { homeInput, personalNews, updateCandidate, type HomeContext } from './candidates';
import { getComposition, memoryKV } from './session';

const NOW = Date.UTC(2026, 9, 3, 9);
const kiran = seed.people.find((p) => p.id === 'kiran')!;
const ctx = (p: Partial<HomeContext> = {}): HomeContext => ({ me: kiran, intent: 'work', following: ['meera', 'arjun', 'rhea', 'vikram', 'devika', 'sameer', 'ishaan', 'nandini'], loadedAt: NOW, isNew: false, ...p });
const COUNTS = /\d+ (things|credits|interests|messages)|need[s]? your attention|to confirm/i;

test('a crew member you worked with joining is high significance, with a reason', () => {
  const c = updateCandidate(seed.projectUpdates.find((u) => u.id === 'pu1')!, ctx())!;
  assert.equal(c.significance, 'high');
  assert.match(c.reason ?? '', /Meera worked with you on Monsoon Letters/);
});
test('a project entering production is high significance', () => assert.equal(updateCandidate(seed.projectUpdates.find((u) => u.id === 'pu2')!, ctx())!.significance, 'high'));
test('a minor crew change with nobody named is low and never reaches Home', () => assert.equal(updateCandidate(seed.projectUpdates.find((u) => u.id === 'pu8')!, ctx())!.significance, 'low'));
test('personal news reads as news, one item, never a count', () => {
  const n = personalNews(ctx({ pendingCredits: [{ id: 'x', title: 'Kaaval', role: 'Director of Photography', orgId: 'saffron' }, { id: 'y', title: 'Salt', role: 'DoP', orgId: 'konark' }] }))!;
  assert.equal(n.text, 'Saffron Reel Studios added you to Kaaval as Director of Photography.');
  assert.doesNotMatch(n.text, COUNTS);
  assert.equal(n.actionLabel, 'Review');
});
test('no personal news when nothing happened to you', () => assert.equal(personalNews(ctx()), null));
test("Kiran's Home: a lead story, never a role; a varied middle; at most one opportunity, never early", () => {
  const comp = getComposition(() => homeInput(ctx()), { now: NOW, sessionKey: 'k', kv: memoryKV() });
  assert.ok(comp.lead, 'has a lead');
  assert.notEqual(comp.lead!.type, 'opportunity');
  const types = comp.middle.map((x) => x.type);
  assert.ok(types.length >= 4, types.join(','));
  for (let i = 1; i < types.length; i++) assert.notEqual(types[i], types[i - 1]);
  assert.ok(types.filter((t) => t === 'opportunity').length <= 1);
  const oi = types.indexOf('opportunity');
  assert.ok(oi === -1 || oi >= 2);
});
test('no text anywhere on Home carries counts or task summaries', () => {
  const input = homeInput(ctx({ pendingCredits: [{ id: 'x', title: 'Kaaval', role: 'DoP', orgId: 'saffron' }] }));
  const texts = [input.personal?.text ?? '', ...input.candidates.map((c) => `${c.reason ?? ''} ${(c.data?.text as string) ?? ''}`)];
  for (const t of texts) assert.doesNotMatch(t, COUNTS, t);
});
test('a new cinematographer in Hyderabad: at least three genuine units, led by a local production', () => {
  const me: Person = { id: 'you-new', kind: 'person', name: 'Sam Rao', role: 'Cinematographer', craft: 'cinematographer', city: 'Hyderabad', tone: 2 };
  const comp = getComposition(() => homeInput(ctx({ me, following: [], isNew: true })), { now: NOW, sessionKey: 'n', kv: memoryKV() });
  assert.ok(comp.lead, 'has a lead');
  assert.match((comp.lead!.reason ?? '') + (comp.lead!.data?.text ?? ''), /Hyderabad|In |Shooting/);
  assert.ok((comp.lead ? 1 : 0) + comp.middle.length >= 3);
});
