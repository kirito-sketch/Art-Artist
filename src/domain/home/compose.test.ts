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
test('large and compact alternate where the pool allows', () => {
  const r = compose([c({ type: 'people' }), c({ type: 'post' }), c({ type: 'house' }), c({ type: 'projectUpdates' })], null, NOW);
  assert.deepEqual(types(r.middle), ['people', 'house', 'post', 'projectUpdates']);
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
  const many = Array.from({ length: 20 }, (_, i) => c({ type: (['people', 'post', 'house', 'projectUpdates', 'creditRelation', 'event', 'opportunity'] as const)[i % 7] }));
  assert.ok(compose(many, null, NOW).middle.length <= 8);
});
test('personal news passes through unchanged', () => {
  const p = { id: 'n1', text: 'Saffron Reel Studios added you to Kaaval as Director of Photography.', actorId: 'saffron', at: NOW, urgent: true };
  assert.equal(compose([], p, NOW).personal, p);
});

test('first Home for someone who came to find work: the role comes straight after the lead, and the page is shorter', () => {
  const pool = [
    c({ type: 'projectUpdates', objectId: 'lead', significance: 'high', leadable: true }),
    c({ type: 'people', objectId: 'a' }),
    c({ type: 'post', objectId: 'b' }),
    c({ type: 'house', objectId: 'c' }),
    c({ type: 'post', objectId: 'd' }),
    c({ type: 'event', objectId: 'e' }),
    c({ type: 'creditRelation', objectId: 'f' }),
    c({ type: 'opportunity', objectId: 'role' }),
  ];
  const r = compose(pool, null, NOW, { opportunityFirst: true, maxMiddle: 5 });
  assert.equal(r.middle[0].type, 'opportunity');
  assert.equal(r.middle.length, 5);
  assert.equal(r.middle.filter((x) => x.type === 'opportunity').length, 1);
});

test('first Home for work: the lead is never the project of the role right under it', () => {
  const pool = [
    c({ type: 'projectUpdates', objectId: 'neela', significance: 'high', leadable: true, data: { project: 'neela akasham' } }),
    c({ type: 'projectUpdates', objectId: 'backwaters', significance: 'high', leadable: true, data: { project: 'backwaters' } }),
    c({ type: 'opportunity', objectId: 'dop', data: { project: 'neela akasham' } }),
    c({ type: 'people', objectId: 'a' }),
  ];
  const r = compose(pool, null, NOW, { opportunityFirst: true });
  assert.equal(r.lead?.objectId, 'backwaters');
  assert.equal(r.middle[0].objectId, 'dop');
});
