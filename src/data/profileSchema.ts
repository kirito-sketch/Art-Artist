import type { Craft } from './types';

/*
 * The role-aware profile (docs/REVIEW_EVENTS_PROFILE.md §7 to §9). Data, not screens: a craft switches on detail
 * sets and suggests skill categories; fields are defined once and reused. Adding a craft is adding a definition.
 * A person only ever sees the detail sets their own crafts switch on.
 */

export type Visibility = 'private' | 'productions' | 'public';
export const VISIBILITY_LABEL: Record<Visibility, string> = { private: 'Only you', productions: 'Productions', public: 'Everyone' };

export interface FieldDef {
  id: string;
  label: string;
  type: 'choice' | 'multi' | 'range' | 'number';
  options?: string[];
  /** For number and range. */
  unit?: string;
  min?: number;
  max?: number;
  /** Default visibility, and whether the person may change it. Physical attributes default to Productions. */
  visibility: Visibility;
  choosable?: Visibility[];
  /** Physical or otherwise sensitive: never prompted from Home, never required. */
  sensitive?: boolean;
}

export interface DetailSet {
  id: string;
  /** "Acting details" */
  label: string;
  fields: FieldDef[];
}

/** How "show your work" reads for a craft. Absent parts aren't offered. */
export interface WorkWords {
  reel?: string;
  images?: string;
  links: string;
  /** The completion prompt. */
  prompt: { title: string; body: string };
}

export interface CraftProfile {
  sets: string[];
  skillCategories: string[];
  work: WorkWords;
}

const PHYS: Visibility[] = ['public', 'productions', 'private'];

export const FIELDS: Record<string, FieldDef> = {
  playingAge: { id: 'playingAge', label: 'Playing age', type: 'range', min: 18, max: 80, unit: 'years', visibility: 'public', choosable: PHYS },
  height: { id: 'height', label: 'Height', type: 'number', min: 120, max: 220, unit: 'cm', visibility: 'productions', choosable: PHYS, sensitive: true },
  build: { id: 'build', label: 'Build', type: 'choice', options: ['Slim', 'Athletic', 'Average', 'Muscular', 'Heavy'], visibility: 'productions', choosable: PHYS, sensitive: true },
  hair: { id: 'hair', label: 'Hair', type: 'choice', options: ['Black', 'Dark brown', 'Brown', 'Grey', 'White', 'Dyed', 'Shaved'], visibility: 'productions', choosable: PHYS, sensitive: true },
  eyes: { id: 'eyes', label: 'Eyes', type: 'choice', options: ['Dark brown', 'Brown', 'Hazel', 'Green', 'Grey', 'Blue'], visibility: 'productions', choosable: PHYS, sensitive: true },
  accents: { id: 'accents', label: 'Accents', type: 'multi', options: ['Hyderabadi', 'Telangana', 'Coastal Andhra', 'Rayalaseema', 'Madras Tamil', 'Kongu Tamil', 'Malabar', 'Thrissur', 'Bambaiya', 'Delhi', 'Haryanvi', 'Bhojpuri', 'Bengali English', 'British', 'American'], visibility: 'public' },
  cameras: { id: 'cameras', label: 'Camera systems', type: 'multi', options: ['ARRI Alexa 35', 'ARRI Alexa Mini LF', 'ARRI Alexa Mini', 'Sony Venice 2', 'Sony FX9', 'Sony FX6', 'RED V-Raptor', 'RED Komodo', 'Canon C500', 'Canon C300', 'Blackmagic URSA', 'Film (16 mm)', 'Film (35 mm)'], visibility: 'public' },
  formats: { id: 'formats', label: 'Formats', type: 'multi', options: ['Spherical', 'Anamorphic', 'Large format', 'Super 16', 'Vertical'], visibility: 'public' },
  dopSpecial: { id: 'dopSpecial', label: 'Specialisations', type: 'multi', options: ['Night exteriors', 'Available light', 'Handheld', 'Underwater', 'Aerial', 'Car work', 'VFX plates', 'Documentary', 'Music video', 'Commercials'], visibility: 'public' },
  ownsKit: { id: 'ownsKit', label: 'Own kit', type: 'choice', options: ['Yes', 'Some', 'No'], visibility: 'public' },
  editSoftware: { id: 'editSoftware', label: 'Software', type: 'multi', options: ['Avid Media Composer', 'Adobe Premiere Pro', 'DaVinci Resolve', 'Final Cut Pro', 'After Effects', 'Baselight'], visibility: 'public' },
  editFormats: { id: 'editFormats', label: 'Formats', type: 'multi', options: ['Feature', 'Series', 'Short', 'Documentary', 'Commercial', 'Music video', 'Trailer'], visibility: 'public' },
  genres: { id: 'genres', label: 'Genres', type: 'multi', options: ['Drama', 'Thriller', 'Comedy', 'Action', 'Horror', 'Romance', 'Documentary', 'Musical'], visibility: 'public' },
  editSpecial: { id: 'editSpecial', label: 'Specialisations', type: 'multi', options: ['Dialogue scenes', 'Action', 'Montage', 'Trailers', 'Multicam', 'Conform and online', 'Grading'], visibility: 'public' },
  soundAreas: { id: 'soundAreas', label: 'Areas', type: 'multi', options: ['Location recording', 'Boom operation', 'Dialogue editing', 'Sound design', 'Foley', 'Mixing', 'Dolby Atmos', 'Music recording'], visibility: 'public' },
  soundTools: { id: 'soundTools', label: 'Tools', type: 'multi', options: ['Sound Devices', 'Zoom F8', 'Pro Tools', 'Nuendo', 'Reaper', 'iZotope RX', 'Lectrosonics wireless'], visibility: 'public' },
};

