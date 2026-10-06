import type { IndustryEvent, ProjectUpdate,
  Conversation,
  Credit,
  Interest,
  Media,
  NetworkEvent,
  Notification,
  Opportunity,
  Org,
  Party,
  Person,
  Post,
  Project,
} from './types';

/**
 * Media library. Each entry points at its intended file; until that file is delivered the cover named as
 * fallback stands in (see docs/IMAGE_PROMPTS.md).
 */
const LIB: Record<string, [string, string?]> = {
  neela: ['covers/neela'],
  quiet: ['covers/quiet-hours'],
  faultlines: ['covers/faultlines'],
  chai: ['covers/morning-ritual'],
  neonmonsoon: ['covers/neon-monsoon'],
  backwaters: ['covers/backwaters'],
  paperboats: ['covers/paper-boats'],
  journalist: ['covers/journalist'],
  saltwater: ['covers/salt-water'],
  homeloan: ['covers/home-loan'],
  coastline: ['covers/coastline'],
  salt2: ['covers/salt-2'],
  monsoonletters: ['posters/monsoon-letters', 'covers/paper-boats'],
  'kaaval-poster': ['posters/kaaval', 'covers/journalist'],
  'poster-faultlines': ['posters/fault-lines', 'covers/faultlines'],
  neeliraat: ['posters/neeli-raat', 'covers/salt-2'],
  'kaaval-1': ['stills/nandini-kaaval', 'covers/journalist'],
  vikramreel: ['stills/vikram-reel', 'covers/backwaters'],
  'sameer-1': ['stills/sameer-charminar', 'covers/salt-2'],
  rushikonda: ['stills/devika-rushikonda', 'covers/coastline'],
  'set-1': ['stills/ishaan-set-1', 'covers/home-loan'],
  'set-2': ['stills/ishaan-set-2', 'covers/morning-ritual'],
  'zoya-v': ['stills/zoya-edit', 'covers/neon-monsoon'],
  'reel-kiran': ['stills/reel-kiran', 'covers/neela'],
  'pf-1': ['stills/kiran-neeli-raat', 'covers/salt-2'],
  'pf-2': ['stills/kiran-monsoon-letters', 'covers/backwaters'],
  'pf-3': ['stills/kiran-fault-lines', 'covers/faultlines'],
  'pf-4': ['stills/kiran-salt', 'covers/salt-water'],
  'pf-5': ['stills/kiran-kaaval-test', 'covers/quiet-hours'],
  'pf-6': ['stills/kiran-kaaval-desert', 'covers/journalist'],
  salt: ['stills/kiran-salt', 'covers/salt-water'],
  chairain: ['stills/chai-rain', 'covers/morning-ritual'],
  'reel-tara': ['stills/reel-tara', 'covers/paper-boats'],
  'tpf-1': ['stills/tara-faultlines', 'covers/quiet-hours'],
  'tpf-2': ['stills/tara-stage', 'covers/neon-monsoon'],
  'tpf-3': ['stills/tara-kitchen', 'covers/home-loan'],
  tworooms: ['stills/tara-stage', 'covers/neon-monsoon'],
};

const m = (id: string, extra: Partial<Media> = {}): Media => {
  const [src, fallback] = LIB[id];
  return { id, kind: 'image', src: `images/${src}.jpg`, fallback: fallback ? `images/${fallback}.jpg` : undefined, ...extra };
};

/**
 * Profile photos for seeded people (prototype fixtures, see public/images/people). Omar Sheikh is left
 * without one on purpose, so the initials fallback stays visible, exactly as for a real person who
 * skipped the photo.
 */
const PHOTO_FIXTURES = ['aditi', 'anvi', 'arjun', 'dev', 'devika', 'farhan', 'ishaan', 'kabir', 'kiran', 'lakshmi', 'meera', 'nandini', 'nikhil', 'priya', 'raghu', 'rhea', 'sameer', 'sana', 'tara', 'teja', 'vikram', 'zoya'];
const photo = (id: string) => (PHOTO_FIXTURES.includes(id) ? `images/people/${id}.jpg` : undefined);

/* ------------------------------------------------------------------ people */

const person = (p: Omit<Person, 'kind'>): Person => ({ kind: 'person', visibility: 'public', photo: photo(p.id), ...p });

export const people: Person[] = [
  person({ id: 'kiran', name: 'Kiran Varma', role: 'Director of Photography', craft: 'cinematographer', city: 'Hyderabad', tone: 2, years: 11, languages: ['Telugu', 'Hindi', 'English'], identityVerified: true, gear: 'Alexa Mini LF, Sony Venice 2' }),
  // A freelance line producer who works with two houses: the demo's "acting for an organisation" persona.
  person({ id: 'aditi', name: 'Aditi Ghosh', role: 'Line Producer', craft: 'production', city: 'Hyderabad', tone: 4, years: 9, languages: ['Telugu', 'Bengali', 'English'], identityVerified: true }),
  person({ id: 'tara', name: 'Tara Menon', role: 'Actor', craft: 'actor', city: 'Mumbai', tone: 5, years: 4, languages: ['Hindi', 'Malayalam', 'English'], identityVerified: true }),
  person({ id: 'meera', name: 'Meera Krishnan', role: 'Film Editor', craft: 'editor', city: 'Kochi', tone: 1, years: 9 }),
  person({ id: 'arjun', name: 'Arjun Rao', role: 'Director', craft: 'director', city: 'Mumbai', tone: 3, years: 7 }),
  person({ id: 'rhea', name: 'Rhea Kapoor', role: 'Colourist', craft: 'colourist', city: 'Hyderabad', tone: 4, years: 6, availableFrom: '5 Oct' }),
  person({ id: 'vikram', name: 'Vikram Sen', role: 'Cinematographer', craft: 'cinematographer', city: 'Kolkata', tone: 0, years: 14 }),
  person({ id: 'devika', name: 'Devika Sharma', role: 'Director', craft: 'director', city: 'Visakhapatnam', tone: 6, years: 5 }),
  person({ id: 'sameer', name: 'Sameer Ali', role: 'Gaffer', craft: 'lighting', city: 'Hyderabad', tone: 7, years: 12, availableFrom: '12 Oct' }),
  person({ id: 'ishaan', name: 'Ishaan Bose', role: 'Production Designer', craft: 'production-design', city: 'Mumbai', tone: 1, years: 10, availableFrom: '3 Nov' }),
  person({ id: 'nandini', name: 'Nandini Rao', role: 'Costume Designer', craft: 'costume', city: 'Chennai', tone: 5, years: 8, availableFrom: '1 Nov' }),
  person({ id: 'farhan', name: 'Farhan Qureshi', role: 'Sound Recordist', craft: 'sound', city: 'Mumbai', tone: 3, years: 9, availableFrom: '20 Oct' }),
  person({ id: 'sana', name: 'Sana Mirza', role: '1st AC', craft: 'camera', city: 'Hyderabad', tone: 4, years: 5, availableFrom: '8 Oct' }),
  person({ id: 'raghu', name: 'Raghu Teja', role: 'Camera Operator', craft: 'camera', city: 'Hyderabad', tone: 0, years: 8 }),
  person({ id: 'kabir', name: 'Kabir Nair', role: 'Writer-Director', craft: 'director', city: 'Hyderabad', tone: 2, years: 3 }),
  person({ id: 'zoya', name: 'Zoya Khan', role: 'Film Editor', craft: 'editor', city: 'Mumbai', tone: 6, years: 4, availableFrom: '14 Oct' }),
  person({ id: 'nikhil', name: 'Nikhil Das', role: '1st AC', craft: 'camera', city: 'Hyderabad', tone: 7, years: 4 }),
  person({ id: 'priya', name: 'Priya Raghavan', role: 'Focus Puller', craft: 'camera', city: 'Chennai', tone: 1, years: 6 }),
  person({ id: 'omar', name: 'Omar Sheikh', role: 'Camera Assistant', craft: 'camera', city: 'Hyderabad', tone: 3, years: 2 }),
  person({ id: 'lakshmi', name: 'Lakshmi Pillai', role: 'Actor', craft: 'actor', city: 'Kochi', tone: 6, years: 12 }),
  person({ id: 'dev', name: 'Dev Malhotra', role: 'Actor', craft: 'actor', city: 'Mumbai', tone: 2, years: 3, visibility: 'private' }),
  person({ id: 'anvi', name: 'Anvi Reddy', role: 'Cinematographer', craft: 'cinematographer', city: 'Hyderabad', tone: 5, years: 3, availableFrom: '15 Oct' }),
  person({ id: 'teja', name: 'Sai Teja', role: 'Steadicam Operator', craft: 'camera', city: 'Hyderabad', tone: 0, years: 7 }),
];

