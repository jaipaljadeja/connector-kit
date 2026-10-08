import { ConnectorError, Cursor, Fetch, Resource } from "@useairfoil/connector-kit";
import {
  Array as Arr,
  Cache,
  DateTime,
  Duration,
  Effect,
  Exit,
  Order,
  Option,
  Schema,
  SchemaTransformation,
} from "effect";

import type { DeleteRow } from "./crm/spec";

import { HUBSPOT_API_VERSION, type HubSpotClientService } from "../client/client";
import {
  type CustomObjectRecord,
  CustomObjectRecordSchema,
  CustomObjectSchema,
} from "../schemas/crm";
import { crmEntity } from "./crm/resource";
import { changesInterval, freshCursor } from "./crm/sources";
import { companies, contacts, deals, tickets } from "./crm/spec";
import { RecordEventSchema } from "./crm/webhook";

const schemasPath = `/crm-object-schemas/${HUBSPOT_API_VERSION}/schemas`;
const typesTtl = Duration.hours(1);

const ObjectTypeSchema = Schema.Struct({ objectTypeId: Schema.String, name: Schema.String });
type ObjectType = Schema.Schema.Type<typeof ObjectTypeSchema>;
const SchemaListSchema = Schema.Struct({ results: Schema.Array(ObjectTypeSchema) });

/** Custom object types, sorted by ID, and an effect that clears the cache. */
export const customObjectTypes = (client: HubSpotClientService) =>
  client.get(SchemaListSchema, schemasPath).pipe(
    Effect.map(({ body }) => Arr.sortWith(body.results, (type) => type.objectTypeId, Order.String)),
    Effect.cachedInvalidateWithTTL((exit) => (Exit.isSuccess(exit) ? typesTtl : Duration.zero)),
  );

const PageCursorSchema = Schema.fromJsonString(
  Schema.Struct({ type: Schema.String, after: Schema.optional(Schema.String) }),
);

/**
 * Each type's own CRM cursor. `initial` is set only on the first run, so the
 * types found by the backfill start there and later types read in full.
 * `more` lists the types that have more pages, so a run that goes on reads
 * only those.
 */
const ChangesCursorSchema = Schema.Struct({
  types: Schema.Record(Schema.String, Schema.String),
  initial: Schema.optional(Schema.String),
  more: Schema.optional(Schema.Array(Schema.String)),
});

type ChangesCursor = Schema.Schema.Type<typeof ChangesCursorSchema>;

const ChangesCursorCodec = Schema.Union([
  Schema.fromJsonString(ChangesCursorSchema),
  // The first cursor is the backfill cutoff, a plain ISO time.
  Schema.String.pipe(
    Schema.decodeTo(
      Schema.toType(ChangesCursorSchema),
      SchemaTransformation.transform({
        decode: (cutoff): ChangesCursor => ({ types: {}, initial: cutoff }),
        encode: (cursor) => cursor.initial ?? "",
      }),
    ),
  ),
]);

const invalid = (message: string) => (cause: unknown) => new ConnectorError({ message, cause });

const CustomEventsSchema = Schema.Array(
  Schema.Struct({ ...RecordEventSchema.fields, typeId: Schema.String }),
);

const withType =
  (type: ObjectType) =>
  <Row extends CustomObjectRecord | DeleteRow>(row: Row) => ({
    ...row,
    key: `${type.objectTypeId}:${row.id}`,
    object_type_id: type.objectTypeId,
    object_type: type.name,
  });

/**
 * Every custom object type in one table. Each type is read like a CRM object,
 * with its own cursor.
 */
