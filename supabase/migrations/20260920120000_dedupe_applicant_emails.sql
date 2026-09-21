-- One applicant row per email address, enforced at the database level.
--
-- Broadcasts dedupe by lower(email) at send time, but nothing stopped the same
-- address from existing as several rows, which skews recipient counts and lets a
-- list import silently re-add people who already applied.

-- 1. Normalise stored addresses so comparisons are stable.
update public.applications
   set email = lower(btrim(email))
 where email is distinct from lower(btrim(email));

-- 2. Superseded unsubscribe tokens. Past broadcasts embedded
--    /unsubscribe?token=<uuid> per application row, so merging duplicates must
--    not orphan tokens that were already delivered.
alter table public.applications
  add column if not exists superseded_unsubscribe_tokens uuid[] not null default '{}';

-- 3. If any row in a duplicate group had unsubscribed, the survivor stays
--    unsubscribed. Losing this would re-mail someone who opted out.
with dup_groups as (
  select lower(email) as norm, bool_or(unsubscribed) as any_unsub
    from public.applications
   group by 1
  having count(*) > 1
)
update public.applications a
   set unsubscribed = g.any_unsub
  from dup_groups g
 where lower(a.email) = g.norm
   and a.unsubscribed is distinct from g.any_unsub;

-- 4. Keep the oldest row per email and fold the other rows' tokens into it.
with ranked as (
  select id,
         lower(email) as norm,
         unsubscribe_token,
         row_number() over (partition by lower(email) order by created_at, id) as rn
    from public.applications
),
folded as (
  select s.id as survivor_id,
         array_agg(d.unsubscribe_token order by d.unsubscribe_token) as tokens
    from ranked s
    join ranked d on d.norm = s.norm and d.rn > 1
   where s.rn = 1
   group by s.id
)
update public.applications a
   set superseded_unsubscribe_tokens = a.superseded_unsubscribe_tokens || f.tokens
  from folded f
 where a.id = f.survivor_id;

with ranked as (
  select id,
         row_number() over (partition by lower(email) order by created_at, id) as rn
    from public.applications
)
delete from public.applications a
 using ranked r
 where a.id = r.id and r.rn > 1;

-- 5. Generated column so PostgREST upserts can target it via on_conflict.
alter table public.applications
  add column if not exists email_normalized text
  generated always as (lower(btrim(email))) stored;

create unique index if not exists applications_email_normalized_key
  on public.applications (email_normalized);
