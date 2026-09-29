# GO-DUCK CLI

<p align="center">
  <img src="https://goduck.theheavenscode.com/logo.png" alt="Go-Duck Logo" width="200"/>
</p>

<h1 align="center">GO-DUCK: The Evolutionary Architecture Factory</h1>

<p align="center">
  Where high-velocity Gophers meet the versatile wisdom of the Duck to scaffold microservices that thrive in chaos.
</p>

<p align="center">
  <a href="https://badge.fury.io/js/go-duck-cli"><img src="https://badge.fury.io/js/go-duck-cli.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/ISC"><img src="https://img.shields.io/badge/License-ISC-blue.svg" alt="License: ISC"></a>
  <img src="https://img.shields.io/badge/version-2.0.6-blue" alt="Version 2.0.6">
  <img src="https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white" alt="Node 18+">
  <img src="https://img.shields.io/badge/go-1.21%2B-00ADD8?logo=go&logoColor=white" alt="Go 1.21+">
</p>

---

## 🤝 What is this thing, actually?

GO-DUCK is a CLI that reads a schema you write in a tiny DSL called **GDL** (Go-Duck Language) plus a `config.yaml`, and hands you back a **complete, buildable Go microservice** — Gin REST, Kratos gRPC, GraphQL, GORM/MongoDB models, Goose migrations, Swagger/Postman docs, Docker, and Kubernetes manifests. All wired together, all compiling, no "TODO: implement this" left behind.

Think of it less as a scaffolding toy and more as a compiler whose target language happens to be "a production-shaped Go service." You describe *what* your data looks like; GO-DUCK writes the *how*.

**The honest pitch, no lore required:**
- Write your entities once in GDL — get REST + gRPC + GraphQL for free, in sync, forever.
- Multi-tenant by default, with a database-per-tenant model that doesn't leak physical DB names to clients.
- Re-run the generator after changing your schema (`import-gdl`) and it computes the *delta* — new columns, dropped tables, altered types — instead of nuking your hand-written business logic.
- Ships security, caching, telemetry, and authorization out of the box, not as homework you do in month three.

