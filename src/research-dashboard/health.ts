/**
 * Study health: the numbers that say whether the test itself is working (docs/TEST_REDESIGN.md).
 * Works for any study, old or new, from the same tables: sessions, attempts, feedback and events.
 *
 * "Left without finishing" is derived: a session still marked active with no activity for 30 minutes.
 * Closing the tab never ended a session on the server, so without this the old data reads as "in progress".
 */
import type { Attempt, Feedback, Session, StudyData, Task } from './data';
import { median } from './labels';

export type HealthEvent = { session_id: string; task_attempt_id: string | null; sequence: number; event_name: string; screen: string | null; object_type: string | null; object_id: string | null; metadata: Record<string, unknown> | null; created_at: string };

const IDLE_MS = 30 * 60 * 1000;
const done = (a: Attempt) => a.outcome === 'completed' || a.outcome === 'completed_with_difficulty';

export type TaskHealth = {
  task: Task;
  reached: number;
  finished: number;
  skipped: number;
  stoppedInApp: number;
  stoppedAtQuestions: number;
  stuckSessions: number;
  backMedian: number | null;
  backTotal: number;
  medianMs: number | null;
  finishedByApp: number;
  finishedByParticipant: number;
  finishedWithoutAppEvent: number;
  medianEase: number | null;
};

export type Health = {
  total: number;
  completed: number;
  endedEarly: number;
  left: number;
  inProgress: number;
  completionRate: number | null;
  medianSessionMs: number | null;
  medianScenariosDone: number | null;
  resumedSessions: number;
  tasks: TaskHealth[];
  devices: { device: string; n: number; completed: number; medianScenariosDone: number | null }[];
  stuckReasons: { reason: string; n: number }[];
  firstRun: { reached: number; stopped: number } | null;
  stopPoints: { label: string; n: number }[];
};

export function computeHealth(d: StudyData, events: HealthEvent[], now = Date.now()): Health {
  const byTask = new Map(d.tasks.map((t) => [t.id, t]));
  const attemptsBySession = new Map<string, Attempt[]>();
  for (const a of d.attempts) attemptsBySession.set(a.session_id, [...(attemptsBySession.get(a.session_id) ?? []), a]);
  const eventsByAttempt = new Map<string, HealthEvent[]>();
  const lastActivity = new Map<string, number>();
  const resumed = new Set<string>();
  for (const e of events) {
    if (e.task_attempt_id) eventsByAttempt.set(e.task_attempt_id, [...(eventsByAttempt.get(e.task_attempt_id) ?? []), e]);
    lastActivity.set(e.session_id, Math.max(lastActivity.get(e.session_id) ?? 0, Date.parse(e.created_at)));
    if (e.event_name === 'session_resumed') resumed.add(e.session_id);
  }
  const state = (s: Session) => {
    if (s.status === 'completed') return 'completed';
    if (s.status === 'abandoned') return 'ended';
    const last = Math.max(lastActivity.get(s.id) ?? 0, Date.parse(s.started_at));
    return now - last > IDLE_MS ? 'left' : 'active';
  };
  const states = new Map(d.sessions.map((s) => [s.id, state(s)]));
  const count = (k: string) => [...states.values()].filter((x) => x === k).length;
  const doneCount = (sid: string) => (attemptsBySession.get(sid) ?? []).filter(done).length;
  const completedSessions = d.sessions.filter((s) => s.status === 'completed' && s.completed_at);

  const ordered = [...d.tasks].sort((a, b) => a.sequence - b.sequence);
  const tasks: TaskHealth[] = ordered.map((t) => {
    const as = d.attempts.filter((a) => a.task_id === t.id);
    const finished = as.filter(done);
    const notFinished = as.filter((a) => !done(a) && a.outcome !== 'skipped' && states.get(a.session_id) !== 'active');
    const reachedQuestions = (a: Attempt) => a.success_detected || (eventsByAttempt.get(a.id) ?? []).some((e) => e.event_name === 'task_questions_shown');
    const backs = as.map((a) => (eventsByAttempt.get(a.id) ?? []).filter((e) => e.event_name === 'navigated_back' || e.event_name === 'onboarding_step_back').length);
    const stuck = new Set(as.filter((a) => (eventsByAttempt.get(a.id) ?? []).some((e) => e.event_name === 'stuck_reported')).map((a) => a.session_id));
    const eases = finished.map((a) => a.difficulty_rating).filter((x): x is number => x != null).map((x) => 6 - x);
    return {
      task: t,
      reached: new Set(as.map((a) => a.session_id)).size,
      finished: finished.length,
      skipped: as.filter((a) => a.outcome === 'skipped').length,
      stoppedInApp: notFinished.filter((a) => !reachedQuestions(a)).length,
      stoppedAtQuestions: notFinished.filter(reachedQuestions).length,
      stuckSessions: stuck.size,
      backMedian: median(backs),
      backTotal: backs.reduce((x, y) => x + y, 0),
      medianMs: median(finished.map((a) => a.duration_ms).filter((x): x is number => x != null)),
      finishedByApp: finished.filter((a) => a.success_detected).length,
      finishedByParticipant: finished.filter((a) => !a.success_detected).length,
      finishedWithoutAppEvent: t.success_events.length ? finished.filter((a) => !a.success_detected).length : 0,
      medianEase: median(eases),
    };
  });

  const devices = [...new Set(d.sessions.map((s) => s.device_type ?? 'unknown'))].map((device) => {
    const ss = d.sessions.filter((s) => (s.device_type ?? 'unknown') === device);
    return { device, n: ss.length, completed: ss.filter((s) => s.status === 'completed').length, medianScenariosDone: median(ss.map((s) => doneCount(s.id))) };
  });

  const stuckReasons = new Map<string, number>();
  for (const f of d.feedback.filter((x: Feedback) => x.interaction_context?.source === 'stuck')) {
    const r = String(f.interaction_context?.reason ?? f.category);
    stuckReasons.set(r, (stuckReasons.get(r) ?? 0) + 1);
  }

  // Where unfinished sessions stopped: the last task they reached, and whether it was in the app or at its questions.
  const stopPoints = new Map<string, number>();
  for (const s of d.sessions) {
    const st = states.get(s.id);
    if (st !== 'ended' && st !== 'left') continue;
    const as = (attemptsBySession.get(s.id) ?? []).sort((a, b) => (byTask.get(a.task_id)?.sequence ?? 0) - (byTask.get(b.task_id)?.sequence ?? 0));
    const last = as[as.length - 1];
    let label = 'Before the first scenario';
    if (last) {
      const t = byTask.get(last.task_id);
      const at = last.success_detected || (eventsByAttempt.get(last.id) ?? []).some((e) => e.event_name === 'task_questions_shown');
      label = done(last) || last.outcome === 'skipped' ? `After ${t?.sequence}. ${t?.title}` : `${t?.sequence}. ${t?.title}: ${at ? 'at the questions' : 'in the app'}`;
      if (done(last) && t && t.sequence === ordered.length) label = 'At the final survey';
    }
    stopPoints.set(label, (stopPoints.get(label) ?? 0) + 1);
  }

  const first = ordered[0];
  const firstRun =
    first && (first.key === 'getting-started' || first.key === 'first-look')
      ? (() => {
          const as = d.attempts.filter((a) => a.task_id === first.id);
          return { reached: as.length, stopped: as.filter((a) => a.outcome === 'abandoned' || (a.outcome === 'in_progress' && states.get(a.session_id) === 'left')).length };
        })()
      : null;

  return {
    total: d.sessions.length,
    completed: count('completed'),
    endedEarly: count('ended'),
    left: count('left'),
    inProgress: count('active'),
    completionRate: d.sessions.length ? count('completed') / d.sessions.length : null,
    medianSessionMs: median(completedSessions.map((s) => Date.parse(s.completed_at!) - Date.parse(s.started_at))),
    medianScenariosDone: median(d.sessions.map((s) => doneCount(s.id))),
    resumedSessions: resumed.size,
    tasks,
    devices,
    stuckReasons: [...stuckReasons].map(([reason, n]) => ({ reason, n })).sort((a, b) => b.n - a.n),
    firstRun,
    stopPoints: [...stopPoints].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n),
  };
}

