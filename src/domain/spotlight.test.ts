import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agoDays, eligible, kicker, notable, pickSpotlight, spotScore, type SpotContext, type SpotItem } from './spotlight';
import { relatedCrafts } from '../data/crafts';

let n = 0;
const it = (p: Partial<SpotItem> = {}): SpotItem => {
  const id = p.ref ?? `x${n++}`;
  return { key: `${p.type ?? 'event'}:${id}`, type: 'event', ref: id, title: 'T', organiser: `org-${id}`, ...p };
};
const ctx = (p: Partial<SpotContext> = {}): SpotContext => ({ city: 'Hyderabad', crafts: ['cinematographer'], languages: ['Telugu'], network: [], following: [], blocked: [], ...p });

test('only time-sensitive things are eligible', () => {
  assert.ok(eligible(it({ type: 'role', crafts: ['cinematographer'], inDays: 5 }), ctx()));
  assert.ok(eligible(it({ type: 'role', crafts: ['camera'], ageDays: 1 }), ctx()), 'related craft, new');
  assert.ok(!eligible(it({ type: 'role', crafts: ['cinematographer'], inDays: 20, ageDays: 9 }), ctx()), 'neither soon nor new');
  assert.ok(!eligible(it({ type: 'role', crafts: ['actor'], inDays: 2 }), ctx()), 'not your craft');
  assert.ok(eligible(it({ type: 'project', stageChanged: true, ageDays: 2 }), ctx()));
  assert.ok(!eligible(it({ type: 'project', stageChanged: true, ageDays: 5 }), ctx()));
  assert.ok(eligible(it({ type: 'project', crewing: true, city: 'Hyderabad' }), ctx()));
  assert.ok(!eligible(it({ type: 'project', crewing: true, city: 'Mumbai' }), ctx()));
  assert.ok(eligible(it({ type: 'post', organiser: 'vikram', ageDays: 1 }), ctx({ following: ['vikram'] })));
  assert.ok(!eligible(it({ type: 'post', organiser: 'stranger', ageDays: 1 }), ctx()), 'posts only from people you know');
  assert.ok(eligible(it({ type: 'event', inDays: 6 }), ctx()));
  assert.ok(!eligible(it({ type: 'event', inDays: 9 }), ctx()));
  assert.ok(!eligible(it({ type: 'event', inDays: 2, organiser: 'bad' }), ctx({ blocked: ['bad'] })), 'blocked');
});

test('relationship, craft, city and language raise an item; interest is capped', () => {
  const base = it({ type: 'event', inDays: 5, city: 'Mumbai' });
  assert.ok(spotScore({ ...base, city: 'Hyderabad' }, ctx()) > spotScore(base, ctx()));
  assert.ok(spotScore({ ...base, crafts: ['cinematographer'] }, ctx()) > spotScore({ ...base, crafts: ['lighting'] }, ctx()));
  assert.ok(spotScore({ ...base, crafts: ['lighting'] }, ctx()) > spotScore({ ...base, crafts: ['actor'] }, ctx()), 'related craft counts');
  assert.ok(spotScore({ ...base, people: ['meera'] }, ctx({ network: ['meera'] })) > spotScore(base, ctx()));
  assert.ok(spotScore({ ...base, languages: ['Telugu'] }, ctx()) > spotScore(base, ctx()));
  assert.ok(spotScore({ ...base, interest: 9000 }, ctx()) - spotScore(base, ctx()) <= 1);
});

test('at most five, two of a kind, one per organiser, two kinds in the first three, never people', () => {
  const pool = [
    ...[0, 1, 2, 3].map((i) => it({ type: 'role', crafts: ['cinematographer'], inDays: i, city: 'Hyderabad' })),
    ...[0, 1, 2].map((i) => it({ type: 'event', inDays: i + 1, city: 'Hyderabad' })),
    it({ type: 'post', organiser: 'vikram', ageDays: 0.5 }),
    it({ type: 'post', organiser: 'vikram', ageDays: 1 }),
    it({ type: 'release', organiser: 'saffron' }),
  ];
  const out = pickSpotlight(pool, ctx({ following: ['vikram'] }));
  assert.equal(out.length, 5);
  for (const t of ['role', 'event', 'post', 'release']) assert.ok(out.filter((x) => x.type === t).length <= 2, t);
  assert.equal(new Set(out.map((x) => x.organiser)).size, out.length);
  assert.ok(new Set(out.slice(0, 3).map((x) => x.type)).size >= 2);
  assert.equal(out.filter((x) => x.universal).length, 1);
});

test('the universal card ignores craft and relationship: the same for two people in one city', () => {
  const pool = [it({ type: 'event', inDays: 1, city: 'Hyderabad', crafts: ['actor'] }), it({ type: 'role', crafts: ['cinematographer'], inDays: 2 }), it({ type: 'role', crafts: ['actor'], inDays: 2 })];
  const a = pickSpotlight(pool, ctx()).find((x) => x.universal);
  const b = pickSpotlight(pool, ctx({ crafts: ['actor'], following: ['someone'] })).find((x) => x.universal);
  assert.ok(a && b);
  assert.equal(a.key, b.key);
});

test('a project far away is here for its stage change, and says so', () => {
  const pool = [it({ type: 'project', ref: 'neela', crewing: true, stageChanged: true, ageDays: 1, city: 'Hyderabad', stage: 'Shooting' })];
  assert.equal(pickSpotlight(pool, ctx({ city: 'Mumbai' }))[0].because, 'stage');
  assert.equal(pickSpotlight(pool, ctx())[0].because, 'crewing');
});

