import { type AccountContact, type AccountGroup, day, sfid, sobject, userId } from "./shared";

/** Contacts, each with their consent records. The first one is the main contact. */
export const contactRows = (account: AccountGroup): Array<AccountContact> => {
  const { faker, now, between, index, accountId, owner, domain, created, city, state, add } =
    account;

  return Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, (_, c) => {
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const id = sfid("003", index, c);
    const added = between(created, new Date(created.getTime() + 60 * day));
    const email = `${first}.${last}@${domain}`.toLowerCase();
    const phone = faker.phone.number({ style: "national" });
    const individual = sfid("0PK", index, c);

    add(
      "individuals",
      sobject(individual, added, added, now, {
        FirstName: first,
        LastName: last,
        HasOptedOutTracking: false,
        HasOptedOutProcessing: false,
      }),
    );

    add(
      "contact_point_emails",
      sobject(sfid("9PE", index, c), added, added, now, {
        ParentId: individual,
        EmailAddress: email,
        IsPrimary: true,
      }),
    );

    add(
      "contact_point_phones",
      sobject(sfid("9PP", index, c), added, added, now, {
        ParentId: individual,
        TelephoneNumber: phone,
        PhoneType: "Work",
        IsPrimary: true,
      }),
    );

    add(
      "contacts",
      sobject(id, added, added, now, {
        AccountId: accountId,
        FirstName: first,
        LastName: last,
        Name: `${first} ${last}`,
        Email: email,
        Phone: phone,
        Title: faker.person.jobTitle(),
        IndividualId: individual,
        LeadSource: faker.helpers.arrayElement([
          "Web",
          "Webinar",
          "Partner Referral",
          "Trade Show",
        ]),
        MailingCity: city,
        MailingState: state,
        MailingCountry: "United States",
        OwnerId: userId(owner),
      }),
    );

    add(
      "account_contact_relations",
      sobject(sfid("07k", index, c), added, added, now, {
        AccountId: accountId,
        ContactId: id,
        IsDirect: true,
        IsActive: true,
        Roles: c === 0 ? "Decision Maker" : "Evaluator",
      }),
    );

    add(
      "contact_history",
      sobject(sfid("017", index, c), added, added, now, {
        ContactId: id,
        Field: "created",
        OldValue: null,
        NewValue: null,
        CreatedById: userId(owner),
      }),
    );

    return { id, first, last, email, added };
  });
};
