import type { Media } from './types';
import { isoDay, nextFriday, releaseWeekStart } from '../domain/reviews';

/**
 * Seed input for the project model in src/state/world.ts. Every project in the prototype, including the
 * older sample films, becomes the same kind of record there: a project, private "added to project"
 * associations, and production-issued credits. Nothing here is read directly by screens.
 *
 * "Work" is the internal word. People only ever see Project, Film or Series (Exhibition or Show later).
 */
export type WorkStage = 'Development' | 'Pre-production' | 'Shooting' | 'Post-production' | 'Released';

export interface WorkCredit {
  personId: string;
  role: string;
  dept: string;
}

/** The public shape of a project page. Built by world.toPublicWork from what the owner revealed. */
export interface Work {
  id: string;
  title: string;
  year: string;
  format: string;
  stage: WorkStage;
  /** First is the lead production. More than one means a co-production. Empty means independent. */
  orgIds: string[];
  ownerId?: string;
  logline: string;
  media: Media;
  stills: Media[];
  /** Accepted credits only. */
  credits: WorkCredit[];
  /** Release date set by the house (YYYY-MM-DD). Reviews open on this day. */
  releaseDate?: string;
}

export interface SeedWork {
  id: string;
  title: string;
  /** Internal name when it differs from the public one. */
  workingTitle?: string;
  year: string;
  format: string;
  stage: WorkStage;
  orgIds: string[];
  ownerId?: string;
  logline: string;
  media?: Media;
  stills: Media[];
  shared: boolean;
  releaseDate?: string;
  /** Accepted, production-issued credits (the work is done). */
  credits: WorkCredit[];
  /** Private associations with no credit yet (the work is in progress). */
  added?: WorkCredit[];
  /** Credits issued and waiting for the person, or sent back for correction. */
  proposed?: (WorkCredit & { line: string; correction?: string })[];
}

// Films out this week stay out this week whenever the prototype is opened.
const THIS_FRIDAY = isoDay(releaseWeekStart(Date.now()));
// Kaaval releases the Friday after its festival premiere.
const KAAVAL_RELEASE = isoDay(nextFriday(Date.now()) + 7 * 864e5);

const img = (src: string, fallback?: string): Media => ({ id: src, kind: 'image', src: `images/${src}.jpg`, fallback: fallback ? `images/${fallback}.jpg` : undefined });

