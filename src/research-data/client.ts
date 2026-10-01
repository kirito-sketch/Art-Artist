/**
 * Research instrumentation client: the only way the prototype talks to the research backend.
 *
 *   research.startSession({ studySlug, persona })    once, when a participant starts testing
 *   research.startTask('find-role')                   a task attempt begins
 *   research.track('role_opened', { objectType: 'role', objectId: 'o1' })
 *   research.completeTask('find-role', { outcome: 'completed', difficulty: 2 })
 *   research.submitFeedback({ category: 'confusing', comment })
 *   research.completeSession()
 *
 * Guarantees:
 *  - Never throws, never awaits in a product path, never blocks the UI. Without an active session every
 *    call is a no-op, so normal prototype and demo use is untouched.
 *  - One ordered queue: task starts reach the server before the events inside them. Events are batched.
 *  - Every write has a client-generated id; the server ignores repeats. Double taps, React Strict Mode
 *    and remounts are also de-duplicated here (same event within 400 ms, one open attempt per task).
 *  - If the backend is down, writes wait in a small sessionStorage queue and retry with backoff
 *    (2 s, 5 s, 15 s, 30 s, 60 s), then are dropped. The participant never notices.
 */
import { ANA_PROTOTYPE_VERSION_LABEL } from '../version';
import { brand } from './brand';
import { isResearchEventName, sanitizeMetadata, sanitizeToken, type AttemptOutcome, type FeedbackCategory, type Metadata, type ResearchEventName, type ResearchObjectType } from './taxonomy';

const API = ((import.meta.env.VITE_RESEARCH_API_BASE as string | undefined) || '/api/research').replace(/\/$/, '');
const ENABLED = import.meta.env.VITE_RESEARCH_ENABLED !== 'false';
const DEV = import.meta.env.DEV;
const K = { token: 'ana-rs-token', seq: 'ana-rs-seq', queue: 'ana-rs-queue', attempts: 'ana-rs-attempts', done: 'ana-rs-done', info: 'ana-rs-info' };
const RETRY_MS = [2000, 5000, 15000, 30000, 60000];
const MAX_QUEUE = 300;

type Op = { path: string; body: Record<string, unknown>; tries: number; auth: boolean };
type EventPayload = { id: string; seq: number; name: ResearchEventName; screen: string | null; objectType?: ResearchObjectType; objectId?: string; metadata: Metadata; ts: string; attemptId?: string };
export type ResearchContext = { screen?: string; persona?: string; acting?: string; tab?: string; sheet?: string };
export type StudyTask = { key: string; sequence: number; title: string; instruction: string; successEvents: string[]; successObjectType: string | null };
export type SessionInfo = { participantCode: string; study: { slug: string; title: string }; tasks: StudyTask[] };
export type TrackedEvent = { name: ResearchEventName; objectType?: ResearchObjectType; objectId?: string; metadata: Metadata };

