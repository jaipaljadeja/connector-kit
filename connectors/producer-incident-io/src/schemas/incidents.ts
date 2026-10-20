import { Iceberg } from "@useairfoil/connector-kit";
import { Schema } from "effect";

import {
  ActorSchema,
  ExternalIssueSchema,
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
} from "./shared";

export const IncidentSchema = Schema.Struct({
  ...common("Incident"),
  reference: Schema.String.pipe(field(10, "Readable ID, such as INC-123.")),
  name: Schema.String.pipe(field(11, "Incident name.")),
  summary: Optional(Schema.String).pipe(field(12, "Summary in markdown.")),
  mode: Schema.String.pipe(field(13, "standard, retrospective, test, or tutorial.")),
  visibility: Schema.String.pipe(field(14, "public or private.")),
  status_id: Schema.String.pipe(field(15, "Incident status.")),
  status_name: Schema.String.pipe(field(16, "Status name.")),
  status_category: Schema.String.pipe(
    field(17, "Status category. The app shows live as Active and learning as Post-incident."),
  ),
  severity_id: Optional(Schema.String).pipe(field(18, "Severity.")),
  severity_name: Optional(Schema.String).pipe(field(19, "Severity name.")),
  severity_rank: Optional(Long).pipe(field(20, "Severity rank. Higher is more severe.")),
  incident_type_id: Optional(Schema.String).pipe(field(21, "Incident type.")),
  incident_type_name: Optional(Schema.String).pipe(field(22, "Incident type name.")),
  creator_user_id: Optional(Schema.String).pipe(field(23, "User who created the incident.")),
  creator_api_key_id: Optional(Schema.String).pipe(field(24, "API key that created it.")),
  creator_workflow_id: Optional(Schema.String).pipe(field(25, "Workflow that created it.")),
  creator_alert_id: Optional(Schema.String).pipe(field(26, "Alert that created it.")),
  last_activity_at: Timestamp.pipe(field(27, "Time of the last activity.")),
  team_ids: list(101, Schema.String).pipe(field(28, "Teams that own the incident.")),
  slack_team_id: Optional(Schema.String).pipe(field(29, "Slack workspace.")),
  slack_channel_id: Optional(Schema.String).pipe(
    field(30, "Slack channel. Can be empty while a new incident's channel is made."),
  ),
  slack_channel_name: Optional(Schema.String).pipe(field(31, "Slack channel name.")),
  slack_channel_url: Optional(Schema.String).pipe(field(32, "Slack channel URL.")),
  ms_teams_channel_url: Optional(Schema.String).pipe(field(33, "Microsoft Teams channel URL.")),
  call_url: Optional(Schema.String).pipe(field(34, "Call link.")),
  permalink: Optional(Schema.String).pipe(field(35, "Link to the incident in incident.io.")),
  external_issue_provider: Optional(Schema.String).pipe(field(36, "Linked issue tracker.")),
  external_issue_name: Optional(Schema.String).pipe(field(37, "Linked issue name.")),
  external_issue_permalink: Optional(Schema.String).pipe(field(38, "Linked issue URL.")),
  postmortem_document_ids: list(102, Schema.String).pipe(field(39, "Post-mortem documents.")),
  postmortem_document_url: Optional(Schema.String).pipe(field(40, "Post-mortem document URL.")),
  has_debrief: Optional(Schema.Boolean).pipe(field(41, "Whether a debrief is scheduled.")),
  role_assignments: list(
    103,
    Schema.Struct({
      role_id: Schema.String.pipe(field(104, "Incident role.")),
      role_name: Schema.String.pipe(field(105, "Role name.")),
      role_type: Schema.String.pipe(field(106, "lead, reporter, or custom.")),
      assignee_id: Optional(Schema.String).pipe(field(107, "Assigned user.")),
    }),
  ).pipe(field(42, "Incident roles and who holds them.")),
  custom_field_values: list(
    110,
    Schema.Struct({
      custom_field_id: Schema.String.pipe(field(111, "Custom field.")),
      custom_field_name: Schema.String.pipe(field(112, "Custom field name.")),
      field_type: Schema.String.pipe(field(113, "Field type, such as single_select.")),
      value_text: Optional(Schema.String).pipe(field(114, "Text value.")),
      value_numeric: Optional(Schema.String).pipe(field(115, "Number value, as text.")),
      value_link: Optional(Schema.String).pipe(field(116, "Link value.")),
      option_id: Optional(Schema.String).pipe(field(117, "Selected option.")),
      option_value: Optional(Schema.String).pipe(field(118, "Selected option text.")),
      catalog_entry_id: Optional(Schema.String).pipe(field(119, "Selected catalog entry.")),
      catalog_entry_name: Optional(Schema.String).pipe(field(120, "Catalog entry name.")),
    }),
  ).pipe(field(43, "Custom field values, one element per value.")),
  timestamps: list(
    130,
    Schema.Struct({
      timestamp_id: Schema.String.pipe(field(131, "Incident timestamp.")),
      name: Schema.String.pipe(field(132, "Timestamp name, such as Impact started.")),
      value: Optional(Timestamp).pipe(field(133, "Timestamp value.")),
    }),
  ).pipe(field(44, "Incident timestamps.")),
  duration_metrics: list(
    140,
    Schema.Struct({
      metric_id: Schema.String.pipe(field(141, "Duration metric.")),
      name: Schema.String.pipe(field(142, "Metric name.")),
      status: Schema.String.pipe(field(143, "success, or why there is no value.")),
      value_seconds: Optional(Long).pipe(field(144, "Duration in seconds.")),
    }),
  ).pipe(field(45, "Duration metrics.")),
  workload_minutes_total: Optional(Schema.Finite).pipe(field(46, "Minutes spent in total.")),
  workload_minutes_working: Optional(Schema.Finite).pipe(
    field(47, "Minutes spent in working hours."),
  ),
  workload_minutes_late: Optional(Schema.Finite).pipe(field(48, "Minutes spent in late hours.")),
  workload_minutes_sleeping: Optional(Schema.Finite).pipe(
    field(49, "Minutes spent in sleeping hours."),
  ),
})
  .annotate({ description: "incident.io incidents, in every mode." })
  .pipe(Iceberg.identifier("id"));

