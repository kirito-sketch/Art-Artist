import { AlertTriangle, Archive, Check, ChevronRight, ExternalLink, FlaskConical, RotateCcw } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useStore } from '../state/store';
import { org, person } from '../state/selectors';
import { Toggle } from '../ui/primitives';
import { startResearch } from '../research';
import { openAdmin } from '../admin/adminMode';
import { labUrl } from '../qa/boot';
import { SCENARIOS } from '../qa/scenarios';
import { effective, isSettled } from '../qa/status';
import lastRun from '../qa/last-run.json';

/** From the last automated run (npm run test:edge). The Lab itself re-runs the checks live. */
const P0_REMAINING = SCENARIOS.filter((s) => s.priority === 'P0' && !isSettled(effective(s, lastRun.results as never).status)).length;

/*
 * Prototype console. Outside the phone and never part of Art and Artist.
 * Three audiences, three levels: stakeholders explore (always visible), research launches a clean
 * session (one clear action), design/QA tools live under Advanced (collapsed).
 * Everything shown is read from the live app state, so the console can't disagree with the phone.
 */

type Persona = 'kiran' | 'tara' | 'konark' | 'tidewater';
const PERSONAS: { id: Persona; name: string; sub: string; group: 'Individual' | 'Production house' }[] = [
  { id: 'kiran', name: 'Kiran Varma', sub: 'Cinematographer', group: 'Individual' },
  { id: 'tara', name: 'Tara Menon', sub: 'Actor, early career', group: 'Individual' },
  { id: 'konark', name: 'Konark Pictures', sub: 'Busy production house', group: 'Production house' },
  { id: 'tidewater', name: 'Tidewater Films', sub: 'Smaller production house', group: 'Production house' },
];

const TEST_STATES = [
  { key: 'newUser', label: 'New user (no network yet)' },
  { key: 'loading', label: 'Slow network' },
  { key: 'offline', label: 'Offline' },
  { key: 'forYouError', label: 'For you fails to load' },
  { key: 'failPublish', label: 'Posting fails' },
  { key: 'actionsFail', label: 'Actions fail once' },
] as const;

const STATUS = {
  decided: ['Large Cards is the individual Home', 'People can’t claim their own credits', 'Added to project is not a credit', 'One account; acting for a house is separate', 'A house’s profile is its public page', 'Minimal is the only active visual', 'Apple, Google and email sign-in', 'Unverified houses can’t post roles or credits', '18+ at launch', 'Deleting an account keeps accepted credits', 'No comments on posts', 'Members are permissions, not a team product'],
  validating: ['Who issues credits inside a house', 'Whether “Added to project” is real in practice', 'Recruiting for unannounced projects', 'Interest vs structured responses', 'When final credits are decided', 'Who operates Art and Artist for a house', 'Slate and Work first'],
  deferred: ['Credits for independent projects', 'Linking people not yet on Art and Artist', 'Bulk credit issuance', 'Guardian / minor accounts', 'Project publication lifecycle'],
};

const RESET_KEY = 'ana-reset';
/** Created people, houses and projects live in module data, so a clean reload is the only reset that can't leave anything behind. */
function resetPrototype() {
  try {
    sessionStorage.setItem(RESET_KEY, '1');
    sessionStorage.removeItem('ana-research');
    sessionStorage.removeItem('ana-admin');
  } catch {
    /* ignore */
  }
  const u = new URL(location.href);
  u.searchParams.delete('research');
  u.searchParams.delete('admin');
  location.href = u.toString();
}

