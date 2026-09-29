# Source: gdl-annotations.html

# Power-up Annotations

Behavioral Extensions & Plugins

Annotations are the "Secret Sauce" of GO-DUCK. By marking an entity with an annotation, you inject sophisticated distributed logic that would otherwise require hundreds of lines of manual code.

`@Federated`
🌐

#### Multi-Silo Core

Enables the Precision Harvester 2.0. The entity becomes cross-silo aware, supporting parallel read aggregations and atomic multi-broadcast writes via the Federated Router.

Architectural Impact
Injects Silo-Discovery interceptors & Atomic Mutex locks on write ops.

`@Searchable`
⚡

#### Elasticsearch Sync

Triggers real-time indexing into Elasticsearch. Every mutation (Create/Update/Delete) is automatically mirrored to the ES engine.

Architectural Impact
Registers GORM AfterSave hooks & scaffolds a per-entity `GET /api/transactions/search` endpoint (the old global `/api/search/:entity` route was removed in favor of per-entity native routes).

`@Audited`
📜

#### Zero-Trust Logging

Enables deep regulatory auditing. Every row change is logged to the central `audit_log` table with Keycloak identity and client IP.

Architectural Impact
Injects AuditContext midddleware & historical row-version snapshotting.

`@Version`
🔒

#### Optimistic Locking

`@Version` is a field-level annotation — it must be applied to a field you've already declared (any name/type works), not auto-injected. Once marked, GORM automatically rejects updates (HTTP 409) if the version has changed since the data was fetched.

Architectural Impact
Injects GORM Optimistic Locking plugin & atomic integer increments on the annotated field. See `@Version int(32) v` below.

`open`
🔓

#### Public API Access

Selectively bypasses the Keycloak JWT stack. This allows you to expose specific entities or granular actions to the public internet without authentication headers.

Supported Method Granularity

read

list

create

delete

Architectural Impact: Scaffolds routes into an `/open` group prefixed in front of your API prefix (e.g. `/open/api/transactions`), bypassing the OIDC Validator middleware chain.

`@Delete`
🗑️

#### Entity Deletion

Triggers full entity cleanup. Upon import, the generator purges all generated source code (models, controllers, repositories) and generates a database `DROP TABLE` migration.

Architectural Impact
Removes snapshots from .go-duck/, wipes Go files, and scaffolds drop SQL statements.

`@ArchiveStatus`
📦

#### Archival Ready

Triggers the injection of an `archived` boolean flag. This is functionally equivalent to writing `archived ` or `archived *` globally at the end of the file.

Architectural Impact
Automatically embeds a boolean archived column across PostgreSQL, MongoDB, and UI layers.

`@TrackViews`
👁️

#### Read Receipts

Enables zero-intrusion "seen/unseen" tracking. Generates shadow tables and specialized endpoints to track whether assigned users have viewed a record, natively injecting their Keycloak ID.

Architectural Impact
Scaffolds `{entity}_read_receipt` table, /assign-receivers, /view, and /tracking/toggle endpoints without polluting core schemas. Equivalent to writing `trackViews ` or `trackViews *` globally at the end of the file.

`@Document`
🍃

#### MongoDB-Backed Entity

Also written as `@isDocument`. Arguably the single most architecturally significant annotation in GDL — it flips the entity from PostgreSQL to MongoDB as its storage engine, swaps the primary key from a numeric `uint` to a string `ObjectID`, and is the trigger for all the cross-DB relationship handling described in the Hybrid-Store docs.

Architectural Impact
Routes the entity's repository through the MongoDB driver instead of GORM, and coerces IDs across any relationship that crosses the SQL/NoSQL boundary.

`@SoftDelete`
♻️

#### Recoverable Deletion

Trades hard `DELETE`s for a reversible flag. Deleted rows are hidden from normal queries but remain recoverable via trash/restore endpoints.

Architectural Impact
Adds a `deleted_at` column plus restore/trash logic across the controller and migrations. Equivalent to `softDelete ` or `softDelete *` globally at the end of the file.

`@Draftable`
📝

#### Draft / Publish Workflow

Gives the entity a proper editorial lifecycle. Records can be saved as work-in-progress drafts, linked back to the entity they're drafted from, and promoted to published state on demand.

Architectural Impact
Injects `IsDraft` / `DraftOfId` fields and scaffolds `/draft` and `/publish` endpoints. Equivalent to `draftable ` or `draftable *` globally at the end of the file.

`@ActiveStatus`
🟢

#### Active / Inactive Gating

Also written as `@IsActive`. Injects a boolean flag distinguishing live records from disabled ones, and gates the relevant controller logic behind it.

Architectural Impact
Adds an `isActive` boolean column (defaulting `TRUE`) and threads active/inactive checks through the generated controller.

## The Complete Power-Up Stack

```
// Entities can combine any number of power-ups
@Searchable @Audited @Federated
entity Transaction {
string(100) ref required unique
bigdecimal amount
datetime txDate
@Version int(32) v
}

```

Combining all three creates a globally synchronized, audited, and searchable entity with zero-trust integrity.

Next Category

🔮 Advanced Topics
