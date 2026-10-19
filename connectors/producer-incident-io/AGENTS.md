# incident.io producer

## Current scope

- Resources: 44 (see `manifest.ts`)
- Auth: one organization API key with read-only roles
- Changes: a feed for incidents and most of their lists, `updated_at` polls
  for follow-ups, actions, alerts, and escalations, and hourly full reads for
  the rest
- Webhooks: `POST /webhooks/incident-io`, read the record again for every event

## incident.io rules

- There is no global API version. Each endpoint has its own, such as
  `/v2/incidents` or `/v3/follow_ups`. Use the newest one that isn't
  deprecated, and check the spec at `https://api.incident.io/v1/openapiV3.json`.
- Every request goes through `src/client`, so VCR records it.
- Lists page with `page_size` and `after`. Stop only when
  `pagination_meta.after` is missing. Page size limits differ, from 25 to
  10,000, and `incident_alerts` takes at most 50. Check the spec's `maximum`.
  Some lists, such as severities, return everything at once.
- `schedule_entries` pages differently: send `pagination_meta.after` back as
  `entry_window_start`, with the same end.
- Listing incidents has its own limit of 60 a minute. The client gives it a
  separate bucket. `X-RateLimit-Limit` lists several limits, such as
  `60, 1200;window=60`, so the client doesn't read the headers.
- Incident and escalation date filters only take `yyyy-mm-dd`. A full
  timestamp gets a `422`. `gte` starts at the start of that day, and `lte`
  leaves that day out, so we filter by the full time ourselves. Alerts,
  follow-ups, actions, and workflow runs take full timestamps.
- The incidents list is newest first. Backfill drops incidents created after
  the cutoff.
- Rows can commit with an older `updated_at`, so changes start 5 minutes
  early.
- The incidents list leaves out test and tutorial incidents, and follow-ups and
  actions take one `incident_mode` per call. We ask for every mode.
- Alert notes need `alert_id` or `alert_group_id`. We read alerts with
  `has_notes[is]=true`, then their notes.
- Notification pauses only list active and upcoming ones unless `from` is set.
- Webhooks come through Svix, with Standard Webhooks headers. Verify them
  against the raw body with `standardwebhooks`, which takes the `whsec_`
  secret as it is.
- Webhooks can arrive out of order, and private ones only carry an ID, so
  every event reads the record again. The ID is in `id`, or under a key such
  as `incident`. Events we don't handle get a `200` before their body is read.
- Rows without `updated_at` use the time we read them. We always read them
  again, so that's safe.
- Slack fields can be missing, on Microsoft Teams or while a new incident's
  channel is made.

Lists read for each incident have no changes of their own. The feed reads them
for changed incidents and for open ones. An incident's `updated_at` moves with
each activity log entry, but some lists, such as participants, change without
it.

A failure in the feed, or in a webhook, stops every table in it. So call
sessions and workloads, which need extra roles, poll on their own and take no
webhooks. incident.io updates workload now and then, so workloads also read
incidents changed in the last day.

Workflow runs only filter by `created_at`, and a delayed run can finish days
later, so they're read in full every hour. Shift keys use `fingerprint`, which
the spec says stays the same for a shift across reads.

Only `schedules` has `_deleted`, from `schedule.deleted_v1`. incident.io has no
incident deletes. Follow-ups and actions have a `deleted` status, but the docs
don't say whether deleted ones stay in the lists.

Record VCR against a test organization where you can. The current cassette is
from a real one, read with a read-only key. It has no follow-ups, schedules,
workflows, or private incidents. So those, deleted follow-ups and actions, and
real webhook deliveries aren't checked live. The VCR test reads at most 3 pages
per resource, to keep the cassette small.

Test fixtures in `test/fixtures/` are the spec's example responses and webhook
bodies. Copy new ones from the spec as they are.

For a new resource, check its list params, page size limit, date filters,
webhook events, and the role it needs.
