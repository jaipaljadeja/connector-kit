import type { Demo } from "@useairfoil/connector-kit";

import { DateTime, Duration } from "effect";

import type { CustomObject, ObjectRow } from "../schemas/objects";

import { objects } from "../manifest";

export const hour = Duration.toMillis(Duration.hours(1));
export const day = Duration.toMillis(Duration.days(1));

export type Value = string | number | boolean | null;
export type TableName = (typeof objects)[number]["name"];

// Salesforce IDs are 18 characters: a 3-character key prefix for the object, then
// the record. Demo IDs keep the real prefixes.
export const sfid = (prefix: string, index: number, part = 0) =>
  `${prefix}Dm${String(part).padStart(3, "0")}${String(index).padStart(7, "0")}AAQ`;

// Salesforce sends datetimes with a +0000 offset.
export const datetime = (date: Date) => date.toISOString().replace("Z", "+0000");
export const dateOnly = (date: Date) => DateTime.formatIsoDateUtc(DateTime.fromDateUnsafe(date));

/**
 * One record: the shared columns, and every non-null field as a string, the way
 * the connector stores them.
 */
export const sobject = (
  id: string,
  created: Date,
  updated: Date,
  now: Date,
  fields: Readonly<Record<string, Value>>,
): ObjectRow => ({
  id,
  // Salesforce rows use the fetch time as their version.
  version: now,
  created_at: created,
  updated_at: updated,
  _deleted: false,
  fields: new Map(
    Object.entries({
      Id: id,
      CreatedDate: datetime(created),
      LastModifiedDate: datetime(updated),
      SystemModstamp: datetime(updated),
      IsDeleted: false,
      ...fields,
    }).flatMap(
      ([name, value]): ReadonlyArray<readonly [string, string]> =>
        value === null ? [] : [[name, String(value)]],
    ),
  ),
});

export const userCount = 12;
export const userId = (u: number) => sfid("005", u);
export const profileId = (p: number) => sfid("00e", p);
export const roleId = (r: number) => sfid("00E", r);
export const pricebookId = sfid("01s", 0);

export const products = [
  { name: "Analytics Cloud", code: "AC-STD", family: "Software", price: 24000 },
  { name: "Analytics Cloud Enterprise", code: "AC-ENT", family: "Software", price: 60000 },
  { name: "Data Connectors Pack", code: "DC-PACK", family: "Add-on", price: 8000 },
  { name: "Premier Support", code: "SUP-PREM", family: "Services", price: 12000 },
  { name: "Implementation", code: "SVC-IMPL", family: "Services", price: 15000 },
  { name: "Training Day", code: "SVC-TRAIN", family: "Services", price: 2500 },
] as const;

export const productId = (p: number) => sfid("01t", p);
export const entryId = (p: number) => sfid("01u", p);

export const campaigns = [
  "Spring Webinar Series",
  "Annual Customer Summit",
  "Q3 Outbound",
  "Partner Newsletter",
] as const;

export const campaignId = (c: number) => sfid("701", c);
export const territoryId = (t: number) => sfid("0Hh", t);
export const resourceId = (r: number) => sfid("0Hn", r);
export const topics = ["Renewal", "Expansion", "Escalation", "Integration"] as const;
export const topicId = (t: number) => sfid("0TO", t);

export const opportunityStages = [
  { name: "Prospecting", probability: 10 },
  { name: "Qualification", probability: 20 },
  { name: "Needs Analysis", probability: 40 },
  { name: "Proposal/Price Quote", probability: 60 },
  { name: "Negotiation/Review", probability: 80 },
  { name: "Closed Won", probability: 100 },
  { name: "Closed Lost", probability: 0 },
] as const;

/** Date helpers for one run. `at` keeps a time from going past now. */
export const clock = ({ faker, now }: Demo.DemoContext) => {
  const at = (time: number) => new Date(Math.min(time, now.getTime()));

  const between = (from: Date, to: Date) =>
    faker.date.between({ from, to: at(Math.max(from.getTime(), to.getTime())) });

  return { at, between };
};

/**
 * One account being built: the run's tools and what its parts need to know.
 * `add` writes a row, and `next` gives the next record ID within the account,
 * so IDs follow write order.
 */
export type AccountGroup = Demo.DemoContext &
  ReturnType<typeof clock> & {
    readonly index: number;
    readonly accountId: string;
    readonly name: string;
    readonly owner: number;
    readonly agent: number;
    readonly domain: string;
    readonly industry: string;
    readonly created: Date;
    readonly city: string;
    readonly state: string;
    readonly add: (table: TableName, row: ObjectRow) => void;
    readonly next: (prefix: string) => string;
    readonly custom: Array<CustomObject>;
  };

export type AccountContact = {
  readonly id: string;
  readonly first: string;
  readonly last: string;
  readonly email: string;
  readonly added: Date;
};

export type OpportunityPlan = {
  readonly id: string;
  readonly stage: number;
  readonly closed: Date | null;
  readonly amount: number;
  readonly lines: ReadonlyArray<number>;
};
