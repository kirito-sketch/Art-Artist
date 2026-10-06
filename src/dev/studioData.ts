/*
 * What Studio (/studio) offers, and what the app understands from a Studio link. Studio replaced the
 * prototype console: the app itself shows only the phone, and every way of setting it up for a review
 * is a link that opens it in that state (docs/STUDIO.md).
 */

export type Persona = 'kiran' | 'tara' | 'konark' | 'tidewater';
export const PERSONAS: { id: Persona; name: string; sub: string; group: 'Individual' | 'Production house' }[] = [
  { id: 'kiran', name: 'Kiran Varma', sub: 'Cinematographer', group: 'Individual' },
  { id: 'tara', name: 'Tara Menon', sub: 'Actor, early career', group: 'Individual' },
  { id: 'konark', name: 'Konark Pictures', sub: 'Busy production house', group: 'Production house' },
  { id: 'tidewater', name: 'Tidewater Films', sub: 'Smaller production house', group: 'Production house' },
];

export type Flow = 'new' | 'signin' | 'invite' | 'policy';
export const FLOWS: { id: Flow; label: string; hint: string }[] = [
  { id: 'new', label: 'New person onboarding', hint: 'Splash, intro, sign-up, profile, first Home' },
  { id: 'signin', label: 'Sign in', hint: 'Returning person' },
  { id: 'invite', label: 'Accept a house invite', hint: 'Joining Saffron Reel Studios' },
  { id: 'policy', label: 'Policy update', hint: 'Agreeing to changed terms' },
];

/** Scenario switches the store knows; Studio opens the app with one on. */
export const TEST_STATES = [
  { key: 'newUser', label: 'New user', hint: 'No network yet' },
  { key: 'loading', label: 'Slow network', hint: 'Skeletons while things load' },
  { key: 'offline', label: 'Offline', hint: 'Banner, disabled actions' },
  { key: 'forYouError', label: 'For you fails to load', hint: 'Error and retry on Home' },
  { key: 'failPublish', label: 'Posting fails', hint: 'Publishing a post fails' },
  { key: 'actionsFail', label: 'Actions fail once', hint: 'The first try of each action fails' },
] as const;
export type TestState = (typeof TEST_STATES)[number]['key'];

/** House-side states, opened as Aditi acting for Konark. */
export const HOUSE_STATES = [
  { key: 'noIssue', label: "Aditi can't issue credits", hint: 'Issuing is someone else’s permission' },
  { key: 'housesVerified', label: 'Pending houses verified', hint: 'As if the Art and Artist team approved them' },
] as const;

/** A link into the app, set up as asked. `from=studio` shows the small way back. */
export function appLink(opts: { as?: Persona; flow?: Flow; state?: string[]; home?: 'next' | 'current' | 'legacy' | 'district'; view?: 'app' } = {}) {
  const q = new URLSearchParams();
  if (opts.as) q.set('as', opts.as);
  if (opts.flow) q.set('flow', opts.flow);
  if (opts.state?.length) q.set('state', opts.state.join(','));
  if (opts.home) q.set('home', opts.home);
  if (opts.view) q.set('view', opts.view);
  q.set('from', 'studio');
  return `/?${q.toString()}`;
}

/** Earlier directions, kept as screenshots (public/studio/archive). Their code was removed in October 2026. */
export const ARCHIVE: { title: string; note: string; shots: { src: string; alt: string }[] }[] = [
  { title: 'Full-screen slides Home', note: 'Individual Home led by one full-bleed role at a time. Replaced by Large Cards.', shots: [{ src: 'slides-home-1', alt: 'Slides Home, top' }, { src: 'slides-home-2', alt: 'Slides Home, scrolled' }] },
  { title: 'Pulse house Home', note: 'House Home led by activity around its work. Replaced by Slate.', shots: [{ src: 'pulse-house-home-1', alt: 'Pulse house Home, top' }, { src: 'pulse-house-home-2', alt: 'Pulse house Home, scrolled' }] },
  { title: 'Queue house Home', note: 'House Home as a list of decisions, then projects. Replaced by Slate.', shots: [{ src: 'queue-house-home-1', alt: 'Queue house Home' }] },
  { title: 'Hiring-first house page', note: 'House page that opened on open roles. Replaced by Work first.', shots: [{ src: 'hiring-house-page-1', alt: 'Hiring-first house page, top' }, { src: 'hiring-house-page-2', alt: 'Hiring-first house page, scrolled' }] },
  { title: 'Separate Respond form', note: 'Roles asked for required answers in a Respond form. Replaced by one Interest model.', shots: [{ src: 'respond-role-page', alt: 'Role page with a Respond button' }, { src: 'respond-form', alt: 'The Respond form' }] },
  { title: 'Glass', note: 'Translucent surfaces over the photography.', shots: [{ src: 'glass-home', alt: 'Glass look, Home' }, { src: 'glass-discover', alt: 'Glass look, Discover' }, { src: 'glass-profile', alt: 'Glass look, Profile' }] },
  { title: 'Bold', note: 'Heavy outlines and yellow highlights.', shots: [{ src: 'bold-home', alt: 'Bold look, Home' }, { src: 'bold-discover', alt: 'Bold look, Discover' }, { src: 'bold-profile', alt: 'Bold look, Profile' }] },
  { title: 'Doodle', note: 'Hand-drawn titles and taped photos.', shots: [{ src: 'doodle-home', alt: 'Doodle look, Home' }, { src: 'doodle-discover', alt: 'Doodle look, Discover' }, { src: 'doodle-profile', alt: 'Doodle look, Profile' }] },
];

export const STATUS = {
  decided: ['Large Cards is the individual Home', 'People can’t claim their own credits', 'Added to project is not a credit', 'One account; acting for a house is separate', 'A house’s profile is its public page', 'Minimal is the only visual', 'Apple, Google and email sign-in', 'Unverified houses can’t post roles or credits', '18+ at launch', 'Deleting an account keeps accepted credits', 'No comments on posts', 'Members are permissions, not a team product', 'Discover opens on Posts', 'Search lives in Discover'],
  validating: ['Who issues credits inside a house', 'Whether “Added to project” is real in practice', 'Recruiting for unannounced projects', 'When final credits are decided', 'Who operates Art and Artist for a house', 'Slate and Work first', 'The new Home (compared on /test)'],
  deferred: ['Credits for independent projects', 'Linking people not yet on Art and Artist', 'Bulk credit issuance', 'Guardian / minor accounts', 'Project publication lifecycle'],
};
