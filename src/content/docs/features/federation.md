---
title: Federation
description: When @Federated reads fan out and when writes hit the outbox.
---

A silo is its own database. Federation is the layer that can read many silos in one response and replicate writes. It is opt-in per entity with [`@Federated`](/gdl/annotations/).

## Reads

Both of these are required. The annotation alone does not fan out:

1. The entity is `@Federated`.
2. The request includes `?federated=true`.

Without the query parameter, the entity behaves like any other single-silo entity. Without the annotation, databases assigned to the role besides the primary one are ignored.

Fan-out uses goroutines and merges the rows. Pass a comma-separated `X-Tenant-ID` list to limit which UUIDs are queried. See [Multi-tenancy](/features/multitenancy/) for `require-role-grant` and `hide-silo-names`.

`GET /api/silos/me` lists the opaque ids the caller may use.

## Writes

Create, update, delete, and bulk mutations on a `@Federated` entity write one `distributed_outbox` row per authorized target silo in the **same** transaction. There is no header to turn that off. The worker delivers those rows later. See [Saga](/features/saga/).

## Discovery vs harvest

| Request | Behavior |
|---------|----------|
| No extra header or query | Routed to the caller's localized silo |
| `X-Tenant-ID: {uuid}` | That silo only |
| `?federated=true` on an `@Federated` entity | Aggregate every authorized silo |
| Comma-separated `X-Tenant-ID` during harvest | Only those UUIDs |

`POST /management/tenant/assign` provisions a new database, mapping, and migrations. It is behind JWT and `SuperAdminRoleMiddleware`.

The REST page's wording (“empty headers mean reads aggregate”) is broader than this. The federation and multi-tenancy pages are explicit: aggregation needs `@Federated` and `?federated=true`.