export const SETS: Record<string, DetailSet> = {
  acting: { id: 'acting', label: 'Acting details', fields: [FIELDS.playingAge, FIELDS.height, FIELDS.build, FIELDS.hair, FIELDS.eyes, FIELDS.accents] },
  camera: { id: 'camera', label: 'Camera details', fields: [FIELDS.cameras, FIELDS.formats, FIELDS.dopSpecial, FIELDS.ownsKit] },
  editing: { id: 'editing', label: 'Editing details', fields: [FIELDS.editSoftware, FIELDS.editFormats, FIELDS.genres, FIELDS.editSpecial] },
  sound: { id: 'sound', label: 'Sound details', fields: [FIELDS.soundAreas, FIELDS.soundTools, FIELDS.ownsKit] },
};

/* ------------------------------------------------------------ skills */

/** Levels are set per category: only where they help a casting or hiring decision. */
export interface SkillCategory {
  id: string;
  label: string;
  levels?: string[];
  /** Offer a certification name (stunts, diving, drones). */
  cert?: boolean;
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  { id: 'dance', label: 'Dance', levels: ['Trained', 'Professional'] },
  { id: 'combat', label: 'Combat and stunts', levels: ['Basic', 'Confident', 'Performance standard'], cert: true },
  { id: 'riding', label: 'Riding and driving', levels: ['Basic', 'Confident', 'Performance standard'] },
  { id: 'water', label: 'Water', levels: ['Basic', 'Confident', 'Performance standard'], cert: true },
  { id: 'music', label: 'Music and voice', levels: ['Trained', 'Professional'] },
  { id: 'sports', label: 'Sports' },
  { id: 'movement', label: 'Camera movement', cert: true },
];

export interface Skill {
  id: string;
  label: string;
  category: string;
  synonyms?: string[];
}

const k = (category: string, label: string, synonyms?: string[]): Skill => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), label, category, synonyms });

export const SKILLS: Skill[] = [
  k('dance', 'Bharatanatyam', ['bharatnatyam']),
  k('dance', 'Kathak'),
  k('dance', 'Kuchipudi'),
  k('dance', 'Mohiniyattam'),
  k('dance', 'Odissi'),
  k('dance', 'Contemporary'),
  k('dance', 'Hip-hop', ['hiphop']),
  k('dance', 'Bollywood'),
  k('dance', 'Folk dance'),
  k('combat', 'Stage combat'),
  k('combat', 'Kalaripayattu', ['kalari']),
  k('combat', 'Martial arts', ['karate', 'kung fu']),
  k('combat', 'Sword fighting', ['fencing']),
  k('combat', 'Falls and tumbling'),
  k('combat', 'Wire work', ['harness']),
  k('riding', 'Horse riding'),
  k('riding', 'Two-wheeler', ['bike', 'motorcycle', 'scooter']),
  k('riding', 'Car (manual)'),
  k('riding', 'Car (automatic)'),
  k('riding', 'Heavy vehicle'),
  k('riding', 'Cycling'),
  k('water', 'Swimming'),
  k('water', 'Free diving'),
  k('water', 'Scuba diving'),
  k('music', 'Carnatic singing'),
  k('music', 'Hindustani singing'),
  k('music', 'Playback singing'),
  k('music', 'Guitar'),
  k('music', 'Tabla'),
  k('music', 'Mridangam'),
  k('music', 'Keyboard', ['piano']),
  k('music', 'Violin'),
  k('sports', 'Cricket'),
  k('sports', 'Football'),
  k('sports', 'Kabaddi'),
  k('sports', 'Yoga'),
  k('sports', 'Boxing'),
  k('sports', 'Athletics', ['running']),
  k('movement', 'Steadicam'),
  k('movement', 'Gimbal'),
  k('movement', 'Drone', ['uav']),
  k('movement', 'Crane and jib'),
  k('movement', 'Dolly'),
];

export const MAX_SKILLS = 20;
export const skillDef = (id: string) => SKILLS.find((s) => s.id === id);
export const categoryOf = (id: string) => SKILL_CATEGORIES.find((c) => c.id === id);

/** Search the list by label or synonym; nothing typed shows the craft's categories first. */
export function findSkills(q: string, categories: string[] = []): Skill[] {
  const t = q.trim().toLowerCase();
  const order = (s: Skill) => (categories.includes(s.category) ? categories.indexOf(s.category) : 99);
  return SKILLS.filter((s) => !t || s.label.toLowerCase().includes(t) || (s.synonyms ?? []).some((x) => x.includes(t))).sort((a, b) => order(a) - order(b));
}

