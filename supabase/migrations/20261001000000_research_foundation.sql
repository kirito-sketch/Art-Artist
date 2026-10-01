-- =====================================================================================================
-- Ana research data foundation (unmoderated usability testing)
--
-- Research data lives in its own tables, all prefixed `research_`. Nothing here references, or is
-- referenced by, Ana's prototype/demo data (which is in-browser fixture data, not in this database), so
-- resetting fixtures or switching personas can never touch a research record.
--
-- Access model (see docs/RESEARCH_DATA_SYSTEM.md):
--   * anon (browser, participants): NO access to any research table. Participants write only through
--     the server API, which uses the service role.
--   * service_role (server-only API): full access; bypasses RLS.
--   * authenticated users listed in research_researchers (future /research dashboard): read everything,
--     and update the review fields of feedback. Nobody else who signs in can read anything.
-- =====================================================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------------------------- enums
create type public.research_participant_type as enum ('individual_creative', 'production_house', 'other');
create type public.research_study_status as enum ('draft', 'active', 'paused', 'completed');
create type public.research_session_status as enum ('active', 'completed', 'abandoned');
create type public.research_attempt_outcome as enum ('in_progress', 'completed', 'completed_with_difficulty', 'abandoned', 'skipped');
create type public.research_feedback_category as enum ('confusing', 'couldnt_find', 'visual_issue', 'didnt_work', 'suggestion', 'other');
create type public.research_feedback_status as enum ('new', 'reviewed', 'actionable', 'fixed', 'wont_fix');

