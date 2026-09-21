-- Distinguish list imports from people who filled in the application form, so an
-- import can be audited or rolled back without guessing from the data.
alter table public.applications
  add column if not exists source text not null default 'application';

create index if not exists applications_source_idx
  on public.applications (source);