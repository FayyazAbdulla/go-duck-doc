---
title: Multi-silo guide
description: How a client picks a silo, harvests reads, and replicates writes.
---

Database per tenant. Three layers: Keycloak realm role (for example `ROLE_HARBOUR_B`), opaque `tenantId`, physical database name (for example `harbour_b`). Physical names show up in `GET /api/silos/me` unless [`multitenancy.hide-silo-names`](/features/multitenancy/) is true. The sample below is the one printed in the multi-silo guide, which includes `dbName`.

## 1. No header

`TenantMiddleware` reads realm roles from the bearer token, looks them up in `tenant_roles`, and binds the highest-priority role’s database. A dedicated role such as `role_harbour_b` is sorted ahead of generic roles such as `offline_access`.

## 2. One silo

```bash
GET /api/silos/me
Authorization: Bearer <JWT_TOKEN>
```

```json
[
  {
    "tenantId": "c2405520-499f-4dba-ade5-a0df39954a84",
    "roleName": "role_harbour_b",
    "dbName": "harbour_b",
    "isPrimary": true
  }
]
```

```bash
POST /api/institutes
Authorization: Bearer <JWT_TOKEN>
X-Tenant-ID: c2405520-499f-4dba-ade5-a0df39954a84
```

Lookup is case-insensitive (`LOWER(tenant_id)`). Provisioning lowercases `TenantID` the same way it lowercases `DBName`.

## 3. Parallel read

Only for [`@Federated`](/gdl/annotations/) entities:

```bash
GET /api/institutes?federated=true
Authorization: Bearer <JWT_TOKEN>
```

The multi-silo guide’s response is a map keyed by role name, not a flat list:

```json
{
  "offline_access": [
    { "id": 2, "name": "TEST", "code": "1122" }
  ],
  "role_harbour_b": []
}
```

## 4. Writes to more than one silo

Mark the entity `@Federated`, assign the user more than one tenant role (`POST /management/tenant/assign` or Keycloak), then send a comma-separated header:

```bash
POST /api/harbours
Authorization: Bearer <JWT>
X-Tenant-ID: c2405520-499f-4dba-ade5-a0df39954a84, test-uuid
```

The local row is written on the primary silo. Outbox rows for the other silos are queued in the same transaction. `OutboxWorker` replays them with `OnConflict: DoNothing`.

`admin_db` is never granted by UUID alone unless the caller has the super-admin role. Set `multitenancy.require-role-grant: true` if the UUID must also match a `tenant_roles` grant for the caller’s current role. Default is false.

## If the request hits the wrong database

Stdout lines the guide says to look for, after enabling debug in `middleware/jwt_middleware.go` and `middleware/tenant_middleware.go`:

```text
DEBUG JWTMiddleware: parsed roles = [...]
DEBUG TenantMiddleware: lowerRoles = [...], requestedTenants = [...]
```

Compare those roles with rows in `tenant_roles`.

An explicit `X-Tenant-ID` that matches nothing is described two ways in the CLI sources. The product README and the 2026-08-18 changelog say **403** (no silent fallthrough to the master database). The contributor guide’s later invariant says the opposite: fall back to the master database, and that this overrides the 403 rule. Connection failure is a third case: the 2026-06-15 changelog says a silo that fails to connect falls back to the master database instead of returning 500. Check the generator version you are running before relying on either rejection or fallback.