/* -------------------------------------------------------- production houses */

const org = (o: Omit<Org, 'kind'>): Org => ({ kind: 'org', ...o });

export const orgs: Org[] = [
  org({ id: 'konark', name: 'Konark Pictures', city: 'Hyderabad', tone: 0, verified: true, about: 'Telugu and Hindi features since 2011.' }),
  org({ id: 'tidewater', name: 'Tidewater Films', city: 'Kochi', tone: 3, verified: true, about: 'Independent Malayalam features and documentary.' }),
  org({ id: 'saffron', name: 'Saffron Reel Studios', city: 'Mumbai', tone: 5, verified: true, about: 'Streaming series and features.' }),
  org({ id: 'bluelotus', name: 'Blue Lotus Originals', city: 'Mumbai', tone: 1, verified: true, about: 'Long-form series for streaming platforms.' }),
  org({ id: 'northstar', name: 'Northstar Ad Films', city: 'Mumbai', tone: 6, verified: true, about: 'Brand films and commercials.' }),
];

export const parties: Record<string, Party> = Object.fromEntries(
  [...people, ...orgs].map((p) => [p.id, p]),
);

/* ------------------------------------------------------------ opportunities */

export const opportunities: Opportunity[] = [
  {
    id: 'o-neela-dop',
    kind: 'crew',
    role: 'Director of Photography',
    project: 'Neela Akasham',
    projectType: 'Feature film · Telugu',
    orgId: 'konark',
    city: 'Hyderabad & Araku',
    distance: '12 km',
    dates: '18 Oct – 30 Nov',
    compensation: '₹22k–28k / day',
    paid: true,
    closesInDays: 4,
    stage: 'Pre-production',
    language: 'Telugu',
    about:
      'A slow-burn family drama set across one monsoon in the Araku valley. The director wants natural light, long takes and a restrained handheld language. 38 shooting days, with a 4 day recce in early October.',
    lookingFor: ['Feature experience as DoP or 2nd unit DoP', 'Comfortable with available-light exteriors', 'Own or preferred camera package (optional)'],
    questions: ['Which camera systems have you shot a feature on?', 'A link to a scene you lit mostly with available light', 'Are you free for a recce on 12–15 Oct?'],
    match: ['Your role', '12 km away', 'Your dates are free'],
    forCrafts: ['cinematographer'],
    media: m('neela'),
    postedAgo: '1d',
  },
  {
    id: 'o-quiet-hours',
    kind: 'collab',
    role: 'Cinematographer',
    project: 'The Quiet Hours',
    projectType: 'Short film · 20 min',
    authorId: 'kabir',
    collabIntent: 'looking',
    allowDM: false,
    city: 'Visakhapatnam',
    distance: 'Travel covered',
    dates: '9 – 21 Nov',
    compensation: '₹60k flat',
    paid: true,
    stage: 'Funded · casting done',
    about:
      'A coming-of-age story about two sisters in coastal Andhra. Mostly exteriors, golden hour and night. I have a small kit budget and a very patient crew.',
    lookingFor: ['A cinematographer with a poetic, observational eye', 'Happy to work with a lean 6 person unit'],
    match: ['Your role', 'Travel covered'],
    forCrafts: ['cinematographer'],
    media: m('quiet'),
    postedAgo: '3h',
  },
  {
    id: 'o-faultlines-2u',
    kind: 'crew',
    role: 'Second Unit DoP',
    project: 'Fault Lines · Season 2',
    projectType: 'Web series · Hindi',
    orgId: 'bluelotus',
    city: 'Mumbai',
    dates: '3 Nov – 20 Dec',
    compensation: '₹18k–22k / day',
    paid: true,
    closesInDays: 9,
    stage: 'Pre-production',
    language: 'Hindi',
    about: 'Second unit for a 6 episode crime series. Night exteriors, car rigs and a two-day chase sequence.',
    lookingFor: ['Night exterior experience', 'Car rig and process-trailer work'],
    questions: ['A link to a night exterior you shot', 'Have you worked with a process trailer?'],
    match: ['You shot Season 1', '2 of your network are on this crew'],
    highlight: 'You shot Season 1',
    forCrafts: ['cinematographer', 'camera'],
    media: m('faultlines'),
    postedAgo: '2d',
  },
  {
    id: 'o-chai-ad',
    kind: 'crew',
    role: 'Cinematographer',
    project: 'Morning Ritual',
    projectType: 'Brand film · 60s',
    orgId: 'northstar',
    city: 'Hyderabad',
    distance: '6 km',
    dates: '14 – 15 Oct',
    compensation: '₹1.2L flat',
    paid: true,
    closesInDays: 2,
    stage: 'Shoot confirmed',
    about: 'Two-day tabletop and lifestyle shoot for a tea brand. Studio day plus a practical apartment location.',
    lookingFor: ['Tabletop and food experience', 'Comfortable with a Phantom or high-speed setup'],
    questions: ['A link to a tabletop or product film you shot'],
    match: ['Your role', '6 km away'],
    forCrafts: ['cinematographer'],
    media: m('chai'),
    postedAgo: '5h',
  },
  {
    id: 'o-mv-arjun',
    kind: 'collab',
    role: 'Cinematographer + Gaffer',
    project: 'Neon Monsoon',
    projectType: 'Music video · independent',
    authorId: 'arjun',
    collabIntent: 'looking',
    allowDM: true,
    city: 'Hyderabad',
    dates: '26 – 27 Oct',
    compensation: 'Unpaid · credit, travel and meals',
    paid: false,
    stage: 'Self-funded',
    about: 'Independent track by a Hyderabad indie band. One night, practical neon, lots of rain towers. Looking for a DoP who can bring a small lighting team.',
    lookingFor: ['Night and practical-light experience', 'Can bring a gaffer or small lighting crew'],
    match: ['Your role', 'Posted by someone you follow'],
    forCrafts: ['cinematographer', 'lighting'],
    media: m('neonmonsoon'),
    postedAgo: '6h',
  },
  {
    id: 'o-backwaters',
    kind: 'crew',
    role: 'Documentary DoP',
    project: 'Backwaters',
    projectType: 'Docuseries · 4 episodes',
    orgId: 'tidewater',
    city: 'Kochi & Alappuzha',
    dates: 'Jan – Mar 2027',
    compensation: '₹15k / day',
    paid: true,
    closesInDays: 21,
    stage: 'Development',
    about: 'Observational series following three boat-building families. Long stretches on water, small unit, sync sound.',
    lookingFor: ['Observational documentary experience', 'Comfortable operating on water'],
    questions: ['A link to any observational or documentary work'],
    match: ['You worked with Tidewater before'],
    highlight: 'You worked with Tidewater before',
    forCrafts: ['cinematographer'],
    media: m('backwaters'),
    postedAgo: '4d',
  },
  /* Casting and actor-facing opportunities */
  {
    id: 'o-paperboats-lead',
    kind: 'casting',
    role: 'Lead · Meera (28–34)',
    project: 'Paper Boats',
    projectType: 'Web series · Hindi',
    orgId: 'saffron',
    city: 'Mumbai',
    distance: '4 km',
    dates: 'Shoot Dec – Feb',
    compensation: 'Paid · per episode',
    paid: true,
    closesInDays: 6,
    stage: 'Casting',
    language: 'Hindi, some Malayalam',
    about: 'Meera is a Kochi-born schoolteacher who moves to Mumbai after her brother disappears. Quiet, stubborn, very funny when cornered.',
    lookingFor: ['Playing age 28–34', 'Fluent Hindi, conversational Malayalam'],
    questions: ['Languages and dialects you perform in', 'A link to a 2 minute self-tape of the attached scene'],
    audition: { place: 'Studio 4, Andheri West', when: '8 Oct · slots 10:00–17:00', notes: 'Self-tapes accepted until 6 Oct.' },
    match: ['Your playing age', 'Hindi + Malayalam', 'Audition in Mumbai'],
    forCrafts: ['actor'],
    media: m('paperboats'),
    postedAgo: '1d',
  },
  {
    id: 'o-neela-journalist',
    kind: 'casting',
    role: 'Supporting · Journalist',
    project: 'Neela Akasham',
    projectType: 'Feature film · Telugu',
    orgId: 'konark',
    city: 'Shoot in Araku',
    dates: 'Nov, 9 days',
    compensation: 'Paid',
    paid: true,
    closesInDays: 5,
    stage: 'Casting',
    about: 'A Delhi journalist who arrives in the valley halfway through the story. Telugu lines can be coached.',
    lookingFor: ['Playing age 26–35', 'Hindi fluent, willing to learn Telugu lines'],
    questions: ['Languages you perform in', 'A link to a self-tape of the attached scene'],
    audition: { place: 'Mumbai · Versova casting office', when: '11 Oct', notes: 'This role auditions in Mumbai, not Hyderabad.' },
    match: ['Audition in Mumbai', 'Your playing age'],
    highlight: 'Auditions in Mumbai',
    forCrafts: ['actor'],
    media: m('journalist'),
    postedAgo: '2d',
  },
  {
    id: 'o-devika-short',
    kind: 'collab',
    role: 'Two actors, 20s',
    project: 'Salt Water',
    projectType: 'Short film · 12 min',
    authorId: 'devika',
    collabIntent: 'looking',
    allowDM: true,
    city: 'Visakhapatnam',
    dates: '1 – 4 Dec',
    compensation: '₹15k / day',
    paid: true,
    stage: 'Funded',
    about: 'Two friends, one last swim before one of them leaves the city. Dialogue-light, very physical.',
    lookingFor: ['Comfortable in the sea', 'Telugu or Hindi'],
    match: ['Your playing age', 'Posted by someone you follow'],
    forCrafts: ['actor'],
    media: m('saltwater'),
    postedAgo: '8h',
  },
  {
    id: 'o-northstar-mother',
    kind: 'casting',
    role: 'Young parent · 30s',
    project: 'Home Loan Film',
    projectType: 'Commercial · 45s',
    orgId: 'northstar',
    city: 'Mumbai',
    dates: '20 Oct, 1 day',
    compensation: '₹45k + usage',
    paid: true,
    closesInDays: 3,
    stage: 'Casting',
    about: 'Warm, natural performance. Kitchen table scene with a child actor (guardian present throughout).',
    lookingFor: ['Natural, unforced performance', 'Available 20 Oct'],
    questions: ['A link to a 30 second intro clip'],
    audition: { place: 'Self-tape only', when: 'Until 12 Oct', notes: 'No in-person round.' },
    match: ['Mumbai', 'Your dates are free'],
    forCrafts: ['actor'],
    media: m('homeloan'),
    postedAgo: '10h',
  },
  /* Network-only collaborations */
  {
    id: 'o-gaffer-arjun',
    kind: 'collab',
    role: 'Gaffer',
    project: 'Coastline',
    projectType: 'Ad film · 2 days',
    authorId: 'arjun',
    collabIntent: 'looking',
    allowDM: true,
    city: 'Mumbai',
    dates: '22 – 23 Oct',
    compensation: '₹20k / day',
    paid: true,
    stage: 'Shoot confirmed',
    about: 'Lean two-day ad in Alibaug. Mostly daylight with a dusk scene on the beach.',
    lookingFor: ['Gaffer with own basic kit', 'Mumbai based'],
    match: [],
    forCrafts: ['lighting'],
    media: m('coastline'),
    postedAgo: '4h',
  },
  {
    id: 'o-kiran-ac',
    kind: 'collab',
    role: '1st AC',
    project: 'Salt 2',
    projectType: 'Short film · sequel',
    authorId: 'kiran',
    collabIntent: 'looking',
    allowDM: false,
    city: 'Hyderabad',
    dates: '2 – 6 Nov',
    compensation: '₹6k / day',
    paid: true,
    stage: 'Funded',
    about: 'Follow-up to my 2022 short. 5 days, mostly handheld, Alexa Mini LF with vintage primes.',
    lookingFor: ['Pulled focus on handheld work', 'Hyderabad based'],
    match: [],
    forCrafts: ['camera'],
    media: m('salt2'),
    postedAgo: '2d',
  },
  /*
   * V30: every craft on the onboarding list has at least one opportunity, so nobody finishes setup to
   * an empty "For you" (V29 research: suggested roles missing after onboarding for editors, sound,
   * writers, directors...). All attach to existing houses, people and projects; none to the houses
   * Aditi acts for, so the Production House screens are unchanged.
   */
  {
    id: 'o-faultlines-editor',
    kind: 'crew',
    role: 'Episode Editor',
    project: 'Fault Lines · Season 2',
    projectType: 'Web series · Hindi',
    orgId: 'bluelotus',
    city: 'Mumbai',
    dates: '15 Dec – 28 Feb',
    compensation: '₹1.4L–1.8L / episode',
    paid: true,
    closesInDays: 12,
    stage: 'Pre-production',
    language: 'Hindi',
    about: 'Cutting episodes 4 to 6 alongside the lead editor. Avid, in-house suite in Andheri, remote reviews twice a week.',
    lookingFor: ['Long-form drama editing', 'Avid Media Composer'],
    questions: ['Which series or features have you cut?'],
    match: ['Your craft'],
    forCrafts: ['editor'],
    media: m('faultlines'),
    postedAgo: '1d',
  },
  {
    id: 'o-faultlines-colour',
    kind: 'crew',
    role: 'Colourist',
    project: 'Fault Lines · Season 2',
    projectType: 'Web series · Hindi',
    orgId: 'bluelotus',
    city: 'Mumbai',
    dates: 'Feb – Mar',
    compensation: '₹45k–60k / day',
    paid: true,
    stage: 'Pre-production',
    language: 'Hindi',
    about: 'Grading six episodes for a streaming HDR delivery. The Season 1 look carries over, with a colder palette for the night work.',
    lookingFor: ['HDR delivery experience', 'DaVinci Resolve'],
    match: ['Your craft'],
    forCrafts: ['colourist'],
    media: m('faultlines'),
    postedAgo: '3d',
  },
  {
    id: 'o-faultlines-vfx',
    kind: 'crew',
    role: 'VFX Supervisor',
    project: 'Fault Lines · Season 2',
    projectType: 'Web series · Hindi',
    orgId: 'bluelotus',
    city: 'Mumbai',
    dates: 'Nov – Mar',
    compensation: 'Paid · per project',
    paid: true,
    stage: 'Pre-production',
    language: 'Hindi',
    about: 'On-set supervision for the two-day chase and car rigs, then about 120 cleanup and comp shots in post.',
    lookingFor: ['On-set supervision', 'Vehicle work and cleanup'],
    match: ['Your craft'],
    forCrafts: ['vfx'],
    media: m('faultlines'),
    postedAgo: '4d',
  },
  {
    id: 'o-faultlines-coordinator',
    kind: 'crew',
    role: 'Production Coordinator',
    project: 'Fault Lines · Season 2',
    projectType: 'Web series · Hindi',
    orgId: 'bluelotus',
    city: 'Mumbai',
    dates: '1 Nov – 20 Dec',
    compensation: '₹70k / month',
    paid: true,
    stage: 'Pre-production',
    language: 'Hindi',
    about: 'Call sheets, unit moves and permissions for a 45-day schedule across Mumbai.',
    lookingFor: ['Series or feature coordination', 'Mumbai permissions'],
    match: ['Your craft'],
    forCrafts: ['production'],
    media: m('faultlines'),
    postedAgo: '2d',
  },
  {
    id: 'o-homeloan-director',
    kind: 'crew',
    role: 'Director',
    project: 'Home Loan Film',
    projectType: 'Brand film · 90s',
    orgId: 'northstar',
    city: 'Mumbai',
    dates: '8 – 10 Nov',
    compensation: '₹2.5L flat',
    paid: true,
    closesInDays: 6,
    stage: 'Pitching',
    about: 'A 90-second film about a family moving into their first home. Script locked; we are looking for a director with a warm, observational touch.',
    lookingFor: ['Narrative ads or short films', 'Working with non-actors'],
    questions: ['A link to a film you directed that feels close to this tone'],
    match: ['Your craft'],
    forCrafts: ['director'],
    media: m('homeloan'),
    postedAgo: '1d',
  },
  {
    id: 'o-homeloan-design',
    kind: 'crew',
    role: 'Production Designer',
    project: 'Home Loan Film',
    projectType: 'Brand film · 90s',
    orgId: 'northstar',
    city: 'Mumbai',
    dates: '1 – 10 Nov',
    compensation: '₹35k / day',
    paid: true,
    stage: 'Pre-production',
    about: 'One apartment, dressed twice: empty on moving day, lived-in a year later. Costume and make-up report to you.',
    lookingFor: ['Domestic interiors', 'Quick turnarounds'],
    match: ['Your craft'],
    forCrafts: ['production-design', 'costume', 'makeup'],
    media: m('homeloan'),
    postedAgo: '2d',
  },
  {
    id: 'o-quiet-sound',
    kind: 'collab',
    role: 'Sound recordist and composer',
    project: 'The Quiet Hours',
    projectType: 'Short film · 20 min',
    authorId: 'kabir',
    collabIntent: 'looking',
    allowDM: false,
    city: 'Visakhapatnam',
    distance: 'Travel covered',
    dates: '9 – 21 Nov',
    compensation: '₹40k flat',
    paid: true,
    stage: 'Funded · casting done',
    about: 'Mostly exteriors by the sea. I need clean dialogue on location, and later a sparse score. One person or two, both welcome.',
    lookingFor: ['Location sound on a lean unit', 'Or a composer who likes silence'],
    match: ['Travel covered'],
    forCrafts: ['sound', 'music'],
    media: m('quiet'),
    postedAgo: '5h',
  },
  {
    id: 'o-saltwater-writer',
    kind: 'collab',
    role: 'Co-writer',
    project: 'Salt Water',
    projectType: 'Short film · Telugu',
    authorId: 'devika',
    collabIntent: 'looking',
    allowDM: true,
    city: 'Visakhapatnam',
    dates: 'Remote · Oct – Nov',
    compensation: 'Unpaid · co-writing credit',
    paid: false,
    stage: 'Writing',
    about: 'A two-hander set in a fishing village. The first draft is done; I want a co-writer who can sharpen the dialogue in Telugu.',
    lookingFor: ['Telugu dialogue', 'Short film writing'],
    match: ['Your craft'],
    forCrafts: ['writing', 'director'],
    media: m('saltwater'),
    postedAgo: '1d',
  },
];

