import { canLead } from './significance';
import { CAP, EXCLUDED, MAX_MIDDLE, OPPORTUNITY_MIN_POSITION, PROJECT_MIN_POSITION, WEIGHT, WEIGHT_CAP, type Candidate, type Composition, type PersonalNews, type Weight } from './types';

export interface ComposeOptions {
  /** A first Home is shorter: there is no network yet, so fewer, better units. */
  maxMiddle?: number;
}

/**
 * Composition answers "what makes the whole page feel good?". The lead (fixed frame) is the best-ranked
 * leadable, high-significance project or work. The middle walks the ranked list and places, at each position,
 * the best unit the hard rules allow, preferring variety:
 *
 * Hard rules
 *  - never two units of the same type next to each other;
 *  - never two immersive units next to each other (the lead counts), and at most one immersive in the middle,
 *    never above the fourth middle unit;
 *  - at most one opportunity, never above the third middle unit (otherwise it is left out);
 *  - caps per type and per weight (at most two rails);
 *  - one story per project: a project in the lead or the middle doesn't come back in another unit (its role
 *    included);
 *  - excluded types (Events) never take a place;
 *  - no padding: what isn't in the list is never invented; at most eight middle units (five on a first Home).
 *
 * Preferences, in order, when more than one unit fits: a weight different from the unit above and a type not
 * yet on the page; then a different weight; then rank alone.
 */
export function compose(ranked: Candidate[], personal: PersonalNews | null, now: number, opts: ComposeOptions = {}): Composition {
  const max = opts.maxMiddle ?? MAX_MIDDLE;
  const pool = ranked.filter((x) => !EXCLUDED.includes(x.type));
  const leadIdx = pool.findIndex(canLead);
  const lead = leadIdx >= 0 ? pool[leadIdx] : null;
  const left = pool.filter((_, i) => i !== leadIdx);
  const middle: Candidate[] = [];
  const used: Partial<Record<Candidate['type'], number>> = {};
  const weights: Partial<Record<Weight, number>> = {};
  // A project is known by its title across units: a role carries its project's title, not its id.
  const story = (x: Candidate | null) => (x?.data?.project ?? x?.data?.projectId) as string | undefined;
  const projects = new Set<string>(story(lead) ? [story(lead)!] : []);
  const above = (at: number): Weight | null => (at > 0 ? WEIGHT[middle[at - 1].type] : lead ? 'immersive' : null);

  const fits = (x: Candidate, at: number) => {
    const w = WEIGHT[x.type];
    if ((used[x.type] ?? 0) >= CAP[x.type]) return false;
    if ((weights[w] ?? 0) >= (WEIGHT_CAP[w] ?? Infinity)) return false;
    if (middle[at - 1]?.type === x.type) return false;
    if (w === 'immersive' && (above(at) === 'immersive' || at < PROJECT_MIN_POSITION)) return false;
    if (x.type === 'opportunity' && at < OPPORTUNITY_MIN_POSITION) return false;
    if (story(x) && projects.has(story(x)!)) return false;
    return true;
  };
  const prefs = [(x: Candidate, at: number) => WEIGHT[x.type] !== above(at) && !used[x.type], (x: Candidate, at: number) => WEIGHT[x.type] !== above(at), () => true];

  while (left.length && middle.length < max) {
    const at = middle.length;
    let i = -1;
    for (const pref of prefs) {
      i = left.findIndex((x) => fits(x, at) && pref(x, at));
      if (i >= 0) break;
    }
    if (i < 0) break;
    const [x] = left.splice(i, 1);
    middle.push(x);
    used[x.type] = (used[x.type] ?? 0) + 1;
    weights[WEIGHT[x.type]] = (weights[WEIGHT[x.type]] ?? 0) + 1;
    if (story(x)) projects.add(story(x)!);
  }
  return { lead, personal, middle, composedAt: now };
}
