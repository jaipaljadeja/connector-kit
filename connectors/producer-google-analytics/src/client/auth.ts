import { Auth, ConnectorError, Telemetry } from "@useairfoil/connector-kit";
import { Clock, Context, Duration, Effect, Layer, Redacted, Schedule, Schema } from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/http";
import { createPrivateKey, sign } from "node:crypto";

import type { GoogleAnalyticsConfig } from "../manifest";

type GoogleAnalyticsAuthConfig = Pick<GoogleAnalyticsConfig, "clientEmail" | "privateKey">;

export type GoogleAnalyticsAuthService = Auth.TokenCache<ConnectorError>;

export class GoogleAnalyticsAuth extends Context.Service<
  GoogleAnalyticsAuth,
  GoogleAnalyticsAuthService
>()("@useairfoil/producer-google-analytics/GoogleAnalyticsAuth") {}

export const tokenUrl = "https://oauth2.googleapis.com/token";
export const scope = "https://www.googleapis.com/auth/analytics.readonly";

const TokenResponseSchema = Schema.Struct({
  access_token: Schema.String,
  expires_in: Schema.Number,
});

const TokenErrorSchema = Schema.Struct({
  error: Schema.optional(Schema.String),
  error_description: Schema.optional(Schema.String),
});

const base64Url = (value: string | Buffer): string => Buffer.from(value).toString("base64url");

/** Signs the service account JWT with RS256. Google allows at most 1 hour. */
export const makeAssertion = (options: {
  readonly clientEmail: string;
  readonly privateKey: string;
  readonly nowMillis: number;
}): Effect.Effect<string, ConnectorError> =>
  Effect.try({
    try: () => {
      const now = Math.floor(options.nowMillis / 1000);
      const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
      const claims = base64Url(
        JSON.stringify({
          iss: options.clientEmail,
          scope,
          aud: tokenUrl,
          iat: now,
          exp: now + 3600,
        }),
      );
      const signingInput = `${header}.${claims}`;
      // Env files often keep the PEM on one line with escaped newlines.
      const key = createPrivateKey(options.privateKey.replace(/\\n/g, "\n"));
      return `${signingInput}.${base64Url(sign("sha256", Buffer.from(signingInput), key))}`;
    },
    catch: (cause) =>
      new ConnectorError({ message: "Invalid Google service account private key", cause }),
  });

const tokenError = (response: HttpClientResponse.HttpClientResponse) =>
  HttpClientResponse.schemaBodyJson(TokenErrorSchema)(response).pipe(
    Effect.map((body) => body.error),
    Effect.orElseSucceed(() => undefined),
    Effect.flatMap((error) =>
      Effect.fail(
        new ConnectorError({
          message:
            error === "invalid_grant" || error === "invalid_client"
              ? "Google rejected the service account key"
              : `Google returned ${response.status} for the OAuth token`,
        }),
      ),
    ),
  );

export const make = Effect.fnUntraced(function* (config: GoogleAnalyticsAuthConfig) {
  const client = (yield* HttpClient.HttpClient).pipe(
    HttpClient.retryTransient({
      schedule: Schedule.exponential("250 millis").pipe(Schedule.jittered),
      times: 3,
    }),
  );

  return yield* Auth.makeTokenCache({
    acquire: Effect.gen(function* () {
      const assertion = yield* makeAssertion({
        clientEmail: config.clientEmail,
        privateKey: Redacted.value(config.privateKey),
        nowMillis: yield* Clock.currentTimeMillis,
      });
      const response = yield* client
        .execute(
          HttpClientRequest.post(tokenUrl).pipe(
            HttpClientRequest.acceptJson,
            HttpClientRequest.bodyUrlParams({
              grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
              assertion,
            }),
          ),
        )
        .pipe(
          Effect.mapError(
            (cause) => new ConnectorError({ message: "Google OAuth token request failed", cause }),
          ),
        );
      const body = yield* HttpClientResponse.matchStatus(response, {
        "2xx": (ok) =>
          HttpClientResponse.schemaBodyJson(TokenResponseSchema)(ok).pipe(
            Effect.mapError(
              (cause) =>
                new ConnectorError({ message: "Invalid Google OAuth token response", cause }),
            ),
          ),
        orElse: tokenError,
      });
      return {
        value: Redacted.make(body.access_token),
        expiresIn: Duration.seconds(body.expires_in),
      };
    }).pipe(
      Effect.tapError((error) => Telemetry.annotateError("api_auth", error)),
      Effect.withSpan(Telemetry.SpanName.apiFetch, {
        kind: "client",
        attributes: { [Telemetry.Attr.apiPath]: "/token" },
      }),
    ),
  });
});

export const layer = (
  config: GoogleAnalyticsAuthConfig,
): Layer.Layer<GoogleAnalyticsAuth, never, HttpClient.HttpClient> =>
  Layer.effect(GoogleAnalyticsAuth)(make(config));
