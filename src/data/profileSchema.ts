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
  formats: { id: 'formats', label: 'Formats', type: 'multi', options: ['Spherical', 'Anamorphic', 'Vintage', 'Large format', 'Super 16', 'Vertical'], visibility: 'public' },
  dopSpecial: { id: 'dopSpecial', label: 'Specialisations', type: 'multi', options: ['Low light', 'Night exteriors', 'Available light', 'Action', 'Songs', 'Dialogue', 'Outdoor', 'Handheld', 'Underwater', 'Aerial', 'Car work', 'VFX plates', 'Documentary', 'Music video', 'Commercials'], visibility: 'public' },
  ownsKit: { id: 'ownsKit', label: 'Own kit', type: 'choice', options: ['Yes', 'Some', 'No'], visibility: 'public' },
  editSoftware: { id: 'editSoftware', label: 'Software', type: 'multi', options: ['Avid Media Composer', 'Adobe Premiere Pro', 'DaVinci Resolve', 'Final Cut Pro', 'After Effects', 'Baselight'], visibility: 'public' },
  editFormats: { id: 'editFormats', label: 'Formats', type: 'multi', options: ['Feature', 'Series', 'Short', 'Documentary', 'Commercial', 'Music video', 'Trailer', 'YouTube'], visibility: 'public' },
  genres: { id: 'genres', label: 'Genres', type: 'multi', options: ['Drama', 'Thriller', 'Comedy', 'Action', 'Horror', 'Romance', 'Documentary', 'Musical'], visibility: 'public' },
  editSpecial: { id: 'editSpecial', label: 'Specialisations', type: 'multi', options: ['Dialogue scenes', 'Action', 'Montage', 'Trailers', 'Multicam', 'Conform and online', 'Grading'], visibility: 'public' },
  soundAreas: { id: 'soundAreas', label: 'Areas', type: 'multi', options: ['Location recording', 'Boom operation', 'Dialogue editing', 'Sound design', 'Foley', 'Mixing', 'Dolby Atmos', 'Music recording'], visibility: 'public' },
  soundTools: { id: 'soundTools', label: 'Tools', type: 'multi', options: ['Sound Devices', 'Zoom F8', 'Pro Tools', 'Nuendo', 'Reaper', 'Logic', 'Ableton', 'FL Studio', 'iZotope RX', 'Lectrosonics wireless'], visibility: 'public' },
  lighting: { id: 'lighting', label: 'Lighting', type: 'multi', options: ['LED', 'HMI', 'Tungsten', 'Kino Flo', 'Practicals'], visibility: 'public' },
  turnaround: { id: 'turnaround', label: 'Turnaround', type: 'choice', options: ['Fast', 'Standard', 'Flexible'], visibility: 'public' },
  roleType: { id: 'roleType', label: 'Role types', type: 'multi', options: ['Lead', 'Supporting', 'Character', 'Junior artist'], visibility: 'public' },
  actingStyle: { id: 'actingStyle', label: 'Acting style', type: 'multi', options: ['Method', 'Theatre', 'Comedy', 'Action'], visibility: 'public' },
  budget: { id: 'budget', label: 'Budgets worked on', type: 'multi', options: ['Low', 'Mid', 'High'], visibility: 'public' },
  musicGenres: { id: 'musicGenres', label: 'Music genres', type: 'multi', options: ['Film score', 'Classical', 'Folk', 'Pop', 'Rock', 'Hip-hop', 'Devotional', 'Experimental'], visibility: 'public' },
  daws: { id: 'daws', label: 'Software', type: 'multi', options: ['Logic', 'Ableton', 'FL Studio', 'Pro Tools', 'Cubase'], visibility: 'public' },
  setTypes: { id: 'setTypes', label: 'Set types', type: 'multi', options: ['Indoor', 'Outdoor', 'Studio', 'Real locations'], visibility: 'public' },
  setScale: { id: 'setScale', label: 'Scale', type: 'multi', options: ['Small sets', 'Large sets', 'Period sets'], visibility: 'public' },
  costumeSpecial: { id: 'costumeSpecial', label: 'Specialisations', type: 'multi', options: ['Contemporary', 'Period', 'Fantasy', 'Celebrity styling'], visibility: 'public' },
  makeupSpecial: { id: 'makeupSpecial', label: 'Specialisations', type: 'multi', options: ['HD make-up', 'Bridal', 'SFX', 'Character make-up', 'Hair styling'], visibility: 'public' },
  vfxSoftware: { id: 'vfxSoftware', label: 'Software', type: 'multi', options: ['Maya', 'Blender', 'Houdini', 'After Effects', 'Nuke', 'Cinema 4D'], visibility: 'public' },
  pipeline: { id: 'pipeline', label: 'Pipelines', type: 'multi', options: ['Film', 'OTT', 'Ads', 'Gaming'], visibility: 'public' },
  danceForms: { id: 'danceForms', label: 'Dance forms', type: 'multi', options: ['Classical', 'Bharatanatyam', 'Kathak', 'Kuchipudi', 'Contemporary', 'Hip-hop', 'Folk', 'Western', 'Bollywood'], visibility: 'public' },
  photoTypes: { id: 'photoTypes', label: 'What you shoot', type: 'multi', options: ['Fashion', 'Product', 'Portrait', 'Event', 'Candid', 'Set stills'], visibility: 'public' },
  photoCameras: { id: 'photoCameras', label: 'Camera systems', type: 'multi', options: ['Canon', 'Sony', 'Nikon', 'Fujifilm', 'Leica'], visibility: 'public' },
  photoLight: { id: 'photoLight', label: 'Lighting style', type: 'multi', options: ['Natural', 'Studio', 'Mixed'], visibility: 'public' },
  artStyle: { id: 'artStyle', label: 'Style', type: 'multi', options: ['Abstract', 'Realism', 'Surrealism', 'Minimal', 'Contemporary', 'Traditional', 'Folk', 'Conceptual'], visibility: 'public' },
  artThemes: { id: 'artThemes', label: 'Themes', type: 'multi', options: ['Nature', 'Spirituality', 'Identity', 'Culture', 'Politics', 'Mythology', 'Urban life'], visibility: 'public' },
  artMood: { id: 'artMood', label: 'Mood', type: 'multi', options: ['Calm', 'Dark', 'Vibrant', 'Meditative', 'Aggressive'], visibility: 'public' },
  artStage: { id: 'artStage', label: 'Career stage', type: 'choice', options: ['Emerging', 'Mid-career', 'Established'], visibility: 'public' },
  artMedium: { id: 'artMedium', label: 'Medium', type: 'multi', options: ['Oil', 'Acrylic', 'Watercolour', 'Ink', 'Charcoal', 'Digital', 'Mixed media'], visibility: 'public' },
  artSurface: { id: 'artSurface', label: 'Surface', type: 'multi', options: ['Canvas', 'Paper', 'Wood', 'Metal', 'Fabric', 'Wall'], visibility: 'public' },
  artTechnique: { id: 'artTechnique', label: 'Technique', type: 'multi', options: ['Impasto', 'Wash', 'Layering', 'Texture', 'Line work', 'Calligraphy'], visibility: 'public' },
};

