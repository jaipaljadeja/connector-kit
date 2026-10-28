import { describe, expect, it } from "@effect/vitest";
import { Iceberg } from "@useairfoil/connector-kit";
import { Effect } from "effect";

import { PostSchema } from "../src/schemas";

describe("producer-template Iceberg schemas", () => {
  it.effect("compiles posts with explicit IDs and docs", () =>
    Effect.gen(function* () {
      const request = yield* Iceberg.makeCreateTableCommitRequest(PostSchema, {
        location: "s3://warehouse/posts",
        uuid: "00000000-0000-4000-8000-000000000001",
      });

      const update = request.updates.find((update) => update.action === "add-schema");

      expect(
        update?.action === "add-schema" &&
          update.schema.fields.map(({ id, name, doc }) => ({ id, name, doc })),
      ).toMatchInlineSnapshot(`
        [
          {
            "doc": "Post ID.",
            "id": 1,
            "name": "id",
          },
          {
            "doc": "Author ID.",
            "id": 2,
            "name": "userId",
          },
          {
            "doc": "Post title.",
            "id": 3,
            "name": "title",
          },
          {
            "doc": "Post text.",
            "id": 4,
            "name": "body",
          },
          {
            "doc": "Time used to order post changes.",
            "id": 5,
            "name": "version",
          },
          {
            "doc": "Whether the post was deleted.",
            "id": 6,
            "name": "_deleted",
          },
        ]
      `);
    }),
  );
});
