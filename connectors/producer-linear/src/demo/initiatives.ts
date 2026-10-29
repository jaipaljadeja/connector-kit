import type { Demo } from "@useairfoil/connector-kit";

import type {
  Initiative,
  InitiativeLabel,
  InitiativeRelation,
  InitiativeToProject,
  InitiativeUpdate,
} from "../schemas/initiatives";

import {
  dateOnly,
  day,
  initiativeId,
  projectId,
  projects,
  stamp,
  userId,
  uuid,
  workspace,
} from "./shared";

/** Initiatives with their labels, updates, relations, and projects. */
export const initiativeTables = ({ now }: Demo.DemoContext, founded: Date) => {
  const set = stamp(founded, founded);

  const initiatives = [
    "Enterprise readiness",
    "Self-serve growth",
    "Platform reliability",
  ] as const;

  const initiativeRows: Array<Initiative> = initiatives.map((name, i) => ({
    id: initiativeId(i),
    ...stamp(founded, now),
    _deleted: false,
    name,
    description: `${name} for this year`,
    content: null,
    url: `${workspace}/initiative/${name.toLowerCase().replaceAll(" ", "-")}`,
    icon: null,
    color: null,
    status: "Active",
    health: "onTrack",
    health_updated_at: new Date(now.getTime() - 7 * day),
    priority: BigInt(i + 1),
    owner_id: userId(i),
    creator_id: userId(0),
    parent_initiative_id: null,
    target_date: dateOnly(new Date(now.getTime() + 90 * day)),
    started_at: founded,
    completed_at: null,
    canceled_at: null,
    label_ids: [uuid(20, i % 2)],
    visibility: "workspace",
    trashed: false,
  }));

  const initiativeLabels: Array<InitiativeLabel> = ["Company goal", "Team goal"].map((name, l) => ({
    id: uuid(20, l),
    ...set,
    name,
    description: null,
    color: "#5E6AD2",
    is_group: false,
    parent_id: null,
    creator_id: userId(0),
    retired_at: null,
  }));

  const initiativeUpdates: Array<InitiativeUpdate> = initiatives.flatMap((_, i) =>
    Array.from({ length: 6 }, (_, k) => {
      const posted = new Date(now.getTime() - (6 - k) * 30 * day);

      return {
        id: uuid(21, i, k),
        ...stamp(posted, posted),
        _deleted: false,
        initiative_id: initiativeId(i),
        user_id: userId(i),
        body: "Monthly check-in: projects are moving and the main risks are covered.",
        health: "onTrack",
        url: `${workspace}/initiative/${i}/updates#${k}`,
        edited_at: null,
        comment_count: 0n,
      };
    }),
  );

  const initiativeRelations: Array<InitiativeRelation> = [
    {
      id: uuid(22, 0),
      ...set,
      initiative_id: initiativeId(0),
      related_initiative_id: initiativeId(2),
      sort_order: 0,
      user_id: userId(0),
    },
  ];

  const initiativeProjects: Array<InitiativeToProject> = projects.map((_, p) => ({
    id: uuid(23, p),
    ...set,
    initiative_id: initiativeId(p % initiatives.length),
    project_id: projectId(p),
    sort_order: String(p),
  }));

  return {
    initiatives: initiativeRows,
    initiative_labels: initiativeLabels,
    initiative_updates: initiativeUpdates,
    initiative_relations: initiativeRelations,
    initiative_to_projects: initiativeProjects,
  };
};
