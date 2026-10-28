import { describe, expect, it } from "@effect/vitest";
import { Demo, Ingestor } from "@useairfoil/connector-kit";
import { Effect, Layer, Ref, Schema } from "effect";

import { demo } from "../src/demo";
import { CartSchema } from "../src/resources/carts/row";
import { CustomerSchema } from "../src/resources/customers/row";
import { OrderSchema } from "../src/resources/orders/row";
import { ProductSchema } from "../src/resources/products/row";
import { RefundSchema } from "../src/resources/refunds/row";

const now = new Date("2026-10-01T00:00:00.000Z");

// Only group rows count toward the size, so 1 byte writes the setup tables and one chunk.
const groupTables = new Set<string>(demo.group.tables.map((table) => table.name));

const generate = Effect.gen(function* () {
  const written = yield* Ref.make<ReadonlyArray<Ingestor.IngestOptions>>([]);

  const layer = Layer.succeed(Ingestor.Ingestor)({
    ingest: (options) =>
      Ref.update(written, (all) => [...all, options]).pipe(
        Effect.as({
          rows: options.batch.rows.length,
          bytes: groupTables.has(options.resource) ? options.batch.rows.length : 0,
        }),
      ),
  });

  yield* Demo.run(demo, { bytes: 1, seed: 42, now, groupsPerChunk: 40 }).pipe(
    Effect.provide(layer),
  );

  return yield* Ref.get(written);
});

const rowsOf = <S extends Schema.Top>(
  written: ReadonlyArray<Ingestor.IngestOptions>,
  resource: string,
  schema: S,
) =>
  Schema.decodeUnknownSync(Schema.Array(Schema.toType(schema)))(
    written.filter((item) => item.resource === resource).flatMap((item) => item.batch.rows),
  );

const countBy = <A>(rows: ReadonlyArray<A>, key: (row: A) => string) =>
  Object.fromEntries(
    Object.entries(Object.groupBy(rows, key)).map(([name, group]) => [name, group?.length ?? 0]),
  );

const cents = (amount: string) => Math.round(Number(amount) * 100);

describe("Shopify demo", () => {
  it.effect("writes every table with unique keys and links that resolve", () =>
    Effect.gen(function* () {
      const written = yield* generate;
      const products = rowsOf(written, "products", ProductSchema);
      const customers = rowsOf(written, "customers", CustomerSchema);
      const orders = rowsOf(written, "orders", OrderSchema);
      const refunds = rowsOf(written, "refunds", RefundSchema);
      const carts = rowsOf(written, "carts", CartSchema);

      const variants = new Map(
        products.flatMap((product) =>
          product.variants.map((variant) => [variant.id, product.id] as const),
        ),
      );

      const orderById = new Map(orders.map((row) => [row.id, row]));

      for (const rows of [customers, orders, refunds, carts]) {
        expect(rows.length).toBeGreaterThan(0);
        expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
      }

      for (const order of orders) {
        const subtotal = order.lineItems.reduce(
          (sum, line) =>
            sum +
            cents(line.originalUnitPriceSet.shopMoney.amount) * line.quantity -
            cents(line.totalDiscountSet.shopMoney.amount),
          0,
        );

        expect(variants.get(order.lineItems[0]?.variantId ?? "")).toBe(
          order.lineItems[0]?.productId,
        );

        expect(cents(order.subtotalPriceSet?.shopMoney.amount ?? "")).toBe(subtotal);

        expect(cents(order.totalPriceSet.shopMoney.amount)).toBe(
          subtotal +
            cents(order.totalShippingPriceSet.shopMoney.amount) +
            cents(order.totalTaxSet?.shopMoney.amount ?? ""),
        );

        expect(order.createdAt <= order.updatedAt && order.updatedAt <= now).toBe(true);
      }

      for (const refund of refunds) {
        const order = orderById.get(refund.orderId);
        const lineIds = new Set(order?.lineItems.map((line) => line.id));

        const refunded =
          refund.refundLineItems.reduce(
            (sum, line) =>
              sum +
              cents(line.subtotalSet.shopMoney.amount) +
              cents(line.totalTaxSet.shopMoney.amount),
            0,
          ) +
          refund.refundShippingLines.reduce(
            (sum, line) => sum + cents(line.subtotalAmountSet.shopMoney.amount),
            0,
          );

        expect(refund.refundLineItems.every((line) => lineIds.has(line.lineItemId))).toBe(true);
        expect(cents(refund.transactions[0]?.amount ?? "")).toBe(refunded);

        expect(cents(order?.currentTotalPriceSet.shopMoney.amount ?? "")).toBe(
          cents(order?.totalPriceSet.shopMoney.amount ?? "") - refunded,
        );
      }

      for (const customer of customers) {
        const own = orders.filter((order) => order.customerId === customer.id);
        expect(customer.numberOfOrders).toBe(own.length);

        expect(cents(customer.amountSpent.amount)).toBe(
          own.reduce((sum, order) => sum + cents(order.currentTotalPriceSet.shopMoney.amount), 0),
        );

        expect(customer.lastOrderId === "" || orderById.has(customer.lastOrderId ?? "")).toBe(true);
      }

      for (const cart of carts) {
        expect(
          cart.lineItems.every((line) => variants.get(line.variantId) === line.productId),
        ).toBe(true);
      }

      expect({
        orders: countBy(orders, (row) => row.displayFinancialStatus ?? "none"),
        refunds: refunds.length,
        carts: carts.length,
      }).toMatchInlineSnapshot(`
        {
          "carts": 7,
          "orders": {
            "PAID": 46,
            "PARTIALLY_REFUNDED": 2,
            "REFUNDED": 3,
          },
          "refunds": 5,
        }
      `);

      expect(orders[0]?.lineItems[0]).toMatchInlineSnapshot(`
        {
          "currentQuantity": 2,
          "customAttributes": [],
          "discountAllocations": [],
          "id": "gid://shopify/LineItem/14000000000000",
          "isGiftCard": false,
          "name": "Everyday Hoodie - XL",
          "originalUnitPriceSet": {
            "presentmentMoney": {
              "amount": "64",
              "currencyCode": "USD",
            },
            "shopMoney": {
              "amount": "64",
              "currencyCode": "USD",
            },
          },
          "productId": "gid://shopify/Product/8100000000001",
          "quantity": 2,
          "requiresShipping": true,
          "sku": "NW-EVERYDAY-HOODIE-XL",
          "taxLines": [
            {
              "priceSet": {
                "presentmentMoney": {
                  "amount": "10.24",
                  "currencyCode": "USD",
                },
                "shopMoney": {
                  "amount": "10.24",
                  "currencyCode": "USD",
                },
              },
              "rate": 0.08,
              "title": "Sales Tax",
            },
          ],
          "taxable": true,
          "title": "Everyday Hoodie",
          "totalDiscountSet": {
            "presentmentMoney": {
              "amount": "0",
              "currencyCode": "USD",
            },
            "shopMoney": {
              "amount": "0",
              "currencyCode": "USD",
            },
          },
          "variantId": "gid://shopify/ProductVariant/44000000000013",
          "variantTitle": "XL",
          "vendor": "Northwind Goods",
        }
      `);
    }),
  );
});