export type Incident = Schema.Schema.Type<typeof IncidentSchema>;

export const IncidentObjectSchema = Schema.Struct({
  id: Schema.String,
  created_at: Timestamp,
  updated_at: Timestamp,
  reference: Schema.String,
  name: Schema.String,
  summary: Optional(Schema.String),
  mode: Schema.String,
  visibility: Schema.String,
  incident_status: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    category: Schema.String,
  }),
  severity: Optional(Schema.Struct({ id: Schema.String, name: Schema.String, rank: Long })),
  incident_type: Optional(Named),
  creator: ActorSchema,
  last_activity_at: Timestamp,
  team_ids: Schema.Array(Schema.String),
  // Missing on Microsoft Teams, and while a new incident's channel is made.
  slack_team_id: Optional(Schema.String),
  slack_channel_id: Optional(Schema.String),
  slack_channel_name: Optional(Schema.String),
  slack_channel_url: Optional(Schema.String),
  ms_teams_channel_url: Optional(Schema.String),
  call_url: Optional(Schema.String),
  permalink: Optional(Schema.String),
  external_issue_reference: Optional(ExternalIssueSchema),
  postmortem_document_ids: Optional(Schema.Array(Schema.String)),
  postmortem_document_url: Optional(Schema.String),
  has_debrief: Optional(Schema.Boolean),
  incident_role_assignments: Schema.Array(
    Schema.Struct({
      role: Schema.Struct({ id: Schema.String, name: Schema.String, role_type: Schema.String }),
      assignee: Optional(Ref),
    }),
  ),
  custom_field_entries: Schema.Array(
    Schema.Struct({
      custom_field: Schema.Struct({
        id: Schema.String,
        name: Schema.String,
        field_type: Schema.String,
      }),
      values: Schema.Array(
        Schema.Struct({
          value_text: Optional(Schema.String),
          value_numeric: Optional(Schema.String),
          value_link: Optional(Schema.String),
          value_option: Optional(Schema.Struct({ id: Schema.String, value: Schema.String })),
          value_catalog_entry: Optional(Named),
        }),
      ),
    }),
  ),
  incident_timestamp_values: Optional(
    Schema.Array(
      Schema.Struct({
        incident_timestamp: Named,
        value: Optional(Schema.Struct({ value: Optional(Timestamp) })),
      }),
    ),
  ),
  duration_metrics: Optional(
    Schema.Array(
      Schema.Struct({
        duration_metric: Named,
        status: Schema.String,
        value_seconds: Optional(Long),
      }),
    ),
  ),
  workload_minutes_total: Optional(Schema.Finite),
  workload_minutes_working: Optional(Schema.Finite),
  workload_minutes_late: Optional(Schema.Finite),
  workload_minutes_sleeping: Optional(Schema.Finite),
});

