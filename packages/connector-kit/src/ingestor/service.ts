import { Context, type Effect } from "effect";

import type { ResourceBatch } from "../core/types";
import type { ConnectorError } from "../errors";

export type IngestSource = "backfill" | "changes" | "webhook" | "demo";

/** A resource batch and the source that produced it. */
export type IngestOptions = {
  readonly resource: string;
  readonly source: IngestSource;
  readonly batch: ResourceBatch;
};

/** Rows written, and their size as uncompressed Arrow buffers. */
export type IngestResult = {
  readonly rows: number;
  readonly bytes: number;
};

/** Handles batches from connector sources. */
export interface IngestorService {
  readonly ingest: (options: IngestOptions) => Effect.Effect<IngestResult, ConnectorError>;
  /** Resources it has tables for. Only these run. Without it, every resource runs. */
  readonly resourceNames?: ReadonlyArray<string>;
}

export class Ingestor extends Context.Service<Ingestor, IngestorService>()(
  "@useairfoil/connector-kit/Ingestor",
) {}
