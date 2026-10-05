import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compose } from './compose';
import { NOW, c, types } from './fixtures';

test('never two units of the same type next to each other', () => {
  const r = compose([c({ type: 'post' }), c({ type: 'post' }), c({ type: 'people' })], null, NOW);
  assert.deepEqual(types(r.middle), ['post', 'people', 'post']);
});
test('at most one opportunity per page', () => {
  const r = compose([c({ type: 'opportunity' }), c({ type: 'opportunity' }), c({ type: 'people' }), c({ type: 'house' }), c({ type: 'post' })], null, NOW);
  assert.equal(types(r.middle).filter((t) => t === 'opportunity').length, 1);
});
test('an opportunity that ranks first still lands third or lower', () => {
  const r = compose([c({ type: 'opportunity' }), c({ type: 'people' }), c({ type: 'house' }), c({ type: 'post' })], null, NOW);
  assert.ok(types(r.middle).indexOf('opportunity') >= 2, types(r.middle).join(','));
});
test('with too little around it, an opportunity is dropped rather than placed early', () => {
  const r = compose([c({ type: 'opportunity' }), c({ type: 'people' })], null, NOW);
  assert.deepEqual(types(r.middle), ['people']);
});
test('caps per type (posts: 2)', () => {
  const r = compose([c({ type: 'post' }), c({ type: 'people' }), c({ type: 'post' }), c({ type: 'house' }), c({ type: 'post' })], null, NOW);
  assert.equal(types(r.middle).filter((t) => t === 'post').length, 2);
});
test('visual weight varies where the pool allows: a different weight from the unit above is preferred over rank', () => {
  // projectUpdates and house are both compact: the post (media) goes between them.
  const r = compose([c({ type: 'projectUpdates' }), c({ type: 'house' }), c({ type: 'post' })], null, NOW);
  assert.deepEqual(types(r.middle), ['projectUpdates', 'post', 'house']);
});
test('a type not yet on the page is preferred over a second of one already shown', () => {
  const r = compose([c({ type: 'post' }), c({ type: 'people' }), c({ type: 'post' }), c({ type: 'house' })], null, NOW);
  assert.deepEqual(types(r.middle), ['post', 'people', 'house', 'post']);
});
test('no padding: two good candidates make a middle of two', () => {
  assert.equal(compose([c({ type: 'people' }), c({ type: 'house' })], null, NOW).middle.length, 2);
});
test('the lead is the best leadable high item, excluded from the middle, never a role', () => {
  const role = c({ type: 'opportunity', significance: 'high', leadable: true, relationship: 1 });
  const project = c({ type: 'projectUpdates', significance: 'high', leadable: true, relationship: 0.5 });
  const r = compose([role, project, c({ type: 'people' })], null, NOW);
  assert.equal(r.lead?.id, project.id);
  assert.ok(!r.middle.some((x) => x.id === project.id));
});
test('no lead when nothing qualifies', () => assert.equal(compose([c({ type: 'people' })], null, NOW).lead, null));
test('the middle holds at most eight units', () => {
  const many = Array.from({ length: 30 }, (_, i) => c({ type: (['people', 'post', 'house', 'projectUpdates', 'creditRelation', 'project', 'opportunity'] as const)[i % 7] }));
  assert.ok(compose(many, null, NOW).middle.length <= 8);
});
test('personal news passes through unchanged', () => {
  const p = { id: 'n1', text: 'Saffron Reel Studios added you to Kaaval as Director of Photography.', actorId: 'saffron', at: NOW, urgent: true };
  assert.equal(compose([], p, NOW).personal, p);
});

test('a first Home is shorter', () => {
  const pool = (['people', 'post', 'house', 'projectUpdates', 'creditRelation', 'post', 'opportunity'] as const).map((type) => c({ type }));
  assert.equal(compose(pool, null, NOW, { maxMiddle: 5 }).middle.length, 5);
});