export const SETS: Record<string, DetailSet> = {
  acting: { id: 'acting', label: 'Acting details', fields: [FIELDS.roleType, FIELDS.actingStyle, FIELDS.playingAge, FIELDS.height, FIELDS.build, FIELDS.hair, FIELDS.eyes, FIELDS.accents] },
  camera: { id: 'camera', label: 'Camera details', fields: [FIELDS.cameras, FIELDS.formats, FIELDS.lighting, FIELDS.dopSpecial, FIELDS.ownsKit] },
  editing: { id: 'editing', label: 'Editing details', fields: [FIELDS.editSoftware, FIELDS.editFormats, FIELDS.genres, FIELDS.editSpecial, FIELDS.turnaround] },
  sound: { id: 'sound', label: 'Sound details', fields: [FIELDS.soundAreas, FIELDS.soundTools, FIELDS.ownsKit] },
  direction: { id: 'direction', label: 'Direction details', fields: [FIELDS.genres, FIELDS.budget] },
  writing: { id: 'writing', label: 'Writing details', fields: [FIELDS.genres] },
  music: { id: 'music', label: 'Music details', fields: [FIELDS.musicGenres, FIELDS.daws] },
  art: { id: 'art', label: 'Art department details', fields: [FIELDS.setTypes, FIELDS.setScale] },
  costume: { id: 'costume', label: 'Costume details', fields: [FIELDS.costumeSpecial] },
  makeup: { id: 'makeup', label: 'Make-up and hair details', fields: [FIELDS.makeupSpecial] },
  vfx: { id: 'vfx', label: 'VFX details', fields: [FIELDS.vfxSoftware, FIELDS.pipeline] },
  dance: { id: 'dance', label: 'Dance details', fields: [FIELDS.danceForms] },
  photography: { id: 'photography', label: 'Photography details', fields: [FIELDS.photoTypes, FIELDS.photoCameras, FIELDS.photoLight] },
  fineart: { id: 'fineart', label: 'Art practice', fields: [FIELDS.artStage, FIELDS.artStyle, FIELDS.artThemes, FIELDS.artMood, FIELDS.artMedium, FIELDS.artSurface, FIELDS.artTechnique] },
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
  director: { sets: ['direction'], skillCategories: [], work: REEL_WORK('Reel', 'Stills', 'Films', 'Add your films', 'A short or a reel shows how you tell a story.') },
  photography: { sets: ['photography'], skillCategories: [], work: { images: 'Portfolio', links: 'Projects', prompt: { title: 'Add your best frames', body: 'Your photographs are how clients choose.' } } },
  dance: { sets: ['dance'], skillCategories: ['dance'], work: REEL_WORK('Reel', 'Stills', 'Performances', 'Add a dance reel', 'Productions want to see you move before they call.') },
  editor: { sets: ['editing'], skillCategories: [], work: REEL_WORK('Reel', 'Frames', 'Sequences and projects', 'Add your reel', 'A reel or a few sequences show your cutting.') },
  colourist: { sets: ['editing'], skillCategories: [], work: REEL_WORK('Reel', 'Before and after', 'Projects', 'Add your reel', 'Show a grade or two.') },
  vfx: { sets: ['vfx'], skillCategories: [], work: REEL_WORK('Reel', 'Frames', 'Projects', 'Add your reel', 'Show a shot breakdown or two.') },
  sound: { sets: ['sound'], skillCategories: ['music'], work: REEL_WORK('Reel', 'Session photos', 'Tracks and projects', 'Add your work', 'A reel or a track lets productions hear what you do.') },
  music: { sets: ['music'], skillCategories: ['music'], work: REEL_WORK('Reel', 'Session photos', 'Tracks and projects', 'Add your work', 'A track lets productions hear what you do.') },
  writing: { sets: ['writing'], skillCategories: [], work: { links: 'Writing samples and projects', prompt: { title: 'Add a writing sample link', body: 'A sample or a project page shows your voice. Share only what you want public.' } } },
  makeup: { sets: ['makeup'], skillCategories: [], work: { images: 'Portfolio', links: 'Projects', prompt: { title: 'Add your portfolio', body: 'Looks you created are how productions choose.' } } },
  costume: { sets: ['costume'], skillCategories: [], work: { images: 'Portfolio', links: 'Projects', prompt: { title: 'Add your portfolio', body: 'Costumes you designed are how productions choose.' } } },
  'production-design': { sets: ['art'], skillCategories: [], work: { images: 'Portfolio', links: 'Projects', prompt: { title: 'Add your portfolio', body: 'Sets and references show your world-building.' } } },
};

