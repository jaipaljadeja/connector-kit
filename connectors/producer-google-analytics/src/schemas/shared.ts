import { Iceberg } from "@useairfoil/connector-kit";
import { Schema, SchemaTransformation } from "effect";

export const field = (fieldId: number, description: string) =>
  Iceberg.field(fieldId, { description });

/** The API's `YYYYMMDD` as `YYYY-MM-DD`. */
export const isoDay = (date: string) => `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}`;

const ReportDate = Schema.String.check(Schema.isPattern(/^\d{8}$/)).pipe(
  Schema.decodeTo(
    Schema.String,
    SchemaTransformation.transform({
      decode: isoDay,
      encode: (date) => date.replaceAll("-", ""),
    }),
  ),
);

/** `TYPE_INTEGER` metrics, as an Iceberg long. */
export const count = (fieldId: number, description: string) =>
  Schema.BigIntFromString.pipe(field(fieldId, description));

/** Float, currency, and seconds metrics, as an Iceberg double. */
export const amount = (fieldId: number, description: string) =>
  Schema.FiniteFromString.pipe(field(fieldId, description));

/** Dimension values are never null. GA uses `(not set)` and `(other)` instead. */
export const dimension = (fieldId: number, description: string) =>
  Schema.String.pipe(field(fieldId, description));

/** `version` is the fetch time, since report rows have no update time. */
export const common = {
  id: Schema.String.pipe(field(1, "JSON array of the property ID, date, and dimension values.")),
  version: Schema.Date.pipe(field(2, "Time the row was read from Google Analytics.")),
  property_id: Schema.String.pipe(field(3, "GA4 property ID.")),
  date: ReportDate.pipe(field(4, "Day in the property's time zone, as YYYY-MM-DD.")),
};

export const currencyCode = Schema.String.pipe(
  field(50, "Currency of the revenue fields, the property's currency."),
);
