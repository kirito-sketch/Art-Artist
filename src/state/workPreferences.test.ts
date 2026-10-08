import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as seed from '../data/seed';
import { profileOf } from './profile';
import { updateWorkPreferences, workPreferencesOf } from './workPreferences';

test('per-person work preferences survive viewer changes and update the public discovery projection', () => {
  const original = { ...workPreferencesOf('kiran') };
  try {
    updateWorkPreferences('kiran', { open: true, from: '20 Oct', scope: 'Hyderabad', travel: true });
    workPreferencesOf('tara');
    assert.equal(workPreferencesOf('kiran').from, '20 Oct');
    assert.equal(profileOf('kiran').workPreferences, workPreferencesOf('kiran'));
    assert.equal(seed.parties.kiran.kind === 'person' && seed.parties.kiran.availableFrom, '20 Oct');
    updateWorkPreferences('kiran', { open: false, from: '20 Oct', scope: 'Hyderabad', travel: false });
    assert.equal(seed.parties.kiran.kind === 'person' && seed.parties.kiran.availableFrom, undefined);
    assert.equal(seed.parties.kiran.kind === 'person' && seed.parties.kiran.openToTravel, false);
    assert.equal(workPreferencesOf('kiran').open, false);
  } finally { updateWorkPreferences('kiran', original); }
});

test('a person with no declared preferences is not assigned a public unavailable claim', () => {
  assert.equal(workPreferencesOf('arjun').configured, false);
});
