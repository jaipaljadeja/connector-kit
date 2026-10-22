import { ConnectorError } from "@useairfoil/connector-kit";
import { DateTime, Duration, Effect, Exit, Schema } from "effect";

import type { FacebookAdsClientService } from "../client/client";

/** `FACEBOOK_ADS_ACCOUNT_IDS` as numeric IDs, in order, without `act_`. */
export const parseAccounts = (
  value: string,
): Effect.Effect<ReadonlyArray<string>, ConnectorError> => {
  const accounts = [
    ...new Set(
      value
        .split(",")
        .map((account) => account.trim().replace(/^act_/, ""))
        .filter((account) => account.length > 0),
    ),
  ];

  const bad = accounts.find((account) => !/^\d+$/.test(account));
  return accounts.length === 0 || bad !== undefined
    ? Effect.fail(
        new ConnectorError({
          message: `FACEBOOK_ADS_ACCOUNT_IDS must be comma-separated ad account IDs${bad === undefined ? "" : `, not ${bad}`}`,
        }),
      )
    : Effect.succeed(accounts);
};

const TimeZoneSchema = Schema.Struct({ timezone_name: Schema.String });

export type TimeZoneOf = (account: string) => Effect.Effect<DateTime.TimeZone, ConnectorError>;

/**
 * Each account's time zone, which insights days use. Read once an hour; a
 * failure isn't kept.
 */
export const makeTimeZones = (client: FacebookAdsClientService, accounts: ReadonlyArray<string>) =>
  Effect.cachedWithTTL(
    Effect.forEach(accounts, (account) =>
      client
        .get("time_zone", TimeZoneSchema, `/act_${account}`, {
          fields: "timezone_name",
        })
        .pipe(
          Effect.flatMap(({ timezone_name }) =>
            DateTime.zoneMakeNamedEffect(timezone_name).pipe(
              Effect.mapError(
                (cause) =>
                  new ConnectorError({
                    message: `Unknown time zone ${timezone_name} for ad account ${account}`,
                    cause,
                  }),
              ),
            ),
          ),
          Effect.map((zone) => [account, zone] as const),
        ),
    ).pipe(Effect.map((zones) => new Map(zones))),
    (exit) => (Exit.isSuccess(exit) ? Duration.hours(1) : Duration.zero),
  ).pipe(
    Effect.map(
      (zones): TimeZoneOf =>
        (account) =>
          zones.pipe(
            Effect.flatMap((byAccount) => {
              const zone = byAccount.get(account);
              return zone === undefined
                ? Effect.fail(new ConnectorError({ message: `Unknown ad account ${account}` }))
                : Effect.succeed(zone);
            }),
          ),
    ),
  );
