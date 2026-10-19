import { Iceberg } from "@useairfoil/connector-kit";
import { Schema, Struct } from "effect";

import {
  Json,
  Long,
  Named,
  Optional,
  Ref,
  Timestamp,
  common,
  fetched,
  fetchedVersion,
  field,
  list,
  stringMap,
} from "./shared";

const AttributeValueSchema = Schema.Struct({
  label: Optional(Schema.String),
  literal: Optional(Schema.String),
  catalog_entry: Optional(Ref),
});

export const AlertSchema = Schema.Struct({
  ...common("Alert"),
  alert_source_id: Schema.String.pipe(field(10, "Alert source.")),
  deduplication_key: Schema.String.pipe(field(11, "Key that groups repeats of the alert.")),
  status: Schema.String.pipe(field(12, "firing or resolved.")),
  title: Schema.String.pipe(field(13, "Alert title.")),
  description: Optional(Schema.String).pipe(field(14, "Alert text.")),
  source_url: Optional(Schema.String).pipe(field(15, "Link to the alert in its source.")),
  resolved_at: Optional(Timestamp).pipe(field(16, "Time the alert resolved.")),
  alert_group_ids: list(101, Schema.String).pipe(field(17, "Alert groups.")),
  tags: list(
    102,
    Schema.Struct({
      tag_id: Schema.String.pipe(field(103, "Tag.")),
      name: Schema.String.pipe(field(104, "Tag name.")),
    }),
  ).pipe(field(18, "Tags.")),
  attributes: list(
    110,
    Schema.Struct({
      attribute_id: Schema.String.pipe(field(111, "Alert attribute.")),
      attribute_name: Schema.String.pipe(field(112, "Attribute name.")),
      label: Optional(Schema.String).pipe(field(113, "Value as shown.")),
      literal: Optional(Schema.String).pipe(field(114, "Value as sent.")),
      catalog_entry_id: Optional(Schema.String).pipe(field(115, "Catalog entry value.")),
    }),
  ).pipe(field(19, "Attribute values, one element per value.")),
})
  .annotate({ description: "incident.io alerts from alert sources." })
  .pipe(Iceberg.identifier("id"));

export type Alert = Schema.Schema.Type<typeof AlertSchema>;

export const AlertObjectSchema = Schema.Struct({
  id: Schema.String,
  created_at: Timestamp,
  updated_at: Timestamp,
  alert_source_id: Schema.String,
  deduplication_key: Schema.String,
  status: Schema.String,
  title: Schema.String,
  description: Optional(Schema.String),
  source_url: Optional(Schema.String),
  resolved_at: Optional(Timestamp),
  alert_group_ids: Optional(Schema.Array(Schema.String)),
  tags: Optional(Schema.Array(Named)),
  attributes: Schema.Array(
    Schema.Struct({
      attribute: Named,
      value: Optional(AttributeValueSchema),
      array_value: Optional(Schema.Array(AttributeValueSchema)),
    }),
  ),
});

export type AlertObject = Schema.Schema.Type<typeof AlertObjectSchema>;

export const AlertNoteSchema = Schema.Struct({
  ...common("Alert note"),
  alert_id: Optional(Schema.String).pipe(field(10, "Alert.")),
  alert_group_id: Optional(Schema.String).pipe(field(11, "Alert group.")),
  content: Schema.String.pipe(field(12, "Note text.")),
  creator_user_id: Optional(Schema.String).pipe(field(13, "User who wrote it.")),
  last_edited_at: Optional(Timestamp).pipe(field(14, "Time it was last edited.")),
})
  .annotate({ description: "incident.io notes on alerts." })
  .pipe(Iceberg.identifier("id"));

export type AlertNote = Schema.Schema.Type<typeof AlertNoteSchema>;

export const AlertNoteObjectSchema = Schema.Struct({
  id: Schema.String,
  created_at: Timestamp,
  updated_at: Timestamp,
  alert_id: Optional(Schema.String),
  alert_group_id: Optional(Schema.String),
  content: Schema.String,
  creator: Schema.Struct({ user: Optional(Ref) }),
  last_edited_at: Optional(Timestamp),
});

