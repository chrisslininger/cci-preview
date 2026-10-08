-- Applied to the live project on 7 Oct 2026.
--
-- The member RSVP feature (create-checkout v7) writes reg_type='member' for a
-- signed-in current member taking a seat that is free with membership. This
-- check constraint predates that feature and still listed only three tiers, so
-- every member RSVP was rejected by the database — the first one anybody tried
-- came back as a raw constraint violation in the registration dialog.
--
-- Widening only. The three existing values stay valid, no existing row can be
-- made invalid, and nothing else in the schema reads this column.
--
-- Note: this folder is a RECORD of schema changes, not a pipeline. Nothing
-- applies these files automatically. They exist so the database and the code in
-- this repo can be checked against each other, because the drift between them
-- is what caused the bug above.

alter table public.event_registrations
  drop constraint if exists event_registrations_reg_type_check;

alter table public.event_registrations
  add constraint event_registrations_reg_type_check
  check (reg_type = any (array['doctor'::text, 'student'::text, 'faculty'::text, 'member'::text]));
