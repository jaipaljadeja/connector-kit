import { type ConnectorError, Resource } from "@useairfoil/connector-kit";
import { Effect, Schema } from "effect";

import type { GitHubClientService } from "../client/client";
import type { CommitObject } from "../schemas/commits";
import type { RepositoryRef } from "../schemas/repositories";

import {
  type CommitStatus,
  type CommitStatusObject,
  CommitStatusObjectSchema,
  CommitStatusSchema,
} from "../schemas/commit-statuses";
import { StatusEventSchema, WebhookPayloadSchema } from "../schemas/events";
import { commitSpec } from "./commits";
import {
  type RepoResourceSpec,
  backfillRepoResource,
  changesRepoResource,
  checkRepoResource,
  childRows,
  decodeEvent,
} from "./shared";

const toRow = (
  { updated_at, ...rest }: CommitStatusObject,
  sha: string,
  repository_id: bigint,
): CommitStatus => ({ ...rest, version: updated_at, repository_id, sha });

/** Statuses of default-branch commits. Webhooks also bring other branches. */
const commitStatusSpec = (
  client: GitHubClientService,
): RepoResourceSpec<CommitObject, CommitStatus> => ({
  ...commitSpec,
  rows: childRows(client, {
    path: (commit) => `commits/${commit.sha}/statuses`,
    pageSchema: Schema.Array(CommitStatusObjectSchema),
    toRow: (status, commit, repositoryId) => toRow(status, commit.sha, repositoryId),
  }),
});

export const makeCommitStatuses = (
  client: GitHubClientService,
  repositories: Effect.Effect<ReadonlyArray<RepositoryRef>, ConnectorError>,
) => {
  const spec = commitStatusSpec(client);
  return Resource.entity({
    name: "commit_statuses",
    rowSchema: CommitStatusSchema,
    key: "id",
    version: "version",

    check: checkRepoResource(client, spec),
    backfill: backfillRepoResource(client, repositories, spec),
    changes: changesRepoResource(client, spec),
    webhook: {
      schema: WebhookPayloadSchema,
      // The payload has no node ID or creator, so the row leaves them out.
      handler: ({ payload }) =>
        decodeEvent(StatusEventSchema, payload).pipe(
          Effect.map(({ updated_at, repository, ...rest }) => [
            { ...rest, version: updated_at, repository_id: repository.id },
          ]),
        ),
    },
  });
};
