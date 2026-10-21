import { ConnectorError } from "@useairfoil/connector-kit";
import { ConfigProvider, DateTime, Effect, Layer, Ref, Schema } from "effect";

import type { GoogleAnalyticsClientService, ReportRequest } from "../src/client/client";

import { GoogleAnalyticsClient, GoogleAnalyticsConnector } from "../src/index";
import { RunReportResponseSchema } from "../src/schemas/api";

export const propertyId = "559759765";

export const testConfig = (extra: Readonly<Record<string, string>> = {}) =>
  ConfigProvider.layer(
    ConfigProvider.fromUnknown({
      GA_PROPERTY_ID: propertyId,
      GA_CLIENT_EMAIL: "reader@test.iam.gserviceaccount.com",
      GA_PRIVATE_KEY: "unused",
      ...extra,
    }),
  );

/** Answers a report request with a response body. */
export type FakeReports = (name: string, request: ReportRequest) => unknown;

/** Uses the real response decoder and records requests for assertions. */
export const makeFakeClient = (fake: FakeReports) =>
  Effect.gen(function* () {
    const requests = yield* Ref.make<ReadonlyArray<string>>([]);
    const client: GoogleAnalyticsClientService = {
      timeZone: Effect.succeed(DateTime.zoneMakeNamedUnsafe("America/Los_Angeles")),
      runReport: (name, request) =>
        Ref.update(requests, (current) => [
          ...current,
          `${name} ${request.startDate}..${request.endDate} +${request.offset}`,
        ]).pipe(
          Effect.andThen(Schema.decodeUnknownEffect(RunReportResponseSchema)(fake(name, request))),
          Effect.mapError(
            (cause) =>
              new ConnectorError({ message: `Fixture for ${name} does not decode`, cause }),
          ),
        ),
    };
    return { client, requests: Ref.get(requests) };
  });

export const connectorLayer = (
  client: GoogleAnalyticsClientService,
  extra: Readonly<Record<string, string>> = {},
) =>
  Layer.effect(GoogleAnalyticsConnector.GoogleAnalyticsConnector)(
    GoogleAnalyticsConnector.GoogleAnalyticsConfigDef.config.pipe(
      Effect.flatMap(GoogleAnalyticsConnector.make),
    ),
  ).pipe(
    Layer.provide(Layer.succeed(GoogleAnalyticsClient.GoogleAnalyticsClient)(client)),
    Layer.provide(testConfig(extra)),
  );

export const plain = (value: unknown): unknown =>
  JSON.parse(JSON.stringify(value, (_key, item) => (typeof item === "bigint" ? `${item}n` : item)));
