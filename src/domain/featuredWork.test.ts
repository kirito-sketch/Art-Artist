import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eligibleFeaturedProjects, featuredWorkOf, safeWorkUrl } from './featuredWork';
import { world } from '../state/world';
import { profileOf } from '../state/profile';

test('featured work uses own public projects or accepted public credits, with no private title leakage', () => {
  const projects = world.projects; const credits = world.credits;
  const me = 'featured-test'; const x = profileOf(me); const old = x.featuredWork;
  try {
    world.projects = [
      { id: 'mine', ownerId: me, workingTitle: 'Private working name', publicTitle: 'Public name', format: 'Short', languages: ['Telugu'], stage: 'Released', shared: true },
      { id: 'private', ownerId: me, workingTitle: 'Private', format: 'Short', languages: ['Telugu'], stage: 'Development', shared: false },
      { id: 'credit', houseId: 'h', workingTitle: 'Credit', format: 'Short', languages: ['Telugu'], stage: 'Released', shared: true },
      { id: 'other', houseId: 'h', workingTitle: 'Other', format: 'Short', languages: ['Telugu'], stage: 'Released', shared: true },
    ];
    world.credits = [{ id: 'c', associationId: 'a', projectId: 'credit', personId: me, line: 'Actor', dept: 'Cast', status: 'accepted' }];
    assert.deepEqual(eligibleFeaturedProjects(me).map((p) => p.id), ['mine', 'credit']);
    x.featuredWork = ['private', 'credit', 'other'].map((projectId) => ({ id: projectId, kind: 'project', projectId }));
    assert.deepEqual(featuredWorkOf(me).map((f) => f.id), ['credit']);
    world.credits[0].status = 'superseded';
    assert.deepEqual(featuredWorkOf(me), []);
  } finally { world.projects = projects; world.credits = credits; x.featuredWork = old; }
});

test('selected external work accepts HTTPS URLs without credentials', () => {
  assert.equal(safeWorkUrl('https://example.com/work'), 'https://example.com/work');
  for (const s of ['javascript:alert(1)', 'http://example.com', 'https://user:pass@example.com']) assert.equal(safeWorkUrl(s), null);
});
