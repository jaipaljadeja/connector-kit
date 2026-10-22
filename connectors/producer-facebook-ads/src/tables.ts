import type { Schema } from "effect";

import {
  AdInsightsAgeGenderSchema,
  AdInsightsCountrySchema,
  AdInsightsPlatformSchema,
  AdInsightsSchema,
} from "./schemas/insights";
import { AdAccountSchema, AdSchema, AdSetSchema, CampaignSchema } from "./schemas/objects";

export const tableSchemas: Readonly<Record<string, Schema.Top>> = {
  ad_accounts: AdAccountSchema,
  campaigns: CampaignSchema,
  ad_sets: AdSetSchema,
  ads: AdSchema,
  ads_insights: AdInsightsSchema,
  ads_insights_age_gender: AdInsightsAgeGenderSchema,
  ads_insights_country: AdInsightsCountrySchema,
  ads_insights_platform: AdInsightsPlatformSchema,
};
