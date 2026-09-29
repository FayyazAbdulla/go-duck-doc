# Source: gdl.html

# Introduction to GDL

Go Duck Language Specification

GDL (Go Duck Language) is the evolutionary blueprint of your ecosystem. It is a stateful, high-fidelity modeling language designed to describe entities, relationships, and infrastructure power-ups in a human-readable format.

###
🌱
One Truth

Unlike standard generators, GDL is the single source of truth for your Database schema, Protobuf definitions, GraphQL types, and Go Repository logic.

###
🔄
Stateful Evolution

The GDL engine tracks schema deltas. Adding a field in GDL automatically generates the corresponding Goose SQL Migration without wiping your data.

## The Basic Anatomy

A GDL file is composed of three primary building blocks: Entities, Enums, and Relationships.

schema.gdl
DUCK-ENGINE-V3

```
// Define an elite entity with power-ups
@Audited @Federated
entity Customer {
string(100) fullName required
string(255) email unique
datetime lastLogin
}

// Define a directional relationship
relationship OneToMany {
Customer{orders} to Order{customer}
}

```

Next Category

Entities & Fields

Reference

CLI Usage