/* ---------------------------------------------------------- project updates (docs/HOME.md) */

/** Material changes this week. Home turns them into its "In production" unit and, when significant, its lead. */
export const projectUpdates: ProjectUpdate[] = [
  { id: 'pu1', projectId: 'backwaters', kind: 'crew', to: 'Editor', actorIds: ['meera'], hoursAgo: 20 },
  { id: 'pu2', projectId: 'neela', kind: 'stage', from: 'Pre-production', to: 'Shooting', hoursAgo: 30 },
  { id: 'pu3', projectId: 'kaaval', kind: 'crew', to: 'Colourist', actorIds: ['rhea'], hoursAgo: 46 },
  { id: 'pu4', projectId: 'backwaters', kind: 'stage', from: 'Development', to: 'Pre-production', hoursAgo: 70 },
  { id: 'pu5', projectId: 'kaaval', kind: 'dates', to: 'Festival premiere confirmed', hoursAgo: 52 },
  { id: 'pu6', projectId: 'neela', kind: 'crew', to: 'Gaffer', actorIds: ['sameer'], hoursAgo: 90 },
  { id: 'pu7', projectId: 'monsoon', kind: 'stage', from: 'Post-production', to: 'Released', hoursAgo: 120 },
  { id: 'pu8', projectId: 'neeliraat', kind: 'crew', to: 'Poster artist', hoursAgo: 60 },
];

