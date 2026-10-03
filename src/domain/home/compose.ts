import { canLead } from './significance';
import { CAP, MAX_MIDDLE, OPPORTUNITY_MIN_POSITION, SIZE, type Candidate, type Composition, type PersonalNews } from './types';

/**
 * Composition answers "what makes the whole page feel good?". It walks the ranked list and places each unit
 * in the first position the rules allow:
 *  - never two units of the same type next to each other;
 *  - at most one opportunity, never above the third middle unit (otherwise it is left out);
 *  - caps per type;
 *  - large and compact units alternate where the pool allows;
 *  - no padding: what isn't in the list is never invented;
 *  - at most eight middle units.
 * The lead (fixed frame) is the best-ranked leadable, high-significance project or work.
 */
export function compose(ranked: Candidate[], personal: PersonalNews | null, now: number): Composition {
  const leadIdx = ranked.findIndex(canLead);
  const lead = leadIdx >= 0 ? ranked[leadIdx] : null;
  const left = ranked.filter((_, i) => i !== leadIdx);
  const middle: Candidate[] = [];
  const used: Partial<Record<Candidate['type'], number>> = {};
  const fits = (x: Candidate, at: number) => (used[x.type] ?? 0) < CAP[x.type] && !(x.type === 'opportunity' && at < OPPORTUNITY_MIN_POSITION) && middle[at - 1]?.type !== x.type;
  const want = () => (middle.length && SIZE[middle[middle.length - 1].type] === 'large' ? 'compact' : 'large');
  while (left.length && middle.length < MAX_MIDDLE) {
    const at = middle.length;
    let i = left.findIndex((x) => fits(x, at) && SIZE[x.type] === want());
    if (i < 0) i = left.findIndex((x) => fits(x, at));
    if (i < 0) break;
    const [x] = left.splice(i, 1);
    middle.push(x);
    used[x.type] = (used[x.type] ?? 0) + 1;
  }
  return { lead, personal, middle, composedAt: now };
}
