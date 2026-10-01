/**
 * Research API (server-only). Framework-agnostic: takes a parsed request, returns a status and a body.
 * Adapters: server/research/node.ts (Vite dev/preview middleware, Node, Vercel functions).
 *
 * Security model:
 *  - The service-role key is read from the server environment here and nowhere else. It never reaches
 *    the browser: Vite only ships VITE_* variables, and this folder is not imported by the app.
 *  - A participant holds one opaque session token (256 random bits). Only its SHA-256 hash is stored.
 *    Every write after session start must present it and can only touch that session.
 *  - The API only writes. There is no endpoint a participant can use to read research data. The debug
 *    endpoint is disabled unless RESEARCH_DEBUG_KEY is set, and then requires that key.
 *  - Every write is idempotent (client-generated ids + unique constraints), so retries, double taps and
 *    React remounts cannot duplicate records.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ATTEMPT_OUTCOMES, FEEDBACK_CATEGORIES, isResearchEventName, sanitizeMetadata, sanitizeToken, RESEARCH_OBJECT_TYPES } from '../../src/research-data/taxonomy.js';

export type ResearchEnv = {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  RESEARCH_DEBUG_KEY?: string;
  /** Optional. When set, the dashboard read API requires it (x-research-dashboard-key). Unset: open. */
  RESEARCH_DASHBOARD_KEY?: string;
};
export type ResearchRequest = { method: string; action: string; headers: Record<string, string | undefined>; body: unknown; query?: Record<string, string> };
export type ResearchResponse = { status: number; body: unknown; contentType?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);
const ok = (body: unknown = { ok: true }): ResearchResponse => ({ status: 200, body });
const fail = (status: number, error: string): ResearchResponse => ({ status, body: { ok: false, error } });
const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');
const int = (v: unknown, min: number, max: number) => (typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : null);
const shortText = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const isoOrNull = (v: unknown) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);

let cached: { key: string; db: SupabaseClient } | null = null;
function db(env: ResearchEnv): SupabaseClient | null {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (cached?.key !== url + key) cached = { key: url + key, db: createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) };
  return cached.db;
}

type SessionRow = { id: string; study_id: string; status: string; prototype_version: string; selected_persona: string | null };
async function sessionFromToken(sb: SupabaseClient, headers: ResearchRequest['headers']): Promise<SessionRow | null> {
  const auth = headers['authorization'] ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;
  const { data, error } = await sb.from('research_sessions').select('id, study_id, status, prototype_version, selected_persona').eq('token_hash', hashToken(token)).maybeSingle();
  // Database unreachable is a server error (the client retries), not an invalid token (the client drops).
  if (error) throw new Error(`session lookup: ${error.message}`);
  return (data as SessionRow | null) ?? null;
}

function log(...args: unknown[]) {
  // Never log tokens, keys or payload text: only the action and the error.
  if (process.env.NODE_ENV !== 'test') console.warn('[research]', ...args);
}

export async function handleResearch(req: ResearchRequest, env: ResearchEnv): Promise<ResearchResponse> {
  if (req.action === 'health') return health(env);
  if (req.action.startsWith('debug')) return debug(req, env);
  if (req.action.startsWith('dashboard/')) {
    try {
      return await dashboard(req, env);
    } catch (e) {
      log(req.action, (e as Error).message);
      return fail(500, 'server_error');
    }
  }
  if (req.action === 'study' && req.method === 'GET') return activeStudy(env, req.headers['x-study-type']);
  if (req.method !== 'POST') return fail(405, 'method_not_allowed');
  const sb = db(env);
  if (!sb) return fail(503, 'research_backend_not_configured');
  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
  try {
    switch (req.action) {
      case 'session':
        return await startSession(sb, body);
      case 'event':
        return await withSession(sb, req, (s) => recordEvents(sb, s, body));
      case 'task/start':
        return await withSession(sb, req, (s) => startTask(sb, s, body));
      case 'task/complete':
        return await withSession(sb, req, (s) => completeTask(sb, s, body));
      case 'feedback':
        return await withSession(sb, req, (s) => submitFeedback(sb, s, body));
      case 'session/complete':
        return await withSession(sb, req, (s) => completeSession(sb, s, body));
      default:
        return fail(404, 'unknown_action');
    }
  } catch (e) {
    log(req.action, (e as Error).message);
    return fail(500, 'server_error');
  }
}