/* ---------------------------------------------------------- industry events (docs/EVENTS.md) */

/**
 * Curated events, dated relative to when the prototype loads so they are always upcoming. Four are here
 * only to prove the rules hide them: an unverified host, a cancelled meetup, a past screening and an
 * "audition" (auditions are roles, never events).
 */
export const HOME_REQUEST_EVENT_ID = 'ev-konark-crew';

export function seedEvents(now: number): IndustryEvent[] {
  const day = (d: number, h: number, m = 0) => {
    const t = new Date(now + d * 864e5);
    t.setUTCHours(h - 5, m - 30, 0, 0); // h:m in India (UTC+5:30)
    return t.getTime();
  };
  return [
    { id: 'ev-kaaval-premiere', type: 'screening', title: 'Kaaval · festival premiere', hostId: 'saffron', projectId: 'kaaval', speakerIds: ['kiran', 'rhea'], city: 'Mumbai', venue: 'PVR Juhu, Screen 2', start: day(6, 19, 30), price: { kind: 'free' }, summary: 'The premiere screening, followed by a conversation with the camera and colour team.', status: 'scheduled', reviewed: true, audience: 'everyone', publishedAt: day(-6, 10), interestedCount: 140 },
    { id: 'ev-konark-crew', type: 'meetup', title: 'Camera crew evening', hostId: 'konark', city: 'Hyderabad', venue: 'Konark Pictures, Jubilee Hills', start: day(1, 18, 30), price: { kind: 'free' }, summary: 'An informal evening with the Neela Akasham camera team before the shoot moves to Araku. Request a place with your email and an optional note. Konark reviews each request before confirming attendance; your contact details stay private to the organiser.', capacity: 20, status: 'scheduled', audience: ['cinematographer', 'camera', 'lighting'], publishedAt: day(-2, 12), interestedCount: 18 },
    { id: 'ev-tara-screen-acting', type: 'workshop', title: 'Screen acting for working actors', hostId: 'tara', city: 'Mumbai', venue: 'Prithvi House, Juhu', start: day(10, 10, 0), price: { kind: 'free' }, summary: 'A day of scene work in front of the camera, for actors 18 and over with some screen experience. Request a place to join this session.', status: 'scheduled', reviewed: true, audience: ['actor'], publishedAt: day(-1, 9), interestedCount: 22 },
    { id: 'ev-backwaters-wip', type: 'screening', title: 'Backwaters · work-in-progress screening', hostId: 'tidewater', projectId: 'backwaters', speakerIds: ['meera'], city: 'Kochi', venue: 'Kavitha Theatre', start: day(12, 17, 0), price: { kind: 'free' }, summary: 'Forty minutes of the documentary in progress, with notes from the edit.', status: 'scheduled', audience: 'everyone', publishedAt: day(-4, 11), interestedCount: 31 },
    { id: 'ev-kochi-market', type: 'festival', title: 'Kochi Film Market', hostId: 'tidewater', city: 'Kochi', venue: 'Bolgatty Palace', start: day(20, 9, 30), end: day(22, 19, 0), price: { kind: 'free' }, summary: 'Three days of pitches, co-production meetings and screenings for Malayalam and Tamil projects.', status: 'scheduled', link: 'https://example.com/kfm', audience: ['director', 'writing', 'production'], publishedAt: day(-12, 10), interestedCount: 410, editorial: true },
    { id: 'ev-writers-read', type: 'meetup', title: "Writers' table read night", hostId: 'bluelotus', city: 'Mumbai', venue: 'Blue Lotus studio, Andheri', start: day(8, 19, 0), price: { kind: 'free' }, summary: 'Two short scripts read aloud by working actors, then a conversation about the drafts.', status: 'scheduled', audience: ['writing', 'director', 'actor'], publishedAt: day(-3, 15), interestedCount: 40 },
    { id: 'ev-konark-lens', type: 'workshop', title: 'Anamorphic lens day', hostId: 'konark', city: 'Hyderabad', venue: 'Konark Pictures, Jubilee Hills', start: day(4, 10), price: { kind: 'free' }, summary: 'A hands-on morning with the Neela Akasham lens package: test charts, flares and night exteriors.', status: 'scheduled', reviewed: true, audience: ['cinematographer', 'camera'], publishedAt: day(-1, 18), interestedCount: 26 },
    { id: 'ev-konark-mixer', type: 'meetup', title: 'Konark crew mixer', hostId: 'konark', city: 'Hyderabad', venue: 'Konark Pictures, Jubilee Hills', start: day(9, 19), price: { kind: 'free' }, summary: 'Crew from every department on Konark productions, one evening.', status: 'scheduled', audience: 'everyone', publishedAt: day(-5, 12), interestedCount: 64 },
    { id: 'ev-sound-walk', type: 'workshop', title: 'Recording on location: a sound walk', hostId: 'bluelotus', speakerIds: ['farhan'], city: 'Hyderabad', venue: 'Golconda Fort, main gate', start: day(5, 7), price: { kind: 'free' }, summary: 'A morning recording ambiences around the fort, then a listening session.', status: 'scheduled', reviewed: true, audience: ['sound', 'music'], publishedAt: day(0, 9), interestedCount: 6 },
    // Hidden by the rules, on purpose:
    { id: 'ev-rhea-colour', type: 'workshop', title: 'Colour for night exteriors', hostId: 'rhea', city: 'Hyderabad', venue: 'Online', start: day(5, 11), price: { kind: 'free' }, summary: 'A hands-on grading session.', status: 'scheduled' },
    { id: 'ev-sound-meetup', type: 'meetup', title: 'Sound recordists meetup', hostId: 'northstar', city: 'Mumbai', venue: 'Northstar, Lower Parel', start: day(4, 18), price: { kind: 'free' }, summary: 'Cancelled by the host.', status: 'cancelled' },
    { id: 'ev-neeli-raat', type: 'screening', title: 'Neeli Raat anniversary screening', hostId: 'konark', projectId: 'neeliraat', city: 'Hyderabad', venue: 'Prasads', start: day(-3, 19), price: { kind: 'free' }, summary: 'Two years on.', status: 'scheduled' },
    { id: 'ev-fake-audition', type: 'workshop', title: 'Open auditions: lead role in a feature', hostId: 'saffron', city: 'Mumbai', venue: 'Andheri', start: day(9, 11), price: { kind: 'free' }, summary: 'Register to audition.', status: 'scheduled' },
  ];
}

