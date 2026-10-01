// Capture the canonical records before any fixture touches them.
import './snapshot';
import { RESEARCH } from '../research';
import { applyOps } from './fixtures';
import { scenarioById } from './scenarios';
import type { Fixture, Scenario } from './types';

/*
 * Decides, once per page load, whether this load is the Edge Case Lab (?lab), a scenario
 * (?scenario=EC-…), or the normal prototype. A scenario's fixture is applied here, to this load's
 * fresh copy of the seed, before anything renders. Reloading repeats it exactly, which is the reset.
 *
 * Research Mode always wins: it strips scenario and Lab parameters and never sees any of this.
 */

const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();

if (RESEARCH && (params.has('scenario') || params.has('lab'))) {
  const u = new URL(location.href);
  u.searchParams.delete('scenario');
  u.searchParams.delete('lab');
  history.replaceState(null, '', u.toString());
}

const requested = params.has('scenario') ? scenarioById(params.get('scenario') ?? '') : undefined;

/** The Lab opens for ?lab, and also for a scenario link that cannot be reproduced yet (it shows why). */
export const LAB = !RESEARCH && (params.has('lab') || (params.has('scenario') && !requested?.fixture));

/** The Visual Composition System specimen (?specimen): a design-system test page, never a product surface. */
export const SPECIMEN = !RESEARCH && params.has('specimen');

/** The motion review (?motion): internal, never linked from the stakeholder console. */
export const MOTION_REVIEW = !RESEARCH && params.has('motion');

export const SCENARIO: Scenario | undefined = !RESEARCH && !LAB ? requested : undefined;

/** A scenario's starting state, or null for the normal prototype. */
export const BOOT: Fixture | null = SCENARIO?.fixture ?? null;

if (BOOT) applyOps(BOOT.ops);

/** Links used by the Lab and the scenario bar. Every one is a fresh load. */
export function scenarioUrl(id: string) {
  const u = new URL(location.href);
  u.search = '';
  u.searchParams.set('scenario', id);
  return u.toString();
}
export function labUrl(focus?: string) {
  const u = new URL(location.href);
  u.search = '';
  u.searchParams.set('lab', '');
  if (focus) u.searchParams.set('focus', focus);
  return u.toString().replace('lab=&', 'lab&').replace(/lab=$/, 'lab');
}
export function prototypeUrl() {
  const u = new URL(location.href);
  u.search = '';
  return u.toString();
}
