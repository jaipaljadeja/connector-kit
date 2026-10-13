import { Context, type Effect } from "effect";

import type { ResourceBatch } from "../core/types";
import type { ConnectorError } from "../errors";

export type IngestSource = "backfill" | "changes" | "webhook";

/** A resource batch and the source that produced it. */
export type IngestOptions = {
  readonly resource: string;
  readonly source: IngestSource;
  readonly batch: ResourceBatch;
};

/** Handles batches from connector sources. */
export interface IngestorService {
  readonly ingest: (options: IngestOptions) => Effect.Effect<void, ConnectorError>;
  /** Resources it has tables for. Only these run. Without it, every resource runs. */
  readonly resourceNames?: ReadonlyArray<string>;
}

export class Ingestor extends Context.Service<Ingestor, IngestorService>()(
  "@useairfoil/connector-kit/Ingestor",
) {}