/* ---------------------------------------------------------- network events */

export const networkEvents: Record<string, NetworkEvent[]> = {
  kiran: [
    {
      id: 'n1', kind: 'credit', actorIds: ['meera'], time: '2h', weight: 1, isNew: true,
      title: 'Monsoon Letters', detail: 'Editor', orgId: 'tidewater',
      media: [m('monsoonletters')],
    },
    {
      id: 'n2', kind: 'credit', actorIds: ['sana', 'raghu', 'teja', 'anvi'], time: '5h', weight: 1,
      title: 'Fault Lines · Season 1', detail: 'Camera department', orgId: 'bluelotus',
    },
    {
      id: 'n6', kind: 'project', actorIds: ['nandini'], time: '9h', weight: 2,
      title: 'Kaaval', detail: 'Costume design · period drama',
      media: [m('kaaval-1')],
    },
    {
      id: 'n3', kind: 'collab', actorIds: ['arjun'], time: '4h', weight: 3,
      opportunityId: 'o-gaffer-arjun',
    },
    {
      id: 'n4', kind: 'available', actorIds: ['rhea'], time: '1d', weight: 4,
      detail: 'From 5 Oct · Hyderabad & remote',
    },
    {
      id: 'n5', kind: 'reel', actorIds: ['vikram'], time: '2d', weight: 5,
      title: 'Showreel 2026',
      media: [m('vikramreel', { kind: 'video', duration: '2:14' })],
    },
    {
      id: 'n7', kind: 'portfolio', actorIds: ['sameer'], time: '3d', weight: 6,
      title: '4 new stills', detail: 'Night exteriors, Charminar',
      media: [m('sameer-1')],
    },
  ],
  tara: [
    {
      id: 't1', kind: 'credit', actorIds: ['lakshmi'], time: '1d', weight: 1,
      title: 'Monsoon Letters', detail: 'Lead cast · Annamma', orgId: 'tidewater',
      media: [m('monsoonletters')],
    },
  ],
};

