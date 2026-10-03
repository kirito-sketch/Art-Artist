/**
 * Participant Test Mode (/test): a short, natural session using the real Art and Artist app.
 * docs/TEST_REDESIGN.md (design and decisions), docs/RESEARCH_TEST_MODE.md (reference).
 *
 * One rule above all: the test guides the testing, never the product. Scenarios give context and a
 * goal, never directions. Nothing belonging to the test is drawn inside the simulated phone.
 *
 *  - One welcome page (what this is, about 8 to 10 minutes, a light consent line), then the app.
 *  - The phone stays mounted for the whole session: scenario after scenario, the app carries on where
 *    the participant left it. Only the small guide beside it (wide screens) or the bar and sheet below
 *    it (phones) changes: scenario, one short question, next scenario.
 *  - Objective scenarios finish themselves (entered the app; interest sent), after the product action
 *    has settled. The others are finished by the participant ("I found someone", "Done").
 *  - I'm stuck, Give feedback and Stop are always there and never imply a mistake.
 *  - Session and position survive a reload, a new tab with the same link, or the browser restoring the
 *    page (localStorage, /test only): the app comes back to the same screen as the same person.
 *
 * Sessions started on the older seven-task study keep their own tasks and numbering; they are shown
 * with the same light shell (generic rules for task keys this file doesn't know).
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { assignHomeArm, setFeatures, type HomeVariant } from '../ui/features';
import { ChevronUp, LifeBuoy } from 'lucide-react';
import { useStore, type Route } from '../state/store';
import * as seed from '../data/seed';
import { Button } from '../ui/primitives';
import { research, type SessionInfo, type StudyTask } from './client';
import type { AttemptOutcome } from './taxonomy';

/**
 * Outcome rule: a finished scenario (detected, or finished by the participant) is "completed" unless they
 * found it difficult (ease 1 or 2, stored as difficulty 4 or 5) or used I'm stuck during it, in which
 * case it is "completed_with_difficulty". Skip is "skipped"; stopping during a scenario leaves it "abandoned".
 */
export function outcomeFor(difficulty: number | null, usedStuck: boolean): AttemptOutcome {
  return (difficulty !== null && difficulty >= 4) || usedStuck ? 'completed_with_difficulty' : 'completed';
}

// ------------------------------------------------------------------------------------------ scenarios
type Ask = 'ease' | 'why' | 'change';
type Scenario = { finish: 'auto' | string; ask: Ask; easeQuestion?: string; entry?: boolean };

/** How each scenario finishes and what is asked after it. Copy itself comes from the study (server). */
const SCENARIOS: Record<string, Scenario> = {
  'first-look': { finish: 'auto', ask: 'ease', easeQuestion: 'How easy or difficult was it to get started?', entry: true },
  'find-cinematographer': { finish: 'I found someone', ask: 'ease' },
  'not-ready-yet': { finish: 'Done', ask: 'why' },
  'find-opportunity': { finish: 'auto', ask: 'ease' },
  'your-profile': { finish: 'Done', ask: 'change' },
  // Older study: Task 1 was the first-run flow too.
  'getting-started': { finish: 'auto', ask: 'ease', easeQuestion: 'How easy or difficult was it to get started?', entry: true },
};
const scenarioFor = (t: StudyTask): Scenario => SCENARIOS[t.key] ?? { finish: t.successEvents.length ? 'auto' : 'Done', ask: 'ease' };

/** Scenario 3 when there is no "this person" yet (scenario 2 skipped before anyone was opened). */
const NOT_READY_FALLBACK = 'Imagine you’ve come across someone whose work interests you, but you’re not ready to contact them yet. What would you naturally do?';

const STUCK_REASONS = [
  { id: 'couldnt_find', label: 'I couldn’t find what I was looking for' },
  { id: 'unsure_what_to_do', label: 'I wasn’t sure what I was supposed to do' },
  { id: 'didnt_work', label: 'Something didn’t work' },
  { id: 'lost_track', label: 'I lost track of where I was' },
  { id: 'other', label: 'Other' },
] as const;
const STUCK_CATEGORY = { couldnt_find: 'couldnt_find', unsure_what_to_do: 'confusing', didnt_work: 'didnt_work', lost_track: 'confusing', other: 'other' } as const;

