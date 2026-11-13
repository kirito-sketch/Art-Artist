import { isFineArt } from '../data/crafts';
import { ARTWORK_FIELDS, PRICED, rolesFor, setsFor, type ArtworkDetails, type FieldDef } from '../data/profileSchema';
import type { Person } from '../data/types';
import type { DetailValue, ProfileExtra } from '../state/profile';

/*
 * What a person still owes before they can be found and act (docs/feedback/2026-11-13/PROFILE_DATA_PLAN.md).
 *
 * Gate 1, the account, is onboarding: name, craft, role, city, languages, industry, availability.
 * Gate 2, this file: everything the Master Database needs for the person's own craft. Until it is met they can
 * browse, follow, save and read, but applying, messaging and posting open the missing items first.
 * Gate 3 is per artwork, for fine artists: artworkMissing below.
 *
 * Only the person's main craft counts: other crafts add their detail sets to Edit profile, but never block.
 * Sensitive fields (height, build…) are never required.
 */

export type GateKind = 'phone' | 'role' | 'level' | 'industry' | 'workTypes' | 'field' | 'instagram' | 'work';

export interface GateItem {
  /** Stable id: the kind, or `field:<fieldId>`. */
  id: string;
  kind: GateKind;
  label: string;
  /** Roughly how long it takes, for the checklist ("30 sec"). */
  seconds: number;
  field?: FieldDef;
}

export interface GateFacts {
  person: Person;
  extra: ProfileExtra;
  /** Portfolio images on the profile. */
  images: number;
}

const filled = (v: DetailValue | undefined) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);

/** Crafts with a career level: everyone but actors, fine artists and producers, who use their own scales. */
export const asksLevel = (p: Person) => p.craft !== 'actor' && p.craft !== 'production' && !isFineArt(p.craft);

/** Everything required that is still empty, in the order it is asked: quickest and most useful first. */
export function missingForGate(f: GateFacts): GateItem[] {
  const { person: p, extra: x } = f;
  const film = !isFineArt(p.craft);
  const out: GateItem[] = [];
  if (rolesFor(p.craft).length && !x.craftRole) out.push({ id: 'role', kind: 'role', label: 'Your role', seconds: 5 });
  if (asksLevel(p) && !x.level) out.push({ id: 'level', kind: 'level', label: 'Your level', seconds: 5 });
  if (film && !(x.industries ?? []).length) out.push({ id: 'industry', kind: 'industry', label: 'Industries you work in', seconds: 10 });
  if (film && !x.workTypes.length) out.push({ id: 'workTypes', kind: 'workTypes', label: 'Types of work', seconds: 10 });
  for (const set of setsFor([p.craft])) {
    for (const fd of set.fields) {
      if (fd.sensitive || filled(x.details[fd.id]) || out.some((o) => o.id === `field:${fd.id}`)) continue;
      out.push({ id: `field:${fd.id}`, kind: 'field', label: fd.label, seconds: fd.type === 'range' || fd.type === 'number' ? 15 : 10, field: fd });
    }
  }
  if (!x.instagram && !x.noInstagram) out.push({ id: 'instagram', kind: 'instagram', label: 'Instagram', seconds: 10 });
  if (!x.phone?.verified) out.push({ id: 'phone', kind: 'phone', label: 'Verify your mobile', seconds: 40 });
  const hasWork = !!x.reel || f.images > 0 || (x.featuredWork?.length ?? 0) > 0 || x.workLinks.length > 0;
  if (!hasWork) out.push({ id: 'work', kind: 'work', label: 'Add your work', seconds: 60 });
  return out;
}

/** Everything gate 2 asks of this person, done or not: for the progress ring. */
export function gateTotal(f: GateFacts): number {
  const empty: ProfileExtra = { skills: [], suggestedSkills: [], details: {}, visibility: {}, workTypes: [], links: [], workLinks: [] };
  return missingForGate({ person: f.person, extra: empty, images: 0 }).length;
}

/** "About 2 min" for the checklist. */
export function timeLeft(items: GateItem[]): string {
  const s = items.reduce((a, i) => a + i.seconds, 0);
  if (s < 60) return 'Under a minute';
  return `About ${Math.round(s / 60)} min`;
}

/* ------------------------------------------------------------ gate 3: artworks */

/** The artwork fields still empty. Price is asked only when the piece can be bought. */
export function artworkMissing(d: ArtworkDetails = {}): FieldDef[] {
  return ARTWORK_FIELDS.filter((f) => (f.id !== 'price' || PRICED.includes(d.sale ?? '')) && !d[f.id as keyof ArtworkDetails]);
}

/** Who sees a portfolio piece: everyone once a fine artist has described it; only its owner until then. Other crafts are never held back. */
export function artworkVisible(fineArtist: boolean, d: ArtworkDetails | undefined, own: boolean) {
  return own || !fineArtist || artworkMissing(d).length === 0;
}

/** The one line shown on a published artwork: "Original · For sale · ₹10k–50k"; short leaves out the type (small tiles). */
export function artworkLine(d: ArtworkDetails = {}, short = false) {
  return [short ? undefined : d.type, d.sale, PRICED.includes(d.sale ?? '') ? d.price : undefined].filter(Boolean).join(' · ');
}
