import type { Demo } from "@useairfoil/connector-kit";

import { Duration } from "effect";

import type { Cart } from "../resources/carts/row";
import type { Customer } from "../resources/customers/row";
import type { Order } from "../resources/orders/row";
import type { Refund } from "../resources/refunds/row";

import { type MoneyBag, normalizeAmount } from "../resources/shared";

export const hour = Duration.toMillis(Duration.hours(1));
export const day = Duration.toMillis(Duration.days(1));
export const vendor = "Northwind Goods";
export const taxRate = 0.08;
export const welcomeCode = "WELCOME10";

// Amounts are in cents, weights in grams.
export const catalog = [
  {
    title: "Classic Cotton Tee",
    type: "T-Shirts",
    price: 2800,
    grams: 180,
    option: { name: "Size", values: ["S", "M", "L", "XL"] },
  },
  {
    title: "Everyday Hoodie",
    type: "Sweatshirts",
    price: 6400,
    grams: 520,
    option: { name: "Size", values: ["S", "M", "L", "XL"] },
  },
  {
    title: "Linen Button Shirt",
    type: "Shirts",
    price: 7200,
    grams: 260,
    option: { name: "Size", values: ["S", "M", "L"] },
  },
  {
    title: "Wool Beanie",
    type: "Hats",
    price: 2600,
    grams: 90,
    option: { name: "Color", values: ["Charcoal", "Navy", "Rust"] },
  },
  { title: "Canvas Tote Bag", type: "Bags", price: 2200, grams: 300, option: null },
  {
    title: "Leather Card Wallet",
    type: "Accessories",
    price: 5400,
    grams: 80,
    option: { name: "Color", values: ["Black", "Tan"] },
  },
  {
    title: "Stoneware Mug",
    type: "Home",
    price: 1800,
    grams: 400,
    option: { name: "Color", values: ["Cream", "Sage"] },
  },
  {
    title: "Insulated Water Bottle",
    type: "Home",
    price: 3200,
    grams: 450,
    option: { name: "Color", values: ["Black", "White", "Sky"] },
  },
  {
    title: "Merino Running Socks",
    type: "Socks",
    price: 1600,
    grams: 60,
    option: { name: "Size", values: ["S/M", "L/XL"] },
  },
  { title: "Gift Card", type: "Gift Cards", price: 5000, grams: 0, option: null },
] as const;

type CatalogItem = (typeof catalog)[number];

// Shopify IDs are numbers; each kind gets its own range.
export const productNumber = (p: number) => 8_100_000_000_000 + p;
export const variantNumber = (p: number, v: number) => 44_000_000_000_000 + p * 10 + v;

export const handleOf = (item: CatalogItem) => item.title.toLowerCase().replaceAll(" ", "-");
export const isGiftCard = (item: CatalogItem) => item.type === "Gift Cards";

export const valuesOf = (item: CatalogItem): ReadonlyArray<string> =>
  item.option?.values ?? ["Default Title"];

export const money = (cents: number): MoneyBag => {
  const amount = normalizeAmount((cents / 100).toFixed(2));

  return {
    shopMoney: { amount, currencyCode: "USD" },
    presentmentMoney: { amount, currencyCode: "USD" },
  };
};

export const amount = (cents: number) => normalizeAmount((cents / 100).toFixed(2));

/** Date helpers for one run. `at` keeps a time from going past now. */
export const clock = ({ now }: Demo.DemoContext) => {
  const at = (time: number) => new Date(Math.min(time, now.getTime()));
  return { at };
};

export type Rows = {
  readonly customers: Array<Customer>;
  readonly orders: Array<Order>;
  readonly refunds: Array<Refund>;
  readonly carts: Array<Cart>;
};
