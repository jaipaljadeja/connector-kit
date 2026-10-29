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

const isFields = Schema.is(Schema.ReadonlyMap(Schema.String, Schema.String));

// References are API names in the `fields` map.
const fieldsOf = (row: Schema.Schema.Type<typeof Row>) =>
  isFields(row.fields) ? row.fields : new Map<string, string>();

const tablesOf = (written: ReadonlyArray<Ingestor.IngestOptions>) => {
  const tables = new Map<string, Array<Schema.Schema.Type<typeof Row>>>();

  for (const { resource, batch } of written) {
    const rows = tables.get(resource) ?? [];
    rows.push(...batch.rows.map((row) => Schema.decodeUnknownSync(Row)(row)));
    tables.set(resource, rows);
  }

  return tables;
};

// [table, field, table the field points to]
const references = [
  ["contacts", "AccountId", "accounts"],
  ["contacts", "OwnerId", "users"],
  ["account_contact_relations", "ContactId", "contacts"],
  ["opportunities", "AccountId", "accounts"],
  ["opportunities", "CampaignId", "campaigns"],
  ["opportunities", "Pricebook2Id", "pricebooks"],
  ["opportunity_line_items", "OpportunityId", "opportunities"],
  ["opportunity_line_items", "Product2Id", "products"],
  ["opportunity_line_items", "PricebookEntryId", "pricebook_entries"],
  ["opportunity_contact_roles", "OpportunityId", "opportunities"],
  ["opportunity_contact_roles", "ContactId", "contacts"],
  ["opportunity_history", "OpportunityId", "opportunities"],
  ["opportunity_field_history", "OpportunityId", "opportunities"],
  ["opportunity_splits", "OpportunityId", "opportunities"],
  ["opportunity_team_members", "UserId", "users"],
  ["quotes", "OpportunityId", "opportunities"],
  ["quote_line_items", "QuoteId", "quotes"],
  ["contracts", "AccountId", "accounts"],
  ["contract_contact_roles", "ContractId", "contracts"],
  ["orders", "ContractId", "contracts"],
  ["orders", "OpportunityId", "opportunities"],
  ["order_items", "OrderId", "orders"],
  ["assets", "AccountId", "accounts"],
  ["assets", "Product2Id", "products"],
  ["asset_relationships", "AssetId", "assets"],
  ["service_contracts", "AccountId", "accounts"],
  ["contract_line_items", "ServiceContractId", "service_contracts"],
  ["entitlements", "ServiceContractId", "service_contracts"],
  ["cases", "AccountId", "accounts"],
  ["cases", "ContactId", "contacts"],
  ["cases", "OwnerId", "users"],
  ["case_comments", "ParentId", "cases"],
  ["case_contact_roles", "CasesId", "cases"],
  ["case_team_members", "ParentId", "cases"],
  ["case_history", "CaseId", "cases"],
  ["email_messages", "ParentId", "cases"],
  ["email_message_relations", "EmailMessageId", "email_messages"],
  ["live_chat_transcripts", "CaseId", "cases"],
  ["messaging_sessions", "CaseId", "cases"],
  ["work_orders", "AccountId", "accounts"],
  ["work_orders", "ServiceTerritoryId", "service_territories"],
  ["work_order_line_items", "WorkOrderId", "work_orders"],
  ["service_appointments", "ParentRecordId", "work_orders"],
  ["assigned_resources", "ServiceAppointmentId", "service_appointments"],
  ["assigned_resources", "ServiceResourceId", "service_resources"],
  ["tasks", "OwnerId", "users"],
  ["task_relations", "TaskId", "tasks"],
  ["events", "OwnerId", "users"],
  ["event_relations", "EventId", "events"],
  ["notes", "ParentId", "accounts"],
  ["feed_items", "ParentId", "accounts"],
  ["feed_comments", "FeedItemId", "feed_items"],
  ["topic_assignments", "TopicId", "topics"],
  ["leads", "OwnerId", "users"],
  ["lead_history", "LeadId", "leads"],
  ["campaign_members", "CampaignId", "campaigns"],
  ["individuals", "Id", "individuals"],
  ["contact_point_emails", "ParentId", "individuals"],
  ["contact_point_phones", "ParentId", "individuals"],
  ["duplicate_record_items", "DuplicateRecordSetId", "duplicate_record_sets"],
  ["custom_objects", "Account__c", "accounts"],
  ["pricebook_entries", "Product2Id", "products"],
  ["users", "ProfileId", "profiles"],
  ["users", "UserRoleId", "user_roles"],
  ["permission_set_assignments", "PermissionSetId", "permission_sets"],
  ["group_members", "GroupId", "groups"],
  ["collaboration_group_members", "CollaborationGroupId", "collaboration_groups"],
  ["campaign_member_statuses", "CampaignId", "campaigns"],
  ["service_resources", "RelatedRecordId", "users"],
  ["resource_absences", "ResourceId", "service_resources"],
  ["product_items", "LocationId", "locations"],
  ["documents", "FolderId", "folders"],
] as const;

describe("Salesforce demo", () => {
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
          const value = fieldsOf(row).get(field) ?? null;

          // Some fields hold a list of IDs.
          return (isList(value) ? value : [value])
            .filter((id) => id !== null && !ids.has(id))
            .map((id) => `${from}.${field} = ${String(id)}`);
        });
      });

      expect(missing).toEqual([]);

      // Stage history runs in order and ends when the opportunity last changed.
      const lastChanged = new Map(
        (tables.get("opportunities") ?? []).map((row) => [
          row.id,
          fieldsOf(row).get("LastModifiedDate"),
        ]),
      );

      const history = Object.groupBy(
        tables.get("opportunity_history") ?? [],
        (row) => fieldsOf(row).get("OpportunityId") ?? "",
      );

      const outOfOrder = Object.entries(history).flatMap(([id, rows]) => {
        const times = (rows ?? []).map((row) => fieldsOf(row).get("CreatedDate") ?? "");
        const ordered = times.every((time, k) => (times[k - 1] ?? time) <= time);
        return ordered && times.at(-1) === lastChanged.get(id) ? [] : [id];
      });

      expect(outOfOrder).toEqual([]);

      expect(tables.get("opportunities")?.[0]).toMatchInlineSnapshot(`
        {
          "_deleted": false,
          "created_at": 2025-04-04T04:30:47.051Z,
          "fields": Map {
            "Id" => "006Dm0000000000AAQ",
            "CreatedDate" => "2025-04-04T04:30:47.051+0000",
            "LastModifiedDate" => "2025-04-04T04:30:47.051+0000",
            "SystemModstamp" => "2025-04-04T04:30:47.051+0000",
            "IsDeleted" => "false",
            "AccountId" => "001Dm0000000000AAQ",
            "Name" => "Schoen - Brown - Analytics Cloud",
            "StageName" => "Qualification",
            "Probability" => "20",
            "Amount" => "44000",
            "CloseDate" => "2025-06-03",
            "IsClosed" => "false",
            "IsWon" => "false",
            "Type" => "New Business",
            "LeadSource" => "Web",
            "ForecastCategoryName" => "Pipeline",
            "OwnerId" => "005Dm0000000007AAQ",
            "Pricebook2Id" => "01sDm0000000000AAQ",
            "CampaignId" => "701Dm0000000000AAQ",
            "RecordTypeId" => "012Dm0000000000AAQ",
          },
          "id": "006Dm0000000000AAQ",
          "updated_at": 2025-04-04T04:30:47.051Z,
          "version": 2026-10-01T00:00:00.000Z,
        }
      `);
    }),
  );
});
