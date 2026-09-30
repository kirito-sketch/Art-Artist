import type { Area, Fixture, Kind, Priority, Risk, Scenario, Status } from '../types';

/*
 * A compact way to write scenarios so the whole inventory stays readable in one place.
 *
 *   [num, title, priority, risks, kinds, expected, needs, status, extra?]
 *
 * num      Stable. The ID is EC-<AREA>-<num, 3 digits>. Never renumber; only append. A removed
 *          scenario's number is never reused.
 * risks    Space separated: Id Pv Tr Se Rec Pe Sa Le Da Us Rv Sc Fu
 * kinds    Letters: V visual, I interaction, L logic/data
 * needs    Letters: U UI, I interaction test, A automated test, B backend/business rule, L legal, R user validation
 * status   NR not reviewed, RD rule defined, PD needs product decision, UV needs user validation,
 *          NL needs legal, NU needs UI, IM implemented, AU automated, PA passed, FA failed, BL blocked
 */

const RISK: Record<string, Risk> = {
  Id: 'Identity',
  Pv: 'Privacy',
  Tr: 'Trust',
  Se: 'Security',
  Rec: 'Record integrity',
  Pe: 'Permission',
  Sa: 'Safety',
  Le: 'Legal',
  Da: 'Data integrity',
  Us: 'Usability',
  Rv: 'Recovery',
  Sc: 'Scalability',
  Fu: 'Future architecture',
};

const STATUS: Record<string, Status> = {
  NR: 'Not reviewed',
  RD: 'Rule defined',
  PD: 'Needs product decision',
  UV: 'Needs user validation',
  NL: 'Needs legal',
  NU: 'Needs UI',
  IM: 'Implemented',
  AU: 'Automated',
  PA: 'Passed',
  FA: 'Failed',
  BL: 'Blocked',
};

const KIND: Record<string, Kind> = { V: 'Visual', I: 'Interaction', L: 'Logic' };

export interface Extra {
  why?: string;
  /** The action to perform. */
  do?: string;
  pre?: string;
  not?: string[];
  pub?: string;
  priv?: string;
  checks?: string[];
  fx?: Fixture;
  nofx?: string;
  auto?: string[];
  notes?: string;
  net?: string;
  /** [persona, identity, state] */
  start?: [string, string, string];
}

export type Row = [number, string, Priority, string, string, string, string, string, Extra?];

export const AREAS: Area[] = [];

export function area(num: number, code: string, name: string, start: [string, string, string], rows: Row[]): Scenario[] {
  AREAS.push({ num, code, name });
  return rows.map(([n, title, priority, risks, kinds, expected, needs, status, x = {}]) => {
    // Where a fixture exists it is the truth about who the scenario starts as.
    const st: [string, string, string] = x.start ?? (x.fx ? fixtureStart(x.fx, start[2]) : start);
    const s: Scenario = {
      id: `EC-${code}-${String(n).padStart(3, '0')}`,
      area: code,
      title,
      priority,
      risks: risks.split(/\s+/).filter(Boolean).map((r) => {
        if (!RISK[r]) throw new Error(`Unknown risk ${r} in ${code}-${n}`);
        return RISK[r];
      }),
      kinds: kinds.split('').map((k) => KIND[k]),
      expected,
      why: x.why,
      start: { persona: st[0], identity: st[1], state: st[2] },
      preconditions: x.pre,
      action: x.do,
      mustNot: x.not,
      publicConsequences: x.pub,
      privateConsequences: x.priv,
      checks: x.checks,
      network: x.net,
      needs: {
        ui: needs.includes('U'),
        interaction: needs.includes('I'),
        automation: needs.includes('A'),
        rule: needs.includes('B'),
        legal: needs.includes('L'),
        research: needs.includes('R'),
      },
      status: STATUS[status] ?? (() => { throw new Error(`Unknown status ${status} in ${code}-${n}`); })(),
      notes: x.notes,
      fixture: x.fx,
      noFixture: x.fx ? undefined : x.nofx,
      auto: x.auto,
    };
    return s;
  });
}

const NAMES: Record<string, string> = { kiran: 'Kiran', tara: 'Tara', aditi: 'Aditi', konark: 'Konark Pictures', tidewater: 'Tidewater Films' };
function fixtureStart(f: Fixture, state: string): [string, string, string] {
  if (f.surface === 'admin') return ['Ana staff', 'Moderator', 'Moderation console'];
  const where = f.entry ? `Entry (${f.entry === 'new' ? 'sign-up' : f.entry === 'signin' ? 'sign in' : 'house invite'})` : f.stack?.length ? routeLabel(f.stack[f.stack.length - 1]) : f.sheet ? `${f.sheet.name[0].toUpperCase()}${f.sheet.name.slice(1)} sheet` : f.tab && f.tab !== 'home' ? f.tab[0].toUpperCase() + f.tab.slice(1) : state;
  return [NAMES[f.persona], f.acting && f.acting !== 'self' ? NAMES[f.acting] ?? f.acting : 'Personal', where];
}
function routeLabel(r: NonNullable<Fixture['stack']>[number]) {
  const id = 'id' in r ? ` ${r.id}` : '';
  return ({ hproject: 'Project workspace', work: 'Project page', profile: 'Profile', opportunity: 'Role page', org: 'House page', yourData: 'Your data', settings: 'Settings', houseSetup: 'House setup', editProfile: 'Edit profile', composePost: 'Post composer' } as Record<string, string>)[r.name] ?? r.name + id;
}

/* Fixture shorthands. */
/** The moderation console, signed in, with this report open. */
export const asModerator = (report?: string): Fixture => ({ persona: 'kiran', surface: 'admin', report });
export const asKiran = (more: Partial<Fixture> = {}): Fixture => ({ persona: 'kiran', ...more });
export const asTara = (more: Partial<Fixture> = {}): Fixture => ({ persona: 'tara', ...more });
export const asAditi = (more: Partial<Fixture> = {}): Fixture => ({ persona: 'aditi', ...more });
export const asKonark = (more: Partial<Fixture> = {}): Fixture => ({ persona: 'aditi', acting: 'konark', ...more });
export const asTidewater = (more: Partial<Fixture> = {}): Fixture => ({ persona: 'aditi', acting: 'tidewater', ...more });
