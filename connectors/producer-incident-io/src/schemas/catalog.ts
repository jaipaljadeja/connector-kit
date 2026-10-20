import { Iceberg } from "@useairfoil/connector-kit";
import { Schema } from "effect";

import { Long, Optional, Timestamp, common, field, list, stringMap } from "./shared";

export const CatalogTypeSchema = Schema.Struct({
  ...common("Catalog type"),
  name: Schema.String.pipe(field(10, "Catalog type name.")),
  description: Schema.String.pipe(field(11, "Catalog type description.")),
  type_name: Schema.String.pipe(field(12, 'Name used in expressions, such as Custom["Service"].')),
  engine_resource_type: Schema.String.pipe(field(13, "Type used by the workflow engine.")),
  ranked: Schema.Boolean.pipe(field(14, "Whether entries have a rank.")),
  is_editable: Schema.Boolean.pipe(field(15, "Whether entries can be edited in the app.")),
  categories: list(101, Schema.String).pipe(field(16, "Categories, such as service or team.")),
  color: Schema.String.pipe(field(17, "Color in the app.")),
  icon: Schema.String.pipe(field(18, "Icon in the app.")),
  annotations: stringMap(102, 103).pipe(field(19, "Annotations by key.")),
  attributes: list(
    104,
    Schema.Struct({
      attribute_id: Schema.String.pipe(field(105, "Attribute.")),
      name: Schema.String.pipe(field(106, "Attribute name.")),
      type: Schema.String.pipe(field(107, "Value type, such as String or another catalog type.")),
      array: Schema.Boolean.pipe(field(108, "Whether it holds a list.")),
      mode: Schema.String.pipe(field(109, "Where values come from, such as api or dashboard.")),
    }),
  ).pipe(field(20, "Attributes that entries of this type have.")),
  schema_version: Long.pipe(field(21, "Version of the attribute schema.")),
  last_synced_at: Optional(Timestamp).pipe(field(22, "Time entries last synced from a source.")),
  estimated_count: Optional(Long).pipe(field(23, "Rough number of entries.")),
  owning_team_ids: list(110, Schema.String).pipe(field(24, "Teams that own it.")),
})
  .annotate({ description: "incident.io catalog types, such as services and teams." })
  .pipe(Iceberg.identifier("id"));

export type CatalogType = Schema.Schema.Type<typeof CatalogTypeSchema>;

export const CatalogTypeObjectSchema = Schema.Struct({
  id: Schema.String,
  created_at: Timestamp,
  updated_at: Timestamp,
  name: Schema.String,
  description: Schema.String,
  type_name: Schema.String,
  engine_resource_type: Schema.String,
  ranked: Schema.Boolean,
  is_editable: Schema.Boolean,
  categories: Schema.Array(Schema.String),
  color: Schema.String,
  icon: Schema.String,
  annotations: Schema.Record(Schema.String, Schema.String),
  schema: Schema.Struct({
    version: Long,
    attributes: Schema.Array(
      Schema.Struct({
        id: Schema.String,
        name: Schema.String,
        type: Schema.String,
        array: Schema.Boolean,
        mode: Schema.String,
      }),
    ),
  }),
  last_synced_at: Optional(Timestamp),
  estimated_count: Optional(Long),
  owning_team_ids: Optional(Schema.Array(Schema.String)),
});

export type CatalogTypeObject = Schema.Schema.Type<typeof CatalogTypeObjectSchema>;

const BindingValueSchema = Schema.Struct({
  label: Schema.String,
  literal: Optional(Schema.String),
});

const bindingValue = (labelId: number, literalId: number) =>
  Schema.Struct({
    label: Schema.String.pipe(field(labelId, "Value as shown.")),
    literal: Optional(Schema.String).pipe(field(literalId, "Value as stored, such as an ID.")),
  });

export const CatalogEntrySchema = Schema.Struct({
  ...common("Catalog entry"),
  catalog_type_id: Schema.String.pipe(field(10, "Catalog type.")),
  name: Schema.String.pipe(field(11, "Entry name.")),
  external_id: Optional(Schema.String).pipe(field(12, "ID in the system it came from.")),
  rank: Long.pipe(field(13, "Rank, for ranked types.")),
  aliases: list(101, Schema.String).pipe(field(14, "Other names that match the entry.")),
  archived_at: Optional(Timestamp).pipe(field(15, "Time the entry was archived.")),
  attribute_values: Schema.ReadonlyMap(
    Schema.String.annotate({ fieldId: 102 }),
    Schema.Struct({
      value: Optional(bindingValue(104, 105)).pipe(field(106, "Single value.")),
      array_value: list(107, bindingValue(108, 109)).pipe(field(110, "List value.")),
    }).annotate({ fieldId: 103 }),
  ).pipe(field(16, "Attribute values by attribute ID.")),
})
  .annotate({ description: "incident.io catalog entries of every type." })
  .pipe(Iceberg.identifier("id"));

export type CatalogEntry = Schema.Schema.Type<typeof CatalogEntrySchema>;

export const CatalogEntryObjectSchema = Schema.Struct({
  id: Schema.String,
  created_at: Timestamp,
  updated_at: Timestamp,
  catalog_type_id: Schema.String,
  name: Schema.String,
  external_id: Optional(Schema.String),
  rank: Long,
  aliases: Schema.Array(Schema.String),
  archived_at: Optional(Timestamp),
  attribute_values: Schema.Record(
    Schema.String,
    Schema.Struct({
      value: Optional(BindingValueSchema),
      array_value: Optional(Schema.Array(BindingValueSchema)),
    }),
  ),
});

export type CatalogEntryObject = Schema.Schema.Type<typeof CatalogEntryObjectSchema>;
