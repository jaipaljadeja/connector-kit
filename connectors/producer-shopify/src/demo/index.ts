import { ConnectorApp, Demo, RuntimeConfig } from "@useairfoil/connector-kit";
import { Command } from "effect/cli";

import { CartSchema } from "../resources/carts/row";
import { CustomerSchema } from "../resources/customers/row";
import { OrderSchema } from "../resources/orders/row";
import { ProductSchema } from "../resources/products/row";
import { RefundSchema } from "../resources/refunds/row";
import { customerRows } from "./customers";
import { setupRows } from "./setup";

export const demo = Demo.define({
  name: "producer-shopify",
  setup: {
    tables: [Demo.table({ name: "products", rowSchema: ProductSchema, version: "updatedAt" })],
    rows: setupRows,
  },
  group: {
    tables: [
      Demo.table({ name: "customers", rowSchema: CustomerSchema, version: "updatedAt" }),
      Demo.table({ name: "orders", rowSchema: OrderSchema, version: "updatedAt" }),
      Demo.table({ name: "refunds", rowSchema: RefundSchema, version: "processedAt" }),
      Demo.table({ name: "carts", rowSchema: CartSchema, version: "updatedAt" }),
    ],
    rows: customerRows,
  },
});

export const demoCommand = ConnectorApp.makeDemoCommand(demo).pipe(
  Command.provide(RuntimeConfig.layerHosted()),
);
