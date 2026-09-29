# Source: gdl-advanced.html

# Advanced Topics

Enums, Security & Public APIs

Beyond core data modeling, GDL provides the tools to define typed constants and fine-tune the granular security of your API endpoints.

## The Typed Truth: Enums

Enums (Enumerated Types) allow you to define a fixed set of allowed values for a field. GDL enums are high-fidelity, generating Go string-enums, Protobuf enums, and GraphQL enums simultaneously.

GDL Definition

```
enum OrderStatus {
PENDING,
SHIPPED,
DELIVERED,
CANCELLED
}

```

Usage in Entity

```
entity Order {
OrderStatus status required
datetime orderDate
}

```

## File-Level Global Directives

Some behaviors don't need to live inside an entity block at all. GDL supports four top-level statements that apply a behavior to a named entity, or to every entity in the file at once via `*`. Each one is functionally equivalent to writing the matching annotation (`@ArchiveStatus`, `@SoftDelete`, `@Draftable`, `@TrackViews` — see the Power-up Annotations page) directly on the entity.

`archived | *`
Injects a boolean `archived` flag on the target entity, or every entity when given `*`.

`softDelete | *`
Enables recoverable, reversible deletion (a `deleted_at` column plus restore/trash logic) instead of hard deletes.

`draftable | *`
Adds the draft/publish workflow (`IsDraft` / `DraftOfId` fields, `/draft` and `/publish` endpoints).

`trackViews | *`
Scaffolds read-receipt tracking (shadow table, assign/view/toggle endpoints) for the target entity or every entity.

// Applies to a specific entity, or all of them with *
softDelete Customer

draftable *

trackViews Order

## Public / Open Entities

By default, all GO-DUCK endpoints require a valid Keycloak JWT. The `open` keyword allows you to selectively disable authentication for specific entities with action-level granularity.

`open EntityName`
Disables authentication for ALL actions (Read, Create, Update, Delete) on the entity. Caution: Use with care!

`open Entity(read, create)`
Surgical precision. For example, allowing public read and create while requiring admin JWT for updates/deletes.

// Complete GDL Schema Fragment
enum ArticleStatus { PUBLISHED, DRAFT }

entity Article {

string(255) title required

text content

ArticleStatus status

}

// Allow public reading of articles, but require JWT for mutations

open Article(read)

Back to Reference

CLI Usage
