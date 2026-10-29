import { type CompanyGroup, day, hour, idOf, iso, ownerId, record, ticketStages } from "./shared";

/** Support tickets, for customers only. Returns their IDs. */
export const ticketRows = (company: CompanyGroup): Array<string> => {
  const { faker, now, at, between, rows, index, companyId, owner, created, customer, main } =
    company;

  return customer
    ? Array.from({ length: faker.number.int({ max: 3 }) }, (_, n) => {
        const opened = between(created, now);

        const stage = faker.helpers.weightedArrayElement([
          { weight: 70, value: ticketStages[3] },
          ...ticketStages.slice(0, 3).map((value) => ({ weight: 10, value })),
        ]);

        const closed =
          stage.state === "CLOSED"
            ? at(opened.getTime() + faker.number.int({ min: hour, max: 5 * day }))
            : null;

        const id = idOf(80_000_000_000, index, n);

        rows.tickets.push({
          ...record(id, opened, closed ?? opened, now, {
            subject: faker.helpers.arrayElement([
              "Can't export report",
              "SSO login fails",
              "Question about invoice",
              "Feature request: bulk edit",
            ]),
            content: "Hi team, we ran into this today. Can you help?",
            hs_pipeline: "0",
            hs_pipeline_stage: stage.id,
            hs_ticket_priority: faker.helpers.arrayElement(["LOW", "MEDIUM", "HIGH"]),
            hubspot_owner_id: ownerId(owner),
            ...(closed ? { closed_date: iso(closed) } : {}),
          }),
          company_ids: [companyId],
          contact_ids: main ? [main.id] : [],
          deal_ids: [],
        });

        return id;
      })
    : [];
};

/** Calls, emails, meetings, notes, and other activity, tied to the company's records. */
export const activityRows = (company: CompanyGroup, tickets: ReadonlyArray<string>) => {
  const { faker, now, between, rows, index, companyId, name, owner, created, contacts, dealIds } =
    company;

  const activityCount = faker.number.int({ min: 2, max: 10 });

  for (let a = 0; a < activityCount; a++) {
    const when = between(created, now);
    const contact = faker.helpers.arrayElement(contacts);

    const links = {
      company_ids: [companyId],
      contact_ids: contact ? [contact.id] : [],
      deal_ids:
        dealIds.length > 0 && faker.datatype.boolean() ? [faker.helpers.arrayElement(dealIds)] : [],
      ticket_ids:
        tickets.length > 0 && faker.datatype.boolean({ probability: 0.3 })
          ? [faker.helpers.arrayElement(tickets)]
          : [],
    };

    const base = { hs_timestamp: iso(when), hubspot_owner_id: ownerId(owner) };
    const id = idOf(90_000_000_000, index, a);

    const kind = faker.helpers.weightedArrayElement([
      { weight: 30, value: "email" },
      { weight: 20, value: "call" },
      { weight: 15, value: "meeting" },
      { weight: 15, value: "note" },
      { weight: 15, value: "task" },
      { weight: 4, value: "communication" },
      { weight: 3, value: "postal_mail" },
    ] as const);

    switch (kind) {
      case "email":
        rows.emails.push({
          ...record(id, when, when, now, {
            ...base,
            hs_email_subject: faker.helpers.arrayElement([
              "Following up",
              "Quick question",
              "Next steps",
              "Your trial",
            ]),
            hs_email_direction: faker.helpers.arrayElement(["EMAIL", "INCOMING_EMAIL"]),
            hs_email_status: "SENT",
            hs_email_text: "Thanks for your time today. Here is a summary of what we discussed.",
          }),
          ...links,
        });

        break;
      case "call":
        rows.calls.push({
          ...record(id, when, when, now, {
            ...base,
            hs_call_title: `Call with ${contact?.first ?? name}`,
            hs_call_direction: faker.helpers.arrayElement(["OUTBOUND", "INBOUND"]),
            hs_call_duration: String(faker.number.int({ min: 60_000, max: 2_400_000 })),
            hs_call_status: "COMPLETED",
            hs_call_disposition: "f240bbac-87c9-4f6e-bf70-924b57d47db7",
          }),
          ...links,
        });

        break;
      case "meeting":
        rows.meetings.push({
          ...record(id, when, when, now, {
            ...base,
            hs_meeting_title: faker.helpers.arrayElement([
              "Discovery call",
              "Product demo",
              "Quarterly review",
              "Onboarding kickoff",
            ]),
            hs_meeting_start_time: iso(when),
            hs_meeting_end_time: iso(new Date(when.getTime() + hour / 2)),
            hs_meeting_outcome: when < now ? "COMPLETED" : "SCHEDULED",
          }),
          ...links,
        });

        break;
      case "note":
        rows.notes.push({
          ...record(id, when, when, now, {
            ...base,
            hs_note_body: faker.helpers.arrayElement([
              "Budget approved for next quarter.",
              "They are comparing us with two other vendors.",
              "Champion moved teams, need a new contact.",
            ]),
          }),
          ...links,
        });

        break;
      case "task":
        rows.tasks.push({
          ...record(id, when, when, now, {
            ...base,
            hs_task_subject: faker.helpers.arrayElement([
              "Send proposal",
              "Follow up on pricing",
              "Book demo",
              "Check in after onboarding",
            ]),
            hs_task_status: when < new Date(now.getTime() - 7 * day) ? "COMPLETED" : "NOT_STARTED",
            hs_task_priority: faker.helpers.arrayElement(["LOW", "MEDIUM", "HIGH"]),
            hs_task_type: faker.helpers.arrayElement(["EMAIL", "CALL", "TODO"]),
          }),
          ...links,
        });

        break;
      case "communication":
        rows.communications.push({
          ...record(id, when, when, now, {
            ...base,
            hs_communication_channel_type: faker.helpers.arrayElement([
              "SMS",
              "WHATS_APP",
              "LINKEDIN_MESSAGE",
            ]),
            hs_communication_logged_from: "CRM",
            hs_communication_body: "Sounds good, talk on Thursday.",
          }),
          ...links,
        });

        break;
      case "postal_mail":
        rows.postal_mail.push({
          ...record(id, when, when, now, {
            ...base,
            hs_postal_mail_body: "Sent a thank-you card and swag box.",
          }),
          ...links,
        });

        break;
    }
  }
};
