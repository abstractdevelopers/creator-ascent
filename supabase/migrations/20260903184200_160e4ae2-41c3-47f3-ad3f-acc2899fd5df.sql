revoke all on function public.email_broadcasts_wake_worker() from public, anon, authenticated;
grant execute on function public.email_broadcasts_wake_worker() to service_role;