// ------------------------------------------------------------------------------- Home comparison
export type HomeArm = 'current' | 'next' | 'unassigned';
export const HOME_ARM_LABEL: Record<HomeArm, string> = { current: "Today's Home", next: 'New Home', unassigned: 'Not assigned (older build)' };

/** Which Home each session saw, from session_started (docs/HOME.md). Sessions from before the split are unassigned. */
export function homeArms(events: HealthEvent[]): Map<string, HomeArm> {
  const out = new Map<string, HomeArm>();
  for (const e of events) {
    if (e.event_name !== 'session_started') continue;
    const v = e.metadata?.homeVariant;
    out.set(e.session_id, v === 'next' || v === 'current' ? v : 'unassigned');
  }
  return out;
}

export type ArmRow = {
  arm: HomeArm;
  sessions: number;
  completed: number;
  medianScenariosDone: number | null;
  reachedEnd: number;
  openedFromHome: number;
  tasks: { taskId: string; reached: number; finished: number; medianMs: number | null; medianEase: number | null }[];
};

/** Side by side: completion, scenario success, time and ease per arm, plus how Home itself was used. */
export function compareHome(d: StudyData, events: HealthEvent[], now = Date.now()): ArmRow[] {
  const arms = homeArms(events);
  const armOf = (sid: string): HomeArm => arms.get(sid) ?? 'unassigned';
  const present = (['current', 'next', 'unassigned'] as HomeArm[]).filter((a) => d.sessions.some((s) => armOf(s.id) === a));
  return present.map((arm) => {
    const ids = new Set(d.sessions.filter((s) => armOf(s.id) === arm).map((s) => s.id));
    const sub: StudyData = { tasks: d.tasks, sessions: d.sessions.filter((s) => ids.has(s.id)), attempts: d.attempts.filter((a) => ids.has(a.session_id)), feedback: d.feedback.filter((f) => ids.has(f.session_id)) };
    const ev = events.filter((e) => ids.has(e.session_id));
    const h = computeHealth(sub, ev, now);
    const sessionsWith = (name: string) => new Set(ev.filter((e) => e.event_name === name).map((e) => e.session_id)).size;
    return {
      arm,
      sessions: h.total,
      completed: h.completed,
      medianScenariosDone: h.medianScenariosDone,
      reachedEnd: sessionsWith('home_end_reached'),
      openedFromHome: sessionsWith('home_unit_opened'),
      tasks: h.tasks.map((t) => ({ taskId: t.task.id, reached: t.reached, finished: t.finished, medianMs: t.medianMs, medianEase: t.medianEase })),
    };
  });
}
