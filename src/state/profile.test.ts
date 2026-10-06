import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Person } from '../data/types';
import { setsFor } from '../data/profileSchema';
import { canSee, emptyPacing, engaged, later, maskedPhone, nextPrompt, normalisePhone, openSteps, profileOf, visibilityOf, type ProfileExtra } from './profile';

const NOW = Date.UTC(2026, 9, 6);
const D = 864e5;
const person = (p: Partial<Person> = {}): Person => ({ id: 'p', kind: 'person', name: 'P', role: 'Actor', craft: 'actor', city: 'Mumbai', tone: 1, photo: 'x.jpg', languages: ['Hindi'], ...p });
const extra = (p: Partial<ProfileExtra> = {}): ProfileExtra => ({ skills: [], suggestedSkills: [], details: {}, visibility: {}, workTypes: [], links: [], workLinks: [], phone: { number: '9876543210', verified: true }, ...p });
const facts = (p: Partial<Person> = {}, x: Partial<ProfileExtra> = {}, images = 1) => ({ person: person(p), extra: extra(x), images, availabilityOpen: true, wantsWork: true });

test('a writer never gets acting fields; an actor who also edits gets both sets', () => {
  assert.deepEqual(setsFor(['writing']), []);
  assert.deepEqual(setsFor(['actor', 'editor']).map((s) => s.id), ['acting', 'editing']);
});

test('steps come in the approved order, mobile first', () => {
  assert.deepEqual(openSteps(facts({ photo: undefined, languages: [] }, { phone: undefined }, 0)), ['phone', 'photo', 'work', 'languages', 'details', 'skills']);
});

test('physical attributes never count as missing; a non-sensitive detail completes the set', () => {
  assert.ok(openSteps(facts({}, { details: { height: 170 } })).includes('details'));
  assert.ok(!openSteps(facts({}, { details: { accents: ['Bambaiya'] } })).includes('details'));
});

test('a craft with nothing to show work with is never asked for work', () => {
  assert.ok(openSteps(facts({ craft: 'writing' }, {}, 0)).includes('work'), 'writers are asked for a sample link');
  assert.ok(!openSteps(facts({ craft: 'production', role: 'Producer' }, {}, 1)).includes('work'));
});

test('availability is asked only of people looking for work', () => {
  assert.ok(openSteps({ ...facts(), availabilityOpen: false }).includes('availability'));
  assert.ok(!openSteps({ ...facts(), availabilityOpen: false, wantsWork: false }).includes('availability'));
});

test('Later snoozes a step for 14 days; three in a row means 30 quiet days', () => {
  let p = later(emptyPacing(), 'phone', NOW);
  assert.equal(nextPrompt(['phone', 'photo'], p, NOW), 'photo');
  assert.equal(nextPrompt(['phone'], p, NOW + 15 * D), 'phone');
  p = later(later(p, 'photo', NOW), 'work', NOW);
  assert.equal(nextPrompt(['languages'], p, NOW + D), undefined);
  assert.equal(nextPrompt(['languages'], p, NOW + 31 * D), 'languages');
});

test('doing a step resets the Later streak', () => {
  const p = engaged(later(later(emptyPacing(), 'phone', NOW), 'photo', NOW));
  assert.equal(later(p, 'work', NOW).quietUntil, 0);
});

test('visibility: physical details default to productions; productions see them, members do not', () => {
  const x = extra();
  assert.equal(visibilityOf(x, 'height'), 'productions');
  assert.equal(visibilityOf(x, 'accents'), 'public');
  assert.ok(canSee('productions', 'production'));
  assert.ok(!canSee('productions', 'member'));
  assert.ok(!canSee('private', 'production'));
  assert.ok(canSee('private', 'self'));
});

test('phone numbers are compared by their last ten digits and never shown in full', () => {
  assert.equal(normalisePhone('+91 98480-22334'), '9848022334');
  assert.ok(!maskedPhone('9848022334').includes('8480223'));
});

test('every person has one profile record, created on first use', () => {
  assert.equal(profileOf('nobody-yet'), profileOf('nobody-yet'));
});
