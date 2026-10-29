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

  yield* Demo.run(demo, { bytes: 1, seed: 42, now, groupsPerChunk: 3 }).pipe(Effect.provide(layer));

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

// The fields a breakdown must add up to the ad's day.
const Counts = Schema.Struct({
  ad_id: Schema.String,
  date: Schema.String,
  impressions: Schema.BigInt,
  clicks: Schema.BigInt,
  inline_link_clicks: Schema.BigInt,
  spend: Schema.Number,
  actions: Schema.ReadonlyMap(Schema.String, Schema.Number),
});

// [table, field, table the field points to]
const references = [
  ["campaigns", "account_id", "ad_accounts"],
  ["ad_sets", "campaign_id", "campaigns"],
  ["ads", "adset_id", "ad_sets"],
  ["ads", "campaign_id", "campaigns"],
  ["ads_insights", "ad_id", "ads"],
  ["ads_insights", "adset_id", "ad_sets"],
  ["ads_insights", "campaign_id", "campaigns"],
  ["ads_insights", "account_id", "ad_accounts"],
  ["ads_insights_age_gender", "ad_id", "ads"],
  ["ads_insights_country", "ad_id", "ads"],
  ["ads_insights_platform", "ad_id", "ads"],
] as const;

describe("Facebook Ads demo", () => {
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

      const sums = (name: string) => {
        const totals = new Map<string, readonly [bigint, number, number]>();

        for (const row of tables.get(name) ?? []) {
          const { ad_id, date, impressions, spend, actions } =
            Schema.decodeUnknownSync(Counts)(row);
          const key = `${ad_id} ${date}`;
          const [shown, cents, purchases] = totals.get(key) ?? [0n, 0, 0];

          totals.set(key, [
            shown + impressions,
            cents + Math.round(spend * 100),
            purchases + (actions.get("purchase") ?? 0),
          ]);
        }

        return totals;
      };

      const days = sums("ads_insights");

      const breakdowns = [
        "ads_insights_age_gender",
        "ads_insights_country",
        "ads_insights_platform",
      ];

      for (const name of breakdowns) {
        expect(sums(name), name).toEqual(days);
      }

      // Each row keeps the funnel in order: purchases, landing views, link clicks,
      // clicks, impressions.
      const outOfOrder = breakdowns.flatMap((name) =>
        (tables.get(name) ?? []).flatMap((row) => {
          const { impressions, clicks, inline_link_clicks, actions } =
            Schema.decodeUnknownSync(Counts)(row);

          const funnel = [
            actions.get("purchase") ?? 0,
            actions.get("landing_page_view") ?? 0,
            Number(inline_link_clicks),
            Number(clicks),
            Number(impressions),
          ];

          return funnel.every((count, k) => count <= (funnel[k + 1] ?? count)) ? [] : [name];
        }),
      );

      expect(outOfOrder).toEqual([]);

      expect(tables.get("ads_insights")?.[0]).toMatchInlineSnapshot(`
        {
          "account_currency": "USD",
          "account_id": "1033000000000001",
          "action_values": Map {
            "purchase" => 139.89,
          },
          "actions": Map {
            "link_click" => 43,
            "landing_page_view" => 34,
            "purchase" => 2,
          },
          "ad_id": "120230000000000000",
          "adset_id": "120220000000000000",
          "campaign_id": "120210000000000000",
          "clicks": 61n,
          "conversion_values": Map {
            "purchase" => 139.89,
          },
          "conversions": Map {
            "purchase" => 2,
          },
          "date": "2026-10-01",
          "id": "["1033000000000001","120230000000000000","2026-10-01"]",
          "impressions": 3169n,
          "inline_link_clicks": 43n,
          "reach": 2599n,
          "spend": 27.2,
          "version": 2026-10-01T00:00:00.000Z,
        }
      `);
    }),
  );
});
