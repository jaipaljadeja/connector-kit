import type { Demo } from "@useairfoil/connector-kit";

import { DateTime, Record } from "effect";

import {
  accounts,
  adId,
  adSetId,
  ageRanges,
  ageWeights,
  audiences,
  campaignId,
  campaigns,
  day,
  formats,
  placements,
  type Rows,
  runs,
  split,
} from "./shared";

type Counts = Record.ReadonlyRecord<
  | "impressions"
  | "clicks"
  | "linkClicks"
  | "landingViews"
  | "spendCents"
  | "purchases"
  | "valueCents",
  number
>;

/**
 * Splits an ad's day across the breakdown rows, so each count adds up to the day.
 * The funnel is split step by step, so no row has more purchases than landing
 * views, or more link clicks than clicks.
 */
const splitDay = <A>(
  day: Counts,
  parts: ReadonlyArray<A>,
  weight: (part: A) => number,
): Array<readonly [A, Counts]> => {
  const steps = Record.map(
    {
      purchases: day.purchases,
      landingViews: day.landingViews - day.purchases,
      linkClicks: day.linkClicks - day.landingViews,
      clicks: day.clicks - day.linkClicks,
      impressions: day.impressions - day.clicks,
      spendCents: day.spendCents,
      valueCents: day.valueCents,
    },
    (count) => split(count, parts.map(weight)),
  );

  return parts.map((part, k) => {
    const step = Record.map(steps, (counts) => counts[k] ?? 0);
    const landingViews = step.purchases + step.landingViews;
    const linkClicks = landingViews + step.linkClicks;
    const clicks = linkClicks + step.clicks;

    return [
      part,
      { ...step, landingViews, linkClicks, clicks, impressions: clicks + step.impressions },
    ];
  });
};

/** One group is one day of insights for every ad that ran, counting back from today. */
export const dayRows = (index: number, { faker, now }: Demo.DemoContext): Rows => {
  const rows: Rows = {
    ads_insights: [],
    ads_insights_age_gender: [],
    ads_insights_country: [],
    ads_insights_platform: [],
  };

  const today = new Date(now.getTime() - index * day);
  const date = DateTime.formatIsoDateUtc(DateTime.fromDateUnsafe(today));

  for (const run of runs(now)) {
    if (today < run.started || (run.stopped && today > run.stopped)) continue;
    const account = accounts[run.account] ?? accounts[0];
    const [, objective, budget] = campaigns[run.campaign] ?? campaigns[0];

    audiences.forEach((_, s) => {
      formats.forEach((format, f) => {
        const ad = adId(run.account, run.campaign, s, f);

        const base = {
          version: now,
          account_id: account.id,
          campaign_id: campaignId(run.account, run.campaign),
          adset_id: adSetId(run.account, run.campaign, s),
          ad_id: ad,
          date,
          account_currency: account.currency,
        };

        const id = (...breakdowns: ReadonlyArray<string>) =>
          JSON.stringify([account.id, ad, date, ...breakdowns]);

        // Each ad gets a share of its campaign's daily budget.
        const spendCents = Math.round(
          (budget / (audiences.length * formats.length)) *
            faker.number.float({ min: 0.7, max: 1.1 }),
        );

        const impressions = Math.round(
          (spendCents / 100) * faker.number.float({ min: 70, max: 130 }),
        );

        const clicks = Math.round(impressions * faker.number.float({ min: 0.008, max: 0.02 }));
        const linkClicks = Math.round(clicks * 0.7);

        const purchases =
          objective === "OUTCOME_SALES"
            ? Math.round(linkClicks * faker.number.float({ min: 0.01, max: 0.04 }))
            : 0;

        const value = Math.round(purchases * faker.number.float({ min: 55, max: 80 }) * 100) / 100;

        const counts: Counts = {
          impressions,
          clicks,
          linkClicks,
          landingViews: Math.round(linkClicks * 0.8),
          spendCents,
          purchases,
          valueCents: Math.round(value * 100),
        };

        // Reach counts people, so it doesn't add up across rows.
        const metrics = (part: Counts) => ({
          impressions: BigInt(part.impressions),
          reach: BigInt(Math.round(part.impressions * 0.82)),
          clicks: BigInt(part.clicks),
          inline_link_clicks: BigInt(part.linkClicks),
          spend: part.spendCents / 100,
          actions: new Map([
            ["link_click", part.linkClicks],
            ["landing_page_view", part.landingViews],
            ...(purchases > 0 ? [["purchase", part.purchases] as const] : []),
          ]),
          action_values: new Map(
            purchases > 0 ? [["purchase", part.valueCents / 100] as const] : [],
          ),
        });

        rows.ads_insights.push({
          id: id(),
          ...base,
          ...metrics(counts),
          conversions: new Map(purchases > 0 ? [["purchase", purchases] as const] : []),
          conversion_values: new Map(purchases > 0 ? [["purchase", value] as const] : []),
          ...(format.video
            ? {
                video_play_actions: new Map([["video_view", Math.round(impressions * 0.35)]]),
                video_p25_watched_actions: new Map([["video_view", Math.round(impressions * 0.2)]]),
                video_p50_watched_actions: new Map([
                  ["video_view", Math.round(impressions * 0.12)],
                ]),
                video_p75_watched_actions: new Map([
                  ["video_view", Math.round(impressions * 0.07)],
                ]),
                video_p100_watched_actions: new Map([
                  ["video_view", Math.round(impressions * 0.04)],
                ]),
              }
            : {}),
        });

        const ageGender = ageRanges.flatMap((age, a) =>
          (["female", "male"] as const).map((gender) => ({
            age,
            gender,
            weight: (ageWeights[a] ?? 1) * (gender === "female" ? 52 : 48),
          })),
        );

        for (const [part, share] of splitDay(counts, ageGender, (part) => part.weight)) {
          rows.ads_insights_age_gender.push({
            id: id(part.age, part.gender),
            ...base,
            age: part.age,
            gender: part.gender,
            ...metrics(share),
          });
        }

        const countries = splitDay(counts, account.countries, (country) =>
          country === account.countries[0] ? 3 : 1,
        );

        for (const [country, share] of countries) {
          rows.ads_insights_country.push({ id: id(country), ...base, country, ...metrics(share) });
        }

        for (const [[platform, position], share] of splitDay(
          counts,
          placements,
          ([, , weight]) => weight,
        )) {
          rows.ads_insights_platform.push({
            id: id(platform, position),
            ...base,
            publisher_platform: platform,
            platform_position: position,
            ...metrics(share),
          });
        }
      });
    });
  }

  return rows;
};
