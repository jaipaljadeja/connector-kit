import {
  type IncidentGroup,
  json,
  minute,
  severities,
  severityId,
  type StatusChange,
  statuses,
  statusId,
  ulid,
  userId,
} from "./shared";

/** Status changes, each with an update, a timeline item, and an activity log entry. */
export const updateRows = (incident: IncidentGroup): Array<StatusChange> => {
  const {
    faker,
    now,
    rows,
    index,
    id,
    name,
    severity,
    reported,
    fixed,
    resolved,
    finalStatus,
    lead,
    responders,
  } = incident;

  const changes: Array<StatusChange> = [
    { status: 1, at: reported, message: `We're looking into reports of ${name.toLowerCase()}.` },
  ];

  if (fixed || finalStatus === 2)
    changes.push({
      status: 2,
      at: faker.date.between({ from: reported, to: fixed ?? now }),
      message: "We found the cause and are rolling out a fix.",
    });

  if (fixed)
    changes.push({ status: 3, at: fixed, message: "The fix is live. We're watching error rates." });

  if (resolved)
    changes.push({
      status: finalStatus,
      at: resolved,
      message: "Error rates are back to normal. This incident is resolved.",
    });

  changes.forEach((change, c) => {
    const updater = c === 0 ? lead : faker.helpers.arrayElement([lead, ...responders]);
    const statusName = statuses[change.status]?.name ?? "Investigating";

    rows.incident_updates.push({
      id: ulid("IUP", index, c),
      version: change.at,
      created_at: change.at,
      incident_id: id,
      message: change.message,
      new_status_id: statusId(change.status),
      new_status_name: statusName,
      new_status_category: statuses[change.status]?.category ?? "live",
      new_severity_id: severityId(severity),
      new_severity_name: severities[severity]?.name ?? "Minor",
      merged_into_incident_id: null,
      updater_user_id: userId(updater),
      updater_api_key_id: null,
      updater_workflow_id: null,
    });

    rows.incident_activity_log_entries.push({
      id: ulid("ALE", index, c),
      version: change.at,
      created_at: change.at,
      incident_id: id,
      type: "status_change",
      title: `Status changed to ${statusName}`,
      occurred_at: change.at,
      content: json({
        from: c === 0 ? "Triage" : statuses[changes[c - 1]?.status ?? 1]?.name,
        to: statusName,
      }),
    });

    rows.incident_timeline_items.push({
      id: ulid("TLI", index, c),
      version: change.at,
      created_at: change.at,
      updated_at: change.at,
      incident_id: id,
      timestamp: change.at,
      title: statusName,
      description: change.message,
      activity_log_id: ulid("ALE", index, c),
      creator_user_id: userId(updater),
    });
  });

  return changes;
};

/** People who helped, and how long each spent. Returns who they are. */
export const participantRows = (incident: IncidentGroup): Array<number> => {
  const { faker, now, rows, id, reported, resolved, lead, responders } = incident;

  const helpers = [lead, ...responders];
  const end = resolved ?? now;

  helpers.forEach((u, h) => {
    const type =
      h === 0 ? "responder" : faker.helpers.arrayElement(["responder", "collaborator", "observer"]);

    rows.incident_participants.push({
      id: `${id}:${userId(u)}`,
      version: now,
      incident_id: id,
      user_id: userId(u),
      participant_type: type,
      active: type !== "observer",
    });

    const total = Math.round(
      ((end.getTime() - reported.getTime()) / minute) *
        (h === 0 ? 1 : faker.number.float({ min: 0.2, max: 0.8 })),
    );

    const late = Math.round(total * faker.number.float({ min: 0, max: 0.3, fractionDigits: 2 }));

    rows.incident_participant_workloads.push({
      id: `${id}:${userId(u)}:${type}`,
      version: now,
      incident_id: id,
      user_id: userId(u),
      participant_type: type,
      archived_at: null,
      minutes_total: total,
      minutes_working: total - late,
      minutes_late: late,
      minutes_sleeping: 0,
    });
  });

  return helpers;
};
