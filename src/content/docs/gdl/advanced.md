---
title: Advanced GDL
description: Enums, file-level directives, and public entity access.
---

## Enums

Enums become Go string enums, Protobuf enums, and GraphQL enums.

```text
enum OrderStatus {
    PENDING,
    SHIPPED,
    DELIVERED,
    CANCELLED
}

entity Order {
    OrderStatus status required
    datetime orderDate
}
```

Use an enum with [`default`](/gdl/entities/), for example `default=DRAFT`.

## File-level directives

These apply to one entity, or to every entity in the file when the target is `*`. Each one matches an [annotation](/gdl/annotations/).

| Directive | Annotation | What it adds |
|-----------|------------|----------------|
| `archived Name`, `archived A,B`, or `archived *` | `@ArchiveStatus` | `archived` boolean |
| `softDelete Name` or `softDelete *` | `@SoftDelete` | `deleted_at`, trash and restore |
| `draftable Name` or `draftable *` | `@Draftable` | `IsDraft`, `DraftOfId`, `/draft`, `/publish` |
| `trackViews Name` or `trackViews *` | `@TrackViews` | Read-receipt table and endpoints |

The contributor guide also accepts a comma-separated list on each of these, for example `softDelete Staff,Customer`.

```text
softDelete Customer
draftable *
trackViews Order
```

## Public access

Generated routes require a Keycloak JWT unless you opt out.

```text
enum ArticleStatus { PUBLISHED, DRAFT }

entity Article {
    string(255) title required
    text content
    ArticleStatus status
}

open Article(read)
```

| Form | Effect |
|------|--------|
| `open EntityName` | No JWT for read, create, update, and delete on that entity |
| `open Entity(read, create)` | Only the named actions are public |

`open` can also sit inside the entity block, as in the home-page sample `open (read, list)`. Public routes are prefixed with `/open` before the API prefix.

The [gateway](/features/gateway/) does not re-authenticate proxied calls, so an `open` route stays public when traffic arrives through the proxy.
