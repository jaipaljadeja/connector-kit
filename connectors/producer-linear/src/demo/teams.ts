import type { Demo } from "@useairfoil/connector-kit";

import type { IssueLabel } from "../schemas/issues";
import type {
  Cycle,
  ExternalUser,
  Team,
  TeamMembership,
  User,
  WorkflowState,
} from "../schemas/teams";

import {
  cycleId,
  cyclesBack,
  cycleStart,
  cycleWeeks,
  day,
  issueLabels,
  labelId,
  nameFor,
  stamp,
  stateId,
  states,
  teamId,
  teams,
  userCount,
  userId,
  uuid,
  workspace,
} from "./shared";

/** Teams with their workflow states, users, labels, and cycles. */
export const teamTables = ({ faker, now }: Demo.DemoContext, founded: Date) => {
  const set = stamp(founded, founded);

  const teamRows: Array<Team> = teams.map((team, t) => ({
    id: teamId(t),
    ...set,
    name: team.name,
    key: team.key,
    display_name: team.name,
    description: null,
    visibility: "public",
    parent_id: null,
    timezone: "America/New_York",
    cycles_enabled: team.cycles,
    cycle_duration: cycleWeeks,
    cycle_cooldown_time: 0,
    cycle_start_day: 1,
    triage_enabled: team.triage,
    issue_estimation_type: team.key === "ENG" ? "fibonacci" : "notUsed",
    default_issue_estimate: team.key === "ENG" ? 1 : 0,
    auto_archive_period: 6,
    auto_close_period: 6,
    retired_at: null,
  }));

  const stateRows: Array<WorkflowState> = teams.flatMap((team, t) =>
    states
      .filter((state) => state.type !== "triage" || team.triage)
      .map((state, s) => ({
        id: stateId(t, states.indexOf(state)),
        ...set,
        name: state.name,
        type: state.type,
        color: state.color,
        description: null,
        position: s,
        team_id: teamId(t),
      })),
  );

  const users: Array<User> = Array.from({ length: userCount }, (_, u) => {
    const person = nameFor(faker);
    const joined = new Date(founded.getTime() + u * 20 * day);

    return {
      id: userId(u),
      ...stamp(joined, joined),
      _deleted: false,
      name: person.name,
      display_name: person.first.toLowerCase(),
      email: faker.internet
        .exampleEmail({ firstName: person.first, lastName: person.last })
        .toLowerCase(),
      avatar_url: null,
      title: faker.person.jobTitle(),
      timezone: faker.helpers.arrayElement(["America/New_York", "Europe/London", "Europe/Berlin"]),
      active: true,
      admin: u < 2,
      owner: u === 0,
      guest: false,
      app: false,
      last_seen: new Date(now.getTime() - faker.number.int({ min: 60_000, max: 3 * day })),
      url: `${workspace}/profiles/${person.first.toLowerCase()}`,
    };
  });

  // Each user is on one team; the first user of each team owns it.
  const memberships: Array<TeamMembership> = users.map((user, u) => ({
    id: uuid(13, u),
    ...stamp(user.created_at, user.created_at),
    team_id: teamId(u % teams.length),
    user_id: user.id,
    owner: u < teams.length,
  }));

  const externalUsers: Array<ExternalUser> = ["Slack", "Intercom", "Zendesk"].map((source, e) => {
    const person = nameFor(faker);

    return {
      id: uuid(14, e),
      ...set,
      name: person.name,
      display_name: `${person.name} (${source})`,
      email: faker.internet
        .exampleEmail({ firstName: person.first, lastName: person.last })
        .toLowerCase(),
      avatar_url: null,
      last_seen: new Date(now.getTime() - faker.number.int({ min: day, max: 30 * day })),
    };
  });

  const labelRows: Array<IssueLabel> = issueLabels.map((label, l) => ({
    id: labelId(l),
    ...set,
    _deleted: false,
    name: label.name,
    description: null,
    color: label.color,
    is_group: false,
    parent_id: null,
    team_id: null,
    creator_id: userId(0),
    retired_at: null,
  }));

  const cycles: Array<Cycle> = teams.flatMap((team, t) =>
    team.cycles
      ? Array.from({ length: cyclesBack + 1 }, (_, n) => {
          const starts = cycleStart(now, n);
          const ends = new Date(starts.getTime() + cycleWeeks * 7 * day);
          const done = ends <= now;

          return {
            id: cycleId(t, n),
            ...stamp(starts, done ? ends : now),
            _deleted: false,
            number: n + 1,
            name: null,
            description: null,
            team_id: teamId(t),
            starts_at: starts,
            ends_at: ends,
            completed_at: done ? ends : null,
            auto_archived_at: null,
            progress: done ? 1 : 0.4,
          };
        })
      : [],
  );

  return {
    teams: teamRows,
    workflow_states: stateRows,
    users,
    team_memberships: memberships,
    external_users: externalUsers,
    issue_labels: labelRows,
    cycles,
  };
};
