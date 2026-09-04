-- lovable-cron-fallback-reviewed: 1440 runs/day; only active while a broadcast is queued or in progress (wake-on-enqueue trigger, worker unschedules after drain) so scheduled campaigns fire near their exact minute and sends continue after the admin closes the tab.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

alter table public.email_broadcasts add column if not exists scheduled_at timestamptz;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'broadcast_cron_secret') then
    perform vault.create_secret(encode(gen_random_bytes(24), 'hex'), 'broadcast_cron_secret', 'shared secret for broadcast worker');
  end if;
end $$;

create or replace function public.verify_cron_secret(_secret text)
returns boolean
language sql
stable
security definer
set search_path = public, vault
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'broadcast_cron_secret' and decrypted_secret = _secret
  );
$$;

revoke all on function public.verify_cron_secret(text) from public, anon, authenticated;
grant execute on function public.verify_cron_secret(text) to service_role;

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
      $job$
      select net.http_post(
        url := 'https://phmxhzwuuwzubytducki.supabase.co/functions/v1/broadcast-worker',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'broadcast_cron_secret')
        ),
        body := '{}'::jsonb
      );
      $job$
    );
  end if;
end $$;

create or replace function public.drain_broadcast_worker()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (
    select 1 from public.email_broadcasts
    where status in ('scheduled', 'in_progress')
  ) and exists (select 1 from cron.job where jobname = 'broadcast-worker') then
    perform cron.unschedule('broadcast-worker');
  end if;
end $$;

revoke all on function public.ensure_broadcast_worker() from public, anon, authenticated;
revoke all on function public.drain_broadcast_worker() from public, anon, authenticated;
grant execute on function public.ensure_broadcast_worker() to service_role;
grant execute on function public.drain_broadcast_worker() to service_role;

create or replace function public.email_broadcasts_wake_worker()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('scheduled', 'in_progress') then
    perform public.ensure_broadcast_worker();
  end if;
  return new;
end $$;

drop trigger if exists trg_email_broadcasts_wake_worker on public.email_broadcasts;
create trigger trg_email_broadcasts_wake_worker
after insert or update of status, scheduled_at on public.email_broadcasts
for each row execute function public.email_broadcasts_wake_worker();