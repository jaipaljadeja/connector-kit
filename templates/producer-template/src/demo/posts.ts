import type { Demo } from "@useairfoil/connector-kit";

import { type Rows, userCount } from "./shared";

/** One group is one post by one of the users. */
export const postRows = (index: number, { faker, now }: Demo.DemoContext): Rows => ({
  posts: [
    {
      id: BigInt(index + 1),
      userId: BigInt((index % userCount) + 1),
      title: faker.lorem.sentence({ min: 3, max: 8 }).slice(0, -1).toLowerCase(),
      body: faker.lorem.sentences(4, "\n").toLowerCase(),
      version: now.toISOString(),
      _deleted: false,
    },
  ],
});
