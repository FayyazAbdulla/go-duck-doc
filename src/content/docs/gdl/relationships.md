---
title: Relationships
description: GDL associations declared outside entity blocks.
---

Relationships sit outside entity blocks. They are directional. The generator adds foreign keys, GORM preload, and nested Protobuf fields from these declarations.

```text
relationship OneToMany {
    Customer{orders} to Order{customer}
}
```

## Types

One-to-many — one parent, many children:

```text
relationship OneToMany {
    Customer{orders} to Order{customer}
}
```

Many-to-one — many rows point at one shared row. The sample names only the child side:

```text
relationship ManyToOne {
    Car{manufacturer} to Manufacturer
}
```

One-to-one:

```text
relationship OneToOne {
    User{profile} to Profile{user}
}
```

Many-to-many — the generator emits a GORM `many2many:` join table:

```text
relationship ManyToMany {
    Student{courses} to Course{students}
}
```

## `required`

```text
relationship OneToMany {
    Customer{orders} to Order{customer} required
}
```

`required` checks that the related row exists at the database and at the API.

## SQL and MongoDB

Crossing PostgreSQL and MongoDB only works through a `relationship` block. The generator then emits both `gorm` and `bson` tags and coerces `uint` vs string ObjectID. An inline field such as `User owner` is not recognized and becomes `interface{}`. See [Hybrid-Store](/features/hybrid-store/).
