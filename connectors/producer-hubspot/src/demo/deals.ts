import {
  type CompanyGroup,
  day,
  type DealPlan,
  idOf,
  iso,
  ownerId,
  productId,
  products,
  record,
} from "./shared";

/** One deal with its line items, quote, and split. A won deal also brings billing records. */
export const dealRows = (company: CompanyGroup, deal: DealPlan, n: number) => {
  const { faker, now, between, rows, index, companyId, name, owner, contactIds, main } = company;

  const updated = deal.closed ?? deal.opened;

  rows.deals.push({
    ...record(deal.id, deal.opened, updated, now, {
      dealname: `${name} - ${products[deal.lines[0]?.p ?? 0]?.name ?? "Plan"}`,
      amount: String(deal.amount),
      dealstage: deal.stage.id,
      pipeline: "default",
      closedate: iso(deal.closed ?? new Date(deal.opened.getTime() + 45 * day)),
      hubspot_owner_id: ownerId(owner),
      hs_deal_stage_probability: deal.stage.probability,
      deal_currency_code: "USD",
      hs_is_closed_won: String(deal.won),
    }),
    company_ids: [companyId],
    contact_ids: contactIds,
  });

  deal.lines.forEach((line, k) => {
    const product = products[line.p] ?? products[0];

    rows.line_items.push({
      ...record(idOf(50_000_000_000, index, n * 10 + k), deal.opened, deal.opened, now, {
        name: product.name,
        hs_sku: product.sku,
        hs_product_id: productId(line.p),
        quantity: String(line.quantity),
        price: String(product.price),
        amount: String(product.price * line.quantity),
        hs_recurring_billing_period: "P12M",
      }),
      deal_ids: [deal.id],
    });
  });

  rows.deal_split.push({
    ...record(idOf(55_000_000_000, index, n), deal.opened, deal.opened, now, {
      hs_split_percentage: "1",
      hubspot_owner_id: ownerId(owner),
    }),
    deal_ids: [deal.id],
  });

  if (deal.stage.id === "contractsent" || deal.closed) {
    const sent = between(deal.opened, deal.closed ?? now);

    rows.quotes.push({
      ...record(idOf(60_000_000_000, index, n), sent, sent, now, {
        hs_title: `Quote for ${name}`,
        hs_quote_amount: String(deal.amount),
        hs_currency: "USD",
        hs_expiration_date: iso(new Date(sent.getTime() + 30 * day)),
        hs_status: deal.won ? "APPROVED" : deal.closed ? "REJECTED" : "PENDING_APPROVAL",
      }),
      company_ids: [companyId],
      contact_ids: main ? [main.id] : [],
      deal_ids: [deal.id],
    });
  }

  if (deal.won && deal.closed) {
    // A won deal becomes a subscription, an order, and yearly invoices with payments.
    const start = deal.closed;

    rows.subscriptions.push({
      ...record(idOf(70_000_000_000, index, n), start, start, now, {
        hs_name: `${name} subscription`,
        hs_status: "active",
        hs_recurring_billing_start_date: iso(start),
        hs_recurring_billing_period: "P12M",
        hs_last_payment_amount: String(deal.amount),
        hs_currency_code: "USD",
      }),
      company_ids: [companyId],
      contact_ids: main ? [main.id] : [],
      deal_ids: [deal.id],
    });

    rows.orders.push({
      ...record(idOf(71_000_000_000, index, n), start, start, now, {
        hs_order_name: `Order ${index + 1}-${n + 1}`,
        hs_total_price: String(deal.amount),
        hs_currency_code: "USD",
        hs_fulfillment_status: "fulfilled",
        hs_payment_status: "paid",
      }),
      company_ids: [companyId],
      contact_ids: main ? [main.id] : [],
      deal_ids: [deal.id],
    });

    for (
      let year = 0, billed = start;
      billed <= now;
      year++, billed = new Date(start.getTime() + year * 365 * day)
    ) {
      const paid = new Date(billed.getTime() + faker.number.int({ min: day, max: 20 * day }));
      const settled = paid <= now;

      rows.invoices.push({
        ...record(
          idOf(72_000_000_000, index, n * 10 + year),
          billed,
          settled ? paid : billed,
          now,
          {
            hs_number: `INV-${index + 1}${n}${year + 1}`,
            hs_amount_billed: String(deal.amount),
            hs_currency: "USD",
            hs_invoice_status: settled ? "paid" : "open",
            hs_due_date: iso(new Date(billed.getTime() + 30 * day)),
          },
        ),
        company_ids: [companyId],
        contact_ids: main ? [main.id] : [],
        deal_ids: [deal.id],
      });

      if (settled) {
        rows.commerce_payments.push({
          ...record(idOf(73_000_000_000, index, n * 10 + year), paid, paid, now, {
            hs_initial_amount: String(deal.amount),
            hs_currency_code: "USD",
            hs_payment_method_type: faker.helpers.arrayElement(["card", "ach"]),
            hs_latest_status: "succeeded",
          }),
          company_ids: [companyId],
          contact_ids: main ? [main.id] : [],
          deal_ids: [deal.id],
        });
      }
    }
  }

  if (!deal.closed && faker.datatype.boolean({ probability: 0.3 })) {
    const left = between(deal.opened, now);

    rows.carts.push({
      ...record(idOf(74_000_000_000, index, n), left, left, now, {
        hs_cart_name: `${name} checkout`,
        hs_total_price: String(deal.amount),
        hs_currency_code: "USD",
      }),
      company_ids: [companyId],
      contact_ids: main ? [main.id] : [],
      deal_ids: [deal.id],
    });
  }
};
