import { Config, Context, Effect, Layer } from "effect";
import { networkInterfaces } from "node:os";
import { GenericContainer, Network, Wait } from "testcontainers";

export class Instance extends Context.Service<
  Instance,
  {
    readonly uri: Effect.Effect<string>;
    readonly icebergRestUri: Effect.Effect<string>;
    /** Publishes ingested rows using the container's workers. Fails for external instances. */
    readonly materializeAndCommit: (
      catalog: string,
      table: { namespace: string[]; name: string },
    ) => Effect.Effect<void, Error>;
  }
>()("@useairfoil/wings-testing/Instance") {}

/** Uses an existing engine and catalog without managing their lifecycle. */
export const external = (args: { host?: string; port?: number; icebergRestUri?: string } = {}) => {
  const host = args.host ?? "localhost";
  const port = args.port ?? 7777;
  const icebergRestUri = args.icebergRestUri ?? "http://localhost:8181";

  return Layer.succeed(Instance, {
    uri: Effect.succeed(`http://${host}:${port}`),
    icebergRestUri: Effect.succeed(icebergRestUri),
    materializeAndCommit: () =>
      Effect.fail(new Error("External engine workers must be run by the test owner")),
  });
};

/** Starts isolated engine and SeaweedFS containers; releases them when the scope closes. */
export const container = Layer.effect(Instance)(
  Effect.gen(function* () {
    const network = yield* Effect.acquireRelease(
      Effect.tryPromise({
        try: () => new Network().start(),
        catch: () => new Error("Failed to create network"),
      }),
      (network) =>
        Effect.tryPromise(() => network.stop()).pipe(
          Effect.catch(() => Effect.logWarning("Test network cleanup failed")),
        ),
    );

    const seaweedfs = yield* Effect.acquireRelease(
      Effect.tryPromise({
        try: () =>
          new GenericContainer("chrislusf/seaweedfs:4.29")
            .withNetwork(network)
            .withNetworkAliases("seaweedfs")
            .withEntrypoint(["weed"])
            .withCommand(["mini", "-s3", "-dir=/data"])
            .withEnvironment({
              AWS_ACCESS_KEY_ID: "wingsdevaccesskey",
              AWS_SECRET_ACCESS_KEY: "wingsdevsecretkey",
              S3_BUCKET: "default-bucket",
              S3_TABLE_BUCKET: "default-catalog",
            })
            .withTmpFs({ "/data": "rw" })
            .withExposedPorts(8181)
            .withWaitStrategy(
              Wait.forAll([
                Wait.forLogMessage(/S3\s+ready/),
                Wait.forHttp("/v1/default-catalog/namespaces", 8181),
              ]),
            )
            .withStartupTimeout(30_000)
            .start(),
        catch: () => new Error("Failed to start SeaweedFS container"),
      }),
      (seaweedfs) =>
        Effect.tryPromise(() => seaweedfs.stop()).pipe(
          Effect.catch(() => Effect.logWarning("Test SeaweedFS cleanup failed")),
        ),
    );

    // Loopback in the engine container cannot reach the host catalog.
    const defaultHost =
      Object.values(networkInterfaces())
        .flat()
        .find((address) => address?.family === "IPv4" && !address.internal)?.address ??
      seaweedfs.getHost();
    const upstreamHost = yield* Config.String("AIRFOIL_TEST_CATALOG_HOST").pipe(
      Config.withDefault(defaultHost),
    );
    const upstreamUri = `http://${upstreamHost}:${seaweedfs.getMappedPort(8181)}`;

    const engine = yield* Effect.acquireRelease(
      Effect.tryPromise({
        try: () =>
          new GenericContainer(
            "quay.io/airfoil/storage-engine@sha256:1a3f88c8a5fe498b15119429b6ec02dbdac0f9d38f1525aa62a61a01abae81c1",
          )
            .withNetwork(network)
            .withCommand(["start", "server", "--server.address=0.0.0.0:7777"])
            .withEnvironment({
              RUST_LOG: "warn",
              SE_S3_BUCKET: "default-bucket",
              SE_S3_ENDPOINT: "http://seaweedfs:8333",
              OTEL_SDK_DISABLED: "true",
              AWS_ACCESS_KEY_ID: "wingsdevaccesskey",
              AWS_SECRET_ACCESS_KEY: "wingsdevsecretkey",
              AWS_REGION: "us-east-1",
            })
            .withExposedPorts(7777)
            .withWaitStrategy(Wait.forHttp("/health", 7777))
            .withStartupTimeout(60_000)
            .start(),
        catch: () => new Error("Failed to start storage-engine container"),
      }),
      (engine) =>
        Effect.tryPromise(() => engine.stop()).pipe(
          Effect.catch(() => Effect.logWarning("Test engine cleanup failed")),
        ),
    );

    return {
      uri: Effect.sync(() => `http://${engine.getHost()}:${engine.getMappedPort(7777)}`),
      icebergRestUri: Effect.succeed(upstreamUri),
      materializeAndCommit: (catalog, table) =>
        Effect.gen(function* () {
          const tableName = [...table.namespace, table.name].join(".");
          for (const task of ["materialize", "commit"]) {
            const result = yield* Effect.tryPromise({
              try: () =>
                engine.exec(["/bin/se", task, "--catalog-id", catalog, "--table", tableName]),
              catch: () => new Error("Engine worker command failed"),
            });
            if (result.exitCode !== 0)
              return yield* Effect.fail(new Error(`Engine ${task} failed`));
          }
        }),
    };
  }),
);
