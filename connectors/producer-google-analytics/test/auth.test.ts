import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer, Redacted, Ref } from "effect";
import { HttpClient, HttpClientResponse } from "effect/http";
import { TestClock } from "effect/testing";
import { generateKeyPairSync, verify } from "node:crypto";

import { GoogleAnalyticsAuth } from "../src/index";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
// Key files hold PKCS#8. Env files often keep it on one line.
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const oneLinePem = pem.trim().replace(/\n/g, "\\n");

const now = Date.parse("2026-10-20T10:00:00.000Z");
const clientEmail = "reader@test.iam.gserviceaccount.com";

const decodePart = (part: string | undefined): unknown =>
  JSON.parse(Buffer.from(part ?? "", "base64url").toString());

const tokenWith = (status: number, body: unknown) =>
  Effect.gen(function* () {
    yield* TestClock.setTime(now);
    const requests = yield* Ref.make<ReadonlyArray<string>>([]);
    const http = HttpClient.make((request) =>
      Effect.gen(function* () {
        const form =
          request.body._tag === "Uint8Array"
            ? new URLSearchParams(new TextDecoder().decode(request.body.body))
            : new URLSearchParams();
        yield* Ref.update(requests, (current) => [
          ...current,
          `${request.method} ${request.url} ${form.get("grant_type")} ${
            form.get("assertion")?.split(".").length === 3 ? "jwt" : "none"
          }`,
        ]);
        return HttpClientResponse.fromWeb(
          request,
          new Response(JSON.stringify(body), {
            status,
            headers: { "content-type": "application/json" },
          }),
        );
      }),
    );
    const result = yield* Effect.gen(function* () {
      const auth = yield* GoogleAnalyticsAuth.GoogleAnalyticsAuth;
      const first = yield* auth.get;
      yield* auth.get;
      return Redacted.value(first);
    }).pipe(
      Effect.match({ onFailure: (error) => error.message, onSuccess: (token) => token }),
      Effect.provide(
        GoogleAnalyticsAuth.layer({ clientEmail, privateKey: Redacted.make(oneLinePem) }).pipe(
          Layer.provide(Layer.succeed(HttpClient.HttpClient)(http)),
        ),
      ),
    );
    return { result, requests: yield* Ref.get(requests) };
  });

describe("auth", () => {
  it.effect("signs an RS256 service account JWT from a one-line PEM", () =>
    Effect.gen(function* () {
      const jwt = yield* GoogleAnalyticsAuth.makeAssertion({
        clientEmail,
        privateKey: oneLinePem,
        nowMillis: now,
      });
      const [header, claims, signature] = jwt.split(".");

      expect({
        header: decodePart(header),
        claims: decodePart(claims),
        verified: verify(
          "sha256",
          Buffer.from(`${header}.${claims}`),
          publicKey,
          Buffer.from(signature ?? "", "base64url"),
        ),
      }).toMatchInlineSnapshot(`
        {
          "claims": {
            "aud": "https://oauth2.googleapis.com/token",
            "exp": 1792494000,
            "iat": 1792490400,
            "iss": "reader@test.iam.gserviceaccount.com",
            "scope": "https://www.googleapis.com/auth/analytics.readonly",
          },
          "header": {
            "alg": "RS256",
            "typ": "JWT",
          },
          "verified": true,
        }
      `);
    }),
  );

  it.effect("exchanges the JWT for a token and caches it", () =>
    Effect.gen(function* () {
      expect(
        yield* tokenWith(200, {
          access_token: "ya29.test",
          expires_in: 3599,
          token_type: "Bearer",
        }),
      ).toMatchInlineSnapshot(`
        {
          "requests": [
            "POST https://oauth2.googleapis.com/token urn:ietf:params:oauth:grant-type:jwt-bearer jwt",
          ],
          "result": "ya29.test",
        }
      `);
    }),
  );

  it.effect("explains a rejected key", () =>
    Effect.gen(function* () {
      expect(
        (yield* tokenWith(400, {
          error: "invalid_grant",
          error_description: "Invalid JWT Signature.",
        })).result,
      ).toMatchInlineSnapshot(`"Google rejected the service account key"`);
    }),
  );
});
