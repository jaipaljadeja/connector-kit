# Code

We want the connector to be easy to read for someone who opens it for the first
time. Keep it clean and simple. No patchy work.

## Structure

Something like this:

```text
src/
  index.ts
  main.ts
  start.ts
  sandbox.ts
  manifest.ts
  connector.ts
  create-table.ts
  demo/          demo data and command
  client/        API client, auth, errors
  schemas/       one file per resource, plus shared fields
  resources/     one file per resource
  webhook/       route and signature check
test/
  fixtures/
```

It does not have to match exactly. Skip what you don't need.

## Client

All the API stuff goes in the client: auth, headers, retries, rate limits,
pagination and decoding. Resources should just call the client.

Write pagination once and reuse it.

## Resources and schemas

Keep each resource in its own file. If resources look the same, a small shared
helper is fine, but don't build a framework around it.

One schema per resource that decodes the API response into the row. Don't write
a second schema and map every field by hand.

Follow the provider docs for required and nullable fields. Don't make
everything optional just to be safe.

## Tables

Export the row schemas by resource name and add the connector's `create-table`
command with `ConnectorApp.makeCreateTableCommand`. Add it to the main CLI.

Hosted startup creates missing tables from the same schemas and checks the
schema of existing tables. It does not migrate schema changes.

## Demo

`src/demo/` builds made-up rows for every resource with `Demo.define`. The
template has the smallest one. See the Connector Kit README "Demo data" section,
and Stripe for one with setup tables.

- `index.ts` defines the demo with `Demo.define` and exports `demoCommand` for
  the main CLI.
- `shared.ts` has the IDs, constants, row types, and `clock`.
- `setup.ts` has `setupRows`, the rows written once.
- One file has the group, named after it, such as `customers.ts`. When it grows
  past about 400 lines, move each area to its own file, as Salesforce does with
  contacts and cases. The area functions take one typed group object, such as
  `AccountGroup`, with the run's tools, the rows, and what they need to know.

The run shares one seeded Faker, so moving a call changes the data and the
snapshots.

- Rows should look like the provider's: real ID formats, statuses, and units.
  Keys come from the group index, and links point to rows that exist.
- Put fixed setup, such as a catalog, in the `setup` tables. One group is one
  related unit, such as a customer and their orders.
- Name the functions like the other connectors: `setupRows` for the setup
  rows, `<unit>Rows(index, context)` for a group, with a "One group is" JSDoc,
  and `clock(context)` for dates that must not pass the run time.
- If the provider only keeps so much history, set `group.count`.
- Test that every link resolves, and that the demo tables match the resources.
- Add a short "Demo data" section to the README.

## Effect

Write proper Effect code, not async code wrapped in Effect. Use services and
layers, `Effect.fn`, `Schema`, `Stream`, and `Schedule` where they fit.

Prefer inference. Do not use `any` or casts to hide a type error.
Use `as const` when useful. Keep other assertions narrow and explain why.

## Tests

Use `@effect/vitest`. Fake the client with a layer instead of casting.
