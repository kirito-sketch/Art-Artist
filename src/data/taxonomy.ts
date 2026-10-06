import type { Craft } from './types';

/*
 * The craft taxonomy as data: domain → family → craft (docs/DISTRICT_FIXES.md §10). One place says which crafts
 * work side by side and which families sit next to each other. Home's shelf labels ("Camera crew near you"),
 * related crafts for matching, and the related families "People near you" widens to all read from here.
 * Fine arts can add a domain with its own families without touching any screen.
 */

export interface Family {
  id: string;
  /** How the family reads as a group of crafts ("Camera and lighting"). */
  label: string;
  /** How a shelf of its people reads ("Camera crew"). */
  people: string;
  crafts: Craft[];
  /** Families that often work alongside this one, closest first. */
  near: string[];
}

export interface Domain {
  id: 'film' | 'art';
  label: string;
  families: Family[];
}

export const TAXONOMY: Domain[] = [
  {
    id: 'film',
    label: 'Film',
    families: [
      { id: 'direction', label: 'Direction and writing', people: 'Directors and writers', crafts: ['director', 'writing'], near: ['production', 'acting'] },
      { id: 'acting', label: 'Acting', people: 'Actors', crafts: ['actor'], near: ['direction'] },
      { id: 'camera', label: 'Camera and lighting', people: 'Camera crew', crafts: ['cinematographer', 'camera', 'lighting'], near: ['art', 'post'] },
      { id: 'post', label: 'Editing, colour and VFX', people: 'Editors and colourists', crafts: ['editor', 'colourist', 'vfx'], near: ['sound', 'camera'] },
      { id: 'sound', label: 'Sound and music', people: 'Sound and music', crafts: ['sound', 'music'], near: ['post'] },
      { id: 'art', label: 'Art, costume and make-up', people: 'Art department', crafts: ['production-design', 'costume', 'makeup'], near: ['camera'] },
      { id: 'production', label: 'Production', people: 'Producers', crafts: ['production'], near: ['direction'] },
    ],
  },
];

const FAMILIES = TAXONOMY.flatMap((d) => d.families);

export const familyOf = (c: Craft): Family => FAMILIES.find((f) => f.crafts.includes(c)) ?? { id: c, label: c, people: c, crafts: [c], near: [] };

/** Crafts in the same family, the craft itself excluded. */
export const familyMates = (c: Craft): Craft[] => familyOf(c).crafts.filter((x) => x !== c);

/** Crafts in the families next to this craft's own, closest family first. */
export const nearCrafts = (c: Craft): Craft[] => familyOf(c).near.flatMap((id) => FAMILIES.find((f) => f.id === id)?.crafts ?? []);