const CRAFTS = ['Cinematography', 'Camera crew', 'Direction', 'Acting', 'Editing', 'Sound', 'Production', 'Writing', 'Art / production design', 'Costume', 'Music', 'Other'];
const EXPERIENCE = ['Student or just starting', 'Less than 3 years', '3 to 10 years', 'More than 10 years'];

// ------------------------------------------------------------------------------------- persistence
type Stage = 'loading' | 'unavailable' | 'welcome' | 'starting' | 'scenario' | 'question' | 'survey' | 'thanks' | 'ended';
type SavedPerson = { id: string; name: string; role: string; craft: string; crafts: string[]; city: string; photo?: string; availability: unknown; intent?: string };
type Product = { tab: string; stack: Route[]; person?: SavedPerson };
type Persisted = { v: 2; at: number; stage: Stage; index: number; stuck: string[]; startedAt?: number; briefed?: number; product?: Product; lastPerson?: string; home?: HomeVariant };

const KEY = 'aa-test-state';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const PARTICIPANT_TYPE = params.get('type') === 'house' ? 'production_house' : 'individual_creative';
const PARTICIPANT_CODE = params.get('p') ?? undefined; // optional researcher-assigned code, e.g. /test?p=P014
const ARM = params.get('arm'); // pilot only: /test?arm=next or ?arm=current pins the Home

/** Reads this test's saved position; also maps a session started by the older build (sessionStorage). */
function loadState(): Persisted | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Persisted | null;
    if (s?.v === 2) return Date.now() - s.at > MAX_AGE_MS ? null : s;
  } catch {
    /* fall through */
  }
  try {
    const old = JSON.parse(sessionStorage.getItem('ana-test-state') ?? 'null') as { stage: string; index: number; stuck?: string[] } | null;
    if (!old) return null;
    const stage: Stage = old.stage === 'task-done' ? 'question' : old.stage === 'task' || old.stage === 'task-intro' ? 'scenario' : old.stage === 'survey' || old.stage === 'thanks' || old.stage === 'ended' ? old.stage : 'welcome';
    return { v: 2, at: Date.now(), stage, index: old.index ?? 0, stuck: old.stuck ?? [] };
  } catch {
    return null;
  }
}
function saveState(p: Omit<Persisted, 'v' | 'at'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...p, v: 2, at: Date.now() }));
  } catch {
    /* storage blocked: the test still runs, it just cannot resume after a reload */
  }
}

