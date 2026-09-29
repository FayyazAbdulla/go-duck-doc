---
title: GDL getting started
description: Entities, enums, and relationships — the GO-DUCK blueprint language.
---

GDL (Go Duck Language) is the blueprint for a generated service. It describes entities, enums, and relationships. The generator uses it for the database schema, Protobuf, the GraphQL SDL, and Go repositories. Adding a field later produces a Goose migration instead of wiping data. See [CLI evolution](/guides/cli/).

A file has three building blocks: entities, enums, and relationships. Annotations such as `@Audited` and `@Federated` sit on the entity. Relationships are declared **outside** the entity block.

```text
// Define an elite entity with power-ups
@Audited @Federated
entity Customer {
    string(100) fullName required
    string(255) email unique
    datetime    lastLogin
}

// Define a directional relationship
relationship OneToMany {
    Customer{orders} to Order{customer}
}
```

## Where to go next

- [Entities and fields](/gdl/entities/) — types, `required`, `unique`, `default`
- [Relationships](/gdl/relationships/) — OneToMany, ManyToOne, OneToOne, ManyToMany
- [Annotations](/gdl/annotations/) — `@Federated`, `@Searchable`, `@isDocument`, `open`, and the rest
- [Advanced](/gdl/advanced/) — enums, file-level directives, public entities