/* ------------------------------------------------------------------- posts */

export const posts: Post[] = [
  {
    id: 'p1', authorId: 'devika', time: '2d', likes: 124, comments: 12, project: 'Salt Water',
    text: 'Last light on the Rushikonda set. Grateful for a crew that moves this fast when the sun does not wait.',
    media: [m('rushikonda')],
  },
  {
    id: 'p2', authorId: 'sameer', time: '3d', likes: 58, comments: 21,
    text: 'Lens test notes: the Cooke S4s held up much better than expected under sodium vapour. Posting the chart tomorrow for anyone prepping night exteriors in Old City.',
    media: [],
  },
  {
    id: 'p3', authorId: 'ishaan', time: '4d', likes: 212, comments: 17, project: 'Fault Lines · Season 2',
    text: 'Set build, day 9. The police station finally has its ceiling fans.',
    media: [m('set-1'), m('set-2')],
  },
  {
    id: 'p4', authorId: 'zoya', time: '5d', likes: 87, comments: 6,
    text: 'Cut this in one night for a friend. Forty seconds, zero sleep.',
    media: [m('zoya-v', { kind: 'video', duration: '0:40' })],
  },
  {
    id: 'p5', authorId: 'vikram', time: '6d', likes: 143, comments: 9, project: 'Monsoon Letters',
    text: 'Second unit on the river. We waited three hours for this fog and it gave us eleven minutes.',
    media: [m('pf-2'), m('backwaters'), m('paperboats')],
  },
  {
    id: 'p6', authorId: 'rhea', time: '1w', likes: 96, comments: 14,
    text: 'Grade pass on a night exterior. Keeping the sodium orange, pulling the cyan out of the shadows.',
    media: [m('neonmonsoon')],
  },
  {
    id: 'p7', authorId: 'nandini', time: '1w', likes: 77, comments: 5, project: 'Kaaval',
    text: 'Fitting day. Every uniform aged by hand, two washes and a week in the sun.',
    media: [m('kaaval-1'), m('journalist')],
  },
  {
    id: 'p8', authorId: 'anvi', time: '1w', likes: 188, comments: 22,
    text: 'Test roll on the new lenses. Chai, rain, a window. Nothing else needed.',
    media: [m('chairain')],
  },
  {
    id: 'p9', authorId: 'farhan', time: '2w', likes: 41, comments: 3,
    text: 'Room tone at 5am before the market opens. Forty seconds of the city breathing.',
    media: [m('salt2', { kind: 'video', duration: '0:40' })],
  },
  {
    id: 'p10', authorId: 'arjun', time: '2w', likes: 256, comments: 31,
    text: 'Recce in the hills. This valley is the whole first act.',
    media: [m('neela'), m('quiet')],
  },
  {
    id: 'p11', authorId: 'lakshmi', time: '2w', likes: 132, comments: 11,
    text: 'Table read, day one. Nervous in the best way.',
    media: [m('homeloan')],
  },
  {
    id: 'p12', authorId: 'teja', time: '3w', likes: 64, comments: 4,
    text: 'Steadicam through the whole corridor in one take. Four attempts, legs gone.',
    media: [m('sameer-1', { kind: 'video', duration: '1:12' })],
  },
  {
    id: 'p13', authorId: 'kabir', time: '3w', likes: 49, comments: 8,
    text: 'Draft four is done. Cut the flashback, kept the ending.',
    media: [],
  },
  {
    id: 'p14', authorId: 'priya', time: '3w', likes: 58, comments: 2,
    text: 'Pulling focus on a 135 at the beach, wind at 30. Marks on everything.',
    media: [m('coastline')],
  },
  {
    id: 'p15', authorId: 'ishaan', time: '4w', likes: 118, comments: 9, project: 'Fault Lines · Season 2',
    text: 'Reference wall for the station interiors. Every photo is from a real district office.',
    media: [m('faultlines'), m('set-2')],
  },
  {
    id: 'p16', authorId: 'devika', time: '1mo', likes: 201, comments: 19, project: 'Salt Water',
    text: 'The first frame we shot. Still my favourite.',
    media: [m('saltwater')],
  },
];

