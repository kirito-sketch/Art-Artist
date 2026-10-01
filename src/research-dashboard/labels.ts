/**
 * Human-readable research events for the dashboard. Ids are resolved against the prototype's own
 * fixture data (the same build participants used), so "role_opened o-neela-dop" reads as
 * "Opened role: Director of Photography".
 */
import { posts as seedPosts } from '../data/seed';
import { findOpportunity, party } from '../state/selectors';
import { project } from '../state/world';

export type EventRow = { sequence: number; event_name: string; screen: string | null; object_type: string | null; object_id: string | null; metadata: Record<string, unknown> | null; task_attempt_id: string | null; created_at: string };

const SHEET: Record<string, string> = { showInterest: 'Show interest', respond: 'Respond', share: 'Share', more: 'More', report: 'Report', availability: 'Availability', activity: 'Your activity', identity: 'Switch identity', create: 'Create', reviewInterest: 'Interested people', postMore: 'Post options', block: 'Block' };
const TAB: Record<string, string> = { roles: 'Roles', people: 'People', projects: 'Projects', posts: 'Posts' };
const SCREEN: Record<string, string> = { home: 'Home', discover: 'Discover', inbox: 'Messages', own_profile: 'Your profile', person_profile: 'Profile', role: 'Role', project: 'Project', house: 'House', post: 'Post', saved: 'Saved', settings: 'Settings', conversation: 'Conversation', notifications: 'Notifications' };
export const screenLabel = (s: string | null | undefined) => (s ? SCREEN[s] ?? s.replace(/_/g, ' ') : '-');

function objectName(type: string | null, id: string | null): string | null {
  if (!id) return null;
  if (type === 'role') {
    const o = findOpportunity(id);
    return o ? `${o.role} (${o.project})` : id;
  }
  if (type === 'person' || type === 'house') return party(id)?.name ?? id;
  if (type === 'project') {
    const p = project(id) as unknown as { workingTitle?: string; title?: string } | undefined;
    return p?.workingTitle ?? p?.title ?? id;
  }
  if (type === 'post') {
    const p = seedPosts.find((x) => x.id === id);
    return p ? `by ${party(p.authorId)?.name ?? 'someone'}` : id;
  }
  return id;
}

/** One line per event, for the trail. */
export function eventLabel(e: EventRow): string {
  const m = e.metadata ?? {};
  const name = objectName(e.object_type, e.object_id);
  switch (e.event_name) {
    case 'session_started': return 'Started the test';
    case 'session_completed': return m.status === 'abandoned' ? 'Ended the test early' : 'Finished the test';
    case 'task_started': return `Started task: ${e.object_id}`;
    case 'task_completed': return `Finished task (${String(m.outcome ?? '').replace(/_/g, ' ')})`;
    case 'task_skipped': return 'Skipped the task';
    case 'task_instruction_opened': return 'Reopened the task instruction';
    case 'stuck_reported': return "Tapped I'm stuck";
    case 'feedback_opened': return 'Opened feedback';
    case 'feedback_submitted': return `Sent feedback (${String(m.category ?? '').replace(/_/g, ' ')})`;
    case 'survey_submitted': return 'Submitted the final survey';
    case 'home_viewed': return 'Opened Home';
    case 'discover_opened': return 'Opened Discover';
    case 'inbox_opened': return 'Opened Messages';
    case 'own_profile_viewed': return 'Opened their own profile';
    case 'screen_opened': return `Opened ${String(m.route ?? 'a screen')}`;
    case 'navigated_back': return `Back from ${screenLabel(m.from as string)}`;
    case 'sheet_opened': return `Opened ${SHEET[m.sheet as string] ?? String(m.sheet ?? 'a')} sheet`;
    case 'discover_tab_selected': return `Selected ${TAB[m.tab as string] ?? m.tab}`;
    case 'discover_filter_selected': return `Filtered by ${String(m.filter ?? '')}`;
    case 'role_opened': return `Opened role: ${name}`;
    case 'project_opened': return `Opened project: ${name}`;
    case 'person_profile_opened': return `Opened profile: ${name}`;
    case 'house_profile_opened': return `Opened house: ${name}`;
    case 'post_opened': return `Opened post ${name}`;
    case 'conversation_opened': return 'Opened a conversation';
    case 'notifications_opened': return 'Opened notifications';
    case 'saved_opened': return 'Opened Saved';
    case 'settings_opened': return 'Opened Settings';
    case 'role_saved': return `Saved role: ${name}`;
    case 'role_unsaved': return `Unsaved role: ${name}`;
    case 'project_saved': return `Saved project: ${name}`;
    case 'project_unsaved': return `Unsaved project: ${name}`;
    case 'post_saved': return `Saved post ${name}`;
    case 'post_unsaved': return `Unsaved post ${name}`;
    case 'person_followed': return `Followed ${name}`;
    case 'person_unfollowed': return `Unfollowed ${name}`;
    case 'house_followed': return `Followed ${name}`;
    case 'house_unfollowed': return `Unfollowed ${name}`;
    case 'interest_sent': return `Showed interest: ${name}`;
    case 'interest_withdrawn': return `Withdrew interest: ${name}`;
    case 'message_sent': return 'Sent a message';
    case 'credit_accepted': return 'Accepted a credit';
    case 'identity_switched': return `Switched identity (${String(m.from)} to ${String(m.to)})`;
    case 'availability_changed': return m.open ? 'Turned availability on' : 'Turned availability off';
    default: return e.event_name.replace(/_/g, ' ');
  }
}

