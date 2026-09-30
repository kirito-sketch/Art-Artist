import type { Route, Scenario as TestStates, Sheet, Tab } from '../state/store';

/*
 * The edge-case system is data. One manifest describes every scenario; the Edge Case Lab, the
 * automated checks and docs/EDGE_CASE_MATRIX.md are all generated from it. Nothing here is product UI.
 */

export type Priority = 'P0' | 'P1' | 'P2';

export type Risk =
  | 'Identity'
  | 'Privacy'
  | 'Trust'
  | 'Security'
  | 'Record integrity'
  | 'Permission'
  | 'Safety'
  | 'Legal'
  | 'Data integrity'
  | 'Usability'
  | 'Recovery'
  | 'Scalability'
  | 'Future architecture';

/** Visual: inspect a rendered state. Interaction: perform an action and inspect the outcome. Logic: a rule with no unique UI. */
export type Kind = 'Visual' | 'Interaction' | 'Logic';

export type Status =
  | 'Not reviewed'
  | 'Rule defined'
  | 'Needs product decision'
  | 'Needs user validation'
  | 'Needs legal'
  | 'Needs UI'
  | 'Implemented'
  | 'Automated'
  | 'Passed'
  | 'Failed'
  | 'Blocked';

export interface Needs {
  ui: boolean;
  interaction: boolean;
  automation: boolean;
  rule: boolean;
  legal: boolean;
  research: boolean;
}

/**
 * Everything needed to reproduce a scenario's starting state from a clean load. Opening
 * ?scenario=ID reloads the prototype from the canonical seed and applies exactly this.
 */
export interface Fixture {
  /** Signed-in person. */
  persona: 'kiran' | 'tara' | 'aditi';
  /** 'self' or an organisation id. */
  acting?: string;
  /** Credit authority for the house being acted for. */
  canIssue?: boolean;
  /** Who may act for which organisation. Replaces the default. */
  memberships?: Record<string, string[]>;
  blocked?: string[];
  /** Test states: offline, failing actions and so on. */
  flags?: Partial<TestStates>;
  /** Named changes to the shared records, applied after seeding. See fixtures.ts. */
  ops?: string[];
  tab?: Tab;
  stack?: Route[];
  sheet?: Sheet;
  entry?: 'new' | 'signin' | 'invite';
  policyUpdate?: boolean;
  /** Where the scenario opens. The moderation console is its own surface. */
  surface?: 'app' | 'admin';
  /** On the admin surface: the report to open. */
  report?: string;
}

export interface Scenario {
  id: string;
  /** Area code, for example CREDIT. */
  area: string;
  title: string;
  priority: Priority;
  risks: Risk[];
  kinds: Kind[];
  /** What Ana should do. Always answered first. */
  expected: string;
  why?: string;
  /** Starting context in words: persona, identity and state. */
  start: { persona: string; identity: string; state: string };
  preconditions?: string;
  action?: string;
  mustNot?: string[];
  publicConsequences?: string;
  privateConsequences?: string;
  /** Things to look at when checking it by hand. */
  checks?: string[];
  network?: string;
  needs: Needs;
  status: Status;
  notes?: string;
  /** Present when the prototype can reproduce the starting state. */
  fixture?: Fixture;
  /** Why the prototype cannot reproduce it yet, when there is no fixture. */
  noFixture?: string;
  /** Automated checks (see checks.ts) that verify this scenario. */
  auto?: string[];
}

export interface Area {
  code: string;
  num: number;
  name: string;
}
