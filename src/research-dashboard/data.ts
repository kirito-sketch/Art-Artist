/**
 * Dashboard data access. Everything goes through the server-side read API (/api/research/dashboard/*),
 * which queries Supabase with the server-only service role. The browser holds no Supabase client and
 * no Supabase key. docs/RESEARCH_DASHBOARD.md.
 */
import type { EventRow } from './labels';
import { brand } from '../research-data/brand';

const API = ((import.meta.env.VITE_RESEARCH_API_BASE as string | undefined) || '/api/research').replace(/\/$/, '') + '/dashboard';

export type Study = { id: string; slug: string; title: string; status: string; participant_type: string | null; prototype_version: string | null };
export type Task = { id: string; key: string; sequence: number; title: string; instruction: string; success_events: string[]; created_at?: string };
export type Participant = { participant_code: string; display_name: string | null; primary_craft: string | null; experience_level: string | null; participant_type: string | null };
export type Session = { id: string; status: string; prototype_version: string; selected_persona: string | null; device_type: string | null; viewport_width: number | null; viewport_height: number | null; started_at: string; completed_at: string | null; research_participants: Participant };
export type Attempt = { id: string; session_id: string; task_id: string; outcome: string; success_detected: boolean; difficulty_rating: number | null; expectation_match: number | null; feedback_text: string | null; duration_ms: number | null; started_at: string; completed_at: string | null };
export type Feedback = { id: string; session_id: string; task_attempt_id: string | null; category: string; screen: string | null; participant_comment: string | null; prototype_version: string; persona: string | null; trail_until_sequence: number | null; interaction_context: Record<string, unknown> | null; status: string; researcher_note: string | null; created_at: string };
export type StudyData = { tasks: Task[]; sessions: Session[]; attempts: Attempt[]; feedback: Feedback[] };

/**
 * Optional light protection: if the server sets RESEARCH_DASHBOARD_KEY, open /research?key=<value>
 * once; the key is kept in this browser's localStorage and sent as a header. Unset: no key needed.
 */
const KEY_STORE = 'aa-research-dashboard-key';
function dashboardKey(): string | null {
  try {
    const fromUrl = new URLSearchParams(location.search).get('key');
    if (fromUrl) {
      localStorage.setItem(KEY_STORE, fromUrl);
      const u = new URL(location.href);
      u.searchParams.delete('key');
      history.replaceState(null, '', u.toString());
    }
    return localStorage.getItem(KEY_STORE);
  } catch {
    return null;
  }
}
const KEY = typeof window !== 'undefined' ? dashboardKey() : null;

export class DashboardError extends Error {
  constructor(public status: number) {
    super(`dashboard_${status}`);
  }
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API}/${path}`, { headers: KEY ? { 'x-research-dashboard-key': KEY } : {}, cache: 'no-store' });
  if (!r.ok) throw new DashboardError(r.status);
  return (await r.json()) as T;
}

export async function loadStudies(): Promise<Study[]> {
  const { studies } = await get<{ studies: Study[] }>('studies');
  return studies.map((x) => ({ ...x, title: brand(x.title) }));
}

/** Everything a study's views need, in one call. Events load per session or feedback item. */
export async function loadStudy(studyId: string): Promise<StudyData> {
  const d = await get<StudyData>(`study?id=${encodeURIComponent(studyId)}`);
  return { ...d, tasks: d.tasks.map((t) => ({ ...t, title: brand(t.title), instruction: brand(t.instruction) })) };
}

export async function loadEvents(sessionId: string, untilSequence?: number): Promise<EventRow[]> {
  const q = `session=${encodeURIComponent(sessionId)}${untilSequence != null ? `&until=${untilSequence}` : ''}`;
  return (await get<{ events: EventRow[] }>(`events?${q}`)).events;
}

export async function loadEventsForAttempts(attemptIds: string[]): Promise<EventRow[]> {
  if (!attemptIds.length) return [];
  return (await get<{ events: EventRow[] }>(`events?attempts=${attemptIds.map(encodeURIComponent).join(',')}`)).events;
}

/** Researcher review status. */
export async function setFeedbackStatus(id: string, status: string) {
  const r = await fetch(`${API}/feedback-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(KEY ? { 'x-research-dashboard-key': KEY } : {}) },
    body: JSON.stringify({ id, status }),
  });
  if (!r.ok) throw new DashboardError(r.status);
}

/**
 * Study answers are feedback rows tagged source = survey (final survey) or first_run (the questions after
 * Task 1); everything else is participant feedback.
 */
export const isSurvey = (f: Feedback) => f.interaction_context?.source === 'survey' || f.interaction_context?.source === 'first_run';
export const isFirstRunAnswer = (f: Feedback) => f.interaction_context?.source === 'first_run';
/** Task 1 of the Individual Creative study: the first-run experience. */
export const FIRST_RUN_TASK = 'getting-started';
