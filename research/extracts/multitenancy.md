# Source: multitenancy.html

# The Federated Masterclass

Go beyond simple multi-tenancy. Orchestrate a global empire of data silos with real-time synchronization and parallel read aggregation.

## Deep Dive: The Dealership Scenario

Imagine a car—Car ABC—owned by Customer X. Customer X regularly visits Dealership A (Home), but today they are 1,000 miles away and visit Dealership B (Guest) for an emergency repair.

#### Without Federation

Dealership B creates a record. Dealership A knows nothing about it. When the car returns home, the service history is fragmented. The "Single Source of Truth" is broken.

#### With GO-DUCK Federation

Dealership B saves the record. GO-DUCK automatically broadcasts this to Dealership A in the background. Both databases now hold the complete, unified history of the car.

## Architectural Control: The Annotations

### 1. Standard Multi-Tenancy

`entity DealershipSettings { ... }`

Behavior: Stored in the tenant's primary database only. No synchronization. High performance, zero overhead.

Use Case: Data that belongs to a specific site, like internal employee lists or site colors.

### 2. Federated Multi-Tenancy

`@Federated entity ServiceHistory { ... }`

Behavior: Triggers the Saga/Outbox Engine. Writes are broadcast to all authorized silos. Reads are aggregated in parallel.

Use Case: Critical data that must be "Everywhere," like car health, global inventory, or customer profiles.

## Triple-Identity Registry: Opaque Decoupling

To prevent ID Enumeration and protect physical infrastructure paths, GO-DUCK implements a sophisticated 3-layer identity registry. This is designed to ensure that guessable database names are never leaked to the client.

Configuration Caveat: The physical-name secrecy promise above only holds once you turn it on. The `GET /api/silos/me` discovery endpoint returns the raw physical database name in its JSON response unless `multitenancy.hide-silo-names` is explicitly set to `true`. This flag defaults to `false` in the shipped sample config, meaning out of the box, physical database names are exposed to the client via this endpoint. Set it explicitly:

```
go-duck:
multitenancy:
hide-silo-names: true
```

1

#### Identity Layer

Keycloak Realm Role (e.g. `dealer_tokyo`). This is the source of truth for authorization.

2

#### Opaque Layer

Randomly generated UUID (e.g. `bc72-a180...`) exposed via the `X-Tenant-ID` header.

3

#### Physical Layer

The actual database name (e.g. `dealership_silo_japan_prod`). Only the server knows this link.

## The Dual-Path Orchestrator

GO-DUCK doesn't force you into one model. Our generated middleware and controllers detect your GDL annotations and switch behavior in real-time.

01

#### Silo-Connection-Cache

Prevents connection exhaustion across 100+ silos using a singleton-based cache. DB/Mongo clients are lazily initialized and kept warm.

02

#### Parallel Read Harvest

Fan-out isn't the default — it's opt-in. A query only harvests across silos when both preconditions are met: the entity carries `@Federated` and the request explicitly passes `?federated=true` (the query defaults to `false`). When both are present, GO-DUCK launches simultaneous Go-routines to every database you own, stitching the global picture together in milliseconds. Without the query param, a `@Federated` entity behaves exactly like any normal single-silo entity.

03

#### Transactional Atomic Broadcast

A write to one silo is a write to all. Using the Outbox pattern, we guarantee that even if Dealership A is offline, Dealership B's updates will eventually arrive safely.

04

#### Precision Harvesting

Pass a comma-separated list of UUIDs in the `X-Tenant-ID` header. The Harvester reduces its fan-out to ONLY these silos for surgical efficiency. By default the UUID is a self-sufficient credential — resolution is by tenant UUID alone, independent of which realm role you're currently holding, since the UUID is only ever handed out per-grant via `GET /api/silos/me` in the first place. Set `multitenancy.require-role-grant: true` if you'd rather require the caller's own role to also hold an explicit grant for that tenant. Either way, a tenant ID that doesn't resolve is rejected outright (403), never silently rerouted to the default database.

### Elite FAQ

What if I assigned multiple DBs to a role but forgot @Federated?

GO-DUCK will only use your Primary/Default database. It will not harvest data from the other assigned silos. You must use the annotation to unlock aggregation.

Is there a performance hit for @Federated?

Reads use parallel goroutines, making them extremely fast even across silos. Writes include one extra row in the Outbox table—a small price for global consistency.
