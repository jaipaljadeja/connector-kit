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

  yield* Demo.run(demo, { bytes: 1, seed: 42, now, groupsPerChunk: 40 }).pipe(
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

const Pipeline = Schema.Struct({
  id: Schema.String,
  stages: Schema.Array(Schema.Struct({ id: Schema.String })),
});

const CrmRecord = Schema.Struct({ properties: Schema.ReadonlyMap(Schema.String, Schema.String) });

// [table, pipeline property, stage property]
const stageProperties = [
  ["deals", "pipeline", "dealstage"],
  ["tickets", "hs_pipeline", "hs_pipeline_stage"],
  ["leads", "hs_pipeline", "hs_pipeline_stage"],
] as const;

// [table, field, table the field points to]
const references = [
  ["contacts", "company_ids", "companies"],
  ["deals", "company_ids", "companies"],
  ["deals", "contact_ids", "contacts"],
  ["line_items", "deal_ids", "deals"],
  ["deal_split", "deal_ids", "deals"],
  ["quotes", "company_ids", "companies"],
  ["quotes", "contact_ids", "contacts"],
  ["quotes", "deal_ids", "deals"],
  ["tickets", "company_ids", "companies"],
  ["tickets", "contact_ids", "contacts"],
  ["calls", "contact_ids", "contacts"],
  ["calls", "deal_ids", "deals"],
  ["calls", "ticket_ids", "tickets"],
  ["emails", "company_ids", "companies"],
  ["emails", "contact_ids", "contacts"],
  ["emails", "deal_ids", "deals"],
  ["meetings", "contact_ids", "contacts"],
  ["notes", "contact_ids", "contacts"],
  ["tasks", "contact_ids", "contacts"],
  ["communications", "contact_ids", "contacts"],
  ["feedback_submissions", "contact_ids", "contacts"],
  ["leads", "company_ids", "companies"],
  ["leads", "contact_ids", "contacts"],
  ["invoices", "deal_ids", "deals"],
  ["orders", "deal_ids", "deals"],
  ["commerce_payments", "deal_ids", "deals"],
  ["subscriptions", "deal_ids", "deals"],
  ["carts", "deal_ids", "deals"],
  ["custom_objects", "company_ids", "companies"],
  ["custom_objects", "deal_ids", "deals"],
] as const;

describe("HubSpot demo", () => {
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

      const stages = new Set(
        (tables.get("pipelines") ?? []).flatMap((row) => {
          const pipeline = Schema.decodeUnknownSync(Pipeline)(row);
          return pipeline.stages.map((stage) => `${pipeline.id}/${stage.id}`);
        }),
      );

      const unknownStages = stageProperties.flatMap(([table, pipeline, stage]) =>
        (tables.get(table) ?? []).flatMap((row) => {
          const { properties } = Schema.decodeUnknownSync(CrmRecord)(row);
          const value = `${properties.get(pipeline)}/${properties.get(stage)}`;
          return stages.has(value) ? [] : [`${table} ${value}`];
        }),
      );

      expect(unknownStages).toEqual([]);

      expect(tables.get("deals")?.[0]).toMatchInlineSnapshot(`
        {
          "_deleted": false,
          "company_ids": [
            "10000000000",
          ],
          "contact_ids": [
            "20000000000",
            "20000000001",
          ],
          "created_at": 2026-08-24T15:20:21.119Z,
          "id": "30000000000",
          "properties": Map {
            "hs_object_id" => "30000000000",
            "createdate" => "2026-08-24T15:20:21.119Z",
            "hs_lastmodifieddate" => "2026-08-26T03:54:02.414Z",
            "dealname" => "Bashirian LLC - Professional plan",
            "amount" => "18000",
            "dealstage" => "closedwon",
            "pipeline" => "default",
            "closedate" => "2026-08-26T03:54:02.414Z",
            "hubspot_owner_id" => "70000002",
            "hs_deal_stage_probability" => "1.0",
            "deal_currency_code" => "USD",
            "hs_is_closed_won" => "true",
          },
          "updated_at": 2026-08-26T03:54:02.414Z,
          "version": 2026-10-01T00:00:00.000Z,
        }
      `);
    }),
  );
});
