import type { ConnectorError } from "@useairfoil/connector-kit";

import { Effect } from "effect";

/** Skips a type that fails. Its own table shows the error, and its old rows stay. */
export const skipFailedType =
  (objectType: string) =>
  <A>(
    effect: Effect.Effect<ReadonlyArray<A>, ConnectorError>,
  ): Effect.Effect<ReadonlyArray<A>, never> =>
    effect.pipe(
      Effect.catch((error) =>
        Effect.logWarning("Skipped HubSpot object type").pipe(
          Effect.annotateLogs({ objectType, error: error.message }),
          Effect.as([]),
        ),
      ),
    );
