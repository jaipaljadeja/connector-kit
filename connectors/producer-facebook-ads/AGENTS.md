# Facebook Ads producer

## Current scope

- Resources: `ad_accounts`, `campaigns`, `ad_sets`, `ads`, and 4 daily
  insights tables (see `src/resources/insights/specs.ts`)
- Auth: a system user token with `ads_read`, for one or more ad accounts
- Changes: every 6 hours
- Webhooks: none. Meta's ad account webhooks don't cover object changes.

## Meta rules

- Every request goes through `src/client`, so VCR records it. The version is
  `API_VERSION` in the URL. Calls on an expired version are moved up to the
  next one when the endpoint didn't change.
- Errors carry `error.code`. 4, 17, 613, 80000, and 80004 are usage limits.
  They wait and try again, with at most 10 minutes between tries. A failed
  source stays stopped until restart.
- Lists use cursor paging. Only `paging.next` says there is another page.
  Meta says cursors can go stale, so keep them to one run.
- Lists leave out archived and deleted objects unless asked. The
  `effective_status` param rejects DELETED, so lists use `filtering` on
  `<object>.effective_status` instead. A delete then reads as a row with
  status `DELETED`. Meta doesn't let deleted objects be restored.
- Meta sends counts and money as numeric strings, and times with an offset,
  such as `2026-10-19T10:00:00+0530`.
- `impression_device` and `frequency_value` return nothing until an admin opts
  in for the account, so they're left out.

`version` is the fetch time, since Meta's docs say a campaign budget change
doesn't move `updated_time`. In a sandbox it did.

Campaigns are read in full on changes, since that list has no `updated_since`.
Ad sets and ads use `updated_since`, starting 5 minutes early. An account added
after backfill is read in full once. Cursors name accounts by ID, so the list
can be reordered.

Insights read one account and one day per request, at `level=ad`. Days are in
the account's time zone. Backfill reads through the cutoff's day. Changes read
the last `lookbackDays` days through today, plus any days missed since the last
run, one account after another. A new account in the list starts from the start
day.

Checked live on a sandbox ad account with seeded campaigns and ad sets:

- Every resource's check, and the request params for all lists and insights.
- Archived and deleted objects come back with the status filter above.
  `updated_since` returns a deleted ad set as a change.
- Budget changes move `updated_time` on campaigns and ad sets.
- On Limited access, a sandbox run soon gets code 17 "User request limit
  reached", and waits as above.
- Insights older than 37 months fail with code 3018.

Not checked live, since a sandbox never delivers and ads need a Page:

- Ad and insights field types, and whether insights include deleted ads.

Record VCR against the sandbox ad account.
