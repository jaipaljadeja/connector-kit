import {
  type AccountContact,
  type AccountGroup,
  dateOnly,
  datetime,
  day,
  entryId,
  hour,
  type OpportunityPlan,
  pricebookId,
  productId,
  products,
  resourceId,
  sfid,
  sobject,
  territoryId,
  userId,
} from "./shared";

/** A won deal becomes a contract, an order, assets, and support entitlements. */
export const contractRows = (
  account: AccountGroup,
  main: AccountContact | undefined,
  opportunities: ReadonlyArray<OpportunityPlan>,
  won: OpportunityPlan | undefined,
) => {
  const { faker, now, at, index, accountId, name, owner, add, next, custom } = account;

  if (!won?.closed) return;

  const start = won.closed;
  const contractId = sfid("800", index);

  add(
    "contracts",
    sobject(contractId, start, start, now, {
      AccountId: accountId,
      Status: "Activated",
      StartDate: dateOnly(start),
      ContractTerm: 12,
      EndDate: dateOnly(new Date(start.getTime() + 365 * day)),
      ContractNumber: String(10_000 + index),
      OwnerId: userId(owner),
    }),
  );

  if (main)
    add(
      "contract_contact_roles",
      sobject(next("02a"), start, start, now, {
        ContractId: contractId,
        ContactId: main.id,
        Role: "Business User",
        IsPrimary: true,
      }),
    );

  const orderId = sfid("801", index);

  add(
    "orders",
    sobject(orderId, start, start, now, {
      AccountId: accountId,
      ContractId: contractId,
      OpportunityId: won.id,
      Status: "Activated",
      EffectiveDate: dateOnly(start),
      TotalAmount: won.amount,
      Pricebook2Id: pricebookId,
      OrderNumber: String(20_000 + index),
    }),
  );

  const assets: Array<string> = [];

  won.lines.forEach((p) => {
    add(
      "order_items",
      sobject(next("802"), start, start, now, {
        OrderId: orderId,
        PricebookEntryId: entryId(p),
        Product2Id: productId(p),
        Quantity: 1,
        UnitPrice: products[p]?.price ?? 0,
        TotalPrice: products[p]?.price ?? 0,
      }),
    );

    const assetId = next("02i");
    assets.push(assetId);

    add(
      "assets",
      sobject(assetId, start, start, now, {
        AccountId: accountId,
        ContactId: main?.id ?? null,
        Product2Id: productId(p),
        Name: products[p]?.name ?? "Asset",
        Status: "Installed",
        InstallDate: dateOnly(start),
        Quantity: 1,
      }),
    );
  });

  const [firstAsset, secondAsset] = assets;

  if (firstAsset && secondAsset) {
    add(
      "asset_relationships",
      sobject(next("1AR"), start, start, now, {
        AssetId: firstAsset,
        RelatedAssetId: secondAsset,
        RelationshipType: "Upgrade",
      }),
    );
  }

  const contract = next("810");

  add(
    "service_contracts",
    sobject(contract, start, start, now, {
      AccountId: accountId,
      Name: `${name} support`,
      StartDate: dateOnly(start),
      EndDate: dateOnly(new Date(start.getTime() + 365 * day)),
      Status: "Active",
      Pricebook2Id: pricebookId,
    }),
  );

  add(
    "contract_line_items",
    sobject(next("811"), start, start, now, {
      ServiceContractId: contract,
      PricebookEntryId: entryId(3),
      Quantity: 1,
      UnitPrice: products[3].price,
    }),
  );

  add(
    "entitlements",
    sobject(next("550"), start, start, now, {
      AccountId: accountId,
      Name: "Premier Support",
      StartDate: dateOnly(start),
      EndDate: dateOnly(new Date(start.getTime() + 365 * day)),
      Status: "Active",
      ServiceContractId: contract,
      Type: "Phone Support",
    }),
  );

  custom.push({
    ...sobject(sfid("a0B", index), start, start, now, {
      Name: `${name} onboarding`,
      Account__c: accountId,
      Status__c: start.getTime() + 45 * day < now.getTime() ? "Live" : "In Progress",
      Go_Live_Date__c: dateOnly(new Date(start.getTime() + 45 * day)),
    }),
    object: "Onboarding_Project__c",
  });

  // Field service visit to install it.
  const workOrder = next("0WO");
  const visit = at(start.getTime() + faker.number.int({ min: 5 * day, max: 20 * day }));

  add(
    "work_orders",
    sobject(workOrder, start, visit, now, {
      AccountId: accountId,
      ContactId: main?.id ?? null,
      Subject: "On-site installation",
      Status: visit < now ? "Completed" : "New",
      Priority: "Medium",
      ServiceTerritoryId: territoryId(index % 2),
      WorkOrderNumber: String(30_000 + index),
    }),
  );

  add(
    "work_order_line_items",
    sobject(next("1WL"), start, start, now, {
      WorkOrderId: workOrder,
      Description: "Install and configure",
      Status: visit < now ? "Completed" : "New",
      Quantity: 1,
    }),
  );

  const appointment = next("08p");

  add(
    "service_appointments",
    sobject(appointment, start, visit, now, {
      ParentRecordId: workOrder,
      Status: visit < now ? "Completed" : "Scheduled",
      SchedStartTime: datetime(visit),
      SchedEndTime: datetime(new Date(visit.getTime() + 3 * hour)),
      ServiceTerritoryId: territoryId(index % 2),
      AppointmentNumber: String(40_000 + index),
    }),
  );

  add(
    "assigned_resources",
    sobject(next("03r"), start, start, now, {
      ServiceAppointmentId: appointment,
      ServiceResourceId: resourceId(index % 3),
    }),
  );
};
