import type { Demo } from "@useairfoil/connector-kit";

import type { Discount, Fee, GoalTarget, Product, Tax, User } from "../schemas/crm";
import type { List } from "../schemas/lists";
import type { Owner } from "../schemas/owners";
import type { Pipeline } from "../schemas/pipelines";
import type { Property } from "../schemas/properties";
import type { Team } from "../schemas/teams";

import {
  day,
  dealStages,
  iso,
  leadStages,
  ownerCount,
  ownerId,
  productId,
  products,
  record,
  teams,
  ticketStages,
  userId,
} from "./shared";

/** The portal setup, written once before any company. */
export const setupRows = ({ faker, now }: Demo.DemoContext) => {
  const setup = new Date(now.getTime() - 800 * day);

  const people = Array.from({ length: ownerCount }, () => {
    const first = faker.person.firstName();
    const last = faker.person.lastName();

    return {
      first,
      last,
      email: faker.internet.exampleEmail({ firstName: first, lastName: last }).toLowerCase(),
    };
  });

  const owners: Array<Owner> = people.map((person, o) => ({
    id: ownerId(o),
    version: now,
    type: "PERSON",
    email: person.email,
    first_name: person.first,
    last_name: person.last,
    user_id: BigInt(userId(o)),
    user_id_including_inactive: BigInt(userId(o)),
    teams: [
      {
        id: String(90_000 + (o % teams.length)),
        name: teams[o % teams.length] ?? "Sales East",
        primary: true,
      },
    ],
    archived: false,
    created_at: setup,
  }));

  const users: Array<User> = people.map((person, o) =>
    record(userId(o), setup, setup, now, {
      hs_internal_user_id: userId(o),
      hs_email: person.email,
      hs_given_name: person.first,
      hs_family_name: person.last,
    }),
  );

  const teamRows: Array<Team> = teams.map((name, t) => ({
    id: String(90_000 + t),
    version: now,
    name,
    members: people
      .map((_, o) => o)
      .filter((o) => o % teams.length === t)
      .map((o) => ({ user_id: userId(o), type: "DEFAULT" })),
  }));

  const pipelines: Array<Pipeline> = [
    {
      key: "deals:default",
      version: now,
      object_type: "deals",
      id: "default",
      label: "Sales pipeline",
      display_order: 0n,
      archived: false,
      stages: dealStages.map((stage, s) => ({
        id: stage.id,
        label: stage.label,
        display_order: BigInt(s),
        archived: false,
        metadata: new Map([
          ["probability", stage.probability],
          ["isClosed", String(stage.id.startsWith("closed"))],
        ]),
      })),
      created_at: setup,
    },
    {
      key: "tickets:0",
      version: now,
      object_type: "tickets",
      id: "0",
      label: "Support pipeline",
      display_order: 0n,
      archived: false,
      stages: ticketStages.map((stage, s) => ({
        id: stage.id,
        label: stage.label,
        display_order: BigInt(s),
        archived: false,
        metadata: new Map([["ticketState", stage.state]]),
      })),
      created_at: setup,
    },
    {
      key: "leads:lead-pipeline-id",
      version: now,
      object_type: "leads",
      id: "lead-pipeline-id",
      label: "Lead pipeline",
      display_order: 0n,
      archived: false,
      stages: leadStages.map((stage, s) => ({
        id: stage.id,
        label: stage.label,
        display_order: BigInt(s),
        archived: false,
        metadata: new Map(),
      })),
      created_at: setup,
    },
  ];

  const propertyRows: Array<Property> = (
    [
      ["contacts", "email", "Email", "string", "text", "contactinformation", []],
      [
        "contacts",
        "lifecyclestage",
        "Lifecycle stage",
        "enumeration",
        "radio",
        "contactinformation",
        [
          "subscriber",
          "lead",
          "marketingqualifiedlead",
          "salesqualifiedlead",
          "opportunity",
          "customer",
        ],
      ],
      [
        "contacts",
        "hubspot_owner_id",
        "Contact owner",
        "enumeration",
        "select",
        "contactinformation",
        [],
      ],
      [
        "companies",
        "industry",
        "Industry",
        "enumeration",
        "select",
        "companyinformation",
        [
          "COMPUTER_SOFTWARE",
          "FINANCIAL_SERVICES",
          "HOSPITAL_HEALTH_CARE",
          "RETAIL",
          "MARKETING_AND_ADVERTISING",
        ],
      ],
      [
        "companies",
        "numberofemployees",
        "Number of employees",
        "number",
        "number",
        "companyinformation",
        [],
      ],
      ["deals", "amount", "Amount", "number", "number", "dealinformation", []],
      [
        "deals",
        "dealstage",
        "Deal stage",
        "enumeration",
        "radio",
        "dealinformation",
        dealStages.map((stage) => stage.id),
      ],
      ["deals", "closedate", "Close date", "datetime", "date", "dealinformation", []],
      [
        "tickets",
        "hs_ticket_priority",
        "Priority",
        "enumeration",
        "select",
        "ticketinformation",
        ["LOW", "MEDIUM", "HIGH"],
      ],
    ] as const
  ).map(([objectType, name, label, type, fieldType, group, options]) => ({
    key: `${objectType}:${name}`,
    version: now,
    object_type: objectType,
    name,
    label,
    type,
    field_type: fieldType,
    description: "",
    group_name: group,
    options: options.map((value, o) => ({
      label: value.toLowerCase().replaceAll("_", " "),
      value,
      display_order: BigInt(o),
      hidden: false,
    })),
    calculated: false,
    hidden: false,
    hubspot_defined: true,
    archived: false,
    created_at: setup,
    updated_at: setup,
  }));

  const lists: Array<List> = [
    ["Newsletter subscribers", "DYNAMIC", 2_400n],
    ["Webinar attendees Q3", "SNAPSHOT", 380n],
    ["Customers", "DYNAMIC", 620n],
    ["Churn risk", "MANUAL", 45n],
  ].map(([name, processing, size], l) => ({
    id: String(100 + l),
    version: now,
    name: String(name),
    object_type_id: "0-1",
    processing_type: String(processing),
    processing_status: "COMPLETE",
    size: BigInt(size),
    created_at: setup,
    updated_at: new Date(now.getTime() - day),
    filters_updated_at: setup,
  }));

  const productRows: Array<Product> = products.map((product, p) =>
    record(productId(p), setup, setup, now, {
      name: product.name,
      hs_sku: product.sku,
      price: String(product.price),
      description: `${product.name}, billed yearly`,
      hs_recurring_billing_period: product.sku.startsWith("SVC-ONBOARD") ? "" : "P12M",
      recurringbillingfrequency: product.sku.startsWith("SVC-ONBOARD") ? "" : "annually",
    }),
  );

  const discounts: Array<Discount> = [
    ["Annual prepay", "PERCENT", "10"],
    ["Startup program", "PERCENT", "25"],
  ].map(([label, type, value], d) =>
    record(String(3_100_000 + d), setup, setup, now, {
      hs_label: String(label),
      hs_type: String(type),
      hs_value: String(value),
    }),
  );

  const fees: Array<Fee> = [
    record("3200000", setup, setup, now, {
      hs_label: "Setup fee",
      hs_type: "FIXED",
      hs_value: "500",
    }),
  ];

  const taxes: Array<Tax> = [
    record("3300000", setup, setup, now, {
      hs_label: "Sales tax (CA)",
      hs_type: "PERCENT",
      hs_value: "7.25",
    }),
    record("3300001", setup, setup, now, {
      hs_label: "VAT (UK)",
      hs_type: "PERCENT",
      hs_value: "20",
    }),
  ];

  // A revenue goal per owner for each of the last four quarters.
  const goals: Array<GoalTarget> = people.flatMap((person, o) =>
    [0, 1, 2, 3].map((q) => {
      const start = new Date(
        Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3 - q * 3, 1),
      );

      const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 3, 1) - 1);

      return record(String(3_400_000 + o * 10 + q), start, start, now, {
        hs_goal_name: `${person.first} ${person.last} revenue Q${Math.floor(start.getUTCMonth() / 3) + 1} ${start.getUTCFullYear()}`,
        hs_target_amount: String(faker.helpers.arrayElement([60_000, 80_000, 100_000, 120_000])),
        hs_start_datetime: iso(start),
        hs_end_datetime: iso(end),
        hubspot_owner_id: ownerId(o),
      });
    }),
  );

  return {
    owners,
    users,
    teams: teamRows,
    pipelines,
    properties: propertyRows,
    lists,
    products: productRows,
    discounts,
    fees,
    taxes,
    goal_targets: goals,
  };
};