If that's all you needed to hear, skip straight to the [⏱️ 60-Second Quick Start](#-60-second-quick-start). Everyone else, grab a coffee — there's a whole legend below if you want the backstory (there's a video, even).

---

## ⏱️ 60-Second Quick Start

```bash
# 1. Install the CLI globally
npm install -g go-duck-cli

# 2. Bootstrap a config + folder structure in an empty directory
mkdir my-app && cd my-app
go-duck init

# 3. Generate the microservice (config.yaml + GDL files → real Go project)
go-duck create -c config/config.yaml -g gdl -o .

# 4. Spin up Postgres/Mongo/Redis/Keycloak locally and run it
docker-compose up -d
go run main.go
```

That's it — you now have a running Gin server on `:8080`, a Kratos gRPC service on `:9000`, and Swagger docs waiting for you. No, seriously, that's the whole onboarding. Everything past this point is "now that it's running, here's how deep the rabbit hole goes."

> [!TIP]
> Prefer clicking boxes to writing YAML? Run `go-duck gdl-planner -p 8000` first and design your entities visually in the browser, then export straight to a `.gdl` file. Drag-and-drop, no judgment.

---

## 🗺️ Where to look

This README is long because the framework is generous, not because we like scrolling. Rough map, in reading order:

- **Requirements & Installation** — the boring but mandatory bit.
- **The Legend** — origin story, skip freely, contains one video.
- **GDL 101** — the schema language: data types, modifiers, annotations, a full worked example.
- **CLI Command Reference** — every command, every flag, real examples.
- **`config.yaml` Reference** — the other half of the input.
- **Architecture Deep Dives** — multi-tenancy, DuckGuard ACL, protocols, telemetry, K8s deploy.
- **The API Arsenal** — what your generated service exposes without you writing a line of Go.
- **Achievement Log** — the fun scoreboard, and where the *real* changelog lives.
- **Known Gaps** — the parts we haven't gotten to yet, said out loud on purpose.

---

## 💾 Requirements & Installation

| Requirement | Version | Why |
| :--- | :--- | :--- |
| **Node.js** | 18+ | Runs the generator itself. |
| **Go** | 1.21+ | Builds the microservice GO-DUCK writes for you. |
| **Docker** | 20+ | Runs Postgres/Mongo/Redis/Keycloak locally, and ships your final image. |
| **Docker Compose** | v2+ | Orchestrates the local dependency stack. |
| **`protoc`** | latest | Only if you touch gRPC — compiles the Kratos Protobuf contracts. |

```bash
npm install -g go-duck-cli
go-duck --help   # sanity check: you should see create, import-gdl, validate-gdl, and friends
```

---

## 🦆 The Legend of the Century *(purely optional reading)*

[Watch the intro video](https://goduck.theheavenscode.com/intro.mp4) if you have three spare minutes and enjoy Silicon Valley folklore with web frameworks as protagonists.

In the legendary Silicon Valley of Code, a nomadic Gopher — lightning-fast and known for his tireless concurrency — crossed paths with a Duck from the Great Persistence Bayou. The Duck held the wisdom of adaptability and the secret to navigating ever-shifting business tides. They realized that while the Gopher built fast, the Duck built to survive. Together, they forged a pact to create the **Generator of Kings**.

### Gin Gonic Tonic: The Refreshment of Performance

To fuel their grand design, they sought the Legendary Bottle of Gin. This magical brew wasn't just for hydration; it transformed their web routing into a crystalline, high-performance flow. Routes became fast, middleware became transparent, and the developer experience became as refreshing as a cold tonic on a summer's day. This gave **GO-DUCK** its distinctive, lightweight spirit.

<p align="center">
  <img src="https://goduck.theheavenscode.com/gin_bottle.png" alt="Go-Duck Feature 1" width="400"/>
</p>

### The Armor of the Divine: Mark of Kratos

But speed without strength is a house made of cards. In the digital forge of the underworld, they recovered the Mark of Kratos. By stamping this sigil onto their internal services, they achieved gRPC industrial resilience. Every service became armored with strict Protocol Buffer contracts, ensuring that no matter how hard the system scaled, it would never break under the divine weight of technical debt.

<p align="center">
  <img src="https://goduck.theheavenscode.com/kratos_mark.png" alt="Go-Duck Feature 2" width="400"/>
</p>

### The GDL Genesis

Thus, the **GDL (Go-Duck Language)** was hatched. A single, simple tongue that could command entire legions of code. From that day forth, every developer who whispered GDL into the CLI would see their architecture evolve — bringing the Gopher's speed, the Duck's wisdom, the Gin's clarity, and the Kratos' strength into a single, unified masterpiece.

*(Legend concludes. Normal documentation resumes below. No further mythology, we promise — except one small scoreboard near the bottom, because we're proud of it.)*

---

## 🧱 GDL 101: The Schema Language

GDL is the DSL you write once and GO-DUCK compiles into models, controllers, migrations, Protobuf, GraphQL types, and Swagger — all four representations of your data, always in sync, because they all come from the same source of truth.

### Data Types

| GDL Type | Go Equivalent | PostgreSQL Equivalent | Notes |
| :--- | :--- | :--- | :--- |
| `String` | `string` | `VARCHAR(255)` | Standard short text. |
| `String(N)` | `string` | `VARCHAR(N)` | Custom-length variable string. |
| `Text` | `string` | `TEXT` | Unbounded long-form text. |
| `Integer` / `Int` | `int32` | `INT` | 32-bit integer. |
| `Long` | `int64` | `BIGINT` | 64-bit integer. |
| `Float` | `float32` | `REAL` | Single-precision float. |
| `Double` | `float64` | `DOUBLE PRECISION` | Double-precision float. |
| `BigDecimal` | `decimal.Decimal` | `NUMERIC(19, 4)` | High-precision decimal — use this for money, not `Float`. |
| `Boolean` / `Bool` | `bool` | `BOOLEAN` | True/False. |
| `Time` | `time.Time` | `TIME` | Time of day, no timezone. |
| `LocalDate` | `time.Time` | `DATE` | Calendar date only. |
| `Datetime` / `Instant` | `time.Time` | `TIMESTAMP` | Full date and time. |
| `JSON` / `JSONB` | `datatypes.JSON` | `JSONB` | Freeform structured document — filterable by inner key via arrow-path notation, see [The API Arsenal](#-the-api-arsenal). |
| `[Type]` / `List(Type)` / `List<Type>` | `[]Type` | `JSONB` | Arrays — JSONB in Postgres, native BSON arrays in Mongo. |
| *(Enum Name)* | `string` / custom Enum | `VARCHAR(50)` | Reference a declared `enum` block. |

### Field Modifiers

Append these directly to a field definition:

| Modifier | SQL Translation | Description |
| :--- | :--- | :--- |
| `required` | `NOT NULL` | Field cannot be null. |
| `unique` | `UNIQUE` | Adds a unique index constraint. |
| `default=<value>` | `DEFAULT <value>` | Sets a default in both SQL and the Go struct tags. Quote string values: `default="DRAFT"`. |

### Entity & Field Annotations

Annotations turn a plain CRUD entity into something with opinions. Stack as many as you need.

| Annotation | Applies to | What it does |
| :--- | :--- | :--- |
| `@Document` / `@isDocument` | Entity | Store this entity in MongoDB instead of PostgreSQL. |
| `@Searchable` | Entity | Index it in Elasticsearch for hybrid Lucene + JPA-filter search. |
| `@Federated` | Entity | Synchronize/broadcast this entity's writes across every tenant silo. |
| `@Audited` | Entity | Log every mutation to `audit_log`, tagged with the acting Keycloak identity. |
| `@Draftable` | Entity | Adds an `is_draft` column plus `/draft` and `/publish` endpoints. |
| `@SoftDelete` | Entity | Adds `deleted_at`, hides trashed rows from normal queries, adds `/trashed` and `/restore`. |
| `@TrackViews` | Entity | Zero-intrusion "seen/unseen" tracking via a `{entity}_read_receipt` shadow table. |
| `@ArchiveStatus` | Entity | Injects an `archived` boolean across Postgres, Mongo, and Go. |
| `@ActiveStatus` / `@IsActive` | Entity | Defaults `isActive` to `true` on creation without breaking zero-value semantics. |
| `@Embed` | Entity | Marks a nested structure as embedded rather than its own table/collection. |
| `@Delete` | Entity | Marks the entity for removal — the next `import-gdl` purges its models, controllers, and Kratos artifacts. |
| `@Version` | Field | Enables optimistic locking (`@Version` concurrency control) on that column. |

### A Worked Example

```gdl
// ==============================================================================
// 🦆 GO-DUCK ELITE DEALERSHIP BLUEPRINT
// ==============================================================================

/**
 * Car: Relational Entity stored in PostgreSQL.
 * @Searchable: Enable Spring-style fuzzy search on make/model.
 * @Federated:  Synchronize history across all dealership silos.
 * @Audited:    Track every modification with Zero-Trust Keycloak IDs.
 */
@Searchable @Federated @Audited
entity Car {
    string(100) make     required
    string(100) model    required
    int(32)     year     required
    bigdecimal  price
    string(50)  vin      unique
    jsonb       metadata
}

/**
 * Patient: MongoDB Document Entity.
 * @Document: Stored in MongoDB instead of PostgreSQL.
 */
@Document
entity Patient {
    string name required
    clinicalData {
        vitals {
            int bpm
            float temp
        }
        history [String]
    }
}

/**
 * ArticleStatus: Native Enum Support.
 * GO-DUCK generates Go Enums, GraphQL Enums, and Proto definitions.
 */
enum ArticleStatus {
    DRAFT, PUBLISHED, ARCHIVED
}

// 🦆 RELATIONSHIPS: Build the Graph
relationship OneToMany {
    Customer{car} to Car{owner}
}

// 🦆 SECURITY: Define Public/Auth Access
open Car(read)

// 🦆 DIRECTIVES: Global Domain Rules
softDelete *
archived Patient
```

Relationship types supported: `OneToMany`, `ManyToOne`, `OneToOne`, `ManyToMany` — all four compile to correct GORM associations, GraphQL resolver graphs, and Goose migrations, join tables included.

---

## 🚀 CLI Command Reference

| Command | What it does |
| :--- | :--- |
| [`init`](#go-duck-init) | Bootstrap a fresh `config.yaml` + folder layout in an empty directory. |
| [`create`](#go-duck-create) | Full scaffold: `config.yaml` + GDL → a complete Go microservice. |
| [`import-gdl <path>`](#go-duck-import-gdl-path) | **Stateful incremental update.** Diffs against the last snapshot, emits only the delta. Supports `--dry-run`. |
| [`validate-gdl <path>`](#go-duck-validate-gdl-path) | Static analysis only — no files written. Your pre-flight check. |
| [`generate-angular-sdk <path>`](#go-duck-generate-angular-sdk-path) | Emit a typed Angular SDK straight from your GDL. |
| [`gdl-planner`](#go-duck-gdl-planner) | Drag-and-drop visual schema builder in the browser. |
| [`serve`](#go-duck-serve) | Interactive GUI + live documentation preview server. |
| [`create-gateway`](#go-duck-create-gateway) | Scaffold **Strait of Duck Gateway (SDG)** — the standalone Kubernetes-discovery reverse-proxy service. |

### `go-duck init`

Bootstraps `config/config.yaml` (and matching folders) in the current directory. Run this once, in an empty folder, before your first `create`.

```bash
go-duck init
```

### `go-duck create`

The main event. Reads your config and GDL files and writes a complete Go microservice.

```bash
go-duck create [options]
```

| Flag | Default | Description |
| :--- | :--- | :--- |
| `-c, --config <path>` | `../CONFIG/config.yaml` | Path to your `config.yaml`. |
| `-o, --output <path>` | `.` | Where to generate the project. |
| `-g, --gdl <path>` | `../GDL` | Directory containing your `.gdl` files. |
| `--preserve-root` | off | Skip regenerating `main.go`, `push.sh`, and `devops/` — protects hand-edited bootstrap files. |

```bash
go-duck create -c my-app/config.yaml -o my-app -g my-app/gdl
```

### `go-duck import-gdl <path>`

Your day-two command. Feed it a changed (or new) `.gdl` file and it diffs against the `.go-duck/` snapshot, updates only what changed, and emits the matching Goose migration — `ADD COLUMN`, `DROP TABLE`, the works.

```bash
go-duck import-gdl <file> [options]
```

| Flag | Description |
| :--- | :--- |
| `-o, --output <path>` | Target app root (default `.`). |
| `--preserve-root` | Skip overwriting `main.go`, `push.sh`, `devops/` — same as in `create`. |
| `--smart` | Strict semantic validation: rejects reserved SQL keywords, wrong boolean/date naming conventions, before generating anything. |
| `--reset` / `--rebase` | Ignore every `// @go-duck-preserve` needle and force a total overwrite. Nuclear option — use it to reset a file back to generator-zero. |
| `--dry-run` | Run the whole import — diff, migrations, everything — without writing a single file. Prints every migration's full SQL (destructive statements flagged in red) and a one-line summary of every other file that would change. |

```bash
# Standard stateful import, preserving custom root logic
go-duck import-gdl new-entities.gdl -o my-existing-app --preserve-root

# Same, but with strict semantic validation enforced
go-duck import-gdl new-entities.gdl -o my-existing-app --preserve-root --smart

# See exactly what would happen — including the DROP statements — before committing to it
go-duck import-gdl new-entities.gdl -o my-existing-app --dry-run
```

> [!TIP]
> `import-gdl` will happily generate `DROP TABLE` / `DROP COLUMN` statements for anything you removed from your GDL. Run it with `--dry-run` first — it prints the exact migration SQL, flags anything destructive, and touches nothing on disk — then re-run without the flag once you like what you see.

### `go-duck validate-gdl <path>`

Static analysis, zero side effects. Runs automatically before every `create` / `import-gdl`, but you can run it standalone as a pre-commit sanity check.

```bash
go-duck validate-gdl <file> [options]
```

| Flag | Description |
| :--- | :--- |
| `--smart` | Adds semantic/naming rules: reserved SQL keywords, casing collisions, `is*`/`has*` boolean naming, `*At`/`*Date`/`*Time` date naming. |

```bash
go-duck validate-gdl new-entities.gdl --smart
```

### `go-duck generate-angular-sdk <path>`

Parses your GDL and produces a fully-typed, Reactive-Forms-ready Angular SDK: TypeScript interfaces, enums, form builders, and `HttpClient` services, MessagePack interceptor included.

```bash
go-duck generate-angular-sdk <path> [options]
```

| Flag | Default | Description |
| :--- | :--- | :--- |
| `-o, --output <path>` | `.` | Where to write the generated SDK. |

```bash
go-duck generate-angular-sdk ./GDL -o ../my-angular-app/src/app/core/sdk
```

### `go-duck gdl-planner`

Launches a browser-based drag-and-drop canvas for designing entities, relationships, nested BSON objects, and enums visually — then exports straight to a `.gdl` file for people who'd rather click than type curly braces.

```bash
go-duck gdl-planner -p 8000
# → http://localhost:8000
```

### `go-duck serve`

Starts an interactive GUI plus a live documentation preview server, in case you want to browse what you're about to generate before committing to it.

```bash
go-duck serve
# → http://localhost:2026
```

### `go-duck create-gateway`

Scaffolds **Strait of Duck Gateway (SDG)** — a standalone Go service, separate from the entity/GDL pipeline entirely, detailed in full under [🌉 Strait of Duck Gateway](#-strait-of-duck-gateway-sdg) below.

```bash
go-duck create-gateway [options]
```

| Flag | Default | Description |
| :--- | :--- | :--- |
| `-c, --config <path>` | `../CONFIG/strait-of-duck-config/config.yaml` | Path to the gateway's own config, rooted at a `strait-of-duck:` key (not `go-duck:`). |
| `-o, --output <path>` | `.` | Where to generate the gateway project. |

```bash
go-duck create-gateway -c CONFIG/strait-of-duck-config/config.yaml -o my-gateway
```

---

## ⚙️ `config.yaml` Reference

The other half of the equation. Must start with the top-level `go-duck:` key. Reference variants for common topologies live in `CONFIG/` — `config-hybrid.yaml`, `config-mongo-only.yaml`, `config-psql-only.yaml`, `config-serverless.yaml` — copy whichever matches your stack and edit from there.

```yaml
go-duck:
  name: "my-app"
  version: "1.0.0"
  description: "GO-DUCK Scaffolded Microservice"
  # Stamped as the goduck.io/environment K8s label for Strait of Duck Gateway
  # discovery scoping (create-gateway). Defaults to "prod" if omitted.
  environment-tag: "prod"

  # --- Network & Server Layer ---
  server:
    port: 8080
    grpc:
      addr: ":9000"
      network: "tcp"
      timeout: "1s"
    cors:
      allow-origins: ["*"]
      allow-methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
      allow-headers: ["Origin", "Content-Type", "Accept", "Authorization", "X-Tenant-ID"]

  # --- Persistence Layer (Hybrid Store) ---
  datasource:
    # PostgreSQL (Relational Registry & Entity Store)
    host: "localhost"
    port: 5432
    username: "postgres"
    password: "password"
    database: "my_app_db"
    ssl-mode: "disable"
    # MongoDB (Document Entity Store)
    mongodb:
      enabled: true
      uri: "mongodb://localhost:27017"
      database: "my_app_mongo"

  # --- Security & Identity (Keycloak/OIDC) ---
  security:
    keycloak-host: "http://localhost:8080"
    keycloak-realm: "my-realm"
    keycloak-app-client-id: "my-app"
    keycloak-service-client-id: "my-service"
    keycloak-service-secret: "service-secret-123"
    super-admin-role: "admin"
    confidential-mode: true
    rate-limit:
      rps: 100
      burst: 200
    # DuckGuard ACL cache TTL — see "How the rules get from the database to
    # your request, fast" below.
    access-policy:
      cache-ttl: "30s"

  # --- Telemetry & Metrics ---
  telemetry:
    otel:
      enabled: true
      endpoint: "localhost:4317"
    metrics:
      prometheus-enabled: true
      stream-enabled: true
      stream-interval: "1s"

  # --- Federated Multi-Tenancy ---
  multitenancy:
    enabled: true
    hide-silo-names: false
```

---

## 🏛️ Architecture Deep Dives

### 🗺️ Federated Multi-Tenancy & the Triple-Identity Registry

GO-DUCK's multi-tenancy is **database-per-tenant**, not row-level (`WHERE tenant_id = ?`). Each tenant gets its own isolated database, and to keep physical database names from ever reaching a client — and to make ID enumeration attacks pointless — every request is resolved through a three-layer indirection:

**Keycloak realm role** (`dealer_tokyo`) → **opaque UUID** exposed to clients via `X-Tenant-ID` → **physical database name** (`dealership_silo_japan_prod`)

<p align="center">
  <img src="https://goduck.theheavenscode.com/triple_identity_registry.png" alt="Triple-Identity Registry Topology" width="800"/>
</p>

A few things worth knowing before you rely on this in production:

- **Zero-trust fallback**: a request carrying an explicit `X-Tenant-ID` that resolves to zero tenant mappings is *rejected* (403 / gRPC `PermissionDenied`) — a wrong or stale tenant UUID never silently falls back to the master database. (A request with no `X-Tenant-ID` at all still resolves your default silo from your realm role, and only falls back to the master DB if your role itself has zero provisioned silos.)
- **Precision Harvesting**: pass a comma-separated `X-Tenant-ID` and GO-DUCK resolves directly to those silos, spawning goroutines only for the tenants you named — no wasted fan-out. By default the opaque UUID is the credential on its own, independent of which realm role you're holding: it's handed out per-grant via `GET /api/silos/me`, so whoever holds a valid tenant UUID can route a request to that silo. `admin_db` is the one silo this never grants access to unless you also hold the super-admin role.
- **`multitenancy.require-role-grant`**: flip this to `true` if you'd rather not trust UUID-possession alone. In that mode `X-Tenant-ID` additionally requires the caller's own realm role to carry an explicit `tenant_roles` grant for that specific tenant — i.e. per-user provisioning onto a secondary silo, not just knowing its UUID. Defaults to `false` (UUID-sufficient).
- **Industrial-Grade Parallel Harvester**: opt into cross-silo aggregation with `?federated=true` for genuinely parallel, goroutine-based multi-silo queries.
- **Lazy, thread-safe silo connections**: each tenant's DB pool is a lazily-initialized, kept-warm singleton guarded by its own `sync.Once` — cold silos migrate under an advisory lock and don't stall lookups for every other tenant in the process.
- **Negative-cache prevention**: an empty tenant-mapping result is never cached, closing off a class of "just-provisioned tenant gets 24 hours of lockout" bugs.
- **Tenant Provisioning & Management APIs** (SuperAdmin protected under `/management`):
  - `POST /management/tenant/assign`: Dynamically provisions a dedicated silo database, runs migrations, and maps realm roles to tenant UUIDs.
  - `GET /management/tenant/provisions`: Returns the full tenant provisioning table (`tenant_roles`), supporting optional `tenantId`, `roleName`, and `dbName` query filters.

### 🛡️ DuckGuard ACL — The Federated Access Matrix

Authorization as *data*, not as something baked into your route definitions at compile time.

**DuckGuard ACL** is the enforcement layer; the **Federated Access Matrix (FAM)** is the rule set it evaluates — a four-axis grid of `endpoint × method × realm role × user identity`, each cell resolving to `ALLOW` or `DENY`. The matrix lives in the **Master Registry**, not in any individual silo, so one rule set governs every tenant database in the federation. It's the natural complement to the Triple-Identity Registry above: the registry decides *which silo* a caller reaches, DuckGuard decides *what they may do* once they're inside it.

```bash
# Lock a route to one role — a single rule is enough
POST /management/access-policy
{
  "endpoint": "/api/reports",
  "method": "GET",
  "realmRole": "ROLE_FINANCE",
  "effect": "ALLOW"
}
```

That one rule turns `/api/reports` into a whitelist — everyone who isn't `ROLE_FINANCE` is automatically denied, no companion `DENY` rule required. A lone `DENY` rule, with no matching `ALLOW`, still behaves as a plain blacklist. Precedence between overlapping rules is decided by **specificity** (user-pin beats named-role beats exact-path beats named-method, plus a manual `priority` override, DENY winning exact ties) — never a naive "deny always wins," because that model can't express the "blanket deny + role carve-out" pattern that makes this useful.

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/management/access-policy` | `GET`, `POST` | List / create rules. |
| `/management/access-policy/:id` | `PUT`, `DELETE` | Update / remove a rule. |
| `/management/access-policy/:id/toggle` | `PATCH` | Flip `is_active` — the safe rollback lever. |
| `/management/access-policy/simulate` | `POST` | Dry-run a request against the live matrix without issuing it. |

An endpoint that no rule mentions stays **allowed** — the engine is purely additive, so turning it on for an existing deployment changes nothing until an operator writes a rule. All administration routes require the configured super-admin role.

#### How the rules get from the database to your request, fast

`AccessPolicyMiddleware` runs on *every request*, so it can't afford to hit Postgres each time. It doesn't — the rule set is cached **in the Go process's own memory**, not in Redis/Valkey, not anywhere external:

- A package-level variable (`accessPolicyStore`, a plain slice guarded by a `sync.RWMutex`) holds the last-known rule set.
- Each request reads straight from that in-memory slice — **zero network calls** in the hot path.
- The snapshot is considered fresh for `security.access-policy.cache-ttl` (a `config.yaml` setting — **defaults to 30 seconds**, tune it per environment). Once it goes stale, the *next* request on that pod triggers one `SELECT ... WHERE is_active = true` to refresh it. Set it to `0` or leave it unset and the generator falls back to the same 30s floor, so caching can never accidentally turn itself off.
- If that refresh fails (a transient DB blip), the middleware keeps serving the **previous** snapshot rather than an empty one — a flaky database can't silently drop every `DENY` rule and fail open.

```yaml
security:
  access-policy:
    cache-ttl: "30s"   # accepts any Go duration string: "10s", "1m", "500ms"...
```

**So what happens if you add a rule while the app is running?**

| Pod | When it sees the new rule |
| :--- | :--- |
| The pod that handled the `POST /management/access-policy` write | **Next request**, essentially instant — the write handler calls `InvalidateAccessPolicyCache()`, which flips that pod's own `loaded` flag to force a re-read on its very next lookup. |
| Every other pod in the deployment | Up to `cache-ttl` later, whenever its own independent TTL happens to expire — there's no cross-pod signal, each pod's cache is private to its own memory. |

**Why not just put the rules in Redis so every pod stays in sync?** You could, but think about what that trades away. Right now, authorization costs *zero* network round-trips per request. Move the reads to Redis and every single request in the generated microservice — this middleware is registered globally, ahead of every route group — now depends on Redis being up and fast. You'd also inherit a new failure mode that doesn't exist today: what does authorization do when Redis is slow or unreachable? Fail open (a security hole) or fail closed (the whole API goes down over a cache blip, even for requests that never touch Redis for anything else)?

| Approach | Per-request cost | Cross-pod consistency | New failure mode |
| :--- | :--- | :--- | :--- |
| **Current: in-memory, tunable TTL + invalidate-on-write** | Zero network calls | Instant on the writer's pod, ≤`cache-ttl` elsewhere | None — falls back to last-known-good on a DB blip |
| **Redis-backed reads** | A Redis round-trip on every request | Near-instant everywhere | Redis outage now blocks or bypasses *all* authorization, everywhere |
| **In-memory reads + Redis/Valkey pub/sub *only* for invalidation** | Zero network calls (unchanged) | Near-instant everywhere | None — a missed pub/sub message just degrades to the existing TTL fallback |

Before reaching for the third row, try turning the dial you already have — dropping `cache-ttl` to `"5s"` or `"1s"` costs nothing but a few more cheap indexed reads per pod and shrinks the propagation window a long way on its own. The pub/sub row is worth building only if you need sub-second, guaranteed-immediate propagation regardless of TTL: keep reads exactly as they are, and use Redis purely as a **signal**, not a **store** — publish a tiny invalidation message on write, have every pod subscribe and flip its own `loaded` flag the instant it hears it. Reads never touch Redis; only the rare event of a rule *changing* does. It's also consistent with how the rest of GO-DUCK already uses Redis/Valkey elsewhere in the stack — cache-aside repositories and the distributed cron `SETNX` lock — as coordination, never as a per-request read path. This isn't wired up out of the box today; it's the natural next step if you need it.

### 🌉 Strait of Duck Gateway (SDG)

A fleet of individually-generated microservices is only as manageable as your ability to see and reach all of them at once. **Strait of Duck Gateway** is the marketing name for a standalone service `go-duck create-gateway` scaffolds separately from the normal entity/GDL pipeline — same disclosure as DuckGuard ACL above: the name is docs-only, the code stays neutral (`generators/gateway.js`, command `create-gateway`, no "strait" or "SDG" anywhere in generated Go identifiers).

SDG does three things, across **two ports** — deliberately two separate route trees on two separate listeners, not one engine with routes conditionally hidden:

1. **Discovers** other GO-DUCK microservices running in Kubernetes — polling the K8s API every `discovery.poll-interval` (default 15s) for Services/Deployments carrying the `goduck.io/managed=true` label (stamped on every app's Deployment and Service by `devops.js` — see the invariant below), and counting each one's live ready-replica pods.
2. **Reverse-proxies** to them: `/proxy/:service/*rest` forwards to the discovered service's ClusterIP as `/<service>/<rest...>` — the `:service` segment is put back on the front, not dropped. GO-DUCK apps mount their REST API under `api-path-prefix`, which defaults to `/<service-name>/api` (see `resolveApiPrefix`), so the downstream router expects requests to still start with its own service-name segment; forwarding only the wildcard tail would 404 against the app's own routes. Body, headers, and method pass through untouched — the gateway does **not** impose its own auth on this path. Each downstream service's own JWT/DuckGuard ACL middleware still governs access exactly as if it had been hit directly. No double-auth, and nothing that a service intentionally left public (an `open Car(read)` GDL directive, a health check) becomes unreachable just because it's now funneled through the gateway.
3. **Serves its own 2-page, Keycloak-gated UI** — a Swagger switcher and a Metrics switcher, each with a service dropdown populated live from the discovery cache:
   - **Swagger** (`/ui/swagger`): pick a service, browse its API. The gateway fetches that service's `/swagger.json` server-side and re-serves it (`GET /api/services/:name/swagger.json`) — the browser only ever talks to SDG, never a downstream ClusterIP it usually couldn't reach anyway.
   - **Metrics** (`/ui/metrics`): a collapsible accordion, one row per discovered service — expand it to see every individual pod (phase, node, IP, restart count), not just a count. Each pod has a **View Console** button opening a detail modal with real Kubernetes pod logs (`clientset.CoreV1().Pods().GetLogs()` — the same data `kubectl logs` shows, fetched fresh on every poll, nothing cached or synthesized) alongside live CPU/Memory/Network/Disk charts. Vitals are fetched from that *specific pod's own IP* (`GET /api/pods/:namespace/:pod/metrics`, `GET /api/pods/:namespace/:pod/logs`), not the Service's ClusterIP — going through the Service would load-balance to whichever pod kube-proxy felt like handing back, not the one actually clicked.

**`server.port`** (default `8080`, the **admin port**) carries all three — UI, `/api/services*`, and `/proxy/*`. Both UI pages force a Keycloak login (`keycloak-js` with `onLoad: 'login-required'`) before rendering meaningful content, and the JSON endpoints underneath them (`/api/services*`) carry real server-side JWT validation — so curling those directly without a token still 401s, even if someone bypasses the UI entirely.

**`server.proxy-only-port`** (default `8081`) carries *only* `/health` and `/proxy/*rest` — the UI and API handlers aren't hidden on this listener, they're simply never registered on it, so there's nothing there to bypass even in principle. This is the port meant to be tunnelled: `kubectl port-forward` or an SSH tunnel to `proxy-only-port` gives a developer raw access to whatever downstream service they name, without also handing them the admin port's view of your whole fleet's topology. Set it to `0` to disable and run admin-port-only, matching the single-port behavior from before this existed.

**No database, ever.** The discovery cache is a plain in-memory map, rebuilt from the Kubernetes API on every poll and discarded on restart — the cluster is the source of truth, this is just a cache in front of it. On a failed poll, the registry keeps serving the last-known-good snapshot rather than an empty one (the same resilience idiom as DuckGuard ACL's cache and the Triple-Identity Registry's `TenantDBManager`), and `/health` reports `degraded` once the last successful refresh exceeds `discovery.cache-ttl` — a staleness *signal*, not a gate; reads never block on it.

```bash
go-duck create-gateway -c CONFIG/strait-of-duck-config/config.yaml -o my-gateway
cd my-gateway && go run main.go
# Admin port (UI + API + proxy):
#   → http://localhost:8080/ui/swagger
#   → http://localhost:8080/ui/metrics
# Proxy-only port (safe to tunnel — health + reverse proxy only):
#   → http://localhost:8081/proxy/<service>/...
```

> [!NOTE]
> **The discovery label is the entire contract.** SDG only ever finds apps whose manifests carry `goduck.io/managed`/`goduck.io/service` — labels `devops.js` started stamping on the Deployment and Service alongside the existing `app:` label (selectors and routing are untouched; this is purely additive). Apps generated or re-imported *before* this shipped are invisible to the gateway until redeployed. This is a one-time, one-way gap, not a bug to chase down.

> [!NOTE]
> **Kubernetes RBAC required.** Because every GO-DUCK app deploys into its own dedicated namespace (`devops.js` — namespace = app name, never a shared one), discovery has to be cluster-scoped. `go-duck create-gateway` emits its own `devops/k8s/gateway.yaml` with a dedicated `ServiceAccount` + a read-only `ClusterRole` (`get/list/watch` on `services`/`endpoints`/`pods`/`deployments`, plus `get` on the `pods/log` subresource for the console feature — log access is granted separately from `pods` itself in Kubernetes RBAC) + `ClusterRoleBinding` — apply it before deploying the gateway.

> [!TIP]
> **Scoping discovery to one environment tier.** Every app also carries a `goduck.io/environment` label, sourced from `go-duck.environment-tag` in *its own* `config.yaml` (defaults to `"prod"` if you don't set it — matching today's implicit assumption that anything reaching a cluster is production-grade). Point a gateway at one tier by setting `discovery.environment` in *the gateway's* config:
> ```yaml
> discovery:
>   environment: "staging"   # only discover apps generated with environment-tag: "staging"
> ```
> Leave it blank (the default) and the gateway discovers every tier it can see — useful for a single shared gateway, or while you're not yet bothering to tag anything. Run one gateway per tier once you are.

### 🌐 Multi-Protocol Endpoints

Every generated microservice speaks three protocols simultaneously, no duplicated logic:

| Protocol | Default Port | Use it for |
| :--- | :--- | :--- |
| **REST (JSON)** | `8080` | Browsers, general clients. Supports `?page=`, `?size=`, `?sort=field,asc`. |
| **REST (MessagePack)** | `8080` | High-throughput binary REST — set `server.rest.protocol: "messagepack"` and send `Accept: application/msgpack`. |
| **Native Kratos gRPC** | `9000` | Backend-to-backend service calls, maximum throughput. |
| **gRPC-Web Proxy** | `9090` | Browsers can't speak raw HTTP/2 gRPC — this HTTP/1.1 bridge lets React/Angular/Vue talk Protobuf directly (pair it with the `grpc-web` npm package). |

```yaml
server:
  grpc:
    web_enabled: true
    web_port: 9090
```

### 🛡️ Scheduled Tasks & the Thundering Herd

Five replica pods, one cron job, one very unhappy database — unless you stop it. GO-DUCK solves this natively with a **Secure Webhook + Redis `SETNX` Lock**:

1. An external trigger (a Kubernetes `CronJob`) hits `POST /api/system/cron` with a secret `X-Cron-Token`.
2. The receiving pod attempts `SETNX go-duck:system-cron:lock:my_task "locked"` with a 55-second TTL.
3. Because Redis is single-threaded, exactly **one pod** wins the lock and runs `services/scheduler.go`. Everyone else backs off immediately — no thundering herd, no double-charged invoices.

*(An internal `robfig/cron/v3` interval scheduler is also generated, commented out by default, using the same locking logic if you'd rather not depend on an external trigger.)*

### 📊 Telemetry & Observability

- **OpenTelemetry Distributed Tracing** — native `otelgin` and `gorm.io/plugin/opentelemetry/tracing`.
- `GET /metrics` — standard Prometheus scrape endpoint, feeds Kubernetes HPA.
- `GET /api/system/stream` — Server-Sent Events stream of live CPU/Memory/Load, straight into a browser dashboard.
- `GET /api/system/metrics` — a JHipster-style metrics dump: GC pauses, uptime, goroutine counts, per-endpoint hit counts, latencies, failure counts.
- **Datadog-ready structured logging** via the generated `logger` package.

### 🪝 Preserved CRUD Interceptors (Hooks)

Every entity gets a safe `interceptors/` package for injecting business logic **without touching generated code**:

- Files carry the `// @go-duck-preserve` needle, so they survive every future `import-gdl`.
- Hook into `Before`/`After` for `Create`, `Update`, `Patch`, `Delete`.
- Payloads are pointers/maps passed by reference — mutate them in the interceptor and the controller saves your version.
### 🔍 SonarQube Quality Benchmark & Automated Audit Report

Every generated service includes an enterprise-grade SonarQube configuration and automated audit generator:

- **SonarQube Container (`devops/services.yml`)** — Spin up SonarQube Community Edition on `:9000` (`docker compose -f devops/services.yml up -d sonarqube`).
- **Scanner Configuration (`sonar-project.properties`)** — Pre-configured for Go with code coverage (`coverage.out`), test discovery, and generated code exclusions.
- **Benchmark Script (`sonar_benchmark.sh`)** — Runs unit test coverage, runs SonarScanner (via local CLI or Docker `sonarsource/sonar-scanner-cli`), and compiles an interactive HTML report (`sonarqube_benchmark_report.html`) complete with:
  - Quality Gate status badge and Print/Save-as-PDF styling.
  - Metrics Cards (Bugs, Vulnerabilities, Security A-Rating, Reliability A-Rating, Maintainability A-Rating, Tests Passed %, Overall Coverage %, Duplication Density).
  - Executive Benchmark Summary table & Layer-by-Layer Test Coverage Breakdown table.
  - Verified Microservice API Modules & Entities table dynamically detected from controllers and models.

```bash
# 1. Start local SonarQube server
docker compose -f devops/services.yml up -d sonarqube

# 2. Run quality benchmark audit and generate report
./sonar_benchmark.sh
```

### 🚢 Deploy to Kubernetes

```bash
# 1. Build, tag, and push your Docker image (also updates app.yaml)
./push.sh my-registry/my-app:1.0.0

# 2. Apply everything
kubectl apply -f devops/k8s/
```

The generated `devops/k8s/` directory ships ready-to-apply manifests — `mongo.yaml`, `minio.yaml`, `app.yaml` — with Horizontal Pod Autoscaling, isolated Secrets, and ConfigMap-mounted config wired in by default.

> [!NOTE]
> Manifests use placeholder resource limits and storage classes — adjust to match your cluster before applying for real.

### 🏗️ Compiling Protobuf & gRPC Contracts

> [!NOTE]
> **Do you need to do this?**
> - **Yes**, if you're running locally with `go run`, whenever you first create the project or re-run `import-gdl` and get new gRPC structures.
> - **No**, if you're building via Docker — the multi-stage `devops/Dockerfile` compiles Protobuf internally.

```bash
# Prerequisites: protoc on PATH, plus the Go plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Then, from the generated project root:
./generate.sh      # Linux / macOS / Git Bash / WSL
.\generate.bat      # Windows CMD / PowerShell

# And finally:
docker-compose up -d
go run main.go
```

---

## 🚀 The API Arsenal

Every generated microservice comes pre-armed with this out of the box — no extra code required.

<details>
<summary><strong>1. Core & Relational Engines</strong></summary>

- **Standard CRUD**: `Create`, `GetAll` (pagination, sorting, meta-filtering), `GetByID`, `Update`, `Patch`, `Delete`.
- **Bulk Operations**: transactional `BulkCreate` / `BulkUpdate` / `BulkPatch` at `/bulk`.
- **Dual Retrieval APIs**:
  - `GET /api/{entity}` — flat, JPA-style filters (`.equals`, `.contains`, `.greaterThan`, `.in`), including into `JSON`/`JSONB` fields via arrow-path notation — `?metadata->status.equals=active`, nested arbitrarily deep (`?metadata->a->b.contains=x`), always extracted as text via Postgres's `#>>` path operator so every operator works the same as it does on a string column. GDL never declares a JSONB field's inner keys — content is entirely user-defined — so this is a generic path convention, not per-key generated code.
  - `GET /api/{entity}/eager` — SQL joins / Mongo aggregations for nested relational data.
- **Dynamic Join Engine**: on-the-fly M:N joins (`GET /api/{entity}/join/{targetTable}?onA=id&onB=foreign_id`), anti-IDOR whitelisted, pagination mandatory.
- **Generic Search Layer**: PostgREST-style RPC (`/api/rpc/:table`) with the same `.operator`-suffix filter convention (including the JSONB arrow-path syntax above).
- **Elasticsearch Hybrid Search**: `/api/{entity}s/search`, fusing raw Lucene syntax with JPA-style filters.
</details>

<details>
<summary><strong>2. Smart Capabilities (AI & Analytics)</strong></summary>

- **Ask** (`POST /api/{entity}s/ask`): natural language → raw, read-only SQL/Mongo query, with a self-correcting retry loop (up to 3 attempts) if the generated query fails.
- **Check Unique** (`GET /api/{entity}s/check-unique`): validate an email/username/etc. isn't already taken.
- **Autocomplete**: fast dropdown search restricted to indexed fields.
- **Stats**: instant count and aggregate summaries.
</details>

<details>
<summary><strong>3. Productivity & Workflow</strong></summary>

- **Clone** (`POST /api/{entity}s/{id}/clone`): duplicate a record and its safe relationships.
- **Export**: grid/table data out to CSV/Excel.
</details>

<details>
<summary><strong>4. Data Safety & Governance</strong></summary>

- **Draft & Publish** (`@Draftable`) — `is_draft` column plus `/draft` and `/publish`.
- **Soft Deletion** (`@SoftDelete`) — `deleted_at`, `GET /trashed`, `POST /{id}/restore`.
- **Audit History** (`@Audited`) — every mutation logged with the acting identity.
- **Impact Analysis** — cascading effect of deleting/archiving a record.
- **Timeline** — visual lifecycle history per entity.
- **Anonymize** — privacy-compliant PII scrubbing.
- **Read Receipts** (`@TrackViews`) — zero-intrusion view tracking via shadow tables.
- **DuckGuard ACL Administration** — full CRUD + simulator over the Federated Access Matrix, detailed [above](#-duckguard-acl-the-federated-access-matrix).
</details>

---

## 🏆 Achievement Log

GO-DUCK has climbed past its original scope a few times over. This table is equal parts changelog and bragging rights — for the exhaustive, dated technical history (commit hashes included), see **[CHANGELOG.md](../CHANGELOG.md)**; for how the generator pipeline actually works internally, see **[AGENTS.md](../AGENTS.md)**.

| Milestone Component | Status | Technical Value Add |
| :--- | :--- | :--- |
| **Base Core Architecture** | ✅ **COMPLETE** | Gin MVC, GORM, Dual-Protocol, Redis, MQTT, Kratos. |
| **Federated Empire Foundations** | ✅ **COMPLETE** | Hard-Silo Isolation, Triple-Identity Registry, Saga Outbox. |
| **Elite Observability & Search** | ✅ **COMPLETE** | Full OTel Tracing, Glassmorphism Docs, ES Sync. |
| **Precision Harvesting Ext.** | 🚀 **ELITE (+12%)** | Surgical multi-silo selection via comma-separated `X-Tenant-ID`. |
| **Industrial Async Execution** | 🚀 **ELITE (+15%)** | Goroutine-based parallel aggregation (The Harvester 2.0). |
| **Super Admin Security Boundary** | 🚀 **ELITE (+13%)** | Strict isolation between Business and Infrastructure Control APIs. |
| **Silo Discovery & Privacy Proxy** | 🚀 **ELITE (+10%)** | Silo discovery API with physical DB name masking. |
| **Universal Storage Mesh** | 🚀 **ELITE (+25%)** | Dynamic Hot-Swapping Registry and Distributed Cross-Scan API retrieval. |
| **WSO2 API Gateway Integration** | 🚀 **ELITE (+15%)** | Automated OpenAPI registration & proxy mapping. |
| **API Gateway Standards & Swagger UI** | 🚀 **ELITE (+10%)** | Keycloak SSO, Glassmorphism UI, Dual-API Swagger Parity, JHipster `/v3/api-docs` compliance. |
| **Full-Spectrum GDL Evolution** | 🚀 **ELITE (+15%)** | Native DROP/ALTER migrations with dead-code purging. |
| **JPA-Style Dynamic Meta Filters** | 🚀 **ELITE (+15%)** | Dynamic attribute queries seamlessly compiled into GORM, BSON, and ES `bool` queries. |
| **Elasticsearch Hybrid Engine** | 🚀 **ELITE (+15%)** | Fuses raw Lucene Syntax with strictly typed JPA filters, native `X-Total-Count` parity. |
| **Bento UI Mobile Telemetry** | 🚀 **ELITE (+5%)** | Responsive grid dynamics for live system telemetry dashboards. |
| **Cloud-Native Kubernetes & HPA** | 🚀 **ELITE (+10%)** | ConfigMap-mounted configs, isolated Secrets, native HPA. |
| **ManyToMany & Dynamic Swagger** | 🚀 **ELITE (+10%)** | Complex ManyToMany associations, on-demand tenant migrations, dynamic Swagger prefix rewriting. |
| **Context-Aware AI SQL Generator** | 🚀 **ELITE (+20%)** | Natural language → raw SQL/Mongo `$lookup` queries using real-time architecture relationships. |
| **Global Soft-Delete Architecture** | 🚀 **ELITE (+10%)** | Auto-generating `deleted_at` trackers plus `/trashed` endpoints. |
| **Read Receipt Engine** | 🚀 **ELITE (+10%)** | Zero-Intrusion View Tracking via `@TrackViews` and dynamic shadow tables. |
| **Dynamic Webhook & Prod Configs** | 🚀 **ELITE (+5%)** | Dedicated production YAMLs, rate limiting variance, Webhook bridging. |
| **Angular SDK Generator** | 🚀 **ELITE (+15%)** | Strictly-typed, Reactive Forms-ready Angular SDK with MessagePack interceptors. |
| **DuckGuard ACL** | 🚀 **ELITE (+15%)** | Federated Access Matrix: OPA-style `ALLOW`/`DENY` rules, specificity-resolved, super-admin CRUD + simulator, purely additive. |
| **TOTAL ACHIEVEMENT STATUS** | 🏆 **560%** | **ELITE STATUS CONFIRMED.** 👑 |

---

## 🙈 Known Gaps (We're Not Hiding These)

Every framework has a "yeah, we know" list. Here's ours, said out loud so you don't discover it the hard way:

- **No business-logic tests.** GO-DUCK generates one dependency-free smoke test (`main_test.go`, verifying `config.LoadConfig()` doesn't blow up) so `go test -v ./...` in CI has something real to run — it has no way to know what *your* handlers should assert, so anything beyond that is on you.
- **Secrets land in ConfigMaps.** The full app config — including the datasource password and Keycloak client secret — is dumped into a K8s `ConfigMap` alongside the properly-secured `Secret`. Tighten this before shipping to a real cluster.
- **`SAMPLE-GO-APP` is a stale reference.** It predates a few refactors and won't compile as committed; freshly generated output is unaffected.
- **Zero-entity scaffolds don't build.** If your GDL directory is empty, the router references a controller that was never emitted. Add at least one entity.

Full details and file/line references live in [AGENTS.md](../AGENTS.md#known-gaps).

---

## License

This project is licensed under the ISC License.
