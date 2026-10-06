import { Connector, type ResourceDefinition } from "@useairfoil/connector-kit";
import { Config, Context, Effect, Layer, Redacted } from "effect";

import type { GitHubConfig } from "./manifest";

import * as GitHubClient from "./client/client";
import { makeCheckRuns } from "./resources/check-runs";
import { makeCommitStatuses } from "./resources/commit-statuses";
import { makeCommits } from "./resources/commits";
import { makeIssueComments } from "./resources/issue-comments";
import { makeIssues } from "./resources/issues";
import { makePullRequestCommits } from "./resources/pull-request-commits";
import { makePullRequestReviewComments } from "./resources/pull-request-review-comments";
import { makePullRequestReviews } from "./resources/pull-request-reviews";
import { makePullRequests } from "./resources/pull-requests";
import { makeReleases } from "./resources/releases";
import { makeRepositories } from "./resources/repositories";
import { cachedRepositoryRefs } from "./resources/shared";
import { makeWorkflowJobs } from "./resources/workflow-jobs";
import { makeWorkflowRuns } from "./resources/workflow-runs";
import { makeWebhookRoute } from "./webhook/route";
export { GitHubConfigDef, manifest } from "./manifest";
export type { GitHubConfig } from "./manifest";

export const make = Effect.fnUntraced(function* (config: GitHubConfig) {
  const client = yield* GitHubClient.GitHubClient;
  // The backfills of the per-repository resources share this list.
  const repositories = yield* cachedRepositoryRefs(client);

  const Repositories = makeRepositories(client);
  const Issues = makeIssues(client, repositories);
  const PullRequests = makePullRequests(client, repositories);
  const IssueComments = makeIssueComments(client, repositories);
  const PullRequestReviews = makePullRequestReviews(client, repositories);
  const PullRequestReviewComments = makePullRequestReviewComments(client, repositories);
  const PullRequestCommits = makePullRequestCommits(client, repositories);
  const Commits = makeCommits(client, repositories);
  const CheckRuns = makeCheckRuns(client, repositories);
  const CommitStatuses = makeCommitStatuses(client, repositories);
  const WorkflowRuns = makeWorkflowRuns(client, repositories);
  const WorkflowJobs = makeWorkflowJobs(client, repositories);
  const Releases = makeReleases(client, repositories);

  return Connector.define({
    name: "producer-github",
    title: "GitHub",
    resources: [
      Repositories,
      Issues,
      PullRequests,
      IssueComments,
      PullRequestReviews,
      PullRequestReviewComments,
      PullRequestCommits,
      Commits,
      CheckRuns,
      CommitStatuses,
      WorkflowRuns,
      WorkflowJobs,
      Releases,
    ],
    webhooks: [
      makeWebhookRoute({
        secret: Redacted.value(config.webhookSecret),
        installationId: config.installationId,
        targets: new Map<string, ReadonlyArray<ResourceDefinition>>([
          ["repository", [Repositories]],
          ["issues", [Issues]],
          ["pull_request", [PullRequests, PullRequestCommits]],
          ["issue_comment", [IssueComments]],
          ["pull_request_review", [PullRequestReviews]],
          ["pull_request_review_comment", [PullRequestReviewComments]],
          ["push", [Commits]],
          ["check_run", [CheckRuns]],
          ["status", [CommitStatuses]],
          ["workflow_run", [WorkflowRuns]],
          ["workflow_job", [WorkflowJobs]],
          ["release", [Releases]],
        ]),
      }),
    ],
  });
});

export type GitHubConnectorRuntime = Effect.Success<ReturnType<typeof make>>;

export class GitHubConnector extends Context.Service<GitHubConnector, GitHubConnectorRuntime>()(
  "@useairfoil/producer-github/GitHubConnector",
) {}

export const layer = (config: GitHubConfig) =>
  Layer.effect(GitHubConnector)(
    make(config).pipe(Effect.annotateLogs({ component: "github" })),
  ).pipe(Layer.provide(GitHubClient.layer(config)));

export const layerConfig = (config: Config.Wrap<GitHubConfig>) =>
  Layer.unwrap(Config.unwrap(config).pipe(Effect.map(layer)));
