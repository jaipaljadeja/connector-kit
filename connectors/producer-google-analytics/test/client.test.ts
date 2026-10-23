import { describe, expect, it } from "@effect/vitest";
import { Array as Arr, Effect, Fiber, Layer, Metric, Redacted, Ref } from "effect";
import { HttpClient, HttpClientResponse } from "effect/http";
import { TestClock } from "effect/testing";

import { GoogleAnalyticsAuth, GoogleAnalyticsClient } from "../src/index";
import { report } from "./fixtures/reports";

type FakeResponse = { readonly status: number; readonly body: unknown };

const request = {
  dimensions: ["date"],
  metrics: ["sessions"],
  startDate: "2026-10-19",
  endDate: "2026-10-19",
  limit: 1,
  offset: 0,
};

const ok = { status: 200, body: report(request, [["20261019", "12"]]) };

const apiError = (code: number, status: string, message: string) => ({
  status: code,
  body: { error: { code, message, status } },
});

const fakeAuth = Layer.succeed(GoogleAnalyticsAuth.GoogleAnalyticsAuth)({
  get: Effect.succeed(Redacted.make("ya29.test")),
  invalidate: Effect.void,
});

/** Repeats the last response when the sequence runs out. */
const runWith = (responses: Arr.NonEmptyReadonlyArray<FakeResponse>) =>
  Effect.gen(function* () {
    const calls = yield* Ref.make<ReadonlyArray<string>>([]);
    const http = HttpClient.make((sent) =>
      Effect.gen(function* () {
        const list = yield* Ref.updateAndGet(calls, (current) => [
          ...current,
          `${sent.method} ${sent.url} ${sent.headers.authorization ?? ""}`,
        ]);
        const { status, body } = responses[list.length - 1] ?? Arr.lastNonEmpty(responses);
        return HttpClientResponse.fromWeb(
          sent,
          new Response(JSON.stringify(body), {
            status,
            headers: { "content-type": "application/json" },
          }),
        );
      }),
    );

    const result = yield* Effect.gen(function* () {
      const client = yield* GoogleAnalyticsClient.GoogleAnalyticsClient;
      return yield* client.runReport("daily_overview", request);
    }).pipe(
      Effect.match({
        onFailure: (error) => error.message,
        onSuccess: (response) => response.rows?.length ?? 0,
      }),
      Effect.provide(
        Layer.effect(GoogleAnalyticsClient.GoogleAnalyticsClient)(
          GoogleAnalyticsClient.make({ propertyId: "559759765" }),
        ).pipe(Layer.provide(Layer.merge(fakeAuth, Layer.succeed(HttpClient.HttpClient)(http)))),
      ),
    );

    return { result, calls: yield* Ref.get(calls) };
  }).pipe(Effect.provideService(Metric.MetricRegistry, new Map()));

describe("client", () => {
  it.live("sends the bearer token and retries server errors", () =>
    Effect.gen(function* () {
      expect({
        ok: yield* runWith([ok]),
        retriedOnce: (yield* runWith([apiError(503, "UNAVAILABLE", "Try again"), ok])).calls.length,
        empty: (yield* runWith([{ status: 200, body: report(request, []) }])).result,
      }).toMatchInlineSnapshot(`
        {
          "empty": 0,
          "ok": {
            "calls": [
              "POST https://analyticsdata.googleapis.com/v1beta/properties/559759765:runReport Bearer ya29.test",
            ],
            "result": 1,
          },
          "retriedOnce": 2,
        }
      `);
    }),
  );

  it.effect("waits and tries again when a quota is used up", () =>
    Effect.gen(function* () {
      const quota = apiError(429, "RESOURCE_EXHAUSTED", "Exhausted property tokens per hour.");
      // Five quick retries first, then the long wait.
      const fiber = yield* Effect.forkChild(runWith([quota, ...Arr.replicate(quota, 5), ok]));
      yield* TestClock.adjust("5 minutes");
      const { result, calls } = yield* Fiber.join(fiber);
      expect({ result, calls: calls.length }).toMatchInlineSnapshot(`
        {
          "calls": 7,
          "result": 1,
        }
      `);
    }),
  );

  it.live("fails with the API message", () =>
    Effect.gen(function* () {
      expect(
        (yield* runWith([
          apiError(
            403,
            "PERMISSION_DENIED",
            "User does not have sufficient permissions for this property.",
          ),
        ])).result,
      ).toMatchInlineSnapshot(
        `"Google Analytics API returned 403 PERMISSION_DENIED for daily_overview: User does not have sufficient permissions for this property."`,
      );
    }),
  );
});
