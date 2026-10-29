# Facebook Ads producer

Syncs ad accounts, campaigns, ad sets, and ads from one or more Meta ad
accounts, plus daily performance per ad: totals and breakdowns by age and
gender, country, and platform. It backfills insights day by day and reads recent
days again, because Meta keeps updating them.

## Config

| Variable                     | Required | Default     |
| ---------------------------- | -------- | ----------- |
| `FACEBOOK_ADS_ACCESS_TOKEN`  | yes      | none        |
| `FACEBOOK_ADS_ACCOUNT_IDS`   | yes      | none        |
| `FACEBOOK_ADS_START_DATE`    | no       | 2 years ago |
| `FACEBOOK_ADS_LOOKBACK_DAYS` | no       | 28          |

`FACEBOOK_ADS_ACCOUNT_IDS` is a comma-separated list, with or without `act_`.

## Setup

1. Create a Meta app of type Business and add the **Marketing API** product.
   Connect it to the business portfolio that owns the ad accounts.
2. In Business Settings, go to Users > System users and add a system user.
3. Assign it the ad accounts with the **View performance** permission, and
   assign it the app.
4. Generate a token for the app with only `ads_read`, and set expiry to
   **Never**.

A new app has Limited access, which Meta rate-limits heavily. It can read your
own ad accounts. Full access needs App Review, after enough successful calls.

## Data

- `version` is the time the row was read.
- Budgets, bids, and account amounts are `long` in the currency's minor unit,
  such as cents. Insights spend is a `double` in the account currency, in
  `account_currency`.
- Insights have one row per ad, day, and breakdown values. The key is a JSON
  array of the account ID, ad ID, day, and breakdown values.
- Days are in each ad account's time zone. Today is read too, and grows on each
  run.
- `actions`, `action_values`, and the other action fields are maps from action
  type to value, such as `actions['purchase']`. The values use the account's
  attribution setting, the same as Ads Manager.
- `reach` counts people, so it doesn't add up across rows or days. With a
  breakdown, Meta leaves `reach` out for days more than 13 months back.
- Meta keeps 37 months of insights. An older start date moves up to that.
- Deleted and archived campaigns, ad sets, and ads stay, with their status.
  Their insights stay too.
- A change to the account's attribution setting changes past numbers. Backfill
  again to pick it up.

## Demo data

`pnpm demo --size 128MiB` writes made-up Facebook Ads data without Meta
credentials. See the Connector Kit README for the flags and the variables it
needs.

Two ad accounts with their campaigns, ad sets, and ads are written once. Each
group is one day of insights, counting back from today. It stops at Meta's 37
months, about 225 MiB. Ads only have insights while their campaign runs, and the
breakdowns add up to the ad's day.

## Limits

- Meta limits calls per ad account per hour, based on the access tier and the
  number of active ads. A limit error waits and tries again.
- Insights read the last `FACEBOOK_ADS_LOOKBACK_DAYS` again every 6 hours. Meta
  says insights don't change after 28 days.
- Campaigns are read in full every 6 hours. Ad sets and ads read only the ones
  updated since the last run.

## Local development

```bash
cd connectors/producer-facebook-ads
pnpm sandbox
```

`pnpm start` runs the hosted connector. It needs the Wings and PostgreSQL
variables from the [Connector Kit README](../../packages/connector-kit/README.md).

To record the VCR cassette, put a sandbox ad account's ID and token in `.env`,
delete `test/__cassettes__/api.vcr.test.cassette`, and run `pnpm test:ci`. A
sandbox never delivers ads, so insights stay empty.
