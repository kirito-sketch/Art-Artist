import type { Outcome } from './checks';
import { CHECKS } from './checks';
import { AREAS, SCENARIOS } from './scenarios';
import { effective } from './status';
import type { Scenario } from './types';

/* Builds docs/EDGE_CASE_MATRIX.md from the manifest and the latest automated run. Never edit the doc by hand. */

const yn = (b: boolean) => (b ? 'Yes' : '');
const cell = (s = '') => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function counts(results: Record<string, Outcome>) {
  const eff = SCENARIOS.map((s) => ({ s, e: effective(s, results) }));
  const by = (f: (s: Scenario) => boolean) => SCENARIOS.filter(f).length;
  const p0 = eff.filter((x) => x.s.priority === 'P0');
  return {
    total: SCENARIOS.length,
    P0: by((s) => s.priority === 'P0'),
    P1: by((s) => s.priority === 'P1'),
    P2: by((s) => s.priority === 'P2'),
    ui: by((s) => s.needs.ui),
    interaction: by((s) => s.needs.interaction),
    automation: by((s) => s.needs.automation),
    rule: by((s) => s.needs.rule),
    legal: by((s) => s.needs.legal),
    research: by((s) => s.needs.research),
    fixtures: by((s) => !!s.fixture),
    p0: {
      correct: p0.filter((x) => ['Passed', 'Implemented', 'Automated'].includes(x.e.status)).map((x) => x.s),
      incorrect: p0.filter((x) => x.e.status === 'Failed').map((x) => x.s),
      noRule: p0.filter((x) => x.e.status === 'Needs product decision').map((x) => x.s),
      blocked: p0.filter((x) => ['Needs legal', 'Needs user validation', 'Blocked'].includes(x.e.status)).map((x) => x.s),
      needsBuild: p0.filter((x) => ['Needs UI', 'Rule defined', 'Not reviewed'].includes(x.e.status)).map((x) => x.s),
    },
    status: Object.fromEntries([...new Set(eff.map((x) => x.e.status))].map((st) => [st, eff.filter((x) => x.e.status === st).length])),
  };
}

export function buildMatrix(results: Record<string, Outcome>, when: string) {
  const c = counts(results);
  const out: string[] = [];
  out.push('# Edge case matrix', '');
  out.push('> Generated from `src/qa/scenarios` by `npm run test:edge`. Do not edit by hand: change the manifest and regenerate.', '');
  out.push(`Last automated run: ${when}.`, '');
  out.push('**What should Art and Artist do?** is answered first for every scenario (the Expected behaviour column). Whether it then needs UI, an interaction test, a business rule, an automated test, a legal decision or user validation follows from that answer. Scenario IDs are permanent: numbers are only ever appended, never reused.', '');
  out.push('## Summary', '');
  out.push(`| Total | P0 | P1 | P2 | Need UI | Need interaction test | Need automated test | Need backend/business rule | Need legal review | Need user validation | Reproducible in the Lab |`);
  out.push('|---|---|---|---|---|---|---|---|---|---|---|');
  out.push(`| ${c.total} | ${c.P0} | ${c.P1} | ${c.P2} | ${c.ui} | ${c.interaction} | ${c.automation} | ${c.rule} | ${c.legal} | ${c.research} | ${c.fixtures} |`, '');
  out.push('Status counts: ' + Object.entries(c.status).map(([k, v]) => `${k} ${v}`).join(' · '), '');
  out.push('## Automated checks', '');
  out.push('| Check | Rule | Result | Detail |', '|---|---|---|---|');
  CHECKS.forEach((k) => {
    const r = results[k.id];
    out.push(`| ${k.id} | ${cell(k.title)} | ${r ? { pass: 'Pass', fail: '**Fail**', missing: 'No model yet' }[r.result] : ''} | ${cell(r?.detail)} |`);
  });
  out.push('');
  out.push('Statuses: Not reviewed · Rule defined · Needs product decision · Needs user validation · Needs legal · Needs UI · Implemented (handled in the prototype, checked by hand) · Automated · Passed (automated checks pass) · Failed (an automated check fails, or checked by hand and wrong) · Blocked.', '');
  AREAS.forEach((a) => {
    const rows = SCENARIOS.filter((s) => s.area === a.code);
    out.push(`## ${String(a.num).padStart(2, '0')} ${a.name}`, '');
    out.push('| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |');
    out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    rows.forEach((s) => {
      const e = effective(s, results);
      const notes = [s.notes, s.auto?.length ? `Checks: ${s.auto.join(', ')}` : '', s.fixture ? 'Lab: reproducible' : s.noFixture ? `Lab: ${s.noFixture}` : ''].filter(Boolean).join(' · ');
      out.push(
        `| ${s.id} | ${a.name} | ${cell(s.title)} | ${s.priority} | ${s.risks.join(', ')} | ${cell(s.expected)} | ${cell(s.start.persona)} | ${cell(s.start.identity)} | ${cell(s.start.state)} | ${yn(s.needs.ui)} | ${yn(s.needs.interaction)} | ${yn(s.needs.automation)} | ${yn(s.needs.rule)} | ${yn(s.needs.legal)} | ${yn(s.needs.research)} | ${e.status} | ${cell(notes)} |`,
      );
    });
    out.push('');
  });
  return out.join('\n');
}
