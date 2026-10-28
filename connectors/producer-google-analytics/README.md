# Google Analytics producer

Syncs daily reports from one Google Analytics 4 property: totals, traffic
sources, user acquisition, pages, landing pages, events, locations, devices, and
ecommerce items. It backfills each report day by day and reads recent days
again, because Google keeps updating them.

## Config

| Variable           | Required | Default     |
| ------------------ | -------- | ----------- |
| `GA_PROPERTY_ID`   | yes      | none        |
| `GA_CLIENT_EMAIL`  | yes      | none        |
| `GA_PRIVATE_KEY`   | yes      | none        |
| `GA_START_DATE`    | no       | 2 years ago |
| `GA_LOOKBACK_DAYS` | no       | 14          |

## Setup

1. In Google Cloud, enable the **Google Analytics Data API** for a project.
2. Create a service account in that project. It needs no roles. Add a JSON key
   and download it.
3. In Google Analytics, go to Admin > Property access management and add the
   service account's email as a **Viewer**.
4. Set `GA_CLIENT_EMAIL` and `GA_PRIVATE_KEY` from `client_email` and
   `private_key` in the key file. The property ID is under Admin > Property
   details.

## Data

- One row per day and dimension values. The key is a JSON array of the property
  ID, the day, and the dimension values.
- Days are in the property's time zone. Today is never read, since its numbers
  are partial.
- Counts are `long`. Key events, revenue, and durations are `double`. Revenue is
  in `currency_code`.
- User counts are distinct users, so they don't add up across rows or days. Use
  `daily_overview` for a day's users. Sessions, views, events, and revenue do
  add up.
- `(not set)`, `(other)`, and empty strings are real values. Google groups rare
  values into `(other)` on large properties, and leaves out rows with few users.
- When a later read of a day drops a row, the old row stays.
- A change to the attribution model or other property settings changes past
  numbers. Backfill again to pick it up.
- Page titles and paths can hold personal data if the site puts it there.

## Limits

- A standard property gets 200,000 tokens a day and 40,000 an hour, and 10
  requests at once. The connector sends at most 5 at once. A used-up quota waits
  and tries again.
- Each run reads the last `GA_LOOKBACK_DAYS` again, every 6 hours. Google says
  data can arrive up to 7 days late, and key event credit can change for 12
  days.

## Demo data

`pnpm demo --size 8MiB` writes made-up Google Analytics data without Google
Analytics credentials. See the Connector Kit README for the flags and the
variables it needs.

Each group is one day of every report, counting back from yesterday, for a
made-up online store. It stops after two years, about 9 MiB. Traffic sources,
locations, and devices add up to the day's sessions, and traffic dips at
weekends.

## Local development

```bash
cd connectors/producer-google-analytics
pnpm sandbox
```

`pnpm start` runs the hosted connector. It needs the Wings and PostgreSQL
variables from the [Connector Kit README](../../packages/connector-kit/README.md).
