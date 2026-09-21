# Porting off Lovable Cloud onto Supabase

Lovable Cloud is hosted Supabase, so there is no rewrite here. The app already
talks to Postgres through `@supabase/supabase-js`; what needs to change is which
project it points at, plus a few Lovable-only conveniences that are removed.

## What is in the backend today

Tables

- `applications` - one row per applicant, plus `unsubscribed` and `unsubscribe_token`.
- `email_broadcasts` - a campaign, its recipients, and its progress counters.
- `email_send_log` - one row per recipient per campaign, so sends can resume.

Edge functions

- `submit-application` - public form submission, emails a notification via SendByte.
- `admin-applications` - lists applications. Requires the admin password header.
- `admin-broadcasts` - lists campaigns and their logs. Requires the admin password header.
- `send-broadcast` - sends a batch, or queues a scheduled one.
- `broadcast-worker` - cron-driven drain loop for queued campaigns.
- `email-upload` - uploads a header/footer image to the `email-assets` bucket.
- `unsubscribe` - flips `unsubscribed` for a token.

Database functions and extensions

- `verify_cron_secret`, `ensure_broadcast_worker`, `drain_broadcast_worker`,
  `email_broadcasts_wake_worker`, `supabase_project_url`.
- `pg_cron` and `pg_net` drive the worker; a vault secret holds the shared secret.
- Storage bucket `email-assets`.

## Steps to port

1. Create the Supabase project, then link and push the schema.

   ```bash
   npx supabase link --project-ref <new-ref>
   npx supabase db push
   ```

   Migrations create the tables, RLS policies, extensions, the worker functions
   and the `email-assets` bucket.

2. Set the edge function secrets on the new project.

   ```bash
   npx supabase secrets set ADMIN_PASSWORD='<admin password>' SENDBYTE_API_KEY='<key>'
   ```

   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected by the platform.

3. Point the worker at the new project. The scheduled job builds its URL from a
   vault secret, so this must be set or the worker will call the old project.

   ```sql
   select vault.create_secret('https://<new-ref>.supabase.co', 'project_url', 'target project');
   ```

   The secret is only read when the job is (re)created. If a job already exists
   from an earlier run, remove it once and it will be recreated on the next wake:

   ```sql
   select cron.unschedule('broadcast-worker');
   ```

4. Deploy the functions.

   ```bash
   npx supabase functions deploy
   ```

   `config.toml` sets `verify_jwt = false` for every function. Each one checks
   either the admin password header or the cron secret, which is what the
   original project did.

5. Update the frontend environment and redeploy.

   ```
   VITE_SUPABASE_URL=https://<new-ref>.supabase.co
   VITE_SUPABASE_PROJECT_ID=<new-ref>
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
   ```

   Sign-in is not used by this app, so there is no user data to migrate. Any
   session previously stored under a Lovable key is simply ignored.

6. Sign in at `/admin` with `ADMIN_PASSWORD` and confirm the applications list,
   the broadcast history, and an image upload all work. Then send a broadcast to
   your own address before mailing the full list.

## Importing a CSV of emails

Use `scripts/import_applications.py`. It is a dry run unless you pass `--commit`.

```bash
export SUPABASE_URL="https://<new-ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service role key>"

python3 scripts/import_applications.py contacts.csv                        # preview
python3 scripts/import_applications.py contacts.csv --commit --report out.json
```

What it does with messy lists:

- Matches on email case-insensitively and trimmed, so `Ada@X.com` and
  ` ada@x.com ` are the same person.
- Keeps the first row per email and folds in any missing detail from later
  duplicates. Duplicates are counted in the report rather than silently dropped.
- Skips addresses already in the database, so re-running is a no-op.
- Skips rows with no email and obvious non-addresses, listing them for review.
- Never overwrites a row that already exists.

The database enforces the same rule with a unique index on `lower(trim(email))`,
so a duplicate cannot be introduced by any path.

## Importing a SendByte send log

`scripts/import_sendbyte_log.py` handles an export from SendByte's log rather than a
clean contact list. The file records every email ever sent, so three things are derived
instead of read:

- Subscribers are the distinct `to` values. The academy's own inbox (which received the
  application notifications), a vendor test address and a support password-reset are
  excluded by name.
- Names are not a column. They appear only in the subjects of the "New UCA Application"
  notifications, which were themselves sent to the academy's inbox, so a name is only
  recovered when it matches an email's local part unambiguously. The rest are stored
  blank and render as "Hi there,". `--derive-greetings` guesses from the local part
  instead, but run-together addresses produce greetings like "Hi Aanubabatundeoduntan,"
  which reads as spam, so it is off by default.
- Hard bounces are listed in the report and never silently queued.
  `--suppress-bounced` marks them unsubscribed so broadcasts skip dead addresses.

```bash
export SUPABASE_URL="https://<new-ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service role key>"

python3 scripts/import_sendbyte_log.py sendbyte-log.csv                     # dry run
python3 scripts/import_sendbyte_log.py sendbyte-log.csv --commit --suppress-bounced
```

Insertion targets the unique `email_normalized` index with
`resolution=ignore-duplicates`, so re-running is safe and existing applicants are never
overwritten.

## Schema changes made for this port

- `20260920120000_dedupe_applicant_emails` merges existing duplicate rows,
  keeps the oldest, preserves any opt-out across the group, and adds the unique
  index. Tokens from merged rows are kept in `superseded_unsubscribe_tokens` so
  unsubscribe links that were already emailed in past campaigns keep working.
- `20260920120100_portable_project_url_and_bucket` resolves the cron URL from a
  vault secret instead of a hardcoded project URL, and creates the
  `email-assets` bucket that earlier migrations referenced but never created.
- `20260920120200_add_application_source` records whether a row came from the
  form or a list import, so an import can be audited or rolled back.
- `20260920120300_allow_list_imports_without_form_fields` makes the
  form-specific columns nullable so imported rows can be stored.

## Worker authentication with new-format keys

`broadcast-worker` calls `send-broadcast` once per batch. It must send the injected
`SUPABASE_SERVICE_ROLE_KEY` as *both* the `apikey` and `Authorization: Bearer` headers,
and it does so with a plain `fetch` rather than `supabase.functions.invoke`.

This matters because `@supabase/functions-js` (2.116.0) puts the key only in `apikey`
and reserves `Authorization` for a signed-in user's JWT; with no session it does not
send a new-format (`sb_secret_…`) key as a Bearer token. `send-broadcast` authorises
internal calls by comparing the Bearer value against that same env var, so on a project
using new-format keys the call arrived unauthorized. The symptom is a broadcast stuck at
`in_progress` with `sent=0` while `cron.job_run_details` reports the job itself succeeded;
the real error is visible in `net._http_response` as
`Edge Function returned a non-2xx status code`.

Legacy-JWT projects were unaffected, which is why this only appeared after moving to a
project with new-format keys.

## Deliberately not changed

- The applications table is still publicly insertable, matching the original
  design where the browser writes through the edge function. Nothing is exposed
  for reading.
- `ADMIN_PASSWORD` remains a shared header rather than real auth. It is what the
  app uses today; switching to Supabase Auth is a separate change.