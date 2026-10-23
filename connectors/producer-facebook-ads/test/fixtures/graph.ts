// Shaped like the Graph API reference examples: IDs and numbers as strings,
// times with a `+0000` offset, and cursor paging.

export const page = (data: ReadonlyArray<unknown>, after?: string) => ({
  data,
  paging: {
    cursors: { before: "MAZDZD", after: after ?? "MjQZD" },
    ...(after === undefined
      ? {}
      : { next: `https://graph.facebook.com/v26.0/next?after=${after}` }),
  },
});

export const adAccount = {
  id: "act_1234567890",
  account_id: "1234567890",
  name: "Acme Store",
  currency: "USD",
  timezone_name: "America/Los_Angeles",
  timezone_offset_hours_utc: -7,
  account_status: 1,
  disable_reason: 0,
  amount_spent: "1834227",
  spend_cap: "0",
  created_time: "2024-03-11T17:22:41+0000",
};

export const campaign = {
  id: "120200000000001",
  account_id: "1234567890",
  name: "Autumn sale",
  objective: "OUTCOME_SALES",
  status: "ACTIVE",
  effective_status: "ACTIVE",
  buying_type: "AUCTION",
  bid_strategy: "LOWEST_COST_WITHOUT_CAP",
  daily_budget: "5000",
  special_ad_categories: [],
  start_time: "2026-10-01T09:00:00+0000",
  created_time: "2026-09-30T16:12:05+0000",
  updated_time: "2026-10-18T14:05:12+0000",
};

export const ad = {
  id: "120210000000001",
  account_id: "1234567890",
  campaign_id: "120200000000001",
  adset_id: "120205000000001",
  name: "Autumn sale - carousel",
  status: "ACTIVE",
  effective_status: "ACTIVE",
  created_time: "2026-10-01T09:30:00+0000",
  updated_time: "2026-10-18T14:05:12+0000",
  creative: {
    id: "120215000000001",
    name: "Autumn sale creative",
    title: "Autumn sale",
    body: "Up to 30% off this week.",
    call_to_action_type: "SHOP_NOW",
    thumbnail_url: "https://scontent.xx.fbcdn.net/v/t45.1600-4/thumb.jpg",
    object_type: "SHARE",
    object_story_id: "102030405060708_908070605040302",
  },
};

export const ageGenderInsight = {
  account_id: "1234567890",
  campaign_id: "120200000000001",
  adset_id: "120205000000001",
  ad_id: "120210000000001",
  date_start: "2026-10-19",
  date_stop: "2026-10-19",
  account_currency: "USD",
  impressions: "1520",
  reach: "1310",
  clicks: "48",
  inline_link_clicks: "37",
  spend: "23.41",
  actions: [
    { action_type: "link_click", value: "37" },
    { action_type: "offsite_conversion.fb_pixel_purchase", value: "2" },
    { action_type: "purchase", value: "2" },
  ],
  action_values: [{ action_type: "purchase", value: "86.5" }],
  age: "25-34",
  gender: "female",
};

export const insight = (adId: string, day: string) => ({
  account_id: "1234567890",
  ad_id: adId,
  date_start: day,
  date_stop: day,
  account_currency: "USD",
  impressions: "100",
  spend: "1.5",
});
