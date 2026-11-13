import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Person } from '../data/types';
import type { ProfileExtra } from '../state/profile';
import { gateTotal, missingForGate, timeLeft } from './profileGates';

const person = (p: Partial<Person> = {}): Person => ({ id: 'n', kind: 'person', name: 'New', role: '', craft: 'editor', city: 'Hyderabad', tone: 1, ...p });
const extra = (x: Partial<ProfileExtra> = {}): ProfileExtra => ({ skills: [], suggestedSkills: [], details: {}, visibility: {}, workTypes: [], links: [], workLinks: [], ...x });
const ids = (p: Person, x: ProfileExtra, images = 0) => missingForGate({ person: p, extra: x, images }).map((i) => i.id);

test('a new editor owes role, level, industry, types of work, every editing detail, Instagram, phone and work', () => {
  assert.deepEqual(ids(person(), extra()), ['role', 'level', 'industry', 'workTypes', 'field:editSoftware', 'field:editFormats', 'field:genres', 'field:editSpecial', 'field:turnaround', 'instagram', 'phone', 'work']);
});

test('a complete profile owes nothing', () => {
  const x = extra({
    craftRole: 'Editor', level: 'Senior', industries: ['Tollywood'], workTypes: ['Feature'], instagram: 'cut',
    phone: { number: '9876543210', verified: true }, workLinks: [{ id: 'w', label: 'Reel', url: 'https://vimeo.com/' }],
    details: { editSoftware: ['Avid Media Composer'], editFormats: ['Feature'], genres: ['Drama'], editSpecial: ['Montage'], turnaround: 'Fast' },
  });
  assert.deepEqual(ids(person(), x), []);
});

test('sensitive acting fields are never required; actors are not asked a level', () => {
  const got = ids(person({ craft: 'actor' }), extra());
  assert.ok(!got.includes('field:height') && !got.includes('field:build'));
  assert.ok(got.includes('field:roleType') && got.includes('field:playingAge'));
  assert.ok(!got.includes('level'));
});

test('fine artists are asked their practice, not film industry, level or types of work', () => {
  const got = ids(person({ craft: 'painting' }), extra());
  assert.ok(!got.includes('industry') && !got.includes('level') && !got.includes('workTypes') && !got.includes('role'));
  assert.ok(got.includes('field:artStage') && got.includes('field:artMedium'));
});

test('"I don\'t have Instagram" counts as answered, and portfolio images count as work', () => {
  const got = ids(person(), extra({ noInstagram: true }), 3);
  assert.ok(!got.includes('instagram') && !got.includes('work'));
});

test('only the main craft blocks; other crafts never add required fields', () => {
  assert.deepEqual(ids(person({ crafts: ['sound'] }), extra()), ids(person(), extra()));
});

test('the total counts everything gate 2 asks, and the time reads in plain words', () => {
  assert.equal(gateTotal({ person: person(), extra: extra(), images: 0 }), 12);
  assert.equal(timeLeft([{ id: 'a', kind: 'role', label: '', seconds: 20 }]), 'Under a minute');
  assert.equal(timeLeft(missingForGate({ person: person(), extra: extra(), images: 0 })), 'About 3 min');
});
