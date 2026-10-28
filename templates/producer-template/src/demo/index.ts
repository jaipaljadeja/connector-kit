import { ConnectorApp, Demo, RuntimeConfig } from "@useairfoil/connector-kit";
import { Command } from "effect/cli";

import { PostSchema } from "../schemas";
import { postRows } from "./posts";

export const demo = Demo.define({
  name: "producer-template",
  setup: { tables: [], rows: () => ({}) },
  group: {
    tables: [Demo.table({ name: "posts", rowSchema: PostSchema, version: "version" })],
    rows: postRows,
  },
});

export const demoCommand = ConnectorApp.makeDemoCommand(demo).pipe(
  Command.provide(RuntimeConfig.layerHosted()),
);
