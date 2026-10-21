# Google Analytics producer

## Current scope

- Resources: 9 fixed daily reports (see `src/resources/reports/specs.ts`)
- Auth: a service account JSON key, signed as an RS256 JWT, for one property
- Changes: every 6 hours, reading the last `GA_LOOKBACK_DAYS` again
- Webhooks: none. GA has none for report data.

## Google Analytics rules

- Every request is a Data API `runReport` through `src/client`, so VCR records
  it. The version is in the URL, `v1beta`.
- A request takes at most 9 dimensions, 10 metrics, and 4 date ranges. The
  earliest day is 2015-08-14.
- Every value comes as a string. `TYPE_INTEGER` metrics are `long`; float,
  currency, and seconds metrics are `double`. `keyEvents` is a float.
- An empty report has no `rows` or `rowCount`. A report with no dimensions has
  no `dimensionHeaders`, so every request asks for `date`.
- A used-up quota returns 429 `RESOURCE_EXHAUSTED`. It can also be the 10
  concurrent requests limit, so the client first retries quickly, then keeps
  waiting, with at most 10 minutes between tries. A failed source stays
  stopped until restart.
- 500 and 503 count against a small server error quota, so they get only the
  normal retries.

Each request reads one day, ordered by every dimension so offset pages stay
stable. Days are in the property's time zone, which the client reads from a
report's `metadata.timeZone`. Backfill ends the day before the cutoff. Changes
read the last `lookbackDays` days, ending yesterday, plus any days missed since
the last run. A run reads one page per fetch and resumes from its cursor.

Rows have no update time, so the version is the fetch time. A row that drops
out of a later read isn't deleted.

For a new report, check its fields with `checkCompatibility` and their types in
`metricHeaders`. Keep it to pairs Google shows in its own reports.

Record VCR against the test property only, on a day after the seeded data is
processed.
