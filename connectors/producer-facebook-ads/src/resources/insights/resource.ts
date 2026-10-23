import type { ConnectorError, Identified } from "@useairfoil/connector-kit";
import type { Effect, Schema } from "effect";

import type { InsightsItem, InsightsSpec } from "./spec";

import { type InsightsContext, insightsBackfill, insightsChanges, insightsCheck } from "./sources";

/** What `Resource.entity` takes for an insights table. */
export type InsightsEntity<A extends InsightsItem, Row extends object> = {
  readonly name: string;
  readonly rowSchema: Schema.Decoder<Row> & Identified<"id">;
  readonly version: "version";
  readonly check: Effect.Effect<void, ConnectorError>;
  readonly backfill: ReturnType<typeof insightsBackfill<A, Row>>;
  readonly changes: ReturnType<typeof insightsChanges<A, Row>>;
};

export const insightsEntity = <A extends InsightsItem, Row extends object>(
  context: InsightsContext,
  spec: InsightsSpec<A, Row>,
): InsightsEntity<A, Row> => ({
  name: spec.name,
  rowSchema: spec.rowSchema,
  version: "version",
  check: insightsCheck(context, spec),
  backfill: insightsBackfill(context, spec),
  changes: insightsChanges(context, spec),
});
