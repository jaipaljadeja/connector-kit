import { ConnectorError, Cursor, Fetch } from "@useairfoil/connector-kit";
import { DateTime, Duration, Effect, Option, Schema, Stream } from "effect";

import type { FacebookAdsClientService } from "../client/client";

import { nextAfter, PageSchema } from "../schemas/api";
import {
  AdAccountApiSchema,
  type AdAccount,
  AdAccountSchema,
  type Ad,
  AdApiSchema,
  type AdSet,
  AdSetApiSchema,
  type Campaign,
  CampaignApiSchema,
  CreativeSchema,
} from "../schemas/objects";

const pageSize = 500;
const changesInterval = Duration.hours(6);
// Rows can commit with an older `updated_time`, so each read starts a bit early.
const changesOverlap = Duration.minutes(5);

// Lists leave out archived and deleted objects unless asked. The
// `effective_status` param rejects DELETED, but `filtering` takes it.
const campaignStatuses = ["ACTIVE", "PAUSED", "ARCHIVED", "DELETED", "IN_PROCESS", "WITH_ISSUES"];
const adSetStatuses = [...campaignStatuses, "CAMPAIGN_PAUSED"];
const adStatuses = [
  ...adSetStatuses,
  "ADSET_PAUSED",
  "PENDING_REVIEW",
  "DISAPPROVED",
  "PREAPPROVED",
  "PENDING_BILLING_INFO",
];

/** The `fields` param, with the creative's fields expanded. */
const fieldsParam = (fields: Readonly<Record<string, unknown>>) =>
  Object.keys(fields)
    .map((name) =>
      name === "creative" ? `creative{${Object.keys(CreativeSchema.fields).join(",")}}` : name,
    )
    .join(",");

type Item = { readonly id: string };

type ListSpec<A extends Item, Row extends object> = {
  /** Resource name, such as `ads`. */
  readonly name: string;
  /** The list under the account, such as `ads`. */
  readonly edge: string;
  /** The object in filter fields, such as `ad` in `ad.effective_status`. */
  readonly object: string;
  readonly item: Schema.Decoder<A> & {
    readonly fields: Readonly<Record<string, unknown>>;
  };
  readonly statuses: ReadonlyArray<string>;
  /** Lists with `updated_since` read only changed objects. */
  readonly updatedSince: boolean;
  readonly toRow: (item: A, version: Date) => Row;
};

const readPage = <A extends Item, Row extends object>(
  client: FacebookAdsClientService,
  spec: ListSpec<A, Row>,
  account: string,
  options: {
    readonly after?: string;
    readonly limit?: number;
    readonly updatedSince?: DateTime.Utc;
  } = {},
) =>
  client
    .get(spec.name, PageSchema(spec.item), `/act_${account}/${spec.edge}`, {
      fields: fieldsParam(spec.item.fields),
      filtering: JSON.stringify([
        { field: `${spec.object}.effective_status`, operator: "IN", value: spec.statuses },
      ]),
      limit: String(options.limit ?? pageSize),
      ...(options.after === undefined ? {} : { after: options.after }),
      ...(options.updatedSince === undefined
        ? {}
        : {
            updated_since: String(Math.floor(DateTime.toEpochMillis(options.updatedSince) / 1000)),
          }),
    })
    .pipe(
      Effect.map((page) => ({
        items: page.data,
        next: nextAfter(page),
      })),
    );

const readAll = <A extends Item, Row extends object>(
  client: FacebookAdsClientService,
  spec: ListSpec<A, Row>,
  accounts: ReadonlyArray<string>,
  updatedSince: (account: string) => DateTime.Utc | undefined,
) =>
  Stream.fromIterable(accounts).pipe(
    Stream.flatMap((account) =>
      Stream.paginate(Option.none<string>(), (after) =>
        readPage(client, spec, account, {
          ...Option.match(after, {
            onNone: () => ({}),
            onSome: (after) => ({ after }),
          }),
          ...Option.match(Option.fromNullishOr(updatedSince(account)), {
            onNone: () => ({}),
            onSome: (since) => ({ updatedSince: since }),
          }),
        }).pipe(Effect.map(({ items, next }) => [items, Option.map(next, Option.some)] as const)),
      ),
    ),
    Stream.runCollect,
  );

const PageCursorSchema = Schema.fromJsonString(
  Schema.Struct({ account: Schema.String, after: Schema.optional(Schema.String) }),
);

/** `accounts` were read up to `since`. Others are new and read in full. */
const ChangesCursorSchema = Schema.Struct({
  since: Schema.DateTimeUtcFromString,
  accounts: Schema.Array(Schema.String),
});

// The first cursor is the backfill cutoff, a plain ISO time.
const ChangesCursorCodec = Schema.Union([
  Schema.fromJsonString(ChangesCursorSchema),
  Schema.DateTimeUtcFromString,
]);

const cursorError = (cause: Schema.SchemaError) =>
  new ConnectorError({ message: "Invalid Facebook Ads cursor", cause });

/**
 * Backfill reads every object, one page per fetch. Changes read objects
 * updated since the last run, or every object when the list can't filter.
 */
