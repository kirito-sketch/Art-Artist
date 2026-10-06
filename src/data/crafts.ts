import type { Craft } from './types';
import { familyMates } from './taxonomy';

/**
 * The structured craft list used at onboarding, search and matching. Short on purpose: grouped tiles,
 * not a taxonomy tree. A person has one primary craft, up to four more, and an optional free-text
 * specialisation. `domain` lets fine arts add crafts (painter, sculptor, curator…) to the same model.
 */
export interface CraftDef {
  id: Craft;
  label: string;
  /** How the profile headline reads for this craft. */
  person: string;
  domain: 'film' | 'art';
}

export const CRAFTS: CraftDef[] = [
  { id: 'director', label: 'Direction', person: 'Director', domain: 'film' },
  { id: 'writing', label: 'Writing', person: 'Writer', domain: 'film' },
  { id: 'actor', label: 'Acting', person: 'Actor', domain: 'film' },
  { id: 'cinematographer', label: 'Cinematography', person: 'Cinematographer', domain: 'film' },
  { id: 'camera', label: 'Camera crew', person: 'Camera crew', domain: 'film' },
  { id: 'lighting', label: 'Lighting', person: 'Gaffer / Lighting', domain: 'film' },
  { id: 'editor', label: 'Editing', person: 'Editor', domain: 'film' },
  { id: 'colourist', label: 'Colour', person: 'Colourist', domain: 'film' },
  { id: 'sound', label: 'Sound', person: 'Sound', domain: 'film' },
  { id: 'music', label: 'Music', person: 'Composer / Music', domain: 'film' },
  { id: 'production-design', label: 'Production design', person: 'Production Designer', domain: 'film' },
  { id: 'costume', label: 'Costume', person: 'Costume Designer', domain: 'film' },
  { id: 'makeup', label: 'Make-up & hair', person: 'Make-up & Hair', domain: 'film' },
  { id: 'vfx', label: 'VFX & animation', person: 'VFX / Animation', domain: 'film' },
  { id: 'production', label: 'Production', person: 'Producer / Production', domain: 'film' },
];

export const craftDef = (id: string) => CRAFTS.find((c) => c.id === id);

/** Headline shown on the profile: primary craft plus specialisation. */
export const headline = (primary: string, specialisation?: string) => [craftDef(primary)?.person ?? primary, specialisation?.trim()].filter(Boolean).join(' · ');

/** Crafts that work side by side (a cinematographer's crew is camera and lighting too). Used for matching, never shown. */
export const relatedCrafts = (c: Craft): Craft[] => familyMates(c);
