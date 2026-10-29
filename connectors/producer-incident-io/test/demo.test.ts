import { describe, expect, it } from "@effect/vitest";
import { Demo, Ingestor } from "@useairfoil/connector-kit";
import { Effect, Layer, Ref, Schema } from "effect";

import { demo } from "../src/demo";

const now = new Date("2026-10-01T00:00:00.000Z");

// Only group rows count toward the size, so 1 byte writes the setup tables and one chunk.
const groupTables = new Set<string>(demo.group.tables.map((table) => table.name));

const generate = Effect.gen(function* () {
  const written = yield* Ref.make<ReadonlyArray<Ingestor.IngestOptions>>([]);

  const layer = Layer.succeed(Ingestor.Ingestor)({
    ingest: (options) =>
      Ref.update(written, (all) => [...all, options]).pipe(
        Effect.as({
          rows: options.batch.rows.length,
          bytes: groupTables.has(options.resource) ? options.batch.rows.length : 0,
        }),
      ),
  });

  yield* Demo.run(demo, { bytes: 1, seed: 42, now, groupsPerChunk: 60 }).pipe(
    Effect.provide(layer),
  );

  return yield* Ref.get(written);
});

const Row = Schema.Record(Schema.String, Schema.Unknown);
const isList = Schema.is(Schema.Array(Schema.Unknown));

const tablesOf = (written: ReadonlyArray<Ingestor.IngestOptions>) => {
  const tables = new Map<string, Array<Schema.Schema.Type<typeof Row>>>();

  for (const { resource, batch } of written) {
    const rows = tables.get(resource) ?? [];
    rows.push(...batch.rows.map((row) => Schema.decodeUnknownSync(Row)(row)));
    tables.set(resource, rows);
  }

  return tables;
};

const Update = Schema.Struct({
  incident_id: Schema.String,
  created_at: Schema.Date,
  new_status_id: Schema.String,
});

// [table, field, table the field points to]
const references = [
  ["incidents", "status_id", "incident_statuses"],
  ["incidents", "severity_id", "severities"],
  ["incidents", "incident_type_id", "incident_types"],
  ["incidents", "creator_alert_id", "alerts"],
  ["incidents", "team_ids", "teams"],
  ["incidents", "postmortem_document_ids", "postmortem_documents"],
  ["incident_updates", "incident_id", "incidents"],
  ["incident_updates", "new_status_id", "incident_statuses"],
  ["incident_updates", "updater_user_id", "users"],
  ["incident_timeline_items", "incident_id", "incidents"],
  ["incident_timeline_items", "activity_log_id", "incident_activity_log_entries"],
  ["incident_activity_log_entries", "incident_id", "incidents"],
  ["incident_participants", "incident_id", "incidents"],
  ["incident_participants", "user_id", "users"],
  ["incident_relationships", "incident_id", "incidents"],
  ["incident_relationships", "related_incident_id", "incidents"],
  ["incident_attachments", "incident_id", "incidents"],
  ["incident_alerts", "incident_id", "incidents"],
  ["incident_alerts", "alert_id", "alerts"],
  ["incident_alerts", "alert_route_id", "alert_routes"],
  ["incident_call_sessions", "incident_id", "incidents"],
  ["incident_participant_workloads", "incident_id", "incidents"],
  ["incident_participant_workloads", "user_id", "users"],
  ["postmortem_documents", "incident_id", "incidents"],
  ["postmortem_documents", "editor_ids", "users"],
  ["follow_ups", "incident_id", "incidents"],
  ["follow_ups", "assignee_id", "users"],
  ["follow_ups", "assignee_team_id", "teams"],
  ["actions", "incident_id", "incidents"],
  ["actions", "assignee_id", "users"],
  ["alerts", "alert_source_id", "alert_sources"],
  ["alert_notes", "alert_id", "alerts"],
  ["escalations", "escalation_path_id", "escalation_paths"],
  ["escalations", "related_incident_ids", "incidents"],
  ["escalations", "related_alert_ids", "alerts"],
  ["workflow_runs", "workflow_id", "workflows"],
  ["workflow_runs", "incident_id", "incidents"],
  ["status_page_incidents", "status_page_id", "status_pages"],
  ["policy_findings", "policy_id", "policies"],
  ["policy_findings", "responsible_user_ids", "users"],
  ["teams", "member_ids", "users"],
  ["teams", "catalog_entry_id", "catalog_entries"],
  ["catalog_entries", "catalog_type_id", "catalog_types"],
  ["custom_field_options", "custom_field_id", "custom_fields"],
  ["escalation_paths", "team_ids", "teams"],
  ["schedules", "team_ids", "teams"],
  ["schedule_shifts", "schedule_id", "schedules"],
  ["schedule_shifts", "user_id", "users"],
  ["schedule_overrides", "schedule_id", "schedules"],
  ["schedule_overrides", "user_id", "users"],
  ["on_call_notification_pauses", "user_id", "users"],
  ["maintenance_windows", "lead_user_id", "users"],
  ["status_page_maintenances", "status_page_id", "status_pages"],
] as const;

