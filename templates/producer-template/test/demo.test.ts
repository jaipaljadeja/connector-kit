import { describe, expect, it } from "@effect/vitest";
import { Demo, Ingestor } from "@useairfoil/connector-kit";
import { Effect, Layer, Ref, Schema } from "effect";

import { demo } from "../src/demo";
import { PostSchema } from "../src/schemas";

const now = new Date("2026-10-01T00:00:00.000Z");

// Each row counts as a byte, so 1 byte writes one chunk of 20 posts.
const generate = Effect.gen(function* () {
  const written = yield* Ref.make<ReadonlyArray<Ingestor.IngestOptions>>([]);

  const layer = Layer.succeed(Ingestor.Ingestor)({
    ingest: (options) =>
      Ref.update(written, (all) => [...all, options]).pipe(
        Effect.as({ rows: options.batch.rows.length, bytes: options.batch.rows.length }),
      ),
  });

  yield* Demo.run(demo, { bytes: 1, seed: 42, now, groupsPerChunk: 20 }).pipe(
    Effect.provide(layer),
  );

  return yield* Ref.get(written);
});

describe("template demo", () => {
  it.effect("writes posts with unique keys by the known users", () =>
    Effect.gen(function* () {
      const posts = Schema.decodeUnknownSync(Schema.Array(Schema.toType(PostSchema)))(
        (yield* generate).flatMap(({ batch }) => batch.rows),
      );

      expect(posts.length).toBe(20);
      expect(new Set(posts.map((post) => post.id)).size).toBe(posts.length);
      expect(posts.every((post) => post.userId >= 1n && post.userId <= 10n)).toBe(true);
      expect(posts[0]).toMatchInlineSnapshot(`
        {
          "_deleted": false,
          "body": "usitas paulatim suggero.
        volubilis tristis benevolentia.
        auctus cognomen esse custodia.
        perspiciatis apud claro copiose defleo.",
          "id": 1n,
          "title": "virga synagoga patruus armarium armarium",
          "userId": 1n,
          "version": "2026-10-01T00:00:00.000Z",
        }
      `);
    }),
  );
});
