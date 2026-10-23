import { Iceberg } from "@useairfoil/connector-kit";
import { Schema } from "effect";

import { count, field, long, text, textList, time, version } from "./shared";

// Each table shares its fields with the API shape, which also gives the
// requested `fields`. Meta leaves out empty fields, so they are optional.

const objectId = (object: string) => Schema.String.pipe(field(1, `${object} ID.`));

const adAccountFields = {
  name: text(3, "Account name."),
  currency: text(4, "Account currency, such as USD."),
  timezone_name: text(5, "Account time zone. Insights days use it."),
  timezone_offset_hours_utc: Schema.optional(Schema.Finite).pipe(
    field(6, "Hours from UTC, as a decimal."),
  ),
  account_status: long(7, "1 active, 2 disabled, 3 unsettled, 101 closed, and others."),
  disable_reason: long(8, "Why the account is disabled. 0 when it isn't."),
  amount_spent: count(9, "Total spent, in the currency's minor unit, such as cents."),
  spend_cap: count(10, "Spending cap in minor units. 0 means none."),
  created_time: time(11, "Time the account was created."),
};

/** `id` is `act_<account_id>`, so the row uses `account_id`. */
export const AdAccountApiSchema = Schema.Struct({
  account_id: Schema.String,
  ...adAccountFields,
});

export const AdAccountSchema = Schema.Struct({
  id: Schema.String.pipe(field(1, "Ad account ID, without `act_`.")),
  version,
  ...adAccountFields,
})
  .annotate({ description: "Facebook ad accounts." })
  .pipe(Iceberg.identifier("id"));

export type AdAccount = Schema.Schema.Type<typeof AdAccountSchema>;

const campaignFields = {
  account_id: text(3, "Ad account ID."),
  name: text(4, "Campaign name."),
  objective: text(5, "Campaign objective, such as OUTCOME_SALES."),
  status: text(6, "Status set by the advertiser: ACTIVE, PAUSED, ARCHIVED, or DELETED."),
  effective_status: text(7, "Status after parents and review, such as IN_PROCESS."),
  buying_type: text(8, "AUCTION or RESERVED."),
  bid_strategy: text(9, "Bid strategy, when the campaign holds the budget."),
  daily_budget: count(10, "Daily budget in minor units, when the campaign holds it."),
  lifetime_budget: count(11, "Lifetime budget in minor units, when the campaign holds it."),
  spend_cap: count(12, "Spending cap in minor units."),
  special_ad_categories: textList(13, 100, "Special ad categories, such as HOUSING."),
  start_time: time(14, "Start time."),
  stop_time: time(15, "Stop time."),
  created_time: time(16, "Time the campaign was created."),
  updated_time: time(17, "Time the campaign was last updated."),
};

export const CampaignApiSchema = Schema.Struct({
  id: Schema.String,
  ...campaignFields,
});

export const CampaignSchema = Schema.Struct({
  id: objectId("Campaign"),
  version,
  ...campaignFields,
})
  .annotate({ description: "Facebook ad campaigns." })
  .pipe(Iceberg.identifier("id"));

export type Campaign = Schema.Schema.Type<typeof CampaignSchema>;

const adSetFields = {
  account_id: text(3, "Ad account ID."),
  campaign_id: text(4, "Campaign ID."),
  name: text(5, "Ad set name."),
  status: text(6, "Status set by the advertiser: ACTIVE, PAUSED, ARCHIVED, or DELETED."),
  effective_status: text(7, "Status after parents and review, such as CAMPAIGN_PAUSED."),
  optimization_goal: text(8, "What delivery optimizes for, such as LINK_CLICKS."),
  billing_event: text(9, "What the advertiser pays for, such as IMPRESSIONS."),
  bid_strategy: text(10, "Bid strategy."),
  bid_amount: long(11, "Bid cap or target in minor units."),
  // Meta sends "0" for the budget kind the ad set doesn't use.
  daily_budget: count(12, "Daily budget in minor units, when the ad set holds it."),
  lifetime_budget: count(13, "Lifetime budget in minor units, when the ad set holds it."),
  budget_remaining: count(14, "Budget left in minor units."),
  destination_type: text(15, "Where the ads send people, such as WEBSITE."),
  start_time: time(16, "Start time."),
  end_time: time(17, "End time."),
  created_time: time(18, "Time the ad set was created."),
  updated_time: time(19, "Time the ad set was last updated."),
};

export const AdSetApiSchema = Schema.Struct({
  id: Schema.String,
  ...adSetFields,
});

export const AdSetSchema = Schema.Struct({
  id: objectId("Ad set"),
  version,
  ...adSetFields,
})
  .annotate({ description: "Facebook ad sets." })
  .pipe(Iceberg.identifier("id"));

export type AdSet = Schema.Schema.Type<typeof AdSetSchema>;

export const CreativeSchema = Schema.Struct({
  id: text(100, "Creative ID."),
  name: text(101, "Creative name."),
  title: text(102, "Headline. Empty for some formats, such as catalog ads."),
  body: text(103, "Main text."),
  call_to_action_type: text(104, "Button, such as SHOP_NOW."),
  thumbnail_url: text(105, "Thumbnail URL. Meta's URLs expire after a while."),
  image_url: text(106, "Image URL."),
  object_type: text(107, "Kind of creative, such as SHARE or VIDEO."),
  object_story_id: text(108, "ID of the page post the ad uses."),
  link_url: text(109, "Link the ad points to."),
  url_tags: text(110, "Query string added to the link."),
});

const adFields = {
  account_id: text(3, "Ad account ID."),
  campaign_id: text(4, "Campaign ID."),
  adset_id: text(5, "Ad set ID."),
  name: text(6, "Ad name."),
  status: text(7, "Status set by the advertiser: ACTIVE, PAUSED, ARCHIVED, or DELETED."),
  effective_status: text(8, "Status after parents and review, such as DISAPPROVED."),
  created_time: time(9, "Time the ad was created."),
  updated_time: time(10, "Time the ad was last updated."),
  creative: Schema.optional(CreativeSchema).pipe(field(11, "The ad's creative.")),
};

export const AdApiSchema = Schema.Struct({ id: Schema.String, ...adFields });

export const AdSchema = Schema.Struct({
  id: objectId("Ad"),
  version,
  ...adFields,
})
  .annotate({ description: "Facebook ads, with their creative." })
  .pipe(Iceberg.identifier("id"));

export type Ad = Schema.Schema.Type<typeof AdSchema>;
