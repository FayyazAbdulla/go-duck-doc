# GO-DUCK-CLI Usage Guide

The `GO-DUCK-CLI` is a powerful Go code generator that transforms GDL files into a production-ready microservice with multi-tenancy, auditing, and Goose SQL migrations.

## Installation

To install the CLI locally for development:

1. Navigate to the CLI directory:
   ```bash
   cd GO-DUCK-CLI
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Link the package globally (optional):
   ```bash
   npm link
   ```

## Usage

Once installed, you can generate a base Go application using a single command:

```bash
go-duck create --config <config-path> --output <output-path>
```

### Options:

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `--config` | `-c` | `../CONFIG/config.yaml` | Path to your `config.yaml` file. |
| `--output` | `-o` | `../SAMPLE-GO-FUNCTION` | Directory where the app will be generated. |
| `--gdl` | `-g` | `../GDL` | Directory containing your `.gdl` files. |

### Example:

```bash
go-duck create -c ./CONFIG/config.yaml -o ./MyGeneratedApp
```

## Reference Configurations

The repository provides three production-ready configuration templates in the `/CONFIG` directory, covering all possible persistence scenarios:

| Configuration File | Primary Store | Description |
| :--- | :--- | :--- |
| **`config-hybrid.yaml`** | Both | Fully enables both PostgreSQL and MongoDB side-by-side for heterogeneous entities. |
| **`config-mongo-only.yaml`** | MongoDB | Empower MongoDB as the primary document store for all application entities. |
| **`config-psql-only.yaml`** | PostgreSQL | Traditional relational setup with MongoDB explicitly disabled. |

These templates include every supported parameter for **Server, Security, Messaging (NATS/MQTT), Cache (Redis), Resilience, Telemetry (OTel), and Object Storage**.

## Features Generated:

*   **Hybrid-Store (PostgreSQL + MongoDB)**: Native support for both relational and document-based entities. Automatically scaffolds GORM models or MongoDB BSON-tagged models based on the `@isDocument` annotation. Includes **Cross-Database Relationships** with dynamic ID mapping (`uint64` vs `string`).
*   **Federated Multi-Tenancy**: Middleware for dynamic Role-to-DB discovery with **Heterogeneous Parallel Harvester 2.0**, enabling simultaneously querying across both SQL and MongoDB buckets.
*   **Models**: GORM or Mongo models with support for recursive nested structures, `@AutoWired` audit fields, and optimistic locking.
*   **Distributed Consistency (Saga/Outbox)**: Automated `distributed_outbox` generation for eventual consistency across silo failures.
*   **Unified Messaging Hub**: Dual-broker support for **MQTT** (Real-time UI) and **NATS** (High-Performance CQRS).
*   **Universal Storage Mesh**: Dynamic active registry for 7 providers (S3, GCS, MinIO, R2, SFTP, GitHub) featuring Hot-Swapping API ingestion and **Distributed Cross-Scan Retrieval**.
*   **Auditing**: Global row-wise audit log tracking Keycloak roles and IDs.
*   **Migrations**: Complete Goose SQL migrations for stateful schema management.
*   **GraphQL & gRPC**: Auto-generated Kratos & Gin services with secured, role-grouped federated data.
*   **Management API**: Endpoint to create, align, and migrate tenant databases using the Triple-Identity Opaque UUID Registry.
*   **Security & Rate Limiting**: Distributed Redis Fixed-Window Anti-Burst shielding tracking clients by Zero-Trust `KeycloakID`.
*   **DuckGuard ACL (Federated Access Matrix)**: Database-driven, OPA-style `ALLOW`/`DENY` rules over the four-axis matrix of `endpoint × method × realm role × user identity`. The matrix is held in the **Master Registry** and enforced by a single global middleware across *every* silo in the federation, so rules are authored once and never drift per tenant. Administered through a super-admin CRUD API at `/management/access-policy`, with a `POST /simulate` dry-run for checking a matrix before trusting it. Rules are cached in-memory per pod (default 30s, tunable via `security.access-policy.cache-ttl`) and resolved by **specificity**, so restricting a route to one role takes a single rule — `ALLOW /api/reports GET ROLE_FINANCE` — while a lone `DENY` still acts as a pure blacklist. Endpoints no rule mentions stay open, so DuckGuard is purely additive on existing deployments.
*   **SaaS Quota Engine**: Sub-millisecond API Metering via Redis with dynamic Hierarchical Limits.
*   **Data Safety & Governance**: Automatic `@Audited` change data capture, `@SoftDelete` tracking, `@Draftable` states, and now **Zero-Intrusion Read Receipts** via `@TrackViews` with dedicated shadow tables and assignment endpoints.
*   **Elasticsearch Search Engine**: High-performance fuzzy matching with Spring-style query strings and **Transactional Auto-Sync**.
*   **Dual Retrieval APIs & Dynamic Meta Filters**: Intelligent separation of single-entity flat REST queries (using JPA-style operators like `.contains`, `.greaterThan`) from specialized eager-loading `/eager` endpoints for complex relational dynamic joins.
*   **Distributed Cron Webhooks**: Automatically generates a `/api/system/cron` endpoint protected by `X-Cron-Token` and Redis `SetNX` anti-thundering-herd locking to safely trigger scheduled background tasks (like Kubernetes CronJobs).
*   **Smart Code Preservation Engine**: Protect custom code logic natively! Add `// @go-duck-preserve` anywhere in a generated file, and the CLI will safely skip overwriting it during subsequent `import-gdl` delta updates.
*   **Dockerization & Publishing**: Scaffolds multi-stage production `Dockerfile`, infrastructure `services.yml`, app configuration `app.yml`, combined `docker-compose.yml`, and a helper `push.sh` script to build, tag, and publish your service containers.
*   **Cloud-Native Serverless Deployment**: Automatically transform any Gin/Kratos microservice into a serverless-optimized function for **Vercel**, **AWS Lambda**, or **Google Cloud Functions (GCF)**. Leveraging a shared `router` package for 100% logic parity between standard and serverless entry points. Includes provider-specific artifacts like `vercel.json`, `serverless.yml`, and `deploy-gcf.sh`.

