import {
  type AccountContact,
  type AccountGroup,
  campaignId,
  dateOnly,
  datetime,
  day,
  hour,
  type OpportunityPlan,
  sfid,
  sobject,
  topicId,
  userId,
} from "./shared";

/** Sales activity on the account: tasks, events, notes, and Chatter. */
export const activityRows = (
  account: AccountGroup,
  contactIds: ReadonlyArray<string>,
  opportunities: ReadonlyArray<OpportunityPlan>,
  won: OpportunityPlan | undefined,
) => {
  const { faker, now, between, accountId, name, owner, created, add, next } = account;

  for (let a = 0; a < faker.number.int({ min: 1, max: 6 }); a++) {
    const when = between(created, now);
    const who = faker.helpers.arrayElement(contactIds);

    const what =
      opportunities.length > 0 && faker.datatype.boolean()
        ? faker.helpers.arrayElement(opportunities).id
        : accountId;

    if (faker.datatype.boolean()) {
      const taskId = next("00T");

      add(
        "tasks",
        sobject(taskId, when, when, now, {
          Subject: faker.helpers.arrayElement(["Call", "Send proposal", "Follow up"]),
          Status: when < new Date(now.getTime() - 3 * day) ? "Completed" : "Not Started",
          Priority: "Normal",
          ActivityDate: dateOnly(when),
          WhoId: who ?? null,
          WhatId: what,
          OwnerId: userId(owner),
          TaskSubtype: "Task",
        }),
      );

      if (who)
        add(
          "task_relations",
          sobject(next("0RT"), when, when, now, { TaskId: taskId, RelationId: who, IsWhat: false }),
        );
    } else {
      const eventId = next("00U");

      add(
        "events",
        sobject(eventId, when, when, now, {
          Subject: faker.helpers.arrayElement(["Discovery call", "Demo", "QBR"]),
          StartDateTime: datetime(when),
          EndDateTime: datetime(new Date(when.getTime() + hour)),
          DurationInMinutes: 60,
          WhoId: who ?? null,
          WhatId: what,
          OwnerId: userId(owner),
        }),
      );

      if (who)
        add(
          "event_relations",
          sobject(next("0RE"), when, when, now, {
            EventId: eventId,
            RelationId: who,
            IsInvitee: true,
            Status: "Accepted",
          }),
        );
    }
  }

  const noted = between(created, now);

  add(
    "notes",
    sobject(next("002"), noted, noted, now, {
      ParentId: accountId,
      Title: "Account plan",
      Body: "Expand into the data team next quarter.",
      IsPrivate: false,
      OwnerId: userId(owner),
    }),
  );

  if (faker.datatype.boolean({ probability: 0.3 })) {
    add(
      "attachments",
      sobject(next("00P"), noted, noted, now, {
        ParentId: accountId,
        Name: "signed-order-form.pdf",
        ContentType: "application/pdf",
        BodyLength: faker.number.int({ min: 50_000, max: 900_000 }),
        OwnerId: userId(owner),
      }),
    );
  }

  const feedItem = next("0D5");

  add(
    "feed_items",
    sobject(feedItem, noted, noted, now, {
      ParentId: accountId,
      Type: "TextPost",
      Body: `Great call with ${name} today!`,
      CreatedById: userId(owner),
      CommentCount: 1,
      LikeCount: faker.number.int({ max: 5 }),
    }),
  );

  add(
    "feed_comments",
    sobject(next("0D7"), noted, noted, now, {
      FeedItemId: feedItem,
      ParentId: accountId,
      CommentBody: "Nice work!",
      CreatedById: userId(1),
    }),
  );

  add(
    "topic_assignments",
    sobject(next("0FT"), noted, noted, now, {
      TopicId: topicId(won ? 0 : 1),
      EntityId: accountId,
      EntityType: "Account",
    }),
  );
};

/** A lead that hasn't converted yet, from the same company. */
export const leadRows = (
  account: AccountGroup,
  main: AccountContact | undefined,
  campaign: number,
) => {
  const { faker, now, between, index, name, owner, domain, industry, created, add, next } = account;

  const leadFirst = faker.person.firstName();
  const leadLast = faker.person.lastName();
  const leadId = sfid("00Q", index);
  const leadCreated = between(created, now);

  add(
    "leads",
    sobject(leadId, leadCreated, leadCreated, now, {
      FirstName: leadFirst,
      LastName: leadLast,
      Name: `${leadFirst} ${leadLast}`,
      Company: name,
      Email: `${leadFirst}.${leadLast}@${domain}`.toLowerCase(),
      Status: faker.helpers.arrayElement([
        "Open - Not Contacted",
        "Working - Contacted",
        "Closed - Not Converted",
      ]),
      LeadSource: "Webinar",
      Industry: industry,
      IsConverted: false,
      OwnerId: userId(owner),
    }),
  );

  add(
    "lead_history",
    sobject(next("017"), leadCreated, leadCreated, now, {
      LeadId: leadId,
      Field: "created",
      OldValue: null,
      NewValue: null,
      CreatedById: userId(owner),
    }),
  );

  add(
    "campaign_members",
    sobject(next("00v"), leadCreated, leadCreated, now, {
      CampaignId: campaignId(campaign),
      LeadId: leadId,
      Status: "Sent",
      HasResponded: false,
    }),
  );

  // Sometimes the lead duplicates a contact.
  if (main && faker.datatype.boolean({ probability: 0.1 })) {
    const set = next("0GK");

    add(
      "duplicate_record_sets",
      sobject(set, leadCreated, leadCreated, now, {
        DuplicateRuleId: sfid("0Bm", 0),
        RecordCount: 2,
      }),
    );

    add(
      "duplicate_record_items",
      sobject(next("0GL"), leadCreated, leadCreated, now, {
        DuplicateRecordSetId: set,
        RecordId: leadId,
      }),
    );

    add(
      "duplicate_record_items",
      sobject(next("0GL"), leadCreated, leadCreated, now, {
        DuplicateRecordSetId: set,
        RecordId: main.id,
      }),
    );
  }
};