const store = {
  get(k: string) {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      sessionStorage.setItem(k, v);
    } catch {
      /* storage blocked: keep working in memory */
    }
  },
  del(k: string) {
    try {
      sessionStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
  json<T>(k: string, fallback: T): T {
    try {
      return JSON.parse(store.get(k) ?? '') as T;
    } catch {
      return fallback;
    }
  },
};

const uuid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
const warn = (...a: unknown[]) => DEV && console.warn('[research]', ...a);

let token: string | null = store.get(K.token);
let seq = Number(store.get(K.seq) ?? 0) || 0;
let queue: Op[] = store.json<Op[]>(K.queue, []);
let attempts: Record<string, string> = store.json(K.attempts, {}); // taskKey -> open client attempt id
let done: string[] = store.json(K.done, []); // completed attempt ids, feedback ids, 'session'
let currentTask: string | null = Object.keys(attempts).pop() ?? null;
let context: ResearchContext = {};
let pending: EventPayload[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let starting: Promise<SessionInfo | null> | null = null;
/**
 * A token left in this tab only counts on the surface that owns it: startSession() or resume() in
 * this page load. So opening the normal prototype in the same tab after a test records nothing.
 */
let attached = false;
const listeners = new Set<(e: TrackedEvent) => void>();
const recent = new Map<string, number>();

const persist = () => {
  store.set(K.seq, String(seq));
  store.set(K.queue, JSON.stringify(queue.slice(-MAX_QUEUE)));
  store.set(K.attempts, JSON.stringify(attempts));
  store.set(K.done, JSON.stringify(done.slice(-200)));
};

async function send(op: Op): Promise<'ok' | 'retry' | 'drop'> {
  try {
    const r = await fetch(API + '/' + op.path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(op.auth && token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(op.body),
      keepalive: true,
    });
    if (r.ok) return 'ok';
    // 4xx will never succeed (bad request, closed session): drop it. 5xx / 503 not configured: retry.
    return r.status >= 500 ? 'retry' : (warn(op.path, r.status), 'drop');
  } catch {
    return 'retry';
  }
}

async function flush() {
  if (flushing || !token) return;
  flushing = true;
  try {
    while (queue.length) {
      const op = queue[0];
      const result = await send(op);
      if (result === 'retry') {
        op.tries++;
        if (op.tries > RETRY_MS.length) {
          warn('giving up on', op.path);
          queue.shift();
          continue;
        }
        persist();
        if (!retryTimer) retryTimer = setTimeout(() => ((retryTimer = null), void flush()), RETRY_MS[op.tries - 1]);
        return;
      }
      queue.shift();
      persist();
    }
  } finally {
    flushing = false;
  }
}

function enqueue(path: string, body: Record<string, unknown>) {
  if (!token) return;
  queue.push({ path, body, tries: 0, auth: true });
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  persist();
  void flush();
}

/** Move batched events into the ordered queue (before any task/feedback/session write). */
function flushEvents() {
  if (batchTimer) clearTimeout(batchTimer), (batchTimer = null);
  while (pending.length) enqueue('event', { events: pending.splice(0, 50) });
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => flushEvents());
  // A reload mid-session: resume anything left in the queue.
  if (token && queue.length) setTimeout(() => void flush(), 1500);
}

function detectDevice(): { deviceType: string; viewportWidth: number; viewportHeight: number; browser: string; os: string; touch: boolean } {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const w = typeof window !== 'undefined' ? window.innerWidth : 0;
  const touch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const deviceType = /iPad|Tablet/i.test(ua) || (touch && w >= 768 && w < 1100) ? 'tablet' : /Mobi|iPhone|Android/i.test(ua) || (touch && w < 768) ? 'phone' : 'desktop';
  // Coarse family names only, never the full user-agent string.
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : 'Other';
  const os = /iPhone|iPad|Mac OS/.test(ua) ? (/iPhone|iPad/.test(ua) ? 'iOS' : 'macOS') : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Other';
  return { deviceType, viewportWidth: w, viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0, browser, os, touch };
}

export const research = {
  /** True while this browser tab holds a research session. */
  isActive: () => ENABLED && !!token && attached,

  /** Re-attach to the session already held by this tab (a reload inside Test Mode). */
  resume(): SessionInfo | null {
    if (!ENABLED || !token) return null;
    attached = true;
    if (queue.length) setTimeout(() => void flush(), 500);
    const info = store.json<SessionInfo | null>(K.info, null);
    return info && { ...info, study: { ...info.study, title: brand(info.study.title) }, tasks: info.tasks.map((t) => ({ ...t, title: brand(t.title), instruction: brand(t.instruction) })) };
  },

  /** The session this tab holds, if any (without attaching to it). */
  session: (): SessionInfo | null => (token ? store.json<SessionInfo | null>(K.info, null) : null),

  /** Listen to tracked events (Test Mode uses this to notice task success). Returns an unsubscribe. */
  subscribe(fn: (e: TrackedEvent) => void) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },

  /** The active study for a participant type (title, description, task count). Null when unavailable. */
  async activeStudy(type: 'individual_creative' | 'production_house' = 'individual_creative'): Promise<{ slug: string; title: string; description: string | null; taskCount: number } | null> {
    if (!ENABLED) return null;
    try {
      const r = await fetch(API + '/study', { headers: { 'x-study-type': type } });
      if (!r.ok) return null;
      const st = ((await r.json()) as { study: { slug: string; title: string; description: string | null; taskCount: number } }).study;
      return { ...st, title: brand(st.title), description: brand(st.description) };
    } catch {
      return null;
    }
  },

  /** The current position in the event trail. */
  sequence: () => seq,

  /** Keep screen and persona current so events and feedback carry them automatically. */
  setContext(c: ResearchContext) {
    context = { ...context, ...c };
  },

  /**
   * Start a session for a study. Safe to call twice (returns the same in-flight promise) and safe to
   * call when the backend is unreachable (resolves to null; the prototype carries on unrecorded).
   */
  startSession(opts: { studySlug: string; persona?: string; participantCode?: string; participant?: { displayName?: string; participantType?: string; primaryCraft?: string; experienceLevel?: string }; consent: true }): Promise<SessionInfo | null> {
    if (!ENABLED) return Promise.resolve(null);
    if (token) return (attached = true), Promise.resolve(store.json<SessionInfo | null>(K.info, null));
    if (starting) return starting;
    starting = (async () => {
      try {
        const r = await fetch(API + '/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studySlug: opts.studySlug, persona: opts.persona ?? context.persona, participantCode: opts.participantCode, participant: opts.participant, consent: opts.consent === true, prototypeVersion: ANA_PROTOTYPE_VERSION_LABEL, clientStartId: uuid(), client: detectDevice() }),
        });
        if (!r.ok) return warn('session start', r.status), null;
        const data = (await r.json()) as SessionInfo & { token: string };
        token = data.token;
        attached = true;
        seq = 0;
        queue = [];
        attempts = {};
        done = [];
        store.set(K.token, token);
        const info: SessionInfo = { participantCode: data.participantCode, study: { ...data.study, title: brand(data.study.title) }, tasks: data.tasks.map((t) => ({ ...t, title: brand(t.title), instruction: brand(t.instruction) })) };
        store.set(K.info, JSON.stringify(info));
        persist();
        research.track('session_started', { metadata: { persona: opts.persona ?? context.persona ?? null } });
        return info;
      } catch {
        warn('session start failed (backend unreachable)');
        return null;
      } finally {
        starting = null;
      }
    })();
    return starting;
  },

  /** Begin (or resume) the attempt for a task. Returns the attempt id, or null when not recording. */
  startTask(taskKey: string): string | null {
    if (!research.isActive() || !sanitizeToken(taskKey, 60)) return null;
    if (attempts[taskKey]) return (currentTask = taskKey), attempts[taskKey];
    flushEvents();
    const attemptId = uuid();
    attempts[taskKey] = attemptId;
    currentTask = taskKey;
    enqueue('task/start', { taskKey, attemptId, startedAt: new Date().toISOString() });
    research.track('task_started', { objectType: 'task', objectId: taskKey });
    return attemptId;
  },

  /**
   * Record one semantic event. Names outside the taxonomy are ignored. Metadata is sanitised: no free
   * text, nothing a participant typed.
   */
  track(name: ResearchEventName, data: { objectType?: ResearchObjectType; objectId?: string; metadata?: Record<string, unknown> } = {}) {
    if (!research.isActive()) return;
    if (!isResearchEventName(name)) return warn('unknown event', name);
    const metadata = sanitizeMetadata(data.metadata);
    const objectId = data.objectId ? sanitizeToken(data.objectId) ?? undefined : undefined;
    const sig = `${name}|${data.objectType ?? ''}|${objectId ?? ''}|${JSON.stringify(metadata)}`;
    const now = Date.now();
    if (now - (recent.get(sig) ?? 0) < 400) return; // double tap, Strict Mode double effect, remount
    recent.set(sig, now);
    if (recent.size > 100) recent.delete(recent.keys().next().value as string);
    seq += 1;
    store.set(K.seq, String(seq));
    pending.push({ id: uuid(), seq, name, screen: sanitizeToken(context.screen, 80), objectType: data.objectType, objectId, metadata, ts: new Date().toISOString(), attemptId: currentTask ? attempts[currentTask] : undefined });
    for (const fn of listeners) {
      try {
        fn({ name, objectType: data.objectType, objectId, metadata });
      } catch {
        /* a listener must never break tracking */
      }
    }
    if (pending.length >= 20) flushEvents();
    else if (!batchTimer) batchTimer = setTimeout(flushEvents, 800);
  },

  /** End the current attempt for a task. Repeats are ignored. */
  completeTask(taskKey: string, result: { outcome: AttemptOutcome; difficulty?: number; expectationMatch?: number; feedbackText?: string }) {
    if (!research.isActive()) return;
    const attemptId = attempts[taskKey];
    if (!attemptId || done.includes(attemptId)) return;
    research.track(result.outcome === 'skipped' ? 'task_skipped' : 'task_completed', { objectType: 'task', objectId: taskKey, metadata: { outcome: result.outcome } });
    flushEvents();
    done.push(attemptId);
    delete attempts[taskKey];
    if (currentTask === taskKey) currentTask = null;
    enqueue('task/complete', { attemptId, outcome: result.outcome, difficulty: result.difficulty, expectationMatch: result.expectationMatch, feedbackText: result.feedbackText });
  },

  /**
   * Submit feedback. Screen, task, persona, build and the point in the event trail are attached
   * automatically; the participant only chooses a category and may add a comment.
   */
  submitFeedback(f: { category: FeedbackCategory; comment?: string; id?: string; source?: 'button' | 'stuck' | 'survey'; question?: string; rating?: number }): string | null {
    if (!research.isActive()) return null;
    const id = f.id ?? uuid();
    if (done.includes(id)) return id;
    if (f.source !== 'survey') research.track('feedback_submitted', { metadata: { category: f.category, source: f.source ?? 'button' } });
    flushEvents();
    done.push(id);
    enqueue('feedback', {
      id,
      category: f.category,
      comment: f.comment,
      screen: context.screen,
      attemptId: currentTask ? attempts[currentTask] : undefined,
      context: { persona: context.persona, acting: context.acting, tab: context.tab, sheet: context.sheet, route: context.screen, taskKey: currentTask, lastSequence: seq, source: f.source ?? 'button', question: f.question, rating: f.rating },
    });
    return id;
  },

  /** Finish the session. Open attempts are closed as abandoned by the server. */
  completeSession(status: 'completed' | 'abandoned' = 'completed') {
    if (!research.isActive() || done.includes('session')) return;
    research.track('session_completed', { metadata: { status } });
    flushEvents();
    done.push('session');
    enqueue('session/complete', { status });
  },

  /** Forget the session in this tab (after completion, or when the researcher resets the device). */
  clear() {
    flushEvents();
    for (const k of Object.values(K)) store.del(k);
    token = null;
    attached = false;
    seq = 0;
    queue = [];
    attempts = {};
    done = [];
    currentTask = null;
  },

  /** The open task in this tab, if any. */
  currentTask: () => currentTask,

  /** For development inspection: what is waiting to be sent. */
  debugState: () => ({ active: research.isActive(), seq, queued: queue.length, pendingEvents: pending.length, openTasks: Object.keys(attempts), currentTask }),
  /** Resolves when everything queued so far has been sent (or given up). Development/tests only. */
  async drain() {
    flushEvents();
    for (let i = 0; i < 50 && (queue.length || flushing); i++) {
      await flush();
      if (queue.length) await new Promise((r) => setTimeout(r, 100));
    }
    return queue.length === 0;
  },
};
