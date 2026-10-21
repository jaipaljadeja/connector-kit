import { Iceberg } from "@useairfoil/connector-kit";
import { Schema } from "effect";

import { amount, common, count, currencyCode, dimension } from "./shared";

// User counts are distinct users, so they don't add up across rows or days.

export const DailyOverviewSchema = Schema.Struct({
  ...common,
  active_users: count(30, "Users who engaged on the day."),
  new_users: count(31, "Users who came for the first time."),
  total_users: count(32, "Users who logged any event."),
  sessions: count(33, "Sessions that started."),
  engaged_sessions: count(
    34,
    "Sessions that lasted 10 seconds or more, or had a key event or 2 page views.",
  ),
  screen_page_views: count(35, "Page and screen views."),
  event_count: count(36, "Events."),
  key_events: amount(37, "Key events. Can be fractional after attribution."),
  total_revenue: amount(38, "Revenue from purchases, subscriptions, and ads."),
  user_engagement_duration: amount(39, "Seconds the site or app was in the foreground."),
  currency_code: currencyCode,
})
  .annotate({ description: "Google Analytics totals per day." })
  .pipe(Iceberg.identifier("id"));

export type DailyOverview = Schema.Schema.Type<typeof DailyOverviewSchema>;

export const TrafficSourceSchema = Schema.Struct({
  ...common,
  session_source: dimension(10, "Source of the session, such as google."),
  session_medium: dimension(11, "Medium of the session, such as organic."),
  session_campaign_name: dimension(12, "Campaign of the session."),
  session_default_channel_group: dimension(13, "Default channel group of the session."),
  sessions: count(30, "Sessions that started."),
  engaged_sessions: count(31, "Engaged sessions."),
  active_users: count(32, "Users who engaged."),
  new_users: count(33, "Users who came for the first time."),
  screen_page_views: count(34, "Page and screen views."),
  event_count: count(35, "Events."),
  key_events: amount(36, "Key events."),
  total_revenue: amount(37, "Revenue from purchases, subscriptions, and ads."),
  user_engagement_duration: amount(38, "Seconds the site or app was in the foreground."),
  currency_code: currencyCode,
})
  .annotate({ description: "Google Analytics sessions per day and traffic source." })
  .pipe(Iceberg.identifier("id"));

export type TrafficSource = Schema.Schema.Type<typeof TrafficSourceSchema>;

export const UserAcquisitionSchema = Schema.Struct({
  ...common,
  first_user_source: dimension(10, "Source that first brought the user."),
  first_user_medium: dimension(11, "Medium that first brought the user."),
  first_user_campaign_name: dimension(12, "Campaign that first brought the user."),
  first_user_default_channel_group: dimension(
    13,
    "Default channel group that first brought the user.",
  ),
  new_users: count(30, "Users who came for the first time."),
  active_users: count(31, "Users who engaged."),
  sessions: count(32, "Sessions that started."),
  engaged_sessions: count(33, "Engaged sessions."),
  key_events: amount(34, "Key events."),
  total_revenue: amount(35, "Revenue from purchases, subscriptions, and ads."),
  currency_code: currencyCode,
})
  .annotate({ description: "Google Analytics users per day and first traffic source." })
  .pipe(Iceberg.identifier("id"));

export type UserAcquisition = Schema.Schema.Type<typeof UserAcquisitionSchema>;

export const PageSchema = Schema.Struct({
  ...common,
  host_name: dimension(10, "Host name, such as www.example.com."),
  page_path: dimension(11, "Page path, without the query string."),
  page_title: dimension(12, "Page title."),
  screen_page_views: count(30, "Page and screen views."),
  active_users: count(31, "Users who engaged."),
  event_count: count(32, "Events."),
  key_events: amount(33, "Key events."),
  user_engagement_duration: amount(34, "Seconds the page was in the foreground."),
})
  .annotate({ description: "Google Analytics page views per day and page." })
  .pipe(Iceberg.identifier("id"));

export type Page = Schema.Schema.Type<typeof PageSchema>;

export const LandingPageSchema = Schema.Struct({
  ...common,
  landing_page: dimension(10, "First page path of the session, without the query string."),
  sessions: count(30, "Sessions that started."),
  engaged_sessions: count(31, "Engaged sessions."),
  active_users: count(32, "Users who engaged."),
  new_users: count(33, "Users who came for the first time."),
  key_events: amount(34, "Key events."),
  total_revenue: amount(35, "Revenue from purchases, subscriptions, and ads."),
  currency_code: currencyCode,
})
  .annotate({ description: "Google Analytics sessions per day and landing page." })
  .pipe(Iceberg.identifier("id"));

export type LandingPage = Schema.Schema.Type<typeof LandingPageSchema>;

export const EventSchema = Schema.Struct({
  ...common,
  event_name: dimension(10, "Event name, such as page_view."),
  event_count: count(30, "Events."),
  total_users: count(31, "Users who logged the event."),
  event_value: amount(32, "Sum of the event's value parameter."),
  key_events: amount(33, "Key events."),
})
  .annotate({ description: "Google Analytics events per day and event name." })
  .pipe(Iceberg.identifier("id"));

export type Event = Schema.Schema.Type<typeof EventSchema>;

export const LocationSchema = Schema.Struct({
  ...common,
  country: dimension(10, "Country of the user."),
  region: dimension(11, "Region of the user."),
  city: dimension(12, "City of the user."),
  active_users: count(30, "Users who engaged."),
  new_users: count(31, "Users who came for the first time."),
  sessions: count(32, "Sessions that started."),
  engaged_sessions: count(33, "Engaged sessions."),
  key_events: amount(34, "Key events."),
  total_revenue: amount(35, "Revenue from purchases, subscriptions, and ads."),
  currency_code: currencyCode,
})
  .annotate({ description: "Google Analytics users per day and location." })
  .pipe(Iceberg.identifier("id"));

export type Location = Schema.Schema.Type<typeof LocationSchema>;

export const DeviceSchema = Schema.Struct({
  ...common,
  device_category: dimension(10, "Device category: desktop, mobile, or tablet."),
  platform: dimension(11, "Platform: web, iOS, or Android."),
  operating_system: dimension(12, "Operating system."),
  browser: dimension(13, "Browser."),
  active_users: count(30, "Users who engaged."),
  new_users: count(31, "Users who came for the first time."),
  sessions: count(32, "Sessions that started."),
  engaged_sessions: count(33, "Engaged sessions."),
  screen_page_views: count(34, "Page and screen views."),
  key_events: amount(35, "Key events."),
})
  .annotate({ description: "Google Analytics users per day and device." })
  .pipe(Iceberg.identifier("id"));

export type Device = Schema.Schema.Type<typeof DeviceSchema>;

export const EcommerceItemSchema = Schema.Struct({
  ...common,
  item_id: dimension(10, "Item ID."),
  item_name: dimension(11, "Item name."),
  item_brand: dimension(12, "Item brand."),
  item_category: dimension(13, "First item category."),
  items_viewed: count(30, "Units viewed."),
  items_added_to_cart: count(31, "Units added to carts."),
  items_purchased: count(32, "Units purchased."),
  item_revenue: amount(33, "Revenue from the item, without tax and shipping."),
  currency_code: currencyCode,
})
  .annotate({
    description: "Google Analytics ecommerce items per day. Empty without ecommerce events.",
  })
  .pipe(Iceberg.identifier("id"));

export type EcommerceItem = Schema.Schema.Type<typeof EcommerceItemSchema>;
