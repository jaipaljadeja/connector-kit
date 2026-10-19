import { ConnectorError, Cursor, Fetch } from "@useairfoil/connector-kit";
import { DateTime, Duration, Effect, Option, Schema, Stream } from "effect";

import type { IncidentIoClientService } from "../client/client";

import { Optional, PaginationMetaSchema } from "../schemas/shared";

export const hourly = Duration.hours(1);
export const changesInterval = Duration.minutes(5);
// Rows can commit with an older `updated_at`, so each read starts a bit early.
export const changesOverlap = Duration.minutes(5);

type Param =
  | string
  | ReadonlyArray<string>
  | Readonly<Record<string, string | ReadonlyArray<string>>>;

export type Params = Readonly<Record<string, Param>>;

export type ListOptions<A> = {
  readonly path: string;
  /** The response key that holds the items, such as `incidents`. */
  readonly key: string;
  readonly item: Schema.Decoder<A>;
  readonly params?: Params;
  /** A `404` gives no items, such as the lists of an incident that's gone. */
  readonly emptyIfMissing?: boolean;
};

/** Stops only when `after` is missing. A short page isn't the end. */
export const readPage = <A>(
  client: IncidentIoClientService,
  options: ListOptions<A>,
  after: Option.Option<string> = Option.none(),
) => {
  const schema = Schema.Struct({
    items: Schema.Array(options.item),
    pagination_meta: Optional(PaginationMetaSchema),
  }).pipe(Schema.encodeKeys({ items: options.key }));
  const params = {
    ...options.params,
    ...Option.match(after, { onNone: () => ({}), onSome: (cursor) => ({ after: cursor }) }),
  };
  const page = options.emptyIfMissing
    ? client
        .find(schema, options.path, params)
        .pipe(Effect.map(Option.getOrElse(() => ({ items: [], pagination_meta: undefined }))))
    : client.get(schema, options.path, params);
  return page.pipe(
    Effect.map(({ items, pagination_meta }) => ({
      items,
      next: Option.fromNullishOr(pagination_meta?.after),
    })),
  );
};

export const listAll = <A>(
  client: IncidentIoClientService,
  options: ListOptions<A>,
): Effect.Effect<ReadonlyArray<A>, ConnectorError> =>
  Stream.paginate(Option.none<string>(), (after) =>
    readPage(client, options, after).pipe(
      Effect.map(({ items, next }) => [items, Option.map(next, Option.some)] as const),
    ),
  ).pipe(Stream.runCollect);

/** Small lists are read in full every hour. */
export const listSources = <Row extends object>(
  read: Effect.Effect<ReadonlyArray<Row>, ConnectorError>,
) => ({
  check: read.pipe(Effect.asVoid),
  backfill: Fetch.page({
    pageCursor: Cursor.string(),
    cutoff: Cursor.isoDateTime(),
    fetch: () => read.pipe(Effect.map((rows) => ({ rows, hasMore: false }))),
  }),
  changes: Fetch.changes({
    cursor: Cursor.string(),
    interval: hourly,
    fetch: () =>
      Effect.all([read, DateTime.now]).pipe(
        Effect.map(([rows, now]) => ({ rows, cursor: DateTime.formatIso(now) })),
      ),
  }),
});

const PageCursorSchema = Schema.fromJsonString(
  Schema.Struct({ variant: Schema.Int, after: Schema.optional(Schema.String) }),
);

const pageCursorError = (cause: Schema.SchemaError) =>
  new ConnectorError({ message: "Invalid incident.io page cursor", cause });

/**
 * Lists with date filters. Backfill reads `created_at[lte]=cutoff`, and
 * changes read `updated_at[gte]` from the last run, every 5 minutes.
 */
export const polled = <A, Row extends object>(
  client: IncidentIoClientService,
  options: ListOptions<A> & {
    /** One read per entry, such as one per incident mode. */
    readonly variants?: ReadonlyArray<Params>;
    /**
     * For lists whose filters only take a date, such as escalations. `lte` then
     * leaves out that whole day, so backfill asks up to the next day and drops
     * newer items itself.
     */
    readonly datesOnly?: { readonly createdAt: (item: A) => Date };
    readonly toRow: (item: A) => Row;
  },
) => {
  const variants = options.variants ?? [{}];
  const format = (time: DateTime.DateTime) =>
    options.datesOnly ? DateTime.formatIsoDateUtc(time) : DateTime.formatIso(time);
  const variantOptions = (variant: number, params: Params) => ({
    ...options,
    params: { ...options.params, ...variants[variant], ...params },
  });
  return {
    check: readPage(client, variantOptions(0, { page_size: "1" })).pipe(Effect.asVoid),
    backfill: Fetch.page({
      pageCursor: Cursor.string(),
      cutoff: Cursor.isoDateTime(),
      fetch: ({ pageCursor, cutoff }) =>
        Effect.gen(function* () {
          const position =
            typeof pageCursor === "string"
              ? yield* Schema.decodeUnknownEffect(PageCursorSchema)(pageCursor).pipe(
                  Effect.mapError(pageCursorError),
                )
              : { variant: 0 };
          const until = DateTime.makeUnsafe(String(cutoff));
          const lte = options.datesOnly ? DateTime.add(until, { days: 1 }) : until;
          const page = yield* readPage(
            client,
            variantOptions(position.variant, { created_at: { lte: format(lte) } }),
            Option.fromNullishOr(position.after),
          );
          const { datesOnly } = options;
          const items = datesOnly
            ? page.items.filter(
                (item) => datesOnly.createdAt(item).getTime() <= DateTime.toEpochMillis(until),
              )
            : page.items;
          const next = Option.match(page.next, {
            onSome: (after) => Option.some({ variant: position.variant, after }),
            onNone: () =>
              position.variant + 1 < variants.length
                ? Option.some({ variant: position.variant + 1 })
                : Option.none(),
          });
          return {
            rows: items.map(options.toRow),
            hasMore: Option.isSome(next),
            ...(Option.isSome(next)
              ? {
                  nextPageCursor: yield* Schema.encodeEffect(PageCursorSchema)(next.value).pipe(
                    Effect.mapError(pageCursorError),
                  ),
                }
              : {}),
          };
        }),
    }),
    changes: Fetch.changes({
      cursor: Cursor.string(),
      interval: changesInterval,
      // The first cursor is the backfill cutoff.
      fetch: ({ cursor }) =>
        Effect.gen(function* () {
          const now = yield* DateTime.now;
          const from = DateTime.subtractDuration(
            DateTime.makeUnsafe(String(cursor)),
            changesOverlap,
          );
          const filter = { updated_at: { gte: format(from) } };
          const items = yield* Effect.forEach(variants, (_, variant) =>
            listAll(client, variantOptions(variant, filter)),
          );
          return { rows: items.flat().map(options.toRow), cursor: DateTime.formatIso(now) };
        }),
    }),
  };
};

/** Reads one record again for a webhook. A `404` gives no rows. */
export const findOne = <A, Row>(
  client: IncidentIoClientService,
  options: {
    readonly path: string;
    /** The response key that holds the record, such as `incident`. */
    readonly key: string;
    readonly item: Schema.Decoder<A>;
    readonly toRow: (item: A) => Row;
  },
): Effect.Effect<ReadonlyArray<Row>, ConnectorError> =>
  client
    .find(
      Schema.Struct({ item: options.item }).pipe(Schema.encodeKeys({ item: options.key })),
      options.path,
    )
    .pipe(
      Effect.map(Option.match({ onNone: () => [], onSome: ({ item }) => [options.toRow(item)] })),
    );
