import { ConnectorApp, Demo, RuntimeConfig } from "@useairfoil/connector-kit";
import { Command } from "effect/cli";

import {
  DailyOverviewSchema,
  DeviceSchema,
  EcommerceItemSchema,
  EventSchema,
  LandingPageSchema,
  LocationSchema,
  PageSchema,
  TrafficSourceSchema,
  UserAcquisitionSchema,
} from "../schemas/reports";
import { dayRows } from "./reports";

export const demo = Demo.define({
  name: "producer-google-analytics",
  setup: { tables: [], rows: () => ({}) },
  group: {
    tables: [
      Demo.table({ name: "daily_overview", rowSchema: DailyOverviewSchema, version: "version" }),
      Demo.table({ name: "traffic_sources", rowSchema: TrafficSourceSchema, version: "version" }),
      Demo.table({
        name: "user_acquisition",
        rowSchema: UserAcquisitionSchema,
        version: "version",
      }),
      Demo.table({ name: "pages", rowSchema: PageSchema, version: "version" }),
      Demo.table({ name: "landing_pages", rowSchema: LandingPageSchema, version: "version" }),
      Demo.table({ name: "events", rowSchema: EventSchema, version: "version" }),
      Demo.table({ name: "locations", rowSchema: LocationSchema, version: "version" }),
      Demo.table({ name: "devices", rowSchema: DeviceSchema, version: "version" }),
      Demo.table({ name: "ecommerce_items", rowSchema: EcommerceItemSchema, version: "version" }),
    ],
    rows: dayRows,
    // Two years of days, the same as the default GA_START_DATE.
    count: 730,
  },
});

export const demoCommand = ConnectorApp.makeDemoCommand(demo).pipe(
  Command.provide(RuntimeConfig.layerHosted()),
);
