# incident.io producer

Syncs incidents and everything around them from one incident.io organization:
updates, timelines, follow-ups, on-call, the catalog, status pages, and
settings. It backfills each resource, takes webhooks at
`POST /webhooks/incident-io`, and polls as a backup: every 5 minutes for
incidents, follow-ups, actions, alerts, and escalations, and every hour for
the rest.

| Resource                                                                                                                                                                                                                                 | What                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `incidents`                                                                                                                                                                                                                              | Incidents in every mode                |
| `incident_updates`, `incident_timeline_items`, `incident_activity_log_entries`, `incident_participants`, `incident_relationships`, `incident_attachments`, `incident_alerts`, `incident_call_sessions`, `incident_participant_workloads` | Lists read for each incident           |
| `postmortem_documents`, `follow_ups`, `actions`                                                                                                                                                                                          | Post-mortems and work items            |
| `alerts`, `alert_notes`, `alert_sources`, `alert_routes`, `alert_attributes`                                                                                                                                                             | Alerts and their setup                 |
| `escalations`, `escalation_paths`, `schedules`, `schedule_shifts`, `schedule_overrides`, `on_call_notification_pauses`, `maintenance_windows`                                                                                            | On-call                                |
| `catalog_types`, `catalog_entries`                                                                                                                                                                                                       | The catalog                            |
| `users`, `teams`                                                                                                                                                                                                                         | People and teams                       |
| `severities`, `incident_statuses`, `incident_types`, `incident_roles`, `incident_timestamps`, `custom_fields`, `custom_field_options`                                                                                                    | Incident settings, to name IDs on rows |
| `workflows`, `workflow_runs`                                                                                                                                                                                                             | Workflows and their runs               |
| `status_pages`, `status_page_components`, `status_page_incidents`, `status_page_maintenances`                                                                                                                                            | Status pages                           |
| `policies`, `policy_findings`                                                                                                                                                                                                            | Policies and what breaks them          |

## Config

| Variable                     | Required | Default |
| ---------------------------- | -------- | ------- |
| `INCIDENT_IO_API_KEY`        | yes      | none    |
| `INCIDENT_IO_WEBHOOK_SECRET` | yes      | none    |

## Setup

The API and webhooks need the Team plan or above. Private incidents and
policies need Pro.

1. Create an API key under **Settings → API keys** with these permissions
   (API names):
   - `viewer` for incidents, follow-ups, actions, and settings
   - `catalog_viewer`, `on_call_viewer`, `schedules_reader`,
     `workflows_viewer`, `status_page_viewer`, and `policies_viewer` for those
     tables
   - `incident_workload_viewer` and `incident_workload_private_viewer` for
     `incident_participant_workloads`
   - `call_transcripts_viewer` for `incident_call_sessions`
   - `global_access` to include private incidents

   `maintenance_windows` needs `on_call_editor`, the only permission that
   covers maintenance windows. It can also change on-call setup, so leave the
   table out unless you're fine granting that.

   Use the key as `INCIDENT_IO_API_KEY`. A table whose role is missing fails
   its check, and the others keep syncing.

2. Add a webhook endpoint under **Settings → Webhooks** at
   `https://<host>/webhooks/incident-io`. Pick both the public and private
   versions of these events:
   - `incident_created_v2`, `incident_updated_v2`,
     `incident_status_updated_v2`
   - `follow_up_created_v2`, `follow_up_updated_v2`
   - `action_created_v1`, `action_updated_v1`
   - `postmortem_document_status_updated_v1`
   - `alert_created_v1`, `alert_resolved_v1`
   - `escalation_created_v1`, `escalation_status_updated_v1`

   Also pick `schedule.created_v1`, `schedule.updated_v1`,
   `schedule.deleted_v1`, `schedule.shift_change_v1`, and
   `status_page_incident.update_shared_v1`. Use its signing secret as
   `INCIDENT_IO_WEBHOOK_SECRET`.

One key reads one organization, so run one connector per organization.

## Data

- Every webhook reads the record again, so rows always have the full,
  latest record. Private events only carry an ID, and are skipped when the key
  can't see the incident.
- Incidents keep role assignments, custom field values, timestamps, and
  duration metrics as lists. A custom field with several values has one list
  element per value.
- Test and tutorial incidents are included. Filter on `mode` to leave them
  out.
- incident.io has no incident deletes. Declined, canceled, and merged
  incidents stay, with their status.
- Follow-ups and actions marked deleted keep `status = deleted`. If incident.io
  drops them from its lists instead, the delete isn't seen.
- Archived catalog entries keep `archived_at`. Deleted schedules get
  `_deleted`.
- `schedule_shifts` has shifts that ended in the last 7 days, with overrides
  applied, keyed by the shift's fingerprint. It keeps older shifts it read
  before.
- Deep config, such as workflow steps, escalation paths, and policy rules, is
  stored as JSON text.
- Alert sources leave out their secret token. Users' phone numbers and
  notification rules, call transcripts, pay data, secrets, and API keys aren't
  synced.
- Tables hold names, emails, Slack IDs, and incident text. Treat them as
  confidential.

## Limits

- An API key gets 1,200 requests a minute, and listing incidents 60 a minute.
  A `429` waits for `Retry-After` and tries again.
- Lists for each incident are read again when the incident changes, and every
  5 minutes while it's open (triage, active, or paused).
- `incident_call_sessions` and `incident_participant_workloads` poll on their
  own every 5 minutes, and take no webhooks, so a key without their role only
  stops those tables.
- Workload minutes on `incidents` can lag, because they grow without changing
  `updated_at`. `incident_participant_workloads` is read again while an
  incident is open, and for a day after its last change, because incident.io
  updates workload now and then.
- Settings lists are read in full every hour. Removed items aren't seen.
- Alert notes are read every hour, for the alerts that have notes. Notes on
  alert groups aren't synced, because the API can't list alert groups.
- Removed attachments, relationships, participants, and alert links aren't
  seen.
- A webhook that fails is retried for 24 hours. Polling covers longer
  outages.

## Demo data

`pnpm demo --size 128MiB` writes made-up incident.io data without incident.io
credentials. See the Connector Kit README for the flags and the variables it
needs.

Each incident has the alert that started it, an escalation for serious ones,
status updates with timeline items and activity log entries, participants with
workloads, actions, and workflow runs. Serious incidents also get a post-mortem,
follow-ups, a status page notice, and policy findings for late follow-ups. The
workspace is written once and doesn't grow with the size: users, teams, the
catalog, severities, statuses, types, roles, custom fields, alerting, on-call
schedules with shifts, maintenance windows, workflows, the status page, and
policies.

## Local development

```bash
cd connectors/producer-incident-io
pnpm sandbox
```

`pnpm start` runs the hosted connector. It needs the Wings and PostgreSQL
variables from the [Connector Kit README](../../packages/connector-kit/README.md).

To record the VCR cassette, put a key from a test organization in `.env`, and
run `pnpm test:ci`. Check the new cassette for customer details before
committing it.
