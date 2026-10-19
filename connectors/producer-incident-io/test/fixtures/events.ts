// Example webhook bodies from incident.io's webhooks spec,
// https://docs.incident.io/openapi/webhooks.json. Generated, not hand-written.

export const webhookEvents = [
  {
    event_type: "private_alert.alert_created_v1",
    "private_alert.alert_created_v1": { id: "abc123" },
  },
  {
    event_type: "private_alert.alert_resolved_v1",
    "private_alert.alert_resolved_v1": { id: "abc123" },
  },
  {
    event_type: "private_escalation.escalation_created_v1",
    "private_escalation.escalation_created_v1": { id: "abc123" },
  },
  {
    event_type: "private_escalation.escalation_status_updated_v1",
    "private_escalation.escalation_status_updated_v1": { id: "abc123" },
  },
  {
    event_type: "private_incident.action_created_v1",
    "private_incident.action_created_v1": { id: "abc123" },
  },
  {
    event_type: "private_incident.action_updated_v1",
    "private_incident.action_updated_v1": { id: "abc123" },
  },
  {
    event_type: "private_incident.follow_up_created_v1",
    "private_incident.follow_up_created_v1": { id: "abc123" },
  },
  {
    event_type: "private_incident.follow_up_created_v2",
    "private_incident.follow_up_created_v2": { id: "abc123" },
  },
  {
    event_type: "private_incident.follow_up_updated_v1",
    "private_incident.follow_up_updated_v1": { id: "abc123" },
  },
  {
    event_type: "private_incident.follow_up_updated_v2",
    "private_incident.follow_up_updated_v2": { id: "abc123" },
  },
  {
    event_type: "private_incident.incident_created_v2",
    "private_incident.incident_created_v2": { id: "abc123" },
  },
  {
    event_type: "private_incident.incident_updated_v2",
    "private_incident.incident_updated_v2": { id: "abc123" },
  },
  {
    event_type: "private_incident.membership_granted_v1",
    "private_incident.membership_granted_v1": {
      actor_user_id: "abc123",
      incident_id: "abc123",
      user_id: "abc123",
    },
  },
  {
    event_type: "private_incident.membership_revoked_v1",
    "private_incident.membership_revoked_v1": {
      actor_user_id: "abc123",
      incident_id: "abc123",
      user_id: "abc123",
    },
  },
  {
    event_type: "private_incident.postmortem_document_status_updated_v1",
    "private_incident.postmortem_document_status_updated_v1": { id: "abc123" },
  },
  {
    event_type: "public_alert.alert_created_v1",
    "public_alert.alert_created_v1": {
      alert_group_ids: ["01GW2G3V0S59R238FAHPDS1R66"],
      alert_source_id: "01GW2G3V0S59R238FAHPDS1R66",
      attributes: [
        {
          array_value: [
            {
              catalog_entry: {
                catalog_type_id: "01FCNDV6P870EA6S7TK1DSYDG0",
                id: "01FCNDV6P870EA6S7TK1DSYDG0",
                name: "Primary On-call",
              },
              label: "Payments Team",
              literal: "SEV123",
            },
          ],
          attribute: {
            array: false,
            emoji: "fire",
            id: "01GW2G3V0S59R238FAHPDS1R66",
            name: "service",
            required: false,
            type: 'CatalogEntry["01GW2G3V0S59R238FAHPDS1R67"]',
          },
          value: {
            catalog_entry: {
              catalog_type_id: "01FCNDV6P870EA6S7TK1DSYDG0",
              id: "01FCNDV6P870EA6S7TK1DSYDG0",
              name: "Primary On-call",
            },
            label: "Payments Team",
            literal: "SEV123",
          },
        },
      ],
      created_at: "2021-08-17T13:28:57.801578Z",
      deduplication_key: "4293868629",
      description: "CPU on the payments service has exceeded 75 percent for 5 minutes",
      id: "01GW2G3V0S59R238FAHPDS1R66",
      resolved_at: "2021-08-17T14:28:57.801578Z",
      source_url: "https://www.my-alerting-platform.com/alerts/my-alert-123",
      status: "firing",
      tags: [{ id: "01GW2G3V0S59R238FAHPDS1R66", name: "noisy" }],
      title: "*errors.withMessage: PG::Error failed to connect",
      updated_at: "2021-08-17T13:28:57.801578Z",
    },
  },
  {
    event_type: "public_alert.alert_resolved_v1",
    "public_alert.alert_resolved_v1": {
      alert_group_ids: ["01GW2G3V0S59R238FAHPDS1R66"],
      alert_source_id: "01GW2G3V0S59R238FAHPDS1R66",
      attributes: [
        {
          array_value: [
            {
              catalog_entry: {
                catalog_type_id: "01FCNDV6P870EA6S7TK1DSYDG0",
                id: "01FCNDV6P870EA6S7TK1DSYDG0",
                name: "Primary On-call",
              },
              label: "Payments Team",
              literal: "SEV123",
            },
          ],
          attribute: {
            array: false,
            emoji: "fire",
            id: "01GW2G3V0S59R238FAHPDS1R66",
            name: "service",
            required: false,
            type: 'CatalogEntry["01GW2G3V0S59R238FAHPDS1R67"]',
          },
          value: {
            catalog_entry: {
              catalog_type_id: "01FCNDV6P870EA6S7TK1DSYDG0",
              id: "01FCNDV6P870EA6S7TK1DSYDG0",
              name: "Primary On-call",
            },
            label: "Payments Team",
            literal: "SEV123",
          },
        },
      ],
      created_at: "2021-08-17T13:28:57.801578Z",
      deduplication_key: "4293868629",
      description: "CPU on the payments service has exceeded 75 percent for 5 minutes",
      id: "01GW2G3V0S59R238FAHPDS1R66",
      resolved_at: "2021-08-17T14:28:57.801578Z",
      source_url: "https://www.my-alerting-platform.com/alerts/my-alert-123",
      status: "firing",
      tags: [{ id: "01GW2G3V0S59R238FAHPDS1R66", name: "noisy" }],
      title: "*errors.withMessage: PG::Error failed to connect",
      updated_at: "2021-08-17T13:28:57.801578Z",
    },
  },
  {
    event_type: "public_escalation.escalation_created_v1",
    "public_escalation.escalation_created_v1": {
      created_at: "2021-08-17T13:28:57.801578Z",
      creator: {
        alert: {
          id: "01GW2G3V0S59R238FAHPDS1R66",
          title: "*errors.withMessage: PG::Error failed to connect",
        },
        user: {
          email: "lisa@incident.io",
          id: "01FCNDV6P870EA6S7TK1DSYDG0",
          name: "Lisa Karlin Curtis",
          role: "owner",
          slack_user_id: "U02AYNF2XJM",
        },
        workflow: { id: "01FCNDV6P870EA6S7TK1DSYDG0", name: "My little workflow" },
      },
      description: "Database CPU has been above 90% for 5 minutes",
      escalation_path_id: "01G0J1EXE7AXZ2C93K61WBPYEH",
      events: [
        {
          channels: [
            {
              microsoft_teams_channel_id: "abc123",
              microsoft_teams_team_id: "abc123",
              slack_channel_id: "abc123",
              slack_team_id: "abc123",
            },
          ],
          event: "entered_grace_period",
          id: "01G0J1EXE7AXZ2C93K61WBPYEH",
          occurred_at: "2021-08-17T13:28:57.801578Z",
          urgency: "high",
          users: [
            {
              email: "lisa@incident.io",
              id: "01FCNDV6P870EA6S7TK1DSYDG0",
              name: "Lisa Karlin Curtis",
              role: "owner",
              slack_user_id: "U02AYNF2XJM",
            },
          ],
        },
      ],
      id: "01G0J1EXE7AXZ2C93K61WBPYEH",
      priority: { name: "P1" },
      related_alerts: [
        {
          alert_group_ids: ["01GW2G3V0S59R238FAHPDS1R66"],
          alert_source_id: "01GW2G3V0S59R238FAHPDS1R66",
          created_at: "2021-08-17T13:28:57.801578Z",
          deduplication_key: "4293868629",
          description: "CPU on the payments service has exceeded 75 percent for 5 minutes",
          id: "01GW2G3V0S59R238FAHPDS1R66",
          resolved_at: "2021-08-17T14:28:57.801578Z",
          source_url: "https://www.my-alerting-platform.com/alerts/my-alert-123",
          status: "firing",
          title: "*errors.withMessage: PG::Error failed to connect",
          updated_at: "2021-08-17T13:28:57.801578Z",
        },
      ],
      related_incidents: [
        {
          external_id: 123,
          id: "01FDAG4SAP5TYPT98WGR2N7W91",
          name: "Our database is sad",
          reference: "INC-123",
          status_category: "triage",
          summary: "Our database is really really sad, and we don't know why yet.",
          visibility: "public",
        },
      ],
      status: "pending",
      title: "Database CPU is high",
      updated_at: "2021-08-17T13:28:57.801578Z",
    },
  },
  {
    event_type: "public_escalation.escalation_status_updated_v1",
    "public_escalation.escalation_status_updated_v1": {
      actor: {
        alert: {
          id: "01GW2G3V0S59R238FAHPDS1R66",
          title: "*errors.withMessage: PG::Error failed to connect",
        },
        api_key: { id: "01FCNDV6P870EA6S7TK1DSYDG0", name: "My test API key" },
        user: {
          email: "lisa@incident.io",
          id: "01FCNDV6P870EA6S7TK1DSYDG0",
          name: "Lisa Karlin Curtis",
          role: "owner",
          slack_user_id: "U02AYNF2XJM",
        },
        workflow: { id: "01FCNDV6P870EA6S7TK1DSYDG0", name: "My little workflow" },
      },
      escalation: {
        created_at: "2021-08-17T13:28:57.801578Z",
        creator: {
          alert: {
            id: "01GW2G3V0S59R238FAHPDS1R66",
            title: "*errors.withMessage: PG::Error failed to connect",
          },
          user: {
            email: "lisa@incident.io",
            id: "01FCNDV6P870EA6S7TK1DSYDG0",
            name: "Lisa Karlin Curtis",
            role: "owner",
            slack_user_id: "U02AYNF2XJM",
          },
          workflow: { id: "01FCNDV6P870EA6S7TK1DSYDG0", name: "My little workflow" },
        },
        description: "Database CPU has been above 90% for 5 minutes",
        escalation_path_id: "01G0J1EXE7AXZ2C93K61WBPYEH",
        events: [
          {
            channels: [
              {
                microsoft_teams_channel_id: "abc123",
                microsoft_teams_team_id: "abc123",
                slack_channel_id: "abc123",
                slack_team_id: "abc123",
              },
            ],
            event: "entered_grace_period",
            id: "01G0J1EXE7AXZ2C93K61WBPYEH",
            occurred_at: "2021-08-17T13:28:57.801578Z",
            urgency: "high",
            users: [
              {
                email: "lisa@incident.io",
                id: "01FCNDV6P870EA6S7TK1DSYDG0",
                name: "Lisa Karlin Curtis",
                role: "owner",
                slack_user_id: "U02AYNF2XJM",
              },
            ],
          },
        ],
        id: "01G0J1EXE7AXZ2C93K61WBPYEH",
        priority: { name: "P1" },
        related_alerts: [
          {
            alert_group_ids: ["01GW2G3V0S59R238FAHPDS1R66"],
            alert_source_id: "01GW2G3V0S59R238FAHPDS1R66",
            created_at: "2021-08-17T13:28:57.801578Z",
            deduplication_key: "4293868629",
            description: "CPU on the payments service has exceeded 75 percent for 5 minutes",
            id: "01GW2G3V0S59R238FAHPDS1R66",
            resolved_at: "2021-08-17T14:28:57.801578Z",
            source_url: "https://www.my-alerting-platform.com/alerts/my-alert-123",
            status: "firing",
            title: "*errors.withMessage: PG::Error failed to connect",
            updated_at: "2021-08-17T13:28:57.801578Z",
          },
        ],
        related_incidents: [
          {
            external_id: 123,
            id: "01FDAG4SAP5TYPT98WGR2N7W91",
            name: "Our database is sad",
            reference: "INC-123",
            status_category: "triage",
            summary: "Our database is really really sad, and we don't know why yet.",
            visibility: "public",
          },
        ],
        status: "pending",
        title: "Database CPU is high",
        updated_at: "2021-08-17T13:28:57.801578Z",
      },
      new_status: "pending",
      previous_status: "pending",
    },
  },
  {
    event_type: "public_incident.action_created_v1",
    "public_incident.action_created_v1": {
      assignee: {
        email: "lisa@incident.io",
        id: "01FCNDV6P870EA6S7TK1DSYDG0",
        name: "Lisa Karlin Curtis",
        role: "viewer",
        slack_user_id: "U02AYNF2XJM",
      },
      completed_at: "2021-08-17T13:28:57.801578Z",
      created_at: "2021-08-17T13:28:57.801578Z",
      description: "Call the fire brigade",
      external_issue_reference: {
        issue_name: "INC-123",
        issue_permalink:
          "https://linear.app/incident-io/issue/INC-1609/find-copywriter-to-write-up",
        provider: "asana",
      },
      follow_up: true,
      id: "01FCNDV6P870EA6S7TK1DSYDG0",
      incident_id: "01FCNDV6P870EA6S7TK1DSYDG0",
      status: "outstanding",
      updated_at: "2021-08-17T13:28:57.801578Z",
    },
  },
  {
    event_type: "public_incident.action_updated_v1",
    "public_incident.action_updated_v1": {
      assignee: {
        email: "lisa@incident.io",
        id: "01FCNDV6P870EA6S7TK1DSYDG0",
        name: "Lisa Karlin Curtis",
        role: "viewer",
        slack_user_id: "U02AYNF2XJM",
      },
      completed_at: "2021-08-17T13:28:57.801578Z",
      created_at: "2021-08-17T13:28:57.801578Z",
      description: "Call the fire brigade",
      external_issue_reference: {
        issue_name: "INC-123",
        issue_permalink:
          "https://linear.app/incident-io/issue/INC-1609/find-copywriter-to-write-up",
        provider: "asana",
      },
      follow_up: true,
      id: "01FCNDV6P870EA6S7TK1DSYDG0",
      incident_id: "01FCNDV6P870EA6S7TK1DSYDG0",
      status: "outstanding",
      updated_at: "2021-08-17T13:28:57.801578Z",
    },
  },
  {
    event_type: "public_incident.follow_up_created_v1",
    "public_incident.follow_up_created_v1": {
      assignee: {
        email: "lisa@incident.io",
        id: "01FCNDV6P870EA6S7TK1DSYDG0",
        name: "Lisa Karlin Curtis",
        role: "viewer",
        slack_user_id: "U02AYNF2XJM",
      },
      completed_at: "2021-08-17T13:28:57.801578Z",
      created_at: "2021-08-17T13:28:57.801578Z",
      description: "Call the fire brigade",
      external_issue_reference: {
        issue_name: "INC-123",
        issue_permalink:
          "https://linear.app/incident-io/issue/INC-1609/find-copywriter-to-write-up",
        provider: "asana",
      },
      follow_up: true,
      id: "01FCNDV6P870EA6S7TK1DSYDG0",
      incident_id: "01FCNDV6P870EA6S7TK1DSYDG0",
      status: "outstanding",
      updated_at: "2021-08-17T13:28:57.801578Z",
    },
  },
  {
    event_type: "public_incident.follow_up_created_v2",
    "public_incident.follow_up_created_v2": {
      assignee: {
        email: "lisa@incident.io",
        id: "01FCNDV6P870EA6S7TK1DSYDG0",
        name: "Lisa Karlin Curtis",
        role: "owner",
        slack_user_id: "U02AYNF2XJM",
      },
      assignee_team: { id: "abc123", name: "abc123" },
      completed_at: "2021-08-17T13:28:57.801578Z",
      created_at: "2021-08-17T13:28:57.801578Z",
      creator: {
        alert: {
          id: "01GW2G3V0S59R238FAHPDS1R66",
          title: "*errors.withMessage: PG::Error failed to connect",
        },
        api_key: { id: "01FCNDV6P870EA6S7TK1DSYDG0", name: "My test API key" },
        user: {
          email: "lisa@incident.io",
          id: "01FCNDV6P870EA6S7TK1DSYDG0",
          name: "Lisa Karlin Curtis",
          role: "owner",
          slack_user_id: "U02AYNF2XJM",
        },
        workflow: { id: "01FCNDV6P870EA6S7TK1DSYDG0", name: "My little workflow" },
      },
      description: "Call the fire brigade",
      external_issue_reference: {
        issue_name: "INC-123",
        issue_permalink:
          "https://linear.app/incident-io/issue/INC-1609/find-copywriter-to-write-up",
        provider: "asana",
      },
      id: "01FCNDV6P870EA6S7TK1DSYDG0",
      incident_id: "01FCNDV6P870EA6S7TK1DSYDG0",
      labels: ["bug", "urgent"],
      priority: {
        description: "A follow-up that requires immediate attention.",
        id: "01GNW4BAQ7XRMFF6FHKNXDFPRW",
        name: "Urgent",
        rank: 10,
      },
      status: "outstanding",
      title: "Cat is stuck in the tree",
      updated_at: "2021-08-17T13:28:57.801578Z",
    },
  },
  {
    event_type: "public_incident.follow_up_updated_v1",
    "public_incident.follow_up_updated_v1": {
      assignee: {
        email: "lisa@incident.io",
        id: "01FCNDV6P870EA6S7TK1DSYDG0",
        name: "Lisa Karlin Curtis",
        role: "viewer",
        slack_user_id: "U02AYNF2XJM",
      },
      completed_at: "2021-08-17T13:28:57.801578Z",
      created_at: "2021-08-17T13:28:57.801578Z",
      description: "Call the fire brigade",
      external_issue_reference: {
        issue_name: "INC-123",
        issue_permalink:
          "https://linear.app/incident-io/issue/INC-1609/find-copywriter-to-write-up",
        provider: "asana",
      },
      follow_up: true,
      id: "01FCNDV6P870EA6S7TK1DSYDG0",
      incident_id: "01FCNDV6P870EA6S7TK1DSYDG0",
      status: "outstanding",
      updated_at: "2021-08-17T13:28:57.801578Z",
    },
  },
  {
    event_type: "public_incident.follow_up_updated_v2",
    "public_incident.follow_up_updated_v2": {
      assignee: {
        email: "lisa@incident.io",
        id: "01FCNDV6P870EA6S7TK1DSYDG0",
        name: "Lisa Karlin Curtis",
        role: "owner",
        slack_user_id: "U02AYNF2XJM",
      },
      assignee_team: { id: "abc123", name: "abc123" },
      completed_at: "2021-08-17T13:28:57.801578Z",
      created_at: "2021-08-17T13:28:57.801578Z",
      creator: {
        alert: {
          id: "01GW2G3V0S59R238FAHPDS1R66",
          title: "*errors.withMessage: PG::Error failed to connect",
        },
        api_key: { id: "01FCNDV6P870EA6S7TK1DSYDG0", name: "My test API key" },
        user: {
          email: "lisa@incident.io",
          id: "01FCNDV6P870EA6S7TK1DSYDG0",
          name: "Lisa Karlin Curtis",
          role: "owner",
          slack_user_id: "U02AYNF2XJM",
        },
        workflow: { id: "01FCNDV6P870EA6S7TK1DSYDG0", name: "My little workflow" },
      },
      description: "Call the fire brigade",
      external_issue_reference: {
        issue_name: "INC-123",
        issue_permalink:
          "https://linear.app/incident-io/issue/INC-1609/find-copywriter-to-write-up",
        provider: "asana",
      },
      id: "01FCNDV6P870EA6S7TK1DSYDG0",
      incident_id: "01FCNDV6P870EA6S7TK1DSYDG0",
      labels: ["bug", "urgent"],
      priority: {
        description: "A follow-up that requires immediate attention.",
        id: "01GNW4BAQ7XRMFF6FHKNXDFPRW",
        name: "Urgent",
        rank: 10,
      },
      status: "outstanding",
      title: "Cat is stuck in the tree",
      updated_at: "2021-08-17T13:28:57.801578Z",
    },
  },
  {
    event_type: "public_incident.incident_created_v2",
    "public_incident.incident_created_v2": {
      call_url: "https://zoom.us/foo",
      created_at: "2021-08-17T13:28:57.801578Z",
      creator: {
        alert: {
          id: "01GW2G3V0S59R238FAHPDS1R66",
          title: "*errors.withMessage: PG::Error failed to connect",
        },
        api_key: { id: "01FCNDV6P870EA6S7TK1DSYDG0", name: "My test API key" },
        user: {
          email: "lisa@incident.io",
          id: "01FCNDV6P870EA6S7TK1DSYDG0",
          name: "Lisa Karlin Curtis",
          role: "owner",
          slack_user_id: "U02AYNF2XJM",
        },
        workflow: { id: "01FCNDV6P870EA6S7TK1DSYDG0", name: "My little workflow" },
      },
      custom_field_entries: [
        {
          custom_field: {
            description: "Which team is impacted by this issue",
            field_type: "single_select",
            id: "01FCNDV6P870EA6S7TK1DSYDG0",
            name: "Affected Team",
            options: [
              {
                custom_field_id: "01FCNDV6P870EA6S7TK1DSYDG0",
                id: "01FCNDV6P870EA6S7TK1DSYDG0",
                sort_key: 10,
                value: "Product",
              },
            ],
          },
          values: [
            {
              value_catalog_entry: {
                aliases: ["lawrence@incident.io", "lawrence"],
                external_id: "761722cd-d1d7-477b-ac7e-90f9e079dc33",
                id: "01FCNDV6P870EA6S7TK1DSYDG0",
                name: "Primary On-call",
              },
              value_link: "https://google.com/",
              value_numeric: "123.456",
              value_option: {
                custom_field_id: "01FCNDV6P870EA6S7TK1DSYDG0",
                id: "01FCNDV6P870EA6S7TK1DSYDG0",
                sort_key: 10,
                value: "Product",
              },
              value_text: "This is my text field, I hope you like it",
            },
          ],
        },
      ],
      debriefs: [
        {
          end_at: "2021-08-17T14:28:57.801578Z",
          id: "01G0J1EXE7AXZ2C93K61WBPYEH",
          start_at: "2021-08-17T13:28:57.801578Z",
        },
      ],
      duration_metrics: [
        {
          duration_metric: { id: "01FCNDV6P870EA6S7TK1DSYD5H", name: "Lasted" },
          status: "success",
          value_seconds: 10800,
        },
      ],
      external_issue_reference: {
        issue_name: "INC-123",
        issue_permalink:
          "https://linear.app/incident-io/issue/INC-1609/find-copywriter-to-write-up",
        provider: "asana",
      },
      has_debrief: false,
      id: "01FDAG4SAP5TYPT98WGR2N7W91",
      incident_role_assignments: [
        {
          assignee: {
            email: "lisa@incident.io",
            id: "01FCNDV6P870EA6S7TK1DSYDG0",
            name: "Lisa Karlin Curtis",
            role: "owner",
            slack_user_id: "U02AYNF2XJM",
          },
          role: {
            created_at: "2021-08-17T13:28:57.801578Z",
            description: "The person currently coordinating the incident",
            id: "01FCNDV6P870EA6S7TK1DSYDG0",
            instructions:
              "Take point on the incident; Make sure people are clear on responsibilities",
            name: "Incident Lead",
            required: false,
            role_type: "lead",
            shortform: "lead",
            updated_at: "2021-08-17T13:28:57.801578Z",
          },
        },
      ],
      incident_status: {
        category: "triage",
        created_at: "2021-08-17T13:28:57.801578Z",
        description:
          "Impact has been **fully mitigated**, and we're ready to learn from this incident.",
        id: "01FCNDV6P870EA6S7TK1DSYD5H",
        name: "Closed",
        rank: 4,
        updated_at: "2021-08-17T13:28:57.801578Z",
      },
      incident_timestamp_values: [
        {
          incident_timestamp: { id: "01FCNDV6P870EA6S7TK1DSYD5H", name: "Impact started", rank: 1 },
          value: { value: "2021-08-17T13:28:57.801578Z" },
        },
      ],
      incident_type: {
        create_in_triage: "always",
        created_at: "2021-08-17T13:28:57.801578Z",
        description: "Customer facing production outages",
        id: "01FCNDV6P870EA6S7TK1DSYDG0",
        is_default: false,
        name: "Production Outage",
        private_incidents_only: false,
        updated_at: "2021-08-17T13:28:57.801578Z",
      },
      last_activity_at: "2021-08-17T13:28:57.801578Z",
      mode: "standard",
      most_recent_update_message: "We're working on a fix, hoping to ship in the next 30 minutes",
      ms_teams_channel_url:
        "https://teams.microsoft.com/l/channel/19%some-hex%40thread.tacv2/inc-123-title?groupId=some-uuid&tenantId=another-uuid",
      name: "Our database is sad",
      permalink: "https://app.incident.io/incidents/123",
      postmortem_document_ids: ["01FCNDV6P870EA6S7TK1DSYD5H"],
      postmortem_document_url: "https://docs.google.com/my_doc_id",
      reference: "INC-123",
      related_incidents: ["INC-237"],
      severity: {
        created_at: "2021-08-17T13:28:57.801578Z",
        description: "Issues with **low impact**.",
        id: "01FCNDV6P870EA6S7TK1DSYDG0",
        name: "Minor",
        rank: 1,
        updated_at: "2021-08-17T13:28:57.801578Z",
      },
      slack_channel_id: "C02AW36C1M5",
      slack_channel_name: "inc-165-green-parrot",
      slack_channel_url: "https://slack.com/app_redirect?team=T1234&channel=C5678",
      slack_team_id: "T02A1FSLE8J",
      summary: "Our database is really really sad, and we don't know why yet.",
      team_ids: ["01JPQA75EPNEES4479P16P4XAB"],
      updated_at: "2021-08-17T13:28:57.801578Z",
      visibility: "public",
      workload_minutes_late: 40.7,
      workload_minutes_sleeping: 0,
      workload_minutes_total: 60.7,
      workload_minutes_working: 20,
    },
  },
  {
    event_type: "public_incident.incident_status_updated_v2",
    "public_incident.incident_status_updated_v2": {
      incident: {
        call_url: "https://zoom.us/foo",
        created_at: "2021-08-17T13:28:57.801578Z",
        creator: {
          alert: {
            id: "01GW2G3V0S59R238FAHPDS1R66",
            title: "*errors.withMessage: PG::Error failed to connect",
          },
          api_key: { id: "01FCNDV6P870EA6S7TK1DSYDG0", name: "My test API key" },
          user: {
            email: "lisa@incident.io",
            id: "01FCNDV6P870EA6S7TK1DSYDG0",
            name: "Lisa Karlin Curtis",
            role: "owner",
            slack_user_id: "U02AYNF2XJM",
          },
          workflow: { id: "01FCNDV6P870EA6S7TK1DSYDG0", name: "My little workflow" },
        },
        custom_field_entries: [
          {
            custom_field: {
              description: "Which team is impacted by this issue",
              field_type: "single_select",
              id: "01FCNDV6P870EA6S7TK1DSYDG0",
              name: "Affected Team",
              options: [
                {
                  custom_field_id: "01FCNDV6P870EA6S7TK1DSYDG0",
                  id: "01FCNDV6P870EA6S7TK1DSYDG0",
                  sort_key: 10,
                  value: "Product",
                },
              ],
            },
            values: [
              {
                value_catalog_entry: {
                  aliases: ["lawrence@incident.io", "lawrence"],
                  external_id: "761722cd-d1d7-477b-ac7e-90f9e079dc33",
                  id: "01FCNDV6P870EA6S7TK1DSYDG0",
                  name: "Primary On-call",
                },
                value_link: "https://google.com/",
                value_numeric: "123.456",
                value_option: {
                  custom_field_id: "01FCNDV6P870EA6S7TK1DSYDG0",
                  id: "01FCNDV6P870EA6S7TK1DSYDG0",
                  sort_key: 10,
                  value: "Product",
                },
                value_text: "This is my text field, I hope you like it",
              },
            ],
          },
        ],
        debriefs: [
          {
            end_at: "2021-08-17T14:28:57.801578Z",
            id: "01G0J1EXE7AXZ2C93K61WBPYEH",
            start_at: "2021-08-17T13:28:57.801578Z",
          },
        ],
        duration_metrics: [
          {
            duration_metric: { id: "01FCNDV6P870EA6S7TK1DSYD5H", name: "Lasted" },
            status: "success",
            value_seconds: 10800,
          },
        ],
        external_issue_reference: {
          issue_name: "INC-123",
          issue_permalink:
            "https://linear.app/incident-io/issue/INC-1609/find-copywriter-to-write-up",
          provider: "asana",
        },
        has_debrief: false,
        id: "01FDAG4SAP5TYPT98WGR2N7W91",
        incident_role_assignments: [
          {
            assignee: {
              email: "lisa@incident.io",
              id: "01FCNDV6P870EA6S7TK1DSYDG0",
              name: "Lisa Karlin Curtis",
              role: "owner",
              slack_user_id: "U02AYNF2XJM",
            },
            role: {
              created_at: "2021-08-17T13:28:57.801578Z",
              description: "The person currently coordinating the incident",
              id: "01FCNDV6P870EA6S7TK1DSYDG0",
              instructions:
                "Take point on the incident; Make sure people are clear on responsibilities",
              name: "Incident Lead",
              required: false,
              role_type: "lead",
              shortform: "lead",
              updated_at: "2021-08-17T13:28:57.801578Z",
            },
          },
        ],
        incident_status: {
          category: "triage",
          created_at: "2021-08-17T13:28:57.801578Z",
          description:
            "Impact has been **fully mitigated**, and we're ready to learn from this incident.",
          id: "01FCNDV6P870EA6S7TK1DSYD5H",
          name: "Closed",
          rank: 4,
          updated_at: "2021-08-17T13:28:57.801578Z",
        },
        incident_timestamp_values: [
          {
            incident_timestamp: {
              id: "01FCNDV6P870EA6S7TK1DSYD5H",
              name: "Impact started",
              rank: 1,
            },
            value: { value: "2021-08-17T13:28:57.801578Z" },
          },
        ],
        incident_type: {
          create_in_triage: "always",
          created_at: "2021-08-17T13:28:57.801578Z",
          description: "Customer facing production outages",
          id: "01FCNDV6P870EA6S7TK1DSYDG0",
          is_default: false,
          name: "Production Outage",
          private_incidents_only: false,
          updated_at: "2021-08-17T13:28:57.801578Z",
        },
        last_activity_at: "2021-08-17T13:28:57.801578Z",
        mode: "standard",
        ms_teams_channel_url:
          "https://teams.microsoft.com/l/channel/19%some-hex%40thread.tacv2/inc-123-title?groupId=some-uuid&tenantId=another-uuid",
        name: "Our database is sad",
        permalink: "https://app.incident.io/incidents/123",
        postmortem_document_ids: ["01FCNDV6P870EA6S7TK1DSYD5H"],
        postmortem_document_url: "https://docs.google.com/my_doc_id",
        reference: "INC-123",
        severity: {
          created_at: "2021-08-17T13:28:57.801578Z",
          description: "Issues with **low impact**.",
          id: "01FCNDV6P870EA6S7TK1DSYDG0",
          name: "Minor",
          rank: 1,
          updated_at: "2021-08-17T13:28:57.801578Z",
        },
        slack_channel_id: "C02AW36C1M5",
        slack_channel_name: "inc-165-green-parrot",
        slack_channel_url: "https://slack.com/app_redirect?team=T1234&channel=C5678",
        slack_team_id: "T02A1FSLE8J",
        summary: "Our database is really really sad, and we don't know why yet.",
        team_ids: ["01JPQA75EPNEES4479P16P4XAB"],
        updated_at: "2021-08-17T13:28:57.801578Z",
        visibility: "public",
        workload_minutes_late: 40.7,
        workload_minutes_sleeping: 0,
        workload_minutes_total: 60.7,
        workload_minutes_working: 20,
      },
      message: "We're working on a fix, hoping to ship in the next 30 minutes",
      new_status: {
        category: "triage",
        created_at: "2021-08-17T13:28:57.801578Z",
        description:
          "Impact has been **fully mitigated**, and we're ready to learn from this incident.",
        id: "01FCNDV6P870EA6S7TK1DSYD5H",
        name: "Closed",
        rank: 4,
        updated_at: "2021-08-17T13:28:57.801578Z",
      },
      previous_status: {
        category: "triage",
        created_at: "2021-08-17T13:28:57.801578Z",
        description:
          "Impact has been **fully mitigated**, and we're ready to learn from this incident.",
        id: "01FCNDV6P870EA6S7TK1DSYD5H",
        name: "Closed",
        rank: 4,
        updated_at: "2021-08-17T13:28:57.801578Z",
      },
    },
  },
  {
    event_type: "public_incident.incident_updated_v2",
    "public_incident.incident_updated_v2": {
      call_url: "https://zoom.us/foo",
      created_at: "2021-08-17T13:28:57.801578Z",
      creator: {
        alert: {
          id: "01GW2G3V0S59R238FAHPDS1R66",
          title: "*errors.withMessage: PG::Error failed to connect",
        },
        api_key: { id: "01FCNDV6P870EA6S7TK1DSYDG0", name: "My test API key" },
        user: {
          email: "lisa@incident.io",
          id: "01FCNDV6P870EA6S7TK1DSYDG0",
          name: "Lisa Karlin Curtis",
          role: "owner",
          slack_user_id: "U02AYNF2XJM",
        },
        workflow: { id: "01FCNDV6P870EA6S7TK1DSYDG0", name: "My little workflow" },
      },
      custom_field_entries: [
        {
          custom_field: {
            description: "Which team is impacted by this issue",
            field_type: "single_select",
            id: "01FCNDV6P870EA6S7TK1DSYDG0",
            name: "Affected Team",
            options: [
              {
                custom_field_id: "01FCNDV6P870EA6S7TK1DSYDG0",
                id: "01FCNDV6P870EA6S7TK1DSYDG0",
                sort_key: 10,
                value: "Product",
              },
            ],
          },
          values: [
            {
              value_catalog_entry: {
                aliases: ["lawrence@incident.io", "lawrence"],
                external_id: "761722cd-d1d7-477b-ac7e-90f9e079dc33",
                id: "01FCNDV6P870EA6S7TK1DSYDG0",
                name: "Primary On-call",
              },
              value_link: "https://google.com/",
              value_numeric: "123.456",
              value_option: {
                custom_field_id: "01FCNDV6P870EA6S7TK1DSYDG0",
                id: "01FCNDV6P870EA6S7TK1DSYDG0",
                sort_key: 10,
                value: "Product",
              },
              value_text: "This is my text field, I hope you like it",
            },
          ],
        },
      ],
      debriefs: [
        {
          end_at: "2021-08-17T14:28:57.801578Z",
          id: "01G0J1EXE7AXZ2C93K61WBPYEH",
          start_at: "2021-08-17T13:28:57.801578Z",
        },
      ],
      duration_metrics: [
        {
          duration_metric: { id: "01FCNDV6P870EA6S7TK1DSYD5H", name: "Lasted" },
          status: "success",
          value_seconds: 10800,
        },
      ],
      external_issue_reference: {
        issue_name: "INC-123",
        issue_permalink:
          "https://linear.app/incident-io/issue/INC-1609/find-copywriter-to-write-up",
        provider: "asana",
      },
      has_debrief: false,
      id: "01FDAG4SAP5TYPT98WGR2N7W91",
      incident_role_assignments: [
        {
          assignee: {
            email: "lisa@incident.io",
            id: "01FCNDV6P870EA6S7TK1DSYDG0",
            name: "Lisa Karlin Curtis",
            role: "owner",
            slack_user_id: "U02AYNF2XJM",
          },
          role: {
            created_at: "2021-08-17T13:28:57.801578Z",
            description: "The person currently coordinating the incident",
            id: "01FCNDV6P870EA6S7TK1DSYDG0",
            instructions:
              "Take point on the incident; Make sure people are clear on responsibilities",
            name: "Incident Lead",
            required: false,
            role_type: "lead",
            shortform: "lead",
            updated_at: "2021-08-17T13:28:57.801578Z",
          },
        },
      ],
      incident_status: {
        category: "triage",
        created_at: "2021-08-17T13:28:57.801578Z",
        description:
          "Impact has been **fully mitigated**, and we're ready to learn from this incident.",
        id: "01FCNDV6P870EA6S7TK1DSYD5H",
        name: "Closed",
        rank: 4,
        updated_at: "2021-08-17T13:28:57.801578Z",
      },
      incident_timestamp_values: [
        {
          incident_timestamp: { id: "01FCNDV6P870EA6S7TK1DSYD5H", name: "Impact started", rank: 1 },
          value: { value: "2021-08-17T13:28:57.801578Z" },
        },
      ],
      incident_type: {
        create_in_triage: "always",
        created_at: "2021-08-17T13:28:57.801578Z",
        description: "Customer facing production outages",
        id: "01FCNDV6P870EA6S7TK1DSYDG0",
        is_default: false,
        name: "Production Outage",
        private_incidents_only: false,
        updated_at: "2021-08-17T13:28:57.801578Z",
      },
      last_activity_at: "2021-08-17T13:28:57.801578Z",
      mode: "standard",
      most_recent_update_message: "We're working on a fix, hoping to ship in the next 30 minutes",
      ms_teams_channel_url:
        "https://teams.microsoft.com/l/channel/19%some-hex%40thread.tacv2/inc-123-title?groupId=some-uuid&tenantId=another-uuid",
      name: "Our database is sad",
      permalink: "https://app.incident.io/incidents/123",
      postmortem_document_ids: ["01FCNDV6P870EA6S7TK1DSYD5H"],
      postmortem_document_url: "https://docs.google.com/my_doc_id",
      reference: "INC-123",
      related_incidents: ["INC-237"],
      severity: {
        created_at: "2021-08-17T13:28:57.801578Z",
        description: "Issues with **low impact**.",
        id: "01FCNDV6P870EA6S7TK1DSYDG0",
        name: "Minor",
        rank: 1,
        updated_at: "2021-08-17T13:28:57.801578Z",
      },
      slack_channel_id: "C02AW36C1M5",
      slack_channel_name: "inc-165-green-parrot",
      slack_channel_url: "https://slack.com/app_redirect?team=T1234&channel=C5678",
      slack_team_id: "T02A1FSLE8J",
      summary: "Our database is really really sad, and we don't know why yet.",
      team_ids: ["01JPQA75EPNEES4479P16P4XAB"],
      updated_at: "2021-08-17T13:28:57.801578Z",
      visibility: "public",
      workload_minutes_late: 40.7,
      workload_minutes_sleeping: 0,
      workload_minutes_total: 60.7,
      workload_minutes_working: 20,
    },
  },
  {
    event_type: "public_incident.postmortem_document_status_updated_v1",
    "public_incident.postmortem_document_status_updated_v1": {
      new_status: "complete",
      postmortem_document: {
        created_at: "2021-08-17T13:28:57.801578Z",
        document_url:
          "https://app.incident.io/my-org/incidents/123/post-mortems/01GDZEW57FDA1K4S63MGMQ5DS9",
        editors: [
          {
            email: "lisa@incident.io",
            id: "01FCNDV6P870EA6S7TK1DSYDG0",
            name: "Lisa Karlin Curtis",
            role: "viewer",
            slack_user_id: "U02AYNF2XJM",
          },
        ],
        exported_urls: [
          "https://www.notion.so/INC-123-sad-database",
          "https://docs.google.com/document/d/1234",
        ],
        id: "01GDZEW57FDA1K4S63MGMQ5DS9",
        incident_id: "01GBA8J19SMXQWPJMX3P2ESCVG",
        status: "in_progress",
        title: "INC-123: Database is sad",
        type: "in_app",
        updated_at: "abc123",
      },
      previous_status: "review",
    },
  },
  {
    event_type: "schedule.created_v1",
    "schedule.created_v1": {
      created_at: "2021-08-17T13:28:57.801578Z",
      id: "01G0J1EXE7AXZ2C93K61WBPYEH",
      name: "Primary On-Call Schedule",
      team_ids: ["01JPQA75EPNEES4479P16P4XAB"],
      timezone: "Europe/London",
      updated_at: "2021-08-17T13:28:57.801578Z",
    },
  },
  {
    event_type: "schedule.deleted_v1",
    "schedule.deleted_v1": {
      created_at: "2021-08-17T13:28:57.801578Z",
      id: "01G0J1EXE7AXZ2C93K61WBPYEH",
      name: "Primary On-Call Schedule",
      team_ids: ["01JPQA75EPNEES4479P16P4XAB"],
      timezone: "Europe/London",
      updated_at: "2021-08-17T13:28:57.801578Z",
    },
  },
  {
    event_type: "schedule.shift_change_v1",
    "schedule.shift_change_v1": {
      current_users: [
        {
          email: "lisa@incident.io",
          id: "01FCNDV6P870EA6S7TK1DSYDG0",
          name: "Lisa Karlin Curtis",
          role: "owner",
          slack_user_id: "U02AYNF2XJM",
        },
      ],
      previous_users: [
        {
          email: "lisa@incident.io",
          id: "01FCNDV6P870EA6S7TK1DSYDG0",
          name: "Lisa Karlin Curtis",
          role: "owner",
          slack_user_id: "U02AYNF2XJM",
        },
      ],
      schedule: {
        created_at: "2021-08-17T13:28:57.801578Z",
        id: "01G0J1EXE7AXZ2C93K61WBPYEH",
        name: "Primary On-Call Schedule",
        team_ids: ["01JPQA75EPNEES4479P16P4XAB"],
        timezone: "Europe/London",
        updated_at: "2021-08-17T13:28:57.801578Z",
      },
    },
  },
  {
    event_type: "schedule.updated_v1",
    "schedule.updated_v1": {
      created_at: "2021-08-17T13:28:57.801578Z",
      id: "01G0J1EXE7AXZ2C93K61WBPYEH",
      name: "Primary On-Call Schedule",
      team_ids: ["01JPQA75EPNEES4479P16P4XAB"],
      timezone: "Europe/London",
      updated_at: "2021-08-17T13:28:57.801578Z",
    },
  },
  {
    event_type: "status_page_incident.update_shared_v1",
    "status_page_incident.update_shared_v1": {
      status_page_incident: {
        component_impacts: [
          {
            component_id: "01GW7P4ES31Q6V1ZQH321T0GJN",
            component_status: "degraded_performance",
            end_at: "2021-08-17T13:28:57.801578Z",
            start_at: "2021-08-17T13:28:57.801578Z",
          },
        ],
        id: "01FCNDV6P870EA6S7TK1DSYDG0",
        incident_status: "investigating",
        name: "Elevated API latency",
        published_at: "2021-08-17T13:28:57.801578Z",
        status_page_id: "01FCNDV6P870EA6S7TK1DSYDG0",
        updates: [
          {
            component_statuses: [
              { component_id: "01FCNDV6P870EA6S7TK1DSYDG2", component_status: "operational" },
            ],
            id: "01FCNDV6P870EA6S7TK1DSYDG0",
            incident_status: "investigating",
            message: "abc123",
            published_at: "2021-08-17T13:28:57.801578Z",
            status_page_incident_id: "01FCNDV6P870EA6S7TK1DSYDG1",
          },
        ],
      },
      update: {
        component_statuses: [
          { component_id: "01FCNDV6P870EA6S7TK1DSYDG2", component_status: "operational" },
        ],
        id: "01FCNDV6P870EA6S7TK1DSYDG0",
        incident_status: "investigating",
        message: "abc123",
        published_at: "2021-08-17T13:28:57.801578Z",
        status_page_incident_id: "01FCNDV6P870EA6S7TK1DSYDG1",
      },
    },
  },
] as const;