## Cloud-Native Serverless Deployment

GO-DUCK isn't just for heavy Docker containers; it's a **First-Class Serverless citizen**. Using the same business logic, the CLI can generate a specialized serverless adapter for your preferred cloud provider.

#### Supported Providers:
-   **Vercel**: Optimized Go Edge/Serverless functions with wildcard routing (via `vercel.json`).
-   **AWS Lambda**: Logic wrapped in the `aws-lambda-go-api-proxy` for standard Gin routing in Lambda.
-   **Google Cloud Functions (GCF)**: Uses the Functions Framework for HTTP-triggered Gin logic.

#### Architectural Highlights:
-   **100% Shared Logic**: All route logic lives in the `router` package, shared by the standard and serverless entry points.
-   **Cold-Start Optimization**: In serverless mode, the system automatically skips initializing background Outbox workers and CRON jobs to maximize performance.
-   **Wildcard Routing**: Full Gin routing capability within a single serverless function.

#### How to Generate:
Use the specialized serverless config:
```bash
node GO-DUCK-CLI/index.js create -c CONFIG/config-serverless.yaml -g GDL -o MyServerlessApp
```

## GDL Static Analysis & Validation (`validate-gdl`)

To avoid database runtime panics, compilation failures, or GORM schema collisions, GO-DUCK-CLI includes a dedicated static analysis tool to inspect your GDL files before generating any code.

Run the validator by passing the path to your GDL file or directory:

```bash
go-duck validate-gdl ./GDL/milling.gdl
```

### Key Validation Checks:
* **Duplicate Field Detection:** Scans all entity blocks to ensure no field is defined twice (e.g., preventing duplicate column mapping compile failures).
* **Relational Collision Prevention:** Warns if you manually declare a foreign key field (such as `long millingBatchId`) for a relationship that is already defined in the `relationship` block. This prevents GORM duplicate column collisions.
* **Typo & Case Enforcements:** Enforces PascalCase for entity and enum names, camelCase for field names, and flags common spelling mistakes (like `instiute` vs `Institute`).
* **Type Safety Validation:** Verifies that all field types match known primitives, declared entities, or defined enums. This prevents spelling errors in types from generating default Go `interface{}` types, eliminating GORM database runtime errors.
* **Precision & Numeric Warnings:** Warns if double/float types are used for financial fields (like fee, price, cost), suggesting `BigDecimal` for precision instead.

## GDL Schema Evolution & Deletion Rules

The CLI performs **Stateful Incremental Updates** using snapshots stored under the hidden `.go-duck/` directory to preserve your schema state and safely evolve your database.

### 1. Snapshot Merging & Multi-File GDL Support
You can split your GDL declarations across multiple files. When running `import-gdl`, the generator:
- Loads and parses the new GDL file.
- Reads previous active entities from `.go-duck/`.
- Merges the two sets of entities (preserving existing ones not defined in the new file) so your existing routers, endpoints, and code logic are never wiped out.

