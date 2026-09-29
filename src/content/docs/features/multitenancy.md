---
title: Multi-tenancy
description: Hard database silos, the triple-identity registry, and tenant headers.
---

GO-DUCK tenancy is a separate database (or schema) per silo, not a shared table filtered by `WHERE`. A role can be mapped to more than one database. Data stays in the tenant database unless the entity is [`@Federated`](/features/federation/).

## Triple-Identity

Three layers, so clients never need the physical database name:

| Layer | Example from the HTML | Who sees it |
|-------|----------------------|-------------|
| Identity | Keycloak realm role `dealer_tokyo` | The token |
| Opaque | UUID such as `bc72-a180…` in `X-Tenant-ID` | The client |
| Physical | `dealership_silo_japan_prod` | The server only, if hiding is on |

`GET /api/silos/me` returns the opaque ids for the caller. The security page shows objects with `tenantId` and `roleName`.

Physical names are included in that JSON unless you set:

```yaml
go-duck:
  multitenancy:
    hide-silo-names: true
```

The multi-tenancy page says the shipped sample defaults this flag to **false**, so names are visible until you turn it on. The security page mentions the same keys and also calls the file `application.yml`.

## Headers and grants

- No header: the request uses the caller's localized silo.
- `X-Tenant-ID: {uuid}`: that silo only.
- `X-Tenant-ID: uuid-1, uuid-2, uuid-3`: only those silos, when a harvest is actually running.

By default the UUID is enough. It is issued per grant from `GET /api/silos/me`, and resolution does not also check the caller's current realm role. Set this to require both:

```yaml
go-duck:
  multitenancy:
    require-role-grant: true
```

An id that does not resolve is **403**. It is not routed to the default database. `admin_db` is never granted this way unless the caller also has the super-admin role.

## Connections

Pools are created on first use and kept in a singleton silo-connection cache so many tenants do not exhaust ports. `datasource.max-open-conns` limits the GORM pool (see [configuration](/guides/configuration/)).

## Provisioning

```text
POST /management/tenant/assign
GET /management/tenant/provisions
```

Assign creates the database, registers the UUID mapping, and runs migrations. It requires a JWT and `SuperAdminRoleMiddleware`. If `security.super-admin-role` is unset, that middleware allows the call through. See [Keycloak](/infra/keycloak/).

Standard entities (no `@Federated`) stay in the tenant's primary database even if the role has more databases assigned. Extra silos are not read until the annotation and `?federated=true` are both present.