export const SEED_WORKS: SeedWork[] = [
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
    shared: true,
    // In pre-production: people are on the project, but nobody has earned a credit yet.
    credits: [],
    added: [
      { personId: 'ishaan', role: 'Production Designer', dept: 'Art' },
      { personId: 'lakshmi', role: 'Amma', dept: 'Cast' },
      { personId: 'sana', role: '1st AC', dept: 'Camera' },
    ],
  },
  {
    id: 'kaal',
    title: 'Kaal',
    year: '2027',
    format: 'Web series · Hindi',
    stage: 'Development',
    orgIds: ['konark'],
    logline: '',
    stills: [],
    shared: false,
    credits: [],
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
    shared: true,
    releaseDate: '2023-08-11',
    credits: [
      { personId: 'arjun', role: 'Director', dept: 'Direction' },
      { personId: 'aditi', role: 'Line Producer', dept: 'Production' },
      { personId: 'kiran', role: 'Camera Operator', dept: 'Camera' },
      { personId: 'raghu', role: 'Camera Operator, 2nd unit', dept: 'Camera' },
      { personId: 'ishaan', role: 'Production Designer', dept: 'Art' },
      { personId: 'zoya', role: 'Editor', dept: 'Post' },
      { personId: 'farhan', role: 'Sound Recordist', dept: 'Sound' },
      { personId: 'lakshmi', role: 'Sister Mary', dept: 'Cast' },
    ],
    proposed: [{ personId: 'sameer', role: 'Gaffer', dept: 'Lighting', line: 'Gaffer', correction: 'Chief Lighting Technician, not Gaffer' }],
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
    shared: true,
    releaseDate: '2025-03-14',
    credits: [
      { personId: 'devika', role: 'Director', dept: 'Direction' },
      { personId: 'aditi', role: 'Line Producer', dept: 'Production' },
      { personId: 'vikram', role: 'Director of Photography', dept: 'Camera' },
      { personId: 'kiran', role: 'Additional Camera', dept: 'Camera' },
      { personId: 'meera', role: 'Editor', dept: 'Post' },
      { personId: 'lakshmi', role: 'Annamma', dept: 'Cast' },
    ],
  },
  {
    id: 'backwaters',
    title: 'Backwaters',
    year: '2027',
    format: 'Docuseries · Malayalam',
    stage: 'Development',
    orgIds: ['tidewater'],
    logline: 'Four episodes on the families who still live on the water.',
    media: img('covers/backwaters'),
    stills: [img('covers/backwaters')],
    shared: true,
    credits: [],
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
    shared: true,
    releaseDate: KAAVAL_RELEASE,
    credits: [
      { personId: 'kabir', role: 'Writer-Director', dept: 'Direction' },
      { personId: 'kiran', role: 'Director of Photography', dept: 'Camera' },
      { personId: 'nandini', role: 'Costume Designer', dept: 'Costume' },
      { personId: 'sameer', role: 'Gaffer', dept: 'Lighting' },
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
    shared: true,
    releaseDate: '2024-06-07',
    credits: [
      { personId: 'vikram', role: 'DoP, Episodes 1–2', dept: 'Camera' },
      { personId: 'kiran', role: 'DoP, Episodes 3–5', dept: 'Camera' },
      { personId: 'priya', role: 'Focus Puller', dept: 'Camera' },
      { personId: 'sana', role: '1st AC', dept: 'Camera' },
      { personId: 'raghu', role: 'Camera Operator', dept: 'Camera' },
      { personId: 'teja', role: 'Steadicam Operator', dept: 'Camera' },
      { personId: 'anvi', role: '2nd Unit DoP', dept: 'Camera' },
      { personId: 'tara', role: 'Inspector Rao (recurring)', dept: 'Cast' },
      { personId: 'dev', role: 'ACP Khanna', dept: 'Cast' },
    ],
    // Blue Lotus has issued Kiran a second credit that he hasn't answered yet.
    proposed: [{ personId: 'kiran', role: 'Additional photography, Episode 6', dept: 'Camera', line: 'DoP, Episode 6 (additional photography)' }],
  },
  {
    id: 'dhoop',
    title: 'Dhoop',
    year: '2026',
    format: 'Feature film · Hindi',
    stage: 'Released',
    orgIds: ['bluelotus'],
    logline: 'A retired lighthouse keeper teaches his granddaughter to swim before the sea takes the house.',
    media: img('covers/salt-water'),
    stills: [img('covers/salt-water'), img('covers/coastline')],
    shared: true,
    releaseDate: THIS_FRIDAY,
    credits: [
      { personId: 'devika', role: 'Director', dept: 'Direction' },
      { personId: 'farhan', role: 'Sound Designer', dept: 'Sound' },
    ],
  },
  {
    id: 'ratri',
    title: 'Ratri',
    year: '2026',
    format: 'Feature film · Telugu',
    stage: 'Released',
    orgIds: ['saffron'],
    logline: 'A wedding band plays one last night in the rain before their hall in Vijayawada is torn down.',
    media: img('covers/neon-monsoon'),
    stills: [img('covers/neon-monsoon'), img('covers/journalist')],
    shared: true,
    releaseDate: THIS_FRIDAY,
    credits: [
      { personId: 'raghu', role: 'Camera Operator', dept: 'Camera' },
      { personId: 'priya', role: 'Focus Puller', dept: 'Camera' },
    ],
  },
  /* Independent work: shown by the person who made it. No verified credits. */
  { id: 'salt', title: 'Salt', year: '2022', format: 'Short film · 18 min', stage: 'Released', orgIds: [], ownerId: 'kiran', logline: 'Official selection at two regional festivals.', media: img('stills/kiran-salt', 'covers/salt-water'), stills: [img('stills/kiran-salt', 'covers/salt-water')], shared: true, credits: [] },
  { id: 'chairain', title: 'Chai & Rain', year: '2021', format: 'Music video', stage: 'Released', orgIds: [], ownerId: 'kiran', logline: 'Independent release, 1.2M views.', media: img('stills/chai-rain', 'covers/morning-ritual'), stills: [img('stills/chai-rain', 'covers/morning-ritual')], shared: true, credits: [] },
  { id: 'tworooms', title: 'Two Rooms', year: '2023', format: 'Theatre · Prithvi', stage: 'Released', orgIds: [], ownerId: 'tara', logline: '32 shows across Mumbai and Pune.', media: img('stills/tara-stage', 'covers/neon-monsoon'), stills: [img('stills/tara-stage', 'covers/neon-monsoon')], shared: true, credits: [] },
];

export const isLive = (w: { stage: WorkStage }) => w.stage !== 'Released';
