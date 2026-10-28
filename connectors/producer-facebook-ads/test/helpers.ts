import { ConnectorError } from "@useairfoil/connector-kit";
import { ConfigProvider, Effect, Layer, Ref, Schema } from "effect";
import { UrlParams } from "effect/http";

import type { FacebookAdsClientService } from "../src/client/client";

import { FacebookAdsClient, FacebookAdsConnector } from "../src/index";

export const testConfig = (extra: Readonly<Record<string, string>> = {}) =>
  ConfigProvider.layer(
    ConfigProvider.fromUnknown({
      FACEBOOK_ADS_ACCESS_TOKEN: "test-token",
      FACEBOOK_ADS_ACCOUNT_IDS: "1234567890",
      ...extra,
    }),
  );

/** Answers a Graph API request with a response body. */
export type FakeGraph = (path: string, params: Readonly<Record<string, string>>) => unknown;

// Left out of the request log to keep snapshots short.
const quietParams = new Set(["fields", "filtering", "level", "time_increment", "limit"]);

/** Uses the real response schemas and records requests for assertions. */
export const makeFakeClient = (fake: FakeGraph) =>
  Effect.gen(function* () {
    const requests = yield* Ref.make<ReadonlyArray<string>>([]);
    const client: FacebookAdsClientService = {
      get: (name, schema, path, input = {}) => {
        const params = Object.fromEntries(new URLSearchParams(UrlParams.toString(input)));
        const shown = Object.entries(params)
          .filter(([key]) => !quietParams.has(key))
          .map(([key, value]) => ` ${key}=${value}`)
          .join("");
        return Ref.update(requests, (current) => [...current, `${path}${shown}`]).pipe(
          Effect.andThen(Schema.decodeUnknownEffect(schema)(fake(path, params))),
          Effect.mapError(
            (cause) =>
              new ConnectorError({ message: `Fixture for ${name} does not decode`, cause }),
          ),
        );
      },
    };
    return { client, requests: Ref.get(requests) };
  });

export const connectorLayer = (
  client: FacebookAdsClientService,
  extra: Readonly<Record<string, string>> = {},
) =>
  Layer.effect(FacebookAdsConnector.FacebookAdsConnector)(
    FacebookAdsConnector.FacebookAdsConfigDef.config.pipe(
      Effect.flatMap(FacebookAdsConnector.make),
    ),
  ).pipe(
    Layer.provide(Layer.succeed(FacebookAdsClient.FacebookAdsClient)(client)),
    Layer.provide(testConfig(extra)),
  );

/** Fails when a row has fields its table doesn't. */
export const encodeRows = <S extends Schema.Top>(schema: S, rows: ReadonlyArray<object>) =>
  Effect.forEach(rows, (row) =>
    Schema.encodeUnknownEffect(schema)(row, { onExcessProperty: "error" }),
  );

/** Rows as JSON, with bigints as `12n` and maps as objects. */
export const plain = (value: unknown): unknown =>
  JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === "bigint" ? `${item}n` : item instanceof Map ? Object.fromEntries(item) : item,
    ),
  );
