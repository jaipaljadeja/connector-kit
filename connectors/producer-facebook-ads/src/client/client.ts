import { ConnectorError, Metrics, Telemetry } from "@useairfoil/connector-kit";
import { Config, Context, Data, Duration, Effect, Layer, Redacted, Schedule, Schema } from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse, type UrlParams } from "effect/http";

import { type FacebookAdsConfig, manifest } from "../manifest";
import { ErrorBodySchema } from "../schemas/api";

export const API_VERSION = "v26.0";

const baseUrl = `https://graph.facebook.com/${API_VERSION}`;
const maxRetries = 5;
const retryBaseDelay = Duration.seconds(1);
const requestTimeout = Duration.minutes(2);
// Usage limits are over a rolling hour. Keep waiting; a failed source stays
// stopped until restart.
const limitRetry = Schedule.min([Schedule.exponential("1 minute"), Schedule.spaced("10 minutes")]);
const retrySchedule = Metrics.retrySchedule({
  connector: manifest.name,
  baseDelay: retryBaseDelay,
  times: maxRetries,
});

// App, user, custom, and ad account usage limits.
const rateLimitCodes = new Set([4, 17, 613, 80000, 80004]);
// Code 2 says to retry later. Subcode 1504018 is an insights request timeout.
// 5xx responses are already retried by `retryTransient`.
const isTransient = (code: number | undefined, subcode: number | undefined) =>
  code === 2 || subcode === 1504018;

export type FacebookAdsClientService = {
  /** `name` labels the span and errors, such as the resource name. */
  readonly get: <A>(
    name: string,
    schema: Schema.Decoder<A>,
    path: string,
    params?: UrlParams.Input,
  ) => Effect.Effect<A, ConnectorError>;
};

export class FacebookAdsClient extends Context.Service<
  FacebookAdsClient,
  FacebookAdsClientService
>()("@useairfoil/producer-facebook-ads/FacebookAdsClient") {}

class RateLimited extends Data.TaggedError("RateLimited")<{
  readonly message: string;
}> {}

class Transient extends Data.TaggedError("Transient")<{
  readonly message: string;
}> {}

const statusError = (response: HttpClientResponse.HttpClientResponse, name: string) =>
  HttpClientResponse.schemaBodyJson(ErrorBodySchema)(response).pipe(
    Effect.map((body) => body.error),
    Effect.orElseSucceed(() => undefined),
    Effect.flatMap((error): Effect.Effect<never, ConnectorError | RateLimited | Transient> => {
      const code = error?.code;
      const message = `Facebook Ads API returned ${response.status}${code === undefined ? "" : ` (code ${code})`} for ${name}${error?.message ? `: ${error.message}` : ""}`;

      if (code !== undefined && rateLimitCodes.has(code)) {
        return Effect.fail(new RateLimited({ message }));
      }
      if (response.status < 500 && isTransient(code, error?.error_subcode)) {
        return Effect.fail(new Transient({ message }));
      }
      return Effect.fail(new ConnectorError({ message }));
    }),
    Effect.tapError((error) => Telemetry.annotateError("api_status", error)),
  );

export const make = Effect.fnUntraced(function* (config: Pick<FacebookAdsConfig, "accessToken">) {
  const client = (yield* HttpClient.HttpClient).pipe(
    HttpClient.mapRequest(HttpClientRequest.prependUrl(baseUrl)),
    HttpClient.mapRequest(HttpClientRequest.acceptJson),
    HttpClient.mapRequest(HttpClientRequest.bearerToken(Redacted.value(config.accessToken))),
    HttpClient.retryTransient({ schedule: retrySchedule }),
  );

  const get = <A>(
    name: string,
    schema: Schema.Decoder<A>,
    path: string,
    params: UrlParams.Input = {},
  ) =>
    Effect.gen(function* () {
      const response = yield* client
        .execute(HttpClientRequest.get(path).pipe(HttpClientRequest.setUrlParams(params)))
        .pipe(
          Effect.tapError((error) => Telemetry.annotateError("api_http", error)),
          Effect.mapError(
            (error) =>
              new ConnectorError({
                message: `Facebook Ads API request failed for ${name}`,
                cause: error,
              }),
          ),
        );

      return yield* HttpClientResponse.matchStatus(response, {
        "2xx": (ok) =>
          HttpClientResponse.schemaBodyJson(schema)(ok).pipe(
            Effect.tapError((error) => Telemetry.annotateError("api_decode", error)),
            Effect.mapError(
              (error) =>
                new ConnectorError({
                  message: `Facebook Ads API response for ${name} does not match the schema`,
                  cause: error,
                }),
            ),
          ),
        orElse: (failed) => statusError(failed, name),
      });
    }).pipe(
      Effect.timeoutOrElse({
        duration: requestTimeout,
        orElse: () =>
          Effect.fail(
            new ConnectorError({
              message: `Facebook Ads API request timed out for ${name}`,
            }),
          ),
      }),
      Effect.retry({
        schedule: retrySchedule,
        while: (error) => error._tag === "Transient",
      }),
      Effect.tapErrorTag("RateLimited", (error) =>
        Effect.logWarning(`${error.message}. Waiting to try again.`),
      ),
      Effect.retry({
        schedule: limitRetry,
        while: (error) => error._tag === "RateLimited",
      }),
      Effect.catchTag(["RateLimited", "Transient"], (error) =>
        Effect.fail(new ConnectorError({ message: error.message })),
      ),
      Effect.withSpan(Telemetry.SpanName.apiFetch, {
        kind: "client",
        attributes: { [Telemetry.Attr.apiPath]: `${path}:${name}` },
      }),
    );

  return FacebookAdsClient.of({ get });
});

export const layer = (
  config: Pick<FacebookAdsConfig, "accessToken">,
): Layer.Layer<FacebookAdsClient, never, HttpClient.HttpClient> =>
  Layer.effect(FacebookAdsClient)(make(config));

export const layerConfig = (
  config: Config.Wrap<FacebookAdsConfig>,
): Layer.Layer<FacebookAdsClient, Config.ConfigError, HttpClient.HttpClient> =>
  Layer.unwrap(Config.unwrap(config).pipe(Effect.map(layer)));
