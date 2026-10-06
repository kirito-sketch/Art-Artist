/*
 * The kinds of thing the app shows (docs/DISTRICT_FIXES.md §10). One registry for the Discover chips, Home's
 * tiles and the Spotlight's labels, so a new kind (a gallery show, a course) is one entry, not five edits.
 */

export type ContentType = 'post' | 'person' | 'role' | 'project' | 'event' | 'review';

/** Discover's chips in the District version, in order. Posts is the default. */
export type DiscoverChip = 'posts' | 'people' | 'roles' | 'projects' | 'events' | 'reviews';

export interface ContentTypeDef {
  type: ContentType;
  chip: DiscoverChip;
  /** The chip and tile label. */
  label: string;
  /** What search on this chip looks through. */
  search: string;
  /** Behind a feature switch. */
  flag?: 'events';
}

export const CONTENT_TYPES: ContentTypeDef[] = [
  { type: 'post', chip: 'posts', label: 'Posts', search: 'Search people, projects, events' },
  { type: 'person', chip: 'people', label: 'People', search: 'Search people and production houses' },
  { type: 'role', chip: 'roles', label: 'Opportunities', search: 'Search roles, casting and collaborations' },
  { type: 'project', chip: 'projects', label: 'Projects', search: 'Search projects and productions' },
  { type: 'event', chip: 'events', label: 'Events', search: 'Search events', flag: 'events' },
  { type: 'review', chip: 'reviews', label: 'Reviews', search: 'Search films' },
];

export const chipDef = (c: DiscoverChip) => CONTENT_TYPES.find((t) => t.chip === c)!;
export const DISCOVER_CHIP_DEFAULT: DiscoverChip = 'posts';
