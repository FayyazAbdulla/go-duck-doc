---
title: Hybrid-Store
description: PostgreSQL and MongoDB in one generated service.
---

PostgreSQL is the default store (registries, relational entities). [`@isDocument`](/gdl/annotations/) (also written `@Document`) stores that entity in MongoDB. Turn the engine on with `datasource.mongodb.enabled`. If it is false, document entities are not supported.

Both engines sit behind one repository interface used by REST and gRPC.

## Identity types

| Engine | ID | Mapping |
|--------|----|---------|
| PostgreSQL | `uint` | GORM primary key, auto-increment |
| MongoDB | `string` | `primitive.ObjectID` hex |

## Cross-database relationships

Declare the link with a `relationship` block. That block is what triggers cross-engine handling: both `gorm` and `bson` tags are written on the struct, and id types are coerced.

```text
entity User {
    string email required
}

@isDocument
entity Profile {
    string bio
    string avatar
}

relationship OneToOne {
    Profile{owner} to User
}
```

An inline field such as `User owner` is not mapped. It becomes `interface{}`.

`@isDocument` entities may use nested brace structures in GDL. Those map to nested BSON.

Federated reads ([`?federated=true`](/features/federation/)) spawn goroutines against both PostgreSQL and MongoDB silos and merge the result.
