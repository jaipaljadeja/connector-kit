import { describe, expect, it } from "@effect/vitest";
import { Metrics, Telemetry } from "@useairfoil/connector-kit";
import { Array as Arr, Effect, Layer, Metric, Option, Redacted, Ref, Schema } from "effect";
import { HttpClient, HttpClientResponse } from "effect/http";

import { IncidentIoClient } from "../src/index";

const config = { apiKey: Redacted.make("inc_test") };

const retryCount = (reason: Metrics.ApiRetryReason) =>
  Metric.value(
    Metric.withAttributes(Metrics.apiRetries, {
      [Telemetry.Attr.connectorName]: "producer-incident-io",
      [Telemetry.Attr.apiRetryReason]: reason,
    }),
  ).pipe(Effect.map((state) => state.count));

type FakeResponse = {
  readonly status: number;
  readonly body: unknown;
  readonly headers?: Readonly<Record<string, string>>;
};

const schema = Schema.Struct({ severities: Schema.Array(Schema.Unknown) });

const findWith = (responses: Arr.NonEmptyReadonlyArray<FakeResponse>) =>
  Effect.gen(function* () {
    const calls = yield* Ref.make<ReadonlyArray<string>>([]);
    const http = HttpClient.make((request) =>
      Ref.getAndUpdate(calls, (items) => [
        ...items,
        `${request.headers.authorization} ${new URL(request.url).pathname}`,
      ]).pipe(
        Effect.map((items) => {
          const { status, body, headers } = responses[items.length] ?? Arr.lastNonEmpty(responses);
          return HttpClientResponse.fromWeb(
            request,
            new Response(JSON.stringify(body), {
              status,
              headers: { "content-type": "application/json", ...headers },
            }),
          );
        }),
      ),
    );

    const result = yield* IncidentIoClient.IncidentIoClient.pipe(
      Effect.flatMap((client) => client.find(schema, "/v1/severities")),
      Effect.match({
        onFailure: (error) => error.message,
        onSuccess: Option.match({
          onNone: () => "not found",
          onSome: (body) => `${body.severities.length} severities`,
        }),
      }),
      Effect.provide(
        IncidentIoClient.layer(config).pipe(
          Layer.provide(Layer.succeed(HttpClient.HttpClient)(http)),
        ),
      ),
    );

    return {
      result,
      calls: yield* Ref.get(calls),
      rateLimitRetries: yield* retryCount("rate_limit"),
      serverErrorRetries: yield* retryCount("server_error"),
    };
  }).pipe(Effect.provideService(Metric.MetricRegistry, new Map()));

describe("client", () => {
  it.live("retries what is temporary, and keeps incident.io's message", () =>
    Effect.gen(function* () {
      const ok = { status: 200, body: { severities: [] } };
      expect({
        ok: yield* findWith([ok]),
        retried: yield* findWith([
          { status: 503, body: {} },
          { status: 429, body: {}, headers: { "retry-after": "0" } },
          ok,
        ]),
        missing: yield* findWith([{ status: 404, body: { type: "not_found" } }]),
        // The error body from the spec's example.
        invalid: yield* findWith([
          {
            status: 400,
            body: {
              type: "invalid_request_error",
              status: 400,
              request_id: "2T1p0e3j",
              errors: [
                {
                  code: "trial_expired",
                  message: "Default incident call link must be a valid URL",
                },
              ],
            },
          },
        ]),
      }).toMatchInlineSnapshot(`
        {
          "invalid": {
            "calls": [
              "Bearer inc_test /v1/severities",
            ],
            "rateLimitRetries": 0,
            "result": "incident.io API returned 400 for /v1/severities: Default incident call link must be a valid URL",
            "serverErrorRetries": 0,
          },
          "missing": {
            "calls": [
              "Bearer inc_test /v1/severities",
            ],
            "rateLimitRetries": 0,
            "result": "not found",
            "serverErrorRetries": 0,
          },
          "ok": {
            "calls": [
              "Bearer inc_test /v1/severities",
            ],
            "rateLimitRetries": 0,
            "result": "0 severities",
            "serverErrorRetries": 0,
          },
          "retried": {
            "calls": [
              "Bearer inc_test /v1/severities",
              "Bearer inc_test /v1/severities",
              "Bearer inc_test /v1/severities",
            ],
            "rateLimitRetries": 1,
            "result": "0 severities",
            "serverErrorRetries": 1,
          },
        }
      `);
    }),
  );
});
