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
with s as (select id from public.research_studies where slug = 'ana-individual-creative-v29')
insert into public.research_tasks (study_id, key, sequence, title, instruction, participant_type, success_events, success_object_type)
select s.id, t.key, t.seq, t.title, t.instruction, 'individual_creative', t.success_events, t.object_type
from s, (values
  ('understand-home', 1, 'Understand Home',
   'Take a minute on the Home screen. In your own words, what does Art and Artist offer someone in your craft?',
   '{}'::text[], null),
  ('find-craft-person', 2, 'Find someone in your craft',
   'Find another cinematographer you might want to work with and open their profile.',
   '{person_profile_opened}'::text[], 'person'),
  ('find-posts', 3, 'Find posts in Discover',
   'Find recent work that people have posted.',
   '{post_opened}'::text[], 'post'),
  ('save-project-or-role', 4, 'Save a project or role',
   'Find a project or a role you would like to come back to later, and keep it.',
   '{project_saved,role_saved}'::text[], null),
  ('show-interest-role', 5, 'Find a role and show interest',
   'Find a Director of Photography opportunity that interests you and show interest.',
   '{interest_sent}'::text[], 'role'),
  ('profile-credits', 6, 'Understand your profile',
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