describe("incident.io demo", () => {
  it.effect("writes every table with unique keys and links that resolve", () =>
    Effect.gen(function* () {
      const tables = tablesOf(yield* generate);
      const names = [...demo.setup.tables, ...demo.group.tables].map((table) => table.name);

      for (const name of names) {
        const keys = (tables.get(name) ?? []).map((row) => row.id ?? row.key);
        expect(keys.length, name).toBeGreaterThan(0);
        expect(new Set(keys).size, name).toBe(keys.length);
      }

      const missing = references.flatMap(([from, field, to]) => {
        const ids = new Set((tables.get(to) ?? []).map((row) => row.id));

        return (tables.get(from) ?? []).flatMap((row) => {
          const value = row[field];

          // Some fields hold a list of IDs.
          return (isList(value) ? value : [value])
            .filter((id) => id !== null && !ids.has(id))
            .map((id) => `${from}.${field} = ${String(id)}`);
        });
      });

      expect(missing).toEqual([]);

      // Status updates run in order and end at the incident's status.
      const updates = Object.groupBy(
        (tables.get("incident_updates") ?? []).map((row) => Schema.decodeUnknownSync(Update)(row)),
        (update) => update.incident_id,
      );

      const outOfOrder = (tables.get("incidents") ?? []).flatMap((incident) => {
        const list = updates[String(incident.id)] ?? [];
        const ordered = list.every(
          (update, k) => (list[k - 1]?.created_at ?? update.created_at) <= update.created_at,
        );
        return ordered && list.at(-1)?.new_status_id === incident.status_id ? [] : [incident.id];
      });

      expect(outOfOrder).toEqual([]);

      expect(tables.get("incidents")?.[0]).toMatchInlineSnapshot(`
        {
          "call_url": "https://meet.example.com/inc-1-push-notifications-delayed",
          "created_at": 2026-08-19T04:36:19.772Z,
          "creator_alert_id": "01JDALR0000000000000000000",
          "creator_api_key_id": null,
          "creator_user_id": null,
          "creator_workflow_id": null,
          "custom_field_values": [
            {
              "catalog_entry_id": "01JDCES0000000000000000004",
              "catalog_entry_name": "Notifications",
              "custom_field_id": "01JDCFD0000000000000000000",
              "custom_field_name": "Affected service",
              "field_type": "single_select",
              "option_id": null,
              "option_value": null,
              "value_link": null,
              "value_numeric": null,
              "value_text": null,
            },
            {
              "catalog_entry_id": null,
              "catalog_entry_name": null,
              "custom_field_id": "01JDCFD0000000000000000001",
              "custom_field_name": "Customer impact",
              "field_type": "single_select",
              "option_id": "01JDCFO0000000000000000003",
              "option_value": "All customers",
              "value_link": null,
              "value_numeric": null,
              "value_text": null,
            },
          ],
          "duration_metrics": [
            {
              "metric_id": "01JDDMT0000000000000000000",
              "name": "Time to fix",
              "status": "success",
              "value_seconds": 19277n,
            },
            {
              "metric_id": "01JDDMT0000000000000000001",
              "name": "Duration",
              "status": "success",
              "value_seconds": 24801n,
            },
          ],
          "external_issue_name": null,
          "external_issue_permalink": null,
          "external_issue_provider": null,
          "has_debrief": true,
          "id": "01JDINC0000000000000000000",
          "incident_type_id": "01JDITY0000000000000000000",
          "incident_type_name": "Default",
          "last_activity_at": 2026-08-19T11:25:16.636Z,
          "mode": "standard",
          "ms_teams_channel_url": null,
          "name": "Push notifications delayed",
          "permalink": "https://app.incident.io/acme/incidents/1",
          "postmortem_document_ids": [
            "01JDPMD0000000000000000000",
          ],
          "postmortem_document_url": "https://app.incident.io/acme/incidents/1/post-mortem",
          "reference": "INC-1",
          "role_assignments": [
            {
              "assignee_id": "01JDUSR0000000000000000008",
              "role_id": "01JDROL0000000000000000000",
              "role_name": "Incident Lead",
              "role_type": "lead",
            },
            {
              "assignee_id": "01JDUSR0000000000000000008",
              "role_id": "01JDROL0000000000000000001",
              "role_name": "Reporter",
              "role_type": "reporter",
            },
          ],
          "severity_id": "01JDSEV0000000000000000000",
          "severity_name": "Critical",
          "severity_rank": 3n,
          "slack_channel_id": "C0Y0Y1WIZ2J",
          "slack_channel_name": "inc-1-push-notifications-delayed",
          "slack_channel_url": "https://acme.slack.com/archives/C0Y0Y1WIZ2J",
          "slack_team_id": "T0ACMEDEMO",
          "status_category": "learning",
          "status_id": "01JDSTA0000000000000000004",
          "status_name": "Documenting",
          "summary": "A bad deploy broke Notifications. We rolled it back.",
          "team_ids": [
            "01JDTEM0000000000000000000",
          ],
          "timestamps": [
            {
              "name": "Impact started",
              "timestamp_id": "01JDTSP0000000000000000000",
              "value": 2026-08-19T04:31:55.277Z,
            },
            {
              "name": "Reported at",
              "timestamp_id": "01JDTSP0000000000000000001",
              "value": 2026-08-19T04:36:19.772Z,
            },
            {
              "name": "Fixed at",
              "timestamp_id": "01JDTSP0000000000000000002",
              "value": 2026-08-19T09:53:12.740Z,
            },
            {
              "name": "Resolved at",
              "timestamp_id": "01JDTSP0000000000000000003",
              "value": 2026-08-19T11:25:16.636Z,
            },
          ],
          "updated_at": 2026-08-19T11:25:16.636Z,
          "version": 2026-08-19T11:25:16.636Z,
          "visibility": "public",
          "workload_minutes_late": 204,
          "workload_minutes_sleeping": 0,
          "workload_minutes_total": 1238,
          "workload_minutes_working": 1034,
        }
      `);
    }),
  );
});
