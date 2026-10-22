import type { ConnectorError } from "@useairfoil/connector-kit";

import { DateTime, Effect, type Option } from "effect";

import type { FacebookAdsClientService } from "../../client/client";
import type { InsightsItem, InsightsSpec } from "./spec";

import { nextAfter, PageSchema } from "../../schemas/api";

const pageSize = 500;

export type InsightsPage<Row> = {
  readonly rows: ReadonlyArray<Row>;
  /** Cursor of the next page of the same day. */
  readonly next: Option.Option<string>;
};

/** One page of one account's insights for one day, per ad. */
export const readDay = <A extends InsightsItem, Row extends object>(
  client: FacebookAdsClientService,
  spec: InsightsSpec<A, Row>,
  account: string,
  options: { readonly day: string; readonly after?: string; readonly limit?: number },
): Effect.Effect<InsightsPage<Row>, ConnectorError> =>
  Effect.gen(function* () {
    const breakdowns = new Set<string>(spec.breakdowns);

    const page = yield* client.get(spec.name, PageSchema(spec.item), `/act_${account}/insights`, {
      level: "ad",
      time_increment: "1",
      time_range: JSON.stringify({ since: options.day, until: options.day }),
      fields: Object.keys(spec.item.fields)
        .filter((name) => !breakdowns.has(name))
        .join(","),
      ...(spec.breakdowns.length === 0 ? {} : { breakdowns: spec.breakdowns.join(",") }),
      limit: String(options.limit ?? pageSize),
      ...(options.after === undefined ? {} : { after: options.after }),
    });

    const version = yield* DateTime.nowAsDate;
    return {
      rows: page.data.map((item) =>
        spec.toRow(
          item,
          JSON.stringify([
            account,
            item.ad_id,
            item.date_start,
            ...spec.breakdowns.map((name) => item[name]),
          ]),
          version,
        ),
      ),
      next: nextAfter(page),
    };
  });
