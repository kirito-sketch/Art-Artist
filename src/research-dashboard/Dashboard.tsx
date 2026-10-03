/**
 * Research Dashboard (/research). Internal prototype dashboard: opens directly, no sign-in. All data
 * comes from the server-side read API (/api/research/dashboard/*), which uses the server-only service
 * role; the browser holds no Supabase key. Four sections: Overview, Sessions, Tasks, Feedback, plus
 * session, task and feedback detail. Study and prototype version are global filters and the version
 * breakdown is always visible. docs/RESEARCH_DASHBOARD.md.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import './dashboard.css';
import { DashboardError, FIRST_RUN_TASK, isFirstRunAnswer, isSurvey, loadEvents, loadEventsForAttempts, loadStudies, loadStudy, loadStudyEvents, setFeedbackStatus, type Attempt, type Feedback, type Session, type Study, type StudyData, type Task } from './data';
import { compareHome, computeHealth, homeArms, HOME_ARM_LABEL, type HealthEvent, type HomeArm } from './health';
import { CATEGORY_LABEL, STUCK_LABEL, FIRST_RUN_LABEL, FIRST_RUN_ORDER, OUTCOME_LABEL, STATUS_LABEL, SURVEY_LABEL, SURVEY_ORDER, eventLabel, fmtDate, fmtDuration, mean, median, pathOf, pct, screenLabel, type EventRow } from './labels';

type Route = { view: 'overview' | 'health' | 'sessions' | 'tasks' | 'feedback'; id?: string };
const parseHash = (): Route => {
  const [, view, id] = (location.hash.replace(/^#\/?/, '/') || '/').split('/');
  return { view: (['overview', 'health', 'sessions', 'tasks', 'feedback'].includes(view) ? view : 'overview') as Route['view'], id: id || undefined };
};
const go = (r: Route) => (location.hash = `/${r.view}${r.id ? `/${r.id}` : ''}`);
const done = (a: Attempt) => a.outcome === 'completed' || a.outcome === 'completed_with_difficulty';
const closed = (a: Attempt) => a.outcome !== 'in_progress';
const fmt1 = (n: number | null) => (n == null ? '-' : n.toFixed(1));
const who = (s: Session | undefined) => s?.research_participants?.participant_code ?? '?';

export default function Dashboard() {
  useEffect(() => {
    document.title = 'Art and Artist Research';
  }, []);
  return <Workspace />;
}

const loadError = (e: unknown, what: string) =>
  e instanceof DashboardError && e.status === 401
    ? 'Your access has expired. Reload the page to enter the access password again.'
    : e instanceof DashboardError && e.code === 'access_not_configured'
      ? 'Private access (APP_ACCESS_PASSWORD) is not configured on this deployment.'
      : e instanceof DashboardError && e.status === 503
      ? 'The research backend is not configured on this deployment.'
      : `Could not load ${what}. Check the connection and refresh.`;

function Workspace() {
  const [route, setRoute] = useState<Route>(parseHash());
  const [studies, setStudies] = useState<Study[]>([]);
  const [studyId, setStudyId] = useState<string | null>(null);
  const [data, setData] = useState<StudyData | null>(null);
  const [version, setVersion] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    loadStudies()
      .then((s) => {
        setStudies(s);
        setStudyId((cur) => cur ?? ([...s].reverse().find((x) => x.status === 'active') ?? s[0])?.id ?? null);
      })
      .catch((e) => setError(loadError(e, 'studies')));
  }, []);
  const reload = () => studyId && loadStudy(studyId).then(setData).catch((e) => setError(loadError(e, 'this study')));
  useEffect(() => {
    setData(null);
    setVersion('all');
    void reload();
  }, [studyId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Version filter applies to everything below it.
  const view = useMemo(() => {
    if (!data) return null;
    const sessions = version === 'all' ? data.sessions : data.sessions.filter((s) => s.prototype_version === version);
    const ids = new Set(sessions.map((s) => s.id));
    return { tasks: data.tasks, sessions, attempts: data.attempts.filter((a) => ids.has(a.session_id)), feedback: data.feedback.filter((f) => ids.has(f.session_id)), all: data };
  }, [data, version]);
  const versions = useMemo(() => [...new Set((data?.sessions ?? []).map((s) => s.prototype_version))].sort(), [data]);

  return (
    <main className="dash">
      <header className="dash-top">
        <div className="dash-brand">
          <span className="dash-eyebrow">Art and Artist Research</span>
          <select aria-label="Study" value={studyId ?? ''} onChange={(e) => setStudyId(e.target.value)}>
            {studies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.status})
              </option>
            ))}
          </select>
        </div>
        <nav className="dash-nav" aria-label="Sections">
          {(['overview', 'health', 'sessions', 'tasks', 'feedback'] as const).map((v) => (
            <a key={v} href={`#/${v}`} className={route.view === v ? 'is-on' : ''} aria-current={route.view === v ? 'page' : undefined}>
              {v === 'health' ? 'Study health' : v[0].toUpperCase() + v.slice(1)}
            </a>
          ))}
        </nav>
        <div className="dash-right">
          <label className="dash-version">
            Version
            <select value={version} onChange={(e) => setVersion(e.target.value)}>
              <option value="all">All versions ({versions.length})</option>
              {versions.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <button className="dash-link" onClick={() => void reload()}>
            Refresh
          </button>
        </div>
      </header>
      {version === 'all' && versions.length > 1 && (
        <p className="dash-banner" role="note">
          Showing {versions.length} prototype versions combined ({versions.map((v) => `${v}: ${data!.sessions.filter((s) => s.prototype_version === v).length}`).join(' · ')}). Choose a version to compare like with like.
        </p>
      )}
      {error && <p className="dash-error">{error}</p>}
      {!view ? (
        <p className="dash-loading">Loading…</p>
      ) : route.view === 'overview' ? (
        <Overview v={view} />
      ) : route.view === 'health' ? (
        <Health v={view} study={studies.find((x) => x.id === studyId)} />
      ) : route.view === 'sessions' ? (
        route.id ? <SessionDetail v={view} id={route.id} /> : <Sessions v={view} />
      ) : route.view === 'tasks' ? (
        route.id ? <TaskDetail v={view} id={route.id} /> : <Tasks v={view} />
      ) : (
        <FeedbackInbox v={view} openId={route.id} onChanged={reload} versions={versions} />
      )}
    </main>
  );
}

type View = { tasks: Task[]; sessions: Session[]; attempts: Attempt[]; feedback: Feedback[]; all: StudyData };

function taskStats(t: Task, v: View) {
  const as = v.attempts.filter((a) => a.task_id === t.id);
  const cl = as.filter(closed);
  const ok = as.filter(done);
  const ratings = as.map((a) => a.difficulty_rating).filter((x): x is number => x != null);
  const ids = new Set(as.map((a) => a.id));
  return {
    attempts: as.length,
    closed: cl.length,
    completed: ok.length,
    withDifficulty: as.filter((a) => a.outcome === 'completed_with_difficulty').length,
    abandoned: as.filter((a) => a.outcome === 'abandoned').length,
    skipped: as.filter((a) => a.outcome === 'skipped').length,
    medianMs: median(ok.map((a) => a.duration_ms).filter((x): x is number => x != null)),
    difficulty: mean(ratings),
    feedback: v.feedback.filter((f) => !isSurvey(f) && f.task_attempt_id && ids.has(f.task_attempt_id)).length,
  };
}

// ------------------------------------------------------------------------------------------- overview
function Overview({ v }: { v: View }) {
  const total = v.sessions.length;
  const completed = v.sessions.filter((s) => s.status === 'completed').length;
  const abandoned = v.sessions.filter((s) => s.status === 'abandoned').length;
  const ratings = v.attempts.map((a) => a.difficulty_rating).filter((x): x is number => x != null);
  const fb = v.feedback.filter((f) => !isSurvey(f));
  const byVersion = [...new Set(v.all.sessions.map((s) => s.prototype_version))].sort().map((ver) => {
    const ss = v.all.sessions.filter((s) => s.prototype_version === ver);
    const ids = new Set(ss.map((s) => s.id));
    const rs = v.all.attempts.filter((a) => ids.has(a.session_id)).map((a) => a.difficulty_rating).filter((x): x is number => x != null);
    return { ver, n: ss.length, completed: ss.filter((s) => s.status === 'completed').length, abandoned: ss.filter((s) => s.status === 'abandoned').length, difficulty: mean(rs) };
  });
  return (
    <section className="dash-section" aria-label="Overview">
      <div className="dash-stats">
        <Stat label="Sessions" value={total} />
        <Stat label="Completed" value={completed} />
        <Stat label="Abandoned" value={abandoned} />
        <Stat label="In progress" value={total - completed - abandoned} />
        <Stat label="Completion rate" value={pct(completed, total)} />
        <Stat label="Avg task difficulty" value={fmt1(mean(ratings))} hint="1 very easy, 5 very difficult" />
        <Stat label="Feedback items" value={fb.length} />
      </div>
      <FirstRun v={v} />
      <h2>Prototype versions</h2>
      <table className="dash-table">
        <thead>
          <tr>
            <th>Version</th>
            <th>Sessions</th>
            <th>Completed</th>
            <th>Abandoned</th>
            <th>Avg difficulty</th>
          </tr>
        </thead>
        <tbody>
          {byVersion.map((r) => (
            <tr key={r.ver}>
              <td>
                <span className="dash-ver">{r.ver}</span>
              </td>
              <td>{r.n}</td>
              <td>{r.completed}</td>
              <td>{r.abandoned}</td>
              <td>{fmt1(r.difficulty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Tasks</h2>
      <TaskTable v={v} />
    </section>
  );
}

/**
 * Task 1 (Getting started): the first-run experience, from splash to the main product. Built from the
 * task's attempts, the questions asked after it (feedback rows, source first_run) and feedback sent
 * during it. Absent for studies without this task.
 */
