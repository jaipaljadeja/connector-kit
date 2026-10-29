import { ConnectorApp, Demo, RuntimeConfig } from "@useairfoil/connector-kit";
import { Command } from "effect/cli";

import {
  AdInsightsAgeGenderSchema,
  AdInsightsCountrySchema,
  AdInsightsPlatformSchema,
  AdInsightsSchema,
} from "../schemas/insights";
import { AdAccountSchema, AdSchema, AdSetSchema, CampaignSchema } from "../schemas/objects";
import { dayRows } from "./insights";
import { setupRows } from "./setup";
import { historyDays } from "./shared";

export const demo = Demo.define({
  name: "producer-facebook-ads",
  setup: {
    tables: [
      Demo.table({ name: "ad_accounts", rowSchema: AdAccountSchema, version: "version" }),
      Demo.table({ name: "campaigns", rowSchema: CampaignSchema, version: "version" }),
      Demo.table({ name: "ad_sets", rowSchema: AdSetSchema, version: "version" }),
      Demo.table({ name: "ads", rowSchema: AdSchema, version: "version" }),
    ],
    rows: setupRows,
  },
  group: {
    tables: [
      Demo.table({ name: "ads_insights", rowSchema: AdInsightsSchema, version: "version" }),
      Demo.table({
        name: "ads_insights_age_gender",
        rowSchema: AdInsightsAgeGenderSchema,
        version: "version",
      }),
      Demo.table({
        name: "ads_insights_country",
        rowSchema: AdInsightsCountrySchema,
        version: "version",
      }),
      Demo.table({
        name: "ads_insights_platform",
        rowSchema: AdInsightsPlatformSchema,
        version: "version",
      }),
    ],
    rows: dayRows,
    // A day of insights is about 200 KB.
    groupsPerChunk: 4,
    count: historyDays,
  },
});

export const demoCommand = ConnectorApp.makeDemoCommand(demo).pipe(
  Command.provide(RuntimeConfig.layerHosted()),
);
