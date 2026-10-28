import type { Demo } from "@useairfoil/connector-kit";

import type { MaintenanceWindow } from "../schemas/on-call";
import type { StatusPage, StatusPageComponent, StatusPageMaintenance } from "../schemas/settings";

import {
  componentId,
  day,
  hour,
  json,
  serviceEntryId,
  services,
  sourceId,
  statusPageId,
  teamId,
  ulid,
  userId,
} from "./shared";

/** Maintenance windows and the public status page. */
export const statusPageTables = ({ now }: Demo.DemoContext) => {
  const maintenance: Array<MaintenanceWindow> = ["Database upgrade", "Load balancer migration"].map(
    (name, m) => {
      const start = new Date(now.getTime() + (m === 0 ? -20 : 5) * day);

      return {
        id: ulid("MWN", m),
        version: new Date(start.getTime() - 7 * day),
        created_at: new Date(start.getTime() - 7 * day),
        updated_at: new Date(start.getTime() - 7 * day),
        name,
        start_at: start,
        end_at: new Date(start.getTime() + 2 * hour),
        archived_at: null,
        incident_id: null,
        lead_user_id: userId(m),
        owning_team_ids: [teamId(0)],
        resolve_on_end: true,
        reroute_on_end: false,
        show_in_sidebar: true,
        notification_message: `${name} is in progress. Alerts are held back.`,
        alert_condition_groups: json([
          { conditions: [{ subject: "alert.source", operation: "is", param: sourceId(0) }] },
        ]),
      };
    },
  );

  const statusPages: Array<StatusPage> = [
    {
      id: statusPageId,
      version: now,
      name: "Acme Status",
      description: "Live status of Acme services",
      public_url: "https://status.acme.example.com",
    },
  ];

  const components: Array<StatusPageComponent> = services.slice(0, 5).map((name, c) => ({
    id: componentId(c),
    version: now,
    name,
    description: null,
    management_meta: json({ catalog_entry_id: serviceEntryId(c) }),
  }));

  const maintenances: Array<StatusPageMaintenance> = maintenance.map((window, m) => ({
    id: ulid("SPM", m),
    version: now,
    status_page_id: statusPageId,
    name: window.name,
    maintenance_status: window.end_at < now ? "maintenance_complete" : "maintenance_scheduled",
    published_at: window.created_at,
    automate_maintenance_status: true,
    component_maintenance_periods: json([
      { component_id: componentId(0), start_at: window.start_at, end_at: window.end_at },
    ]),
    updates: json([{ message: window.notification_message, published_at: window.created_at }]),
  }));

  return {
    maintenance_windows: maintenance,
    status_pages: statusPages,
    status_page_components: components,
    status_page_maintenances: maintenances,
  };
};
