/**
 * Participant Test Mode (/test): an unmoderated, task-based usability test of the real Ana prototype.
 *
 * Flow: intro, consent, a few optional details, then one task at a time. While a task is active Ana is
 * fully usable; a quiet strip in the status-bar area carries the task reminder and two controls (Task,
 * Feedback). Success is noticed from the task's semantic success events, after the product action has
 * settled. Each task ends with a short sheet (difficulty, expectation, anything confusing). A short
 * survey closes the session. Everything is written through the research client, which never blocks Ana.
 * See docs/RESEARCH_TEST_MODE.md.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MessageSquareText, ListChecks } from 'lucide-react';
import { useStore } from '../state/store';
import { Sheet } from '../ui/Sheet';
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

export function TestMode() {
  const store = useStore();
  const restored = useRef(load());
  const [stage, setStage] = useState<Stage>('loading');
  const [index, setIndex] = useState(restored.current?.index ?? 0);
  const [stuck, setStuck] = useState<string[]>(restored.current?.stuck ?? []);
  const [study, setStudy] = useState<{ title: string; slug: string; taskCount: number } | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [sheet, setSheet] = useState<null | 'task' | 'feedback' | 'stuck' | 'skip' | 'end'>(null);
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
    if (!succeeded || stage !== 'task' || store.sheet || sheet) return;
    const t = setTimeout(() => setStage('task-done'), 1100);
    return () => clearTimeout(t);
  }, [succeeded, stage, store.sheet, store.stack.length, sheet]);

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
    setSheet(null);
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
    setSheet(null);
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
  if (stage === 'loading' || stage === 'starting') return <Panel label="Loading"><p className="test-quiet">{stage === 'starting' ? 'Starting your test…' : 'Loading…'}</p></Panel>;
  if (stage === 'unavailable')
    return (
      <Panel label="Test unavailable" title="This test isn't open right now">
        <p>Thanks for your interest. Please check the link you were given, or try again later.</p>
      </Panel>
    );
  if (stage === 'intro') return <Intro onNext={() => setStage('consent')} />;
  if (stage === 'consent') return <Consent onNext={() => setStage('info')} onBack={() => setStage('intro')} />;
  if (stage === 'info') return <Info onStart={begin} error={startError} />;
  if (stage === 'survey') return <Survey onSubmit={finishSurvey} />;
  if (stage === 'thanks' || stage === 'ended')
    return (
      <Panel label="Test complete" title="Thank you">
        <p>{stage === 'thanks' ? 'Your feedback has been recorded.' : 'Your answers so far have been saved. Thanks for your time.'}</p>
        <p className="test-quiet">You can close this page now.</p>
      </Panel>
    );
  if (!task) return <Panel label="Loading"><p className="test-quiet">Loading…</p></Panel>;

  const total = tasks.length;
  return (
    <>
      {stage === 'task' && (
        <div className="test-strip" role="region" aria-label="Test controls">
          <button className="test-strip-task" onClick={() => (research.track('task_instruction_opened', { objectType: 'task', objectId: task.key }), setSheet('task'))} aria-label={`Task ${index + 1} of ${total}: ${task.title}. Open task options`}>
            <ListChecks size={15} aria-hidden />
            <span className="test-strip-text">
              <b>Task {index + 1}</b> · {task.title}
            </span>
          </button>
          {!task.successEvents.length && (
            <button className="test-strip-btn test-strip-btn--done" onClick={() => setStage('task-done')}>
              Done
            </button>
          )}
          <button className="test-strip-btn" onClick={() => (research.track('feedback_opened'), setSheet('feedback'))} aria-label="Give feedback">
            <MessageSquareText size={15} aria-hidden />
            <span>Feedback</span>
          </button>
        </div>
      )}

      <Sheet open={stage === 'task-intro'} onClose={() => undefined} title={`Task ${index + 1} of ${total}`}>
        <div className="test-sheet">
          <h2 className="test-task-title">{task.title}</h2>
          <p className="test-task-instruction">{task.instruction}</p>
          <Button block onClick={() => setStage('task')}>
            Start task
          </Button>
          <button className="test-link" onClick={() => setSheet('end')}>
            End test
          </button>
        </div>
      </Sheet>

      <Sheet open={stage === 'task-done'} onClose={() => undefined} title={succeeded ? 'Task complete' : `Task ${index + 1} done`}>
        <TaskDone key={task.key} onSubmit={finishTask} />
      </Sheet>

      <Sheet open={sheet === 'task'} onClose={() => setSheet(null)} title={`Task ${index + 1} of ${total}`}>
        <div className="test-sheet">
          <h2 className="test-task-title">{task.title}</h2>
          <p className="test-task-instruction">{task.instruction}</p>
          <Button block variant="secondary" onClick={() => setSheet(null)}>
            Continue
          </Button>
          <div className="test-row-actions">
            <button className="test-link" onClick={() => (research.track('stuck_reported', { objectType: 'task', objectId: task.key }), setStuck((s) => (s.includes(task.key) ? s : [...s, task.key])), setSheet('stuck'))}>
              I'm stuck
            </button>
            <button className="test-link" onClick={() => setSheet('skip')}>
              Skip task
            </button>
            <button className="test-link" onClick={() => setSheet('end')}>
              End test
            </button>
          </div>
        </div>
      </Sheet>

      <Sheet open={sheet === 'stuck'} onClose={() => setSheet(null)} title="I'm stuck">
        <Stuck
          onContinue={(c) => {
            if (c.trim()) research.submitFeedback({ category: 'couldnt_find', comment: c, source: 'stuck' });
            setSheet(null);
          }}
          onSkip={(c) => {
            if (c.trim()) research.submitFeedback({ category: 'couldnt_find', comment: c, source: 'stuck' });
            skipTask(c);
          }}
        />
      </Sheet>

      <Sheet open={sheet === 'skip'} onClose={() => setSheet(null)} title="Skip this task?">
        <Skip onSkip={skipTask} onCancel={() => setSheet(null)} />
      </Sheet>

      <Sheet open={sheet === 'feedback'} onClose={() => setSheet(null)} title="Feedback">
        <Feedback
          onSubmit={(category, comment) => {
            research.submitFeedback({ category, comment, source: 'button' });
            setSheet(null);
            store.showToast({ text: 'Thanks, noted' });
          }}
        />
      </Sheet>

      <Sheet open={sheet === 'end'} onClose={() => setSheet(null)} title="End the test?">
        <div className="test-sheet">
          <p>Your answers so far will be kept. You can't come back to this test afterwards.</p>
          <Button block onClick={endEarly}>
            End test
          </Button>
          <Button block variant="secondary" onClick={() => setSheet(null)}>
            Keep going
          </Button>
        </div>
      </Sheet>
    </>
  );
}

// ------------------------------------------------------------------------------------------ screens
function Panel({ label, title, children, footer }: { label: string; title?: string; children: ReactNode; footer?: ReactNode }) {
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => h.current?.focus(), [title]);
  return (
    <section className="test-panel" aria-label={label}>
      <div className="test-panel-body">
        <p className="test-eyebrow">Ana user test</p>
        {title && (
          <h1 className="test-title" ref={h} tabIndex={-1}>
            {title}
          </h1>
        )}
        {children}
      </div>
      {footer && <div className="test-panel-footer">{footer}</div>}
    </section>
  );
}

function Intro({ onNext }: { onNext: () => void }) {
  return (
    <Panel label="Introduction" title="Thanks for helping us test Ana" footer={<Button block onClick={onNext}>Continue</Button>}>
      <p>This is a prototype, so some things may not work yet.</p>
      <p>We're testing the product, not you. There are no wrong answers.</p>
      <p className="test-quiet">It takes about 10 minutes. You'll get a few short tasks, one at a time.</p>
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
          <button className="test-link" onClick={onBack}>
            Back
          </button>
        </>
      }
    >
      <ul className="test-list">
        <li>We record what you do in the prototype (screens you open, actions you take) to improve Ana.</li>
        <li>Anything you choose to write in feedback is stored with it.</li>
        <li>We never capture passwords or private messages, and nothing you type into the prototype itself.</li>
        <li>You can stop at any time. What you've done so far is kept.</li>
      </ul>
      <label className="test-check">
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
      <p className="test-quiet">All optional. No email or contact details.</p>
      {error && (
        <p className="inline-error" role="alert">
          We couldn't start the test. Please check your connection and try again.
        </p>
      )}
      <label className="test-field">
        <span>First name (optional)</span>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="off" />
      </label>
      <label className="test-field">
        <span>Your craft</span>
        <select className="field" value={craft} onChange={(e) => setCraft(e.target.value)}>
          <option value="">Choose…</option>
          {CRAFTS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="test-field">
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
    <div className="test-scale" role="radiogroup" aria-label={label}>
      <div className="test-scale-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={value === n} aria-label={`${n}${n === 1 ? `, ${low}` : n === 5 ? `, ${high}` : ''}`} className={`test-scale-btn ${value === n ? 'is-on' : ''}`} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
      </div>
      <div className="test-scale-ends" aria-hidden>
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
    <div className="test-sheet">
      <p className="test-q">How easy or difficult was that?</p>
      <Scale value={difficulty} onChange={setDifficulty} low="Very easy" high="Very difficult" label="Difficulty, 1 very easy to 5 very difficult" />
      <p className="test-q">Was this what you expected to happen?</p>
      <div className="test-choice" role="radiogroup" aria-label="Was this what you expected?">
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
        <label className="test-field">
          <span>What were you expecting? (optional)</span>
          <textarea className="field" rows={2} value={expecting} onChange={(e) => setExpecting(e.target.value)} maxLength={1000} />
        </label>
      )}
      <label className="test-field">
        <span>Was anything confusing? (optional)</span>
        <textarea className="field" rows={2} value={confusing} onChange={(e) => setConfusing(e.target.value)} maxLength={1000} />
      </label>
      <Button block onClick={() => onSubmit({ difficulty, expected, expecting, confusing })}>
        Next
      </Button>
    </div>
  );
}

function Stuck({ onContinue, onSkip }: { onContinue: (c: string) => void; onSkip: (c: string) => void }) {
  const [c, setC] = useState('');
  return (
    <div className="test-sheet">
      <label className="test-field">
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
    <div className="test-sheet">
      <label className="test-field">
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

function Feedback({ onSubmit }: { onSubmit: (c: FeedbackCategory, comment: string) => void }) {
  const [cat, setCat] = useState<FeedbackCategory | null>(null);
  const [comment, setComment] = useState('');
  if (!cat)
    return (
      <div className="test-sheet test-cats" role="group" aria-label="What kind of feedback?">
        {FEEDBACK.map((f) => (
          <button key={f.id} className="test-cat" onClick={() => setCat(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
    );
  return (
    <div className="test-sheet">
      <p className="test-q">{FEEDBACK.find((f) => f.id === cat)?.label}</p>
      <label className="test-field">
        <span>Tell us more (optional)</span>
        <textarea className="field" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1500} autoFocus />
      </label>
      <p className="test-quiet">We'll know which screen and task you were on.</p>
      <Button block onClick={() => onSubmit(cat, comment)}>
        Send feedback
      </Button>
      <button className="test-link" onClick={() => setCat(null)}>
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
      <p className="test-q">Overall, how easy was Ana to understand?</p>
      <Scale value={ease} onChange={setEase} low="Very difficult" high="Very easy" label="Overall ease, 1 very difficult to 5 very easy" />
      <label className="test-field">
        <span>What do you think Ana is for?</span>
        <textarea className="field" rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={1000} />
      </label>
      <label className="test-field">
        <span>What was the most confusing part? (optional)</span>
        <textarea className="field" rows={2} value={confusing} onChange={(e) => setConfusing(e.target.value)} maxLength={1000} />
      </label>
      <label className="test-field">
        <span>What, if anything, would make you want to use Ana? (optional)</span>
        <textarea className="field" rows={2} value={wouldUse} onChange={(e) => setWouldUse(e.target.value)} maxLength={1000} />
      </label>
    </Panel>
  );
}
