-- The application form collects current_focus, reason, skill_interest and
-- commitment, and these were NOT NULL to guarantee that. A CSV list provides
-- none of them, though, so imported rows could not be stored at all.
--
-- Relax the columns to allow imports, and move the requirement into the
-- submit-application function where the form's own contract belongs.
alter table public.applications alter column current_focus drop not null;
alter table public.applications alter column reason drop not null;
alter table public.applications alter column skill_interest drop not null;
alter table public.applications alter column commitment drop not null;