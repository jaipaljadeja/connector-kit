import { Schema } from "effect";

const ValueSchema = Schema.Struct({ value: Schema.String });

/** `POST properties/{id}:runReport`. Every value comes as a string. */
export const RunReportResponseSchema = Schema.Struct({
  dimensionHeaders: Schema.Array(Schema.Struct({ name: Schema.String })),
  metricHeaders: Schema.Array(Schema.Struct({ name: Schema.String })),
  rows: Schema.optional(
    Schema.Array(
      Schema.Struct({
        dimensionValues: Schema.Array(ValueSchema),
        metricValues: Schema.Array(ValueSchema),
      }),
    ),
  ),
  // Left out when the report is empty.
  rowCount: Schema.optional(Schema.Int),
  metadata: Schema.Struct({
    timeZone: Schema.String,
    currencyCode: Schema.optional(Schema.String),
    dataLossFromOtherRow: Schema.optional(Schema.Boolean),
    subjectToThresholding: Schema.optional(Schema.Boolean),
    samplingMetadatas: Schema.optional(Schema.Array(Schema.Unknown)),
    dataTruncationReasons: Schema.optional(Schema.Array(Schema.Unknown)),
  }),
});

export type RunReportResponse = Schema.Schema.Type<typeof RunReportResponseSchema>;

export const ErrorBodySchema = Schema.Struct({
  error: Schema.Struct({
    code: Schema.optional(Schema.Int),
    message: Schema.optional(Schema.String),
    status: Schema.optional(Schema.String),
  }),
});
