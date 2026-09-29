# Source: federation.html

# Federated
Multi-Silo Masterclass.

Achieve 100% data isolation with a unified global view. GO-DUCK's Federated Architecture orchestrates multiple independent database silos into a single, high-performance empire.

## The Foundations: Silos vs. Federation

###
S
What is a "Silo"?

In database architecture, a Silo is a physically isolated storage unit. Unlike traditional multi-tenancy where all users share the same table (Soft-Tenancy), GO-DUCK uses Hard-Silo Isolation.

- Physical Separation: Each Silo is its own Database/Schema.

- Security: No risk of cross-tenant data leakage via `WHERE` clause bugs.

- Compliance: GDPR/HIPAA-ready dedicated storage paths.

###
F
What is "Federation"?

Federation is the "Virtual Connectivity Layer" that sits above your Silos. It allows your application to treat 100 independent databases as a single Unified Empire.

- Aggregation: Query one endpoint, get results from every Silo.

- Orchestration: Broadcat a single write to multiple regions.

- Transparency: Front-end devs don't need to know which Silo they are hitting.

## Case Study: The Dealership Empire

Imagine you are running a global car dealership. Every regional branch (USA, Germany, Japan) requires physical isolation for local accounting compliance, but your CEO needs a global stock report in real-time.

#### USA SILO

"Site-specific Inventory. Physically trapped in local DB."

#### UK SILO

"Isolated branch ops. No link to foreign data."

#### FEDERAL LAYER

"The Harvester. Aggregates USA + UK into a single API response."

## Visualizing the Registry Logic

####

Scenario A: Isolated Branch

A Branch Manager (ID Layer) presents a token. The Triple-Identity Mapping Engine maps them to a single Opaque UUID. The logic strictly routes their connection to the USA Silo only. No other silos are visible or reachable.

####

Scenario B: Federated Harvester

A Global Admin (ID Layer) initiates a query with `?federated=true`. The Mapping Engine validates their authority and fan-outs the request across USA, UK, and DE Silos simultaneously, harvesting and aggregating the collective state.

## The Mapping Decoupling

GO-DUCK solves the "ID Enumeration" problem using an internal 3-layer mapping engine. This ensures that no internal database connection strings or IDs are ever exposed to the client.

1. Role Mapping

realm_role: 'branch_usa'

2. Opaque Proxy

UUID: 'bc72-...-a180'

3. Silo Routing

DB: 'car_dealership_usa'

## The Control Plane: Runtime Provisioning

### Zero-Touch Onboarding

GO-DUCK isn't just a static mapping. It includes a built-in SaaS Management Engine that can provision entire DB silos on the fly.

POST /management/tenant/assign

Triggering this endpoint creates the DB, registers the UUID mapping, and runs schema migrations in one atomic action. Gated behind JWT auth plus `SuperAdminRoleMiddleware`, so only your configured super-admin role can provision new silos.

### Lazy Connection Management

To maintain elite performance, silos are Lazily Hydrated. Connection pools are only initialized upon the first incoming request for that Silo.

// Internal Registry Logic

if pool := registry.Find(siloID); pool == nil {

registry.Hydrate(siloID); // Lazy Init

}

## Precision Global Harvesting

### Surgical Silo Selection

What if a user has access to 10 different silos but only needs to reconcile data from 3 specific regions?
GO-DUCK supports Precision Harvesting via the `X-Tenant-ID` header and the `?federated=true` parameter.

HEADER

`X-Tenant-ID: uuid-1, uuid-2, uuid-3`

The Parallel Harvester 2.0 detects the comma-separated list and resolves fan-out to ONLY those tenant UUIDs. By default that's not an intersection with your realm role's silos — the UUID is the credential on its own: whoever holds a valid tenant UUID (handed out per-grant via `GET /api/silos/me`) can target its silo, independent of which role they're currently holding. Flip `multitenancy.require-role-grant: true` in config to require a matching role grant too. `admin_db` is the one silo this never grants, unless the caller also holds the super-admin role.

// Harvester Logic

requested := header.GetTenants()

target := resolveByTenantID(requested)

// (admin_db excluded unless isAdmin)

// Fan-out only to target

for silo := range target {

go harvest(silo)

}

## Federated API Guide

Action Type
Header / Params
Resulting Behavior

Standard Action(None)Dynamic routing to your assigned localized Silo.

Silo NarrowingX-Tenant-ID: {UUID}Force focus on a specific regional database silo.

Global Harvest?federated=true
requires `@Federated` on the entityAggregates results from ALL silos in a single response. Both preconditions are required together — the annotation alone does not trigger fan-out.

Atomic Broadcast(None — automatic)Unconditional on every Create/Update/Delete/BulkX mutation to a `@Federated` entity — a `DistributedOutbox` row is written per authorized silo in the same transaction. There is no opt-in header; it always fires.

### Silo Discovery Endpoint

Curious which silos your identity resolves to? Ask the registry directly:

```
GET /api/silos/me
```

Returns your Opaque UUID(s) via the Triple-Identity Registry. Note that whether the physical database name is also included depends on the `multitenancy.hide-silo-names` config flag — see the Multi-Tenancy guide for details.

### Scale Without Data Leakage

Entities marked with `@Federated` automatically participate in this multi-silo orchestrator. Start your creation process today.

Back to Quick Start
