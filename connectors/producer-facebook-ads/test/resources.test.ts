import { describe, expect, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { TestClock } from "effect/testing";

import { demo } from "../src/demo";
import { FacebookAdsConnector, manifest } from "../src/index";
import { parseAccounts } from "../src/resources/accounts";
import { AdAccountSchema, AdSchema } from "../src/schemas/objects";
import { tableSchemas } from "../src/tables";
import { ad, adAccount, campaign, page } from "./fixtures/graph";
import { type FakeGraph, connectorLayer, encodeRows, makeFakeClient, plain } from "./helpers";

const now = Date.parse("2026-10-20T17:00:00.000Z");
const cutoff = "2026-10-19T00:00:00.000Z";

type ResourceName = (typeof manifest.resources)[number]["name"];

const getResource = (
  name: ResourceName,
  fake: FakeGraph,
  config: Readonly<Record<string, string>> = {},
) =>
  Effect.gen(function* () {
    yield* TestClock.setTime(now);
    const { client, requests } = yield* makeFakeClient(fake);
    const connector = yield* FacebookAdsConnector.FacebookAdsConnector.pipe(
      Effect.provide(connectorLayer(client, config)),
    );
    const resource = yield* Effect.fromOption(
      Option.fromNullishOr(connector.resources.find((item) => item.name === name)),
    );
    return {
      check: resource.check,
      backfill: yield* Effect.fromOption(Option.fromNullishOr(resource.backfill)),
      changes: yield* Effect.fromOption(Option.fromNullishOr(resource.changes)),
      requests,
    };
  });

describe("resources", () => {
  it.effect("matches the manifest and the table schemas", () =>
    Effect.gen(function* () {
      const { client } = yield* makeFakeClient(() => page([]));
      const connector = yield* FacebookAdsConnector.FacebookAdsConnector.pipe(
        Effect.provide(connectorLayer(client)),
      );

      expect(connector.resources.map((item) => item.name)).toEqual(
        manifest.resources.map((item) => item.name),
      );
      expect(Object.keys(tableSchemas)).toEqual(manifest.resources.map((item) => item.name));
      const demoTables = [...demo.setup.tables, ...demo.group.tables];
      expect(demoTables.map((table) => table.name).toSorted()).toEqual(
        Object.keys(tableSchemas).toSorted(),
      );
      for (const table of demoTables) {
        const resource = connector.resources.find((item) => item.name === table.name);
        expect(table.rowSchema).toBe(resource?.rowSchema);
        expect(table.version).toBe(resource?.version);
      }
    }),
  );

  it.effect("reads the account list", () =>
    Effect.gen(function* () {
      const message = (value: string) =>
        parseAccounts(value).pipe(
          Effect.match({ onFailure: (error) => error.message, onSuccess: (ids) => ids }),
        );

      expect({
        ok: yield* message(" act_123, 456 ,123,"),
        bad: yield* message("123, acme"),
        empty: yield* message(" , "),
      }).toMatchInlineSnapshot(`
        {
          "bad": "FACEBOOK_ADS_ACCOUNT_IDS must be comma-separated ad account IDs, not acme",
          "empty": "FACEBOOK_ADS_ACCOUNT_IDS must be comma-separated ad account IDs",
          "ok": [
            "123",
            "456",
          ],
        }
      `);
    }),
  );

  it.effect("turns ads into rows with their creative", () =>
    Effect.gen(function* () {
      const { backfill } = yield* getResource("ads", () => page([ad]));
      const { rows } = yield* backfill.fetch({ cutoff });
      yield* encodeRows(AdSchema, rows);

      expect(plain(rows[0])).toMatchInlineSnapshot(`
        {
          "account_id": "1234567890",
          "adset_id": "120205000000001",
          "campaign_id": "120200000000001",
          "created_time": "2026-10-01T09:30:00.000Z",
          "creative": {
            "body": "Up to 30% off this week.",
            "call_to_action_type": "SHOP_NOW",
            "id": "120215000000001",
            "name": "Autumn sale creative",
            "object_story_id": "102030405060708_908070605040302",
            "object_type": "SHARE",
            "thumbnail_url": "https://scontent.xx.fbcdn.net/v/t45.1600-4/thumb.jpg",
            "title": "Autumn sale",
          },
          "effective_status": "ACTIVE",
          "id": "120210000000001",
          "name": "Autumn sale - carousel",
          "status": "ACTIVE",
          "updated_time": "2026-10-18T14:05:12.000Z",
          "version": "2026-10-20T17:00:00.000Z",
        }
      `);
    }),
  );

  it.effect("reads ad accounts without the act_ prefix", () =>
    Effect.gen(function* () {
      const { backfill } = yield* getResource("ad_accounts", () => adAccount);
      const { rows } = yield* backfill.fetch({ cutoff });
      yield* encodeRows(AdAccountSchema, rows);

      expect(plain(rows)).toMatchInlineSnapshot(`
        [
          {
            "account_status": "1n",
            "amount_spent": "1834227n",
            "created_time": "2024-03-11T17:22:41.000Z",
            "currency": "USD",
            "disable_reason": "0n",
            "id": "1234567890",
            "name": "Acme Store",
            "spend_cap": "0n",
            "timezone_name": "America/Los_Angeles",
            "timezone_offset_hours_utc": -7,
            "version": "2026-10-20T17:00:00.000Z",
          },
        ]
      `);
    }),
  );

  it.effect("backfills page by page, then the next account", () =>
    Effect.gen(function* () {
      const { backfill, requests } = yield* getResource(
        "campaigns",
        // The first account has a second page.
        (path, params) =>
          path === "/act_111/campaigns" && params.after === undefined
            ? page([campaign], "page2")
            : page([campaign]),
        { FACEBOOK_ADS_ACCOUNT_IDS: "111,222" },
      );
      const cursors: Array<unknown> = [];
      let pageCursor: string | undefined;
      for (;;) {
        const result = yield* backfill.fetch({ cutoff, ...(pageCursor ? { pageCursor } : {}) });
        cursors.push({ rows: result.rows.length, next: result.nextPageCursor });
        if (!result.hasMore) break;
        pageCursor = String(result.nextPageCursor);
      }

      expect({ cursors, requests: yield* requests }).toMatchInlineSnapshot(`
        {
          "cursors": [
            {
              "next": "{"account":"111","after":"page2"}",
              "rows": 1,
            },
            {
              "next": "{"account":"222"}",
              "rows": 1,
            },
            {
              "next": undefined,
              "rows": 1,
            },
          ],
          "requests": [
            "/act_111/campaigns",
            "/act_111/campaigns after=page2",
            "/act_222/campaigns",
          ],
        }
      `);
    }),
  );

  it.effect("reads all ad sets of an account added after backfill", () =>
    Effect.gen(function* () {
      const { changes, requests } = yield* getResource("ad_sets", () => page([]), {
        FACEBOOK_ADS_ACCOUNT_IDS: "111,222",
      });
      // The last run only knew 111.
      const result = yield* changes.fetch({
        cursor: JSON.stringify({ since: cutoff, accounts: ["111"] }),
      });

      expect({ cursor: result.cursor, requests: yield* requests }).toMatchInlineSnapshot(`
        {
          "cursor": "{"since":"2026-10-20T17:00:00.000Z","accounts":["111","222"]}",
          "requests": [
            "/act_111/adsets updated_since=1792367700",
            "/act_222/adsets",
          ],
        }
      `);
    }),
  );

  it.effect("reads changed ad sets, and every campaign", () =>
    Effect.gen(function* () {
      const adSets = yield* getResource("ad_sets", () => page([]));
      const campaigns = yield* getResource("campaigns", () => page([campaign]));
      const adSetRun = yield* adSets.changes.fetch({ cursor: cutoff });
      const campaignRun = yield* campaigns.changes.fetch({ cursor: cutoff });

      expect({
        adSets: { cursor: adSetRun.cursor, requests: yield* adSets.requests },
        campaigns: { rows: campaignRun.rows.length, requests: yield* campaigns.requests },
      }).toMatchInlineSnapshot(`
        {
          "adSets": {
            "cursor": "{"since":"2026-10-20T17:00:00.000Z","accounts":["1234567890"]}",
            "requests": [
              "/act_1234567890/adsets updated_since=1792367700",
            ],
          },
          "campaigns": {
            "requests": [
              "/act_1234567890/campaigns",
            ],
            "rows": 1,
          },
        }
      `);
    }),
  );
});
