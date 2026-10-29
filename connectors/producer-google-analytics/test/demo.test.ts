import { describe, expect, it } from "@effect/vitest";
import { Demo, Ingestor } from "@useairfoil/connector-kit";
import { Effect, Layer, Ref, Schema } from "effect";

import { demo } from "../src/demo";
import {
  DailyOverviewSchema,
  DeviceSchema,
  LocationSchema,
  TrafficSourceSchema,
} from "../src/schemas/reports";

const now = new Date("2026-10-01T00:00:00.000Z");

// Each row counts as a byte, so 1 byte writes one chunk of 30 days.
const generate = Effect.gen(function* () {
  const written = yield* Ref.make<ReadonlyArray<Ingestor.IngestOptions>>([]);

  const layer = Layer.succeed(Ingestor.Ingestor)({
    ingest: (options) =>
      Ref.update(written, (all) => [...all, options]).pipe(
        Effect.as({ rows: options.batch.rows.length, bytes: options.batch.rows.length }),
      ),
  });

  yield* Demo.run(demo, { bytes: 1, seed: 42, now, groupsPerChunk: 30 }).pipe(
    Effect.provide(layer),
  );

  return yield* Ref.get(written);
});

const rowsOf = <S extends Schema.Top>(
  written: ReadonlyArray<Ingestor.IngestOptions>,
  resource: string,
  schema: S,
) =>
  Schema.decodeUnknownSync(Schema.Array(Schema.toType(schema)))(
    written.filter((item) => item.resource === resource).flatMap((item) => item.batch.rows),
  );

const sessionsByDate = (
  rows: ReadonlyArray<{ readonly date: string; readonly sessions: bigint }>,
) => {
  const sums = new Map<string, bigint>();
  for (const row of rows) sums.set(row.date, (sums.get(row.date) ?? 0n) + row.sessions);

  return sums;
};

describe("Google Analytics demo", () => {
  it.effect("writes one day per group, with breakdowns that add up to the day", () =>
    Effect.gen(function* () {
      const written = yield* generate;

      for (const table of demo.group.tables) {
        const ids = written
          .filter((item) => item.resource === table.name)
          .flatMap((item) => item.batch.rows)
          .map((row) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String }))(row).id);

        expect(ids.length, table.name).toBeGreaterThan(0);
        expect(new Set(ids).size, table.name).toBe(ids.length);
      }

      const days = rowsOf(written, "daily_overview", DailyOverviewSchema);
      expect(days.map((row) => row.date).slice(0, 2)).toEqual(["2026-09-30", "2026-09-29"]);
      expect(days[0]?.id).toBe(JSON.stringify(["123456789", "2026-09-30"]));
      const totals = new Map(days.map((row) => [row.date, row.sessions]));

      expect(sessionsByDate(rowsOf(written, "traffic_sources", TrafficSourceSchema))).toEqual(
        totals,
      );

      expect(sessionsByDate(rowsOf(written, "locations", LocationSchema))).toEqual(totals);
      expect(sessionsByDate(rowsOf(written, "devices", DeviceSchema))).toEqual(totals);

      expect(days[0]).toMatchInlineSnapshot(`
        {
          "active_users": 3153n,
          "currency_code": "USD",
          "date": "2026-09-30",
          "engaged_sessions": 2723n,
          "event_count": 42115n,
          "id": "["123456789","2026-09-30"]",
          "key_events": 79,
          "new_users": 1624n,
          "property_id": "123456789",
          "screen_page_views": 15838n,
          "sessions": 4042n,
          "total_revenue": 4779.18,
          "total_users": 3405n,
          "user_engagement_duration": 265802.28,
          "version": 2026-10-01T00:00:00.000Z,
        }
      `);
    }),
  );
});