const ART_WORK: WorkWords = { images: 'Artworks', links: 'Exhibitions and links', prompt: { title: 'Add your artworks', body: 'A few pieces show your practice before anyone asks.' } };
const FINE_ARTS: Craft[] = ['painting', 'sculpture', 'digital-art', 'illustration', 'installation', 'printmaking', 'mixed-media'];
FINE_ARTS.forEach((c) => (CRAFT_PROFILE[c] = { sets: ['fineart'], skillCategories: [], work: ART_WORK }));

export const craftProfile = (c: Craft): CraftProfile => CRAFT_PROFILE[c] ?? { sets: [], skillCategories: [], work: DEFAULT_WORK };

/** Detail sets for all of a person's crafts, once each. A writer gets none of the acting fields. */
export const setsFor = (crafts: Craft[]) => [...new Set(crafts.flatMap((c) => craftProfile(c).sets))].map((id) => SETS[id]);
export const skillCategoriesFor = (crafts: Craft[]) => [...new Set(crafts.flatMap((c) => craftProfile(c).skillCategories))];

/* ------------------------------------------------------------ other structured fields */

/* One list for the Master Database's Platform, Content type and Open for (which overlapped). */
export const WORK_TYPES = ['Feature', 'Series', 'Short', 'Documentary', 'Ad film', 'Music video', 'Trailers', 'YouTube', 'Theatre', 'Events', 'Live shows', 'Gaming', 'Independent'];

/* ------------------------------------------------------------ role within a craft, level, industry, place */

