import * as seed from '../data/seed';
import { profileOf, type ProfileExtra } from './profile';

export type WorkPreferences = NonNullable<ProfileExtra['workPreferences']>;
const initial: Record<string, WorkPreferences> = {
  kiran: { open: true, from: '3 Oct', scope: 'Hyderabad · will travel', travel: true },
  tara: { open: true, from: 'Now', scope: 'Mumbai · self-tapes anywhere' },
  aditi: { open: false, from: 'Now', scope: 'Hyderabad' },
};

/** Legacy Person fields are projections for existing discovery consumers, never a second editable record. */
function project(id: string, value: WorkPreferences) {
  const person = seed.people.find(p => p.id === id);
  if (person) {
    person.availableFrom = value.open ? value.from : undefined;
    person.openToTravel = !!value.travel;
  }
}

export function workPreferencesOf(id: string): WorkPreferences {
  const extra = profileOf(id);
  if (!extra.workPreferences) {
    const person = seed.people.find(p => p.id === id);
    extra.workPreferences = { configured: !!initial[id] || !!person?.availableFrom || !!person?.openToTravel, ...(initial[id] ?? { open: !!person?.availableFrom, from: person?.availableFrom ?? 'Now', scope: person?.city ?? '', travel: !!person?.openToTravel }) };
    project(id, extra.workPreferences);
  }
  return extra.workPreferences;
}

export function updateWorkPreferences(id: string, value: WorkPreferences) {
  profileOf(id).workPreferences = { ...value, configured: true };
  project(id, value);
}

// Seed migration: all existing consumers start with the same public projection.
seed.people.forEach(p => workPreferencesOf(p.id));
