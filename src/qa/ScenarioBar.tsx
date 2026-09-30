import { ArrowLeft, Check, Copy, FlaskConical, LogOut, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { SCENARIO, labUrl, prototypeUrl, scenarioUrl } from './boot';
import { areaName } from './scenarios';

/*
 * Shown beside the phone while a scenario is open, in place of the prototype console. It says which
 * scenario this is and what to look for, and it is the only way in or out: Reset reloads the same
 * scenario from the canonical seed; Exit loads the normal prototype, so nothing from the scenario survives.
 */

export function ScenarioBar({ compact = false }: { compact?: boolean }) {
  const s = SCENARIO!;
  const [done, setDone] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const actions = (
    <div className="sb-actions">
      <button className="sb-btn sb-btn--primary" onClick={() => location.assign(scenarioUrl(s.id))}>
        <RotateCcw size={14} /> Reset scenario
      </button>
      <button className="sb-btn" onClick={() => navigator.clipboard?.writeText(scenarioUrl(s.id)).then(() => setCopied(true), () => setCopied(true))}>
        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy link'}
      </button>
      <a className="sb-btn" href={labUrl(s.id)}>
        <ArrowLeft size={14} /> Back to Lab
      </a>
      <a className="sb-btn" href={prototypeUrl()}>
        <LogOut size={14} /> Exit to prototype
      </a>
    </div>
  );
  if (compact)
    return (
      <div className="sb sb--compact" role="region" aria-label="Edge case scenario">
        <p className="sb-kicker">
          <FlaskConical size={13} /> {s.id}
        </p>
        {actions}
      </div>
    );
  return (
    <aside className="sb" aria-label="Edge case scenario">
      <div className="sb-sticky">
        <p className="sb-kicker">
          <FlaskConical size={13} /> Edge Case Lab · scenario
        </p>
        <p className="sb-id">
          {s.id} <span className={`lab-p lab-p--${s.priority}`}>{s.priority}</span>
        </p>
        <p className="sb-title">{s.title}</p>
        <p className="sb-area">{areaName(s.area)}</p>
        {actions}
      </div>
      <div className="sb-body">
        <p className="sb-label">What should Ana do?</p>
        <p className="sb-text">{s.expected}</p>
        {s.action && (
          <>
            <p className="sb-label">Try this</p>
            <p className="sb-text">{s.action}</p>
          </>
        )}
        {s.mustNot?.length ? (
          <>
            <p className="sb-label">Must not happen</p>
            <ul className="sb-ul">
              {s.mustNot.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </>
        ) : null}
        {s.checks?.length ? (
          <>
            <p className="sb-label">Checks</p>
            <ul className="sb-checks">
              {s.checks.map((m) => (
                <li key={m}>
                  <label>
                    <input type="checkbox" checked={done.includes(m)} onChange={() => setDone((d) => (d.includes(m) ? d.filter((x) => x !== m) : [...d, m]))} /> {m}
                  </label>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {s.notes && (
          <>
            <p className="sb-label">Known</p>
            <p className="sb-text sb-text--muted">{s.notes}</p>
          </>
        )}
        <p className="sb-foot">This is a test fixture. Changes you make stay in this tab and disappear on Reset or Exit.</p>
      </div>
    </aside>
  );
}
