# Wings testing

Use this package when a test needs Wings.

## Install

```bash
pnpm add -D @useairfoil/wings-testing effect@^4
```

## Usage

```ts
import { TestWings } from "@useairfoil/wings-testing";
import { Effect } from "effect";

const uri = TestWings.Instance.use((wings) => wings.uri).pipe(
  Effect.provide(TestWings.container),
  Effect.scoped,
);
```

Docker is required. Set `AIRFOIL_TEST_CATALOG_HOST` if the engine container
cannot reach the catalog at the default host address.

Use `materializeAndCommit(catalogId, table)` to publish ingested rows before
querying them. External instances need their workers run separately.
