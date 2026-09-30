import { AlertTriangle, ArrowLeft, Clock, FileText, Flag, Lock, Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { closeAdmin } from './adminMode';

/*
 * Ana Trust & Safety: internal web console. Separate from the app and its identities; staff sign in
 * with company accounts. Focused on one job: review reports and handle trust and safety problems.
 * Reporter identity is visible to staff only. Credits are records: moderators can't delete them.
 * All notices sent to people are drafts for legal review.
 */

type Status = 'New' | 'Under review' | 'Resolved';
type Kind = 'Person' | 'Production house' | 'Role' | 'Post' | 'Message' | 'Credit';
type ActionId = 'dismiss' | 'warn' | 'remove' | 'restore' | 'restrict' | 'suspend' | 'escalate' | 'toProduction' | 'hideCredit';

interface Report {
  id: string;
  kind: Kind;
  name: string;
  sub: string;
  priority: 'Urgent' | 'Normal';
  status: Status;
  assignee?: string;
  reports: { reporter: string; reason: string; note?: string; at: string }[];
  asReported: string;
  now: string;
  context: string[];
  removed?: boolean;
  audit: { at: string; who: string; action: string; reason?: string; note?: string }[];
}

const STAFF = 'Farah (Trust & Safety)';

const SEED: Report[] = [
  {
    id: 'R-1041', kind: 'Role', name: 'Lead actress · "Sapnon ka Safar"', sub: 'Collaboration posted by Vinay K', priority: 'Urgent', status: 'New',
    reports: [
      { reporter: 'Tara Menon', reason: 'Asking for money to apply or audition', note: 'They asked for ₹5,000 "portfolio fee" before the audition.', at: '10:42' },
      { reporter: 'Anvi Reddy', reason: 'Asking for money to apply or audition', at: '09:15' },
      { reporter: 'Dev Malhotra', reason: 'Misleading role or project', at: 'Yesterday' },
    ],
    asReported: 'Looking for a fresh face for lead role. Selected candidates to pay registration and portfolio fee of ₹5,000 before audition.',
    now: 'Looking for a fresh face for lead role. Contact on WhatsApp for audition details.',
    context: ['Account 6 days old', 'Identity not verified', '2 earlier reports (dismissed: not enough information)', 'Messaged 41 people in 3 days'],
    audit: [{ at: '10:42', who: 'System', action: 'Priority set to Urgent', note: 'Reason: asking for money' }],
  },
  {
    id: 'R-1040', kind: 'Person', name: 'Kiran Varma (@kiran.dop.official)', sub: 'Profile', priority: 'Urgent', status: 'New',
    reports: [{ reporter: 'Kiran Varma', reason: 'Fake profile or impersonation', note: 'This is not me. Uses my showreel stills and my name.', at: '08:03' }],
    asReported: 'Kiran Varma · Director of Photography · Hyderabad. Portfolio: 6 stills (match the verified Kiran Varma’s portfolio).',
    now: 'Unchanged.',
    context: ['Account 2 days old', 'Identity not verified', 'Real Kiran Varma: identity verified, 11 years active, 4 accepted credits'],
    audit: [],
  },
  {
    id: 'R-1039', kind: 'Message', name: 'Messages from Rohit S to Tara Menon', sub: '3 reported messages', priority: 'Urgent', status: 'Under review', assignee: STAFF,
    reports: [{ reporter: 'Tara Menon', reason: 'Harassment or unsafe behaviour', note: 'Keeps messaging late at night after I said no.', at: 'Yesterday' }],
    asReported: '"Why are you ignoring me" · "I know people at Saffron, you need me" · "Answer or you won’t work in Mumbai" (only the reported messages are shown to moderators)',
    now: 'Same.',
    context: ['Account 1 year old', 'No earlier reports', 'Tara Menon has blocked this account'],
    audit: [{ at: 'Yesterday 21:10', who: STAFF, action: 'Assigned to self' }],
  },
  {
    id: 'R-1037', kind: 'Credit', name: 'Gaffer · Neeli Raat', sub: 'Credit issued by Konark Pictures to Sameer Ali', priority: 'Normal', status: 'New',
    reports: [{ reporter: 'Ravi Kumar', reason: 'Misleading role or project', note: 'I was the gaffer on Neeli Raat, not him.', at: '2 days ago' }],
    asReported: 'Accepted credit: Sameer Ali, Gaffer, Neeli Raat (Konark Pictures, verified).',
    now: 'Same. Sameer Ali has separately asked Konark to correct the title to Chief Lighting Technician.',
    context: ['Credit issued by a verified house and accepted by the person', 'Reporter has no credit on this project'],
    audit: [],
  },
  {
    id: 'R-1036', kind: 'Post', name: 'Post by Devika Sharma', sub: 'Stills from Rushikonda', priority: 'Normal', status: 'New',
    reports: [{ reporter: 'Zoya Khan', reason: 'Stolen or misused work', note: 'The third still is from my edit reel.', at: '3 days ago' }],
    asReported: '"Last light on the Rushikonda set…" with 3 stills.',
    now: 'Same.',
    context: ['Account 3 years old, identity verified', 'No earlier reports'],
    audit: [],
  },
  {
    id: 'R-1030', kind: 'Production house', name: 'Silverline Films', sub: 'Production house page', priority: 'Normal', status: 'Resolved',
    reports: [{ reporter: 'Meera Krishnan', reason: 'Misleading role or project', at: 'Last week' }],
    asReported: 'Claimed "verified" in its description.',
    now: 'Description corrected.',
    context: ['Verification pending'],
    audit: [
      { at: 'Last week', who: STAFF, action: 'Removed content', reason: 'Misleading', note: 'Removed "verified" from the description' },
      { at: 'Last week', who: STAFF, action: 'Resolved' },
    ],
  },
];

const ACTIONS: Record<ActionId, { label: string; high?: boolean; person: string; reporter: string }> = {
  dismiss: { label: 'Dismiss', person: 'Nothing is sent.', reporter: "We reviewed your report. It didn't break our guidelines." },
  warn: { label: 'Warn', person: 'You broke a community guideline: [guideline]. Repeated breaks can lead to restrictions.', reporter: 'We reviewed your report and took action.' },
  remove: { label: 'Remove content', person: 'We removed [item] because it broke [guideline]. You can request a review from support.', reporter: 'We reviewed your report and took action.' },
  restore: { label: 'Restore content', person: 'We restored [item] after review.', reporter: 'Nothing is sent.' },
  restrict: { label: 'Restrict', high: true, person: 'For [duration] you can’t [message new people / show interest / open roles] because of [guideline]. You can request a review.', reporter: 'We reviewed your report and took action.' },
  suspend: { label: 'Suspend', high: true, person: 'Your account is suspended [until date / indefinitely] because of [guideline]. You can request a review from support. Credits you’ve accepted stay on their films.', reporter: 'We reviewed your report and took action.' },
  escalate: { label: 'Escalate', person: 'Nothing is sent.', reporter: 'Nothing is sent yet.' },
  toProduction: { label: 'Send to the production for correction', person: 'The issuing production is asked to review this credit.', reporter: 'We’ve asked the production that issued this credit to review it.' },
  hideCredit: { label: 'Hide from public pending review', high: true, person: 'This credit is hidden while it’s reviewed. It hasn’t been deleted.', reporter: 'We reviewed your report and took action.' },
};

const REASONS = ['Fake profile or impersonation', 'Asking for money', 'Harassment or unsafe behaviour', 'Misleading', 'Stolen or misused work', 'Spam', 'No violation found'];

export function AdminConsole() {
  const [signedIn, setSignedIn] = useState(false);
  const [reports, setReports] = useState(SEED);
  const [tab, setTab] = useState<Status>('New');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [act, setAct] = useState<ActionId | null>(null);

  const list = useMemo(
    () => reports.filter((r) => r.status === tab && `${r.name} ${r.sub} ${r.kind}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'Urgent' ? -1 : 1)),
    [reports, tab, q],
  );
  const r = reports.find((x) => x.id === open);
  const update = (id: string, fn: (r: Report) => Report) => setReports((rs) => rs.map((x) => (x.id === id ? fn(x) : x)));

  if (!signedIn)
    return (
      <div className="admin admin-gate">
        <div className="admin-gate-card">
          <ShieldCheck size={28} />
          <h1>Ana Trust & Safety</h1>
          <p>Internal tool. Staff accounts only. Every action is logged.</p>
          <button className="admin-btn admin-btn--primary" onClick={() => setSignedIn(true)}>
            Sign in with Ana staff account
          </button>
          <button className="admin-link" onClick={closeAdmin}>
            Back to prototype
          </button>
        </div>
      </div>
    );

  return (
    <div className="admin">
      <header className="admin-top">
        <span className="admin-brand">
          <ShieldCheck size={18} /> Ana Trust & Safety
        </span>
        <span className="admin-who">{STAFF}</span>
        <button className="admin-link" onClick={closeAdmin}>
          Back to prototype
        </button>
      </header>

      {!r ? (
        <main className="admin-main">
          <div className="admin-head">
            <h1>Reports</h1>
            <label className="admin-search">
              <Search size={15} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reported items" />
            </label>
          </div>
          <div className="admin-tabs">
            {(['New', 'Under review', 'Resolved'] as Status[]).map((t) => (
              <button key={t} className={tab === t ? 'is-on' : ''} onClick={() => setTab(t)}>
                {t} <span>{reports.filter((x) => x.status === t).length}</span>
              </button>
            ))}
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Reported</th>
                <th>Reason</th>
                <th>Reports</th>
                <th>First reported</th>
                <th>Assignee</th>
              </tr>
            </thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.id} onClick={() => setOpen(x.id)}>
                  <td>
                    <span className={`admin-pri admin-pri--${x.priority.toLowerCase()}`}>{x.priority}</span>
                  </td>
                  <td>
                    <b>{x.name}</b>
                    <span className="admin-sub">
                      {x.kind} · {x.id}
                    </span>
                  </td>
                  <td>{x.reports[0].reason}</td>
                  <td>{x.reports.length}</td>
                  <td>{x.reports[x.reports.length - 1].at}</td>
                  <td>{x.assignee ?? '—'}</td>
                </tr>
              ))}
              {!list.length && (
                <tr>
                  <td colSpan={6} className="admin-empty">
                    Nothing here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </main>
      ) : (
        <main className="admin-main">
          <button className="admin-link admin-back" onClick={() => setOpen(null)}>
            <ArrowLeft size={15} /> All reports
          </button>
          <div className="admin-detail">
            <section className="admin-col">
              <div className="admin-card">
                <p className="admin-sub">
                  {r.kind} · {r.id} · <span className={`admin-pri admin-pri--${r.priority.toLowerCase()}`}>{r.priority}</span> · {r.status}
                </p>
                <h1>{r.name}</h1>
                <p className="admin-sub">{r.sub}</p>
                {r.removed && (
                  <p className="admin-flag">
                    <Lock size={13} /> Content removed from Ana
                  </p>
                )}
              </div>
              <div className="admin-card">
                <h2>
                  <FileText size={15} /> As reported
                </h2>
                <p className="admin-quote">{r.asReported}</p>
                <h2>
                  <Clock size={15} /> Now
                </h2>
                <p className="admin-quote">{r.now}</p>
              </div>
              <div className="admin-card">
                <h2>
                  <Flag size={15} /> {r.reports.length} {r.reports.length === 1 ? 'report' : 'reports'}
                </h2>
                {r.reports.map((x, i) => (
                  <div key={i} className="admin-report">
                    <p>
                      <b>{x.reason}</b> · {x.at}
                    </p>
                    {x.note && <p className="admin-quote">"{x.note}"</p>}
                    <p className="admin-sub">
                      <Lock size={11} /> Reporter (staff only): {x.reporter}
                    </p>
                  </div>
                ))}
              </div>
              <div className="admin-card">
                <h2>Context</h2>
                <ul>
                  {r.context.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </section>

            <aside className="admin-col admin-side">
              <div className="admin-card">
                <h2>Actions</h2>
                {r.status === 'New' && (
                  <button className="admin-btn" onClick={() => update(r.id, (x) => ({ ...x, status: 'Under review', assignee: STAFF, audit: [{ at: 'Now', who: STAFF, action: 'Assigned to self' }, ...x.audit] }))}>
                    Assign to me
                  </button>
                )}
                {r.kind === 'Credit' ? (
                  <>
                    <p className="admin-note">
                      <AlertTriangle size={13} /> Credits are records issued by a production and accepted by a person. Moderators can't delete them. Disputes go back to the issuing production.
                    </p>
                    {(['toProduction', 'hideCredit', 'escalate', 'dismiss'] as ActionId[]).map((a) => (
                      <button key={a} className={`admin-btn ${ACTIONS[a].high ? 'admin-btn--warn' : ''}`} onClick={() => setAct(a)}>
                        {ACTIONS[a].label}
                      </button>
                    ))}
                  </>
                ) : (
                  (['dismiss', 'warn', r.removed ? 'restore' : 'remove', 'restrict', 'suspend', 'escalate'] as ActionId[]).map((a) => (
                    <button key={a} className={`admin-btn ${ACTIONS[a].high ? 'admin-btn--warn' : ''}`} onClick={() => setAct(a)}>
                      {ACTIONS[a].label}
                    </button>
                  ))
                )}
                {(r.kind === 'Person' || r.kind === 'Production house') && <p className="admin-note">Suspending hides the profile and stops its actions. Accepted credits stay on their films.</p>}
              </div>
              <div className="admin-card">
                <h2>Audit history</h2>
                {r.audit.length ? (
                  <ol className="admin-audit">
                    {r.audit.map((a, i) => (
                      <li key={i}>
                        <b>{a.action}</b>
                        <span className="admin-sub">
                          {a.who} · {a.at}
                        </span>
                        {a.reason && <span className="admin-sub">Reason: {a.reason}</span>}
                        {a.note && <span className="admin-sub">{a.note}</span>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="admin-sub">No actions yet.</p>
                )}
              </div>
            </aside>
          </div>
        </main>
      )}

      {act && r && (
        <ActionModal
          id={act}
          report={r}
          onCancel={() => setAct(null)}
          onConfirm={(reason, note, duration) => {
            const resolves = ['dismiss', 'warn', 'remove', 'suspend', 'restrict', 'toProduction', 'hideCredit'].includes(act);
            update(r.id, (x) => ({
              ...x,
              removed: act === 'remove' ? true : act === 'restore' ? false : x.removed,
              status: act === 'escalate' ? 'Under review' : resolves ? 'Resolved' : x.status,
              assignee: act === 'escalate' ? 'Senior review' : x.assignee ?? STAFF,
              audit: [{ at: 'Now', who: STAFF, action: `${ACTIONS[act].label}${duration ? ` (${duration})` : ''}`, reason, note }, ...x.audit],
            }));
            setAct(null);
          }}
        />
      )}
    </div>
  );
}

/** Proportionate actions: every action needs a reason; high-impact ones need a typed note and a second confirmation. */
function ActionModal({ id, report, onCancel, onConfirm }: { id: ActionId; report: Report; onCancel: () => void; onConfirm: (reason: string, note: string, duration?: string) => void }) {
  const a = ACTIONS[id];
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [duration, setDuration] = useState(id === 'suspend' ? '30 days' : '7 days');
  const [sure, setSure] = useState(false);
  const needsDuration = id === 'restrict' || id === 'suspend';
  const ok = reason && (!a.high || note.trim().length >= 10) && (id !== 'suspend' || sure) && (id !== 'escalate' || note.trim());
  return (
    <div className="admin-modal-bg" onClick={onCancel}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          {a.label}: {report.name}
        </h2>
        <label>
          Reason
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Choose a reason</option>
            {REASONS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        {needsDuration && (
          <label>
            Duration
            <select value={duration} onChange={(e) => setDuration(e.target.value)}>
              {['24 hours', '7 days', '30 days', ...(id === 'suspend' ? ['Indefinite'] : [])].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          {a.high ? 'Explain the decision (required, recorded in audit history)' : id === 'escalate' ? 'Note for the senior reviewer (required)' : 'Note (optional)'}
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="admin-preview">
          <p className="admin-sub">What the reported person sees (draft for legal review)</p>
          <p>{a.person}</p>
          <p className="admin-sub">What reporters see</p>
          <p>{a.reporter}</p>
          <p className="admin-sub">Reporter identity is never shared.</p>
        </div>
        {id === 'suspend' && (
          <label className="admin-check">
            <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} /> I understand this hides the account and stops everything it can do.
          </label>
        )}
        <div className="admin-modal-actions">
          <button className="admin-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className={`admin-btn ${a.high ? 'admin-btn--danger' : 'admin-btn--primary'}`} disabled={!ok} onClick={() => onConfirm(reason, note, needsDuration ? duration : undefined)}>
            {a.label}
          </button>
        </div>
      </div>
    </div>
  );
}