### 2. Modifying or Dropping Fields
To modify the schema of an existing entity (e.g., adding a field, altering a type, adding constraints, or dropping a column):
1. Make the change directly within the entity block in your GDL file.
2. Run `import-gdl`. The engine compares your updated definition to the snapshot in `.go-duck/`, detects the deltas, and generates Goose SQL migrations (`ALTER TABLE ... ADD COLUMN`, `ALTER TABLE ... DROP COLUMN`, etc.) while keeping existing tables intact.

### 3. Deleting Entire Entities (`@Delete`)
If you want to completely purge an entity:
1. Mark the entity in your GDL file with the `@Delete` annotation:
   ```gdl
   @Delete
   entity LegacyData {
       string name
   }
   ```
2. Run `import-gdl`.
3. The generator will:
   - Generate a Goose migration featuring a `DROP TABLE legacy_data` SQL statement.
   - Purge all generated code files for this entity (models, controllers, repositories, Kratos services, and routes) to ensure zero compilation or import issues.
   - Remove the entity snapshot from the `.go-duck/` directory.

## Strait of Duck Gateway (`create-gateway`)

`go-duck create-gateway` scaffolds a separate, standalone Go service — marketed as **Strait of
Duck Gateway (SDG)** — that discovers your GO-DUCK microservices in Kubernetes and reverse-proxies
to them, plus a small Keycloak-gated UI for browsing each service's Swagger docs and live
pod-count/metrics. It's independent of the entity/GDL pipeline: its own config, rooted at
`strait-of-duck:` rather than `go-duck:`, lives at `CONFIG/strait-of-duck-config/config.yaml`.

```bash
go-duck create-gateway -c CONFIG/strait-of-duck-config/config.yaml -o my-gateway
```

It runs on **two ports**: `server.port` (default `8080`) carries the UI, the `/api/services*` JSON
API, and the reverse proxy; `server.proxy-only-port` (default `8081`, set to `0` to disable) carries
only `/health` and the proxy — no UI, no API, nothing registered on that listener beyond the proxy
itself. Tunnel `proxy-only-port` (`kubectl port-forward`, SSH) when a developer needs raw access to
one downstream service without also handing them the admin port's view of your whole fleet.

Discovery depends on labels (`goduck.io/managed`, `goduck.io/service`, `goduck.io/environment`)
that `devops.js` now stamps on every generated app's Deployment/Service — apps generated before
this shipped won't be visible to the gateway until redeployed. The environment tag comes from a new
`go-duck.environment-tag` field in an app's own `config.yaml` (default `"prod"`); point a gateway
at just one tier by setting `discovery.environment` in *its* config — blank scans every tier.

Full details, including the auth model (the gateway never gates the traffic it proxies — only its
own UI) and the RBAC it needs in-cluster, are in
[README.md's Strait of Duck Gateway section](GO-DUCK-CLI/README.md#-strait-of-duck-gateway-sdg).

## SonarQube Quality Audit & Benchmark Scanning

Every GO-DUCK generated project comes with complete SonarQube tooling out-of-the-box:

1. **Dockerized SonarQube Service**:
   Start the local SonarQube Community Edition server:
   ```bash
   docker compose -f devops/services.yml up -d sonarqube
   ```
2. **Scanner Configuration**:
   `sonar-project.properties` is pre-configured at the project root with Go test coverage mappings (`coverage.out`) and exclusions for generated protobufs, documentation, and Kubernetes manifests.
3. **Execute Benchmark Scan**:
   Run the benchmark audit script:
   ```bash
   ./sonar_benchmark.sh
   ```
   This runs unit test coverage, triggers the SonarQube scanner (locally or via Docker), and generates a standalone, print-ready HTML benchmark audit report (`sonarqube_benchmark_report.html`) complete with Quality Gate status, security/reliability/maintainability Grade A metrics, layer-by-layer test coverage breakdown, and verified microservice API entity mappings.

## Roadmap

Shipped since this guide was first written: distributed CRON jobs via Redis `SETNX`, automated
Optimistic Locking via `@Version` fields (GORM + MongoDB), a generated `main_test.go` smoke test
plus a fixed CI test step, and `import-gdl --dry-run` for previewing destructive migrations before
they're written.

Still outstanding:

- **Business-logic test generation** — GO-DUCK generates one config-loading smoke test per project;
  it has no way to generate assertions about your entities' behavior, so that part stays yours.
- **Out-of-band tenant migrations** — silo migrations still run lazily on the first request.

See [CHANGELOG.md](CHANGELOG.md) for release history and [AGENTS.md](AGENTS.md) for architecture
and the full list of known gaps.
