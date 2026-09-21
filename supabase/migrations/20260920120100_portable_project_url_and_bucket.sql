-- Portability fixes so this schema can run against any Supabase project, not just
-- the one it was authored on.

-- The broadcast worker was scheduled against a hardcoded project URL. Resolve it
-- from a vault secret instead, falling back to the original project so an
-- in-place upgrade keeps working before the secret is set.
create or replace function public.supabase_project_url()
returns text
language plpgsql
stable
security definer
set search_path = public, vault
as $$
declare
  v text;
begin
  select decrypted_secret into v
    from vault.decrypted_secrets
   where name = 'project_url';
  return coalesce(nullif(v, ''), 'https://phmxhzwuuwzubytducki.supabase.co');
end $$;

revoke all on function public.supabase_project_url() from public, anon, authenticated;
grant execute on function public.supabase_project_url() to service_role;

create or replace function public.ensure_broadcast_worker()
returns void
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
begin
  if not exists (select 1 from cron.job where jobname = 'broadcast-worker') then
    perform cron.schedule(
      'broadcast-worker',
      '* * * * *',
      format($job$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'broadcast_cron_secret')
        ),
        body := '{}'::jsonb
      );
      $job$, public.supabase_project_url() || '/functions/v1/broadcast-worker')
    );
  end if;
end $$;

-- email-upload writes to this bucket, but no migration ever created it.
insert into storage.buckets (id, name, public)
values ('email-assets', 'email-assets', false)
on conflict (id) do nothing;