export const AlertSourceSchema = Schema.Struct({
  ...fetched("Alert source"),
  name: Schema.String.pipe(field(10, "Alert source name.")),
  source_type: Schema.String.pipe(field(11, "Where alerts come from, such as datadog.")),
  auto_resolve_incident_alerts: Optional(Schema.Boolean).pipe(
    field(12, "Whether resolving an alert resolves it on the incident."),
  ),
  auto_resolve_timeout_minutes: Optional(Long).pipe(
    field(13, "Minutes before a quiet alert resolves."),
  ),
  fixed_team_id: Optional(Schema.String).pipe(field(14, "Team every alert goes to.")),
  owning_team_ids: list(101, Schema.String).pipe(field(15, "Teams that own it.")),
  template: Json.pipe(field(16, "How alerts are built from events, as JSON.")),
})
  .annotate({ description: "incident.io alert sources. The secret token isn't synced." })
  .pipe(Iceberg.identifier("id"));

export type AlertSource = Schema.Schema.Type<typeof AlertSourceSchema>;

export const AlertSourceObjectSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  source_type: Schema.String,
  auto_resolve_incident_alerts: Optional(Schema.Boolean),
  auto_resolve_timeout_minutes: Optional(Long),
  fixed_team_id: Optional(Schema.String),
  owning_team_ids: Optional(Schema.Array(Schema.String)),
  template: Json,
});

export const AlertRouteSchema = Schema.Struct({
  ...fetched("Alert route"),
  name: Schema.String.pipe(field(10, "Alert route name.")),
  enabled: Schema.Boolean.pipe(field(11, "Whether it's on.")),
})
  .annotate({ description: "incident.io alert routes." })
  .pipe(Iceberg.identifier("id"));

export type AlertRoute = Schema.Schema.Type<typeof AlertRouteSchema>;

export const AlertAttributeSchema = Schema.Struct({
  ...fetched("Alert attribute"),
  name: Schema.String.pipe(field(10, "Attribute name.")),
  type: Schema.String.pipe(field(11, "Value type, such as String or a catalog type.")),
  array: Schema.Boolean.pipe(field(12, "Whether it holds a list.")),
  required: Schema.Boolean.pipe(field(13, "Whether every alert needs it.")),
  emoji: Optional(Schema.String).pipe(field(14, "Emoji shown with it.")),
})
  .annotate({ description: "incident.io attributes that alerts can carry." })
  .pipe(Iceberg.identifier("id"));

export type AlertAttribute = Schema.Schema.Type<typeof AlertAttributeSchema>;

export const EscalationSchema = Schema.Struct({
  ...common("Escalation"),
  title: Schema.String.pipe(field(10, "Escalation title.")),
  description: Optional(Schema.String).pipe(field(11, "Escalation text.")),
  status: Schema.String.pipe(field(12, "Status, such as triggered or acked.")),
  priority_name: Optional(Schema.String).pipe(field(13, "Priority.")),
  escalation_path_id: Optional(Schema.String).pipe(field(14, "Escalation path.")),
  creator_user_id: Optional(Schema.String).pipe(field(15, "User who escalated.")),
  creator_workflow_id: Optional(Schema.String).pipe(field(16, "Workflow that escalated.")),
  creator_alert_id: Optional(Schema.String).pipe(field(17, "Alert that escalated.")),
  related_incident_ids: list(101, Schema.String).pipe(field(18, "Related incidents.")),
  related_alert_ids: list(102, Schema.String).pipe(field(19, "Related alerts.")),
  events: list(
    103,
    Schema.Struct({
      event_id: Schema.String.pipe(field(104, "Event.")),
      event: Schema.String.pipe(field(105, "What happened, such as notified_users.")),
      occurred_at: Timestamp.pipe(field(106, "Time it happened.")),
      urgency: Optional(Schema.String).pipe(field(107, "high or low.")),
      user_ids: list(109, Schema.String).pipe(field(108, "Users involved.")),
    }),
  ).pipe(field(20, "Escalation events.")),
})
  .annotate({ description: "incident.io escalations: pages sent to people on call." })
  .pipe(Iceberg.identifier("id"));

export type Escalation = Schema.Schema.Type<typeof EscalationSchema>;

export const EscalationObjectSchema = Schema.Struct({
  id: Schema.String,
  created_at: Timestamp,
  updated_at: Timestamp,
  title: Schema.String,
  description: Optional(Schema.String),
  status: Schema.String,
  priority: Optional(Schema.Struct({ name: Schema.String })),
  escalation_path_id: Optional(Schema.String),
  creator: Schema.Struct({
    user: Optional(Ref),
    workflow: Optional(Ref),
    alert: Optional(Ref),
  }),
  related_incidents: Schema.Array(Ref),
  related_alerts: Schema.Array(Ref),
  events: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      event: Schema.String,
      occurred_at: Timestamp,
      urgency: Optional(Schema.String),
      users: Optional(Schema.Array(Ref)),
    }),
  ),
});