export type IncidentObject = Schema.Schema.Type<typeof IncidentObjectSchema>;

export const IncidentUpdateSchema = Schema.Struct({
  id: Schema.String.pipe(field(1, "Incident update ID.")),
  version: Schema.Date.pipe(field(2, "Time the update was posted. Updates don't change.")),
  created_at: Timestamp.pipe(field(3, "Time the update was posted.")),
  incident_id: Schema.String.pipe(field(10, "Incident.")),
  message: Optional(Schema.String).pipe(field(11, "Update message.")),
  new_status_id: Schema.String.pipe(field(12, "Status after the update.")),
  new_status_name: Schema.String.pipe(field(13, "Status name.")),
  new_status_category: Schema.String.pipe(field(14, "Status category.")),
  new_severity_id: Optional(Schema.String).pipe(field(15, "Severity after the update.")),
  new_severity_name: Optional(Schema.String).pipe(field(16, "Severity name.")),
  merged_into_incident_id: Optional(Schema.String).pipe(
    field(17, "Incident this one was merged into."),
  ),
  updater_user_id: Optional(Schema.String).pipe(field(18, "User who posted the update.")),
  updater_api_key_id: Optional(Schema.String).pipe(field(19, "API key that posted it.")),
  updater_workflow_id: Optional(Schema.String).pipe(field(20, "Workflow that posted it.")),
})
  .annotate({ description: "incident.io status and severity updates posted on incidents." })
  .pipe(Iceberg.identifier("id"));

export type IncidentUpdate = Schema.Schema.Type<typeof IncidentUpdateSchema>;

export const IncidentUpdateObjectSchema = Schema.Struct({
  id: Schema.String,
  created_at: Timestamp,
  incident_id: Schema.String,
  message: Optional(Schema.String),
  new_incident_status: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    category: Schema.String,
  }),
  new_severity: Optional(Named),
  merged_into_incident_id: Optional(Schema.String),
  updater: ActorSchema,
});

export const TimelineItemSchema = Schema.Struct({
  ...common("Timeline item"),
  incident_id: Schema.String.pipe(field(10, "Incident, or the stream it came from.")),
  timestamp: Timestamp.pipe(field(11, "Time the item happened.")),
  title: Schema.String.pipe(field(12, "Item title.")),
  description: Optional(Schema.String).pipe(field(13, "Item text.")),
  activity_log_id: Optional(Schema.String).pipe(field(14, "Activity log entry it came from.")),
  creator_user_id: Optional(Schema.String).pipe(field(15, "User who added the item.")),
})
  .annotate({ description: "incident.io items on incident timelines." })
  .pipe(Iceberg.identifier("id"));