// --- Events are not Home content (October 2026)
test('an event never leads, even high and leadable', () => {
  const r = compose([c({ type: 'event', significance: 'high', leadable: true, relationship: 1 }), c({ type: 'people' })], null, NOW);
  assert.equal(r.lead, null);
});
test('an event never takes a place in the middle', () => {
  const r = compose([c({ type: 'event' }), c({ type: 'people' }), c({ type: 'event' }), c({ type: 'post' })], null, NOW);
  assert.ok(!types(r.middle).includes('event'), types(r.middle).join(','));
});
test("an event doesn't change the order of anything else", () => {
  const rest = [c({ type: 'projectUpdates', significance: 'high', leadable: true }), c({ type: 'people' }), c({ type: 'post' }), c({ type: 'house' })];
  const without = compose(rest, null, NOW);
  const withEvent = compose([c({ type: 'event', significance: 'high', leadable: true }), ...rest], null, NOW);
  assert.equal(withEvent.lead?.id, without.lead?.id);
  assert.deepEqual(withEvent.middle.map((x) => x.id), without.middle.map((x) => x.id));
});

// --- Visual weight
test('never two immersive units in a row: a project right under the lead waits', () => {
  const lead = c({ type: 'projectUpdates', significance: 'high', leadable: true, relationship: 1 });
  const r = compose([lead, c({ type: 'project', relationship: 0.9 }), c({ type: 'people' }), c({ type: 'post' }), c({ type: 'house' }), c({ type: 'creditRelation' })], null, NOW);
  const i = types(r.middle).indexOf('project');
  assert.ok(i >= 3, types(r.middle).join(','));
  assert.notEqual(types(r.middle)[i - 1], 'project');
});
test('a second project is left out rather than placed high when the page is short', () => {
  const r = compose([c({ type: 'project' }), c({ type: 'people' }), c({ type: 'post' })], null, NOW);
  assert.ok(!types(r.middle).includes('project'), types(r.middle).join(','));
});
test('at most one immersive unit in the middle', () => {
  const pool = [c({ type: 'people' }), c({ type: 'post' }), c({ type: 'house' }), c({ type: 'project' }), c({ type: 'project' }), c({ type: 'creditRelation' }), c({ type: 'project' }), c({ type: 'post' })];
  assert.ok(types(compose(pool, null, NOW).middle).filter((t) => t === 'project').length <= 1);
});
test('one story per project: the lead\'s project does not come back lower down', () => {
  const lead = c({ type: 'projectUpdates', significance: 'high', leadable: true, data: { projectId: 'neela', project: 'neela akasham' } });
  const again = c({ type: 'project', data: { projectId: 'neela', project: 'neela akasham' } });
  const pair = c({ type: 'creditRelation', data: { projectId: 'neela', project: 'neela akasham' } });
  const role = c({ type: 'opportunity', data: { roleId: 'o-neela-dop', project: 'neela akasham' } });
  const r = compose([lead, c({ type: 'people' }), c({ type: 'post' }), c({ type: 'house' }), again, pair, role], null, NOW);
  assert.ok(!r.middle.some((x) => x.data?.project === 'neela akasham'), r.middle.map((x) => x.id).join(','));
});
test('only a project or a piece of work can lead: never a person, a house or a role', () => {
  for (const type of ['people', 'house', 'opportunity', 'creditRelation'] as const) assert.equal(compose([c({ type, significance: 'high', leadable: true })], null, NOW).lead, null, type);
  assert.ok(compose([c({ type: 'project', significance: 'high', leadable: true })], null, NOW).lead);
});
test('the role never reaches the first viewport: the lead and the first two units are never a role', () => {
  const pool = [c({ type: 'opportunity', significance: 'high', relationship: 1, professional: 1 }), c({ type: 'projectUpdates', significance: 'high', leadable: true }), c({ type: 'people' }), c({ type: 'post' }), c({ type: 'house' })];
  const r = compose(pool, null, NOW, { maxMiddle: 5 });
  assert.notEqual(r.lead?.type, 'opportunity');
  assert.ok(types(r.middle).indexOf('opportunity') >= 2, types(r.middle).join(','));
});
