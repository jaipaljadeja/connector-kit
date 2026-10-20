import { Iceberg } from "@useairfoil/connector-kit";
import { Schema } from "effect";

import {
  ActorSchema,
  ExternalIssueSchema,
  Optional,
  Ref,
  Timestamp,
  common,
  field,
  list,
} from "./shared";

export const PostmortemDocumentSchema = Schema.Struct({
  ...common("Post-mortem document"),
  incident_id: Schema.String.pipe(field(10, "Incident.")),
  title: Schema.String.pipe(field(11, "Document title.")),
  status: Schema.String.pipe(field(12, "in_progress, in_review, or completed.")),
  type: Schema.String.pipe(field(13, "in_app or external.")),
  document_url: Schema.String.pipe(field(14, "Document URL.")),
  exported_urls: list(101, Schema.String).pipe(field(15, "URLs of exported copies.")),
  editor_ids: list(102, Schema.String).pipe(field(16, "Users who edited it.")),
})
  .annotate({ description: "incident.io post-mortem documents, without their text." })
  .pipe(Iceberg.identifier("id"));

export type PostmortemDocument = Schema.Schema.Type<typeof PostmortemDocumentSchema>;

export const PostmortemDocumentObjectSchema = Schema.Struct({
  id: Schema.String,
  created_at: Timestamp,
  updated_at: Timestamp,
  incident_id: Schema.String,
  title: Schema.String,
  status: Schema.String,
  type: Schema.String,
  document_url: Schema.String,
  exported_urls: Schema.Array(Schema.String),
  editors: Schema.Array(Ref),
});

export type PostmortemDocumentObject = Schema.Schema.Type<typeof PostmortemDocumentObjectSchema>;

export const FollowUpSchema = Schema.Struct({
  ...common("Follow-up"),
  incident_id: Schema.String.pipe(field(10, "Incident.")),
  title: Schema.String.pipe(field(11, "Follow-up title.")),
  description: Optional(Schema.String).pipe(field(12, "Description in markdown.")),
  status: Schema.String.pipe(field(13, "outstanding, completed, deleted, or not_doing.")),
  assignee_id: Optional(Schema.String).pipe(field(14, "Assigned user.")),
  assignee_team_id: Optional(Schema.String).pipe(field(15, "Assigned team.")),
  category_id: Optional(Schema.String).pipe(field(16, "Category.")),
  category_name: Optional(Schema.String).pipe(field(17, "Category name.")),
  priority_id: Optional(Schema.String).pipe(field(18, "Priority.")),
  priority_name: Optional(Schema.String).pipe(field(19, "Priority name.")),
  labels: list(101, Schema.String).pipe(field(20, "Labels.")),
  completed_at: Optional(Timestamp).pipe(field(21, "Time it was completed.")),
  creator_user_id: Optional(Schema.String).pipe(field(22, "User who created it.")),
  external_issue_provider: Optional(Schema.String).pipe(field(23, "Linked issue tracker.")),
  external_issue_name: Optional(Schema.String).pipe(field(24, "Linked issue name.")),
  external_issue_permalink: Optional(Schema.String).pipe(field(25, "Linked issue URL.")),
})
  .annotate({ description: "incident.io follow-ups: work to do after an incident." })
  .pipe(Iceberg.identifier("id"));

export type FollowUp = Schema.Schema.Type<typeof FollowUpSchema>;

const NamedRef = Schema.Struct({ id: Schema.String, name: Schema.String });

export const FollowUpObjectSchema = Schema.Struct({
  id: Schema.String,
  created_at: Timestamp,
  updated_at: Timestamp,
  incident_id: Schema.String,
  title: Schema.String,
  description: Optional(Schema.String),
  status: Schema.String,
  assignee: Optional(Ref),
  assignee_team: Optional(Ref),
  category: Optional(NamedRef),
  priority: Optional(NamedRef),
  labels: Schema.Array(Schema.String),
  completed_at: Optional(Timestamp),
  creator: ActorSchema,
  external_issue_reference: Optional(ExternalIssueSchema),
});

export type FollowUpObject = Schema.Schema.Type<typeof FollowUpObjectSchema>;

export const ActionSchema = Schema.Struct({
  ...common("Action"),
  incident_id: Schema.String.pipe(field(10, "Incident.")),
  description: Schema.String.pipe(field(11, "What needs doing.")),
  status: Schema.String.pipe(field(12, "outstanding, completed, deleted, or not_doing.")),
  assignee_id: Optional(Schema.String).pipe(field(13, "Assigned user.")),
  completed_at: Optional(Timestamp).pipe(field(14, "Time it was completed.")),
  creator_user_id: Optional(Schema.String).pipe(field(15, "User who created it.")),
})
  .annotate({ description: "incident.io actions: work done during an incident." })
  .pipe(Iceberg.identifier("id"));

export type Action = Schema.Schema.Type<typeof ActionSchema>;

export const ActionObjectSchema = Schema.Struct({
  id: Schema.String,
  created_at: Timestamp,
  updated_at: Timestamp,
  incident_id: Schema.String,
  description: Schema.String,
  status: Schema.String,
  assignee: Optional(Ref),
  completed_at: Optional(Timestamp),
  creator: ActorSchema,
});

export type ActionObject = Schema.Schema.Type<typeof ActionObjectSchema>;
