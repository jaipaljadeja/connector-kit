import type { Headers } from "effect/http";

import { ConnectorError } from "@useairfoil/connector-kit";
import { Effect } from "effect";
import { Webhook as StandardWebhook } from "standardwebhooks";

/**
 * incident.io sends Svix webhooks, which use Standard Webhooks headers. The
 * library takes the `whsec_` secret as it is, and rejects deliveries more than
 * 5 minutes old.
 */
export const verifySignature = (options: {
  readonly rawBody: Uint8Array;
  readonly headers: Headers.Headers;
  readonly secret: string;
}): Effect.Effect<void, ConnectorError> =>
  Effect.try({
    try: () => {
      new StandardWebhook(options.secret).verify(Buffer.from(options.rawBody), options.headers);
    },
    catch: (cause) =>
      new ConnectorError({ message: "Invalid incident.io webhook signature", cause }),
  });
