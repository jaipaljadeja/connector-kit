import { Iceberg } from "@useairfoil/connector-kit";
import { Schema, SchemaTransformation } from "effect";

export const field = (fieldId: number, description: string) =>
  Iceberg.field(fieldId, { description });

/** Meta sends counts and minor-unit money as numeric strings. */
export const count = (fieldId: number, description: string) =>
  Schema.optional(Schema.BigIntFromString).pipe(field(fieldId, description));

/** Spend and other decimal values, as an Iceberg double. */
export const amount = (fieldId: number, description: string) =>
  Schema.optional(Schema.FiniteFromString).pipe(field(fieldId, description));

export const text = (fieldId: number, description: string) =>
  Schema.optional(Schema.String).pipe(field(fieldId, description));

/** Times such as `2026-10-19T10:00:00+0000`. */
export const time = (fieldId: number, description: string) =>
  Schema.optional(Schema.DateFromString).pipe(field(fieldId, description));

/** Whole numbers sent as JSON numbers, as an Iceberg long. */
export const long = (fieldId: number, description: string) =>
  Schema.optional(
    Schema.Int.pipe(
      Schema.decodeTo(
        Schema.BigInt,
        SchemaTransformation.transform({
          decode: (value) => BigInt(value),
          encode: (value) => Number(value),
        }),
      ),
    ),
  ).pipe(field(fieldId, description));

export const textList = (fieldId: number, elementId: number, description: string) =>
  Schema.optional(Schema.Array(Schema.String.annotate({ fieldId: elementId }))).pipe(
    field(fieldId, description),
  );

/** `version` is the fetch time. See AGENTS.md. */
export const version = Schema.Date.pipe(field(2, "Time the row was read from Meta."));
