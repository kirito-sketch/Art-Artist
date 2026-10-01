/**
 * Study task definitions the server keeps in sync (server-only).
 *
 * The Individual Creative study opens with the first-run experience: Task 1 "Getting started" runs the
 * real splash, introduction, account entry and onboarding, and succeeds when the main product shows
 * (first_home_reached). The six product tasks follow as Tasks 2 to 7.
 *
 * supabase/seed.sql holds the same definition.
 * This sync exists so a deployment works without anyone running SQL by hand. It is narrow and
 * idempotent: it only ever adds this one task and sets the sequence of the known task keys. It never
 * deletes or edits other tasks, attempts, sessions or events. Existing attempts keep pointing at their
 * task by id, so past sessions are untouched (their task numbers in the dashboard shift by one).
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export const INDIVIDUAL_STUDY_SLUG = 'ana-individual-creative-v29';

export const FIRST_RUN_TASK = {
  key: 'getting-started',
  title: 'Getting started',
  instruction: "Go through the experience as you naturally would until you feel you've reached the main product.",
  success_events: ['first_home_reached'],
};

/** Target order. Keys not present in the study are ignored. */
const ORDER = ['getting-started', 'understand-home', 'find-craft-person', 'find-posts', 'save-project-or-role', 'show-interest-role', 'profile-credits'];

const synced = new Set<string>();

export async function syncStudyTasks(sb: SupabaseClient, study: { id: string; slug: string }): Promise<void> {
  if (study.slug !== INDIVIDUAL_STUDY_SLUG || synced.has(study.id)) return;
  const { data, error } = await sb.from('research_tasks').select('key, sequence').eq('study_id', study.id);
  if (error) throw new Error(`task sync read: ${error.message}`);
  const have = new Map((data ?? []).map((t) => [t.key as string, t.sequence as number]));
  const want = (k: string) => ORDER.indexOf(k) + 1;
  if (have.get(FIRST_RUN_TASK.key) === 1 && ORDER.every((k) => !have.has(k) || have.get(k) === want(k))) {
    synced.add(study.id);
    return;
  }
  // (study_id, sequence) is unique: move the last task first so no two ever share a number.
  for (const k of [...ORDER].reverse()) {
    if (k === FIRST_RUN_TASK.key || !have.has(k) || have.get(k) === want(k)) continue;
    const { error: e } = await sb.from('research_tasks').update({ sequence: want(k) }).eq('study_id', study.id).eq('key', k);
    if (e) throw new Error(`task sync move ${k}: ${e.message}`);
  }
  const { error: e } = await sb
    .from('research_tasks')
    .upsert(
      { study_id: study.id, key: FIRST_RUN_TASK.key, sequence: 1, title: FIRST_RUN_TASK.title, instruction: FIRST_RUN_TASK.instruction, participant_type: 'individual_creative', success_events: FIRST_RUN_TASK.success_events, success_object_type: null },
      { onConflict: 'study_id,key', ignoreDuplicates: true },
    );
  if (e) throw new Error(`task sync insert: ${e.message}`);
  synced.add(study.id);
}
