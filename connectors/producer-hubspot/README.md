# HubSpot producer

Syncs HubSpot CRM records, custom objects, owners, teams, pipelines, lists, and
property definitions from one HubSpot account. It backfills each resource, then
polls CRM records and custom objects every 5 minutes and the rest every hour.
With an app client secret, it also takes webhooks at `POST /webhooks/hubspot`.

| Resource                                                                         | What                                                       |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `contacts`, `companies`, `deals`, `tickets`                                      | Core CRM records                                           |
| `calls`, `emails`, `meetings`, `notes`, `tasks`, `communications`, `postal_mail` | Activities                                                 |
| `feedback_submissions`                                                           | Answers to feedback surveys                                |
| `line_items`, `products`, `quotes`, `discounts`, `fees`, `taxes`                 | Products and quotes                                        |
| `leads`                                                                          | Leads                                                      |
| `invoices`, `orders`, `carts`, `commerce_payments`, `subscriptions`              | Commerce                                                   |
| `goal_targets`, `deal_split`                                                     | Goals and deal splits                                      |
| `users`                                                                          | HubSpot users with their user properties                   |
| `custom_objects`                                                                 | Records of every custom object type                        |
| `owners`, `teams`                                                                | Record owners and their teams                              |
| `pipelines`                                                                      | Pipelines and their stages                                 |
| `lists`                                                                          | Lists (segments), without members                          |
| `properties`                                                                     | Property definitions, to name `properties` keys and values |

## Config

| Variable                | Required | Default |
| ----------------------- | -------- | ------- |
| `HUBSPOT_ACCESS_TOKEN`  | yes      | none    |
| `HUBSPOT_CLIENT_SECRET` | no       | none    |

Without `HUBSPOT_CLIENT_SECRET`, webhooks are off and every change comes from
polling.

## Setup

For polling only, create a service key under **Development → Keys → Service
keys** with these read scopes:

- `crm.objects.contacts.read`, `crm.schemas.contacts.read`
- `crm.objects.companies.read`, `crm.schemas.companies.read`
- `crm.objects.deals.read`, `crm.schemas.deals.read`
- `crm.objects.tickets.read`, `crm.schemas.tickets.read`
- `crm.objects.line_items.read`, `crm.schemas.line_items.read`
- `crm.objects.products.read`
- `crm.objects.owners.read`
- `sales-email-read`
- `crm.objects.quotes.read`, `crm.objects.leads.read`
- `crm.objects.feedback_submissions.read`, `crm.objects.goals.read`,
  `crm.objects.users.read`
- `crm.objects.invoices.read`, `crm.objects.orders.read`,
  `crm.objects.carts.read`, `crm.objects.commercepayments.read`,
  `crm.objects.subscriptions.read`
- `crm.objects.custom.read`, `crm.schemas.custom.read`
- `crm.lists.read`, `settings.users.teams.read`

Communications, postal mail, discounts, fees, taxes, and deal splits need no
extra scope.

Use the key as `HUBSPOT_ACCESS_TOKEN`.

Service keys can't receive webhooks. For webhooks, upload the app in
`hubspot-app/` with the HubSpot CLI instead:

1. Set `targetUrl` in `hubspot-app/src/app/webhooks/webhooks-hsmeta.json` to
   `<connector>/webhooks/hubspot`.
2. Run `hs account auth`, then `hs project upload` from `hubspot-app/`.
3. Install the app from **Development → Projects → airfoil-connector →
   Distribution**.
4. Use the access token from the Distribution tab as `HUBSPOT_ACCESS_TOKEN` and
   the client secret from the Auth tab as `HUBSPOT_CLIENT_SECRET`.

The app asks for every scope above, and apps with static auth can't make a
scope optional. On an account without a feature, such as custom objects, leads,
or Commerce Hub, remove its scopes from `hubspot-app/src/app/app-hsmeta.json`
and its subscriptions from `webhooks-hsmeta.json` before uploading.

For custom object webhooks, add `object.creation`, `object.deletion`, and
`object.restore` subscriptions with the object's name, such as `vehicle`, as
`objectType`. The app can't list each account's custom objects for you.

One token reads one account, so run one connector per account.

## API version

The connector uses the `2026-09` API paths, such as
`/crm/objects/2026-09/contacts`.

## Data

- CRM tables keep every non-empty property in `properties`, by internal name,
  as strings. New custom properties show up on their own. Sensitive properties
  are left out.
- Contacts, deals, tickets, activities, quotes, leads, commerce records, line
  items, deal splits, and custom objects have lists of associated record IDs.
- `custom_objects` holds every custom object type. `object_type_id` (such as
  `2-123`) and `object_type` (its name) say which, and `key` is
  `<object_type_id>:<id>`. Rows of a deleted type stay.
- `properties` names the keys in `properties` and the values of dropdowns.
  Pipeline stages are in `pipelines`.
- `users` has user properties. `owners` maps users to the owner IDs on records.
- A deleted record gets `_deleted`. So do records merged into another one.
- Owners, pipelines, and property definitions stay with `archived = true` when
  removed. Removed teams and lists stay as they were.
- CRM record tables, custom objects included, hold customer data such as
  names, emails, phone numbers, message bodies, and form answers. Treat them
  as customer data.

## Limits

- Calculated properties and association lists can be a day old, or a week for
  activities, line items, and products. Webhooks bring association changes
  right away.
- Without webhooks, these deletes are missed: GDPR deletes, and deleted emails,
  meetings, communications, invoices, payments, subscriptions, users, and deal
  splits. HubSpot can't list them.
- An account without a feature, such as leads or custom objects, or a token
  without its scope, leaves that table in error. The other tables keep syncing.
- Deal splits have no webhooks, so they only come from polling. Custom object
  association lists also only update by polling, at most a day late.
- A new custom object type shows up within an hour.
- A record restored from the recycle bin comes back on its next read: a
  webhook, a search hit, or the full re-read.
- Searches, polls of deleted records, and full re-reads share the account's
  daily API limit with its other apps.

## Local development

```bash
cd connectors/producer-hubspot
pnpm sandbox
```

To record VCR, put a test account's service key in `.env`, delete
`test/__cassettes__/api.vcr.test.cassette`, and run `pnpm test:ci`. Recording
takes a few minutes. Check the new cassette for personal data before committing
it.

`pnpm start` runs the hosted connector. It needs the Wings and PostgreSQL
variables from the Connector Kit README.
