import type { ConnectorError, Identified } from "@useairfoil/connector-kit";
import type { Effect, Schema } from "effect";

import type { GoogleAnalyticsClientService } from "../../client/client";
import type { GoogleAnalyticsConfig } from "../../manifest";
import type { ReportSpec } from "./spec";

import { reportBackfill, reportChanges, reportCheck } from "./sources";

/** What `Resource.entity` takes for a report. */
export type ReportEntity<Row extends object> = {
  readonly name: string;
  readonly rowSchema: Schema.Decoder<Row> & Identified<"id">;
  readonly version: "version";
  readonly check: Effect.Effect<void, ConnectorError>;
  readonly backfill: ReturnType<typeof reportBackfill<Row>>;
  readonly changes: ReturnType<typeof reportChanges<Row>>;
};

export const reportEntity = <Row extends object>(
  client: GoogleAnalyticsClientService,
  config: GoogleAnalyticsConfig,
  spec: ReportSpec<Row>,
): ReportEntity<Row> => ({
  name: spec.name,
  rowSchema: spec.rowSchema,
  version: "version",
  check: reportCheck(client, config, spec),
  backfill: reportBackfill(client, config, spec),
  changes: reportChanges(client, config, spec),
});
