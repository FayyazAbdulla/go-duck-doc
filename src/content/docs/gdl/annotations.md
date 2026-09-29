---
title: Annotations
description: GDL annotations that change storage, search, audit, auth, and lifecycle.
---

Annotations attach behavior to an entity or, for `@Version`, to a field. Several of them have file-level equivalents on the [advanced](/gdl/advanced/) page.

```text
@Searchable @Audited @Federated
entity Transaction {
    string(100) ref required unique
    bigdecimal amount
    datetime txDate
    @Version int(32) v
}
```

## Reference

### `@Federated`

The entity can be read across silos and written to more than one. Read fan-out is not automatic: the request also needs `?federated=true`. Writes always insert `distributed_outbox` rows. Details: [Federation](/features/federation/) and [Saga](/features/saga/).

### `@Searchable`

Mutations are indexed in Elasticsearch. The annotations page says this scaffolds a per-entity route such as `GET /api/transactions/search`, and that the old global `GET /api/search/:entity` route was removed. Other pages still show different URLs. See [Elasticsearch](/features/elasticsearch/).

### `@Audited`

Intended to record who changed a row. The current write path and the `/history` / `/timeline` read path do not use the same table. See [Audit](/ops/audit/).

### `@Version`

Field-level. Put it on a field you already declared (`@Version int(32) v`). GORM returns HTTP 409 if the version changed since the client read the row.

### `open`

Skips the Keycloak JWT middleware for selected actions: `read`, `list`, `create`, `delete`. Routes are mounted under `/open` plus the API prefix, for example `/open/api/transactions`.

### `@Delete`

On the next import: drop generated Go and Protobuf for the entity, emit `DROP TABLE`, and delete the `.go-duck/` snapshot for it.

### `@ArchiveStatus`

Adds an `archived` boolean. Same as the file directive `archived` or `archived *`.

### `@TrackViews`

Read receipts. Creates `{entity}_read_receipt` and the endpoints `/assign-receivers`, `/view`, and `/tracking/toggle`, using the caller's Keycloak id. Same as `trackViews` or `trackViews *`.

### `@Document` and `@isDocument`

Stores the entity in MongoDB. The primary key becomes a string ObjectID instead of a numeric `uint`. This is what turns on cross-database relationship handling. See [Hybrid-Store](/features/hybrid-store/).

### `@SoftDelete`

Hard `DELETE` becomes a `deleted_at` column. The CLI README adds `GET /trashed` and `POST /{id}/restore`, and says trashed rows are hidden from normal queries. Same as `softDelete`, `softDelete *`, or `softDelete Staff,Customer`.

### `@Draftable`

The website HTML says this injects `IsDraft` and `DraftOfId`, plus `/draft` and `/publish`. The CLI README says it adds an `is_draft` column and those same two endpoints. Same as the file directive `draftable` or `draftable *`. The contributor guide also allows a comma-separated list: `draftable Staff,Customer`.

### `@ActiveStatus` and `@IsActive`

Adds `isActive`, default `TRUE` on create, without treating a later PATCH of `false` as “unset”. The website HTML says the column defaults to `TRUE`.

### `@Embed`

CLI README only. Marks a nested structure as embedded instead of its own table or collection. The website annotation page does not list it.