test('a national pin leads; a blocked pin does not', () => {
  const pool = [it({ type: 'release', ref: 'film', organiser: 'house' }), it({ type: 'event', inDays: 1, city: 'Hyderabad' })];
  assert.equal(pickSpotlight(pool, ctx({ pin: 'release:film' }))[0].key, 'release:film');
  assert.ok(!pickSpotlight(pool, ctx({ pin: 'release:film', blocked: ['house'] })).some((x) => x.key === 'release:film'));
});

test('labels say what and why in a few words', () => {
  assert.equal(kicker(it({ type: 'project', crewing: true, need: 'DoP' })), 'Crew forming · needs a DoP');
  assert.equal(kicker(it({ type: 'project', crewing: true, need: 'Editor' })), 'Crew forming · needs an editor');
  assert.equal(kicker(it({ type: 'project', crewing: true, need: 'Director of Photography' })), 'Crew forming · needs a DoP');
  assert.equal(kicker({ ...it({ type: 'project', crewing: true, stageChanged: true, stage: 'Shooting', need: 'Gaffer' }), because: 'stage' }), 'Now shooting');
  assert.equal(kicker(it({ type: 'post', by: 'Vikram Sen' })), 'New work · Vikram Sen');
  assert.equal(kicker(it({ type: 'event', day: 'Sat', city: 'Hyderabad' })), 'Event · Sat, Hyderabad');
  assert.equal(kicker(it({ type: 'release', rating: 4.1 })), 'Out this week · ★ 4.1');
  assert.equal(kicker(it({ type: 'role', need: 'Focus puller', inDays: 1 })), 'Role · closes tomorrow');
  assert.equal(kicker(it({ type: 'role', need: 'Focus puller', inDays: 6, city: 'Hyderabad' })), 'New role · Hyderabad');
});

test('seed relative times read as days', () => {
  assert.equal(agoDays('2d'), 2);
  assert.equal(agoDays('12h'), 0.5);
  assert.equal(agoDays('1w'), 7);
  assert.equal(agoDays('Yesterday 18:40'), 1);
  assert.equal(agoDays('soon'), undefined);
});

test('related crafts read from the taxonomy, unchanged', () => {
  assert.deepEqual(relatedCrafts('cinematographer'), ['camera', 'lighting']);
  assert.deepEqual(relatedCrafts('editor'), ['colourist', 'vfx']);
  assert.deepEqual(relatedCrafts('actor'), []);
  assert.deepEqual(relatedCrafts('production'), []);
  assert.deepEqual(relatedCrafts('music'), ['sound']);
});

test('This week: notable, time-bound things only; never ordinary roles or posts', () => {
  assert.ok(notable(it({ type: 'event', eventType: 'screening', inDays: 6 }), ctx()), 'a premiere or screening this week');
  assert.ok(!notable(it({ type: 'event', eventType: 'workshop', inDays: 2 }), ctx()), 'an ordinary workshop goes to Events');
  assert.ok(notable(it({ type: 'event', eventType: 'workshop', inDays: 2, mine: true }), ctx()), 'one you are speaking at');
  assert.ok(notable(it({ type: 'event', eventType: 'meetup', inDays: 2, organiser: 'konark' }), ctx({ network: ['konark'] })), 'hosted by someone you know');
  assert.ok(!notable(it({ type: 'event', eventType: 'screening', inDays: 9 }), ctx()), 'not this week');
  assert.ok(notable(it({ type: 'project', stageChanged: true, ageDays: 1 }), ctx()), 'a production that just started shooting');
  assert.ok(!notable(it({ type: 'project', crewing: true, city: 'Hyderabad' }), ctx()), 'crewing alone is an opportunity, not news');
  assert.ok(notable(it({ type: 'release', rating: 4.1 }), ctx()), 'a release people are rating');
  assert.ok(!notable(it({ type: 'release' }), ctx()), 'a release nobody has rated yet');
  assert.ok(!notable(it({ type: 'role', crafts: ['cinematographer'], inDays: 2 }), ctx()), 'an ordinary role goes to For you');
  assert.ok(notable(it({ type: 'role', crafts: ['cinematographer'], inDays: 2, organiser: 'konark' }), ctx({ network: ['konark'] })), 'your craft, your network, closing in days');
  assert.ok(!notable(it({ type: 'post', organiser: 'vikram', ageDays: 0 }), ctx({ following: ['vikram'] })), 'posts never');
});

test('This week: what you are part of leads; one per organiser; posts never appear', () => {
  const items = [
    it({ type: 'event', ref: 'premiere', eventType: 'screening', inDays: 6, organiser: 'saffron', city: 'Mumbai', mine: true }),
    it({ type: 'project', ref: 'neela', stageChanged: true, ageDays: 1, organiser: 'konark', city: 'Hyderabad' }),
    it({ type: 'event', ref: 'meet', eventType: 'meetup', inDays: 1, organiser: 'konark', city: 'Hyderabad' }),
    it({ type: 'release', ref: 'dhoop', rating: 4.1, organiser: 'bluelotus' }),
    it({ type: 'post', ref: 'p1', ageDays: 0, organiser: 'vikram' }),
  ];
  const out = pickSpotlight(items, ctx({ network: ['konark'], following: ['vikram'] }), 'week');
  assert.equal(out[0].ref, 'premiere');
  assert.ok(!out.some((x) => x.type === 'post'));
  assert.equal(out.filter((x) => x.organiser === 'konark').length, 1);
  assert.ok(out.some((x) => x.ref === 'dhoop'));
});
