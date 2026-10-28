import type { Demo } from "@useairfoil/connector-kit";

import type { Discount } from "../resources/discounts";
import type { Product } from "../resources/products";

import { catalog, day, discountId, discounts, organizationId, priceId, productId } from "./shared";

/** The catalog of products and discounts, written once before any customer. */
export const setupRows = ({ now }: Demo.DemoContext) => {
  const created = new Date(now.getTime() - 800 * day);

  const products: Array<Product> = catalog.map((item, index) => ({
    id: productId(index),
    version: created,
    created_at: created,
    modified_at: null,
    name: item.name,
    description:
      item.months > 0 ? `${item.name} subscription` : `One-time ${item.name.toLowerCase()}`,
    visibility: "public",
    is_recurring: item.months > 0,
    is_archived: false,
    recurring_interval: item.months === 0 ? null : item.months === 12 ? "year" : "month",
    recurring_interval_count: item.months === 0 ? null : 1,
    trial_interval: item.trialDays > 0 ? "day" : null,
    trial_interval_count: item.trialDays > 0 ? item.trialDays : null,
    meter_interval: null,
    meter_interval_count: null,
    organization_id: organizationId,
    metadata: "{}",
    prices: [
      {
        id: priceId(index),
        created_at: created,
        modified_at: null,
        amount_type: "fixed",
        price_currency: "usd",
        is_archived: false,
        tax_behavior: "exclusive",
        source: "catalog",
        price_amount: item.amount,
        minimum_amount: null,
        maximum_amount: null,
        preset_amount: null,
        unit_amount: null,
        cap_amount: null,
        meter_id: null,
        minimum_units: null,
        maximum_units: null,
      },
    ],
  }));

  const discountRows: Array<Discount> = discounts.map((discount, index) => ({
    id: discountId(index),
    version: created,
    created_at: created,
    modified_at: null,
    name: discount.name,
    code: discount.code,
    type: discount.type,
    duration: "once",
    duration_in_months: null,
    amount: discount.type === "fixed" ? discount.amount : null,
    currency: discount.type === "fixed" ? "usd" : null,
    basis_points: discount.type === "percentage" ? discount.basisPoints : null,
    starts_at: created,
    ends_at: null,
    max_redemptions: null,
    max_redemptions_per_customer: 1,
    // The catalog is written before any order, so redemptions aren't counted.
    redemptions_count: 0,
    organization_id: organizationId,
    metadata: "{}",
    products: [],
  }));

  return { products, discounts: discountRows };
};
