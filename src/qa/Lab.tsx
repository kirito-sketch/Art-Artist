import { ArrowLeft, Check, Copy, ExternalLink, FlaskConical, Play, RotateCcw, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CHECKS, runChecks, type Outcome } from './checks';
import { prototypeUrl, scenarioUrl } from './boot';
import { counts } from './matrix';
import { AREAS, SCENARIOS, areaName, scenarioById } from './scenarios';
import { effective } from './status';
import type { Priority, Risk, Scenario, Status } from './types';
import './lab.css';

/*
 * Edge Case Lab: an internal QA page, not part of Art and Artist. Search and filter the scenario manifest, read
 * what Art and Artist should do, open any scenario as a fresh prototype load, and see the automated checks.
 * Opened from the prototype console (Advanced, Testing) or ?lab. Never reachable in Research Mode.
 */

const STATUSES: Status[] = ['Not reviewed', 'Rule defined', 'Needs product decision', 'Needs user validation', 'Needs legal', 'Needs UI', 'Implemented', 'Automated', 'Passed', 'Failed', 'Blocked'];
const RISKS: Risk[] = ['Identity', 'Privacy', 'Trust', 'Security', 'Record integrity', 'Permission', 'Safety', 'Legal', 'Data integrity', 'Usability', 'Recovery', 'Scalability', 'Future architecture'];

type Flag = 'visual' | 'automation' | 'legal' | 'decision' | 'reproducible';
const FLAGS: [Flag, string][] = [
  ['visual', 'Needs visual QA'],
  ['automation', 'Needs automation'],
  ['legal', 'Needs legal review'],
  ['decision', 'Needs product decision'],
  ['reproducible', 'Reproducible'],
];

const tone = (st: Status) =>
  st === 'Passed' || st === 'Automated' || st === 'Implemented' ? 'ok' : st === 'Failed' ? 'bad' : st === 'Needs legal' || st === 'Needs product decision' || st === 'Needs user validation' || st === 'Blocked' ? 'wait' : 'todo';

function copy(text: string, done: () => void) {
  navigator.clipboard?.writeText(text).then(done, done);
}