export type EscalationObject = Schema.Schema.Type<typeof EscalationObjectSchema>;

export const EscalationPathSchema = Schema.Struct({
  ...fetched("Escalation path"),
  name: Schema.String.pipe(field(10, "Escalation path name.")),
  kind: Schema.String.pipe(field(11, "standalone or templated.")),
  team_ids: list(101, Schema.String).pipe(field(12, "Teams that own it.")),
  template_id: Optional(Schema.String).pipe(field(13, "Template it was made from.")),
  path: Json.pipe(field(14, "Levels and who they page, as JSON.")),
  working_hours: Schema.optional(Json).pipe(field(15, "Working hours, as JSON.")),
  repeat_config: Schema.optional(Json).pipe(field(16, "How the path repeats, as JSON.")),
})
  .annotate({ description: "incident.io escalation paths." })
  .pipe(Iceberg.identifier("id"));

export type EscalationPath = Schema.Schema.Type<typeof EscalationPathSchema>;

export const EscalationPathObjectSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  kind: Schema.String,
  team_ids: Schema.Array(Schema.String),
  template_id: Optional(Schema.String),
  path: Json,
  working_hours: Schema.optional(Json),
  repeat_config: Schema.optional(Json),
});

export const ScheduleSchema = Schema.Struct({
  ...common("Schedule"),
  _deleted: Schema.optional(Schema.Boolean).pipe(
    field(5, "Whether the schedule was deleted in incident.io."),
  ),
  name: Schema.String.pipe(field(10, "Schedule name.")),
  timezone: Schema.String.pipe(field(11, "Time zone, such as Europe/London.")),
  team_ids: list(101, Schema.String).pipe(field(12, "Teams that own it.")),
  permalink: Schema.String.pipe(field(13, "Link to the schedule in incident.io.")),
  config: Schema.optional(Json).pipe(field(14, "Rotations and layers, as JSON.")),
  holidays_public_config: Schema.optional(Json).pipe(
    field(15, "Public holiday settings, as JSON."),
  ),
  annotations: stringMap(102, 103).pipe(field(16, "Annotations by key.")),
})
  .annotate({ description: "incident.io on-call schedules." })
  .pipe(Iceberg.identifier("id"));

export type Schedule = Schema.Schema.Type<typeof ScheduleSchema>;

export const ScheduleObjectSchema = Schema.Struct({
  id: Schema.String,
  created_at: Timestamp,
  updated_at: Timestamp,
  name: Schema.String,
  timezone: Schema.String,
  team_ids: Schema.Array(Schema.String),
  permalink: Schema.String,
  config: Schema.optional(Json),
  holidays_public_config: Schema.optional(Json),
  annotations: Schema.Record(Schema.String, Schema.String),
});

export type ScheduleObject = Schema.Schema.Type<typeof ScheduleObjectSchema>;

export const ScheduleShiftSchema = Schema.Struct({
  id: Schema.String.pipe(
    field(1, "Schedule ID and shift fingerprint, or rotation, user, and start time without one."),
  ),
  version: fetchedVersion,
  schedule_id: Schema.String.pipe(field(10, "Schedule.")),
  rotation_id: Optional(Schema.String).pipe(field(11, "Rotation.")),
  user_id: Optional(Schema.String).pipe(field(12, "User on call.")),
  start_at: Timestamp.pipe(field(13, "Time the shift started.")),
  end_at: Timestamp.pipe(field(14, "Time the shift ended.")),
  entry_id: Optional(Schema.String).pipe(field(15, "Entry ID, when there is one.")),
  fingerprint: Optional(Schema.String).pipe(field(16, "Entry fingerprint.")),
})
  .annotate({ description: "incident.io shifts people were on call, with overrides applied." })
  .pipe(Iceberg.identifier("id"));

export type ScheduleShift = Schema.Schema.Type<typeof ScheduleShiftSchema>;

export const ScheduleEntryObjectSchema = Schema.Struct({
  start_at: Timestamp,
  end_at: Timestamp,
  rotation_id: Optional(Schema.String),
  user: Optional(Ref),
  entry_id: Optional(Schema.String),
  fingerprint: Optional(Schema.String),
});

