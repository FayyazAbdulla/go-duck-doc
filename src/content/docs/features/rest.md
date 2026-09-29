---
title: REST and search
description: Generated HTTP routes, filters, pagination, joins, and the generic RPC layer.
---

`{apiPrefix}` is `go-duck.server.rest.api-path-prefix`. For an app named `go-duck-preview` that default is `/go-duck-preview/api`.

List endpoints return a bare JSON array, not a `{ "results": [] }` wrapper.

## Routes

| Verb | Pattern | Role |
|------|---------|------|
| GET | `{apiPrefix}/{entity}s/search?query=keyword` | Elasticsearch-style search as listed on the REST page |
| GET | `{apiPrefix}/{entity}` | List, with GORM filters |
| POST | `{apiPrefix}/{entity}` | Create |
| PATCH | `{apiPrefix}/{entity}/{id}` | Partial update |
| DELETE | `{apiPrefix}/{entity}/{id}` | Delete |
| POST | `{apiPrefix}/{entity}/bulk` | Array of objects, one transaction |
| GET | `{apiPrefix}/admin/audit` | Audit retrieval (super-admin) |
| POST | `/management/tenant/assign` | Provision a tenant database |
| GET | `/management/tenant/provisions` | List provisions |

Management routes are not under `{apiPrefix}` in the table on the REST page.

Bulk example:

```json
[
  { "make": "Tesla", "model": "Model S" },
  { "make": "Lucid", "model": "Air" }
]
```

If one row fails, the batch rolls back across silos.

## Pagination and sort

```text
GET {apiPrefix}/car?page=0&size=20
GET {apiPrefix}/car?sort=price,desc
```

The CLI changelog dated 2026-09-07 makes `page` **0-based**: offset is `page * size`, default `size` is 20, and `page < 0` is clamped to 0. `page=0` is the first page. Angular and Ionic SDK templates were updated with the controllers.

The website HTML still says `page` is 1-indexed (`?page=1&size=20`) and that the total is the `X-Total-Count` header. Clients written against that HTML will skip or repeat a page on a generator from 2026-09-07 onward. Sort direction in the HTML is `asc` (default) or `desc`, as `?sort=field,direction`. The CLI README writes `?sort=field,asc`.

The generic RPC layer uses different query names. See below.

## Eager loading

The website HTML uses a query flag and says the default leaves relations as ids:

```text
GET {apiPrefix}/car/1?eager=true
GET {apiPrefix}/car/1
```

The CLI README arsenal uses a path instead:

```text
GET /api/{entity}/eager
```

A 2026-06-15 changelog entry says `eager=false` must return only the foreign key, not an empty `{ "id": 123 }` object. Use the route your generated OpenAPI lists.

## Filters

The operator is a suffix on the query key:

```text
?age.greaterThan=20
```

Not `?age=gt.20`. The same suffix form is used on entity routes, dynamic joins, and `{apiPrefix}/rpc/:table`.

| Suffixes |
|----------|
| `.equals` `.notEquals` |
| `.greaterThan` `.lessThan` |
| `.greaterThanOrEqual` `.lessThanOrEqual` |
| `.contains` `.doesNotContain` |
| `.in` `.notIn` `.specified` |

### JSONB paths

GDL does not declare keys inside a JSONB column. Filter with `->` in the field name. The server compiles that to Postgres `#>>` and compares text, so every operator above still applies.

```text
?metadata->status.equals=active
?metadata->a->b.equals=x
?details->count.greaterThan=5
```

Each segment must match `^[a-zA-Z0-9_]+$`. An invalid segment does not return 400. The filter is dropped and the query runs without it.

## Dynamic join

```text
GET {apiPrefix}/{entity}s/join/:entityB?onA=id&onB={foreign_id}&type=multiple
```

Example:

```text
GET {apiPrefix}/screens/join/screenandcomponent?onA=id&onB=screen_id&type=multiple
```

The target must be an entity from the GDL whitelist. Anything else, including `audit_log` or `users` if they are not entities, returns 403. The primary entity is paginated (`page`, `size`) before the join so the `IN (...)` list stays bounded.

## Generic RPC

For tables that are not GDL entities:

```text
GET {apiPrefix}/rpc/:table
GET {apiPrefix}/rpc/join/:entityA/:entityB
```

Search uses `db.Table(tableName)` and the same `.operator` suffixes. Pagination on this layer is:

```text
?order=id.desc&limit=10&offset=0
```

Do not mix that with `page` / `size` / `sort` from the entity routes.

## Extra routes named in the CLI README

These are not in the website route table. Paths are printed there as `/api/...` rather than `{apiPrefix}`:

| Call | Role |
|------|------|
| `POST /api/{entity}s/ask` | Natural language to a read-only SQL or Mongo query, up to 3 retries |
| `GET /api/{entity}s/check-unique` | Check a value such as email is unused |
| `POST /api/{entity}s/{id}/clone` | Duplicate a row and safe relations |
| Autocomplete, stats, CSV/Excel export | Named, without a path template |
| `GET /trashed`, `POST /{id}/restore` | With `@SoftDelete` |
| `GET /api/storage/scan` | Changelog 2026-04-18: try each enabled storage provider until one returns the object |

Bulk `POST .../bulk` returns **400** on an empty array (changelog 2026-07-03).

## Tenant headers

The REST page describes two header modes:

- No `X-Tenant-ID`: writes go to all silos; reads aggregate.
- `X-Tenant-ID: {opaque-uuid}`: that silo only.

Federation docs add a condition on reads: aggregation runs only when the entity is `@Federated` and the query includes `?federated=true`. A comma-separated UUID list limits the fan-out. An unknown id is 403, not a silent fallthrough to the default database. See [Federation](/features/federation/).
