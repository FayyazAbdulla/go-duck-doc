# Source: hybrid-store.html

# Hybrid-Store Architecture

SQL + NoSQL Heterogeneous Persistence

GO-DUCK represents the pinnacle of modern persistence strategy, enabling the seamless coexistence of PostgreSQL (for relational logic) and MongoDB (for high-velocity document storage) within a single microservice.

#### PostgreSQL Core

Default store for system registries, billing, and relational entities requiring strict ACID compliance.

#### MongoDB Engine

Triggered via `@isDocument`. Handles nested JSON structures and high-throughput document access.

#### Unified Repository

A single internal interface abstracts both engines, ensuring logic parity across REST and gRPC.

## 1. Cross-Database Soft Relationships

One of the most complex challenges in hybrid architectures is maintaining relationships across different database engines. GO-DUCK solves this with Dynamic ID Mapping:

```
// Relationship across SQL and MongoDB
entity User { // PostgreSQL (relational)
string email required
}

@isDocument
entity Profile { // MongoDB (document)
string bio
string avatar
}

relationship OneToOne {
Profile{owner} to User
}
```

GO-DUCK automatically detects that `Profile` is NoSQL and `User` is SQL. The `relationship` block — not a plain inline field — is what actually triggers the cross-DB handling: to ensure 100% structural parity between PostgreSQL and MongoDB, the generator unconditionally injects both `gorm:"..."` and `bson:"..."` tags onto the generated Go struct, and coerces the dynamic ID typing (`string` vs `uint`) across the relationship automatically. Declaring an entity-typed field directly (e.g. `User owner`) instead of a `relationship {}` block isn't recognized by the type mapper and silently falls back to a useless `interface{}` — always use a `relationship` block to cross the SQL/NoSQL boundary.

## 2. Federated Parallel Harvester 2.0

When executing multi-tenant "Harvest" operations (e.g., getting all Users across 50 authorized silos), GO-DUCK uses Heterogeneous Parallel Execution.

🚀

#### Concurrency Paradigm

The Harvester spawns goroutines that simultaneously query PostgreSQL and MongoDB silos. Results are aggregated into a single, unified response stream, regardless of the underlying storage engine for each entity.

## 3. BSON & Recursive GDL Support

Entities marked with `@isDocument` support deep nested brace structures in GDL, which map directly to recursive BSON tags in Go:

Storage Engine
ID Type
Key Mapping

PostgreSQL
`uint`
GORM Primary Key / Auto-Increment

MongoDB
`string`
BSON `primitive.ObjectID` (hex-mapped)

Previous Category

🌐 Federated Architecture

Next Category

🚀 Serverless Docs