/* ------------------------------------------------------------ crafts */

const DEFAULT_WORK: WorkWords = { images: 'Portfolio', links: 'Projects', prompt: { title: 'Add your work', body: 'A few images or a link let productions see what you do before they message you.' } };
const REEL_WORK = (reel: string, images: string, links: string, title: string, body: string): WorkWords => ({ reel, images, links, prompt: { title, body } });

export const CRAFT_PROFILE: Partial<Record<Craft, CraftProfile>> = {
  actor: { sets: ['acting'], skillCategories: ['dance', 'combat', 'riding', 'water', 'music', 'sports'], work: REEL_WORK('Showreel', 'Headshots and stills', 'Scene clips', 'Add a showreel', 'Productions see how you work on screen before they call.') },
  cinematographer: { sets: ['camera'], skillCategories: ['movement'], work: REEL_WORK('Reel', 'Frames', 'Projects', 'Add your reel and frames', 'A reel and a few frames show your eye before anyone asks.') },
  camera: { sets: ['camera'], skillCategories: ['movement'], work: REEL_WORK('Reel', 'Frames', 'Projects', 'Add frames from your work', 'Productions look at frames before they look at anything else.') },
  lighting: { sets: ['camera'], skillCategories: ['movement'], work: REEL_WORK('Reel', 'Frames', 'Projects', 'Add frames from your work', 'Show the light you made.') },
  editor: { sets: ['editing'], skillCategories: [], work: REEL_WORK('Reel', 'Frames', 'Sequences and projects', 'Add your reel', 'A reel or a few sequences show your cutting.') },
  colourist: { sets: ['editing'], skillCategories: [], work: REEL_WORK('Reel', 'Before and after', 'Projects', 'Add your reel', 'Show a grade or two.') },
  vfx: { sets: ['editing'], skillCategories: [], work: REEL_WORK('Reel', 'Frames', 'Projects', 'Add your reel', 'Show a shot breakdown or two.') },
  sound: { sets: ['sound'], skillCategories: ['music'], work: REEL_WORK('Reel', 'Session photos', 'Tracks and projects', 'Add your work', 'A reel or a track lets productions hear what you do.') },
  music: { sets: ['sound'], skillCategories: ['music'], work: REEL_WORK('Reel', 'Session photos', 'Tracks and projects', 'Add your work', 'A track lets productions hear what you do.') },
  writing: { sets: [], skillCategories: [], work: { links: 'Writing samples and projects', prompt: { title: 'Add a writing sample link', body: 'A sample or a project page shows your voice. Share only what you want public.' } } },
  makeup: { sets: [], skillCategories: [], work: { images: 'Portfolio', links: 'Projects', prompt: { title: 'Add your portfolio', body: 'Looks you created are how productions choose.' } } },
  costume: { sets: [], skillCategories: [], work: { images: 'Portfolio', links: 'Projects', prompt: { title: 'Add your portfolio', body: 'Costumes you designed are how productions choose.' } } },
  'production-design': { sets: [], skillCategories: [], work: { images: 'Portfolio', links: 'Projects', prompt: { title: 'Add your portfolio', body: 'Sets and references show your world-building.' } } },
};

export const craftProfile = (c: Craft): CraftProfile => CRAFT_PROFILE[c] ?? { sets: [], skillCategories: [], work: DEFAULT_WORK };

/** Detail sets for all of a person's crafts, once each. A writer gets none of the acting fields. */
export const setsFor = (crafts: Craft[]) => [...new Set(crafts.flatMap((c) => craftProfile(c).sets))].map((id) => SETS[id]);
export const skillCategoriesFor = (crafts: Craft[]) => [...new Set(crafts.flatMap((c) => craftProfile(c).skillCategories))];

/* ------------------------------------------------------------ other structured fields */

export const WORK_TYPES = ['Feature', 'Series', 'Short', 'Documentary', 'Ad film', 'Music video', 'Theatre'];
export const EXPERIENCE = [
  { id: 'lt2', label: 'Under 2 years' },
  { id: '2-5', label: '2 to 5 years' },
  { id: '5-10', label: '5 to 10 years' },
  { id: '10+', label: '10+ years' },
] as const;
export type Experience = (typeof EXPERIENCE)[number]['id'];
export const LANGUAGES = ['Telugu', 'Hindi', 'English', 'Tamil', 'Malayalam', 'Kannada', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'Odia', 'Urdu'];
/** One tap in onboarding: the languages people in a city usually work in. */
export const CITY_LANGUAGES: Record<string, string[]> = {
  Hyderabad: ['Telugu', 'Hindi', 'English'],
  Mumbai: ['Hindi', 'Marathi', 'English'],
  Chennai: ['Tamil', 'English'],
  Kochi: ['Malayalam', 'English'],
  Bengaluru: ['Kannada', 'English'],
  Kolkata: ['Bengali', 'Hindi', 'English'],
  Visakhapatnam: ['Telugu', 'English'],
};