/** Events that read as steps of a path (navigation and actions), not research bookkeeping. */
const PATH_SKIP = new Set(['session_started', 'session_completed', 'task_started', 'task_completed', 'task_skipped', 'feedback_opened', 'survey_submitted', 'task_instruction_opened']);

/** A short path: "Home → Discover → People → Profile: Vikram Sen". Consecutive repeats collapse. */
export function pathOf(events: EventRow[]): string[] {
  const out: string[] = [];
  for (const e of events) {
    if (PATH_SKIP.has(e.event_name)) continue;
    let step: string;
    const m = e.metadata ?? {};
    if (e.event_name === 'home_viewed') step = 'Home';
    else if (e.event_name === 'discover_opened') step = 'Discover';
    else if (e.event_name === 'inbox_opened') step = 'Messages';
    else if (e.event_name === 'own_profile_viewed') step = 'Your profile';
    else if (e.event_name === 'discover_tab_selected') step = TAB[m.tab as string] ?? String(m.tab);
    else if (e.event_name === 'navigated_back') step = 'Back';
    else if (e.event_name === 'stuck_reported') step = "I'm stuck";
    else if (e.event_name === 'feedback_submitted') step = 'Feedback';
    else {
      const l = eventLabel(e).replace(/^Opened /, '');
      step = l[0].toUpperCase() + l.slice(1);
    }
    if (out[out.length - 1] !== step) out.push(step);
  }
  return out;
}

export const OUTCOME_LABEL: Record<string, string> = { in_progress: 'In progress', completed: 'Completed', completed_with_difficulty: 'Completed with difficulty', abandoned: 'Abandoned', skipped: 'Skipped' };
export const CATEGORY_LABEL: Record<string, string> = { confusing: 'Confusing', couldnt_find: "Couldn't find", visual_issue: 'Visual issue', didnt_work: "Didn't work", suggestion: 'Suggestion', other: 'Other' };
export const STATUS_LABEL: Record<string, string> = { new: 'New', reviewed: 'Reviewed', actionable: 'Actionable', fixed: 'Fixed', wont_fix: "Won't fix" };
export const SURVEY_ORDER = ['overall_ease', 'what_is_ana_for', 'most_confusing', 'would_make_you_use'];
export const SURVEY_LABEL: Record<string, string> = { overall_ease: 'Overall, how easy was Ana to understand? (1 very difficult, 5 very easy)', what_is_ana_for: 'What do you think Ana is for?', most_confusing: 'What was the most confusing part?', would_make_you_use: 'What, if anything, would make you want to use Ana?' };

export const fmtDuration = (ms: number | null | undefined) => {
  if (ms == null) return '-';
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
};
export const fmtDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');
export const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : '-');
