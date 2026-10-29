import type { Demo } from "@useairfoil/connector-kit";

import type { Document } from "../schemas/documents";
import type {
  Project,
  ProjectLabel,
  ProjectMilestone,
  ProjectRelation,
  ProjectStatus,
  ProjectUpdate,
} from "../schemas/projects";

import {
  dateOnly,
  day,
  milestoneId,
  priorities,
  projectId,
  projects,
  projectStatuses,
  stamp,
  teamId,
  teams,
  userCount,
  userId,
  uuid,
  workspace,
} from "./shared";

/** Projects with their milestones, updates, specs, and relations. */
export const projectTables = ({ faker, now }: Demo.DemoContext, founded: Date) => {
  const set = stamp(founded, founded);

  const statusRows: Array<ProjectStatus> = projectStatuses.map((status, s) => ({
    id: uuid(15, s),
    ...set,
    name: status.name,
    type: status.type,
    color: status.color,
    description: null,
    position: s,
  }));

  const projectLabels: Array<ProjectLabel> = ["Q1", "Q2", "Customer request", "Tech debt"].map(
    (name, l) => ({
      id: uuid(16, l),
      ...set,
      _deleted: false,
      name,
      description: null,
      color: faker.color.rgb({ casing: "upper" }),
      is_group: false,
      parent_id: null,
      creator_id: userId(1),
      retired_at: null,
    }),
  );

  const projectRows: Array<Project> = [];
  const milestones: Array<ProjectMilestone> = [];
  const updates: Array<ProjectUpdate> = [];
  const documents: Array<Document> = [];

  projects.forEach((name, p) => {
    const started = new Date(now.getTime() - (360 - p * 40) * day);
    const target = new Date(started.getTime() + 120 * day);
    const completed = target < now;
    const status = completed ? 4 : p % 3 === 2 ? 1 : 2;
    const lead = (p * 3) % userCount;

    const health = completed
      ? null
      : faker.helpers.arrayElement(["onTrack", "onTrack", "atRisk", "offTrack"]);

    const updated = completed ? target : now;
    const slug = name.toLowerCase().replaceAll(" ", "-");

    projectRows.push({
      id: projectId(p),
      ...stamp(started, updated),
      _deleted: false,
      name,
      description: `${name} for the ${teams[p % teams.length]?.name ?? "Engineering"} team`,
      content: `## Goal\n\nShip ${name.toLowerCase()} by ${dateOnly(target)}.`,
      url: `${workspace}/project/${slug}-${p.toString(16).padStart(12, "0")}`,
      icon: null,
      color: faker.color.rgb({ casing: "upper" }),
      status_id: uuid(15, status),
      priority: BigInt(1 + (p % 4)),
      priority_label: priorities[1 + (p % 4)] ?? "Medium",
      health,
      health_updated_at: health ? new Date(now.getTime() - 3 * day) : null,
      progress: completed ? 1 : faker.number.float({ min: 0.1, max: 0.8, fractionDigits: 2 }),
      scope: faker.number.int({ min: 20, max: 80 }),
      lead_id: userId(lead),
      creator_id: userId(lead),
      converted_from_issue_id: null,
      start_date: dateOnly(started),
      target_date: dateOnly(target),
      started_at: status === 1 ? null : started,
      completed_at: completed ? target : null,
      canceled_at: null,
      auto_archived_at: null,
      label_ids: [uuid(16, p % 4)],
      team_ids: [teamId(p % teams.length)],
      member_ids: [userId(lead), userId((lead + 1) % userCount)],
      trashed: false,
    });

    ["Alpha", "Beta", "GA"].forEach((stage, m) => {
      const milestoneTarget = new Date(started.getTime() + (m + 1) * 40 * day);

      milestones.push({
        id: milestoneId(p, m),
        ...stamp(started, started),
        name: stage,
        description: null,
        project_id: projectId(p),
        target_date: dateOnly(milestoneTarget),
        status:
          milestoneTarget <= now
            ? "done"
            : m === 0 || milestoneTarget.getTime() - now.getTime() < 40 * day
              ? "next"
              : "unstarted",
        progress: milestoneTarget <= now ? 1 : 0,
        sort_order: m,
      });
    });

    // A weekly update while the project runs.
    for (
      let week = started.getTime() + 7 * day;
      week <= Math.min(updated.getTime(), now.getTime());
      week += 7 * day
    ) {
      const posted = new Date(week);

      updates.push({
        id: uuid(17, p, updates.length),
        ...stamp(posted, posted),
        _deleted: false,
        project_id: projectId(p),
        user_id: userId(lead),
        body: faker.helpers.arrayElement([
          "Good week. The main flows are done and we're testing edge cases.",
          "We hit a snag with the migration. It may slip a few days.",
          "On track. Design review is done and we start the rollout next week.",
        ]),
        health: faker.helpers.arrayElement(["onTrack", "onTrack", "atRisk"]),
        url: `${workspace}/project/${slug}/updates#${updates.length}`,
        edited_at: null,
        comment_count: 0n,
      });
    }

    documents.push({
      id: uuid(18, p),
      ...stamp(started, started),
      _deleted: false,
      title: `${name} spec`,
      content: `# ${name}\n\n## Problem\n\nCustomers asked for this.\n\n## Plan\n\nShip it in three milestones.`,
      url: `${workspace}/document/${slug}-spec-${p.toString(16).padStart(12, "0")}`,
      icon: null,
      color: null,
      creator_id: userId(lead),
      updated_by_id: userId(lead),
      project_id: projectId(p),
      initiative_id: null,
      issue_id: null,
      cycle_id: null,
      team_id: null,
      parent_document_id: null,
      hidden_at: null,
      trashed: false,
    });
  });

  const projectRelations: Array<ProjectRelation> = [
    {
      id: uuid(19, 0),
      ...set,
      type: "dependency",
      project_id: projectId(4),
      project_milestone_id: null,
      anchor_type: "start",
      related_project_id: projectId(1),
      related_project_milestone_id: null,
      related_anchor_type: "end",
      user_id: userId(0),
    },
    {
      id: uuid(19, 1),
      ...set,
      type: "dependency",
      project_id: projectId(6),
      project_milestone_id: null,
      anchor_type: "start",
      related_project_id: projectId(3),
      related_project_milestone_id: null,
      related_anchor_type: "end",
      user_id: userId(1),
    },
  ];

  return {
    project_statuses: statusRows,
    project_labels: projectLabels,
    projects: projectRows,
    project_milestones: milestones,
    project_updates: updates,
    project_relations: projectRelations,
    documents,
  };
};