// ------------------------------------------------------------------------------------------ layout
/** Below this width there is no room for phone + guide: the guide moves below the device. */
const COMPACT_QUERY = '(max-width: 799px)';
function useCompact() {
  const [c, setC] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(COMPACT_QUERY).matches);
  useEffect(() => {
    const m = matchMedia(COMPACT_QUERY);
    const on = () => setC(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return c;
}

/**
 * Fit phone + guide in the viewport without page scrolling. The phone keeps its natural size and design;
 * only its outer wrapper is scaled. Phone-width screens (<= 520 px) keep the full-screen device.
 * Mirrors the CSS: 24 px breathing room, guide clamp(280px, 24vw, 340px), gap clamp(24px, 4vw, 56px), bar 64 px.
 */
function useDeviceScale(device: React.RefObject<HTMLDivElement>, compact: boolean, active: boolean) {
  const [fit, setFit] = useState<{ scale: number; w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    if (!active) return;
    const measure = () => {
      const phone = device.current?.querySelector<HTMLElement>('.phone');
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (!phone || vw <= 520) return setFit(null);
      const w = phone.offsetWidth;
      const h = phone.offsetHeight;
      const clamp = (min: number, v: number, max: number) => Math.min(max, Math.max(min, v));
      const availH = vh - 48 - (compact ? 64 : 0);
      const availW = compact ? vw - 32 : vw - 48 - clamp(280, vw * 0.24, 340) - clamp(24, vw * 0.04, 56);
      setFit({ scale: Math.min(1, availH / h, availW / w), w, h });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [compact, active]); // eslint-disable-line react-hooks/exhaustive-deps
  return fit;
}

type View = null | 'stuck' | 'feedback' | 'stop';

// -------------------------------------------------------------------------------------------- shell
export function TestMode({ phone }: { phone: ReactNode }) {
  const store = useStore();
  const restored = useRef(loadState());
  const [stage, setStage] = useState<Stage>('loading');
  const [index, setIndex] = useState(restored.current?.index ?? 0);
  const [stuck, setStuck] = useState<string[]>(restored.current?.stuck ?? []);
  const [startedAt, setStartedAt] = useState<number>(restored.current?.startedAt ?? Date.now());
  /** The scenario whose brief the participant has dismissed on a phone (the sheet starts open). */
  const [briefed, setBriefed] = useState<number>(restored.current?.briefed ?? -1);
  const lastPerson = useRef<string | undefined>(restored.current?.lastPerson);
  /** The Home this session compares (docs/HOME.md). Assigned once at start, kept across reloads. */
  const home = useRef<HomeVariant>(restored.current?.home ?? 'current');
  const [study, setStudy] = useState<{ slug: string } | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [view, setView] = useState<View>(null);
  const [expanded, setExpanded] = useState(false); // phones: the guide sheet opened from the bar
  const [noted, setNoted] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [startError, setStartError] = useState(false);
  const compact = useCompact();
  const device = useRef<HTMLDivElement>(null);
  const barTask = useRef<HTMLButtonElement>(null);
  const withPhone = stage === 'scenario' || stage === 'question';
  const fit = useDeviceScale(device, compact, withPhone);
  const tasks: StudyTask[] = session?.tasks ?? [];
  const task = tasks[index];
  const sc = task ? scenarioFor(task) : null;
  const total = tasks.length;

  // The person the app is signed in as, if onboarding created them (so a reload can bring them back).
  const personSnapshot = (): SavedPerson | undefined => {
    if (!store.isNewPerson) return undefined;
    const p = seed.people.find((x) => x.id === store.viewer.id);
    if (!p) return undefined;
    return { id: p.id, name: p.name, role: p.role, craft: p.craft, crafts: p.crafts ?? [], city: p.city, photo: p.photo && p.photo.length < 150_000 ? p.photo : undefined, availability: store.availability, intent: store.intent };
  };

  // Save the position (and, during scenarios, where the app is) so a reload resumes in place.
  useEffect(() => {
    if (stage === 'loading' || stage === 'starting' || stage === 'unavailable') return;
    let stack: Route[] = [];
    try {
      stack = JSON.parse(JSON.stringify(store.stack)) as Route[];
    } catch {
      stack = [];
    }
    const product = withPhone && !store.entry ? { tab: store.tab, stack: stack.filter((r) => r.name !== 'media'), person: personSnapshot() } : restored.current?.product;
    saveState({ stage, index, stuck, startedAt, briefed, product, lastPerson: lastPerson.current, home: home.current });
  }); // every render: cheap, and always current

  // Boot: carry on with this browser's open session, or load the active study.
  useEffect(() => {
    const prev = restored.current;
    if (prev && (prev.stage === 'thanks' || prev.stage === 'ended') && research.session()) return setStage(prev.stage);
    const held = research.session();
    if (held && prev && prev.stage !== 'welcome') {
      const info = research.resume();
      if (info) {
        setFeatures({ home: home.current, events: false }, false);
        setSession(info);
        restoreProduct(prev);
        setStage(prev.stage === 'starting' ? 'scenario' : prev.stage);
        research.track('session_resumed', { metadata: { stage: prev.stage, index: prev.index } });
        return;
      }
    }
    research.activeStudy(PARTICIPANT_TYPE).then((s) => {
      if (!s) return setStage('unavailable');
      setStudy(s);
      setStage('welcome');
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** After a reload: sign back in as the person onboarding created, and return to the same screen. */
  function restoreProduct(prev: Persisted) {
    const pr = prev.product;
    if (!pr) return;
    let id: string | undefined;
    if (pr.person) {
      const p = pr.person;
      id = store.createPerson({ name: p.name, photo: p.photo, craft: p.craft as never, crafts: p.crafts as never, specialisation: '', role: p.role, city: p.city, travel: false, languages: [], availability: p.availability as never, work: [], email: '', intent: p.intent as never });
      store.setActing('self');
      store.switchViewer(id);
    }
    const swap = (r: Route): Route => (pr.person && id && 'id' in r && r.id === pr.person.id ? ({ ...r, id } as Route) : r);
    store.setTab(pr.tab as never);
    for (const r of pr.stack) store.push(swap(r));
  }

  // Start (or carry on with) the attempt whenever a scenario becomes active.
  useEffect(() => {
    if (stage !== 'scenario' || !task) return;
    const variant = task.key === 'not-ready-yet' ? (onPersonProfile() ? 'on_profile' : lastPerson.current ? 'seen_someone' : 'nobody_yet') : undefined;
    research.startTask(task.key, variant ? { variant } : undefined);
  }, [stage, task?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scenario 1: the app opens the way it does for a new person, at the splash, with nothing carried over.
  useLayoutEffect(() => {
    if (stage === 'scenario' && sc?.entry && !store.entry) store.startEntry('new');
  }, [stage, task?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Objective scenarios: listen for the event that means it happened. Also remember who was looked at.
  useEffect(() => {
    if (stage !== 'scenario' || !task) return;
    setSucceeded(false);
    return research.subscribe((e) => {
      if (e.name === 'person_profile_opened' && e.objectId) lastPerson.current = e.objectId;
      if (sc?.finish !== 'auto' || !task.successEvents.includes(e.name)) return;
      if (task.successObjectType && task.successObjectType !== e.objectType) return;
      setSucceeded(true);
    });
  }, [stage, task?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Never interrupt mid-action: wait until the app's own sheet has closed and the screen has settled.
  useEffect(() => {
    if (!succeeded || stage !== 'scenario' || store.sheet || view) return;
    const t = setTimeout(() => toQuestion(), 1100);
    return () => clearTimeout(t);
  }, [succeeded, stage, store.sheet, store.stack.length, view]); // eslint-disable-line react-hooks/exhaustive-deps

  // The app is usable during a scenario. While answering (and behind an open sheet on phones) it rests.
  const sheetOpen = compact && withPhone && (stage === 'question' || !!view || expanded || briefed !== index);
  useEffect(() => {
    const el = device.current;
    if (!el) return;
    if (stage === 'scenario' && !sheetOpen) el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  });

  // Phones: focus follows the guide. The bar takes focus when the sheet closes; an opened sheet takes it
  // on its heading; Escape (from anywhere) closes a sheet that only shows the scenario.
  const showBarNow = compact && stage === 'scenario' && !sheetOpen;
  const barWasShown = useRef(showBarNow);
  useEffect(() => {
    if (showBarNow && !barWasShown.current) requestAnimationFrame(() => barTask.current?.focus());
    if (!showBarNow && barWasShown.current && stage === 'scenario' && !view) requestAnimationFrame(() => document.getElementById('rp-scenario')?.focus());
    barWasShown.current = showBarNow;
  });
  const collapsible = compact && stage === 'scenario' && briefed === index && !view && expanded;
  useEffect(() => {
    if (!collapsible) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && (setView(null), setExpanded(false));
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [collapsible]);

  function onPersonProfile() {
    const top = store.stack[store.stack.length - 1];
    return top?.name === 'profile' && top.id !== store.viewer.id ? top.id : null;
  }

  const begin = async () => {
    setStage('starting');
    home.current = assignHomeArm(study!.slug, ARM);
    setFeatures({ home: home.current, events: false }, false);
    const s = await research.startSession({ studySlug: study!.slug, consent: true, participantCode: PARTICIPANT_CODE, participant: { participantType: PARTICIPANT_TYPE }, persona: 'kiran', metadata: { homeVariant: home.current } });
    if (!s) return setStartError(true), setStage('welcome');
    setStartError(false);
    setSession(s);
    setIndex(0);
    setStartedAt(Date.now());
    setStage('scenario');
  };

  const toQuestion = () => {
    if (task) research.track('task_questions_shown', { objectType: 'task', objectId: task.key, metadata: { finishedBy: sc?.finish === 'auto' ? 'app' : 'participant' } });
    setView(null);
    setExpanded(false);
    setStage('question');
  };

  const next = () => {
    setSucceeded(false);
    setView(null);
    setExpanded(false);
    setNoted(false);
    // Leaving scenario 1 without entering the app (skip): close the first-run flow so the next starts in the app.
    if (sc?.entry && store.entry) store.endEntry();
    if (index + 1 < total) {
      setIndex(index + 1);
      setStartedAt(Date.now());
      setStage('scenario');
    } else setStage('survey');
  };

  const answer = (a: { ease: number | null; text: string }) => {
    const difficulty = a.ease === null ? null : 6 - a.ease; // stored as difficulty: 1 very easy ... 5 very difficult
    const label = sc?.ask === 'why' ? 'Why' : sc?.ask === 'change' ? 'Add or change' : 'Confusing';
    research.completeTask(task.key, {
      outcome: outcomeFor(difficulty, stuck.includes(task.key)),
      difficulty: difficulty ?? undefined,
      feedbackText: a.text.trim() ? `${label}: ${a.text.trim()}` : undefined,
      metadata: { finishedBy: sc?.finish === 'auto' ? 'app' : 'participant', personOnScreen: task.key === 'find-cinematographer' ? onPersonProfile() : undefined },
    });
    next();
  };

  const skip = (reason?: string) => {
    research.completeTask(task.key, { outcome: 'skipped', feedbackText: reason ? `Skipped: ${reason}` : undefined, metadata: { elapsedMs: Date.now() - startedAt } });
    next();
  };

  const stop = () => {
    research.completeSession('abandoned');
    setView(null);
    setStage('ended');
  };

  const finishSurvey = (a: { answers: Record<string, string>; craft: string; experience: string }) => {
    for (const [question, comment] of Object.entries(a.answers)) if (comment.trim()) research.submitFeedback({ category: 'other', source: 'survey', question, comment });
    research.track('survey_submitted', { metadata: { answered: Object.values(a.answers).filter((x) => x.trim()).length } });
    research.updateParticipant({ primaryCraft: a.craft || undefined, experienceLevel: a.experience || undefined });
    research.completeSession('completed');
    setStage('thanks');
  };

  // ------------------------------------------------------------------------------------------ render
  const page = (body: ReactNode) => (
    <div className="test-stage test-stage--solo">
      <main className="rp rp--solo">{body}</main>
    </div>
  );
  if (stage === 'loading' || stage === 'starting')
    return page(
      <p className="rp-quiet" role="status">
        {stage === 'starting' ? 'Opening Art and Artist…' : 'Loading…'}
      </p>,
    );
  if (stage === 'unavailable')
    return page(
      <Page title="This session isn’t open right now">
        <p>Thanks for your interest. Please check the link you were given, or try again later.</p>
      </Page>,
    );
  if (stage === 'welcome') return page(<Welcome onStart={begin} error={startError} />);
  if (stage === 'survey') return page(<Survey onSubmit={finishSurvey} />);
  if (stage === 'thanks')
    return page(
      <Page title="Thank you">
        <p>That’s everything. What you shared will help shape Art and Artist.</p>
        <p className="rp-quiet">You can close this page now.</p>
      </Page>,
    );
  if (stage === 'ended')
    return page(
      <Page title="Thanks for your time">
        <p>What you did and said so far has been saved, and it helps.</p>
        <p className="rp-quiet">You can close this page now.</p>
      </Page>,
    );
  if (!task || !sc) return page(<p className="rp-quiet">Loading…</p>);

  const instruction = task.key === 'not-ready-yet' && !lastPerson.current && !onPersonProfile() ? NOT_READY_FALLBACK : task.instruction;
  const progress = `${index + 1} of ${total}`;
  const openView = (v: View) => {
    setNoted(false);
    setView(v);
    setExpanded(true);
  };
  const closeView = () => {
    setView(null);
    setExpanded(false);
  };
  const reportStuck = () => {
    research.track('stuck_reported', { objectType: 'task', objectId: task.key, metadata: { elapsedMs: Date.now() - startedAt } });
    setStuck((st) => (st.includes(task.key) ? st : [...st, task.key]));
    openView('stuck');
  };

  let body: ReactNode;
  if (stage === 'question')
    body = (
      <Question
        key={task.key}
        progress={progress}
        ask={sc.ask}
        easeQuestion={sc.easeQuestion}
        halfway={total >= 4 && index + 1 === Math.ceil(total / 2) + (total % 2 ? 0 : 1)}
        last={index + 1 === total}
        onSubmit={answer}
      />
    );
  else if (view === 'stuck')
    body = (
      <Stuck
        progress={progress}
        onKeepTrying={(reason, comment) => {
          research.submitFeedback({ category: STUCK_CATEGORY[reason], comment, source: 'stuck', question: reason, reason, elapsedMs: Date.now() - startedAt });
          closeView();
        }}
        onSkip={(reason, comment) => {
          research.submitFeedback({ category: STUCK_CATEGORY[reason], comment, source: 'stuck', question: reason, reason, elapsedMs: Date.now() - startedAt });
          skip(STUCK_REASONS.find((r) => r.id === reason)?.label);
        }}
      />
    );
  else if (view === 'feedback')
    body = (
      <FeedbackForm
        onSend={(comment) => {
          research.submitFeedback({ category: 'other', comment, source: 'button' });
          setNoted(true);
          setView(null);
          setExpanded(false);
        }}
        onCancel={closeView}
      />
    );
  else if (view === 'stop')
    body = (
      <section className="rp-step" aria-labelledby="rp-stop">
        <h2 id="rp-stop" className="rp-title" tabIndex={-1}>
          Stop here?
        </h2>
        <p>What you’ve done so far is kept. Thank you for the time you’ve given.</p>
        <div className="rp-actions">
          <Button block variant="secondary" onClick={closeView}>
            Keep going
          </Button>
          <button className="rp-link" onClick={stop}>
            Stop the test
          </button>
        </div>
      </section>
    );
  else
    body = (
      <section className="rp-step" aria-labelledby="rp-scenario">
        <p className="rp-progress">{progress}</p>
        <h2 id="rp-scenario" className="rp-title" tabIndex={-1}>
          {task.title}
        </h2>
        <p className="rp-scenario">{instruction}</p>
        {noted && (
          <p className="rp-noted" role="status">
            Thanks, that’s been sent.
          </p>
        )}
        <div className="rp-actions">
          {compact && briefed !== index ? (
            <Button
              block
              onClick={() => {
                setBriefed(index);
                setExpanded(false);
              }}
            >
              Start
            </Button>
          ) : (
            sc.finish !== 'auto' && (
              <Button block onClick={toQuestion}>
                {sc.finish}
              </Button>
            )
          )}
          {!(compact && briefed !== index) && (
            <Button block variant="secondary" onClick={reportStuck}>
              I’m stuck
            </Button>
          )}
        </div>
        <div className="rp-quiet-actions">
          <button className="rp-link" onClick={() => (research.track('feedback_opened'), openView('feedback'))}>
            Give feedback
          </button>
          <button className="rp-link" onClick={() => openView('stop')}>
            Stop the test
          </button>
        </div>
      </section>
    );

  // Phones: during a scenario with nothing open, only the bar below the device.
  const showBar = compact && stage === 'scenario' && !sheetOpen;
  return (
    <div className={`test-stage ${compact ? 'test-stage--compact' : ''}`}>
      <div className="test-device" ref={device} role="region" aria-label="Art and Artist app" style={fit ? { width: fit.w * fit.scale, height: fit.h * fit.scale } : undefined}>
        <div className="test-device-scale" style={fit ? { transform: `scale(${fit.scale})` } : undefined}>
          {phone}
        </div>
      </div>
      {!compact && (
        <aside className="rp rp--side" aria-label="Test guide">
          {body}
        </aside>
      )}
      {compact && (
        <div className="rp-bar" role="region" aria-label="Test guide" hidden={!showBar}>
          <button ref={barTask} className="rp-bar-task" onClick={() => setExpanded(true)} aria-label={`${progress}: ${task.title}. Show the scenario`}>
            <span className="rp-bar-text">
              <b>{progress}</b> {task.title}
            </span>
            <ChevronUp size={16} aria-hidden />
          </button>
          {sc.finish !== 'auto' && (
            <button className="rp-bar-done" onClick={toQuestion}>
              {sc.finish}
            </button>
          )}
          <button className="rp-bar-btn" onClick={reportStuck} aria-label="I’m stuck">
            <LifeBuoy size={18} aria-hidden />
          </button>
        </div>
      )}
      {compact && sheetOpen && (
        <div className="rp-sheet-layer">
          <div className="rp-sheet-scrim" aria-hidden onClick={stage === 'scenario' && briefed === index && !view ? closeView : undefined} />
          <aside className="rp rp--sheet" role="dialog" aria-modal="false" aria-label="Test guide">
            {body}
            {stage === 'scenario' && briefed === index && !view && (
              <button className="rp-link" onClick={closeView}>
                Back to the app
              </button>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------ screens
/** A page on its own (welcome, survey, thank you): calm, one clear action. */
function Page({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const f = requestAnimationFrame(() => h.current?.focus());
    return () => cancelAnimationFrame(f);
  }, [title]);
  return (
    <section className="rp-page" aria-labelledby="rp-page-title">
      <p className="rp-brand">Art and Artist</p>
      <h1 id="rp-page-title" className="rp-page-title" ref={h} tabIndex={-1}>
        {title}
      </h1>
      <div className="rp-page-body">{children}</div>
      {footer && <div className="rp-actions">{footer}</div>}
    </section>
  );
}

/** What this is, why, how long, and a light, readable consent line. Product context only, no directions. */
function Welcome({ onStart, error }: { onStart: () => void; error: boolean }) {
  return (
    <Page
      title="Help us improve Art and Artist"
      footer={
        <>
          <Button block onClick={onStart}>
            Start
          </Button>
          <p className="rp-consent">
            By starting, you agree that we record how you use the app (the screens you open and what you tap) and anything you write to us. You can stop at any time.
          </p>
          <details className="rp-details">
            <summary>What we record</summary>
            <ul>
              <li>Screens you open and actions you take in the app, to improve it.</li>
              <li>Your answers and anything you write in feedback.</li>
              <li>Never passwords, private messages, or anything you type inside the app.</li>
              <li>No email or contact details. What you’ve done is kept if you stop early.</li>
            </ul>
          </details>
        </>
      }
    >
      <p>Art and Artist is a professional network for people working in film and creative industries.</p>
      <p>It helps people showcase their work, discover other professionals and projects, and find opportunities to work together.</p>
      <p>You’ll be given a few situations. There are no right or wrong answers. We’re testing the product, not you.</p>
      <p>Use the app the way that feels natural. If something is confusing or you can’t find what you need, that is useful feedback too.</p>
      <p className="rp-time">About 8 to 10 minutes</p>
      {error && (
        <p className="inline-error" role="alert">
          We couldn’t start just now. Please check your connection and try again.
        </p>
      )}
    </Page>
  );
}

function Scale({ value, onChange, label }: { value: number | null; onChange: (n: number) => void; label: string }) {
  return (
    <div className="rp-scale" role="radiogroup" aria-label={label}>
      <div className="rp-scale-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={value === n} aria-label={`${n}${n === 1 ? ', very difficult' : n === 5 ? ', very easy' : ''}`} className={`rp-scale-btn ${value === n ? 'is-on' : ''}`} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
      </div>
      <div className="rp-scale-ends" aria-hidden>
        <span>Very difficult</span>
        <span>Very easy</span>
      </div>
    </div>
  );
}

/** The one short question after a scenario. Ease scenarios: a rating, and an optional note. */
function Question({ progress, ask, easeQuestion, halfway, last, onSubmit }: { progress: string; ask: Ask; easeQuestion?: string; halfway: boolean; last: boolean; onSubmit: (a: { ease: number | null; text: string }) => void }) {
  const [ease, setEase] = useState<number | null>(null);
  const [text, setText] = useState('');
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const f = requestAnimationFrame(() => h.current?.focus());
    return () => cancelAnimationFrame(f);
  }, []);
  const q = ask === 'why' ? 'Why did you choose that?' : ask === 'change' ? 'What would you add or change?' : (easeQuestion ?? 'How easy or difficult was that?');
  return (
    <section className="rp-step" aria-labelledby="rp-question">
      <p className="rp-progress">
        {progress}
        {halfway && <span className="rp-halfway"> · You’re over halfway there.</span>}
      </p>
      <h2 id="rp-question" className="rp-title rp-title--q" ref={h} tabIndex={-1}>
        {q}
      </h2>
      {ask === 'ease' ? (
        <>
          <Scale value={ease} onChange={setEase} label={`${q} 1 very difficult, 5 very easy`} />
          <label className="rp-field">
            <span>Anything confusing? (optional)</span>
            <textarea className="field" rows={2} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
          </label>
        </>
      ) : (
        <label className="rp-field">
          <span className="sr-only">{q}</span>
          <textarea className="field" rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="A sentence or two is plenty (optional)" />
        </label>
      )}
      <Button block disabled={ask === 'ease' && ease === null} onClick={() => onSubmit({ ease, text })}>
        {last ? 'Continue to the last questions' : 'Continue'}
      </Button>
    </section>
  );
}

function Stuck({ progress, onKeepTrying, onSkip }: { progress: string; onKeepTrying: (r: (typeof STUCK_REASONS)[number]['id'], c?: string) => void; onSkip: (r: (typeof STUCK_REASONS)[number]['id'], c?: string) => void }) {
  const [reason, setReason] = useState<(typeof STUCK_REASONS)[number]['id'] | null>(null);
  const [comment, setComment] = useState('');
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const f = requestAnimationFrame(() => h.current?.focus());
    return () => cancelAnimationFrame(f);
  }, []);
  const r = reason ?? 'other';
  return (
    <section className="rp-step" aria-labelledby="rp-stuck">
      <p className="rp-progress">{progress}</p>
      <h2 id="rp-stuck" className="rp-title rp-title--q" ref={h} tabIndex={-1}>
        What stopped you?
      </h2>
      <div className="rp-options" role="radiogroup" aria-labelledby="rp-stuck">
        {STUCK_REASONS.map((o) => (
          <button key={o.id} role="radio" aria-checked={reason === o.id} className={`rp-option ${reason === o.id ? 'is-on' : ''}`} onClick={() => setReason(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
      <label className="rp-field">
        <span>Anything to add? (optional)</span>
        <textarea className="field" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
      </label>
      <div className="rp-actions">
        <Button block onClick={() => onKeepTrying(r, comment.trim() || undefined)}>
          Keep trying
        </Button>
        <Button block variant="secondary" onClick={() => onSkip(r, comment.trim() || undefined)}>
          Skip this scenario
        </Button>
      </div>
    </section>
  );
}

function FeedbackForm({ onSend, onCancel }: { onSend: (comment: string) => void; onCancel: () => void }) {
  const [c, setC] = useState('');
  return (
    <section className="rp-step" aria-labelledby="rp-feedback">
      <h2 id="rp-feedback" className="rp-title rp-title--q">
        What’s on your mind?
      </h2>
      <label className="rp-field">
        <span className="sr-only">Your feedback</span>
        <textarea className="field" rows={4} value={c} onChange={(e) => setC(e.target.value)} maxLength={1500} autoFocus />
      </label>
      <p className="rp-quiet">We’ll know where you were in the app, so there’s no need to explain.</p>
      <div className="rp-actions">
        <Button block disabled={!c.trim()} onClick={() => onSend(c)}>
          Send
        </Button>
        <button className="rp-link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </section>
  );
}

const SURVEY: { id: string; q: string }[] = [
  { id: 'main_use', q: 'What do you think Art and Artist is mainly useful for?' },
  { id: 'expected_missing', q: 'Was there anything you expected to find but couldn’t?' },
  { id: 'confusing_unnecessary', q: 'What felt confusing or unnecessary?' },
  { id: 'come_back', q: 'If this were a real app, what would make you come back?' },
];

function Survey({ onSubmit }: { onSubmit: (a: { answers: Record<string, string>; craft: string; experience: string }) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [craft, setCraft] = useState('');
  const [experience, setExperience] = useState('');
  return (
    <Page title="Last few questions" footer={<Button block onClick={() => onSubmit({ answers, craft, experience })}>Finish</Button>}>
      <p className="rp-quiet">Short answers are perfect. Skip any you like.</p>
      {SURVEY.map((s) => (
        <label key={s.id} className="rp-field rp-field--q">
          <span>{s.q}</span>
          <textarea className="field" rows={2} value={answers[s.id] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [s.id]: e.target.value }))} maxLength={1000} />
        </label>
      ))}
      <fieldset className="rp-about">
        <legend>About you (optional)</legend>
        <label className="rp-field">
          <span>Your craft</span>
          <select className="field" value={craft} onChange={(e) => setCraft(e.target.value)}>
            <option value="">Prefer not to say</option>
            {CRAFTS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="rp-field">
          <span>Experience</span>
          <select className="field" value={experience} onChange={(e) => setExperience(e.target.value)}>
            <option value="">Prefer not to say</option>
            {EXPERIENCE.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </fieldset>
    </Page>
  );
}