-- ------------------------------------------------------------------------------------ updated_at helper
create or replace function public.research_touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- --------------------------------------------------------------------------------------------- studies
create table public.research_studies (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
  title             text not null check (char_length(title) between 1 and 200),
  description       text,
  status            public.research_study_status not null default 'draft',
  participant_type  public.research_participant_type,
  prototype_version text,            -- the build the study was planned against; each session records its own
  notes             text,            -- researcher-only
  started_at        timestamptz,
  ended_at          timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger research_studies_touch before update on public.research_studies
  for each row execute function public.research_touch_updated_at();

-- ---------------------------------------------------------------------------------------- participants
-- No email, no demographics. A participant is a code (P001...) plus optional, self-chosen context.
create sequence public.research_participant_code_seq;
create table public.research_participants (
  id               uuid primary key default gen_random_uuid(),
  participant_code text not null unique
                     default ('P' || lpad(nextval('public.research_participant_code_seq')::text, 3, '0'))
                     check (participant_code ~ '^[A-Za-z0-9_-]{2,32}$'),
  display_name     text check (char_length(display_name) <= 80),
  participant_type public.research_participant_type,
  primary_craft    text check (char_length(primary_craft) <= 60),
  experience_level text check (char_length(experience_level) <= 40),
  consented_at     timestamptz,
  created_at       timestamptz not null default now()
);

-- -------------------------------------------------------------------------------------------- sessions
-- One participant testing one study on one build. prototype_version is written once, at start, and never
-- updated, so old sessions keep the build they actually tested.
create table public.research_sessions (
  id                uuid primary key default gen_random_uuid(),
  study_id          uuid not null references public.research_studies (id) on delete restrict,
  participant_id    uuid not null references public.research_participants (id) on delete restrict,
  token_hash        text not null unique check (char_length(token_hash) = 64),  -- sha256 of the opaque token; the token itself is never stored
  client_start_id   uuid not null unique,                                       -- idempotency key for session start
  prototype_version text not null check (char_length(prototype_version) between 1 and 60),
  selected_persona  text check (char_length(selected_persona) <= 80),
  status            public.research_session_status not null default 'active',
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  device_type       text check (device_type in ('phone', 'tablet', 'desktop', 'unknown')),
  viewport_width    integer check (viewport_width between 0 and 10000),
  viewport_height   integer check (viewport_height between 0 and 10000),
  client_info       jsonb check (client_info is null or pg_column_size(client_info) <= 2048),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint research_sessions_completed_has_time check (status <> 'completed' or completed_at is not null)
);
create trigger research_sessions_touch before update on public.research_sessions
  for each row execute function public.research_touch_updated_at();
create index research_sessions_study_idx       on public.research_sessions (study_id, started_at desc);
create index research_sessions_participant_idx on public.research_sessions (participant_id);
create index research_sessions_version_idx     on public.research_sessions (prototype_version);
create index research_sessions_started_idx     on public.research_sessions (started_at desc);

-- ----------------------------------------------------------------------------------------------- tasks
-- Tasks belong to a study, so an Individual Creative study and a Production House study share one backend.
-- `key` is the stable handle the prototype uses (research.startTask('find-role')).
-- success_events: semantic event names that, inside an attempt, mark the task as achieved
-- (optionally narrowed to one object type / object id).
create table public.research_tasks (
  id                   uuid primary key default gen_random_uuid(),
  study_id             uuid not null references public.research_studies (id) on delete cascade,
  key                  text not null check (key ~ '^[a-z0-9][a-z0-9-]{1,60}$'),
  sequence             integer not null check (sequence > 0),
  title                text not null check (char_length(title) between 1 and 200),
  instruction          text not null check (char_length(instruction) between 1 and 1000),
  participant_type     public.research_participant_type,
  success_events       text[] not null default '{}',
  success_object_type  text,
  success_object_id    text,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (study_id, key),
  unique (study_id, sequence)
);
create trigger research_tasks_touch before update on public.research_tasks
  for each row execute function public.research_touch_updated_at();

-- --------------------------------------------------------------------------------------- task attempts
create table public.research_task_attempts (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references public.research_sessions (id) on delete cascade,
  task_id            uuid not null references public.research_tasks (id) on delete restrict,
  client_attempt_id  uuid not null,                         -- idempotency key, generated in the browser
  started_at         timestamptz not null default now(),
  completed_at       timestamptz,
  duration_ms        integer check (duration_ms >= 0),
  outcome            public.research_attempt_outcome not null default 'in_progress',
  success_detected   boolean not null default false,        -- set by the server when a success event arrives
  difficulty_rating  smallint check (difficulty_rating between 1 and 5),     -- 1 very easy ... 5 very hard
  expectation_match  smallint check (expectation_match between 1 and 5),     -- 1 not at all ... 5 exactly as expected
  feedback_text      text check (char_length(feedback_text) <= 2000),
  wrong_turn_count   integer not null default 0 check (wrong_turn_count >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (session_id, client_attempt_id),
  constraint research_attempts_done_has_time check (outcome = 'in_progress' or completed_at is not null)
);
-- At most one open attempt per task per session: a remount or double tap cannot open a second one.
create unique index research_attempts_one_open_idx on public.research_task_attempts (session_id, task_id)
  where outcome = 'in_progress';
create index research_attempts_session_idx on public.research_task_attempts (session_id, started_at);
create index research_attempts_task_idx    on public.research_task_attempts (task_id, outcome);
create trigger research_task_attempts_touch before update on public.research_task_attempts
  for each row execute function public.research_touch_updated_at();

-- ---------------------------------------------------------------------------------------------- events
-- The behavioural log and the single source of truth for journeys. `sequence` is assigned in the browser,
-- strictly increasing per session, so order never depends on timestamps (or on network arrival order).
create table public.research_events (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.research_sessions (id) on delete cascade,
  task_attempt_id  uuid references public.research_task_attempts (id) on delete set null,
  client_event_id  uuid not null,                           -- idempotency key
  sequence         integer not null check (sequence > 0),
  event_name       text not null check (event_name ~ '^[a-z][a-z0-9_]{1,60}$'),
  screen           text check (char_length(screen) <= 80),
  object_type      text check (char_length(object_type) <= 40),
  object_id        text check (char_length(object_id) <= 120),
  metadata         jsonb not null default '{}'::jsonb check (pg_column_size(metadata) <= 2048),
  client_ts        timestamptz,
  created_at       timestamptz not null default now(),
  unique (session_id, client_event_id),
  unique (session_id, sequence)
);
create index research_events_attempt_idx on public.research_events (task_attempt_id) where task_attempt_id is not null;
create index research_events_name_idx    on public.research_events (event_name, created_at desc);
create index research_events_created_idx on public.research_events (created_at desc);
-- (session_id, sequence) is already indexed by its unique constraint: that is the journey query.

-- -------------------------------------------------------------------------------------------- feedback
-- Context is attached by the server, not typed by the participant. The trail before a feedback item is
-- derived from research_events (sequence <= trail_until_sequence), never copied in here.
create table public.research_feedback (
  id                    uuid primary key default gen_random_uuid(),
  session_id            uuid not null references public.research_sessions (id) on delete cascade,
  task_attempt_id       uuid references public.research_task_attempts (id) on delete set null,
  event_id              uuid references public.research_events (id) on delete set null,
  client_feedback_id    uuid not null,                       -- idempotency key
  category              public.research_feedback_category not null,
  screen                text check (char_length(screen) <= 80),
  participant_comment   text check (char_length(participant_comment) <= 2000),
  prototype_version     text not null,                       -- copied from the session by the server
  persona               text check (char_length(persona) <= 80),
  trail_until_sequence  integer,                             -- last event sequence the participant had produced
  interaction_context   jsonb check (interaction_context is null or pg_column_size(interaction_context) <= 2048),
  attachment_url        text,                                -- reserved for screenshots (not captured in V1)
  status                public.research_feedback_status not null default 'new',   -- researcher-only
  researcher_note       text,                                                     -- researcher-only
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (session_id, client_feedback_id)
);
create index research_feedback_session_idx  on public.research_feedback (session_id);
create index research_feedback_category_idx on public.research_feedback (category, created_at desc);
create index research_feedback_status_idx   on public.research_feedback (status, created_at desc);
create trigger research_feedback_touch before update on public.research_feedback
  for each row execute function public.research_touch_updated_at();

-- ---------------------------------------------------------------------------- researchers (future use)
-- Supabase Auth users allowed to read research data in the future /research dashboard. Empty by default:
-- add a researcher by inserting their auth user id (see docs). Participants never sign in.
create table public.research_researchers (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

create or replace function public.research_is_researcher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.research_researchers r where r.user_id = auth.uid());
$$;
revoke all on function public.research_is_researcher() from public;
grant execute on function public.research_is_researcher() to authenticated, service_role;

-- -------------------------------------------------------------------------------------------- security
alter table public.research_studies        enable row level security;
alter table public.research_participants   enable row level security;
alter table public.research_sessions       enable row level security;
alter table public.research_tasks          enable row level security;
alter table public.research_task_attempts  enable row level security;
alter table public.research_events         enable row level security;
alter table public.research_feedback       enable row level security;
alter table public.research_researchers    enable row level security;

-- Supabase grants new public tables to anon and authenticated by default. Take that away explicitly:
-- the browser (anon key) gets nothing at all, not even a filtered SELECT.
revoke all on public.research_studies, public.research_participants, public.research_sessions,
  public.research_tasks, public.research_task_attempts, public.research_events, public.research_feedback,
  public.research_researchers
  from anon, authenticated;
revoke all on sequence public.research_participant_code_seq from anon, authenticated;

grant all on public.research_studies, public.research_participants, public.research_sessions,
  public.research_tasks, public.research_task_attempts, public.research_events, public.research_feedback,
  public.research_researchers
  to service_role;
grant usage, select on sequence public.research_participant_code_seq to service_role;

-- Future dashboard: signed-in researchers may read; feedback review fields may be updated.
grant select on public.research_studies, public.research_participants, public.research_sessions,
  public.research_tasks, public.research_task_attempts, public.research_events, public.research_feedback
  to authenticated;
grant update (status, researcher_note) on public.research_feedback to authenticated;

create policy research_studies_researcher_read       on public.research_studies       for select to authenticated using (public.research_is_researcher());
create policy research_participants_researcher_read  on public.research_participants  for select to authenticated using (public.research_is_researcher());
create policy research_sessions_researcher_read      on public.research_sessions      for select to authenticated using (public.research_is_researcher());
create policy research_tasks_researcher_read         on public.research_tasks         for select to authenticated using (public.research_is_researcher());
create policy research_attempts_researcher_read      on public.research_task_attempts for select to authenticated using (public.research_is_researcher());
create policy research_events_researcher_read        on public.research_events        for select to authenticated using (public.research_is_researcher());
create policy research_feedback_researcher_read      on public.research_feedback      for select to authenticated using (public.research_is_researcher());
create policy research_feedback_researcher_review    on public.research_feedback      for update to authenticated
  using (public.research_is_researcher()) with check (public.research_is_researcher());
-- research_researchers: no policies, so only the service role (and the SQL editor) can manage it.
