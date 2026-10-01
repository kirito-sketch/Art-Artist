/**
 * Participant Test Mode (/test): an unmoderated, task-based usability test of the real Ana prototype.
 *
 * Layout rule: nothing belonging to the study is ever drawn inside the simulated phone. The phone renders
 * exactly as it does outside /test. All research UI (task, feedback, I'm stuck, task questions, survey)
 * lives OUTSIDE the device: a side panel beside the phone on wide screens, or a bar and sheet attached
 * to the browser viewport below the phone on small screens.
 *
 * Flow: intro, consent, a few optional details, then one task at a time. While a task is active Ana is
 * fully usable. Success is noticed from the task's semantic success events, after the product action has
 * settled, and the panel then turns into the task questions. A short survey closes the session.
 * Everything is written through the research client, which never blocks Ana.
 * See docs/RESEARCH_TEST_MODE.md.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronUp, LifeBuoy, MessageSquareText } from 'lucide-react';
import { useStore } from '../state/store';
import { Button } from '../ui/primitives';
import { research, type SessionInfo, type StudyTask } from './client';
import type { AttemptOutcome, FeedbackCategory } from './taxonomy';

type Stage = 'loading' | 'unavailable' | 'intro' | 'consent' | 'info' | 'starting' | 'task-intro' | 'task' | 'task-done' | 'survey' | 'thanks' | 'ended';
type Persisted = { stage: Stage; index: number; stuck: string[]; skippedOrDone: string[] };
const KEY = 'ana-test-state';
const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const PARTICIPANT_TYPE = params.get('type') === 'house' ? 'production_house' : 'individual_creative';
const PARTICIPANT_CODE = params.get('p') ?? undefined; // optional researcher-assigned code, e.g. /test?p=P014

const load = (): Persisted | null => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
  } catch {
    return null;
  }
};
const save = (p: Persisted) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage blocked: the test still runs, it just cannot resume after a reload */
  }
};

/**
 * Outcome rule (docs/RESEARCH_TEST_MODE.md): success (detected, or "Done" on a task with no success
 * event) is "completed" unless the participant rated it 4 or 5 ("difficult") or used "I'm stuck" during
 * the attempt, in which case it is "completed_with_difficulty". Skip is "skipped"; ending the test
 * during a task leaves the attempt "abandoned".
 */
export function outcomeFor(difficulty: number | null, usedStuck: boolean): AttemptOutcome {
  return (difficulty !== null && difficulty >= 4) || usedStuck ? 'completed_with_difficulty' : 'completed';
}

const CRAFTS = ['Cinematography', 'Camera crew', 'Direction', 'Acting', 'Editing', 'Sound', 'Production', 'Writing', 'Art / production design', 'Costume', 'Music', 'Other'];
const EXPERIENCE = ['Student or just starting', 'Less than 3 years', '3 to 10 years', 'More than 10 years'];
const FEEDBACK: { id: FeedbackCategory; label: string }[] = [
  { id: 'confusing', label: 'Something was confusing' },
  { id: 'couldnt_find', label: "I couldn't find something" },
  { id: 'visual_issue', label: 'Something looked wrong' },
  { id: 'didnt_work', label: "Something didn't work" },
  { id: 'suggestion', label: 'I have a suggestion' },
  { id: 'other', label: 'Other' },
];

/** Below this width there is no room for phone + side panel: research controls move below the device. */
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

type View = null | 'details' | 'feedback' | 'stuck' | 'skip' | 'end';