export type TimelineItem = Schema.Schema.Type<typeof TimelineItemSchema>;

export const TimelineItemObjectSchema = Schema.Struct({
  id: Schema.String,
  created_at: Timestamp,
  updated_at: Timestamp,
  incident_id: Schema.String,
  timestamp: Timestamp,
  title: Schema.String,
  description: Optional(Schema.String),
  activity_log_id: Optional(Schema.String),
  creator: ActorSchema,
});

export const ActivityLogEntrySchema = Schema.Struct({
  id: Schema.String.pipe(field(1, "Activity log entry ID.")),
  version: Schema.Date.pipe(field(2, "Time the entry was recorded. Entries don't change.")),
  created_at: Timestamp.pipe(field(3, "Time the entry was recorded.")),
  incident_id: Schema.String.pipe(field(10, "Incident, or the stream it came from.")),
  type: Schema.String.pipe(field(11, "Entry type, such as status_change.")),
  title: Schema.String.pipe(field(12, "Entry title.")),
  occurred_at: Timestamp.pipe(field(13, "Time the activity happened.")),
  content: Optional(Schema.String).pipe(field(14, "Details for the type, as JSON.")),
})
  .annotate({ description: "incident.io incident activity log entries, without chat messages." })
  .pipe(Iceberg.identifier("id"));

export type ActivityLogEntry = Schema.Schema.Type<typeof ActivityLogEntrySchema>;

export const ActivityLogEntryObjectSchema = Schema.Struct({
  id: Schema.String,
  created_at: Timestamp,
  incident_id: Schema.String,
  type: Schema.String,
  title: Schema.String,
  occurred_at: Timestamp,
  content: Schema.optional(Json),
});

export const ParticipantSchema = Schema.Struct({
  id: Schema.String.pipe(field(1, "Incident ID and user ID, joined by a colon.")),
  version: fetchedVersion,
  incident_id: Schema.String.pipe(field(10, "Incident.")),
  user_id: Schema.String.pipe(field(11, "User.")),
  participant_type: Schema.String.pipe(field(12, "responder, collaborator, or observer.")),
  active: Schema.Boolean.pipe(field(13, "Whether they're helping, not just watching.")),
})
  .annotate({ description: "incident.io people taking part in incidents." })
  .pipe(Iceberg.identifier("id"));

export type Participant = Schema.Schema.Type<typeof ParticipantSchema>;

const ParticipantObjectSchema = Schema.Struct({ user: Ref, participant_type: Schema.String });

export const ParticipantsObjectSchema = Schema.Struct({
  active: Schema.Array(ParticipantObjectSchema),
  passive: Schema.Array(ParticipantObjectSchema),
});

export const RelationshipSchema = Schema.Struct({
  id: Schema.String.pipe(field(1, "Incident ID and relationship ID, joined by a colon.")),
  version: fetchedVersion,
  relationship_id: Schema.String.pipe(field(10, "Relationship.")),
  incident_id: Schema.String.pipe(field(11, "Incident.")),
  related_incident_id: Schema.String.pipe(field(12, "Related incident.")),
  related_incident_name: Schema.String.pipe(field(13, "Related incident name.")),
  related_incident_number: Long.pipe(field(14, "Related incident number, as in INC-123.")),
})
  .annotate({ description: "incident.io links between related incidents, one row per side." })
  .pipe(Iceberg.identifier("id"));

export type Relationship = Schema.Schema.Type<typeof RelationshipSchema>;

export const RelationshipObjectSchema = Schema.Struct({
  id: Schema.String,
  incident: Schema.Struct({ id: Schema.String, name: Schema.String, external_id: Long }),
});