/**
 * Health: configuration plus a real round trip to the research tables (a head-only count, so nothing
 * is returned). Says only whether the database is reachable, never any data or error detail.
 */
async function health(env: ResearchEnv): Promise<ResearchResponse> {
  const sb = db(env);
  if (!sb) return { status: 503, body: { ok: false, configured: false, database: 'not_configured' } };
  const started = Date.now();
  const { error } = await sb.from('research_studies').select('id', { count: 'exact', head: true });
  if (error) {
    log('health', error.code ?? error.message);
    return { status: 503, body: { ok: false, configured: true, database: 'unreachable' } };
  }
  return ok({ ok: true, configured: true, database: 'reachable', latencyMs: Date.now() - started });
}

/**
 * The active study a participant can join (participant-facing information only: title, description,
 * task count). Newest active study of the requested participant type.
 */
async function activeStudy(env: ResearchEnv, type?: string): Promise<ResearchResponse> {
  const sb = db(env);
  if (!sb) return fail(503, 'research_backend_not_configured');
  const participantType = ['individual_creative', 'production_house'].includes(type ?? '') ? type! : 'individual_creative';
  const { data, error } = await sb
    .from('research_studies')
    .select('id, slug, title, description, participant_type, research_tasks(count)')
    .eq('status', 'active')
    .eq('participant_type', participantType)
    .order('started_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`active study: ${error.message}`);
  if (!data) return fail(404, 'no_active_study');
  const count = (data.research_tasks as unknown as { count: number }[] | null)?.[0]?.count ?? 0;
  return ok({ ok: true, study: { slug: data.slug, title: data.title, description: data.description, participantType: data.participant_type, taskCount: count } });
}

async function withSession(sb: SupabaseClient, req: ResearchRequest, fn: (s: SessionRow) => Promise<ResearchResponse>) {
  const s = await sessionFromToken(sb, req.headers);
  if (!s) return fail(401, 'invalid_session');
  // A finished session takes no more writes, except a repeated completion (idempotent).
  if (s.status !== 'active' && req.action !== 'session/complete') return fail(409, 'session_closed');
  return fn(s);
}

// ------------------------------------------------------------------------------------------- session
async function startSession(sb: SupabaseClient, b: Record<string, unknown>): Promise<ResearchResponse> {
  const slug = sanitizeToken(b.studySlug, 80);
  const clientStartId = b.clientStartId;
  const version = shortText(b.prototypeVersion, 60);
  if (!slug || !isUuid(clientStartId) || !version) return fail(400, 'invalid_request');
  if (b.consent !== true) return fail(400, 'consent_required');

  const { data: study, error: studyError } = await sb.from('research_studies').select('id, slug, title, status').eq('slug', slug).maybeSingle();
  if (studyError) throw new Error(`study lookup: ${studyError.message}`);
  if (!study || study.status !== 'active') return fail(404, 'study_not_available');

  // Repeated start (retry after a lost response): the token cannot be re-issued, so say so.
  const { data: existing } = await sb.from('research_sessions').select('id').eq('client_start_id', clientStartId).maybeSingle();
  if (existing) return fail(409, 'session_already_started');

  const p = (b.participant && typeof b.participant === 'object' ? b.participant : {}) as Record<string, unknown>;
  const code = sanitizeToken(b.participantCode, 32);
  let participant: { id: string; participant_code: string } | null = null;
  if (code) {
    const { data } = await sb.from('research_participants').select('id, participant_code').eq('participant_code', code).maybeSingle();
    participant = data;
  }
  if (!participant) {
    const row: Record<string, unknown> = {
      display_name: shortText(p.displayName, 80),
      participant_type: ['individual_creative', 'production_house', 'other'].includes(p.participantType as string) ? p.participantType : null,
      primary_craft: shortText(p.primaryCraft, 60),
      experience_level: shortText(p.experienceLevel, 40),
      consented_at: new Date().toISOString(),
    };
    if (code) row.participant_code = code;
    const { data, error } = await sb.from('research_participants').insert(row).select('id, participant_code').single();
    if (error || !data) return log('participant', error?.message), fail(500, 'server_error');
    participant = data;
  }

  const c = (b.client && typeof b.client === 'object' ? b.client : {}) as Record<string, unknown>;
  const token = randomBytes(32).toString('base64url');
  const { error } = await sb.from('research_sessions').insert({
    study_id: study.id,
    participant_id: participant.id,
    token_hash: hashToken(token),
    client_start_id: clientStartId,
    prototype_version: version,
    selected_persona: sanitizeToken(b.persona, 80),
    device_type: ['phone', 'tablet', 'desktop'].includes(c.deviceType as string) ? c.deviceType : 'unknown',
    viewport_width: int(c.viewportWidth, 0, 10000),
    viewport_height: int(c.viewportHeight, 0, 10000),
    client_info: { browser: shortText(c.browser, 40), os: shortText(c.os, 40), touch: c.touch === true },
  });
  if (error) {
    if (error.code === '23505') return fail(409, 'session_already_started');
    return log('session', error.message), fail(500, 'server_error');
  }
  const { data: tasks } = await sb.from('research_tasks').select('key, sequence, title, instruction, success_events, success_object_type').eq('study_id', study.id).eq('is_active', true).order('sequence');
  // Participant-facing data only: the study title, its task instructions and the semantic events that
  // count as success (so Test Mode can notice success). Never ids or other sessions.
  return ok({
    ok: true,
    token,
    participantCode: participant.participant_code,
    study: { slug: study.slug, title: study.title },
    tasks: (tasks ?? []).map((t) => ({ key: t.key, sequence: t.sequence, title: t.title, instruction: t.instruction, successEvents: t.success_events, successObjectType: t.success_object_type })),
  });
}

async function completeSession(sb: SupabaseClient, s: SessionRow, b: Record<string, unknown>) {
  if (s.status !== 'active') return ok({ ok: true, alreadyCompleted: true });
  const status = b.status === 'abandoned' ? 'abandoned' : 'completed';
  await sb.from('research_task_attempts').update({ outcome: 'abandoned', completed_at: new Date().toISOString() }).eq('session_id', s.id).eq('outcome', 'in_progress');
  const { error } = await sb.from('research_sessions').update({ status, completed_at: new Date().toISOString() }).eq('id', s.id).eq('status', 'active');
  if (error) return log('session/complete', error.message), fail(500, 'server_error');
  return ok();
}

// --------------------------------------------------------------------------------------------- tasks
async function attemptByClientId(sb: SupabaseClient, sessionId: string, clientAttemptId: string) {
  const { data, error } = await sb
    .from('research_task_attempts')
    .select('id, task_id, started_at, outcome, research_tasks(success_events, success_object_type, success_object_id)')
    .eq('session_id', sessionId)
    .eq('client_attempt_id', clientAttemptId)
    .maybeSingle();
  if (error) throw new Error(`attempt lookup: ${error.message}`);
  return data as null | { id: string; task_id: string; started_at: string; outcome: string; research_tasks: { success_events: string[]; success_object_type: string | null; success_object_id: string | null } | null };
}

async function startTask(sb: SupabaseClient, s: SessionRow, b: Record<string, unknown>) {
  const key = sanitizeToken(b.taskKey, 60);
  if (!key || !isUuid(b.attemptId)) return fail(400, 'invalid_request');
  const { data: task } = await sb.from('research_tasks').select('id').eq('study_id', s.study_id).eq('key', key).eq('is_active', true).maybeSingle();
  if (!task) return fail(404, 'task_not_found');
  const { error } = await sb.from('research_task_attempts').insert({ session_id: s.id, task_id: task.id, client_attempt_id: b.attemptId, started_at: isoOrNull(b.startedAt) ?? new Date().toISOString() });
  if (error) {
    if (error.code !== '23505') return log('task/start', error.message), fail(500, 'server_error');
    // Same attempt again (retry), or the task already has an open attempt (remount): reuse it.
    const { data: open } = await sb.from('research_task_attempts').select('client_attempt_id').eq('session_id', s.id).eq('task_id', task.id).eq('outcome', 'in_progress').maybeSingle();
    return ok({ ok: true, attemptId: open?.client_attempt_id ?? b.attemptId, reused: true });
  }
  return ok({ ok: true, attemptId: b.attemptId });
}

async function completeTask(sb: SupabaseClient, s: SessionRow, b: Record<string, unknown>) {
  if (!isUuid(b.attemptId) || !ATTEMPT_OUTCOMES.includes(b.outcome as never)) return fail(400, 'invalid_request');
  const attempt = await attemptByClientId(sb, s.id, b.attemptId);
  // Not found yet can mean the task/start is still queued behind a retry: let the client retry.
  if (!attempt) return fail(503, 'attempt_not_found');
  if (attempt.outcome !== 'in_progress') return ok({ ok: true, alreadyCompleted: true });
  const now = new Date();
  const { error } = await sb
    .from('research_task_attempts')
    .update({
      outcome: b.outcome,
      completed_at: now.toISOString(),
      duration_ms: Math.max(0, now.getTime() - Date.parse(attempt.started_at)),
      difficulty_rating: int(b.difficulty, 1, 5),
      expectation_match: int(b.expectationMatch, 1, 5),
      // Study answers are the one place a participant's words are stored, because the study asks for them.
      feedback_text: shortText(b.feedbackText, 2000),
    })
    .eq('id', attempt.id)
    .eq('outcome', 'in_progress');
  if (error) return log('task/complete', error.message), fail(500, 'server_error');
  return ok();
}

// -------------------------------------------------------------------------------------------- events
type InEvent = { id?: unknown; seq?: unknown; name?: unknown; screen?: unknown; objectType?: unknown; objectId?: unknown; metadata?: unknown; ts?: unknown; attemptId?: unknown };
async function recordEvents(sb: SupabaseClient, s: SessionRow, b: Record<string, unknown>) {
  const list = Array.isArray(b.events) ? (b.events as InEvent[]).slice(0, 50) : [];
  if (!list.length) return fail(400, 'invalid_request');
  const attempts = new Map<string, Awaited<ReturnType<typeof attemptByClientId>>>();
  const rows = [];
  let dropped = 0;
  for (const e of list) {
    const name = typeof e.name === 'string' ? e.name : '';
    const seq = int(e.seq, 1, 10_000_000);
    if (!isUuid(e.id) || !seq || !isResearchEventName(name)) {
      dropped++;
      continue;
    }
    let attemptRowId: string | null = null;
    if (isUuid(e.attemptId)) {
      if (!attempts.has(e.attemptId)) attempts.set(e.attemptId, await attemptByClientId(sb, s.id, e.attemptId));
      attemptRowId = attempts.get(e.attemptId)?.id ?? null;
    }
    const objectType = RESEARCH_OBJECT_TYPES.includes(e.objectType as never) ? (e.objectType as string) : null;
    rows.push({
      session_id: s.id,
      task_attempt_id: attemptRowId,
      client_event_id: e.id,
      sequence: seq,
      event_name: name,
      screen: sanitizeToken(e.screen, 80),
      object_type: objectType,
      object_id: objectType ? sanitizeToken(e.objectId, 120) : null,
      metadata: sanitizeMetadata(e.metadata),
      client_ts: isoOrNull(e.ts),
    });
  }
  if (rows.length) {
    const { error } = await sb.from('research_events').upsert(rows, { onConflict: 'session_id,client_event_id', ignoreDuplicates: true });
    if (error) return log('event', error.message), fail(500, 'server_error');
  }
  // Success detection: an attempt whose task lists this event (and object type, if set) has succeeded.
  for (const r of rows) {
    if (!r.task_attempt_id) continue;
    const a = [...attempts.values()].find((x) => x?.id === r.task_attempt_id);
    const t = a?.research_tasks;
    if (!a || a.outcome !== 'in_progress' || !t?.success_events.includes(r.event_name)) continue;
    if (t.success_object_type && t.success_object_type !== r.object_type) continue;
    if (t.success_object_id && t.success_object_id !== r.object_id) continue;
    await sb.from('research_task_attempts').update({ success_detected: true }).eq('id', a.id).eq('success_detected', false);
  }
  return ok({ ok: true, stored: rows.length, dropped });
}

// ------------------------------------------------------------------------------------------ feedback
async function submitFeedback(sb: SupabaseClient, s: SessionRow, b: Record<string, unknown>) {
  if (!isUuid(b.id) || !FEEDBACK_CATEGORIES.includes(b.category as never)) return fail(400, 'invalid_request');
  const attempt = isUuid(b.attemptId) ? await attemptByClientId(sb, s.id, b.attemptId) : null;
  let eventRowId: string | null = null;
  if (isUuid(b.eventId)) {
    const { data } = await sb.from('research_events').select('id').eq('session_id', s.id).eq('client_event_id', b.eventId).maybeSingle();
    eventRowId = data?.id ?? null;
  }
  const ctx = (b.context && typeof b.context === 'object' ? b.context : {}) as Record<string, unknown>;
  const { error } = await sb.from('research_feedback').upsert(
    {
      session_id: s.id,
      task_attempt_id: attempt?.id ?? null,
      event_id: eventRowId,
      client_feedback_id: b.id,
      category: b.category,
      screen: sanitizeToken(b.screen, 80),
      participant_comment: shortText(b.comment, 2000),
      prototype_version: s.prototype_version, // from the session, never from the request
      persona: sanitizeToken(ctx.persona, 80) ?? s.selected_persona,
      trail_until_sequence: int(ctx.lastSequence, 0, 10_000_000),
      // source: 'button' (Feedback control), 'stuck' (I'm stuck), 'survey' (final survey, with question / rating).
      interaction_context: sanitizeMetadata({ taskKey: ctx.taskKey, route: ctx.route, sheet: ctx.sheet, acting: ctx.acting, tab: ctx.tab, source: ctx.source, question: ctx.question, rating: typeof ctx.rating === 'number' ? ctx.rating : undefined }),
    },
    { onConflict: 'session_id,client_feedback_id', ignoreDuplicates: true },
  );
  if (error) return log('feedback', error.message), fail(500, 'server_error');
  return ok();
}

// ------------------------------------------------------------------------------- research dashboard
/**
 * Read API for /research (internal prototype dashboard). Runs only here, on the server, with the
 * service role; the browser never holds a Supabase key. Returns only the columns the dashboard shows:
 * never token hashes, client idempotency ids or other internals.
 *
 *   GET  dashboard/studies                         all studies
 *   GET  dashboard/study?id=<studyId>              tasks, sessions (+participant), attempts, feedback
 *   GET  dashboard/events?session=<id>[&until=<n>] one session's events (optionally up to a sequence)
 *   GET  dashboard/events?attempts=<id,id,...>     events for a set of task attempts
 *   POST dashboard/feedback-status {id, status}    researcher review status
 *
 * Open by default (internal prototype; the deployment may add Vercel protection). If
 * RESEARCH_DASHBOARD_KEY is set, every call must send it as x-research-dashboard-key.
 */
const SESSION_COLS = 'id, status, prototype_version, selected_persona, device_type, viewport_width, viewport_height, started_at, completed_at, research_participants(participant_code, display_name, primary_craft, experience_level, participant_type)';
const ATTEMPT_COLS = 'id, session_id, task_id, outcome, success_detected, difficulty_rating, expectation_match, feedback_text, duration_ms, started_at, completed_at';
const FEEDBACK_COLS = 'id, session_id, task_attempt_id, category, screen, participant_comment, prototype_version, persona, trail_until_sequence, interaction_context, status, researcher_note, created_at';
const EVENT_COLS = 'sequence, event_name, screen, object_type, object_id, metadata, task_attempt_id, created_at';
const FEEDBACK_STATUSES = ['new', 'reviewed', 'actionable', 'fixed', 'wont_fix'];

async function dashboard(req: ResearchRequest, env: ResearchEnv): Promise<ResearchResponse> {
  const key = env.RESEARCH_DASHBOARD_KEY;
  if (key) {
    const given = Buffer.from(req.headers['x-research-dashboard-key'] ?? '');
    const want = Buffer.from(key);
    if (given.length !== want.length || !timingSafeEqual(given, want)) return fail(401, 'dashboard_key_required');
  }
  const sb = db(env);
  if (!sb) return fail(503, 'research_backend_not_configured');
  const q = req.query ?? {};
  const action = req.action.slice('dashboard/'.length);

  if (action === 'feedback-status') {
    if (req.method !== 'POST') return fail(405, 'method_not_allowed');
    const b = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    if (!isUuid(b.id) || !FEEDBACK_STATUSES.includes(b.status as string)) return fail(400, 'invalid_request');
    const { error } = await sb.from('research_feedback').update({ status: b.status }).eq('id', b.id);
    if (error) throw new Error(error.message);
    return ok();
  }
  if (req.method !== 'GET') return fail(405, 'method_not_allowed');

  if (action === 'studies') {
    const { data, error } = await sb.from('research_studies').select('id, slug, title, status, participant_type, prototype_version').order('created_at');
    if (error) throw new Error(error.message);
    return ok({ studies: data });
  }
  if (action === 'study') {
    if (!isUuid(q.id)) return fail(400, 'invalid_request');
    const [tasks, sessions] = await Promise.all([
      sb.from('research_tasks').select('id, key, sequence, title, instruction, success_events').eq('study_id', q.id).order('sequence'),
      sb.from('research_sessions').select(SESSION_COLS).eq('study_id', q.id).order('started_at', { ascending: false }),
    ]);
    if (tasks.error || sessions.error) throw new Error((tasks.error ?? sessions.error)!.message);
    const ids = (sessions.data ?? []).map((x) => x.id as string);
    const [attempts, feedback] = ids.length
      ? await Promise.all([
          sb.from('research_task_attempts').select(ATTEMPT_COLS).in('session_id', ids),
          sb.from('research_feedback').select(FEEDBACK_COLS).in('session_id', ids).order('created_at', { ascending: false }),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];
    if (attempts.error || feedback.error) throw new Error((attempts.error ?? feedback.error)!.message);
    return ok({ tasks: tasks.data, sessions: sessions.data, attempts: attempts.data, feedback: feedback.data });
  }
  if (action === 'events') {
    let query = sb.from('research_events').select(EVENT_COLS).order('sequence');
    if (isUuid(q.session)) {
      query = query.eq('session_id', q.session);
      const until = Number(q.until);
      if (q.until !== undefined && Number.isInteger(until)) query = query.lte('sequence', until);
    } else if (q.attempts) {
      const list = q.attempts.split(',').filter(isUuid).slice(0, 200);
      if (!list.length) return ok({ events: [] });
      query = query.in('task_attempt_id', list);
    } else return fail(400, 'invalid_request');
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ok({ events: data });
  }
  return fail(404, 'unknown_action');
}

// ------------------------------------------------------------------------------- development inspection
async function debug(req: ResearchRequest, env: ResearchEnv): Promise<ResearchResponse> {
  const expected = env.RESEARCH_DEBUG_KEY;
  if (!expected || expected.length < 16) return fail(404, 'not_found'); // disabled unless configured
  if (req.action === 'debug/page') return { status: 200, body: DEBUG_PAGE, contentType: 'text/html; charset=utf-8' };
  const given = req.headers['x-research-debug-key'] ?? '';
  const a = Buffer.from(given);
  const e = Buffer.from(expected);
  if (a.length !== e.length || !timingSafeEqual(a, e)) return fail(401, 'unauthorized');
  const sb = db(env);
  if (!sb) return fail(503, 'research_backend_not_configured');
  const { data: sessions } = await sb
    .from('research_sessions')
    .select('id, status, prototype_version, selected_persona, device_type, viewport_width, viewport_height, started_at, completed_at, research_studies(slug), research_participants(participant_code)')
    .order('started_at', { ascending: false })
    .limit(10);
  const latest = sessions?.[0]?.id;
  const [attempts, events, feedback] = latest
    ? await Promise.all([
        sb.from('research_task_attempts').select('id, outcome, success_detected, difficulty_rating, expectation_match, duration_ms, started_at, completed_at, research_tasks(key, sequence)').eq('session_id', latest).order('started_at'),
        sb.from('research_events').select('sequence, event_name, screen, object_type, object_id, metadata, task_attempt_id, created_at').eq('session_id', latest).order('sequence'),
        sb.from('research_feedback').select('category, screen, participant_comment, prototype_version, persona, trail_until_sequence, interaction_context, status, created_at, task_attempt_id').eq('session_id', latest).order('created_at'),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  return ok({ sessions, latest: { attempts: attempts.data, events: events.data, feedback: feedback.data } });
}

const DEBUG_PAGE = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Research debug</title>
<meta name="robots" content="noindex"><style>body{font:13px/1.4 system-ui;margin:16px;max-width:1100px}pre{background:#f4f4f2;padding:10px;overflow:auto;font-size:12px}input,button{font:inherit;padding:6px}</style>
<h1>Research debug (internal, development only)</h1><p>Not the research dashboard. Enter the RESEARCH_DEBUG_KEY from your server environment.</p>
<form id=f><input id=k type=password placeholder="debug key" autocomplete=off size=40> <button>Load latest</button></form><pre id=o>Nothing loaded.</pre>
<script>f.onsubmit=async e=>{e.preventDefault();const r=await fetch('../debug',{headers:{'x-research-debug-key':k.value}});o.textContent=JSON.stringify(await r.json(),null,2)}</script>`;