export function EdgeCaseLab() {
  const [results, setResults] = useState<Record<string, Outcome>>(() => runChecks());
  const [ranAt, setRanAt] = useState(() => new Date());
  const [q, setQ] = useState('');
  const [areaF, setAreaF] = useState('');
  const [prioF, setPrioF] = useState<'' | Priority>('');
  const [riskF, setRiskF] = useState<'' | Risk>('');
  const [statusF, setStatusF] = useState<'' | Status>('');
  const [flags, setFlags] = useState<Flag[]>([]);
  const [sel, setSel] = useState<string>(() => new URLSearchParams(location.search).get('focus') ?? scenarioById(new URLSearchParams(location.search).get('scenario') ?? '')?.id ?? SCENARIOS.find((s) => s.priority === 'P0')!.id);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = 'Edge Case Lab';
  }, []);
  // Keep the selected scenario in the URL, so a Lab link opens on it.
  useEffect(() => {
    const u = new URL(location.href);
    u.searchParams.set('focus', sel);
    history.replaceState(null, '', u.toString().replace('lab=&', 'lab&'));
    setCopied(false);
  }, [sel]);

  const eff = useMemo(() => Object.fromEntries(SCENARIOS.map((s) => [s.id, effective(s, results)])), [results]);
  const term = q.trim().toLowerCase();
  const list = SCENARIOS.filter((s) => {
    const e = eff[s.id];
    if (areaF && s.area !== areaF) return false;
    if (prioF && s.priority !== prioF) return false;
    if (riskF && !s.risks.includes(riskF)) return false;
    if (statusF && e.status !== statusF) return false;
    if (flags.includes('visual') && !(s.kinds.includes('Visual') || s.needs.ui)) return false;
    if (flags.includes('automation') && !s.needs.automation) return false;
    if (flags.includes('legal') && !s.needs.legal) return false;
    if (flags.includes('decision') && e.status !== 'Needs product decision') return false;
    if (flags.includes('reproducible') && !s.fixture) return false;
    if (term && !`${s.id} ${s.title} ${s.expected} ${areaName(s.area)}`.toLowerCase().includes(term)) return false;
    return true;
  });
  const c = counts(results);
  const p0Remaining = SCENARIOS.filter((s) => s.priority === 'P0' && !['Passed', 'Implemented', 'Automated'].includes(eff[s.id].status)).length;
  const nRes = (r: Outcome['result']) => Object.values(results).filter((x) => x.result === r).length;
  const selected = scenarioById(sel) ?? list[0];
  const filtered = !!(term || areaF || prioF || riskF || statusF || flags.length);

  const rerun = () => {
    setResults(runChecks());
    setRanAt(new Date());
  };
  const clear = () => {
    setQ('');
    setAreaF('');
    setPrioF('');
    setRiskF('');
    setStatusF('');
    setFlags([]);
  };

  return (
    <div className="lab">
      <header className="lab-head">
        <div className="lab-brand">
          <FlaskConical size={18} />
          <span className="lab-name">Edge Case Lab</span>
          <span className="lab-tag">Internal</span>
        </div>
        <div className="lab-stats">
          <span>
            <b>{c.total}</b> scenarios
          </span>
          <span>
            <b>{c.P0}</b> P0 · <b>{c.P1}</b> P1 · <b>{c.P2}</b> P2
          </span>
          <span className="lab-stat-strong">
            P0: <b>{p0Remaining}</b> remaining
          </span>
          <span>
            Checks: <b className="lab-ok">{nRes('pass')} pass</b> · <b className="lab-bad">{nRes('fail')} fail</b> · {nRes('missing')} no model
          </span>
        </div>
        <div className="lab-head-actions">
          <button className="lab-btn lab-btn--quiet" onClick={rerun} title={`Last run ${ranAt.toLocaleTimeString()}`}>
            <RotateCcw size={14} /> Re-run checks
          </button>
          <a className="lab-btn lab-btn--quiet" href={prototypeUrl()}>
            <ArrowLeft size={14} /> Back to prototype
          </a>
        </div>
      </header>

      <div className="lab-body">
        <section className="lab-cat" aria-label="Scenario catalogue">
          <div className="lab-filters">
            <label className="lab-search">
              <Search size={15} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search scenarios, IDs, behaviour" aria-label="Search scenarios" />
              {q && (
                <button onClick={() => setQ('')} aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </label>
            <div className="lab-selects">
              <select value={areaF} onChange={(e) => setAreaF(e.target.value)} aria-label="Area">
                <option value="">All areas</option>
                {AREAS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {String(a.num).padStart(2, '0')} {a.name}
                  </option>
                ))}
              </select>
              <select value={prioF} onChange={(e) => setPrioF(e.target.value as Priority)} aria-label="Priority">
                <option value="">Any priority</option>
                <option>P0</option>
                <option>P1</option>
                <option>P2</option>
              </select>
              <select value={riskF} onChange={(e) => setRiskF(e.target.value as Risk)} aria-label="Risk">
                <option value="">Any risk</option>
                {RISKS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <select value={statusF} onChange={(e) => setStatusF(e.target.value as Status)} aria-label="Status">
                <option value="">Any status</option>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="lab-flags">
              {FLAGS.map(([f, label]) => (
                <button key={f} className={`lab-chip ${flags.includes(f) ? 'is-on' : ''}`} aria-pressed={flags.includes(f)} onClick={() => setFlags((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]))}>
                  {label}
                </button>
              ))}
            </div>
            <p className="lab-count">
              {list.length} of {SCENARIOS.length}
              {filtered && (
                <button className="lab-link" onClick={clear}>
                  Clear filters
                </button>
              )}
            </p>
          </div>

          <div className="lab-list" role="listbox" aria-label="Scenarios">
            {AREAS.map((a) => {
              const rows = list.filter((s) => s.area === a.code);
              if (!rows.length) return null;
              return (
                <div key={a.code}>
                  <p className="lab-area">
                    {String(a.num).padStart(2, '0')} {a.name} <span>{rows.length}</span>
                  </p>
                  {rows.map((s) => (
                    <button key={s.id} role="option" aria-selected={selected?.id === s.id} className={`lab-row ${selected?.id === s.id ? 'is-sel' : ''}`} onClick={() => setSel(s.id)}>
                      <span className="lab-row-top">
                        <span className="lab-id">{s.id}</span>
                        <span className={`lab-p lab-p--${s.priority}`}>{s.priority}</span>
                        <span className={`lab-status lab-status--${tone(eff[s.id].status)}`}>{eff[s.id].status}</span>
                      </span>
                      <span className="lab-row-title">{s.title}</span>
                      <span className="lab-row-risk">{s.risks.join(' · ')}</span>
                    </button>
                  ))}
                </div>
              );
            })}
            {!list.length && <p className="lab-empty">No scenarios match.</p>}
          </div>
        </section>

        {selected && (
          <Detail
            s={selected}
            status={eff[selected.id].status}
            results={results}
            copied={copied}
            onCopy={() => copy(scenarioUrl(selected.id), () => setCopied(true))}
            onRun={() => {
              const r = runChecks(selected.auto);
              setResults((x) => ({ ...x, ...r }));
            }}
            onPick={setSel}
          />
        )}
      </div>
    </div>
  );
}