export const AttachmentSchema = Schema.Struct({
  ...fetched("Attachment"),
  incident_id: Schema.String.pipe(field(10, "Incident.")),
  resource_type: Schema.String.pipe(field(11, "Kind of resource, such as github_pull_request.")),
  external_id: Schema.String.pipe(field(12, "ID in the other system.")),
  title: Schema.String.pipe(field(13, "Resource title.")),
  permalink: Schema.String.pipe(field(14, "Resource URL.")),
})
  .annotate({ description: "incident.io external resources attached to incidents." })
  .pipe(Iceberg.identifier("id"));

export type Attachment = Schema.Schema.Type<typeof AttachmentSchema>;

export const AttachmentObjectSchema = Schema.Struct({
  id: Schema.String,
  incident_id: Schema.String,
  resource: Schema.Struct({
    resource_type: Schema.String,
    external_id: Schema.String,
    title: Schema.String,
    permalink: Schema.String,
  }),
});

export const IncidentAlertSchema = Schema.Struct({
  ...fetched("Incident alert link"),
  incident_id: Schema.String.pipe(field(10, "Incident.")),
  alert_id: Schema.String.pipe(field(11, "Alert.")),
  alert_route_id: Optional(Schema.String).pipe(field(12, "Alert route that linked them.")),
})
  .annotate({ description: "incident.io alerts attached to incidents." })
  .pipe(Iceberg.identifier("id"));

export type IncidentAlert = Schema.Schema.Type<typeof IncidentAlertSchema>;

export const IncidentAlertObjectSchema = Schema.Struct({
  id: Schema.String,
  incident: Ref,
  alert: Ref,
  alert_route_id: Optional(Schema.String),
});

export const CallSessionSchema = Schema.Struct({
  ...fetched("Call session"),
  incident_id: Schema.String.pipe(field(10, "Incident.")),
  started_at: Timestamp.pipe(field(11, "Time the call started.")),
  ended_at: Optional(Timestamp).pipe(field(12, "Time the call ended.")),
})
  .annotate({ description: "incident.io incident calls. Transcripts aren't synced." })
  .pipe(Iceberg.identifier("id"));

export type CallSession = Schema.Schema.Type<typeof CallSessionSchema>;

export const CallSessionObjectSchema = Schema.Struct({
  id: Schema.String,
  incident_id: Schema.String,
  started_at: Timestamp,
  ended_at: Optional(Timestamp),
});

export const ParticipantWorkloadSchema = Schema.Struct({
  id: Schema.String.pipe(field(1, "Incident ID, user ID, and participant type, joined by colons.")),
  version: fetchedVersion,
  incident_id: Schema.String.pipe(field(10, "Incident.")),
  user_id: Schema.String.pipe(field(11, "User.")),
  participant_type: Optional(Schema.String).pipe(
    field(12, "responder, collaborator, or observer."),
  ),
  archived_at: Optional(Timestamp).pipe(field(13, "Time the workload was archived.")),
  minutes_total: Schema.Finite.pipe(field(14, "Minutes spent on the incident.")),
  minutes_working: Schema.Finite.pipe(field(15, "Minutes in working hours.")),
  minutes_late: Schema.Finite.pipe(field(16, "Minutes in late hours.")),
  minutes_sleeping: Schema.Finite.pipe(field(17, "Minutes in sleeping hours.")),
})
  .annotate({ description: "incident.io time each person spent on incidents." })
  .pipe(Iceberg.identifier("id"));

export type ParticipantWorkload = Schema.Schema.Type<typeof ParticipantWorkloadSchema>;

export const ParticipantWorkloadObjectSchema = Schema.Struct({
  user: Ref,
  participant_type: Optional(Schema.String),
  archived_at: Optional(Timestamp),
  workload: Schema.Struct({
    minutes_spent_on_incident: Schema.Finite,
    minutes_spent_on_incident_in_working_hours: Schema.Finite,
    minutes_spent_on_incident_in_late_hours: Schema.Finite,
    minutes_spent_on_incident_in_sleeping_hours: Schema.Finite,
  }),
});
