import {
  alertSources,
  hour,
  type IncidentGroup,
  minute,
  pathId,
  routeId,
  serviceEntryId,
  sourceId,
  ulid,
  userId,
} from "./shared";

/** The alert that paged someone, and the escalation for serious incidents. */
export const alertRows = (incident: IncidentGroup) => {
  const {
    faker,
    now,
    later,
    rows,
    index,
    id,
    name,
    serviceName,
    service,
    team,
    severity,
    started,
    resolved,
    lead,
    alertId,
  } = incident;

  const source = faker.number.int({ max: alertSources.length - 1 });

  rows.alerts.push({
    id: alertId,
    version: resolved ?? started,
    created_at: started,
    updated_at: resolved ?? started,
    alert_source_id: sourceId(source),
    deduplication_key: `${serviceName.toLowerCase().replaceAll(" ", "-")}-${faker.string.hexadecimal({ length: 8, casing: "lower", prefix: "" })}`,
    status: resolved ? "resolved" : "firing",
    title: `[${serviceName}] ${name}`,
    description: `Monitor triggered for ${serviceName} in production.`,
    source_url: `https://monitoring.example.com/alerts/${index}`,
    resolved_at: resolved,
    alert_group_ids: [],
    tags: [{ tag_id: ulid("TAG", 0), name: "production" }],
    attributes: [
      {
        attribute_id: ulid("AAT", 0),
        attribute_name: "Service",
        label: serviceName,
        literal: null,
        catalog_entry_id: serviceEntryId(service),
      },
      {
        attribute_id: ulid("AAT", 1),
        attribute_name: "Environment",
        label: "production",
        literal: "production",
        catalog_entry_id: null,
      },
    ],
  });

  rows.incident_alerts.push({
    id: ulid("IAL", index),
    version: now,
    incident_id: id,
    alert_id: alertId,
    alert_route_id: routeId(severity < 2 ? 0 : 1),
  });

  if (faker.datatype.boolean({ probability: 0.3 })) {
    const noted = later(started, minute, hour);

    rows.alert_notes.push({
      id: ulid("ANT", index),
      version: noted,
      created_at: noted,
      updated_at: noted,
      alert_id: alertId,
      alert_group_id: null,
      content: "Same alert fired last week, see the previous incident.",
      creator_user_id: userId(lead),
      last_edited_at: null,
    });
  }

  // Critical and major alerts escalate to the on-call engineer.
  if (severity < 2) {
    const acked = later(started, minute, 10 * minute);

    rows.escalations.push({
      id: ulid("ESC", index),
      version: acked,
      created_at: started,
      updated_at: acked,
      title: `[${serviceName}] ${name}`,
      description: null,
      status: "acked",
      priority_name: severity === 0 ? "P1" : "P2",
      escalation_path_id: pathId(team % 2),
      creator_user_id: null,
      creator_workflow_id: null,
      creator_alert_id: alertId,
      related_incident_ids: [id],
      related_alert_ids: [alertId],
      events: [
        {
          event_id: ulid("EEV", index, 0),
          event: "notified_users",
          occurred_at: started,
          urgency: "high",
          user_ids: [userId(lead)],
        },
        {
          event_id: ulid("EEV", index, 1),
          event: "acked",
          occurred_at: acked,
          urgency: "high",
          user_ids: [userId(lead)],
        },
      ],
    });
  }
};