export function PrototypeControls() {
  const s = useStore();
  const { viewer, acting, scenario, setScenario, homeLayout, setHomeLayout, look, setLook, houseHome, setHouseHome, houseProfile, setHouseProfile, roleModel, setRoleModel, canIssue, setCanIssue, startEntry, endEntry, entry, policyUpdate, setPolicyUpdate, verifyPendingHouses, showToast, setActing, switchViewer } = s;
  const [advanced, setAdvanced] = useState(false);
  const [open, setOpen] = useState<null | 'tests' | 'archive' | 'status' | 'baseline'>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(RESET_KEY)) {
        sessionStorage.removeItem(RESET_KEY);
        showToast({ text: 'Prototype reset' });
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- live context, read from the app ---- */
  const me = person(viewer.id);
  const house = acting !== 'self' ? org(acting) : null;
  // During sign-up, sign-in or an invite nobody is signed in yet: say so instead of naming the persona underneath.
  const signedOut = !!entry;
  const selected: Persona | null = signedOut ? null : house ? (acting === 'konark' || acting === 'tidewater' ? acting : null) : viewer.id === 'kiran' || viewer.id === 'tara' ? viewer.id : null;
  const activeTests = TEST_STATES.filter((t) => scenario[t.key]);
  const archived = [
    homeLayout === 'slides' && 'Full-screen slides Home',
    houseHome === 'pulse' && 'Pulse house Home',
    houseHome === 'queue' && 'Queue house Home',
    houseProfile === 'hiring' && 'Hiring-first house page',
    roleModel === 'respond' && 'Separate Respond form',
    look !== 'minimal' && `${look[0].toUpperCase()}${look.slice(1)} visual`,
  ].filter(Boolean) as string[];
  const walkthrough = entry ? { new: 'New person onboarding', invite: 'Accepting a house invite', signin: 'Sign in' }[entry.mode] : policyUpdate ? 'Policy update' : null;

  const clearArchive = () => {
    setHomeLayout('cards');
    setHouseHome('slate');
    setHouseProfile('work');
    setRoleModel('interest');
    setLook('minimal');
  };
  const clearTests = () => setScenario({ newUser: false, loading: false, offline: false, forYouError: false, failPublish: false, actionsFail: false });
  const exitWalkthrough = () => {
    endEntry();
    setPolicyUpdate(false);
  };

  /** Switching persona also leaves any walkthrough and archived view, so nothing stale carries over. */
  const explore = (p: Persona) => {
    exitWalkthrough();
    clearArchive();
    if (p === 'kiran' || p === 'tara') {
      setActing('self');
      switchViewer(p);
    } else {
      switchViewer('aditi');
      setActing(p);
    }
  };
  /** Flow shortcuts set up everything they need: a clean app, no archived view, no failure states. */
  const flow = (f: 'new' | 'signin' | 'invite' | 'policy') => {
    exitWalkthrough();
    clearArchive();
    clearTests();
    if (f === 'policy') {
      setActing('self');
      switchViewer('kiran');
      setPolicyUpdate(true);
      return;
    }
    startEntry(f);
  };
  /** Archived previews switch to a persona where they're visible. */
  const preview = (what: 'slides' | 'pulse' | 'queue' | 'hiring' | 'respond' | 'glass' | 'bold' | 'doodle') => {
    exitWalkthrough();
    clearArchive();
    if (what === 'slides' || what === 'respond') {
      if (house) explore('kiran');
      if (what === 'slides') setHomeLayout('slides');
      else setRoleModel('respond');
    } else if (what === 'pulse' || what === 'queue' || what === 'hiring') {
      if (!house) {
        switchViewer('aditi');
        setActing('konark');
      }
      if (what === 'hiring') setHouseProfile('hiring');
      else setHouseHome(what);
    } else setLook(what);
  };

  return (
    <aside className="pc" aria-label="Prototype console">
      <div className="pc-sticky">
        <div className="pc-top">
          <span className="pc-title">Art and Artist prototype</span>
          <button className="pc-quiet" onClick={resetPrototype} title="Return everything to the starting state">
            <RotateCcw size={13} /> Reset
          </button>
        </div>

        <section className="pc-now" aria-live="polite">
          <p className="pc-label">You're viewing Art and Artist as</p>
          <div className="pc-now-row">
            <span className={`pc-avatar ${house && !signedOut ? 'pc-avatar--org' : ''} ${signedOut ? 'pc-avatar--empty' : ''}`}>{signedOut ? '?' : (house?.name ?? me.name).split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
            <span className="pc-now-text">
              <span className="pc-now-name">{signedOut ? 'Not signed in' : house?.name ?? me.name}</span>
              <span className="pc-now-sub">{signedOut ? 'Entering Art and Artist' : house ? `${me.name.split(' ')[0]} acting for the house` : me.role}</span>
            </span>
          </div>
          {!signedOut && (
            <p className="pc-now-kind">
              {house ? 'Production house experience' : 'Personal experience'}
              {house && !house.verified && ' · verification pending'}
            </p>
          )}
          {walkthrough && (
            <Notice tone="info" label={`Walkthrough: ${walkthrough}`} action="Exit" onAction={exitWalkthrough} />
          )}
          {activeTests.length > 0 && <Notice tone="warn" label={`Test state on: ${activeTests.map((t) => t.label).join(', ')}`} action="Clear" onAction={clearTests} />}
          {archived.length > 0 && <Notice tone="archive" label={`Archived exploration: ${archived.join(', ')}`} action="Return to current" onAction={clearArchive} />}
        </section>
      </div>

      <section className="pc-sec">
        <p className="pc-label">Explore as</p>
        {(['Individual', 'Production house'] as const).map((g) => (
          <div key={g} className="pc-group">
            <p className="pc-group-h">{g}</p>
            <div className="pc-personas">
              {PERSONAS.filter((p) => p.group === g).map((p) => (
                <button key={p.id} className={`pc-persona ${selected === p.id ? 'is-on' : ''}`} onClick={() => explore(p.id)} aria-pressed={selected === p.id}>
                  <span className="pc-persona-name">{p.name}</span>
                  <span className="pc-persona-sub">{p.sub}</span>
                  {selected === p.id && (
                    <span className="pc-check" aria-hidden>
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="pc-sec">
        <p className="pc-label">Key flows</p>
        <div className="pc-list">
          <Row label="New person onboarding" hint="Splash, intro, sign-up, profile" onClick={() => flow('new')} />
          <Row label="Sign in" hint="Returning person" onClick={() => flow('signin')} />
          <Row label="Accept a house invite" hint="Joining Saffron Reel Studios" onClick={() => flow('invite')} />
          <Row label="Policy update" hint="Agreeing to changed terms" onClick={() => flow('policy')} />
          <Row label="Moderation console" hint="Internal tool for Art and Artist staff" onClick={openAdmin} external />
        </div>
        {/* Internal status, never shown inside the product (src/legal/docs.tsx, DraftTag). */}
        <p className="pc-note" role="note">
          Legal and policy copy (Before you join, Terms, Privacy, guidelines, house authority, policy update, Your data) is placeholder: draft for legal review.
        </p>
      </section>

      <section className="pc-sec">
        <p className="pc-label">Research</p>
        <button className="pc-primary" onClick={startResearch}>
          Start research session
        </button>
        <p className="pc-hint">Opens a clean session as Aditi acting for Konark. Reload to reset.</p>
      </section>

      <section className="pc-sec pc-sec--adv">
        <button className="pc-disclosure" onClick={() => setAdvanced((a) => !a)} aria-expanded={advanced}>
          <ChevronRight size={14} className={advanced ? 'is-open' : ''} />
          <span>Advanced</span>
          {(activeTests.length > 0 || archived.length > 0) && (
            <span className="pc-badge">
              {[activeTests.length && `${activeTests.length} test ${activeTests.length === 1 ? 'state' : 'states'} on`, archived.length && 'archived view'].filter(Boolean).join(' · ')}
            </span>
          )}
        </button>

        {advanced && (
          <div className="pc-adv">
            <p className="pc-group-h">Testing</p>
            <Sub title="Test states" meta={activeTests.length ? `${activeTests.length} on` : 'All off'} open={open === 'tests'} onToggle={() => setOpen(open === 'tests' ? null : 'tests')}>
              {TEST_STATES.map((t) => (
                <div key={t.key} className="pc-switch">
                  <span>{t.label}</span>
                  <Toggle on={scenario[t.key]} onChange={(v) => setScenario({ [t.key]: v })} label={t.label} />
                </div>
              ))}
              <div className="pc-switch">
                <span>Aditi can issue credits (house)</span>
                <Toggle on={canIssue} onChange={setCanIssue} label="Aditi can issue credits" />
              </div>
              <div className="pc-inline-actions">
                <button className="pc-quiet" onClick={clearTests} disabled={!activeTests.length}>
                  Reset test states
                </button>
                <button className="pc-quiet" onClick={() => (verifyPendingHouses(), showToast({ text: 'Pending houses verified (as the Art and Artist team)' }))}>
                  Verify pending houses
                </button>
              </div>
            </Sub>
            <a className="pc-row" href={labUrl()}>
              <FlaskConical size={14} />
              <span className="pc-row-text">
                <span>Open Edge Case Lab</span>
                <span className="pc-row-hint">P0: {P0_REMAINING} remaining</span>
              </span>
              <ChevronRight size={14} />
            </a>

            <p className="pc-group-h">Reference</p>
            <Sub title="Archived explorations" meta={archived.length ? 'Viewing one' : 'Reference only'} open={open === 'archive'} onToggle={() => setOpen(open === 'archive' ? null : 'archive')}>
              <p className="pc-hint">Earlier directions kept for comparison. Not current and not maintained.</p>
              {(
                [
                  ['Individual Home', [['slides', 'Full-screen slides', homeLayout === 'slides']]],
                  ['House Home', [['pulse', 'Pulse · activity first', houseHome === 'pulse'], ['queue', 'Queue · decisions list', houseHome === 'queue']]],
                  ['House page', [['hiring', 'Hiring first', houseProfile === 'hiring']]],
                  ['Responding to roles', [['respond', 'Separate Respond form', roleModel === 'respond']]],
                  ['Visual directions', [['glass', 'Glass', look === 'glass'], ['bold', 'Bold', look === 'bold'], ['doodle', 'Doodle', look === 'doodle']]],
                ] as [string, [Parameters<typeof preview>[0], string, boolean][]][]
              ).map(([h, items]) => (
                <div key={h} className="pc-archive-group">
                  <p className="pc-archive-h">{h}</p>
                  {items.map(([id, label, on]) => (
                    <button key={id} className={`pc-archive ${on ? 'is-on' : ''}`} onClick={() => (on ? clearArchive() : preview(id))} aria-pressed={on}>
                      <Archive size={12} />
                      <span>{label}</span>
                      <span className="pc-tag">{on ? 'Viewing' : 'Archived'}</span>
                    </button>
                  ))}
                </div>
              ))}
            </Sub>
            <Sub title="Product status" meta={`${STATUS.decided.length} decided · ${STATUS.validating.length} validating · ${STATUS.deferred.length} deferred`} open={open === 'status'} onToggle={() => setOpen(open === 'status' ? null : 'status')}>
              {(
                [
                  ['Decided', STATUS.decided],
                  ['Being validated with production houses', STATUS.validating],
                  ['Deferred', STATUS.deferred],
                ] as const
              ).map(([h, list]) => (
                <div key={h}>
                  <p className="pc-archive-h">{h}</p>
                  <ul className="pc-ul">
                    {list.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </Sub>
            <Sub title="About this prototype" meta="Current design baseline" open={open === 'baseline'} onToggle={() => setOpen(open === 'baseline' ? null : 'baseline')}>
              <dl className="pc-dl">
                <dt>Visual</dt>
                <dd>Minimal</dd>
                <dt>Individual Home</dt>
                <dd>Large Cards</dd>
                <dt>House Home</dt>
                <dd>Slate</dd>
                <dt>House page</dt>
                <dd>Work first</dd>
                <dt>Responding to roles</dt>
                <dd>One Interest model</dd>
                <dt>New work</dt>
                <dd>One design only</dd>
              </dl>
              <p className="pc-hint">Nothing is saved: reloading the page also resets the prototype. Esc goes back inside the phone.</p>
            </Sub>

            <p className="pc-group-h">Internal</p>
            <button className="pc-row" onClick={resetPrototype}>
              <RotateCcw size={14} />
              <span className="pc-row-text">
                <span>Reset prototype</span>
                <span className="pc-row-hint">Starting persona, demo data, no test states or archived views</span>
              </span>
            </button>
          </div>
        )}
      </section>
    </aside>
  );
}

function Row({ label, hint, onClick, external }: { label: string; hint: string; onClick: () => void; external?: boolean }) {
  return (
    <button className="pc-row" onClick={onClick}>
      <span className="pc-row-text">
        <span>{label}</span>
        <span className="pc-row-hint">{hint}</span>
      </span>
      {external ? <ExternalLink size={13} /> : <ChevronRight size={14} />}
    </button>
  );
}

function Sub({ title, meta, open, onToggle, children }: { title: string; meta: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="pc-sub">
      <button className="pc-sub-head" onClick={onToggle} aria-expanded={open}>
        <ChevronRight size={13} className={open ? 'is-open' : ''} />
        <span className="pc-row-text">
          <span>{title}</span>
          <span className="pc-row-hint">{meta}</span>
        </span>
      </button>
      {open && <div className="pc-sub-body">{children}</div>}
    </div>
  );
}

function Notice({ tone, label, action, onAction }: { tone: 'warn' | 'archive' | 'info'; label: string; action: string; onAction: () => void }) {
  return (
    <div className={`pc-notice pc-notice--${tone}`} role="status">
      {tone === 'warn' ? <AlertTriangle size={13} /> : tone === 'archive' ? <Archive size={13} /> : null}
      <span>{label}</span>
      <button onClick={onAction}>{action}</button>
    </div>
  );
}

/** Prototype-only notice above the phone (outside the app) so nobody reviews a non-current state by accident. */
export function StageNotice() {
  const { scenario, homeLayout, houseHome, houseProfile, roleModel, look, setHomeLayout, setHouseHome, setHouseProfile, setRoleModel, setLook, setScenario } = useStore();
  const archived = homeLayout === 'slides' || houseHome !== 'slate' || houseProfile !== 'work' || roleModel !== 'interest' || look !== 'minimal';
  const tests = TEST_STATES.filter((t) => scenario[t.key]).length;
  if (!archived && !tests) return null;
  return (
    <div className="stage-notice" role="status">
      {archived && (
        <span className="stage-notice-item stage-notice-item--archive">
          <Archive size={13} /> Viewing archived exploration
          <button
            onClick={() => {
              setHomeLayout('cards');
              setHouseHome('slate');
              setHouseProfile('work');
              setRoleModel('interest');
              setLook('minimal');
            }}
          >
            Return to current design
          </button>
        </span>
      )}
      {tests > 0 && (
        <span className="stage-notice-item stage-notice-item--warn">
          <AlertTriangle size={13} /> {tests} test {tests === 1 ? 'state' : 'states'} on
          <button onClick={() => setScenario({ newUser: false, loading: false, offline: false, forYouError: false, failPublish: false, actionsFail: false })}>Clear</button>
        </span>
      )}
    </div>
  );
}
