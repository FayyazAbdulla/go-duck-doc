---
title: Entities and fields
description: GDL entity syntax, type map, and field modifiers.
---

Each entity becomes a GORM model, a Protobuf message, and a PostgreSQL table — unless it is marked [`@isDocument`](/gdl/annotations/), in which case it is stored in MongoDB.

## Two declaration styles

Type-first is the style the source calls current:

```text
string(100) fullName required
datetime lastLogin
jsonb metadata
```

Field-first still parses:

```text
fullName String required
lastLogin DateTime
metadata JSONB
```

## Do not name a field `id`

Every entity already has a primary-key field `ID`. A field named `id` exports to the same Go name. One of the two disappears from JSON.

## Example

```text
@Audited
@Searchable
entity Transaction {
    uuid externalRef required unique
    string(50) transactionId required unique
    string currency required
    text notes
    int attemptCount
    long userId required
    float fee
    double exchangeRate
    bigdecimal amount required
    bool isInternational
    time cutoffTime
    datetime processedAt
    instant createdAt
    jsonb metadata
    json rawPayload
}
```

## Type map

| GDL | Go | PostgreSQL |
|-----|----|------------|
| `string(N)` | `string` | `VARCHAR(N)` |
| `text` | `string` | `TEXT` |
| `int` / `integer` | `int32` | `INTEGER` |
| `long` | `int64` | `BIGINT` |
| `float` | `float32` | `REAL` |
| `double` | `float64` | `DOUBLE PRECISION` |
| `bigdecimal` | `decimal.Decimal` | `NUMERIC(19, 4)` |
| `bool` / `boolean` | `bool` | `BOOLEAN` |
| `json` / `jsonb` | `datatypes.JSON` | `JSON` / `JSONB` |
| `datetime` / `instant` | `time.Time` | `TIMESTAMP` |
| `time` | `time.Time` | `TIME` |
| `uuid` | `uuid.UUID` | `UUID` |
| `LocalDate` | `time.Time` | `DATE` |
| `ZonedDateTime` | `time.Time` | `TIMESTAMP` |
| `Duration` | `int64` | `BIGINT` |
| `AnyBlob` / `ImageBlob` / `Blob` | `[]byte` | `BYTEA` |
| `TextBlob` | `string` | `TEXT` |
| `[Type]` / `List(Type)` / `List<Type>` | `[]Type` | `JSONB` |

The parser rejects the type `date`. It is not an alias. Use `LocalDate` for a calendar date, `Instant` or `DateTime` for a timestamp, or `Time` for time-of-day.

## Modifiers

| Modifier | Effect |
|----------|--------|
| `required` | `NOT NULL`, and required in Protobuf and Gin validation |
| `unique` | Unique index |
| `default=<value>` | SQL default and Gin binding fallback |

`default` examples from the source: `default=DRAFT` (enum), `default=TRUE`, `default=1.5`, `default="Hello"`.

Field-level [`@Version`](/gdl/annotations/) is an annotation on a field you declare, not a column the generator invents for you.
