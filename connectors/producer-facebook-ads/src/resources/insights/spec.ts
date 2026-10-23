import type { Identified } from "@useairfoil/connector-kit";
import type { Schema } from "effect";

export type InsightsItem = {
  readonly ad_id: string;
  readonly date_start: string;
};

export type InsightsSpec<A extends InsightsItem, Row extends object> = {
  /** Resource name, such as `ads_insights_country`. */
  readonly name: string;
  /** Part of the key, in order. Meta returns them without asking. */
  readonly breakdowns: ReadonlyArray<keyof A & string>;
  /** API shape. Its keys, minus breakdowns, are the requested `fields`. */
  readonly item: Schema.Decoder<A> & { readonly fields: Readonly<Record<string, unknown>> };
  readonly rowSchema: Schema.Decoder<Row> & Identified<"id">;
  readonly toRow: (item: A, id: string, version: Date) => Row;
};
