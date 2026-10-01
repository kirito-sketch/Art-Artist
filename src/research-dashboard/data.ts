/**
 * Dashboard data access. The browser uses the public anon/publishable key plus the researcher's own
 * Supabase Auth session. Row Level Security decides what comes back: only users listed in
 * research_researchers can read research tables (docs/RESEARCH_DASHBOARD.md). No service key here.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { EventRow } from './labels';

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const configured = !!(URL_ && ANON);
export const sb: SupabaseClient | null = configured ? createClient(URL_!, ANON!, { auth: { persistSession: true, storageKey: 'ana-research-dashboard', autoRefreshToken: true } }) : null;

export type Study = { id: string; slug: string; title: string; status: string; participant_type: string | null; prototype_version: string | null };
export type Task = { id: string; key: string; sequence: number; title: string; instruction: string; success_events: string[] };
export type Participant = { participant_code: string; display_name: string | null; primary_craft: string | null; experience_level: string | null; participant_type: string | null };
export type Session = { id: string; status: string; prototype_version: string; selected_persona: string | null; device_type: string | null; viewport_width: number | null; viewport_height: number | null; started_at: string; completed_at: string | null; research_participants: Participant };
export type Attempt = { id: string; session_id: string; task_id: string; outcome: string; success_detected: boolean; difficulty_rating: number | null; expectation_match: number | null; feedback_text: string | null; duration_ms: number | null; started_at: string; completed_at: string | null };
export type Feedback = { id: string; session_id: string; task_attempt_id: string | null; category: string; screen: string | null; participant_comment: string | null; prototype_version: string; persona: string | null; trail_until_sequence: number | null; interaction_context: Record<string, unknown> | null; status: string; researcher_note: string | null; created_at: string };
export type StudyData = { tasks: Task[]; sessions: Session[]; attempts: Attempt[]; feedback: Feedback[] };

const need = () => {
  if (!sb) throw new Error('not_configured');
  return sb;
};

/**
 * Dashboard access, decided by RLS on an ordinary research table (no RPC: the allowlist helper lives in
 * a private schema and research_researchers is intentionally unreadable from the browser).
 * Researchers can read research_studies; anyone else gets zero rows. A query error is reported as such,
 * not as "no access".
 */
export async function researcherAccess(): Promise<'researcher' | 'denied' | 'error'> {
  const { data, error } = await need().from('research_studies').select('id').limit(1);
  if (error) return 'error';
  return data && data.length > 0 ? 'researcher' : 'denied';
}

export async function loadStudies(): Promise<Study[]> {
  const { data, error } = await need().from('research_studies').select('id, slug, title, status, participant_type, prototype_version').order('created_at');
  if (error) throw error;
  return data as Study[];
}

/** Everything a study's views need, in four queries. Events load per session or feedback item. */
export async function loadStudy(studyId: string): Promise<StudyData> {
  const c = need();
  const [tasks, sessions, attempts, feedback] = await Promise.all([
    c.from('research_tasks').select('id, key, sequence, title, instruction, success_events').eq('study_id', studyId).order('sequence'),
    c
      .from('research_sessions')
      .select('id, status, prototype_version, selected_persona, device_type, viewport_width, viewport_height, started_at, completed_at, research_participants(participant_code, display_name, primary_craft, experience_level, participant_type)')
      .eq('study_id', studyId)
      .order('started_at', { ascending: false }),
    c.from('research_task_attempts').select('id, session_id, task_id, outcome, success_detected, difficulty_rating, expectation_match, feedback_text, duration_ms, started_at, completed_at, research_sessions!inner(study_id)').eq('research_sessions.study_id', studyId),
    c.from('research_feedback').select('id, session_id, task_attempt_id, category, screen, participant_comment, prototype_version, persona, trail_until_sequence, interaction_context, status, researcher_note, created_at, research_sessions!inner(study_id)').eq('research_sessions.study_id', studyId).order('created_at', { ascending: false }),
  ]);
  for (const r of [tasks, sessions, attempts, feedback]) if (r.error) throw r.error;
  return { tasks: tasks.data as Task[], sessions: sessions.data as unknown as Session[], attempts: attempts.data as unknown as Attempt[], feedback: feedback.data as unknown as Feedback[] };
}

export async function loadEvents(sessionId: string, untilSequence?: number): Promise<EventRow[]> {
  let q = need().from('research_events').select('sequence, event_name, screen, object_type, object_id, metadata, task_attempt_id, created_at').eq('session_id', sessionId).order('sequence');
  if (untilSequence != null) q = q.lte('sequence', untilSequence);
  const { data, error } = await q;
  if (error) throw error;
  return data as EventRow[];
}

export async function loadEventsForAttempts(attemptIds: string[]): Promise<EventRow[]> {
  if (!attemptIds.length) return [];
  const { data, error } = await need().from('research_events').select('sequence, event_name, screen, object_type, object_id, metadata, task_attempt_id, created_at').in('task_attempt_id', attemptIds).order('sequence');
  if (error) throw error;
  return data as EventRow[];
}

/** Researcher review status (RLS allows researchers to update only status and researcher_note). */
export async function setFeedbackStatus(id: string, status: string) {
  const { error } = await need().from('research_feedback').update({ status }).eq('id', id);
  if (error) throw error;
}

/** Survey answers are feedback rows tagged source = survey; everything else is participant feedback. */
export const isSurvey = (f: Feedback) => f.interaction_context?.source === 'survey';
