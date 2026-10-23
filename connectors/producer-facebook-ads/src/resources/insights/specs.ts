import type { InsightsSpec } from "./spec";

import {
  type AdInsights,
  type AdInsightsAgeGender,
  AdInsightsAgeGenderApiSchema,
  AdInsightsAgeGenderSchema,
  AdInsightsApiSchema,
  type AdInsightsCountry,
  AdInsightsCountryApiSchema,
  AdInsightsCountrySchema,
  type AdInsightsPlatform,
  AdInsightsPlatformApiSchema,
  AdInsightsPlatformSchema,
  AdInsightsSchema,
} from "../../schemas/insights";

export const adInsights: InsightsSpec<typeof AdInsightsApiSchema.Type, AdInsights> = {
  name: "ads_insights",
  breakdowns: [],
  item: AdInsightsApiSchema,
  rowSchema: AdInsightsSchema,
  toRow: ({ date_start, ...item }, id, version) => ({ ...item, id, version, date: date_start }),
};

export const adInsightsAgeGender: InsightsSpec<
  typeof AdInsightsAgeGenderApiSchema.Type,
  AdInsightsAgeGender
> = {
  name: "ads_insights_age_gender",
  breakdowns: ["age", "gender"],
  item: AdInsightsAgeGenderApiSchema,
  rowSchema: AdInsightsAgeGenderSchema,
  toRow: ({ date_start, ...item }, id, version) => ({ ...item, id, version, date: date_start }),
};

export const adInsightsCountry: InsightsSpec<
  typeof AdInsightsCountryApiSchema.Type,
  AdInsightsCountry
> = {
  name: "ads_insights_country",
  breakdowns: ["country"],
  item: AdInsightsCountryApiSchema,
  rowSchema: AdInsightsCountrySchema,
  toRow: ({ date_start, ...item }, id, version) => ({ ...item, id, version, date: date_start }),
};

// `impression_device` needs an opt-in per account since Aug 2026, so it's left out.
export const adInsightsPlatform: InsightsSpec<
  typeof AdInsightsPlatformApiSchema.Type,
  AdInsightsPlatform
> = {
  name: "ads_insights_platform",
  breakdowns: ["publisher_platform", "platform_position"],
  item: AdInsightsPlatformApiSchema,
  rowSchema: AdInsightsPlatformSchema,
  toRow: ({ date_start, ...item }, id, version) => ({ ...item, id, version, date: date_start }),
};
