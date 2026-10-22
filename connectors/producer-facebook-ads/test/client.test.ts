import { describe, expect, it } from "@effect/vitest";
import { Array as Arr, Effect, Fiber, Layer, Metric, Redacted, Ref } from "effect";
import { HttpClient, HttpClientResponse, UrlParams } from "effect/http";
import { TestClock } from "effect/testing";

import { FacebookAdsClient } from "../src/index";
import { PageSchema } from "../src/schemas/api";
import { CampaignApiSchema } from "../src/schemas/objects";
import { campaign, page } from "./fixtures/graph";

type FakeResponse = { readonly status: number; readonly body: unknown };

const ok = { status: 200, body: page([campaign]) };

const apiError = (status: number, code: number, message: string, subcode?: number) => ({
  status,
  body: {
    error: { message, type: "OAuthException", code, error_subcode: subcode, fbtrace_id: "A1b2C3" },
  },
});

/** Repeats the last response when the sequence runs out. */
const runWith = (responses: Arr.NonEmptyReadonlyArray<FakeResponse>) =>
  Effect.gen(function* () {
    const calls = yield* Ref.make<ReadonlyArray<string>>([]);
    const http = HttpClient.make((sent) =>
      Effect.gen(function* () {
        const list = yield* Ref.updateAndGet(calls, (current) => [
          ...current,
          `${sent.method} ${sent.url}?${UrlParams.toString(sent.urlParams)} ${sent.headers.authorization ?? ""}`,
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
      const client = yield* FacebookAdsClient.FacebookAdsClient;
      return yield* client.get("campaigns", PageSchema(CampaignApiSchema), "/act_1/campaigns", {
        fields: "id,name",
        effective_status: JSON.stringify(["ACTIVE"]),
      });
    }).pipe(
      Effect.match({
        onFailure: (error) => error.message,
        onSuccess: (response) => response.data.length,
      }),
      Effect.provide(
        Layer.effect(FacebookAdsClient.FacebookAdsClient)(
          FacebookAdsClient.make({ accessToken: Redacted.make("EAAtest") }),
        ).pipe(Layer.provide(Layer.succeed(HttpClient.HttpClient)(http))),
      ),
    );

    return { result, calls: yield* Ref.get(calls) };
  }).pipe(Effect.provideService(Metric.MetricRegistry, new Map()));

describe("client", () => {
  it.live("sends the bearer token and retries server errors", () =>
    Effect.gen(function* () {
      expect({
        ok: yield* runWith([ok]),
        retriedOnce: (yield* runWith([apiError(500, 1, "An unknown error occurred"), ok])).calls
          .length,
        retryLater: (yield* runWith([apiError(400, 2, "Please retry your request later."), ok]))
          .calls.length,
      }).toMatchInlineSnapshot(`
        {
          "ok": {
            "calls": [
              "GET https://graph.facebook.com/v26.0/act_1/campaigns?fields=id%2Cname&effective_status=%5B%22ACTIVE%22%5D Bearer EAAtest",
            ],
            "result": 1,
          },
          "retriedOnce": 2,
          "retryLater": 2,
        }
      `);
    }),
  );

  it.effect("waits and tries again when a usage limit is hit", () =>
    Effect.gen(function* () {
      const limited = apiError(400, 80000, "There have been too many calls from this ad-account.");
      const fiber = yield* Effect.forkChild(runWith([limited, limited, ok]));
      yield* TestClock.adjust("5 minutes");
      const { result, calls } = yield* Fiber.join(fiber);
      expect({ result, calls: calls.length }).toMatchInlineSnapshot(`
        {
          "calls": 3,
          "result": 1,
        }
      `);
    }),
  );

  it.live("fails with the API message", () =>
    Effect.gen(function* () {
      expect(
        (yield* runWith([
          apiError(401, 190, "Error validating access token: The session has been invalidated."),
        ])).result,
      ).toMatchInlineSnapshot(
        `"Facebook Ads API returned 401 (code 190) for campaigns: Error validating access token: The session has been invalidated."`,
      );
    }),
  );
});
