/**
 * Research event taxonomy (shared by the browser client and the server API).
 *
 * Events are semantic: they say what the participant did in Art and Artist terms ("role_opened"), never which
 * element they touched ("button_14_clicked"). Unknown names are dropped on both sides. Nothing typed
 * by the participant is ever an event payload: see sanitizeMetadata.
 * Documented in docs/RESEARCH_DATA_SYSTEM.md, "Event taxonomy".
 */
export const RESEARCH_EVENTS = {
  // Research lifecycle (emitted by the research client itself)
  session_started: 'A research session began',
  session_completed: 'The participant finished the session',
  task_started: 'A task attempt began',
  task_completed: 'A task attempt ended (outcome in metadata)',
  task_skipped: 'The participant skipped a task',
  feedback_opened: 'The participant opened the feedback form',
  feedback_submitted: 'A feedback item was submitted',
  stuck_reported: "The participant tapped I'm stuck",
  task_instruction_opened: 'The participant reopened the task instruction',
  survey_submitted: 'The final survey was submitted',

  // First run (splash, introduction, account entry and onboarding: the real product flow)
  onboarding_step_viewed: 'A first-run screen shown (metadata.step: splash, intro_1..3, entry, email, consent, you, craft ...)',
  onboarding_step_back: 'Went back a step during first run (metadata.from)',
  onboarding_step_skipped: 'Skipped a first-run step (metadata.step)',
  first_home_reached: 'First run finished and the main product is showing (metadata.via: created, signin; metadata.intent)',
  intent_changed: 'The person changed what Home is showing for (metadata.from, metadata.to: work, hire, collaborate, network, explore)',

  // Navigation
  home_viewed: 'Home tab shown',
  discover_opened: 'Discover tab shown',
  inbox_opened: 'Messages tab shown',
  own_profile_viewed: 'The participant opened their own profile',
  screen_opened: 'Any other screen opened (metadata.route)',
  navigated_back: 'Back from a screen (metadata.from)',
  sheet_opened: 'A sheet opened (metadata.sheet)',

  // Discovery
  discover_tab_selected: 'Discover section chosen (metadata.tab)',
  discover_filter_selected: 'A craft or filter chip chosen (metadata.filter)',

  // Objects opened
  role_opened: 'A role / opportunity opened',
  project_opened: 'A project opened',
  person_profile_opened: "Another person's profile opened",
  house_profile_opened: 'A production house page opened',
  post_opened: 'A post opened',
  conversation_opened: 'A conversation opened (never its contents)',
  notifications_opened: 'Notifications opened',
  saved_opened: 'The Saved screen opened',
  settings_opened: 'Settings opened',

  // Actions and state changes
  role_saved: 'A role was saved',
  role_unsaved: 'A role was unsaved',
  project_saved: 'A project was saved',
  project_unsaved: 'A project was unsaved',
  post_saved: 'A post was saved',
  post_unsaved: 'A post was unsaved',
  person_followed: 'A person was followed',
  person_unfollowed: 'A person was unfollowed',
  house_followed: 'A production house was followed',
  house_unfollowed: 'A production house was unfollowed',
  interest_sent: 'Interest shown in a role',
  interest_withdrawn: 'Interest withdrawn',
  message_sent: 'A message was sent (count only, never the text)',
  credit_accepted: 'A credit was accepted',
  identity_switched: 'Acting identity changed (metadata.from, metadata.to)',
  person_saved: 'A person was saved (private shortlist)',
  person_unsaved: 'A person was removed from Saved',
  availability_changed: 'Availability changed (metadata.open)',

  // Production House flows (reserved for the house study)
  interest_reviewed: 'Interested people reviewed for a role',
  project_member_added: 'Someone added to a project',
  credit_issued: 'A credit issued',
  role_published: 'A role opened for interest',
} as const;

export type ResearchEventName = keyof typeof RESEARCH_EVENTS;
export const isResearchEventName = (n: string): n is ResearchEventName => Object.prototype.hasOwnProperty.call(RESEARCH_EVENTS, n);

export const RESEARCH_OBJECT_TYPES = ['role', 'project', 'person', 'house', 'post', 'conversation', 'credit', 'task'] as const;
export type ResearchObjectType = (typeof RESEARCH_OBJECT_TYPES)[number];

export const FEEDBACK_CATEGORIES = ['confusing', 'couldnt_find', 'visual_issue', 'didnt_work', 'suggestion', 'other'] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const ATTEMPT_OUTCOMES = ['completed', 'completed_with_difficulty', 'abandoned', 'skipped'] as const;
export type AttemptOutcome = (typeof ATTEMPT_OUTCOMES)[number];

export type MetadataValue = string | number | boolean | null;
export type Metadata = Record<string, MetadataValue>;

/** Keys that could carry something a participant typed or something personal. Always dropped. */
const UNSAFE_KEY = /(text|message|body|note|comment|content|password|passcode|secret|token|email|phone|query|search|address|clipboard)/i;

/**
 * Flat, small, typed metadata only: at most 12 keys, short strings, numbers, booleans. Anything that
 * looks like free text or personal data is removed rather than stored.
 */
export function sanitizeMetadata(input: unknown): Metadata {
  const out: Metadata = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (Object.keys(out).length >= 12) break;
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(k) || UNSAFE_KEY.test(k)) continue;
    if (v === null || typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof v === 'string' && v.length <= 80) out[k] = v;
  }
  return out;
}

/** Ids and route names only: short tokens, no spaces or free text. */
export function sanitizeToken(v: unknown, max = 120): string | null {
  return typeof v === 'string' && v.length > 0 && v.length <= max && /^[\w:.\-/]+$/.test(v) ? v : null;
}
