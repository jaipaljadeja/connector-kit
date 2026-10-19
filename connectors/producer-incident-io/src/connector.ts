import { Connector, type ResourceDefinition } from "@useairfoil/connector-kit";
import { Config, Context, Effect, Layer, Redacted } from "effect";

import type { IncidentIoConfig } from "./manifest";

import * as IncidentIoClient from "./client/client";
import { makeCatalogEntries, makeCatalogTypes } from "./resources/catalog";
import { makeIncidents } from "./resources/incidents";
import {
  makeAlertAttributes,
  makeAlertNotes,
  makeAlertRoutes,
  makeAlertSources,
  makeAlerts,
  makeEscalationPaths,
  makeEscalations,
  makeMaintenanceWindows,
  makeNotificationPauses,
  makeScheduleOverrides,
  makeScheduleShifts,
  makeSchedules,
} from "./resources/on-call";
import {
  makeCustomFieldOptions,
  makeCustomFields,
  makeIncidentRoles,
  makeIncidentStatuses,
  makeIncidentTimestamps,
  makeIncidentTypes,
  makePolicies,
  makePolicyFindings,
  makeSeverities,
  makeStatusPageComponents,
  makeStatusPageIncidents,
  makeStatusPageMaintenances,
  makeStatusPages,
  makeTeams,
  makeUsers,
  makeWorkflowRuns,
  makeWorkflows,
} from "./resources/settings";
import { makeActions, makeFollowUps, makePostmortemDocuments } from "./resources/tasks";
import { makeWebhookRoute } from "./webhook/route";
export { IncidentIoConfigDef, manifest } from "./manifest";
export type { IncidentIoConfig } from "./manifest";

export const make = Effect.fnUntraced(function* (config: IncidentIoConfig) {
  const client = yield* IncidentIoClient.IncidentIoClient;

  const incidents = makeIncidents(client);
  const PostmortemDocuments = makePostmortemDocuments(client);
  const FollowUps = makeFollowUps(client);
  const Actions = makeActions(client);
  const Alerts = makeAlerts(client);
  const Escalations = makeEscalations(client);
  const Schedules = makeSchedules(client);
  const ScheduleShifts = makeScheduleShifts(client);
  const StatusPageIncidents = makeStatusPageIncidents(client);

  return Connector.define({
    name: "producer-incident-io",
    title: "incident.io",
    resources: [
      ...incidents.resources,
      PostmortemDocuments,
      FollowUps,
      Actions,
      Alerts,
      makeAlertNotes(client),
      makeAlertSources(client),
      makeAlertRoutes(client),
      makeAlertAttributes(client),
      Escalations,
      makeEscalationPaths(client),
      Schedules,
      ScheduleShifts,
      makeScheduleOverrides(client),
      makeNotificationPauses(client),
      makeMaintenanceWindows(client),
      makeCatalogTypes(client),
      makeCatalogEntries(client),
      makeUsers(client),
      makeTeams(client),
      makeSeverities(client),
      makeIncidentStatuses(client),
      makeIncidentTypes(client),
      makeIncidentRoles(client),
      makeIncidentTimestamps(client),
      makeCustomFields(client),
      makeCustomFieldOptions(client),
      makeWorkflows(client),
      makeWorkflowRuns(client),
      makeStatusPages(client),
      makeStatusPageComponents(client),
      StatusPageIncidents,
      makeStatusPageMaintenances(client),
      makePolicies(client),
      makePolicyFindings(client),
    ],
    changes: incidents.feed,
    webhooks: [
      makeWebhookRoute({
        secret: Redacted.value(config.webhookSecret),
        // The v1 follow-up events repeat the v2 ones. Membership events change no rows.
        targets: new Map<string, ReadonlyArray<ResourceDefinition>>([
          ["incident.incident_created_v2", incidents.webhookTargets],
          ["incident.incident_updated_v2", incidents.webhookTargets],
          ["incident.incident_status_updated_v2", incidents.webhookTargets],
          ["incident.follow_up_created_v2", [FollowUps]],
          ["incident.follow_up_updated_v2", [FollowUps]],
          ["incident.action_created_v1", [Actions]],
          ["incident.action_updated_v1", [Actions]],
          ["incident.postmortem_document_status_updated_v1", [PostmortemDocuments]],
          ["alert.alert_created_v1", [Alerts]],
          ["alert.alert_resolved_v1", [Alerts]],
          ["escalation.escalation_created_v1", [Escalations]],
          ["escalation.escalation_status_updated_v1", [Escalations]],
          ["schedule.created_v1", [Schedules]],
          ["schedule.updated_v1", [Schedules]],
          ["schedule.deleted_v1", [Schedules]],
          ["schedule.shift_change_v1", [ScheduleShifts]],
          ["status_page_incident.update_shared_v1", [StatusPageIncidents]],
        ]),
      }),
    ],
  });
});

export type IncidentIoConnectorRuntime = Effect.Success<ReturnType<typeof make>>;

export class IncidentIoConnector extends Context.Service<
  IncidentIoConnector,
  IncidentIoConnectorRuntime
>()("@useairfoil/producer-incident-io/IncidentIoConnector") {}

export const layer = (config: IncidentIoConfig) =>
  Layer.effect(IncidentIoConnector)(
    make(config).pipe(Effect.annotateLogs({ component: "incident-io" })),
  ).pipe(Layer.provide(IncidentIoClient.layer(config)));

export const layerConfig = (config: Config.Wrap<IncidentIoConfig>) =>
  Layer.unwrap(Config.unwrap(config).pipe(Effect.map(layer)));
