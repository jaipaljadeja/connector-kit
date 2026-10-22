import { Option, Schema } from "effect";

export const ErrorBodySchema = Schema.Struct({
  error: Schema.Struct({
    message: Schema.optional(Schema.String),
    type: Schema.optional(Schema.String),
    code: Schema.optional(Schema.Number),
    error_subcode: Schema.optional(Schema.Number),
  }),
});

const PagingSchema = Schema.Struct({
  cursors: Schema.optional(Schema.Struct({ after: Schema.optional(Schema.String) })),
  next: Schema.optional(Schema.String),
});

/** A Graph API list: `data` plus cursor paging. */
export const PageSchema = <S extends Schema.Top>(item: S) =>
  Schema.Struct({
    data: Schema.Array(item),
    paging: Schema.optional(PagingSchema),
  });

/** The `after` cursor of the next page. Only `next` says there is one. */
export const nextAfter = (page: {
  readonly paging?: { readonly cursors?: { readonly after?: string }; readonly next?: string };
}) =>
  page.paging?.next === undefined
    ? Option.none<string>()
    : Option.fromNullishOr(page.paging.cursors?.after);
