import { ConnectorApp, Demo, RuntimeConfig } from "@useairfoil/connector-kit";
import { Command } from "effect/cli";

import { CheckoutSchema } from "../resources/checkouts";
import { CustomerSchema } from "../resources/customers";
import { DiscountSchema } from "../resources/discounts";
import { OrderSchema } from "../resources/orders";
import { ProductSchema } from "../resources/products";
import { RefundSchema } from "../resources/refunds";
import { SubscriptionSchema } from "../resources/subscriptions";
import { customerRows } from "./customers";
import { setupRows } from "./setup";

export const demo = Demo.define({
  name: "producer-polar",
  setup: {
    tables: [
      Demo.table({ name: "products", rowSchema: ProductSchema, version: "version" }),
      Demo.table({ name: "discounts", rowSchema: DiscountSchema, version: "version" }),
    ],
    rows: setupRows,
  },
  group: {
    tables: [
      Demo.table({ name: "customers", rowSchema: CustomerSchema, version: "version" }),
      Demo.table({ name: "checkouts", rowSchema: CheckoutSchema, version: "version" }),
      Demo.table({ name: "subscriptions", rowSchema: SubscriptionSchema, version: "version" }),
      Demo.table({ name: "orders", rowSchema: OrderSchema, version: "version" }),
      Demo.table({ name: "refunds", rowSchema: RefundSchema, version: "version" }),
    ],
    rows: customerRows,
  },
});

export const demoCommand = ConnectorApp.makeDemoCommand(demo).pipe(
  Command.provide(RuntimeConfig.layerHosted()),
);