/* ----------------------------------------------------------- credibility */

export const credits: Record<string, Credit[]> = {
  kiran: [
    { id: 'cr1', title: 'Kaaval', year: '2026', role: 'Director of Photography', department: 'Camera', orgId: 'saffron', format: 'Feature film', status: 'Post-production', media: m('kaaval-poster') },
    { id: 'cr2', title: 'Monsoon Letters', year: '2025', role: 'Additional Camera', department: 'Camera', orgId: 'tidewater', format: 'Feature film', status: 'Released', media: m('monsoonletters') },
    { id: 'cr3', title: 'Fault Lines · S1', year: '2024', role: 'DoP, Episodes 3–5', department: 'Camera', orgId: 'bluelotus', format: 'Web series', status: 'Released', media: m('poster-faultlines') },
    { id: 'cr4', title: 'Neeli Raat', year: '2023', role: 'Camera Operator', department: 'Camera', orgId: 'konark', format: 'Feature film', status: 'Released', media: m('neeliraat') },
  ],
  tara: [
    { id: 'tc1', title: 'Fault Lines · S1', year: '2024', role: 'Inspector Rao (recurring)', department: 'Cast', orgId: 'bluelotus', format: 'Web series', status: 'Released', media: m('poster-faultlines') },
  ],
};

/** Credits a production has issued that the person hasn't accepted yet. Never created by the person. */
export const pendingCredits: Record<string, Credit[]> = { kiran: [], tara: [], aditi: [] };

export const projects: Record<string, Project[]> = {
  kiran: [
    { id: 'pr1', title: 'Salt', year: '2022', role: 'Director of Photography', format: 'Short film · 18 min', note: 'Official selection at two regional festivals.', media: m('salt') },
    { id: 'pr2', title: 'Chai & Rain', year: '2021', role: 'Cinematographer', format: 'Music video', note: 'Independent release, 1.2M views.', media: m('chairain') },
  ],
  tara: [
    { id: 'tp1', title: 'Two Rooms', year: '2023', role: 'Lead', format: 'Theatre · Prithvi', note: '32 shows across Mumbai and Pune.', media: m('tworooms') },
  ],
};

export const portfolio: Record<string, Media[]> = {
  aditi: [m('set-1'), m('pf-1')],
  kiran: [
    m('reel-kiran', { kind: 'video', duration: '2:41', caption: 'Showreel 2026' }),
    m('pf-1', { caption: 'Neeli Raat · night exterior' }),
    m('pf-2', { caption: 'Monsoon Letters · 2nd unit' }),
    m('pf-3', { caption: 'Fault Lines · Ep 4' }),
    m('pf-4', { caption: 'Salt · opening' }),
    m('pf-5', { caption: 'Kaaval · test' }),
    m('pf-6', { caption: 'Kaaval · Rajasthan unit' }),
  ],
  tara: [
    m('reel-tara', { kind: 'video', duration: '1:52', caption: 'Acting reel' }),
    m('tpf-1', { caption: 'Fault Lines · Ep 2' }),
    m('tpf-2', { caption: 'Two Rooms · stage' }),
    m('tpf-3', { caption: 'Home Loan Film · test' }),
  ],
};

export const about: Record<string, string> = {
  aditi: 'Line producer on Telugu and Malayalam features. I work with Konark Pictures and Tidewater Films, mostly from prep to wrap.',
  kiran:
    'Cinematographer working across Telugu and Hindi features, series and brand films. I like available light, long lenses and crews that talk to each other. Most at home on nights and monsoon exteriors.',
  tara:
    'Mumbai-based actor trained at a theatre repertory in Kochi. Four years on stage, two in series. Hindi, Malayalam and English. Comfortable with physical, dialogue-light work.',
};

/* ----------------------------------------------------------------- inbox */