/** The roles inside a craft (Master Database "Role"). One tap in onboarding, under the craft. */
export const CRAFT_ROLES: Partial<Record<Craft, string[]>> = {
  director: ['Director', 'Assistant Director', 'Second AD'],
  writing: ['Screenwriter', 'Dialogue writer', 'Story writer'],
  cinematographer: ['DOP', 'Camera operator', 'Drone operator'],
  camera: ['Camera operator', 'Focus puller', 'Camera assistant', 'Drone operator'],
  lighting: ['Gaffer', 'Best boy', 'Lighting technician'],
  editor: ['Editor', 'Assistant editor'],
  sound: ['Sound designer', 'Location recordist', 'Boom operator', 'Re-recording mixer'],
  music: ['Music director', 'Composer', 'Singer', 'Instrumentalist'],
  'production-design': ['Production designer', 'Art director', 'Set designer', 'Prop master'],
  costume: ['Costume designer', 'Stylist'],
  makeup: ['Make-up artist', 'Hair stylist'],
  vfx: ['VFX artist', 'Animator', 'Compositor', 'FX TD'],
  dance: ['Dancer', 'Choreographer', 'Assistant choreographer'],
  photography: ['Photographer', 'Assistant photographer'],
  production: ['Producer', 'Line producer', 'Production manager', 'Production assistant'],
};
export const rolesFor = (c: Craft) => CRAFT_ROLES[c] ?? [];

/** Career level (Master Database, Assistants & Crew). Not asked of actors or fine artists, who have their own scales. */
export const LEVELS = ['Fresher', 'Assistant', 'Junior', 'Senior'];

/** Film industries (Master Database "Industry"), each with the language that usually means it. */
export const INDUSTRIES: { id: string; language: string }[] = [
  { id: 'Tollywood', language: 'Telugu' },
  { id: 'Bollywood', language: 'Hindi' },
  { id: 'Kollywood', language: 'Tamil' },
  { id: 'Mollywood', language: 'Malayalam' },
  { id: 'Sandalwood', language: 'Kannada' },
  { id: 'Marathi', language: 'Marathi' },
  { id: 'Bengali', language: 'Bengali' },
  { id: 'Gujarati', language: 'Gujarati' },
  { id: 'Punjabi', language: 'Punjabi' },
  { id: 'Odia', language: 'Odia' },
  { id: 'International', language: 'English' },
];
/** Pre-selected from the languages a person works in; they only confirm. English alone suggests nothing. */
export const industriesFor = (languages: string[]) => INDUSTRIES.filter((i) => i.language !== 'English' && languages.includes(i.language)).map((i) => i.id);

/** State and country come from the city, so nobody is asked for them. */
export const CITY_STATE: Record<string, string> = {
  Hyderabad: 'Telangana',
  Visakhapatnam: 'Andhra Pradesh',
  Vijayawada: 'Andhra Pradesh',
  Mumbai: 'Maharashtra',
  Pune: 'Maharashtra',
  Chennai: 'Tamil Nadu',
  Kochi: 'Kerala',
  Thiruvananthapuram: 'Kerala',
  Bengaluru: 'Karnataka',
  Kolkata: 'West Bengal',
  Delhi: 'Delhi',
  Ahmedabad: 'Gujarat',
  Chandigarh: 'Chandigarh',
  Bhubaneswar: 'Odisha',
};
export const placeFor = (city: string): { state?: string; country?: string } => {
  const state = CITY_STATE[city.trim()];
  return state ? { state, country: 'India' } : {};
};
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

/* ------------------------------------------------------------ artworks (gate 3, fine artists) */

/** What the Master Database asks about each artwork (Fine Arts · Artwork, plus Framed). Asked when a piece is added. */
export const ARTWORK_FIELDS: FieldDef[] = [
  { id: 'type', label: 'Type', type: 'choice', options: ['Original', 'Limited print', 'Open print'], visibility: 'public' },
  { id: 'sale', label: 'Availability', type: 'choice', options: ['For sale', 'Sold', 'Commission', 'Not for sale'], visibility: 'public' },
  { id: 'price', label: 'Price range', type: 'choice', options: ['Under ₹10k', '₹10k–50k', '₹50k–2L', '₹2L+'], visibility: 'public' },
  { id: 'framed', label: 'Framed', type: 'choice', options: ['Yes', 'No'], visibility: 'public' },
  { id: 'coa', label: 'Certificate of authenticity', type: 'choice', options: ['Yes', 'No'], visibility: 'public' },
  { id: 'rights', label: 'Reproduction rights available', type: 'choice', options: ['Yes', 'No'], visibility: 'public' },
];
/** A price is only asked when the piece can be bought. */
export const PRICED = ['For sale', 'Commission'];
export type ArtworkDetails = Partial<Record<'type' | 'sale' | 'price' | 'framed' | 'coa' | 'rights', string>>;
