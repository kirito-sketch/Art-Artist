#!/usr/bin/env node
/**
 * Research data foundation: end-to-end check.
 *
 * Runs one complete participant session through the research API (exactly what the browser client
 * sends), then reads the stored rows back with the service role and checks every relationship.
 * Also checks idempotency, token isolation and that the anon key cannot read research tables.
 *
 * Usage (with `npm run dev` running in another terminal):
 *   npm run research:e2e
 * Reads SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and (optional) VITE_SUPABASE_ANON_KEY from the
 * environment or .env.local / .env. Never prints key values.
 * Options: RESEARCH_API=http://localhost:5173/api/research  RESEARCH_STUDY=ana-individual-creative-v29
 */
import { readFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

for (const f of ['.env.local', '.env']) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const API = (process.env.RESEARCH_API || 'http://localhost:5173/api/research').replace(/\/$/, '');
const STUDY = process.env.RESEARCH_STUDY || 'ana-individual-creative-v29';
const VERSION = 'V29 (2026-10-01)';
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};
const post = async (path, body, token) => {
  const r = await fetch(`${API}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  let json = null;
  try {
    json = await r.json();
  } catch {
    /* non-JSON */
  }
  return { status: r.status, json };
};

const health = await fetch(`${API}/health`).then((r) => r.json()).catch(() => null);
check('Research API reachable and configured', health?.configured, health ? '' : `no response from ${API}`);
if (!health?.configured) process.exit(1);

// 1-4. Start a session: participant created, study attached, version stored.
const start = await post('session', {
  studySlug: STUDY,
  consent: true,
  persona: 'kiran',
  prototypeVersion: VERSION,
  clientStartId: randomUUID(),
  participant: { participantType: 'individual_creative', primaryCraft: 'Cinematography', experienceLevel: '5-10 years' },
  client: { deviceType: 'phone', viewportWidth: 390, viewportHeight: 844, browser: 'Chrome', os: 'iOS', touch: true },
});
check('1. Session started', start.status === 200 && start.json?.token, `HTTP ${start.status}`);
const token = start.json.token;
check('   Response has no database ids', !JSON.stringify(start.json).match(/"(id|session_id|study_id|participant_id)"/));
check('   Study tasks returned for the participant', start.json.tasks?.length >= 5, `${start.json.tasks?.length} tasks`);
const noConsent = await post('session', { studySlug: STUDY, prototypeVersion: VERSION, clientStartId: randomUUID() });
check('   Session refused without consent', noConsent.status === 400);

// 5. Task starts (and a duplicate start reuses the open attempt).
const attemptId = randomUUID();
const t1 = await post('task/start', { taskKey: 'show-interest-role', attemptId }, token);
const t1b = await post('task/start', { taskKey: 'show-interest-role', attemptId: randomUUID() }, token);
check('5. Task started', t1.status === 200 && t1.json.attemptId === attemptId);
check('   Duplicate start reuses the open attempt', t1b.json?.attemptId === attemptId && t1b.json?.reused);

// 6. Semantic events (one retried batch, one unknown name, one unsafe metadata key).
let seq = 0;
const ev = (name, extra = {}) => ({ id: randomUUID(), seq: ++seq, name, ts: new Date().toISOString(), attemptId, ...extra });
const events = [
  ev('task_started', { objectType: 'task', objectId: 'show-interest-role', screen: 'home' }),
  ev('home_viewed', { screen: 'home' }),
  ev('discover_opened', { screen: 'discover' }),
  ev('discover_tab_selected', { screen: 'discover', metadata: { tab: 'roles', note: 'should be dropped' } }),
  ev('role_opened', { screen: 'role', objectType: 'role', objectId: 'o1' }),
  ev('navigated_back', { screen: 'discover', metadata: { from: 'role' } }),
  ev('role_opened', { screen: 'role', objectType: 'role', objectId: 'o2' }),
  ev('interest_sent', { screen: 'role', objectType: 'role', objectId: 'o2' }),
  ev('button_14_clicked', { screen: 'role' }),
];
const e1 = await post('event', { events }, token);
const e2 = await post('event', { events }, token); // network retry of the same batch
check('6. Events stored', e1.status === 200 && e1.json.stored === 8, `stored ${e1.json?.stored}, dropped ${e1.json?.dropped}`);
check('   Unknown event name dropped', e1.json?.dropped === 1);
check('   Retried batch did not duplicate', e2.status === 200);

// 7-8. Task completes with ratings (a second completion is ignored).
const c1 = await post('task/complete', { attemptId, outcome: 'completed_with_difficulty', difficulty: 4, expectationMatch: 3, feedbackText: 'Took a while to find the right role.' }, token);
const c2 = await post('task/complete', { attemptId, outcome: 'abandoned', difficulty: 1 }, token);
check('7. Task completed', c1.status === 200);
check('   Second completion ignored', c2.json?.alreadyCompleted === true);

// 9. Feedback (submitted twice: stored once).
const fid = randomUUID();
const fb = { id: fid, category: 'confusing', comment: 'Not sure which button shows interest.', screen: 'role', attemptId, eventId: events[4].id, context: { persona: 'kiran', route: 'role', taskKey: 'show-interest-role', lastSequence: seq, tab: 'discover' } };
const f1 = await post('feedback', fb, token);
const f2 = await post('feedback', fb, token);
check('9. Feedback submitted', f1.status === 200 && f2.status === 200);

// Security: a bad token cannot write; there is no read endpoint.
const bad = await post('event', { events: [ev('home_viewed')] }, 'x'.repeat(43));
check('   Invalid token rejected', bad.status === 401);
const read = await fetch(`${API}/session`).then((r) => r.status);
check('   No read access through the API (GET)', read === 405);
const dbg = await fetch(`${API}/debug`).then((r) => r.status);
check('   Debug data needs the debug key', dbg === 401 || dbg === 404, `HTTP ${dbg}`);

// 10. Session completes (twice: idempotent), then refuses new events.
const s1 = await post('session/complete', {}, token);
const s2 = await post('session/complete', {}, token);
const late = await post('event', { events: [ev('home_viewed')] }, token);
check('10. Session completed', s1.status === 200 && s2.json?.alreadyCompleted === true);
check('    Closed session accepts no more events', late.status === 409);

// Inspect what Supabase stored.
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\nSkipping database inspection: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
} else {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: session } = await sb
    .from('research_sessions')
    .select('id, status, prototype_version, selected_persona, device_type, viewport_width, completed_at, research_studies(slug), research_participants(participant_code, primary_craft, display_name)')
    .eq('participant_id', (await sb.from('research_participants').select('id').eq('participant_code', start.json.participantCode).single()).data.id)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();
  check('DB: session linked to study', session?.research_studies?.slug === STUDY);
  check('DB: session linked to participant', session?.research_participants?.participant_code === start.json.participantCode, start.json.participantCode);
  check('DB: participant has no name or email', session?.research_participants?.display_name === null);
  check('DB: prototype version recorded', session?.prototype_version === VERSION, session?.prototype_version);
  check('DB: session completed with timestamp', session?.status === 'completed' && !!session?.completed_at);
  const { data: attempts } = await sb.from('research_task_attempts').select('id, outcome, success_detected, difficulty_rating, expectation_match, duration_ms, feedback_text, research_tasks(key)').eq('session_id', session.id);
  const a = attempts?.[0];
  check('DB: exactly one attempt (no duplicates)', attempts?.length === 1);
  check('DB: attempt linked to task', a?.research_tasks?.key === 'show-interest-role');
  check('DB: outcome and ratings saved', a?.outcome === 'completed_with_difficulty' && a?.difficulty_rating === 4 && a?.expectation_match === 3);
  check('DB: success detected from interest_sent', a?.success_detected === true);
  check('DB: duration computed', typeof a?.duration_ms === 'number' && a.duration_ms >= 0, `${a?.duration_ms} ms`);
  const { data: evs } = await sb.from('research_events').select('id, sequence, event_name, screen, object_id, metadata, task_attempt_id').eq('session_id', session.id).order('sequence');
  check('DB: events stored once each (retry and unknown name excluded)', evs?.length === 8, `${evs?.length} events`);
  check('DB: events in strict sequence', evs?.every((e, i) => i === 0 || e.sequence > evs[i - 1].sequence));
  check('DB: events linked to the attempt', evs?.filter((e) => e.task_attempt_id === a?.id).length >= 8);
  check('DB: unsafe metadata key removed', evs?.find((e) => e.event_name === 'discover_tab_selected')?.metadata?.note === undefined);
  const { data: fbs } = await sb.from('research_feedback').select('id, category, screen, prototype_version, persona, trail_until_sequence, task_attempt_id, event_id, status, interaction_context').eq('session_id', session.id);
  const f = fbs?.[0];
  check('DB: feedback stored once', fbs?.length === 1);
  check('DB: feedback carries version, screen, persona, task', f?.prototype_version === VERSION && f?.screen === 'role' && f?.persona === 'kiran' && f?.task_attempt_id === a?.id);
  check('DB: feedback starts as researcher status "new"', f?.status === 'new');
  const trail = evs?.filter((e) => e.sequence <= f?.trail_until_sequence).map((e) => e.screen);
  check('DB: interaction trail derivable from events', trail?.length === 8, trail?.join(' > '));
  console.log('\nStored session (ids shortened):');
  console.log(
    JSON.stringify(
      {
        session: { ...session, id: session.id.slice(0, 8) },
        attempt: { ...a, id: a.id.slice(0, 8) },
        events: evs.map((e) => `${e.sequence}. ${e.event_name}${e.object_id ? ` [${e.object_id}]` : ''} @${e.screen ?? '-'}`),
        feedback: { ...f, id: f.id.slice(0, 8), task_attempt_id: f.task_attempt_id?.slice(0, 8), event_id: f.event_id?.slice(0, 8) },
      },
      null,
      1,
    ),
  );
  if (ANON) {
    const anon = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false } });
    for (const t of ['research_sessions', 'research_events', 'research_feedback', 'research_participants']) {
      const { data, error } = await anon.from(t).select('*').limit(1);
      check(`Anon key cannot read ${t}`, !!error || (data ?? []).length === 0, error?.code ?? 'no rows');
    }
    const { error: insErr } = await anon.from('research_events').insert({ session_id: session.id, client_event_id: randomUUID(), sequence: 999, event_name: 'home_viewed' });
    check('Anon key cannot write research_events', !!insErr, insErr?.code);
  } else console.log('\n(Set VITE_SUPABASE_ANON_KEY to also check that the anon key is locked out.)');
}

const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
