# Change Log - @useairfoil/connector-kit

<!-- This log was last generated on Thu, 29 Oct 2026 08:35:20 GMT and should not be manually modified. -->

<!-- Start content -->

## 0.6.1

Thu, 29 Oct 2026 08:35:20 GMT

### Patches

- update to Effect v4 stable (jadejajaipal5@gmail.com)
- add one-off connector demo mode and update Effect dependencies to 4.0.7 (jadejajaipal5@gmail.com)
- run only the resources that have a table binding (jadejajaipal5@gmail.com)
- connector-kit: use explicit field IDs in Iceberg schemas (jadejajaipal5@gmail.com)
- add Metrics.retrySchedule, rename the delete column to _deleted, and rerun changes while more pages remain (jadejajaipal5@gmail.com)
- replace publishers with iceberg native ingestor (jadejajaipal5@gmail.com)
- name row keys with `Iceberg.identifier` and send full rows (jadejajaipal5@gmail.com)
- add shared change feeds and include source errors in logs (jadejajaipal5@gmail.com)

## 0.6.0

Mon, 24 Aug 2026 18:56:59 GMT

### Minor changes

- connector-kit: add operator-ready hosted bindings and OTel metrics (jadejajaipal5@gmail.com)

## 0.5.3

Thu, 13 Aug 2026 17:12:03 GMT

### Patches

- connector-kit: add numeric manifest constraints (jadejajaipal5@gmail.com)
- connector-kit: add hosted config and durable state (jadejajaipal5@gmail.com)
- feat: add connector configuration checks (jadejajaipal5@gmail.com)
- connector-kit: manifest, add metrics and status endpoints (jadejajaipal5@gmail.com)
- chore: support Effect v4 RC (jadejajaipal5@gmail.com)
- connector-kit: add expiring provider token cache (jadejajaipal5@gmail.com)
- connector-kit: add runtime health and observability (jadejajaipal5@gmail.com)

## 0.5.0

Fri, 19 Jun 2026 12:39:54 GMT

### Minor changes

- feat: improve webhook handling, add telemetry support and update runConnector (jadejajaipal5@gmail.com)

### Patches

- ack: refactor (jadejajaipal5@gmail.com)
- connector-kit: add Telemetry.layer and Telemetry.layerConfig (jadejajaipal5@gmail.com)
- connector-kit: publish to Wings tables (jadejajaipal5@gmail.com)
- connector-kit: surface error in telemetry & fix sandbox entrypoints (jadejajaipal5@gmail.com)
- feat(connector-kit): add OTel span instrumentation (jadejajaipal5@gmail.com)
- connector-kit: add connector app runtime APIs (jadejajaipal5@gmail.com)
- connector-kit: add resource mutation runtime (jadejajaipal5@gmail.com)