export function TestMode({ phone }: { phone: ReactNode }) {
  const store = useStore();
  const restored = useRef(load());
  const [stage, setStage] = useState<Stage>('loading');
  const [index, setIndex] = useState(restored.current?.index ?? 0);
  const [stuck, setStuck] = useState<string[]>(restored.current?.stuck ?? []);
  const [study, setStudy] = useState<{ title: string; slug: string; taskCount: number } | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [view, setView] = useState<View>(null);
  const [noted, setNoted] = useState(false);
  const [expanded, setExpanded] = useState(false); // compact layout: research sheet open
  const compact = useCompact();
  const device = useRef<HTMLDivElement>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [startError, setStartError] = useState(false);
  const tasks: StudyTask[] = session?.tasks ?? [];
  const task = tasks[index];

  // Persist progress so a reload resumes where the participant was.
  useEffect(() => {
    if (stage !== 'loading' && stage !== 'starting') save({ stage, index, stuck, skippedOrDone: [] });
  }, [stage, index, stuck]);

  // Boot: resume this tab's session, or load the active study.
  useEffect(() => {
    const prev = restored.current;
    if (prev && (prev.stage === 'thanks' || prev.stage === 'ended')) return setStage(prev.stage);
    const held = research.session();
    if (held && prev) {
      const info = research.resume();
      setSession(info);
      // A task in progress resumes its open attempt (startTask returns the same attempt id).
      setStage(prev.stage === 'task-done' ? 'task-done' : prev.stage === 'task' ? 'task' : prev.stage);
      return;
    }
    research.activeStudy(PARTICIPANT_TYPE).then((s) => {
      if (!s) return setStage('unavailable');
      setStudy(s);
      setStage('intro');
    });
  }, []);

  // Start (or resume) the attempt whenever a task becomes active.
  useEffect(() => {
    if (stage === 'task' && task) research.startTask(task.key);
  }, [stage, task?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Success detection: listen for the task's success events while it is active.
  useEffect(() => {
    if (stage !== 'task' || !task?.successEvents.length) return;
    setSucceeded(false);
    return research.subscribe((e) => {
      if (!task.successEvents.includes(e.name)) return;
      if (task.successObjectType && task.successObjectType !== e.objectType) return;
      setSucceeded(true);
    });
  }, [stage, task?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Never interrupt mid-action: wait until Ana's own sheet has closed and the screen has settled.
  useEffect(() => {
    if (!succeeded || stage !== 'task' || store.sheet || view) return;
    const t = setTimeout(() => setStage('task-done'), 1100);
    return () => clearTimeout(t);
  }, [succeeded, stage, store.sheet, store.stack.length, view]);

  // Between tasks and while answering, Ana is visible but not operable (so nothing leaks into the next task).
  useEffect(() => {
    const el = device.current;
    if (!el) return;
    if (stage === 'task') el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  });

  const begin = async (info: { displayName?: string; primaryCraft?: string; experienceLevel?: string }) => {
    setStage('starting');
    const s = await research.startSession({ studySlug: study!.slug, consent: true, participantCode: PARTICIPANT_CODE, participant: { ...info, participantType: PARTICIPANT_TYPE }, persona: 'kiran' });
    if (!s) return setStartError(true), setStage('info');
    setStartError(false);
    setSession(s);
    setIndex(0);
    setStage('task-intro');
  };

  const nextTask = () => {
    setSucceeded(false);
    setView(null);
    setExpanded(false);
    if (index + 1 < tasks.length) {
      setIndex(index + 1);
      setStage('task-intro');
    } else setStage('survey');
  };

  const finishTask = (r: { difficulty: number | null; expected: boolean | null; expecting: string; confusing: string }) => {
    const feedbackText = [r.expected === false && r.expecting.trim() ? `Expected: ${r.expecting.trim()}` : '', r.confusing.trim() ? `Confusing: ${r.confusing.trim()}` : ''].filter(Boolean).join('\n') || undefined;
    research.completeTask(task.key, { outcome: outcomeFor(r.difficulty, stuck.includes(task.key)), difficulty: r.difficulty ?? undefined, expectationMatch: r.expected === null ? undefined : r.expected ? 5 : 1, feedbackText });
    nextTask();
  };

  const skipTask = (reason: string) => {
    research.completeTask(task.key, { outcome: 'skipped', feedbackText: reason.trim() || undefined });
    nextTask();
  };

  const endEarly = () => {
    research.completeSession('abandoned');
    setView(null);
    setStage('ended');
  };

  const finishSurvey = (a: { ease: number | null; purpose: string; confusing: string; wouldUse: string }) => {
    if (a.ease !== null) research.submitFeedback({ category: 'other', source: 'survey', question: 'overall_ease', rating: a.ease });
    if (a.purpose.trim()) research.submitFeedback({ category: 'other', source: 'survey', question: 'what_is_ana_for', comment: a.purpose });
    if (a.confusing.trim()) research.submitFeedback({ category: 'other', source: 'survey', question: 'most_confusing', comment: a.confusing });
    if (a.wouldUse.trim()) research.submitFeedback({ category: 'other', source: 'survey', question: 'would_make_you_use', comment: a.wouldUse });
    research.track('survey_submitted', { metadata: { answered: [a.ease !== null, !!a.purpose.trim(), !!a.confusing.trim(), !!a.wouldUse.trim()].filter(Boolean).length } });
    research.completeSession('completed');
    setStage('thanks');
  };

  // ------------------------------------------------------------------------------------------- render
  // Before the first task and after the last, there is no phone: just the research page.
  const solo = (body: ReactNode) => (
    <div className="test-stage test-stage--solo">
      <aside className="rp rp--solo" aria-label="Ana user test">
        {body}
      </aside>
    </div>
  );
  if (stage === 'loading' || stage === 'starting') return solo(<Panel label="Loading"><p className="rp-quiet">{stage === 'starting' ? 'Starting your test…' : 'Loading…'}</p></Panel>);
  if (stage === 'unavailable')
    return solo(
      <Panel label="Test unavailable" title="This test isn't open right now">
        <p>Thanks for your interest. Please check the link you were given, or try again later.</p>
      </Panel>,
    );
  if (stage === 'intro') return solo(<Intro onNext={() => setStage('consent')} />);
  if (stage === 'consent') return solo(<Consent onNext={() => setStage('info')} onBack={() => setStage('intro')} />);
  if (stage === 'info') return solo(<Info onStart={begin} error={startError} />);
  if (stage === 'survey') return solo(<Survey onSubmit={finishSurvey} />);
  if (stage === 'thanks' || stage === 'ended')
    return solo(
      <Panel label="Test complete" title="Thank you">
        <p>{stage === 'thanks' ? 'Your feedback has been recorded.' : 'Your answers so far have been saved. Thanks for your time.'}</p>
        <p className="rp-quiet">You can close this page now.</p>
      </Panel>,
    );
  if (!task) return solo(<Panel label="Loading"><p className="rp-quiet">Loading…</p></Panel>);

  const total = tasks.length;
  const open = (v: View) => {
    setNoted(false);
    setView(v);
    setExpanded(true);
  };
  const back = () => {
    setView(null);
    setExpanded(false);
  };
  const head = (status?: string) => (
    <header className="rp-head">
      <p className="rp-eyebrow">
        Task {index + 1} of {total}
        {status && <span className="rp-status"> · {status}</span>}
      </p>
      <h2 className="rp-title">{task.title}</h2>
    </header>
  );

  let body: ReactNode;
  if (stage === 'task-intro')
    body = (
      <>
        {head()}
        <p className="rp-instruction">{task.instruction}</p>
        <div className="rp-actions">
          <Button block onClick={() => setStage('task')}>
            Start task
          </Button>
          <button className="rp-link" onClick={() => open('end')}>
            End test
          </button>
        </div>
      </>
    );
  else if (stage === 'task-done')
    body = (
      <>
        <header className="rp-head">
          <p className="rp-eyebrow">
            Task {index + 1} of {total}
          </p>
          <h2 className="rp-title">{succeeded ? 'Task completed' : 'Task finished'}</h2>
        </header>
        <TaskDone key={task.key} onSubmit={finishTask} />
      </>
    );
  else if (view === 'details')
    body = (
      <>
        {head('In progress')}
        <p className="rp-instruction">{task.instruction}</p>
        <div className="rp-actions">
          <Button block onClick={back}>
            Back to the task
          </Button>
          <Button block variant="secondary" onClick={() => open('skip')}>
            Skip this task
          </Button>
        </div>
      </>
    );
  else if (view === 'feedback')
    body = (
      <>
        <header className="rp-head">
          <p className="rp-eyebrow">Feedback</p>
          <h2 className="rp-title">What happened?</h2>
        </header>
        <Feedback
          onSubmit={(category, comment) => {
            research.submitFeedback({ category, comment, source: 'button' });
            setNoted(true);
            setView(null);
            setExpanded(false);
          }}
          onCancel={back}
        />
      </>
    );
  else if (view === 'stuck')
    body = (
      <>
        <header className="rp-head">
          <p className="rp-eyebrow">
            Task {index + 1} of {total}
          </p>
          <h2 className="rp-title">I'm stuck</h2>
        </header>
        <Stuck
          onContinue={(c) => {
            if (c.trim()) research.submitFeedback({ category: 'couldnt_find', comment: c, source: 'stuck' });
            back();
          }}
          onSkip={(c) => {
            if (c.trim()) research.submitFeedback({ category: 'couldnt_find', comment: c, source: 'stuck' });
            skipTask(c);
          }}
        />
      </>
    );
  else if (view === 'skip')
    body = (
      <>
        {head()}
        <h3 className="rp-q">Skip this task?</h3>
        <Skip onSkip={skipTask} onCancel={back} />
      </>
    );
  else if (view === 'end')
    body = (
      <>
        <header className="rp-head">
          <p className="rp-eyebrow">Ana user test</p>
          <h2 className="rp-title">End the test?</h2>
        </header>
        <p>Your answers so far will be kept. You can't come back to this test afterwards.</p>
        <div className="rp-actions">
          <Button block onClick={endEarly}>
            End test
          </Button>
          <Button block variant="secondary" onClick={back}>
            Keep going
          </Button>
        </div>
      </>
    );
  else
    body = (
      <>
        {head('In progress')}
        <p className="rp-instruction">{task.instruction}</p>
        {noted && (
          <p className="rp-noted" role="status">
            Thanks, your feedback was sent.
          </p>
        )}
        <div className="rp-actions">
          {!task.successEvents.length && (
            <Button block onClick={() => setStage('task-done')}>
              I've finished this task
            </Button>
          )}
          <Button block variant="secondary" onClick={() => (research.track('task_instruction_opened', { objectType: 'task', objectId: task.key }), open('details'))}>
            Task details
          </Button>
          <Button block variant="secondary" onClick={() => (research.track('feedback_opened'), open('feedback'))}>
            Feedback
          </Button>
          <Button block variant="secondary" onClick={() => (research.track('stuck_reported', { objectType: 'task', objectId: task.key }), setStuck((st) => (st.includes(task.key) ? st : [...st, task.key])), open('stuck'))}>
            I'm stuck
          </Button>
          <button className="rp-link" onClick={() => open('end')}>
            End test
          </button>
        </div>
      </>
    );

  // Small screens: an active task with nothing open shows only the compact bar below the device.
  const showBar = compact && stage === 'task' && !view && !expanded;
  return (
    <div className={`test-stage ${compact ? 'test-stage--compact' : ''} ${showBar ? 'has-bar' : ''}`}>
      <div className="test-device" ref={device} aria-label="Ana prototype">
        {phone}
      </div>
      {!compact && (
        <aside className="rp rp--side" aria-label="Research test">
          <p className="rp-brand">Ana user test</p>
          {body}
        </aside>
      )}
      {showBar && (
        <div className="rp-bar" role="region" aria-label="Research test">
          <button className="rp-bar-task" onClick={() => setExpanded(true)} aria-label={`Task ${index + 1} of ${total}: ${task.title}. Show task`}>
            <span className="rp-bar-text">
              <b>Task {index + 1}/{total}</b> · {task.title}
            </span>
            <ChevronUp size={16} aria-hidden />
          </button>
          {!task.successEvents.length && (
            <button className="rp-bar-done" onClick={() => setStage('task-done')}>
              Done
            </button>
          )}
          <button className="rp-bar-btn" onClick={() => (research.track('feedback_opened'), open('feedback'))} aria-label="Feedback">
            <MessageSquareText size={16} aria-hidden />
          </button>
          <button className="rp-bar-btn" onClick={() => (research.track('stuck_reported', { objectType: 'task', objectId: task.key }), setStuck((st) => (st.includes(task.key) ? st : [...st, task.key])), open('stuck'))} aria-label="I'm stuck">
            <LifeBuoy size={16} aria-hidden />
          </button>
        </div>
      )}
      {compact && !showBar && (
        <div className="rp-sheet-layer">
          <div className="rp-sheet-scrim" aria-hidden onClick={stage === 'task' ? back : undefined} />
          <aside className="rp rp--sheet" role="dialog" aria-label="Research test">
            <p className="rp-brand">Ana user test</p>
            {body}
            {stage === 'task' && !view && (
              <button className="rp-link" onClick={back}>
                Hide
              </button>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------ screens
/** A research page (intro, consent, details, survey, thanks): shown on its own, outside any phone. */
function Panel({ label, title, children, footer }: { label: string; title?: string; children: ReactNode; footer?: ReactNode }) {
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => h.current?.focus(), [title]);
  return (
    <section className="rp-page" aria-label={label}>
      <p className="rp-brand">Ana user test</p>
      {title && (
        <h1 className="rp-page-title" ref={h} tabIndex={-1}>
          {title}
        </h1>
      )}
      <div className="rp-page-body">{children}</div>
      {footer && <div className="rp-actions">{footer}</div>}
    </section>
  );
}

function Intro({ onNext }: { onNext: () => void }) {
  return (
    <Panel label="Introduction" title="Thanks for helping us test Ana" footer={<Button block onClick={onNext}>Continue</Button>}>
      <p>This is a prototype, so some things may not work yet.</p>
      <p>We're testing the product, not you. There are no wrong answers.</p>
      <p className="rp-quiet">It takes about 10 minutes. You'll get a few short tasks, one at a time.</p>
    </Panel>
  );
}

function Consent({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [agree, setAgree] = useState(false);
  return (
    <Panel
      label="Consent"
      title="Before you start"
      footer={
        <>
          <Button block onClick={onNext} disabled={!agree}>
            I agree, continue
          </Button>
          <button className="rp-link" onClick={onBack}>
            Back
          </button>
        </>
      }
    >
      <ul className="rp-list">
        <li>We record what you do in the prototype (screens you open, actions you take) to improve Ana.</li>
        <li>Anything you choose to write in feedback is stored with it.</li>
        <li>We never capture passwords or private messages, and nothing you type into the prototype itself.</li>
        <li>You can stop at any time. What you've done so far is kept.</li>
      </ul>
      <label className="rp-check">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>I understand and agree to take part.</span>
      </label>
    </Panel>
  );
}

function Info({ onStart, error }: { onStart: (i: { displayName?: string; primaryCraft?: string; experienceLevel?: string }) => void; error: boolean }) {
  const [name, setName] = useState('');
  const [craft, setCraft] = useState('');
  const [exp, setExp] = useState('');
  return (
    <Panel
      label="About you"
      title="A little about you"
      footer={
        <Button block onClick={() => onStart({ displayName: name.trim() || undefined, primaryCraft: craft || undefined, experienceLevel: exp || undefined })}>
          Start the test
        </Button>
      }
    >
      <p className="rp-quiet">All optional. No email or contact details.</p>
      {error && (
        <p className="inline-error" role="alert">
          We couldn't start the test. Please check your connection and try again.
        </p>
      )}
      <label className="rp-field">
        <span>First name (optional)</span>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="off" />
      </label>
      <label className="rp-field">
        <span>Your craft</span>
        <select className="field" value={craft} onChange={(e) => setCraft(e.target.value)}>
          <option value="">Choose…</option>
          {CRAFTS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="rp-field">
        <span>Experience</span>
        <select className="field" value={exp} onChange={(e) => setExp(e.target.value)}>
          <option value="">Choose…</option>
          {EXPERIENCE.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
    </Panel>
  );
}

function Scale({ value, onChange, low, high, label }: { value: number | null; onChange: (n: number) => void; low: string; high: string; label: string }) {
  return (
    <div className="rp-scale" role="radiogroup" aria-label={label}>
      <div className="rp-scale-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={value === n} aria-label={`${n}${n === 1 ? `, ${low}` : n === 5 ? `, ${high}` : ''}`} className={`rp-scale-btn ${value === n ? 'is-on' : ''}`} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
      </div>
      <div className="rp-scale-ends" aria-hidden>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function TaskDone({ onSubmit }: { onSubmit: (r: { difficulty: number | null; expected: boolean | null; expecting: string; confusing: string }) => void }) {
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [expected, setExpected] = useState<boolean | null>(null);
  const [expecting, setExpecting] = useState('');
  const [confusing, setConfusing] = useState('');
  return (
    <div className="rp-form">
      <p className="rp-q">How easy or difficult was that?</p>
      <Scale value={difficulty} onChange={setDifficulty} low="Very easy" high="Very difficult" label="Difficulty, 1 very easy to 5 very difficult" />
      <p className="rp-q">Was this what you expected to happen?</p>
      <div className="rp-choice" role="radiogroup" aria-label="Was this what you expected?">
        {[
          [true, 'Yes'],
          [false, 'No'],
        ].map(([v, l]) => (
          <button key={String(v)} role="radio" aria-checked={expected === v} className={`chip ${expected === v ? 'is-on' : ''}`} onClick={() => setExpected(v as boolean)}>
            {l as string}
          </button>
        ))}
      </div>
      {expected === false && (
        <label className="rp-field">
          <span>What were you expecting? (optional)</span>
          <textarea className="field" rows={2} value={expecting} onChange={(e) => setExpecting(e.target.value)} maxLength={1000} />
        </label>
      )}
      <label className="rp-field">
        <span>Was anything confusing? (optional)</span>
        <textarea className="field" rows={2} value={confusing} onChange={(e) => setConfusing(e.target.value)} maxLength={1000} />
      </label>
      <Button block onClick={() => onSubmit({ difficulty, expected, expecting, confusing })}>
        Continue
      </Button>
    </div>
  );
}

function Stuck({ onContinue, onSkip }: { onContinue: (c: string) => void; onSkip: (c: string) => void }) {
  const [c, setC] = useState('');
  return (
    <div className="rp-form">
      <label className="rp-field">
        <span>What are you trying to do? (optional)</span>
        <textarea className="field" rows={3} value={c} onChange={(e) => setC(e.target.value)} maxLength={1000} />
      </label>
      <Button block variant="secondary" onClick={() => onContinue(c)}>
        Continue trying
      </Button>
      <Button block variant="secondary" onClick={() => onSkip(c)}>
        Skip task
      </Button>
    </div>
  );
}

function Skip({ onSkip, onCancel }: { onSkip: (reason: string) => void; onCancel: () => void }) {
  const [r, setR] = useState('');
  return (
    <div className="rp-form">
      <label className="rp-field">
        <span>Why are you skipping? (optional)</span>
        <textarea className="field" rows={2} value={r} onChange={(e) => setR(e.target.value)} maxLength={1000} />
      </label>
      <Button block onClick={() => onSkip(r)}>
        Skip task
      </Button>
      <Button block variant="secondary" onClick={onCancel}>
        Keep trying
      </Button>
    </div>
  );
}

function Feedback({ onSubmit, onCancel }: { onSubmit: (c: FeedbackCategory, comment: string) => void; onCancel: () => void }) {
  const [cat, setCat] = useState<FeedbackCategory | null>(null);
  const [comment, setComment] = useState('');
  if (!cat)
    return (
      <div className="rp-form rp-cats" role="group" aria-label="What kind of feedback?">
        {FEEDBACK.map((f) => (
          <button key={f.id} className="rp-cat" onClick={() => setCat(f.id)}>
            {f.label}
          </button>
        ))}
        <button className="rp-link" onClick={onCancel}>
          Back to the task
        </button>
      </div>
    );
  return (
    <div className="rp-form">
      <p className="rp-q">{FEEDBACK.find((f) => f.id === cat)?.label}</p>
      <label className="rp-field">
        <span>Tell us more (optional)</span>
        <textarea className="field" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1500} autoFocus />
      </label>
      <p className="rp-quiet">We'll know which screen and task you were on.</p>
      <Button block onClick={() => onSubmit(cat, comment)}>
        Send feedback
      </Button>
      <button className="rp-link" onClick={() => setCat(null)}>
        Back
      </button>
    </div>
  );
}

function Survey({ onSubmit }: { onSubmit: (a: { ease: number | null; purpose: string; confusing: string; wouldUse: string }) => void }) {
  const [ease, setEase] = useState<number | null>(null);
  const [purpose, setPurpose] = useState('');
  const [confusing, setConfusing] = useState('');
  const [wouldUse, setWouldUse] = useState('');
  return (
    <Panel label="Final questions" title="Last few questions" footer={<Button block onClick={() => onSubmit({ ease, purpose, confusing, wouldUse })}>Finish</Button>}>
      <p className="rp-q">Overall, how easy was Ana to understand?</p>
      <Scale value={ease} onChange={setEase} low="Very difficult" high="Very easy" label="Overall ease, 1 very difficult to 5 very easy" />
      <label className="rp-field">
        <span>What do you think Ana is for?</span>
        <textarea className="field" rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={1000} />
      </label>
      <label className="rp-field">
        <span>What was the most confusing part? (optional)</span>
        <textarea className="field" rows={2} value={confusing} onChange={(e) => setConfusing(e.target.value)} maxLength={1000} />
      </label>
      <label className="rp-field">
        <span>What, if anything, would make you want to use Ana? (optional)</span>
        <textarea className="field" rows={2} value={wouldUse} onChange={(e) => setWouldUse(e.target.value)} maxLength={1000} />
      </label>
    </Panel>
  );
}