export const conversations: Record<string, Conversation[]> = {
  /* The same conversation as Kiran's c-konark, seen from the house side. */
  aditi: [
    {
      id: 'c-aditi-kiran', withId: 'kiran', asId: 'konark', unread: 0, updated: '12m', media: m('neela'),
      context: { kind: 'crew', label: 'Crew job', detail: 'Director of Photography · Neela Akasham', refId: 'o-neela-dop' },
      messages: [
        { id: 'm1', from: 'them', text: 'Sent my profile, reel and answers for the DoP role. Happy to talk through the lookbook.', time: 'Yesterday 18:40' },
        { id: 'm2', from: 'me', text: 'Hi Kiran, thanks for responding. Our director would like to meet. Could you do a recce with him in Araku on 12 Oct?', time: '12m' },
      ],
    },
  ],
  kiran: [
    {
      id: 'c-konark', withId: 'konark', orgOwned: true, unread: 1, updated: '12m', media: m('neela'),
      action: { label: 'Confirm 12 Oct', reply: 'Confirmed for the recce on 12 Oct. I will be in Araku the evening before.' },
      context: { kind: 'crew', label: 'Crew job', detail: 'Director of Photography · Neela Akasham', refId: 'o-neela-dop' },
      messages: [
        { id: 'm1', from: 'me', text: 'Sent my profile, reel and answers for the DoP role. Happy to talk through the lookbook.', time: 'Yesterday 18:40' },
        { id: 'm2', from: 'them', senderName: 'Aditi Ghosh · Konark Pictures', text: 'Hi Kiran, thanks for responding. Our director would like to meet. Could you do a recce with him in Araku on 12 Oct?', time: '12m' },
      ],
    },
    {
      id: 'c-arjun', withId: 'arjun', unread: 0, updated: '3h', media: m('coastline'),
      context: { kind: 'collab', label: 'Collaboration', detail: 'Gaffer · Coastline ad film', refId: 'o-gaffer-arjun' },
      messages: [
        { id: 'm1', from: 'me', text: 'Saw your gaffer post. Sameer Ali lit two of my night shoots, he is in Mumbai that week. Want an intro?', time: '3h' },
        { id: 'm2', from: 'them', text: 'Yes please. Also, still keen on you for Neon Monsoon if the dates work.', time: '3h' },
      ],
    },
    {
      id: 'c-tidewater', withId: 'tidewater', orgOwned: true, unread: 0, updated: '1d', media: m('monsoonletters'),
      context: { kind: 'credit', label: 'Credit', detail: 'Additional Camera · Monsoon Letters' },
      messages: [
        { id: 'm1', from: 'them', senderName: 'Credits desk', text: 'We have added your Additional Camera credit for Monsoon Letters. Let us know if anything looks wrong.', time: '1d' },
      ],
    },
    {
      id: 'c-meera', withId: 'meera', unread: 0, updated: '2d', media: m('backwaters'),
      context: { kind: 'project', label: 'Project', detail: 'Monsoon Letters' },
      messages: [
        { id: 'm1', from: 'them', text: 'The river sequence finally cuts together. Your 2nd unit stuff saved it.', time: '2d' },
        { id: 'm2', from: 'me', text: 'That makes my week. Send me the grade when Rhea is done?', time: '2d' },
      ],
    },
  ],
  tara: [
    {
      id: 'c-saffron', withId: 'saffron', orgOwned: true, unread: 1, updated: '1h', media: m('paperboats'),
      action: { label: 'Confirm 14:30', reply: 'Confirmed for 8 Oct at 14:30. Thank you.' },
      context: { kind: 'casting', label: 'Casting', detail: 'Lead · Meera · Paper Boats', refId: 'o-paperboats-lead' },
      messages: [
        { id: 'm1', from: 'them', senderName: 'Casting team', text: 'Hi Tara, we would like to see you in person on 8 Oct at 14:30. Please confirm here.', time: '1h' },
      ],
    },
  ],
};

export const interests: Record<string, Interest[]> = {
  kiran: [
    { id: 'i1', personId: 'nikhil', opportunityId: 'o-kiran-ac', note: 'Pulled focus on two handheld features last year.', time: '2h' },
    { id: 'i2', personId: 'priya', opportunityId: 'o-kiran-ac', note: 'Can travel from Chennai, have worked with vintage Cookes.', time: '5h' },
    { id: 'i3', personId: 'omar', opportunityId: 'o-kiran-ac', time: '1d' },
  ],
  tara: [],
  /* The house reviews people who responded to its roles with the same interest model as individuals. */
  konark: [
    { id: 'k1', personId: 'vikram', opportunityId: 'o-neela-dop', note: 'Shot Monsoon Letters with your team. Araku in the rain is exactly my kind of light.', time: '1h' },
    { id: 'k2', personId: 'anvi', opportunityId: 'o-neela-dop', note: 'Two features on available light, reel attached to my profile.', answers: ['ARRI Alexa Mini LF, Sony Venice', 'The rooftop scene in Kaagaz, on my profile', 'Yes, free 12–15 Oct'], time: '3h' },
    { id: 'k3', personId: 'raghu', opportunityId: 'o-neela-dop', time: '6h' },
    { id: 'k4', personId: 'dev', opportunityId: 'o-neela-journalist', note: 'Free for the full schedule.', time: '1d' },
    { id: 'k5', personId: 'teja', opportunityId: 'o-neela-dop', withdrawn: true, time: '1d' },
  ],
  tidewater: [],
  aditi: [],
};

export const notifications: Record<string, Notification[]> = {
  kiran: [
    { id: 'nt1', kind: 'message', actorId: 'konark', text: 'Konark Pictures replied about Director of Photography', time: '12m', unread: true, route: { name: 'conversation', id: 'th-konark-kiran' } },
    { id: 'nt2', kind: 'interest', actorId: 'nikhil', text: '3 people are interested in your 1st AC collaboration', time: '2h', unread: true },
    { id: 'nt3', kind: 'credit', actorId: 'tidewater', text: 'Your credit from Tidewater Films is public: Additional Camera, Monsoon Letters', time: '1d', unread: false, route: { name: 'profile', id: 'kiran' } },
    { id: 'nt4', kind: 'follow', actorId: 'zoya', text: 'Zoya Khan followed you', time: '2d', unread: false, route: { name: 'profile', id: 'zoya' } },
  ],
  aditi: [],
  tara: [
    { id: 'tn1', kind: 'message', actorId: 'saffron', text: 'Saffron Reel Studios invited you to audition for Paper Boats', time: '1h', unread: true, route: { name: 'conversation', id: 'c-saffron' } },
  ],
};

/** People in the viewer's craft and city, used when a new user has no network yet. Generated, not curated. */
export const suggestedFor: Record<string, string[]> = {
  kiran: ['vikram', 'anvi', 'sana', 'sameer', 'rhea'],
  aditi: ['ishaan', 'sameer', 'rhea', 'kiran'],
  tara: ['lakshmi', 'devika', 'arjun'],
};

/** Browse taxonomy for Discover. Shown as icons; no invented counts. */
export const crafts: { id: string; label: string }[] = [
  { id: 'cinematographer', label: 'Camera' },
  { id: 'actor', label: 'Acting' },
  { id: 'editor', label: 'Editing' },
  { id: 'director', label: 'Direction' },
  { id: 'sound', label: 'Sound' },
  { id: 'production-design', label: 'Art' },
  { id: 'costume', label: 'Costume' },
  { id: 'colourist', label: 'Colour' },
];


/** Library the prototype media picker offers in place of the camera roll. */
export const cameraRoll: Media[] = ['neela', 'quiet', 'faultlines', 'chai', 'neonmonsoon', 'backwaters', 'paperboats', 'journalist', 'saltwater', 'homeloan', 'coastline', 'salt2'].map(
  (id, i) => ({ ...m(id), id: `roll-${id}`, ...(i === 4 || i === 11 ? { kind: 'video' as const, duration: i === 4 ? '0:32' : '1:05' } : {}) }),
);