function Detail({ s, status, results, copied, onCopy, onRun, onPick }: { s: Scenario; status: Status; results: Record<string, Outcome>; copied: boolean; onCopy: () => void; onRun: () => void; onPick: (id: string) => void }) {
  const needs = [s.needs.ui && 'UI', s.needs.interaction && 'Interaction test', s.needs.automation && 'Automated test', s.needs.rule && 'Business rule', s.needs.legal && 'Legal review', s.needs.research && 'User validation'].filter(Boolean) as string[];
  // Cross references like "See EC-ROLE-011." become links.
  const linkify = (t: string) =>
    t.split(/(EC-[A-Z0-9]+-\d{3})/g).map((part, i) =>
      /^EC-[A-Z0-9]+-\d{3}$/.test(part) && scenarioById(part) ? (
        <button key={i} className="lab-link" onClick={() => onPick(part)}>
          {part}
        </button>
      ) : (
        part
      ),
    );
  return (
    <article className="lab-detail" aria-label={`Scenario ${s.id}`}>
      <div className="lab-detail-head">
        <p className="lab-id lab-id--big">{s.id}</p>
        <h1 className="lab-title">{s.title}</h1>
        <p className="lab-meta">
          <span className={`lab-p lab-p--${s.priority}`}>{s.priority}</span>
          <span>{areaName(s.area)}</span>
          <span>{s.kinds.join(' · ')}</span>
          <span className={`lab-status lab-status--${tone(status)}`}>{status}</span>
        </p>
        <div className="lab-actions">
          {s.fixture ? (
            <a className="lab-btn lab-btn--primary" href={scenarioUrl(s.id)}>
              <Play size={14} /> Open scenario
            </a>
          ) : (
            <span className="lab-btn lab-btn--off" aria-disabled title={s.noFixture}>
              <Play size={14} /> Not reproducible yet
            </span>
          )}
          <button className="lab-btn" onClick={onCopy} disabled={!s.fixture}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Link copied' : 'Copy link'}
          </button>
          {s.fixture && <span className="lab-hint">Every open starts clean. Reset and Exit are in the scenario bar.</span>}
        </div>
        {!s.fixture && <p className="lab-note">{s.noFixture ?? 'No fixture yet. P0 scenarios are staged first; this one is not staged.'}</p>}
      </div>

      <Field label="What should Art and Artist do?">{linkify(s.expected)}</Field>
      {s.why && <Field label="Why this matters">{s.why}</Field>}
      <Field label="Starting context">
        {s.start.persona} · {s.start.identity} · {s.start.state}
        {s.fixture && <FixtureLine s={s} />}
      </Field>
      {s.preconditions && <Field label="Preconditions">{s.preconditions}</Field>}
      {s.action && <Field label="Action">{s.action}</Field>}
      {s.mustNot?.length ? (
        <Field label="What must not happen">
          <ul className="lab-ul">
            {s.mustNot.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Field>
      ) : null}
      {s.publicConsequences && <Field label="Public consequences">{s.publicConsequences}</Field>}
      {s.privateConsequences && <Field label="Private consequences">{s.privateConsequences}</Field>}
      {s.checks?.length ? (
        <Field label="Checks">
          <ul className="lab-ul lab-ul--box">
            {s.checks.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Field>
      ) : null}
      {s.auto?.length ? (
        <Field
          label="Automated checks"
          extra={
            <button className="lab-link" onClick={onRun}>
              Run
            </button>
          }
        >
          <ul className="lab-auto">
            {s.auto.map((id) => {
              const r = results[id];
              const k = CHECKS.find((x) => x.id === id);
              return (
                <li key={id} className={`lab-auto-${r?.result ?? 'none'}`}>
                  <span className="lab-auto-res">{r ? { pass: 'Pass', fail: 'Fail', missing: 'No model' }[r.result] : '–'}</span>
                  <span>
                    <b>
                      {id} {k?.title}
                    </b>
                    <br />
                    {r?.detail}
                  </span>
                </li>
              );
            })}
          </ul>
        </Field>
      ) : null}
      <Field label="Needs">{needs.length ? needs.join(' · ') : 'Nothing beyond the rule.'}</Field>
      <Field label="Risk">{s.risks.join(' · ')}</Field>
      {s.notes && <Field label="Notes">{linkify(s.notes)}</Field>}
      <p className="lab-foot">
        <ExternalLink size={12} /> docs/EDGE_CASE_MATRIX.md is generated from the same manifest (src/qa/scenarios).
      </p>
    </article>
  );
}

function FixtureLine({ s }: { s: Scenario }) {
  const f = s.fixture!;
  const bits = [
    `Opens as ${f.surface === 'admin' ? 'the moderation console' : f.persona}${f.acting && f.acting !== 'self' ? ` acting for ${f.acting}` : ''}`,
    f.canIssue === false && 'no credit authority',
    f.memberships && `memberships: ${Object.entries(f.memberships).map(([k, v]) => `${k} → ${v.join(', ') || 'none'}`).join('; ')}`,
    f.blocked?.length && `blocked: ${f.blocked.join(', ')}`,
    f.flags && Object.keys(f.flags).length && `test states: ${Object.keys(f.flags).join(', ')}`,
    f.ops?.length && `records: ${f.ops.join(', ')}`,
  ].filter(Boolean);
  return <span className="lab-fixture">{bits.join(' · ')}</span>;
}

function Field({ label, children, extra }: { label: string; children: ReactNode; extra?: ReactNode }) {
  return (
    <section className="lab-field">
      <p className="lab-label">
        {label} {extra}
      </p>
      <div className="lab-value">{children}</div>
    </section>
  );
}
