import { ConnectorApp, Demo, RuntimeConfig } from "@useairfoil/connector-kit";
import { Command } from "effect/cli";

import { CatalogEntrySchema, CatalogTypeSchema } from "../schemas/catalog";
import {
  ActivityLogEntrySchema,
  AttachmentSchema,
  CallSessionSchema,
  IncidentAlertSchema,
  IncidentSchema,
  IncidentUpdateSchema,
  ParticipantSchema,
  ParticipantWorkloadSchema,
  RelationshipSchema,
  TimelineItemSchema,
} from "../schemas/incidents";
import {
  AlertAttributeSchema,
  AlertNoteSchema,
  AlertRouteSchema,
  AlertSchema,
  AlertSourceSchema,
  EscalationPathSchema,
  EscalationSchema,
  MaintenanceWindowSchema,
  NotificationPauseSchema,
  ScheduleOverrideSchema,
  ScheduleSchema,
  ScheduleShiftSchema,
} from "../schemas/on-call";
import {
  CustomFieldOptionSchema,
  CustomFieldSchema,
  IncidentRoleSchema,
  IncidentStatusSchema,
  IncidentTimestampSchema,
  IncidentTypeSchema,
  PolicyFindingSchema,
  PolicySchema,
  SeveritySchema,
  StatusPageComponentSchema,
  StatusPageIncidentSchema,
  StatusPageMaintenanceSchema,
  StatusPageSchema,
  TeamSchema,
  UserSchema,
  WorkflowRunSchema,
  WorkflowSchema,
} from "../schemas/settings";
import { ActionSchema, FollowUpSchema, PostmortemDocumentSchema } from "../schemas/tasks";
import { incidentRows } from "./incidents";
import { setupRows } from "./setup";

export const demo = Demo.define({
  name: "producer-incident-io",
  setup: {
    tables: [
      Demo.table({ name: "users", rowSchema: UserSchema, version: "version" }),
      Demo.table({ name: "teams", rowSchema: TeamSchema, version: "version" }),
      Demo.table({ name: "catalog_types", rowSchema: CatalogTypeSchema, version: "version" }),
      Demo.table({ name: "catalog_entries", rowSchema: CatalogEntrySchema, version: "version" }),
      Demo.table({ name: "severities", rowSchema: SeveritySchema, version: "version" }),
      Demo.table({
        name: "incident_statuses",
        rowSchema: IncidentStatusSchema,
        version: "version",
      }),
      Demo.table({ name: "incident_types", rowSchema: IncidentTypeSchema, version: "version" }),
      Demo.table({ name: "incident_roles", rowSchema: IncidentRoleSchema, version: "version" }),
      Demo.table({
        name: "incident_timestamps",
        rowSchema: IncidentTimestampSchema,
        version: "version",
      }),
      Demo.table({ name: "custom_fields", rowSchema: CustomFieldSchema, version: "version" }),
      Demo.table({
        name: "custom_field_options",
        rowSchema: CustomFieldOptionSchema,
        version: "version",
      }),
      Demo.table({ name: "alert_sources", rowSchema: AlertSourceSchema, version: "version" }),
      Demo.table({ name: "alert_routes", rowSchema: AlertRouteSchema, version: "version" }),
      Demo.table({ name: "alert_attributes", rowSchema: AlertAttributeSchema, version: "version" }),
      Demo.table({ name: "escalation_paths", rowSchema: EscalationPathSchema, version: "version" }),
      Demo.table({ name: "schedules", rowSchema: ScheduleSchema, version: "version" }),
      Demo.table({ name: "schedule_shifts", rowSchema: ScheduleShiftSchema, version: "version" }),
      Demo.table({
        name: "schedule_overrides",
        rowSchema: ScheduleOverrideSchema,
        version: "version",
      }),
      Demo.table({
        name: "on_call_notification_pauses",
        rowSchema: NotificationPauseSchema,
        version: "version",
      }),
      Demo.table({
        name: "maintenance_windows",
        rowSchema: MaintenanceWindowSchema,
        version: "version",
      }),
      Demo.table({ name: "workflows", rowSchema: WorkflowSchema, version: "version" }),
      Demo.table({ name: "status_pages", rowSchema: StatusPageSchema, version: "version" }),
      Demo.table({
        name: "status_page_components",
        rowSchema: StatusPageComponentSchema,
        version: "version",
      }),
      Demo.table({
        name: "status_page_maintenances",
        rowSchema: StatusPageMaintenanceSchema,
        version: "version",
      }),
      Demo.table({ name: "policies", rowSchema: PolicySchema, version: "version" }),
    ],
    rows: setupRows,
  },
  group: {
    tables: [
      Demo.table({ name: "incidents", rowSchema: IncidentSchema, version: "version" }),
      Demo.table({ name: "incident_updates", rowSchema: IncidentUpdateSchema, version: "version" }),
      Demo.table({
        name: "incident_timeline_items",
        rowSchema: TimelineItemSchema,
        version: "version",
      }),
      Demo.table({
        name: "incident_activity_log_entries",
        rowSchema: ActivityLogEntrySchema,
        version: "version",
      }),
      Demo.table({
        name: "incident_participants",
        rowSchema: ParticipantSchema,
        version: "version",
      }),
      Demo.table({
        name: "incident_relationships",
        rowSchema: RelationshipSchema,
        version: "version",
      }),
      Demo.table({ name: "incident_attachments", rowSchema: AttachmentSchema, version: "version" }),
      Demo.table({ name: "incident_alerts", rowSchema: IncidentAlertSchema, version: "version" }),
      Demo.table({
        name: "incident_call_sessions",
        rowSchema: CallSessionSchema,
        version: "version",
      }),
      Demo.table({
        name: "incident_participant_workloads",
        rowSchema: ParticipantWorkloadSchema,
        version: "version",
      }),
      Demo.table({
        name: "postmortem_documents",
        rowSchema: PostmortemDocumentSchema,
        version: "version",
      }),
      Demo.table({ name: "follow_ups", rowSchema: FollowUpSchema, version: "version" }),
      Demo.table({ name: "actions", rowSchema: ActionSchema, version: "version" }),
      Demo.table({ name: "alerts", rowSchema: AlertSchema, version: "version" }),
      Demo.table({ name: "alert_notes", rowSchema: AlertNoteSchema, version: "version" }),
      Demo.table({ name: "escalations", rowSchema: EscalationSchema, version: "version" }),
      Demo.table({ name: "workflow_runs", rowSchema: WorkflowRunSchema, version: "version" }),
      Demo.table({
        name: "status_page_incidents",
        rowSchema: StatusPageIncidentSchema,
        version: "version",
      }),
      Demo.table({ name: "policy_findings", rowSchema: PolicyFindingSchema, version: "version" }),
    ],
    rows: incidentRows,
  },
});

export const demoCommand = ConnectorApp.makeDemoCommand(demo).pipe(
  Command.provide(RuntimeConfig.layerHosted()),
);
