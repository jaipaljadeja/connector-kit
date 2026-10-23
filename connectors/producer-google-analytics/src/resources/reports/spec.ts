import type { Identified } from "@useairfoil/connector-kit";
import type { Schema } from "effect";

/** API names by column, in request order. */
export type Columns<Row> = { readonly [Column in keyof Row & string]?: string };

export type ReportSpec<Row extends object> = {
  /** Resource name, such as `traffic_sources`. */
  readonly name: string;
  /** Every report also asks for `date`. */
  readonly dimensions: Columns<Row>;
  /** At most 10. */
  readonly metrics: Columns<Row>;
  readonly rowSchema: Schema.Decoder<Row> & Identified<"id">;
};