function FirstRun({ v }: { v: View }) {
  const t = v.tasks.find((x) => x.key === FIRST_RUN_TASK);
  if (!t) return null;
  const st = taskStats(t, v);
  const ids = new Set(v.attempts.filter((a) => a.task_id === t.id).map((a) => a.id));
  const inTask = (f: Feedback) => !!f.task_attempt_id && ids.has(f.task_attempt_id);
  const answers = v.feedback.filter((f) => isFirstRunAnswer(f) && inTask(f));
  const q = (k: string) => answers.filter((f) => f.interaction_context?.question === k);
  const avg = (k: string) => mean(q(k).map((f) => f.interaction_context?.rating).filter((x): x is number => typeof x === 'number'));
  const during = v.feedback.filter((f) => !isSurvey(f) && inTask(f));
  const who = (f: Feedback) => {
    const p = v.sessions.find((x) => x.id === f.session_id)?.research_participants;
    return (
      <a href={`#/sessions/${f.session_id}`} className="dash-sub">
        {p?.participant_code ?? 'session'}
      </a>
    );
  };
  const quotes = (list: Feedback[], empty: string) =>
    list.length ? (
      list.map((f) => (
        <blockquote key={f.id} className="dash-quote">
          <span>{f.participant_comment}</span>
          <span>{who(f)}</span>
        </blockquote>
      ))
    ) : (
      <p className="dash-empty">{empty}</p>
    );
  return (
    <>
      <h2>
        Task {t.sequence}: {t.title} (first run, splash to the main product)
      </h2>
      <div className="dash-stats">
        <Stat label="Attempts" value={st.attempts} />
        <Stat label="Completion rate" value={pct(st.completed, st.closed)} hint="Completed (including with difficulty) out of finished attempts" />
        <Stat label="Abandoned" value={`${st.abandoned} (${pct(st.abandoned, st.closed)})`} hint="Ended the test during the first run" />
        <Stat label="Skipped" value={st.skipped} />
        <Stat label="Median time to first Home" value={fmtDuration(st.medianMs)} hint="From Open Art and Artist (splash) to the main product, completed attempts" />
        <Stat label="Understand what it is for" value={fmt1(avg('understand_product'))} hint="1 very difficult, 5 very easy" />
        <Stat label="Getting started" value={fmt1(avg('get_started'))} hint="1 very difficult, 5 very easy" />
      </div>
      <h3>What participants think Art and Artist helps them do</h3>
      {quotes(q('what_it_helps_you_do').filter((f) => f.participant_comment), 'No answers yet.')}
      <h3>Unclear during the introduction or setup</h3>
      {quotes(q('setup_unclear').filter((f) => f.participant_comment), 'Nothing reported yet.')}
      <h3>Feedback sent during the first run</h3>
      {during.length ? (
        during.map((f) => (
          <p key={f.id} className="dash-fb-inline">
            <span className="dash-cat">{CATEGORY_LABEL[f.category]}</span>
            {f.interaction_context?.source === 'stuck' && <span className="dash-sub"> (I'm stuck)</span>}: {f.participant_comment ?? <i>no comment</i>} {who(f)}
          </p>
        ))
      ) : (
        <p className="dash-empty">None yet.</p>
      )}
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="dash-stat" title={hint}>
      <span className="dash-stat-value">{value}</span>
      <span className="dash-stat-label">{label}</span>
    </div>
  );
}

function TaskTable({ v }: { v: View }) {
  return (
    <table className="dash-table">
      <thead>
        <tr>
          <th>Task</th>
          <th>Attempts</th>
          <th>Completion</th>
          <th>With difficulty</th>
          <th>Abandoned</th>
          <th>Skipped</th>
          <th>Median time</th>
          <th>Avg difficulty</th>
          <th>Feedback</th>
        </tr>
      </thead>
      <tbody>
        {v.tasks.map((t) => {
          const s = taskStats(t, v);
          return (
            <tr key={t.id} className="dash-click" onClick={() => go({ view: 'tasks', id: t.id })}>
              <td>
                <a href={`#/tasks/${t.id}`} onClick={(e) => e.stopPropagation()}>
                  {t.sequence}. {t.title}
                </a>
              </td>
              <td>{s.attempts}</td>
              <td>{pct(s.completed, s.closed)}</td>
              <td>{pct(s.withDifficulty, s.closed)}</td>
              <td>{pct(s.abandoned, s.closed)}</td>
              <td>{pct(s.skipped, s.closed)}</td>
              <td>{fmtDuration(s.medianMs)}</td>
              <td>{fmt1(s.difficulty)}</td>
              <td>{s.feedback}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ------------------------------------------------------------------------------------------- sessions
function Sessions({ v }: { v: View }) {
  const [status, setStatus] = useState('all');
  const [ptype, setPtype] = useState('all');
  const rows = v.sessions.filter((s) => (status === 'all' || s.status === status) && (ptype === 'all' || (s.research_participants?.participant_type ?? 'unknown') === ptype));
  return (
    <section className="dash-section" aria-label="Sessions">
      <div className="dash-filters">
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="abandoned">Abandoned</option>
            <option value="active">In progress</option>
          </select>
        </label>
        <label>
          Participant type
          <select value={ptype} onChange={(e) => setPtype(e.target.value)}>
            <option value="all">All</option>
            <option value="individual_creative">Individual creative</option>
            <option value="production_house">Production house</option>
          </select>
        </label>
        <span className="dash-count">{rows.length} sessions</span>
      </div>
      <table className="dash-table">
        <thead>
          <tr>
            <th>Participant</th>
            <th>Role / craft</th>
            <th>Version</th>
            <th>Started</th>
            <th>Tasks completed</th>
            <th>Status</th>
            <th>Avg difficulty</th>
            <th>Feedback</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const as = v.attempts.filter((a) => a.session_id === s.id);
            const rs = as.map((a) => a.difficulty_rating).filter((x): x is number => x != null);
            const p = s.research_participants;
            return (
              <tr key={s.id} className="dash-click" onClick={() => go({ view: 'sessions', id: s.id })}>
                <td>
                  <a href={`#/sessions/${s.id}`} onClick={(e) => e.stopPropagation()}>
                    <b>{p?.participant_code}</b>
                  </a>
                  {p?.display_name && <span className="dash-sub"> {p.display_name}</span>}
                </td>
                <td>{p?.primary_craft ?? '-'}</td>
                <td>
                  <span className="dash-ver">{s.prototype_version}</span>
                </td>
                <td>{fmtDate(s.started_at)}</td>
                <td>
                  {as.filter(done).length} / {v.tasks.length}
                </td>
                <td>
                  <Status s={s.status} />
                </td>
                <td>{fmt1(mean(rs))}</td>
                <td>{v.feedback.filter((f) => f.session_id === s.id && !isSurvey(f)).length}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function Status({ s }: { s: string }) {
  return <span className={`dash-status dash-status--${s}`}>{s === 'active' ? 'In progress' : s[0].toUpperCase() + s.slice(1)}</span>;
}

function SessionDetail({ v, id }: { v: View; id: string }) {
  const s = v.all.sessions.find((x) => x.id === id);
  const [events, setEvents] = useState<EventRow[] | null>(null);
  useEffect(() => {
    loadEvents(id).then(setEvents).catch(() => setEvents([]));
  }, [id]);
  if (!s) return <p className="dash-empty">Session not found in this study.</p>;
  const p = s.research_participants;
  const attempts = v.all.attempts.filter((a) => a.session_id === id);
  const fb = v.all.feedback.filter((f) => f.session_id === id);
  const survey = fb.filter((f) => f.interaction_context?.source === 'survey');
  const total = s.completed_at ? Date.parse(s.completed_at) - Date.parse(s.started_at) : null;
  return (
    <section className="dash-section" aria-label={`Session ${p?.participant_code}`}>
      <a href="#/sessions" className="dash-back">
        ← Sessions
      </a>
      <div className="dash-summary">
        <h1>
          {p?.participant_code} {p?.display_name && <span className="dash-sub">{p.display_name}</span>}
        </h1>
        <dl>
          <dt>Status</dt>
          <dd>
            <Status s={s.status} />
          </dd>
          <dt>Version</dt>
          <dd>
            <span className="dash-ver">{s.prototype_version}</span>
          </dd>
          <dt>Craft</dt>
          <dd>{p?.primary_craft ?? '-'}</dd>
          <dt>Experience</dt>
          <dd>{p?.experience_level ?? '-'}</dd>
          <dt>Persona</dt>
          <dd>{s.selected_persona ?? '-'}</dd>
          <dt>Device</dt>
          <dd>
            {s.device_type} {s.viewport_width}×{s.viewport_height}
          </dd>
          <dt>Started</dt>
          <dd>{fmtDate(s.started_at)}</dd>
          <dt>Length</dt>
          <dd>{fmtDuration(total)}</dd>
        </dl>
      </div>
      <h2>Tasks</h2>
      {v.all.tasks.map((t) => {
        const a = attempts.find((x) => x.task_id === t.id);
        if (!a)
          return (
            <article key={t.id} className="dash-attempt dash-attempt--none">
              <h3>
                Task {t.sequence}: {t.title}
              </h3>
              <p className="dash-sub">{t.created_at && Date.parse(t.created_at) > Date.parse(s.started_at) ? 'Not part of this session (task added later)' : 'Not reached'}</p>
            </article>
          );
        const evs = (events ?? []).filter((e) => e.task_attempt_id === a.id);
        const stuck = evs.some((e) => e.event_name === 'stuck_reported');
        const afb = fb.filter((f) => f.task_attempt_id === a.id && !isSurvey(f));
        return (
          <article key={t.id} className="dash-attempt">
            <h3>
              Task {t.sequence}: {t.title}
            </h3>
            <dl className="dash-attempt-facts">
              <dt>Outcome</dt>
              <dd>
                <span className={`dash-outcome dash-outcome--${a.outcome}`}>{OUTCOME_LABEL[a.outcome]}</span>
                {a.success_detected && <span className="dash-sub"> · success detected</span>}
                {stuck && <span className="dash-sub"> · used I'm stuck</span>}
              </dd>
              <dt>Time</dt>
              <dd>{fmtDuration(a.duration_ms)}</dd>
              <dt>Difficulty</dt>
              <dd>{a.difficulty_rating ? `${a.difficulty_rating}/5` : '-'}</dd>
              <dt>Expected</dt>
              <dd>{a.expectation_match == null ? '-' : a.expectation_match >= 3 ? 'Yes' : 'No'}</dd>
            </dl>
            <p className="dash-path">
              <span className="dash-label">Path</span> {events === null ? 'Loading…' : pathOf(evs).join(' → ') || '-'}
            </p>
            {a.feedback_text && (
              <blockquote className="dash-quote">
                {a.feedback_text.split('\n').map((l, i) => (
                  <span key={i}>{l}</span>
                ))}
              </blockquote>
            )}
            {fb.some((f) => f.task_attempt_id === a.id && isFirstRunAnswer(f)) && (
              <dl className="dash-survey">
                {fb
                  .filter((f) => f.task_attempt_id === a.id && isFirstRunAnswer(f))
                  .sort((x, y) => FIRST_RUN_ORDER.indexOf(x.interaction_context?.question as string) - FIRST_RUN_ORDER.indexOf(y.interaction_context?.question as string))
                  .map((f) => (
                    <div key={f.id}>
                      <dt>{FIRST_RUN_LABEL[f.interaction_context?.question as string] ?? String(f.interaction_context?.question)}</dt>
                      <dd>{f.interaction_context?.rating != null ? `${f.interaction_context.rating}/5` : f.participant_comment}</dd>
                    </div>
                  ))}
              </dl>
            )}
            {afb.map((f) => (
              <p key={f.id} className="dash-fb-inline">
                <span className="dash-cat">{CATEGORY_LABEL[f.category]}</span>
                {f.interaction_context?.source === 'stuck' && <span className="dash-sub"> (I'm stuck)</span>} on {screenLabel(f.screen)}: {f.participant_comment ?? <i>no comment</i>}
              </p>
            ))}
          </article>
        );
      })}
      {survey.length > 0 && (
        <>
          <h2>Final survey</h2>
          <dl className="dash-survey">
            {[...survey].sort((a, b) => SURVEY_ORDER.indexOf(a.interaction_context?.question as string) - SURVEY_ORDER.indexOf(b.interaction_context?.question as string)).map((f) => (
              <div key={f.id}>
                <dt>{SURVEY_LABEL[f.interaction_context?.question as string] ?? String(f.interaction_context?.question)}</dt>
                <dd>{f.interaction_context?.rating != null ? `${f.interaction_context.rating}/5` : f.participant_comment}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      <h2>Event trail</h2>
      <ol className="dash-trail">
        {(events ?? []).map((e) => (
          <li key={e.sequence}>
            <span className="dash-seq">{e.sequence}</span>
            <span>{eventLabel(e)}</span>
            <span className="dash-sub">{screenLabel(e.screen)}</span>
            <details>
              <summary aria-label={`Raw data for event ${e.sequence}`}>raw</summary>
              <pre>{JSON.stringify({ event: e.event_name, object_type: e.object_type, object_id: e.object_id, metadata: e.metadata, at: e.created_at }, null, 1)}</pre>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}

// --------------------------------------------------------------------------------------------- tasks
function Tasks({ v }: { v: View }) {
  return (
    <section className="dash-section" aria-label="Tasks">
      <TaskTable v={v} />
      <p className="dash-note">Completion counts completed and completed-with-difficulty out of finished attempts. Median time is for completed attempts.</p>
    </section>
  );
}

function TaskDetail({ v, id }: { v: View; id: string }) {
  const t = v.tasks.find((x) => x.id === id);
  const attempts = v.attempts.filter((a) => a.task_id === id).sort((a, b) => a.started_at.localeCompare(b.started_at));
  const [events, setEvents] = useState<EventRow[] | null>(null);
  useEffect(() => {
    loadEventsForAttempts(attempts.map((a) => a.id)).then(setEvents).catch(() => setEvents([]));
  }, [id, attempts.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!t) return <p className="dash-empty">Task not found.</p>;
  const s = taskStats(t, v);
  return (
    <section className="dash-section" aria-label={`Task ${t.sequence}`}>
      <a href="#/tasks" className="dash-back">
        ← Tasks
      </a>
      <h1>
        Task {t.sequence}: {t.title}
      </h1>
      <p className="dash-instruction">{t.instruction}</p>
      <p className="dash-sub">Success events: {t.success_events.length ? t.success_events.join(', ') : 'none (participant says when done)'}</p>
      <div className="dash-stats">
        <Stat label="Attempts" value={s.attempts} />
        <Stat label="Completion" value={pct(s.completed, s.closed)} />
        <Stat label="Abandoned" value={pct(s.abandoned, s.closed)} />
        <Stat label="Skipped" value={pct(s.skipped, s.closed)} />
        <Stat label="Median time" value={fmtDuration(s.medianMs)} />
        <Stat label="Avg difficulty" value={fmt1(s.difficulty)} />
        <Stat label="Feedback" value={s.feedback} />
      </div>
      <h2>Attempts</h2>
      <ul className="dash-attempts">
        {attempts.map((a) => {
          const sess = v.all.sessions.find((x) => x.id === a.session_id);
          return (
            <li key={a.id}>
              <a href={`#/sessions/${a.session_id}`}>
                <b>{who(sess)}</b>
              </a>{' '}
              · <span className={`dash-outcome dash-outcome--${a.outcome}`}>{OUTCOME_LABEL[a.outcome].toLowerCase()}</span> · {fmtDuration(a.duration_ms)} · difficulty {a.difficulty_rating ?? '-'} · <span className="dash-ver">{sess?.prototype_version}</span>
              <div className="dash-path dash-sub">{events === null ? '' : pathOf(events.filter((e) => e.task_attempt_id === a.id)).join(' → ')}</div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------------------------------------ feedback
function FeedbackInbox({ v, openId, onChanged, versions }: { v: View; openId?: string; onChanged: () => void; versions: string[] }) {
  const [cat, setCat] = useState('all');
  const [task, setTask] = useState('all');
  const [screen, setScreen] = useState('all');
  const [status, setStatus] = useState('all');
  const [ver, setVer] = useState('all');
  const attemptTask = new Map(v.attempts.map((a) => [a.id, a.task_id]));
  const items = v.feedback.filter((f) => !isSurvey(f));
  const screens = [...new Set(items.map((f) => f.screen ?? '-'))];
  const rows = items.filter(
    (f) =>
      (cat === 'all' || f.category === cat) &&
      (task === 'all' || (f.task_attempt_id && attemptTask.get(f.task_attempt_id) === task)) &&
      (screen === 'all' || (f.screen ?? '-') === screen) &&
      (status === 'all' || f.status === status) &&
      (ver === 'all' || f.prototype_version === ver),
  );
  return (
    <section className="dash-section" aria-label="Feedback">
      <div className="dash-chips" role="group" aria-label="Category">
        {['all', ...Object.keys(CATEGORY_LABEL)].map((c) => (
          <button key={c} className={`dash-chip ${cat === c ? 'is-on' : ''}`} aria-pressed={cat === c} onClick={() => setCat(c)}>
            {c === 'all' ? 'All' : CATEGORY_LABEL[c]} <span className="dash-sub">{c === 'all' ? items.length : items.filter((f) => f.category === c).length}</span>
          </button>
        ))}
      </div>
      <div className="dash-filters">
        <label>
          Task
          <select value={task} onChange={(e) => setTask(e.target.value)}>
            <option value="all">All</option>
            {v.tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.sequence}. {t.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Version
          <select value={ver} onChange={(e) => setVer(e.target.value)}>
            <option value="all">All</option>
            {versions.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Screen
          <select value={screen} onChange={(e) => setScreen(e.target.value)}>
            <option value="all">All</option>
            {screens.map((x) => (
              <option key={x} value={x}>
                {screenLabel(x)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            {Object.entries(STATUS_LABEL).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <span className="dash-count">{rows.length} items</span>
      </div>
      <div className="dash-cards">
        {rows.map((f) => (
          <FeedbackCard key={f.id} f={f} v={v} open={openId === f.id} onChanged={onChanged} />
        ))}
        {!rows.length && <p className="dash-empty">No feedback matches these filters.</p>}
      </div>
    </section>
  );
}

function FeedbackCard({ f, v, open, onChanged }: { f: Feedback; v: View; open: boolean; onChanged: () => void }) {
  const s = v.all.sessions.find((x) => x.id === f.session_id);
  const a = v.all.attempts.find((x) => x.id === f.task_attempt_id);
  const t = v.all.tasks.find((x) => x.id === a?.task_id);
  const [trail, setTrail] = useState<string[] | null>(null);
  const [status, setStatus] = useState(f.status);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (f.trail_until_sequence == null) return setTrail([]);
    loadEvents(f.session_id, f.trail_until_sequence)
      .then((evs) => setTrail(pathOf(evs).slice(-7)))
      .catch(() => setTrail([]));
  }, [f.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <article className={`dash-card ${open ? 'is-open' : ''}`} id={`fb-${f.id}`}>
      <header>
        <span className="dash-cat">{CATEGORY_LABEL[f.category]}</span>
        {f.interaction_context?.source === 'stuck' && <span className="dash-sub">from I'm stuck</span>}
        <span className="dash-ver">{f.prototype_version}</span>
        <span className="dash-sub">{fmtDate(f.created_at)}</span>
      </header>
      <p className="dash-card-comment">{f.participant_comment ?? <i className="dash-sub">No comment</i>}</p>
      <dl className="dash-card-facts">
        <dt>Participant</dt>
        <dd>
          <a href={`#/sessions/${f.session_id}`}>{who(s)}</a>
        </dd>
        <dt>Task</dt>
        <dd>{t ? `${t.sequence}. ${t.title}` : '-'}</dd>
        <dt>Screen</dt>
        <dd>{screenLabel(f.screen)}</dd>
      </dl>
      <p className="dash-path">
        <span className="dash-label">Context</span> {trail === null ? 'Loading…' : (trail[trail.length - 1] === 'Feedback' ? trail : [...trail, 'Feedback']).join(' → ')}
      </p>
      <label className="dash-status-select">
        Review status
        <select
          value={status}
          disabled={saving}
          onChange={async (e) => {
            const next = e.target.value;
            setSaving(true);
            try {
              await setFeedbackStatus(f.id, next);
              setStatus(next);
              onChanged();
            } catch {
              alert('Could not update the status.');
            } finally {
              setSaving(false);
            }
          }}
        >
          {Object.entries(STATUS_LABEL).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}

/**
 * Study health: is the test itself working? Funnel, where people stop (in the app or at the questions),
 * I'm stuck, skips, Back presses, timing and devices, for any study. Plus the raw export.
 */
function Health({ v, study }: { v: View; study?: Study }) {
  const [events, setEvents] = useState<HealthEvent[] | null>(null);
  const [err, setErr] = useState('');
  const [arm, setArm] = useState<'all' | HomeArm>('all');
  useEffect(() => {
    if (!study) return;
    setEvents(null);
    loadStudyEvents(study.id).then(setEvents).catch((e) => setErr(loadError(e, 'events')));
  }, [study?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (err) return <p className="dash-error">{err}</p>;
  if (!events) return <p className="dash-loading">Loading events…</p>;
  const allIds = new Set(v.sessions.map((s) => s.id));
  const studyEvents = events.filter((e) => allIds.has(e.session_id));
  const arms = homeArms(studyEvents);
  const compared = compareHome({ tasks: v.tasks, sessions: v.sessions, attempts: v.attempts, feedback: v.feedback }, studyEvents);
  const split = compared.some((c) => c.arm !== 'unassigned');
  // The Home filter narrows everything below it to the sessions that saw that Home.
  const ids = new Set(v.sessions.filter((s) => arm === 'all' || (arms.get(s.id) ?? 'unassigned') === arm).map((s) => s.id));
  const h = computeHealth({ tasks: v.tasks, sessions: v.sessions.filter((s) => ids.has(s.id)), attempts: v.attempts.filter((a) => ids.has(a.session_id)), feedback: v.feedback.filter((f) => ids.has(f.session_id)) }, studyEvents.filter((e) => ids.has(e.session_id)));
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), study, tasks: v.tasks, sessions: v.sessions, attempts: v.attempts, feedback: v.feedback, events: events.filter((e) => ids.has(e.session_id)) }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${study?.slug ?? 'study'}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <section className="dash-section">
      <p className="dash-note">
        {study?.title}. Left without finishing = still open with no activity for 30 minutes (closing the tab never ended a session).{' '}
        <button className="dash-link" onClick={exportJson}>
          Export this study (JSON)
        </button>
      </p>
      {split && (
        <>
          <div className="dash-filters">
          <label>
            Home
            <select value={arm} onChange={(e) => setArm(e.target.value as typeof arm)}>
              <option value="all">Both</option>
              {compared.map((c) => (
                <option key={c.arm} value={c.arm}>
                  {HOME_ARM_LABEL[c.arm]}
                </option>
              ))}
            </select>
          </label>
          </div>
          <h2>Home comparison</h2>
          <p className="dash-note">Each new session is assigned one Home at random (50/50). Events are off in both. Small numbers: read as direction, not proof.</p>
          <div className="dash-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Home</th>
                  <th>Sessions</th>
                  <th>Completed</th>
                  <th>Median finished</th>
                  <th>Reached the end of Home</th>
                  <th>Opened something from Home</th>
                  <th>Searched from Home</th>
                  {v.tasks
                    .slice()
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((t) => (
                      <th key={t.id}>
                        {t.sequence}. finished · time · ease
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {compared.map((c) => (
                  <tr key={c.arm}>
                    <td>{HOME_ARM_LABEL[c.arm]}</td>
                    <td>{c.sessions}</td>
                    <td>
                      {c.completed} ({pct(c.completed, c.sessions)})
                    </td>
                    <td>{c.medianScenariosDone ?? '-'}</td>
                    <td>{c.arm === 'next' ? `${c.reachedEnd} (${pct(c.reachedEnd, c.sessions)})` : '-'}</td>
                    <td>{c.openedFromHome}</td>
                    <td>{c.searchedFromHome}</td>
                    {c.tasks.map((t) => (
                      <td key={t.taskId}>
                        {t.finished}/{t.reached} · {fmtDuration(t.medianMs)} · {t.medianEase ?? '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="dash-stats">
        <Stat label="Sessions" value={h.total} />
        <Stat label="Completed" value={`${h.completed} (${pct(h.completed, h.total)})`} />
        <Stat label="Ended early" value={h.endedEarly} hint="Chose to stop" />
        <Stat label="Left without finishing" value={h.left} hint="No activity for 30 minutes" />
        <Stat label="In progress" value={h.inProgress} />
        <Stat label="Median session" value={fmtDuration(h.medianSessionMs)} hint="Completed sessions" />
        <Stat label="Median finished per session" value={h.medianScenariosDone ?? '-'} hint={`of ${v.tasks.length}`} />
        <Stat label="Came back after an interruption" value={h.resumedSessions} hint="Reload, new tab or restored page" />
        {h.firstRun && <Stat label="Stopped during getting started" value={`${h.firstRun.stopped} of ${h.firstRun.reached}`} />}
      </div>
      <h2>By scenario</h2>
      <div className="dash-scroll">
        <table className="dash-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Scenario</th>
              <th>Reached</th>
              <th>Finished</th>
              <th>Skipped</th>
              <th>Stopped in the app</th>
              <th>Stopped at the questions</th>
              <th>I'm stuck (people)</th>
              <th>Back presses (median / total)</th>
              <th>Median time</th>
              <th>Finished by app / by participant</th>
              <th>Median ease (1 to 5)</th>
            </tr>
          </thead>
          <tbody>
            {h.tasks.map((t) => (
              <tr key={t.task.id}>
                <td>{t.task.sequence}</td>
                <td>
                  <a href={`#/tasks/${t.task.id}`}>{t.task.title}</a>
                </td>
                <td>{t.reached}</td>
                <td>{t.finished}</td>
                <td>{t.skipped}</td>
                <td>{t.stoppedInApp}</td>
                <td>{t.stoppedAtQuestions}</td>
                <td>{t.stuckSessions}</td>
                <td>
                  {t.backMedian ?? '-'} / {t.backTotal}
                </td>
                <td>{fmtDuration(t.medianMs)}</td>
                <td>
                  {t.finishedByApp} / {t.finishedByParticipant}
                  {t.finishedWithoutAppEvent > 0 && <span className="dash-sub"> ({t.finishedWithoutAppEvent} without the app event)</span>}
                </td>
                <td>{t.medianEase ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Where unfinished sessions stopped</h2>
      {h.stopPoints.length ? (
        <ul className="dash-list">
          {h.stopPoints.map((x) => (
            <li key={x.label}>
              {x.label}: <b>{x.n}</b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dash-empty">No unfinished sessions.</p>
      )}
      <h2>Why people were stuck</h2>
      {h.stuckReasons.length ? (
        <ul className="dash-list">
          {h.stuckReasons.map((x) => (
            <li key={x.reason}>
              {STUCK_LABEL[x.reason] ?? CATEGORY_LABEL[x.reason] ?? x.reason}: <b>{x.n}</b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dash-empty">Nobody has used I'm stuck yet.</p>
      )}
      <h2>Phone and desktop</h2>
      <table className="dash-table">
        <thead>
          <tr>
            <th>Device</th>
            <th>Sessions</th>
            <th>Completed</th>
            <th>Median finished per session</th>
          </tr>
        </thead>
        <tbody>
          {h.devices.map((x) => (
            <tr key={x.device}>
              <td>{x.device}</td>
              <td>{x.n}</td>
              <td>
                {x.completed} ({pct(x.completed, x.n)})
              </td>
              <td>{x.medianScenariosDone ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
