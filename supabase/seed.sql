-- =====================================================================================================
-- DEVELOPMENT research fixtures. Safe to run more than once (upserts by slug / key).
-- `supabase db reset` runs this file automatically after the migrations; on a hosted project paste it
-- into the SQL editor once (see docs/RESEARCH_DATA_SYSTEM.md, "Setup").
-- These are research fixtures only. They never touch Art and Artist's prototype/demo data.
-- =====================================================================================================

insert into public.research_studies (slug, title, description, status, participant_type, prototype_version, notes, started_at)
values
  ('ana-individual-creative-v29',
   'Art and Artist Individual Creative Usability Test (V29)',
   'Development study: can an individual creative understand Art and Artist, find people and work in their craft, save, and show interest in a role?',
   'active', 'individual_creative', 'V29',
   'DEVELOPMENT FIXTURE. Persona: Kiran Varma (Director of Photography, Hyderabad).',
   now()),
  ('ana-production-house-v29',
   'Art and Artist Production House Usability Test (V29)',
   'Development study (draft): can a production house member run a project from the Slate, review interest and issue credits?',
   'draft', 'production_house', 'V29',
   'DEVELOPMENT FIXTURE. Persona: Aditi Ghosh acting for Konark Pictures. Not active yet.',
   null)
on conflict (slug) do update set
  title = excluded.title, description = excluded.description, participant_type = excluded.participant_type,
  prototype_version = excluded.prototype_version, notes = excluded.notes;

-- Individual Creative tasks ------------------------------------------------------------------------------
-- Task 1 is the first-run experience (splash, introduction, account entry, onboarding) and succeeds when
-- the main product shows. The six product tasks follow as 2 to 7. (study_id, sequence) is unique, so
-- existing rows are moved out of the way first; the upsert below then sets every final number.
-- The API keeps the same definition in sync on its own: server/research/studies.ts.
update public.research_tasks set sequence = sequence + 100
where study_id = (select id from public.research_studies where slug = 'ana-individual-creative-v29') and sequence < 100;

with s as (select id from public.research_studies where slug = 'ana-individual-creative-v29')
insert into public.research_tasks (study_id, key, sequence, title, instruction, participant_type, success_events, success_object_type)
select s.id, t.key, t.seq, t.title, t.instruction, 'individual_creative', t.success_events, t.object_type
from s, (values
  ('getting-started', 1, 'Getting started',
   'Go through the experience as you naturally would until you feel you''ve reached the main product.',
   '{first_home_reached}'::text[], null),
  ('understand-home', 2, 'Understand Home',
   'Take a minute on the Home screen. In your own words, what does Art and Artist offer someone in your craft?',
   '{}'::text[], null),
  ('find-craft-person', 3, 'Find someone in your craft',
   'Find another cinematographer you might want to work with and open their profile.',
   '{person_profile_opened}'::text[], 'person'),
  ('find-posts', 4, 'Find posts in Discover',
   'Find recent work that people have posted.',
   '{post_opened}'::text[], 'post'),
  ('save-project-or-role', 5, 'Save a project or role',
   'Find a project or a role you would like to come back to later, and keep it.',
   '{project_saved,role_saved}'::text[], null),
  ('show-interest-role', 6, 'Find a role and show interest',
   'Find a Director of Photography opportunity that interests you and show interest.',
   '{interest_sent}'::text[], 'role'),
  ('profile-credits', 7, 'Understand your profile',
   'Open your profile. Which projects are you credited on, and is anything waiting for you?',
   '{own_profile_viewed}'::text[], null)
) as t(key, seq, title, instruction, success_events, object_type)
on conflict (study_id, key) do update set
  sequence = excluded.sequence, title = excluded.title, instruction = excluded.instruction,
  success_events = excluded.success_events, success_object_type = excluded.success_object_type;

-- Production House tasks (draft study: proves the model, no UI yet) -------------------------------------
with s as (select id from public.research_studies where slug = 'ana-production-house-v29')
insert into public.research_tasks (study_id, key, sequence, title, instruction, participant_type, success_events, success_object_type)
select s.id, t.key, t.seq, t.title, t.instruction, 'production_house', t.success_events, t.object_type
from s, (values
  ('understand-slate', 1, 'Understand the Slate',
   'Look at the house Home. What is happening across your projects right now?', '{}'::text[], null),
  ('open-project', 2, 'Open a project',
   'Open the project that is currently in pre-production.', '{project_opened}'::text[], 'project'),
  ('review-role', 3, 'Review a role',
   'Open one of the roles you are hiring for.', '{role_opened}'::text[], 'role'),
  ('inspect-interest', 4, 'Inspect interested people',
   'See who has shown interest in that role.', '{interest_reviewed}'::text[], 'role'),
  ('add-to-project', 5, 'Add someone to a project',
   'Add a person to the project team.', '{project_member_added}'::text[], 'project'),
  ('issue-credit', 6, 'Issue or review a credit',
   'Credit someone for their work on a project.', '{credit_issued}'::text[], 'credit')
) as t(key, seq, title, instruction, success_events, object_type)
on conflict (study_id, key) do update set
  sequence = excluded.sequence, title = excluded.title, instruction = excluded.instruction,
  success_events = excluded.success_events, success_object_type = excluded.success_object_type;

-- Short five-scenario study (redesigned /test, docs/TEST_REDESIGN.md) ---------------------------------------
-- A separate study: ana-individual-creative-v29 and its sessions are never touched. The API creates the same
-- rows on its own (server/research/studies.ts, ensureShortStudy), so this is only needed for a fresh database.
insert into public.research_studies (slug, title, description, status, participant_type, prototype_version, notes, started_at)
values ('aa-individual-short-v1',
        'Individual Creative: short session (5 scenarios)',
        'Five realistic situations in about 8 to 10 minutes: getting started, finding a professional, remembering them for later, finding an opportunity, and your own profile.',
        'active', 'individual_creative', 'V30',
        'Redesigned /test (docs/TEST_REDESIGN.md). Separate from ana-individual-creative-v29, whose sessions are untouched.',
        now())
on conflict (slug) do nothing;

with s as (select id from public.research_studies where slug = 'aa-individual-short-v1')
insert into public.research_tasks (study_id, key, sequence, title, instruction, participant_type, success_events, success_object_type)
select s.id, t.key, t.sequence, t.title, t.instruction, 'individual_creative', t.success_events, null
from s, (values
  ('first-look', 1, 'Getting started', 'You’ve just heard about Art and Artist and want to see whether it could be useful to you. Get started and enter the app.', array['first_home_reached']),
  ('find-cinematographer', 2, 'Find someone for your project', 'You’re putting together a project in Hyderabad and need a cinematographer. Find someone you might consider working with.', array[]::text[]),
  ('not-ready-yet', 3, 'Not ready to get in touch', 'You’re interested in this person, but you’re not ready to contact them yet. What would you naturally do?', array[]::text[]),
  ('find-opportunity', 4, 'Find your next project', 'Imagine you’re looking for your next project. Find an opportunity that feels relevant to you and show that you’re interested.', array['interest_sent']),
  ('your-profile', 5, 'Your profile', 'Look at your profile. If this were your real professional profile, what would you add or improve?', array[]::text[])
) as t(key, sequence, title, instruction, success_events)
on conflict (study_id, key) do nothing;
