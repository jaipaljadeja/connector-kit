import type { Schema } from "effect";

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
} from "./schemas/reports";

export const tableSchemas: Readonly<Record<string, Schema.Top>> = {
  daily_overview: DailyOverviewSchema,
  traffic_sources: TrafficSourceSchema,
  user_acquisition: UserAcquisitionSchema,
  pages: PageSchema,
  landing_pages: LandingPageSchema,
  events: EventSchema,
  locations: LocationSchema,
  devices: DeviceSchema,
  ecommerce_items: EcommerceItemSchema,
};
