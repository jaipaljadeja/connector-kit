import {
  type AccountContact,
  type AccountGroup,
  campaignId,
  dateOnly,
  day,
  entryId,
  type OpportunityPlan,
  opportunityStages,
  pricebookId,
  productId,
  products,
  sfid,
  sobject,
  userId,
} from "./shared";

/** Opportunities, with their products, people, competition, and history. */
export const opportunityRows = (
  account: AccountGroup,
  main: AccountContact | undefined,
  campaign: number,
): Array<OpportunityPlan> => {
  const { faker, now, between, index, accountId, name, owner, created, add, next } = account;

  return Array.from(
    {
      length: faker.helpers.weightedArrayElement([
        { weight: 20, value: 0 },
        { weight: 55, value: 1 },
        { weight: 25, value: 2 },
      ]),
    },
    (_, o) => {
      const id = sfid("006", index, o);
      const opened = between(created, now);

      const stage = faker.helpers.weightedArrayElement([
        { weight: 40, value: 5 },
        { weight: 20, value: 6 },
        ...[0, 1, 2, 3, 4].map((value) => ({ weight: 8, value })),
      ]);

      const stageInfo = opportunityStages[stage] ?? opportunityStages[0];
      const closed = stage >= 5 ? between(opened, new Date(opened.getTime() + 90 * day)) : null;

      const lines = [
        faker.number.int({ max: 1 }),
        ...faker.helpers.arrayElements([2, 3, 4, 5], { min: 0, max: 2 }),
      ];

      const amount = lines.reduce((sum, p) => sum + (products[p]?.price ?? 0), 0);
      const updated = closed ?? opened;

      add(
        "opportunities",
        sobject(id, opened, updated, now, {
          AccountId: accountId,
          Name: `${name} - ${products[lines[0] ?? 0]?.name ?? "Analytics Cloud"}`,
          StageName: stageInfo.name,
          Probability: stageInfo.probability,
          Amount: amount,
          CloseDate: dateOnly(closed ?? new Date(opened.getTime() + 60 * day)),
          IsClosed: stage >= 5,
          IsWon: stage === 5,
          Type: o === 0 ? "New Business" : "Existing Business",
          LeadSource: "Web",
          ForecastCategoryName:
            stage === 5 ? "Closed" : stage === 6 ? "Omitted" : stage >= 3 ? "Commit" : "Pipeline",
          OwnerId: userId(owner),
          Pricebook2Id: pricebookId,
          CampaignId: campaignId(campaign),
          RecordTypeId: sfid("012", 0),
        }),
      );

      lines.forEach((p) => {
        const product = products[p] ?? products[0];

        add(
          "opportunity_line_items",
          sobject(next("00k"), opened, opened, now, {
            OpportunityId: id,
            PricebookEntryId: entryId(p),
            Product2Id: productId(p),
            Name: product.name,
            Quantity: 1,
            UnitPrice: product.price,
            TotalPrice: product.price,
            ListPrice: product.price,
          }),
        );
      });

      if (main)
        add(
          "opportunity_contact_roles",
          sobject(next("00K"), opened, opened, now, {
            OpportunityId: id,
            ContactId: main.id,
            Role: "Decision Maker",
            IsPrimary: true,
          }),
        );

      if (faker.datatype.boolean({ probability: 0.4 })) {
        add(
          "opportunity_competitors",
          sobject(next("00J"), opened, opened, now, {
            OpportunityId: id,
            CompetitorName: faker.helpers.arrayElement(["Tableau", "Looker", "Power BI"]),
            Strengths: "Brand awareness",
            Weaknesses: "Pricing",
          }),
        );
      }

      add(
        "opportunity_team_members",
        sobject(next("00q"), opened, opened, now, {
          OpportunityId: id,
          UserId: userId(owner),
          TeamMemberRole: "Account Manager",
          OpportunityAccessLevel: "Edit",
        }),
      );

      add(
        "opportunity_splits",
        sobject(next("049"), opened, opened, now, {
          OpportunityId: id,
          SplitOwnerId: userId(owner),
          SplitPercentage: 100,
          SplitAmount: amount,
          SplitTypeId: sfid("149", 0),
        }),
      );

      // Stage history: one row for each stage it reached, in order, and the last
      // one is when the opportunity last changed.
      const reached = stage === 6 ? faker.number.int({ max: 4 }) : Math.min(stage, 5);

      const steps = Array.from({ length: reached }, () => between(opened, updated)).toSorted(
        (a, b) => a.getTime() - b.getTime(),
      );

      for (let s = 0; s <= reached; s++) {
        const changed = s === reached ? updated : s === 0 ? opened : (steps[s - 1] ?? updated);
        const shown = s === reached && stage === 6 ? opportunityStages[6] : opportunityStages[s];

        add(
          "opportunity_history",
          sobject(next("008"), changed, changed, now, {
            OpportunityId: id,
            StageName: shown?.name ?? "Prospecting",
            Amount: amount,
            Probability: shown?.probability ?? 10,
            CloseDate: dateOnly(closed ?? new Date(opened.getTime() + 60 * day)),
          }),
        );

        if (s > 0) {
          add(
            "opportunity_field_history",
            sobject(next("017"), changed, changed, now, {
              OpportunityId: id,
              Field: "StageName",
              OldValue: opportunityStages[s - 1]?.name ?? null,
              NewValue: shown?.name ?? null,
              CreatedById: userId(owner),
            }),
          );
        }
      }

      if (stage >= 3) {
        const quoteId = next("0Q0");
        const sent = between(opened, closed ?? now);

        add(
          "quotes",
          sobject(quoteId, sent, sent, now, {
            OpportunityId: id,
            Name: `Quote for ${name}`,
            Status: stage === 5 ? "Accepted" : stage === 6 ? "Denied" : "Presented",
            ExpirationDate: dateOnly(new Date(sent.getTime() + 30 * day)),
            GrandTotal: amount,
            Subtotal: amount,
            Pricebook2Id: pricebookId,
            ContactId: main?.id ?? null,
          }),
        );

        lines.forEach((p) => {
          add(
            "quote_line_items",
            sobject(next("0QL"), sent, sent, now, {
              QuoteId: quoteId,
              PricebookEntryId: entryId(p),
              Product2Id: productId(p),
              Quantity: 1,
              UnitPrice: products[p]?.price ?? 0,
            }),
          );
        });
      }

      return { id, stage, closed, amount, lines };
    },
  );
};