export const ScheduleOverrideSchema = Schema.Struct({
  ...common("Schedule override"),
  schedule_id: Schema.String.pipe(field(10, "Schedule.")),
  rotation_id: Schema.String.pipe(field(11, "Rotation.")),
  layer_id: Schema.String.pipe(field(12, "Layer.")),
  user_id: Optional(Schema.String).pipe(field(13, "User covering.")),
  start_at: Timestamp.pipe(field(14, "Time the override starts.")),
  end_at: Timestamp.pipe(field(15, "Time the override ends.")),
})
  .annotate({ description: "incident.io overrides on schedules." })
  .pipe(Iceberg.identifier("id"));

export type ScheduleOverride = Schema.Schema.Type<typeof ScheduleOverrideSchema>;

export const ScheduleOverrideObjectSchema = Schema.Struct({
  id: Schema.String,
  created_at: Timestamp,
  updated_at: Timestamp,
  schedule_id: Schema.String,
  rotation_id: Schema.String,
  layer_id: Schema.String,
  user: Optional(Ref),
  start_at: Timestamp,
  end_at: Timestamp,
});

export const NotificationPauseSchema = Schema.Struct({
  ...common("Notification pause"),
  user_id: Schema.String.pipe(field(10, "User.")),
  starts_at: Timestamp.pipe(field(11, "Time the pause starts.")),
  ends_at: Timestamp.pipe(field(12, "Time the pause ends.")),
  reason: Optional(Schema.String).pipe(field(13, "Reason given.")),
})
  .annotate({ description: "incident.io times people paused on-call notifications." })
  .pipe(Iceberg.identifier("id"));

export type NotificationPause = Schema.Schema.Type<typeof NotificationPauseSchema>;

export const MaintenanceWindowSchema = Schema.Struct({
  ...common("Maintenance window"),
  name: Schema.String.pipe(field(10, "Maintenance window name.")),
  start_at: Timestamp.pipe(field(11, "Time it starts.")),
  end_at: Timestamp.pipe(field(12, "Time it ends.")),
  archived_at: Optional(Timestamp).pipe(field(13, "Time it was archived.")),
  incident_id: Optional(Schema.String).pipe(field(14, "Linked incident.")),
  lead_user_id: Optional(Schema.String).pipe(field(15, "User leading it.")),
  owning_team_ids: list(101, Schema.String).pipe(field(16, "Teams that own it.")),
  resolve_on_end: Schema.Boolean.pipe(field(17, "Whether alerts resolve when it ends.")),
  reroute_on_end: Schema.Boolean.pipe(field(18, "Whether alerts route again when it ends.")),
  show_in_sidebar: Schema.Boolean.pipe(field(19, "Whether the app shows it.")),
  notification_message: Optional(Schema.String).pipe(field(20, "Message sent about it.")),
  alert_condition_groups: Json.pipe(field(21, "Which alerts it holds back, as JSON.")),
})
  .annotate({ description: "incident.io maintenance windows that hold back alerts." })
  .pipe(Iceberg.identifier("id"));

export type MaintenanceWindow = Schema.Schema.Type<typeof MaintenanceWindowSchema>;

export const MaintenanceWindowObjectSchema = Schema.Struct({
  id: Schema.String,
  created_at: Timestamp,
  updated_at: Timestamp,
  name: Schema.String,
  start_at: Timestamp,
  end_at: Timestamp,
  archived_at: Optional(Timestamp),
  incident_id: Optional(Schema.String),
  lead: Schema.Struct({ user: Optional(Ref) }),
  owning_team_ids: Optional(Schema.Array(Schema.String)),
  resolve_on_end: Schema.Boolean,
  reroute_on_end: Schema.Boolean,
  show_in_sidebar: Schema.Boolean,
  notification_message: Optional(Schema.String),
  alert_condition_groups: Json,
});

export const AlertRouteObjectSchema = AlertRouteSchema.mapFields((fields) =>
  Struct.omit(fields, ["version"]),
);

export const AlertAttributeObjectSchema = AlertAttributeSchema.mapFields((fields) =>
  Struct.omit(fields, ["version"]),
);

export const NotificationPauseObjectSchema = NotificationPauseSchema.mapFields((fields) =>
  Struct.omit(fields, ["version"]),
);
