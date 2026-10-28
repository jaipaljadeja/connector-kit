import { describe, expect, it } from "@effect/vitest";
import { Demo, Ingestor } from "@useairfoil/connector-kit";
import { Effect, Layer, Ref, Schema } from "effect";

import { demo } from "../src/demo";
import { CheckoutSchema } from "../src/resources/checkouts";
import { CustomerSchema } from "../src/resources/customers";
import { OrderSchema } from "../src/resources/orders";
import { ProductSchema } from "../src/resources/products";
import { RefundSchema } from "../src/resources/refunds";
import { SubscriptionSchema } from "../src/resources/subscriptions";

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

  yield* Demo.run(demo, { bytes: 1, seed: 42, now, groupsPerChunk: 30 }).pipe(
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

describe("Polar demo", () => {
  it.effect("writes every table with unique keys and links that resolve", () =>
    Effect.gen(function* () {
      const written = yield* generate;

      const products = new Map(
        rowsOf(written, "products", ProductSchema).map((row) => [row.id, row]),
      );

      const customers = rowsOf(written, "customers", CustomerSchema);
      const checkouts = rowsOf(written, "checkouts", CheckoutSchema);
      const subscriptions = rowsOf(written, "subscriptions", SubscriptionSchema);
      const orders = rowsOf(written, "orders", OrderSchema);
      const refunds = rowsOf(written, "refunds", RefundSchema);

      const customerIds = new Set(customers.map((row) => row.id));
      const checkoutIds = new Set(checkouts.map((row) => row.id));
      const subscriptionById = new Map(subscriptions.map((row) => [row.id, row]));

      for (const rows of [customers, checkouts, subscriptions, orders, refunds]) {
        expect(rows.length).toBeGreaterThan(0);
        expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
      }

      for (const subscription of subscriptions) {
        expect(customerIds.has(subscription.customer_id)).toBe(true);
        expect(products.get(subscription.product_id)?.is_recurring).toBe(true);
        expect(checkoutIds.has(subscription.checkout_id ?? "")).toBe(true);
        expect(subscription.current_period_start <= subscription.current_period_end).toBe(true);
      }

      for (const order of orders) {
        expect(customerIds.has(order.customer_id)).toBe(true);
        expect(products.has(order.product_id ?? "")).toBe(true);

        if (order.subscription_id !== null) {
          expect(subscriptionById.get(order.subscription_id)?.customer_id).toBe(order.customer_id);
        }

        expect(order.net_amount).toBe(order.subtotal_amount - order.discount_amount);
        expect(order.total_amount).toBe(order.net_amount + order.tax_amount);
        expect(order.refundable_amount).toBe(order.net_amount - order.refunded_amount);
        expect(order.created_at <= now).toBe(true);

        const refunded = refunds
          .filter((refund) => refund.order_id === order.id)
          .reduce((sum, refund) => sum + refund.amount, 0);

        expect(order.refunded_amount).toBe(refunded);
      }

      for (const checkout of checkouts) {
        expect(customerIds.has(checkout.customer_id ?? "")).toBe(true);
        expect(checkout.total_amount).toBe(checkout.net_amount + (checkout.tax_amount ?? 0));
      }

      expect({
        subscriptions: countBy(subscriptions, (row) => row.status),
        orders: countBy(orders, (row) => row.status),
        refunds: refunds.length,
      }).toMatchInlineSnapshot(`
        {
          "orders": {
            "paid": 129,
            "partially_refunded": 1,
            "refunded": 9,
          },
          "refunds": 10,
          "subscriptions": {
            "active": 17,
            "canceled": 2,
          },
        }
      `);

      expect(customers[0]).toMatchInlineSnapshot(`
        {
          "_deleted": false,
          "avatar_url": null,
          "billing_address": {
            "city": "Kobyville",
            "country": "CA",
            "line1": "211 Edgardo Parkways",
            "line2": null,
            "postal_code": "23471",
            "state": null,
          },
          "billing_name": "Kevin Beer",
          "created_at": 2026-07-28T18:21:28.809Z,
          "default_payment_method_id": null,
          "deleted_at": null,
          "email": "kevin_beer70@example.org",
          "email_verified": true,
          "external_id": null,
          "id": "00000003-0000-4000-8000-000000000000",
          "locale": null,
          "metadata": "{}",
          "modified_at": 2026-09-25T09:42:48.051Z,
          "name": "Kevin Beer",
          "organization_id": "00000000-0000-4000-8000-00000000a1f0",
          "type": "individual",
          "version": 2026-09-25T09:42:48.051Z,
        }
      `);
    }),
  );
});
