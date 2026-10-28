import type { Demo } from "@useairfoil/connector-kit";

import type {
  AlertAttribute,
  AlertRoute,
  AlertSource,
  EscalationPath,
  NotificationPause,
  Schedule,
  ScheduleOverride,
  ScheduleShift,
} from "../schemas/on-call";

import {
  alertSources,
  app,
  day,
  json,
  pathId,
  routeId,
  scheduleId,
  sourceId,
  teamId,
  teams,
  ulid,
  userId,
} from "./shared";

/** Alert sources, routes, and escalation, with on-call schedules and shifts. */
export const alertingTables = ({ now }: Demo.DemoContext, setup: Date) => {
  const sources: Array<AlertSource> = alertSources.map((source, s) => ({
    id: sourceId(s),
    version: now,
    name: source.name,
    source_type: source.type,
    auto_resolve_incident_alerts: true,
    auto_resolve_timeout_minutes: 60n,
    fixed_team_id: null,
    owning_team_ids: [teamId(s % teams.length)],
    template: json({
      title: { literal: "{{ title }}" },
      description: { literal: "{{ message }}" },
    }),
  }));

  const routes: Array<AlertRoute> = ["Production alerts", "Low urgency"].map((name, r) => ({
    id: routeId(r),
    version: now,
    name,
    enabled: true,
  }));

  const attributes: Array<AlertAttribute> = [
    {
      id: ulid("AAT", 0),
      version: now,
      name: "Service",
      type: 'CatalogEntry["Service"]',
      array: false,
      required: true,
      emoji: "box",
    },
    {
      id: ulid("AAT", 1),
      version: now,
      name: "Environment",
      type: "String",
      array: false,
      required: false,
      emoji: null,
    },
  ];

  const paths: Array<EscalationPath> = teams.slice(0, 2).map((team, p) => ({
    id: pathId(p),
    version: now,
    name: `${team} on-call`,
    kind: "standalone",
    team_ids: [teamId(p)],
    template_id: null,
    path: json([
      {
        type: "level",
        level: { targets: [{ type: "schedule", id: scheduleId(p) }], time_to_ack_seconds: 300 },
      },
      {
        type: "level",
        level: { targets: [{ type: "user", id: userId(p) }], time_to_ack_seconds: 600 },
      },
    ]),
    working_hours: null,
    repeat_config: json({ repeat_times: 2 }),
  }));

  // Two weekly rotations, with the last eight weeks of shifts.
  const schedules: Array<Schedule> = teams.slice(0, 2).map((team, s) => ({
    id: scheduleId(s),
    version: setup,
    created_at: setup,
    updated_at: setup,
    name: `${team} primary`,
    timezone: "Europe/London",
    team_ids: [teamId(s)],
    permalink: `${app}/on-call/schedules/${scheduleId(s)}`,
    config: json({
      rotations: [
        {
          id: ulid("ROT", s),
          name: "Weekly",
          handover_interval: "P1W",
          users: [0, 1, 2, 3].map((k) => userId(s + k * teams.length)),
        },
      ],
    }),
    holidays_public_config: null,
    annotations: new Map(),
  }));

  const weekStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay() + 1, 9),
  );

  const shifts: Array<ScheduleShift> = schedules.flatMap((schedule, s) =>
    Array.from({ length: 8 }, (_, w) => {
      const start = new Date(weekStart.getTime() - (7 - w) * 7 * day);
      const user = userId(s + (w % 4) * teams.length);
      const fingerprint = `${s}-${w}-${start.getTime()}`;

      return {
        id: `${schedule.id}:${fingerprint}`,
        version: now,
        schedule_id: schedule.id,
        rotation_id: ulid("ROT", s),
        user_id: user,
        start_at: start,
        end_at: new Date(start.getTime() + 7 * day),
        entry_id: null,
        fingerprint,
      };
    }),
  );

  const overrides: Array<ScheduleOverride> = [0, 1].map((s) => {
    const start = new Date(weekStart.getTime() - (3 - s) * 7 * day + 2 * day);

    return {
      id: ulid("SOV", s),
      version: start,
      created_at: new Date(start.getTime() - 3 * day),
      updated_at: new Date(start.getTime() - 3 * day),
      schedule_id: scheduleId(s),
      rotation_id: ulid("ROT", s),
      layer_id: ulid("LAY", s),
      user_id: userId(8 + s),
      start_at: start,
      end_at: new Date(start.getTime() + day),
    };
  });

  const pauses: Array<NotificationPause> = [3, 5].map((u, k) => {
    const starts = new Date(now.getTime() + (k * 10 + 3) * day);

    return {
      id: ulid("NPS", k),
      version: new Date(now.getTime() - day),
      created_at: new Date(now.getTime() - day),
      updated_at: new Date(now.getTime() - day),
      user_id: userId(u),
      starts_at: starts,
      ends_at: new Date(starts.getTime() + 7 * day),
      reason: "Holiday",
    };
  });

  return {
    alert_sources: sources,
    alert_routes: routes,
    alert_attributes: attributes,
    escalation_paths: paths,
    schedules,
    schedule_shifts: shifts,
    schedule_overrides: overrides,
    on_call_notification_pauses: pauses,
  };
};
