# Source: rest.html

# PostgREST-like
RPC Search Engine.

Stop writing boiler-plate search controllers. GO-DUCK generates an high-performance, unified RPC layer for deep, transactional querying across your multi-silo empire.

#### Pure Full-Text Search

Native Elasticsearch engine for sub-millisecond fuzzy matching on millions of records.

#### JPA-Style Filtering

Dynamic, server-side filtering with `?field.operator=val` directly on your GORM models — e.g. `?age.greaterThan=20`.

#### JSONB Path Filtering

Filter inside a JSONB column with arrow notation in the field name, nested arbitrarily deep: `?metadata->a->b.equals=x`.

## API Reference & Endpoint Map

`{apiPrefix}` below is configurable via `go-duck.server.rest.api-path-prefix`. Default is `/{app-name}/api` — e.g. a project named `go-duck-preview` mounts everything under `/go-duck-preview/api`. There's no `v1` segment out of the box.

Verb
Endpoint Pattern
Discovery Power

GET{apiPrefix}/{entity}s/search?query=keywordElite Elasticsearch Fuzzy Search

GET{apiPrefix}/{entity}List and Search with GORM Filter Logic

POST{apiPrefix}/{entity}Atomic Primary Write + Saga Multi-Broadcast

PATCH{apiPrefix}/{entity}/{id}Partial Update (Single Silo or Global)

DELETE{apiPrefix}/{entity}/{id}Distributed Atomic Deletion

POST{apiPrefix}/{entity}/bulkBulk Multi-Silo Transaction

GET{apiPrefix}/admin/auditCentralized Audit Log Retrieval (SuperAdmin)

POST/management/tenant/assignDynamic Tenant DB Provisioning (SuperAdmin)

GET/management/tenant/provisionsList Full Tenant Provision Registry (SuperAdmin)

## Silo Precision: Transactional Isolation

While GO-DUCK defaults to global federation, sometimes you need surgical precision. Our Dual-Path Orchestrator is controlled by your headers.

#### Federal Broadcast (Default)

Headers: Empty

Writes synchronize to all silos. Reads aggregate data from the entire dealership empire into a single view.

#### Silo Narrowing (Precision)

X-Tenant-ID: {Opaque-Silo-ID}

Bypasses federation. Reads and writes are isolated to ONLY that specific silo. Perfect for site-specific audits or sensitive data entries.

## Industrial Velocity: Bulk Operations

For high-velocity data ingestion, GO-DUCK generates transaction-aware Bulk Endpoints. A single request can mutate thousands of records across your silos.

#### Endpoint: POST {apiPrefix}/{entity}/bulk

Payload: Array of Objects

```
[
{ "make": "Tesla", "model": "Model S" },
{ "make": "Lucid", "model": "Air" }
]
```

#### Atomic & Federated

Bulk operations are wrapped in a database transaction. If one record fails validation or insertion, the entire batch is rolled back across all Silos.

## Relational Intelligence: Eager Loading

By default, GO-DUCK uses Lazy Loading to keep responses lightweight. However, you can toggle relational graph expansion using our intelligent URI flags.

#### Eager Expansion (?eager=true)

Recursively loads all 1:m and m:1 relationships defined in your GDL. Perfect for building complex dashboard views in a single call.

`GET {apiPrefix}/car/1?eager=true`

#### Lazy Defaults

Returns only the primary entity fields. Relationships remain hydrated as IDs, reducing bandwidth and database overhead.

`GET {apiPrefix}/car/1`

## Pagination & Dynamic Sorting

List endpoints support pagination and dynamic sorting for both relational (PostgreSQL) and document-based (MongoDB) silos.

#### Pagination

Specify the page number (1-indexed) and limit size via standard query parameters. The response contains total count in the `X-Total-Count` header.

`GET {apiPrefix}/car?page=1&size=20`

#### Dynamic Sorting

Sort fields dynamically in ascending (default or `asc`) or descending (`desc`) order. The sorting format is `?sort=fieldname,direction`.

`GET {apiPrefix}/car?sort=price,desc`

## Dynamic Join Engine

The GO-DUCK Dynamic Join engine allows you to execute on-the-fly relational joins via REST without pre-defining custom controllers. It safely joins Entity A with Target Table B using foreign keys.

#### Endpoint Pattern

```
GET {apiPrefix}/{entity}s/join/:entityB?onA=id&onB={foreign_id}&type=multiple
```

Example: Fetch a `screen` and all its related `screenandcomponent` children.

`GET {apiPrefix}/screens/join/screenandcomponent?onA=id&onB=screen_id&type=multiple`

#### Hardened Security Architecture 🛡️

1. IDOR / Arbitrary Table Querying Protection: To prevent attackers from passing sensitive tables (e.g., `audit_log` or `users`) into the `{targetTable}` path variable, the CLI dynamically injects a strict Entity Whitelist during generation based on your GDL schema. Invalid targets instantly trigger a 403 Forbidden.

2. OOM & DB Crash Protection: Unbounded dynamic joins can trigger massive `IN (1...50000)` clauses. To prevent this, the engine enforces strict Pagination Controls (`?page=1&size=20`) on the primary entity before executing the join array, safeguarding memory and database parameter limits.

## GORM Filter Reference

The operator is a suffix on the query key, not a prefix on the value — `?age.greaterThan=20`, never `?age=gt.20`. The same convention drives the main entity endpoints, the dynamic join endpoint, and the generic `{apiPrefix}/rpc/:table` RPC layer.

.equals
.notEquals
.greaterThan
.lessThan
.greaterThanOrEqual
.lessThanOrEqual
.contains
.doesNotContain
.in
.notIn
.specified

### JSONB Path Filtering

GDL never declares a JSONB field's inner keys — content is entirely user-defined — so filtering into one is a generic arrow-path convention layered onto the same `.operator` suffix. Put `->` between segments in the field name, nested arbitrarily deep (`metadata->status`, `metadata->a->b`), and it compiles to Postgres's `#>>` path operator — so nesting depth is unlimited in one expression, not chained `->`/`->>` operators. Always extracted as text, so every operator above works unchanged.

?metadata->status.equals=active

?metadata->a->b.equals=x

?details->count.greaterThan=5

Heads up: every path segment is validated against `^[a-zA-Z0-9_]+$` before it's spliced into SQL. An invalid segment doesn't return a 400 — the filter is just silently dropped and the query runs without it, so a typo'd path quietly returns unfiltered results rather than erroring out.

## The Generic RPC Layer

Beyond the per-entity CRUD controllers, GO-DUCK also mounts a table-agnostic RPC layer that can search or join any table by name — no GDL entity required, useful for legacy tables or ad-hoc joins.

#### Generic Search

`GET {apiPrefix}/rpc/:table`
Same `.operator` filtering convention as everywhere else, run against a raw table name via `db.Table(tableName)`.

#### Dynamic Join

`GET {apiPrefix}/rpc/join/:entityA/:entityB`
Joins two arbitrary tables by name at request time — distinct from the per-entity `/{'{entity}'}s/join/:entityB` route shown above.

#### ⚠️ Naming Inconsistency Worth Knowing

This RPC layer uses different pagination/sort param names than the per-entity CRUD endpoints above. Don't mix them up:

Per-entity CRUD

`?page=1&size=20&sort=price,desc`

Generic RPC layer

`?order=id.desc&limit=10&offset=0`