export const makeCustomObjects = (
  client: HubSpotClientService,
  types: Effect.Effect<ReadonlyArray<ObjectType>, ConnectorError>,
  clearTypes: Effect.Effect<void>,
) =>
  Effect.gen(function* () {
    // Custom objects have no `associationChange` webhook, so the daily full
    // read keeps their association lists current.
    const entities = yield* Cache.make({
      capacity: 1_000,
      lookup: (objectTypeId: string) =>
        crmEntity(client, {
          name: objectTypeId,
          lastModified: "hs_lastmodifieddate",
          associations: [companies, contacts, deals, tickets],
          listsDeleted: true,
          refreshInterval: Duration.days(1),
          rowSchema: CustomObjectRecordSchema,
        }),
    });

    const typeOf = (objectTypeId: string) =>
      types.pipe(Effect.map(Arr.findFirst((type) => type.objectTypeId === objectTypeId)));

    // A type deleted in HubSpot fails until the cached list catches up. Check
    // a fresh list, and skip the type if it's gone.
    const unlessRemoved =
      (type: ObjectType) =>
      <A>(
        effect: Effect.Effect<A, ConnectorError>,
      ): Effect.Effect<Option.Option<A>, ConnectorError> =>
        effect.pipe(
          Effect.map(Option.some),
          Effect.catch((error) =>
            clearTypes.pipe(
              Effect.andThen(typeOf(type.objectTypeId)),
              Effect.flatMap((found) =>
                Option.isSome(found) ? Effect.fail(error) : Effect.succeedNone,
              ),
            ),
          ),
        );

    return Resource.entity({
      name: "custom_objects",
      rowSchema: CustomObjectSchema,
      key: "key",
      version: "version",

      check: types.pipe(
        Effect.flatMap((list) =>
          Effect.forEach(
            list,
            (type) =>
              Cache.get(entities, type.objectTypeId).pipe(
                Effect.flatMap((entity) => entity.check),
                unlessRemoved(type),
              ),
            { discard: true },
          ),
        ),
      ),

      backfill: Fetch.page({
        pageCursor: Cursor.string(),
        cutoff: Cursor.isoDateTime(),
        fetch: ({ pageCursor, cutoff }) =>
          Effect.gen(function* () {
            const list = yield* types;
            const at =
              typeof pageCursor === "string"
                ? yield* Schema.decodeUnknownEffect(PageCursorSchema)(pageCursor).pipe(
                    Effect.mapError(invalid("Invalid HubSpot custom objects page cursor")),
                  )
                : undefined;
            // Types are sorted, so a type removed during the backfill is
            // skipped and the next one goes on.
            const index =
              at === undefined ? 0 : list.findIndex((type) => type.objectTypeId >= at.type);
            const type = list[index];
            if (type === undefined) return { rows: [], hasMore: false };
            const after = at?.type === type.objectTypeId ? at.after : undefined;

            const entity = yield* Cache.get(entities, type.objectTypeId);
            const page = yield* entity.backfill
              .fetch({ cutoff, ...(after === undefined ? {} : { pageCursor: after }) })
              .pipe(unlessRemoved(type));
            const nextType = list[index + 1];
            const next =
              Option.isSome(page) && page.value.hasMore
                ? { type: type.objectTypeId, after: String(page.value.nextPageCursor) }
                : nextType === undefined
                  ? undefined
                  : { type: nextType.objectTypeId };
            return {
              rows: Option.match(page, {
                onNone: () => [],
                onSome: ({ rows }) => rows.map(withType(type)),
              }),
              hasMore: next !== undefined,
              ...(next === undefined
                ? {}
                : {
                    nextPageCursor: yield* Schema.encodeEffect(PageCursorSchema)(next).pipe(
                      Effect.mapError(
                        invalid("Could not encode HubSpot custom objects page cursor"),
                      ),
                    ),
                  }),
            };
          }),
      }),

      changes: Fetch.changes({
        cursor: Cursor.string(),
        interval: changesInterval,
        fetch: ({ cursor }) =>
          Effect.gen(function* () {
            const state = yield* Schema.decodeUnknownEffect(ChangesCursorCodec)(
              String(cursor),
            ).pipe(Effect.mapError(invalid("Invalid HubSpot custom objects changes cursor")));
            const now = yield* DateTime.now;
            const list = yield* types;
            const more = state.more ?? [];
            const due =
              more.length === 0 ? list : list.filter((type) => more.includes(type.objectTypeId));
            const runs = yield* Effect.forEach(due, (type) =>
              Effect.gen(function* () {
                const entity = yield* Cache.get(entities, type.objectTypeId);
                const typeCursor =
                  state.types[type.objectTypeId] ?? state.initial ?? (yield* freshCursor(now));
                return yield* entity.changes.fetch({ cursor: typeCursor });
              }).pipe(unlessRemoved(type), Effect.map(Option.map((result) => ({ type, result })))),
            ).pipe(Effect.map(Arr.getSomes));
            const nextMore = runs
              .filter(({ result }) => result.hasMore === true)
              .map(({ type }) => type.objectTypeId);
            // Removed types drop out. Types that didn't run keep their cursor.
            const next: ChangesCursor = {
              types: Object.fromEntries([
                ...list
                  .filter((type) => !due.includes(type))
                  .flatMap((type) => {
                    const kept = state.types[type.objectTypeId];
                    return kept === undefined ? [] : [[type.objectTypeId, kept]];
                  }),
                ...runs.map(({ type, result }) => [type.objectTypeId, String(result.cursor)]),
              ]),
              ...(nextMore.length === 0 ? {} : { more: nextMore }),
            };
            return {
              rows: runs.flatMap(({ type, result }) => result.rows.map(withType(type))),
              cursor: yield* Schema.encodeEffect(Schema.fromJsonString(ChangesCursorSchema))(
                next,
              ).pipe(
                Effect.mapError(invalid("Could not encode HubSpot custom objects changes cursor")),
              ),
              hasMore: nextMore.length > 0,
            };
          }),
      }),

      webhook: {
        schema: CustomEventsSchema,
        handler: ({ payload }) =>
          Effect.forEach(
            Object.entries(Arr.groupBy(payload, (event) => event.typeId)),
            ([typeId, events]) =>
              Effect.gen(function* () {
                const type = yield* typeOf(typeId);
                if (Option.isNone(type)) return [];
                const entity = yield* Cache.get(entities, typeId);
                const rows = yield* entity.webhook
                  .handler({ payload: events })
                  .pipe(unlessRemoved(type.value));
                return Option.getOrElse(rows, () => []).map(withType(type.value));
              }),
          ).pipe(Effect.map((groups) => groups.flat())),
      },
    });
  });
