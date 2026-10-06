import { test } from 'node:test';
import assert from 'node:assert/strict';
import { houseDecisions, peopleForHouseRoles, type HouseRole } from './house';
import type { HouseProject } from '../state/world';
import type { Person } from '../data/types';

const project: HouseProject = { id: 'p', houseId: 'h', workingTitle: 'Private', format: 'Feature', languages: ['Telugu'], stage: 'Development', shared: false };
const role = (id: string, days?: number): HouseRole => ({
  id,
  projectId: 'p',
  visibility: 'open',
  kind: 'crew',
  role: 'DoP',
  project: 'Untitled',
  projectType: 'Feature',
  city: 'Hyderabad',
  dates: '',
  compensation: '',
  paid: true,
  stage: '',
  about: '',
  lookingFor: [],
  match: [],
  forCrafts: ['cinematographer'],
  media: { id: 'ph', kind: 'image', src: '/placeholder.svg' },
  postedAgo: '',
  closesInDays: days,
});
const base = { projects: [project], roles: [], interests: [], associations: [], credits: [], amendments: [] };

test('house attention excludes passive acceptance, unrelated and removed records', () => {
  const associations = [
    { id: 'a', projectId: 'p', personId: 'x', workingRole: 'DoP', dept: 'Camera', status: 'added' as const },
    { id: 'gone', projectId: 'p', workingRole: 'DoP', dept: 'Camera', status: 'removed' as const },
  ];
  const credits = [
    { id: 'waiting', projectId: 'p', associationId: 'a', personId: 'x', line: 'DoP', dept: 'Camera', status: 'proposed' as const },
    { id: 'removed', projectId: 'p', associationId: 'gone', personId: 'x', line: 'DoP', dept: 'Camera', status: 'correction' as const },
  ];
  assert.deepEqual(houseDecisions({ ...base, associations, credits }), []);
  assert.deepEqual(houseDecisions({ ...base, roles: [{ ...role('other', 1), projectId: 'other' }] }), []);
});

test('actionable records rank before closing roles, with one decision per role', () => {
  const input = {
    ...base,
    roles: [role('later', 3), role('tomorrow', 1), role('new')],
    interests: [
      { id: 'i', personId: 'x', opportunityId: 'tomorrow', time: '' },
      { id: 'j', personId: 'x', opportunityId: 'new', time: '' },
    ],
    associations: [{ id: 'a', projectId: 'p', workingRole: 'DoP', dept: 'Camera', status: 'flagged' as const }],
  };
  assert.deepEqual(
    houseDecisions(input).map((x) => x.id),
    ['association:a', 'closing:tomorrow', 'closing:later', 'interest:new'],
  );
  assert.deepEqual(
    input.roles.map((x) => x.id),
    ['later', 'tomorrow', 'new'],
  );
});

test('withdrawn and reviewed Interest never create new attention; expired roles do not', () => {
  assert.deepEqual(
    houseDecisions({
      ...base,
      roles: [role('r'), role('expired', -1)],
      interests: [
        { id: 'i', personId: 'x', opportunityId: 'r', time: '', withdrawn: true },
        { id: 'j', personId: 'x', opportunityId: 'r', time: '', review: 'messaged' },
      ],
    }),
    [],
  );
});

test('credit corrections and open amendments need a decision; completed revisions do not', () => {
  const associations = [{ id: 'a', projectId: 'p', personId: 'x', workingRole: 'DoP', dept: 'Camera', status: 'added' as const }];
  const credits = [{ id: 'c', projectId: 'p', associationId: 'a', personId: 'x', line: 'DoP', dept: 'Camera', status: 'correction' as const }];
  const amendment = { id: 'm', projectId: 'p', associationId: 'a', personId: 'x', creditId: 'accepted', reason: 'Credit line', status: 'open' as const };
  assert.deepEqual(houseDecisions({ ...base, associations, credits, amendments: [amendment] }).map((d) => d.kind), ['correction', 'amendment']);
  assert.deepEqual(houseDecisions({ ...base, associations, amendments: [{ ...amendment, status: 'revised' }] }), []);
});

test('private needs and expired roles do not appear as public hiring decisions', () => {
  const interests = [{ id: 'i', personId: 'x', opportunityId: 'expired', time: '' }, { id: 'j', personId: 'x', opportunityId: 'private', time: '' }];
  assert.deepEqual(houseDecisions({ ...base, roles: [role('expired', -1), { ...role('private'), visibility: 'private' }], interests }), []);
});

test('role matching widens by taxonomy, keeps children private and prefers exact craft', () => {
  const person = (id: string, craft: Person['craft'], city = 'Hyderabad', visibility: Person['visibility'] = 'public'): Person => ({
    id,
    kind: 'person',
    name: id,
    role: craft,
    craft,
    city,
    visibility,
    tone: 1,
  });
  const pool = [
    person('adjacent', 'colourist'),
    person('family', 'lighting'),
    person('exact', 'cinematographer', 'Mumbai'),
    person('child', 'cinematographer', 'Hyderabad', 'private'),
    person('unrelated', 'actor'),
  ];
  assert.deepEqual(
    peopleForHouseRoles(pool, [role('r')], 'Hyderabad').map((x) => x.person.id),
    ['exact', 'family', 'adjacent'],
  );
  assert.equal(peopleForHouseRoles(pool, [], 'Hyderabad').length, 4);
});
