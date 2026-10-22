import { NodeServices } from "@effect/platform-node";
import { describe, expect, it } from "@effect/vitest";
import { ConnectorApp } from "@useairfoil/connector-kit";
import { FileSystemCassetteStore, VcrHttpClient } from "@useairfoil/effect-vcr";
import { ConfigProvider, Effect, Layer, Option } from "effect";
import { FetchHttpClient } from "effect/http";
import { TestClock } from "effect/testing";
import { existsSync } from "node:fs";

import { FacebookAdsConnector } from "../src/index";
import { plain } from "./helpers";

// Needs a cassette, or a token to record one. See the README.
const canRun =
  existsSync(new URL("./__cassettes__/api.vcr.test.cassette", import.meta.url)) ||
  process.env.FACEBOOK_ADS_ACCESS_TOKEN !== undefined;

// Fixed days, so the requests are the same on replay. Set them near the
// recording time. The sandbox account never delivers, so insights are empty.
const configLayer = ConfigProvider.layer(
  ConfigProvider.fromUnknown({
    FACEBOOK_ADS_START_DATE: "2026-10-17",
    FACEBOOK_ADS_LOOKBACK_DAYS: "3",
  }).pipe(
    ConfigProvider.orElse(ConfigProvider.fromEnv()),
    ConfigProvider.orElse(
      ConfigProvider.fromUnknown({
        FACEBOOK_ADS_ACCESS_TOKEN: "placeholder",
        FACEBOOK_ADS_ACCOUNT_IDS: "1733560591063328",
      }),
    ),
  ),
);

// `Authorization` is redacted by default.
const connectorLayer = FacebookAdsConnector.layerConfig(
  FacebookAdsConnector.FacebookAdsConfigDef.config,
).pipe(
  Layer.provide(
    VcrHttpClient.layer({ vcrName: "producer-facebook-ads" }).pipe(
      Layer.provide(FileSystemCassetteStore.layer()),
      Layer.provide(Layer.merge(NodeServices.layer, FetchHttpClient.layer)),
    ),
  ),
  Layer.provide(configLayer),
);

const now = Date.parse("2026-10-21T18:00:00.000Z");
const cutoff = "2026-10-20T18:00:00.000Z";

describe.skipIf(!canRun)("Facebook Ads API (vcr)", () => {
  it.effect(
    "checks, backfills, and reads changes for every resource",
    () =>
      Effect.gen(function* () {
        yield* TestClock.setTime(now);
        const built = Layer.succeedContext(yield* Layer.build(connectorLayer));
        const connector = yield* FacebookAdsConnector.FacebookAdsConnector.pipe(
          Effect.provide(built),
        );
        const check = yield* ConnectorApp.check(FacebookAdsConnector.FacebookAdsConnector, built, {
          resources: connector.resources.map((resource) => resource.name),
        });

        const results: Record<string, string> = {};
        // One real row, to check the field types.
        let adSet: unknown;
        for (const resource of connector.resources) {
          const backfill = yield* Effect.fromOption(Option.fromNullishOr(resource.backfill));
          const changes = yield* Effect.fromOption(Option.fromNullishOr(resource.changes));
          let backfilled = 0;
          let pageCursor: string | undefined;
          for (;;) {
            const page = yield* backfill.fetch({ cutoff, ...(pageCursor ? { pageCursor } : {}) });
            backfilled += page.rows.length;
            if (resource.name === "ad_sets") adSet ??= plain(page.rows[0]);
            if (!page.hasMore) break;
            pageCursor = String(page.nextPageCursor);
          }
          let changed = 0;
          let cursor = cutoff;
          for (;;) {
            const result = yield* changes.fetch({ cursor });
            changed += result.rows.length;
            cursor = String(result.cursor);
            if (result.hasMore !== true) break;
          }
          results[resource.name] = `${backfilled} backfilled, ${changed} changed`;
        }

        expect({
          failedChecks: Object.entries(check).flatMap(([name, result]) =>
            result._tag === "ok" ? [] : [name],
          ),
          results,
          adSet,
        }).toMatchInlineSnapshot(`
          {
            "adSet": {
              "account_id": "1733560591063328",
              "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
              "billing_event": "IMPRESSIONS",
              "budget_remaining": "500000n",
              "campaign_id": "120330000133333115",
              "created_time": "2026-10-22T16:33:48.000Z",
              "daily_budget": "0n",
              "destination_type": "UNDEFINED",
              "effective_status": "ARCHIVED",
              "end_time": "2026-11-29T18:30:00.000Z",
              "id": "120330000133341115",
              "lifetime_budget": "500000n",
              "name": "Old audience",
              "optimization_goal": "REACH",
              "start_time": "2026-10-24T18:30:00.000Z",
              "status": "ARCHIVED",
              "updated_time": "2026-10-22T16:34:26.000Z",
              "version": "2026-10-21T18:00:00.000Z",
            },
            "failedChecks": [],
            "results": {
              "ad_accounts": "1 backfilled, 1 changed",
              "ad_sets": "3 backfilled, 3 changed",
              "ads": "0 backfilled, 0 changed",
              "ads_insights": "0 backfilled, 0 changed",
              "ads_insights_age_gender": "0 backfilled, 0 changed",
              "ads_insights_country": "0 backfilled, 0 changed",
              "ads_insights_platform": "0 backfilled, 0 changed",
              "campaigns": "4 backfilled, 4 changed",
            },
          }
        `);
      }),
    { timeout: 600_000 },
  );
});
