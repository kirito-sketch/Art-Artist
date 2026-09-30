import type { Media } from './types';

/**
 * A Work is the public project record: the one object a credit, a poster, an open role and a
 * production's filmography all point to. Film calls it a project; fine arts would call it an
 * exhibition or a body of work. Same shape, different words.
 */
export type WorkStage = 'Development' | 'Pre-production' | 'Shooting' | 'Post-production' | 'Released';

export interface WorkCredit {
  personId: string;
  role: string;
  dept: string;
}

export interface Work {
  id: string;
  title: string;
  year: string;
  format: string;
  stage: WorkStage;
  /** First is the lead production. More than one means a co-production; each is shown. Empty means independent. */
  orgIds: string[];
  /** Independent work: the person who made it. They can show it, but it carries no issued credits. */
  ownerId?: string;
  logline: string;
  media: Media;
  stills: Media[];
  /** Only credits the person has accepted. Proposed or disputed credits are never public. */
  credits: WorkCredit[];
}

const img = (src: string, fallback?: string): Media => ({ id: src, kind: 'image', src: `images/${src}.jpg`, fallback: fallback ? `images/${fallback}.jpg` : undefined });

export const works: Work[] = [
  {
    id: 'neela',
    title: 'Neela Akasham',
    year: '2027',
    format: 'Feature film · Telugu',
    stage: 'Pre-production',
    orgIds: ['konark'],
    logline: 'One monsoon in the Araku valley, and a family that stops talking to each other.',
    media: img('covers/neela'),
    stills: [img('covers/neela'), img('stills/reel-kiran', 'covers/neela')],
    credits: [
      { personId: 'ishaan', role: 'Production Designer', dept: 'Art' },
      { personId: 'lakshmi', role: 'Amma', dept: 'Cast' },
    ],
  },
  {
    id: 'neeliraat',
    title: 'Neeli Raat',
    year: '2023',
    format: 'Feature film · Telugu',
    stage: 'Released',
    orgIds: ['konark'],
    logline: 'A night-shift nurse in old Hyderabad and the patient who knows her name.',
    media: img('posters/neeli-raat', 'covers/salt-2'),
    stills: [img('stills/kiran-neeli-raat', 'covers/salt-2'), img('stills/sameer-charminar', 'covers/salt-2')],
    credits: [
      { personId: 'arjun', role: 'Director', dept: 'Direction' },
      { personId: 'kiran', role: 'Camera Operator', dept: 'Camera' },
      { personId: 'raghu', role: 'Camera Operator, 2nd unit', dept: 'Camera' },
      { personId: 'sameer', role: 'Gaffer', dept: 'Lighting' },
      { personId: 'ishaan', role: 'Production Designer', dept: 'Art' },
      { personId: 'zoya', role: 'Editor', dept: 'Post' },
      { personId: 'farhan', role: 'Sound Recordist', dept: 'Sound' },
      { personId: 'lakshmi', role: 'Sister Mary', dept: 'Cast' },
    ],
  },
  {
    id: 'monsoon',
    title: 'Monsoon Letters',
    year: '2025',
    format: 'Feature film · Malayalam',
    stage: 'Released',
    orgIds: ['tidewater', 'konark'],
    logline: 'A postman on the backwaters starts answering letters no one will ever collect.',
    media: img('posters/monsoon-letters', 'covers/paper-boats'),
    stills: [img('stills/kiran-monsoon-letters', 'covers/backwaters'), img('covers/backwaters')],
    credits: [
      { personId: 'devika', role: 'Director', dept: 'Direction' },
      { personId: 'vikram', role: 'Director of Photography', dept: 'Camera' },
      { personId: 'kiran', role: 'Additional Camera', dept: 'Camera' },
      { personId: 'meera', role: 'Editor', dept: 'Post' },
      { personId: 'lakshmi', role: 'Annamma', dept: 'Cast' },
    ],
  },
  {
    id: 'kaaval',
    title: 'Kaaval',
    year: '2026',
    format: 'Feature film · Tamil',
    stage: 'Post-production',
    orgIds: ['saffron'],
    logline: 'A night watchman guards a factory that closed ten years ago.',
    media: img('posters/kaaval', 'covers/journalist'),
    stills: [img('stills/nandini-kaaval', 'covers/journalist'), img('stills/kiran-kaaval-desert', 'covers/journalist'), img('stills/kiran-kaaval-test', 'covers/quiet-hours')],
    credits: [
      { personId: 'kabir', role: 'Writer-Director', dept: 'Direction' },
      { personId: 'kiran', role: 'Director of Photography', dept: 'Camera' },
      { personId: 'nandini', role: 'Costume Designer', dept: 'Costume' },
      { personId: 'rhea', role: 'Colourist', dept: 'Post' },
    ],
  },
  {
    id: 'faultlines',
    title: 'Fault Lines · S1',
    year: '2024',
    format: 'Web series · Hindi',
    stage: 'Released',
    orgIds: ['bluelotus'],
    logline: 'Eight days after an earthquake, one detective and a city that wants to forget.',
    media: img('posters/fault-lines', 'covers/faultlines'),
    stills: [img('stills/kiran-fault-lines', 'covers/faultlines'), img('stills/tara-faultlines', 'covers/quiet-hours')],
    credits: [
      { personId: 'vikram', role: 'DoP, Episodes 1–2', dept: 'Camera' },
      { personId: 'kiran', role: 'DoP, Episodes 3–5', dept: 'Camera' },
      { personId: 'priya', role: 'Focus Puller', dept: 'Camera' },
      { personId: 'tara', role: 'Inspector Rao (recurring)', dept: 'Cast' },
      { personId: 'dev', role: 'ACP Khanna', dept: 'Cast' },
    ],
  },
];

const independent = (id: string, ownerId: string, title: string, year: string, format: string, logline: string, still: string, fallback: string): Work => ({
  id, title, year, format, stage: 'Released', orgIds: [], ownerId, logline, media: img(still, fallback), stills: [img(still, fallback)], credits: [],
});
works.push(
  independent('salt', 'kiran', 'Salt', '2022', 'Short film · 18 min', 'Official selection at two regional festivals.', 'stills/kiran-salt', 'covers/salt-water'),
  independent('chairain', 'kiran', 'Chai & Rain', '2021', 'Music video', 'Independent release, 1.2M views.', 'stills/chai-rain', 'covers/morning-ritual'),
  independent('tworooms', 'tara', 'Two Rooms', '2023', 'Theatre · Prithvi', '32 shows across Mumbai and Pune.', 'stills/tara-stage', 'covers/neon-monsoon'),
);

export const work = (id: string) => works.find((w) => w.id === id);

const TITLE_TO_WORK: Record<string, string> = {
  'Neela Akasham': 'neela',
  'Neeli Raat': 'neeliraat',
  'Monsoon Letters': 'monsoon',
  Kaaval: 'kaaval',
  Salt: 'salt',
  'Chai & Rain': 'chairain',
  'Two Rooms': 'tworooms',
  'Fault Lines · S1': 'faultlines',
  'Fault Lines · Season 1': 'faultlines',
};
export const workIdForTitle = (title: string) => TITLE_TO_WORK[title];
export const worksForOrg = (orgId: string) => works.filter((w) => w.orgIds.includes(orgId));
export const isLive = (w: Work) => w.stage !== 'Released';
