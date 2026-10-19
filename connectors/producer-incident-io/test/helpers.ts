import { ConnectorError, Ingestor } from "@useairfoil/connector-kit";
import { ConfigProvider, Deferred, Effect, Layer, Option, Ref, Schema } from "effect";
import { UrlParams } from "effect/http";
import { Webhook as StandardWebhook } from "standardwebhooks";

import type { IncidentIoClientService } from "../src/client/client";

import { IncidentIoClient, IncidentIoConnector } from "../src/index";

// A Standard Webhooks secret: `whsec_` and base64.
export const webhookSecret = `whsec_${Buffer.from("incident-io-test-secret").toString("base64")}`;

export const testConfig = ConfigProvider.layer(
  ConfigProvider.fromUnknown({
    INCIDENT_IO_API_KEY: "inc_test",
    INCIDENT_IO_WEBHOOK_SECRET: webhookSecret,
  }),
);

export type FakeRequest = {
  readonly path: string;
  readonly params: UrlParams.Input;
};

/** Answers a request with a response body, or undefined for a 404. */
export type FakeIncidentIo = (request: FakeRequest) => unknown;

const decode = <A>(schema: Schema.Decoder<A>, value: unknown, path: string) =>
  Schema.decodeUnknownEffect(schema)(value).pipe(
    Effect.mapError(
      (cause) => new ConnectorError({ message: `Fixture for ${path} does not decode`, cause }),
    ),
  );

/** Uses real decoders and records requests for assertions. */
export const makeFakeClient = (fake: FakeIncidentIo) =>
  Effect.gen(function* () {
    const requests = yield* Ref.make<ReadonlyArray<FakeRequest>>([]);
    const find = <A>(schema: Schema.Decoder<A>, path: string, params: UrlParams.Input = {}) =>
      Effect.gen(function* () {
        const request = { path, params };
        yield* Ref.update(requests, (current) => [...current, request]);
        return yield* Effect.transposeOption(
          Option.fromNullishOr(fake(request)).pipe(
            Option.map((body) => decode(schema, body, path)),
          ),
        );
      });
    const client: IncidentIoClientService = {
      find,
      get: (schema, path, params) =>
        find(schema, path, params).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () =>
                Effect.fail(
                  new ConnectorError({ message: `incident.io API returned 404 for ${path}` }),
                ),
              onSome: Effect.succeed,
            }),
          ),
        ),
    };
    return { client, requests };
  });

export const connectorLayer = (client: IncidentIoClientService) =>
  Layer.effect(IncidentIoConnector.IncidentIoConnector)(
    IncidentIoConnector.IncidentIoConfigDef.config.pipe(Effect.flatMap(IncidentIoConnector.make)),
  ).pipe(
    Layer.provide(Layer.succeed(IncidentIoClient.IncidentIoClient)(client)),
    Layer.provide(testConfig),
  );

export const describeRequest = (request: FakeRequest) =>
  [request.path, decodeURIComponent(UrlParams.toString(UrlParams.fromInput(request.params)))]
    .filter((part) => part !== "")
    .join(" ");

export const param = (request: FakeRequest, key: string) =>
  UrlParams.getFirst(UrlParams.fromInput(request.params), key);

export type Ingested = {
  readonly resource: string;
  readonly source: string;
  readonly batch: { readonly rows: ReadonlyArray<object> };
};

export const makeTestIngestor = (expected: number) =>
  Effect.gen(function* () {
    const ingestedRef = yield* Ref.make<ReadonlyArray<Ingested>>([]);
    const done = yield* Deferred.make<number, never>();
    const layer = Layer.succeed(Ingestor.Ingestor)({
      ingest: ({ resource, source, batch }) =>
        Effect.gen(function* () {
          const next = yield* Ref.updateAndGet(ingestedRef, (items) => [
            ...items,
            { resource, source, batch },
          ]);
          if (next.length === expected) {
            yield* Deferred.succeed(done, next.length);
          }
        }),
    });

    return { ingestedRef, done, layer };
  });

/** Standard Webhooks headers for a body, signed now unless a time is given. */
export const signedHeaders = (body: string, time = new Date()) => {
  const id = "msg_test";
  const signature = new StandardWebhook(webhookSecret).sign(id, time, body);
  return {
    "webhook-id": id,
    "webhook-timestamp": String(Math.floor(time.getTime() / 1000)),
    "webhook-signature": signature,
  };
};

export const plain = (value: unknown): unknown =>
  JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === "bigint" ? `${item}n` : item instanceof Map ? Object.fromEntries(item) : item,
    ),
  );

export const pick = (rows: ReadonlyArray<object>, keys: ReadonlyArray<string>) =>
  plain(
    rows.map((row) =>
      Object.fromEntries(Object.entries(row).filter(([key]) => keys.includes(key))),
    ),
  );
