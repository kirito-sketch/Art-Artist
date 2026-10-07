import type { Media, Person } from '../data/types';

/** Focal metadata for supplied prototype portraits; these are composition hints, not face detection. */
const portraitFocus: Record<string, { x: number; y: number }> = {
  kiran: { x: 50, y: 40 },
  sameer: { x: 50, y: 53 },
};
export function profilePortrait(person: Person): Media | undefined {
  return person.photo ? { id: `portrait-${person.id}`, kind: 'image', src: person.photo, contentType: 'portrait', width: 480, height: 600, focal: person.photo === `images/people/${person.id}.jpg` ? portraitFocus[person.id] ?? { x: 50, y: 35 } : { x: 50, y: 35 } } : undefined;
}
