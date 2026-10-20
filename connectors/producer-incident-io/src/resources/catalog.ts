import { Resource } from "@useairfoil/connector-kit";
import { Effect } from "effect";

import type { IncidentIoClientService } from "../client/client";

import {
  type CatalogEntryObject,
  type CatalogTypeObject,
  type CatalogEntry,
  CatalogEntryObjectSchema,
  CatalogEntrySchema,
  type CatalogType,
  CatalogTypeObjectSchema,
  CatalogTypeSchema,
} from "../schemas/catalog";
import { listAll, listSources } from "./pages";

const listTypes = (client: IncidentIoClientService) =>
  listAll(client, {
    path: "/v3/catalog_types",
    key: "catalog_types",
    item: CatalogTypeObjectSchema,
  });

const toCatalogType = ({
  annotations,
  schema,
  owning_team_ids,
  ...type
}: CatalogTypeObject): CatalogType => ({
  ...type,
  version: type.updated_at,
  annotations: new Map(Object.entries(annotations)),
  attributes: schema.attributes.map(({ id, ...attribute }) => ({
    ...attribute,
    attribute_id: id,
  })),
  schema_version: schema.version,
  owning_team_ids: owning_team_ids ?? [],
});

export const makeCatalogTypes = (client: IncidentIoClientService) =>
  Resource.entity({
    name: "catalog_types",
    rowSchema: CatalogTypeSchema,
    version: "version",
    ...listSources(listTypes(client).pipe(Effect.map((types) => types.map(toCatalogType)))),
  });

const toCatalogEntry = ({ attribute_values, ...entry }: CatalogEntryObject): CatalogEntry => ({
  ...entry,
  version: entry.updated_at,
  attribute_values: new Map(
    Object.entries(attribute_values).map(([attribute, { value, array_value }]) => [
      attribute,
      { value, array_value: array_value ?? [] },
    ]),
  ),
});

export const makeCatalogEntries = (client: IncidentIoClientService) =>
  Resource.entity({
    name: "catalog_entries",
    rowSchema: CatalogEntrySchema,
    version: "version",
    ...listSources(
      listTypes(client).pipe(
        Effect.flatMap((types) =>
          Effect.forEach(types, (type) =>
            listAll(client, {
              path: "/v3/catalog_entries",
              key: "catalog_entries",
              item: CatalogEntryObjectSchema,
              params: { catalog_type_id: type.id, page_size: "250" },
            }),
          ),
        ),
        Effect.map((entries) => entries.flat().map(toCatalogEntry)),
      ),
    ),
  });
