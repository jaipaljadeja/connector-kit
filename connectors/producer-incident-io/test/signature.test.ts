import { describe, expect, it, vi } from "@effect/vitest";
import { Effect } from "effect";
import { Headers } from "effect/http";

import { verifySignature } from "../src/webhook/signature";
import { signedHeaders, webhookSecret } from "./helpers";

// A private event, which only carries the ID.
const body = JSON.stringify({
  event_type: "private_incident.incident_updated_v2",
  "private_incident.incident_updated_v2": { id: "01FDAG4SAP5TYPT98WGR2N7W91" },
});

const check = (headers: Record<string, string>, rawBody = body) =>
  verifySignature({
    rawBody: new TextEncoder().encode(rawBody),
    headers: Headers.fromInput(headers),
    secret: webhookSecret,
  }).pipe(Effect.match({ onFailure: (error) => error.message, onSuccess: () => "ok" }));

describe("webhook signature", () => {
  it.effect("accepts a fresh signed delivery and rejects everything else", () =>
    Effect.gen(function* () {
      const headers = signedHeaders(body);
      expect({
        signed: yield* check(headers),
        otherBody: yield* check(headers, "{}"),
        missing: yield* check({}),
        tenMinutesOld: yield* check(signedHeaders(body, new Date(Date.now() - 600_000))),
      }).toMatchInlineSnapshot(`
        {
          "missing": "Invalid incident.io webhook signature",
          "otherBody": "Invalid incident.io webhook signature",
          "signed": "ok",
          "tenMinutesOld": "Invalid incident.io webhook signature",
        }
      `);
    }),
  );

  it.effect("matches Svix's example signature, and accepts rotated secrets", () =>
    Effect.gen(function* () {
      // From https://docs.svix.com/receiving/verifying-payloads/how-manual
      const svix = {
        secret: "whsec_plJ3nmyCDGBKInavdOK15jsl",
        payload: '{"event_type":"ping","data":{"success":true}}',
        id: "msg_loFOjxBNrRLzqYUf",
        timestamp: "1731705121",
        signature: "v1,rAvfW3dJ/X/qxhsaXPOyyCGmRKsaKWcsNccKXlIktD0=",
      };
      const now = vi.spyOn(Date, "now").mockReturnValue(Number(svix.timestamp) * 1000);
      const verify = (signature: string) =>
        verifySignature({
          rawBody: new TextEncoder().encode(svix.payload),
          headers: Headers.fromInput({
            "webhook-id": svix.id,
            "webhook-timestamp": svix.timestamp,
            "webhook-signature": signature,
          }),
          secret: svix.secret,
        }).pipe(Effect.match({ onFailure: (error) => error.message, onSuccess: () => "ok" }));

      const result = {
        example: yield* verify(svix.signature),
        rotated: yield* verify(`v1,b2xkLXNlY3JldA== ${svix.signature}`),
        otherVersionOnly: yield* verify(svix.signature.replace("v1,", "v2,")),
      };
      now.mockRestore();
      expect(result).toMatchInlineSnapshot(`
        {
          "example": "ok",
          "otherVersionOnly": "Invalid incident.io webhook signature",
          "rotated": "ok",
        }
      `);
    }),
  );
});
