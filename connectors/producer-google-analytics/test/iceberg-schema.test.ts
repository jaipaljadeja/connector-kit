import { describe, expect, it } from "@effect/vitest";
import { Iceberg } from "@useairfoil/connector-kit";
import { Effect } from "effect";

import { tableSchemas } from "../src/tables";

type CommitRequest = Effect.Success<ReturnType<typeof Iceberg.makeCreateTableCommitRequest>>;
type AddSchema = Extract<CommitRequest["updates"][number], { readonly action: "add-schema" }>;
type TableSchema = AddSchema["schema"];
type IcebergType = TableSchema["fields"][number]["type"];

const tableSchema = (request: CommitRequest): TableSchema => {
  const update = request.updates.find((item) => item.action === "add-schema");
  if (update?.action !== "add-schema") throw new Error("Missing add-schema update");
  return update.schema;
};

const undocumented = (type: IcebergType): ReadonlyArray<string> => {
  if (typeof type === "string") return [];
  switch (type.type) {
    case "struct":
      return type.fields.flatMap((field) => [
        ...(field.doc ? [] : [field.name]),
        ...undocumented(field.type),
      ]);
    case "list":
      return undocumented(type.element);
    case "map":
      return [...undocumented(type.key), ...undocumented(type.value)];
  }
};

const describeType = (type: IcebergType): string => {
  if (typeof type === "string") return type;
  switch (type.type) {
    case "struct":
      return `struct<${type.fields.map((field) => `${field.id} ${field.name}${field.required ? "" : "?"}: ${describeType(field.type)}`).join(", ")}>`;
    case "list":
      return `list<${type["element-id"]}: ${describeType(type.element)}>`;
    case "map":
      return `map<${type["key-id"]}: ${describeType(type.key)}, ${type["value-id"]}: ${describeType(type.value)}>`;
  }
};

describe("Iceberg schemas", () => {
  it.effect("compiles every table with documented, stable field IDs", () =>
    Effect.gen(function* () {
      const comments: Record<string, string | undefined> = {};
      const missingDocs: Array<string> = [];
      const tables: Record<string, ReadonlyArray<string>> = {};
      for (const [name, schema] of Object.entries(tableSchemas)) {
        const request = yield* Iceberg.makeCreateTableCommitRequest(schema, {
          location: `s3://warehouse/google-analytics-${name}`,
        });
        const properties = request.updates.find((update) => update.action === "set-properties");
        comments[name] =
          properties?.action === "set-properties" ? properties.updates.comment : undefined;

        const fields = tableSchema(request);
        missingDocs.push(...undocumented(fields).map((field) => `${name}.${field}`));
        tables[name] = fields.fields.map(
          (field) =>
            `${field.id} ${field.name}${field.required ? "" : "?"}: ${describeType(field.type)}`,
        );
      }

      expect({ comments, missingDocs }).toMatchInlineSnapshot(`
        {
          "comments": {
            "daily_overview": "Google Analytics totals per day.",
            "devices": "Google Analytics users per day and device.",
            "ecommerce_items": "Google Analytics ecommerce items per day. Empty without ecommerce events.",
            "events": "Google Analytics events per day and event name.",
            "landing_pages": "Google Analytics sessions per day and landing page.",
            "locations": "Google Analytics users per day and location.",
            "pages": "Google Analytics page views per day and page.",
            "traffic_sources": "Google Analytics sessions per day and traffic source.",
            "user_acquisition": "Google Analytics users per day and first traffic source.",
          },
          "missingDocs": [],
        }
      `);
      expect(tables).toMatchInlineSnapshot(`
        {
          "daily_overview": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 property_id?: string",
            "4 date?: string",
            "30 active_users?: long",
            "31 new_users?: long",
            "32 total_users?: long",
            "33 sessions?: long",
            "34 engaged_sessions?: long",
            "35 screen_page_views?: long",
            "36 event_count?: long",
            "37 key_events?: double",
            "38 total_revenue?: double",
            "39 user_engagement_duration?: double",
            "50 currency_code?: string",
          ],
          "devices": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 property_id?: string",
            "4 date?: string",
            "10 device_category?: string",
            "11 platform?: string",
            "12 operating_system?: string",
            "13 browser?: string",
            "30 active_users?: long",
            "31 new_users?: long",
            "32 sessions?: long",
            "33 engaged_sessions?: long",
            "34 screen_page_views?: long",
            "35 key_events?: double",
          ],
          "ecommerce_items": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 property_id?: string",
            "4 date?: string",
            "10 item_id?: string",
            "11 item_name?: string",
            "12 item_brand?: string",
            "13 item_category?: string",
            "30 items_viewed?: long",
            "31 items_added_to_cart?: long",
            "32 items_purchased?: long",
            "33 item_revenue?: double",
            "50 currency_code?: string",
          ],
          "events": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 property_id?: string",
            "4 date?: string",
            "10 event_name?: string",
            "30 event_count?: long",
            "31 total_users?: long",
            "32 event_value?: double",
            "33 key_events?: double",
          ],
          "landing_pages": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 property_id?: string",
            "4 date?: string",
            "10 landing_page?: string",
            "30 sessions?: long",
            "31 engaged_sessions?: long",
            "32 active_users?: long",
            "33 new_users?: long",
            "34 key_events?: double",
            "35 total_revenue?: double",
            "50 currency_code?: string",
          ],
          "locations": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 property_id?: string",
            "4 date?: string",
            "10 country?: string",
            "11 region?: string",
            "12 city?: string",
            "30 active_users?: long",
            "31 new_users?: long",
            "32 sessions?: long",
            "33 engaged_sessions?: long",
            "34 key_events?: double",
            "35 total_revenue?: double",
            "50 currency_code?: string",
          ],
          "pages": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 property_id?: string",
            "4 date?: string",
            "10 host_name?: string",
            "11 page_path?: string",
            "12 page_title?: string",
            "30 screen_page_views?: long",
            "31 active_users?: long",
            "32 event_count?: long",
            "33 key_events?: double",
            "34 user_engagement_duration?: double",
          ],
          "traffic_sources": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 property_id?: string",
            "4 date?: string",
            "10 session_source?: string",
            "11 session_medium?: string",
            "12 session_campaign_name?: string",
            "13 session_default_channel_group?: string",
            "30 sessions?: long",
            "31 engaged_sessions?: long",
            "32 active_users?: long",
            "33 new_users?: long",
            "34 screen_page_views?: long",
            "35 event_count?: long",
            "36 key_events?: double",
            "37 total_revenue?: double",
            "38 user_engagement_duration?: double",
            "50 currency_code?: string",
          ],
          "user_acquisition": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 property_id?: string",
            "4 date?: string",
            "10 first_user_source?: string",
            "11 first_user_medium?: string",
            "12 first_user_campaign_name?: string",
            "13 first_user_default_channel_group?: string",
            "30 new_users?: long",
            "31 active_users?: long",
            "32 sessions?: long",
            "33 engaged_sessions?: long",
            "34 key_events?: double",
            "35 total_revenue?: double",
            "50 currency_code?: string",
          ],
        }
      `);
    }),
  );
});
