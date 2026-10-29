import type { Demo } from "@useairfoil/connector-kit";

import type { Price } from "../schemas/prices";
import type { Product } from "../schemas/products";

import { catalog, day, priceId, priceOptions, productId, seconds, unitAmount } from "./shared";

/** The catalog of products and prices, written once before any customer. */
export const setupRows = ({ now }: Demo.DemoContext) => {
  const created = seconds(now.getTime() - 800 * day);

  const productRows: Array<Product> = catalog.map((item) => ({
    id: productId(item),
    version: now,
    created,
    updated: created,
    livemode: false,
    active: true,
    name: item.name,
    description: item.plan ? `${item.name} plan` : `${item.name} add-on`,
    default_price: priceId(item, "usd", "month"),
    tax_code: "txcd_10103001",
    unit_label: item.seats ? "seat" : null,
    url: null,
    shippable: null,
    statement_descriptor: null,
    metadata: new Map(),
  }));

  const priceRows: Array<Price> = catalog.flatMap((item) =>
    priceOptions.map(([currency, interval]) => ({
      id: priceId(item, currency, interval),
      version: now,
      created,
      livemode: false,
      active: true,
      product: productId(item),
      currency,
      type: "recurring",
      billing_scheme: "per_unit",
      unit_amount: unitAmount(item, currency, interval),
      unit_amount_decimal: String(unitAmount(item, currency, interval)),
      tiers_mode: null,
      lookup_key: `${item.slug}_${interval}ly_${currency}`,
      nickname: `${item.name} ${interval}ly`,
      tax_behavior: "exclusive",
      recurring: {
        interval,
        interval_count: 1n,
        usage_type: "licensed",
        meter: null,
        trial_period_days: null,
      },
      metadata: new Map(),
    })),
  );

  return { products: productRows, prices: priceRows };
};
