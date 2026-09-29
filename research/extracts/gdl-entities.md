# Source: gdl-entities.html

# Entities & Fields

Data Modeling & Type System

Entities represent the core data structures of your microservice. Each entity is mapped to a GORM model, a Protobuf message, and a PostgreSQL table.

## The Declaration Syntax

GDL supports two declaration styles for flexibility, though the Type-First approach is the modern standard for elite developers.

Modern Style (Type-First)

```
string(100) fullName required
datetime lastLogin
jsonb metadata

```

Classic Style (Field-First)

```
fullName String required
lastLogin DateTime
metadata JSONB

```

##

Comprehensive Financial Entity Example

This real-world example demonstrates the use of high-precision numeric types like `Double` and `BigDecimal` alongside standard types, modifiers, and entity annotations.

```
@Audited
@Searchable
entity Transaction {
uuid externalRef required unique // Maps to UUID
string(50) transactionId required unique // Maps to VARCHAR(50)
string currency required // Maps to VARCHAR(255)
text notes // Maps to TEXT
int attemptCount // Maps to INTEGER
long userId required // Maps to BIGINT
float fee // Maps to REAL and float32
double exchangeRate // Maps to DOUBLE PRECISION and float64
bigdecimal amount required // Maps to NUMERIC(19,4) and decimal.Decimal
bool isInternational // Maps to BOOLEAN
time cutoffTime // Maps to TIME and time.Time
datetime processedAt // Maps to TIMESTAMP and time.Time
instant createdAt // Maps to TIMESTAMP and time.Time
jsonb metadata // Maps to JSONB
json rawPayload // Maps to JSON
}

```

Heads up: don't name a field `id`. Every entity already gets a hardcoded primary-key `ID` field, and Go's capitalization rules turn a field named `id` into a second struct field that collides with it in JSON output — one of the two silently disappears.

## Global Type System Reference

GDL Type
Go Native
SQL (Postgres)

string(N)
string
VARCHAR(N)

text
string
TEXT

int / integer
int32
INTEGER

long
int64
BIGINT

float
float32
REAL

double
float64
DOUBLE PRECISION

bigdecimal
decimal.Decimal
NUMERIC(19, 4)

bool / boolean
bool
BOOLEAN

json / jsonb
datatypes.JSON
JSON / JSONB

datetime / instant
time.Time
TIMESTAMP

time
time.Time
TIME

uuid
uuid.UUID
UUID

LocalDate
time.Time
DATE

ZonedDateTime
time.Time
TIMESTAMP

Duration
int64
BIGINT

AnyBlob / ImageBlob / Blob
[]byte
BYTEA

TextBlob
string
TEXT

[Type] / List(Type) / List<Type>
[]Type
JSONB

⛔

The parser rejects the type `date` outright. It's not an alias for anything — declaring a field as `date` throws a compile-time error telling you to use `LocalDate` for calendar dates, `Instant`/`DateTime` for timestamps, or `Time` for time-only values instead.

## Field Modifiers

required

#### Strict Integrity

Adds `NOT NULL` to the SQL schema and marks the field as required in Protobuf and Gin validation hooks.

unique

#### Natural Key Protection

Automatically creates a unique index in PostgreSQL to prevent duplicate records across all silos.

default=<value>

#### Default Fallback Values

Injects SQL DEFAULT constraints and dynamically adjusts Gin binding rules. Supports Enums (`default=DRAFT`), Booleans (`default=TRUE`), Numerics (`default=1.5`), and quoted Strings (`default="Hello"`).

Next Category

🧬 Relationships