export const listSources = <A extends Item, Row extends object>(
  client: FacebookAdsClientService,
  accounts: ReadonlyArray<string>,
  spec: ListSpec<A, Row>,
) => ({
  check: readPage(client, spec, accounts[0] ?? "", { limit: 1 }).pipe(Effect.asVoid),
  backfill: Fetch.page({
    pageCursor: Cursor.string(),
    cutoff: Cursor.isoDateTime(),
    fetch: ({ pageCursor }) =>
      Effect.gen(function* () {
        const saved =
          pageCursor === undefined
            ? undefined
            : yield* Schema.decodeUnknownEffect(PageCursorSchema)(String(pageCursor)).pipe(
                Effect.mapError(cursorError),
              );
        const at =
          saved !== undefined && accounts.includes(saved.account)
            ? saved
            : { account: accounts[0] ?? "" };

        const page = yield* readPage(
          client,
          spec,
          at.account,
          at.after === undefined ? {} : { after: at.after },
        );
        const version = yield* DateTime.nowAsDate;
        const rows = page.items.map((item) => spec.toRow(item, version));

        const next = Option.match(page.next, {
          onSome: (after) => Option.some({ account: at.account, after }),
          onNone: () =>
            Option.map(
              Option.fromNullishOr(accounts[accounts.indexOf(at.account) + 1]),
              (account) => ({ account }),
            ),
        });
        if (Option.isNone(next)) return { rows, hasMore: false };

        return {
          rows,
          hasMore: true,
          nextPageCursor: yield* Schema.encodeEffect(PageCursorSchema)(next.value).pipe(
            Effect.mapError(cursorError),
          ),
        };
      }),
  }),
  changes: Fetch.changes({
    cursor: Cursor.string(),
    interval: changesInterval,
    fetch: ({ cursor }) =>
      Effect.gen(function* () {
        const now = yield* DateTime.now;
        const decoded = yield* Schema.decodeUnknownEffect(ChangesCursorCodec)(String(cursor)).pipe(
          Effect.mapError(cursorError),
        );

        // Backfill read every configured account.
        const state = DateTime.isDateTime(decoded) ? { since: decoded, accounts } : decoded;
        const since = DateTime.subtractDuration(state.since, changesOverlap);

        const items = yield* readAll(client, spec, accounts, (account) =>
          spec.updatedSince && state.accounts.includes(account) ? since : undefined,
        );

        const version = DateTime.toDateUtc(now);
        return {
          rows: items.map((item) => spec.toRow(item, version)),
          cursor: yield* Schema.encodeEffect(Schema.fromJsonString(ChangesCursorSchema))({
            since: now,
            accounts,
          }).pipe(Effect.mapError(cursorError)),
        };
      }),
  }),
});

export const adAccountsResource = (
  client: FacebookAdsClientService,
  accounts: ReadonlyArray<string>,
) => {
  const read = Effect.gen(function* () {
    const items = yield* Effect.forEach(accounts, (account) =>
      client.get("ad_accounts", AdAccountApiSchema, `/act_${account}`, {
        fields: fieldsParam(AdAccountApiSchema.fields),
      }),
    );

    const version = yield* DateTime.nowAsDate;
    return items.map(
      ({ account_id, ...item }): AdAccount => ({
        id: account_id,
        version,
        ...item,
      }),
    );
  });

  return {
    name: "ad_accounts",
    rowSchema: AdAccountSchema,
    version: "version" as const,
    // Also confirms the token can read every account.
    check: read.pipe(Effect.asVoid),
    backfill: Fetch.page({
      pageCursor: Cursor.string(),
      cutoff: Cursor.isoDateTime(),
      fetch: () => read.pipe(Effect.map((rows) => ({ rows, hasMore: false }))),
    }),
    changes: Fetch.changes({
      cursor: Cursor.string(),
      interval: changesInterval,
      fetch: () =>
        Effect.all([read, DateTime.now]).pipe(
          Effect.map(([rows, now]) => ({
            rows,
            cursor: DateTime.formatIso(now),
          })),
        ),
    }),
  };
};

export const campaigns: ListSpec<typeof CampaignApiSchema.Type, Campaign> = {
  name: "campaigns",
  edge: "campaigns",
  object: "campaign",
  item: CampaignApiSchema,
  statuses: campaignStatuses,
  // The campaigns list has no `updated_since`. Accounts have few campaigns.
  updatedSince: false,
  toRow: (item, version) => ({ ...item, version }),
};

export const adSets: ListSpec<typeof AdSetApiSchema.Type, AdSet> = {
  name: "ad_sets",
  edge: "adsets",
  object: "adset",
  item: AdSetApiSchema,
  statuses: adSetStatuses,
  updatedSince: true,
  toRow: (item, version) => ({ ...item, version }),
};

export const ads: ListSpec<typeof AdApiSchema.Type, Ad> = {
  name: "ads",
  edge: "ads",
  object: "ad",
  item: AdApiSchema,
  statuses: adStatuses,
  updatedSince: true,
  toRow: (item, version) => ({ ...item, version }),
};
