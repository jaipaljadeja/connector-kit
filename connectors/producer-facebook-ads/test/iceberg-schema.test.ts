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
          location: `s3://warehouse/facebook-ads-${name}`,
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
            "ad_accounts": "Facebook ad accounts.",
            "ad_sets": "Facebook ad sets.",
            "ads": "Facebook ads, with their creative.",
            "ads_insights": "Facebook ad performance per ad and day.",
            "ads_insights_age_gender": "Facebook ad performance per ad, day, age, and gender.",
            "ads_insights_country": "Facebook ad performance per ad, day, and country.",
            "ads_insights_platform": "Facebook ad performance per ad, day, platform, and placement.",
            "campaigns": "Facebook ad campaigns.",
          },
          "missingDocs": [],
        }
      `);
      expect(tables).toMatchInlineSnapshot(`
        {
          "ad_accounts": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 name?: string",
            "4 currency?: string",
            "5 timezone_name?: string",
            "6 timezone_offset_hours_utc?: double",
            "7 account_status?: long",
            "8 disable_reason?: long",
            "9 amount_spent?: long",
            "10 spend_cap?: long",
            "11 created_time?: timestamptz",
          ],
          "ad_sets": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 account_id?: string",
            "4 campaign_id?: string",
            "5 name?: string",
            "6 status?: string",
            "7 effective_status?: string",
            "8 optimization_goal?: string",
            "9 billing_event?: string",
            "10 bid_strategy?: string",
            "11 bid_amount?: long",
            "12 daily_budget?: long",
            "13 lifetime_budget?: long",
            "14 budget_remaining?: long",
            "15 destination_type?: string",
            "16 start_time?: timestamptz",
            "17 end_time?: timestamptz",
            "18 created_time?: timestamptz",
            "19 updated_time?: timestamptz",
          ],
          "ads": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 account_id?: string",
            "4 campaign_id?: string",
            "5 adset_id?: string",
            "6 name?: string",
            "7 status?: string",
            "8 effective_status?: string",
            "9 created_time?: timestamptz",
            "10 updated_time?: timestamptz",
            "11 creative?: struct<100 id?: string, 101 name?: string, 102 title?: string, 103 body?: string, 104 call_to_action_type?: string, 105 thumbnail_url?: string, 106 image_url?: string, 107 object_type?: string, 108 object_story_id?: string, 109 link_url?: string, 110 url_tags?: string>",
          ],
          "ads_insights": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 account_id?: string",
            "4 campaign_id?: string",
            "5 adset_id?: string",
            "6 ad_id?: string",
            "7 date?: string",
            "8 account_currency?: string",
            "30 impressions?: long",
            "31 reach?: long",
            "32 clicks?: long",
            "33 inline_link_clicks?: long",
            "34 spend?: double",
            "35 actions?: map<200: string, 201: double>",
            "36 action_values?: map<202: string, 203: double>",
            "37 conversions?: map<204: string, 205: double>",
            "38 conversion_values?: map<206: string, 207: double>",
            "39 video_play_actions?: map<208: string, 209: double>",
            "40 video_p25_watched_actions?: map<210: string, 211: double>",
            "41 video_p50_watched_actions?: map<212: string, 213: double>",
            "42 video_p75_watched_actions?: map<214: string, 215: double>",
            "43 video_p100_watched_actions?: map<216: string, 217: double>",
          ],
          "ads_insights_age_gender": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 account_id?: string",
            "4 campaign_id?: string",
            "5 adset_id?: string",
            "6 ad_id?: string",
            "7 date?: string",
            "8 account_currency?: string",
            "10 age?: string",
            "11 gender?: string",
            "30 impressions?: long",
            "31 reach?: long",
            "32 clicks?: long",
            "33 inline_link_clicks?: long",
            "34 spend?: double",
            "35 actions?: map<200: string, 201: double>",
            "36 action_values?: map<202: string, 203: double>",
          ],
          "ads_insights_country": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 account_id?: string",
            "4 campaign_id?: string",
            "5 adset_id?: string",
            "6 ad_id?: string",
            "7 date?: string",
            "8 account_currency?: string",
            "10 country?: string",
            "30 impressions?: long",
            "31 reach?: long",
            "32 clicks?: long",
            "33 inline_link_clicks?: long",
            "34 spend?: double",
            "35 actions?: map<200: string, 201: double>",
            "36 action_values?: map<202: string, 203: double>",
          ],
          "ads_insights_platform": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 account_id?: string",
            "4 campaign_id?: string",
            "5 adset_id?: string",
            "6 ad_id?: string",
            "7 date?: string",
            "8 account_currency?: string",
            "10 publisher_platform?: string",
            "11 platform_position?: string",
            "30 impressions?: long",
            "31 reach?: long",
            "32 clicks?: long",
            "33 inline_link_clicks?: long",
            "34 spend?: double",
            "35 actions?: map<200: string, 201: double>",
            "36 action_values?: map<202: string, 203: double>",
          ],
          "campaigns": [
            "1 id: string",
            "2 version?: timestamptz",
            "3 account_id?: string",
            "4 name?: string",
            "5 objective?: string",
            "6 status?: string",
            "7 effective_status?: string",
            "8 buying_type?: string",
            "9 bid_strategy?: string",
            "10 daily_budget?: long",
            "11 lifetime_budget?: long",
            "12 spend_cap?: long",
            "13 special_ad_categories?: list<100: string>",
            "14 start_time?: timestamptz",
            "15 stop_time?: timestamptz",
            "16 created_time?: timestamptz",
            "17 updated_time?: timestamptz",
          ],
        }
      `);
    }),
  );
});
