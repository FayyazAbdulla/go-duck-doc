# GO-DUCK source notes

## CLI repository docs (added after the HTML crawl)

Copied into `research/cli-sources/`:

| File | What it adds |
|------|----------------|
| `README.md` | `npm install -g go-duck-cli`, `init`, `serve`, `generate-angular-sdk`, flag defaults, `strait-of-duck:` gateway config, MessagePack, cron `SETNX`, SonarQube, known gaps |
| `CLI_GUIDE.md` | Local `npm link` install, `CONFIG/config-*.yaml`, validation checks, serverless `node GO-DUCK-CLI/index.js create` |
| `MULTI_SILO_README.md` | Implicit role routing, `GET /api/silos/me` shape with `dbName`, federated reads grouped by role, comma-separated write header |
| `AGENT_README.md` | Instructions embedded in a generated app (`docs/ai/*`, 401 vs 404, kebab prefixes) |
| `AGENTS.md` | Generator pipeline and invariants. Invalid `X-Tenant-ID` fallback here **contradicts** the README’s 403 rule |
| `CHANGELOG.md` | Dated behavior changes. Pagination became 0-based on 2026-09-07 |

The HTML sections below are unchanged as a record of the website. Docs pages call out conflicts.

---

Mined from local HTML only:

`/Users/abdulla/Work/current-go-duck-doc/Website`

Raw per-page text dumps: `research/extracts/`. Nothing below is taken from https://goduck.theheavenscode.com/.

Corpus (31 HTML files, all read): `index`, `legend`, `gdl`, `gdl-entities`, `gdl-relationships`, `gdl-annotations`, `gdl-advanced`, `wizard`, `cli`, `configuration`, `rest`, `elasticsearch`, `graphql`, `multitenancy`, `federation`, `gateway`, `hybrid-store`, `grpc`, `realtime`, `mosquitto`, `audit`, `observability`, `otel`, `datadog`, `security`, `redis`, `keycloak`, `serverless`, `storage`, `saga`, `integrations`.

Assets: `logo.png` (2048²), `gin_bottle.png`, `kratos_mark.png`, `triple_identity_registry.png`, `intro.mp4`. Only a resized `logo.png` is copied into this repo (header + favicon). The large illustrations and video were not vendored.

Site chrome in the HTML calls the product **GO-DUCK V3.0**. Pages use both `config.yaml` and, in a few places, `application.yml` for the same settings. Both names are recorded; they were not merged into one invented schema.

---

## Product one-liner

GO-DUCK is a Go microservice generator and runtime orchestrator. A GDL file is the blueprint for entities, enums, and relationships. The CLI scaffolds Gin REST, Kratos gRPC, GORM (PostgreSQL) and optional MongoDB, Goose SQL migrations, Protobuf, a GraphQL SDL file, Keycloak JWT middleware, and Kubernetes manifests (ConfigMap, Secret, HPA, per-app namespace).

Technical pillars named on `index.html` (marketing percentages removed):

- Hybrid-Store: PostgreSQL and MongoDB in one service, cross-database relationships when declared with a `relationship` block.
- Dual-protocol: Gin REST and Kratos gRPC.
- Triple-Identity registry: realm role → opaque UUID (`X-Tenant-ID`) → physical database name.
- DuckGuard ACL: in-process access matrix `endpoint × method × realm-role × user-identity`, cache TTL, simulate endpoint.
- Strait of Duck Gateway: database-less Kubernetes service discovery and reverse proxy (`go-duck create-gateway`).
- Transactional outbox (`distributed_outbox`) for federated writes.
- Messaging hub: MQTT (UI) and NATS (internal subjects).
- Universal storage bridge (S3, GCS, MinIO, SFTP, GitHub, Azure DevOps Git, Bitbucket bootstrap).
- OpenAPI at `/v3/api-docs` (and legacy `/swagger.json`).

`legend.html` is brand lore (Gopher, Duck, Gin router, Kratos gRPC, GDL). It has no CLI or config.

---

## Install / CLI

**No install recipe** is in the HTML (no module path, `go install`, brew, or npm package). TODO: publish how to obtain the binary.

**Binary name is inconsistent in the corpus:**

| Source | Invocation |
|--------|------------|
| `cli.html`, `gateway.html` | `go-duck` |
| `index.html` | `go-duck-cli create-gateway` |
| `wizard.html` | `go-duck-cli gdl-planner` |

### Commands (`cli.html`)

```bash
# Fresh scaffold
go-duck create -o ./MY_APP -c config.yaml -g initial_schema.gdl

# Incremental update
go-duck import-gdl my_new_schema.gdl -o ./MY_APP
go-duck import-gdl my_new_schema.gdl -o ./MY_APP --preserve-root
go-duck import-gdl my_new_schema.gdl -o ./MY_APP --preserve-root --smart
go-duck import-gdl my_new_schema.gdl -o ./MY_APP --reset
go-duck import-gdl my_new_schema.gdl -o ./MY_APP --dry-run

# Validate only
go-duck validate-gdl my_new_schema.gdl --smart

# Fleet gateway
go-duck create-gateway -c CONFIG/strait-of-duck-config/config.yaml -o my-gateway
```

Flag meanings as stated on the page:

- `-o` output directory, `-c` config file, `-g` initial GDL (on `create` only).
- `--preserve-root` regenerates models and routes without overwriting custom root files (`main.go`, `devops/`, `push.sh`, top-level configs).
- `--smart` strict semantic naming validation and reserved-keyword checking. Also a flag on `validate-gdl`.
- `--reset` overwrites files marked `@go-duck-preserve` back to the generated default.
- `--dry-run` runs the real generation pipeline but intercepts writes. Prints migration SQL and flags `DROP TABLE` / `DROP COLUMN`. No files written.

`wizard.html` (not a CLI subcommand): `go-duck-cli gdl-planner [-p/--port <number>]`, default port `8000`. Launches a compiled Angular app for entity/relationship planning. The browser config form is separate and is not invoked by the CLI.

### State and needles (`cli.html`)

- Hidden `.go-duck/` snapshot at the project root. `import-gdl` merges snapshots with the new GDL. Do not delete `.go-duck/` unless intentionally wiping generator state.
- Multiple GDL files: unspecified models are loaded from `.go-duck/` and merged.
- Field add/drop/modify → `ADD COLUMN` / `DROP COLUMN` in a timestamped Goose migration.
- `@Delete` on an entity → `DROP TABLE` migration, purge generated Go/Protobuf, clear snapshot.
- Preservation needle anywhere in a file: `// @go-duck-preserve` (CLI skips the write).
- Anchor needles (do not delete):
  - `// go-duck-needle-add-import` (`main.go`)
  - `// go-duck-needle-add-init-repository` (`main.go`)
  - `// go-duck-needle-add-grpc-service` (`internal/server/grpc.go`)
- Incremental updates locate anchors by regex and insert below them instead of blindly templating `main.go`.

`grpc.html` also documents post-generate compile scripts `generate.sh` / `generate.bat` and:

```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

Those install protoc plugins, not the GO-DUCK CLI. Docker builds compile protos inside `devops/Dockerfile`.

---

## GDL surface

GDL is the source of truth for DB schema, Protobuf, GraphQL types, and Go repositories. Deltas become Goose migrations.

### Building blocks

Entities, enums, relationships. Annotations and file-level directives add behavior.

Basic (`gdl.html`):

```gdl
@Audited @Federated
entity Customer {
    string(100) fullName required
    string(255) email unique
    datetime    lastLogin
}

relationship OneToMany {
    Customer{orders} to Order{customer}
}
```

Home-page sample also uses `enum`, `open (read, list)`, `@isDocument`, `@Version`, `jsonb`, `bigdecimal`.

### Declaration styles (`gdl-entities.html`)

Type-first (called the modern style):

```gdl
string(100) fullName required
datetime lastLogin
jsonb metadata
```

Field-first:

```gdl
fullName String required
lastLogin DateTime
metadata JSONB
```

Do not name a field `id`. Every entity already has a hardcoded primary-key `ID`. A field named `id` collides after Go export and one of them disappears from JSON.

### Types (`gdl-entities.html`)

| GDL | Go | SQL (Postgres) |
|-----|----|----------------|
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

The parser **rejects** type `date`. Use `LocalDate`, `Instant`/`DateTime`, or `Time`.

### Field modifiers

- `required` → `NOT NULL`, Protobuf and Gin required.
- `unique` → unique index.
- `default=<value>` — enums `default=DRAFT`, booleans `default=TRUE`, numerics `default=1.5`, quoted strings `default="Hello"`.

### Relationships (`gdl-relationships.html`)

Declared **outside** entity blocks. Directional. Generator injects FKs, GORM preload, Protobuf nesting.

```gdl
relationship OneToMany {
    Customer{orders} to Order{customer}
}
relationship ManyToOne {
    Car{manufacturer} to Manufacturer
}
relationship OneToOne {
    User{profile} to Profile{user}
}
relationship ManyToMany {
    Student{courses} to Course{students}
}
```

`required` on the relationship enforces existence at DB and API:

```gdl
relationship OneToMany {
    Customer{orders} to Order{customer} required
}
```

Many-to-many generates a GORM `many2many:` join table.

Cross SQL/NoSQL: the `relationship` block is what triggers cross-DB handling. An inline entity-typed field (`User owner`) is not recognized and falls back to `interface{}` (`hybrid-store.html`).

### Enums (`gdl-advanced.html`)

```gdl
enum OrderStatus {
    PENDING,
    SHIPPED,
    DELIVERED,
    CANCELLED
}
```

Generates Go string enums, Protobuf enums, and GraphQL enums.

### Annotations (`gdl-annotations.html`)

| Annotation | Effect (as documented) |
|------------|------------------------|
| `@Federated` | Cross-silo reads/writes. Fan-out reads also need `?federated=true` (`multitenancy.html`, `federation.html`). Writes always enqueue `DistributedOutbox` rows. |
| `@Searchable` | ES index on mutation. Per-entity `GET /api/transactions/search` (example). Global `/api/search/:entity` **removed** in favor of per-entity routes. |
| `@Audited` | Intended row history. See audit limitation: middleware writes `audit_logs` (plural) on the master DB; `/history` and `/timeline` read per-silo `audit_log` (singular), which nothing currently inserts. |
| `@Version` | **Field-level.** Apply to a declared field. GORM rejects stale updates with HTTP 409. Example: `@Version int(32) v`. |
| `open` | Bypass Keycloak for `read`, `list`, `create`, `delete` (granular). Routes under `/open` + API prefix, e.g. `/open/api/transactions`. |
| `@Delete` | Purge generated code, `DROP TABLE`, clear `.go-duck/` snapshot. |
| `@ArchiveStatus` | Injects `archived` boolean. Equivalent to file directive `archived` / `archived *`. |
| `@TrackViews` | Shadow `{entity}_read_receipt`, endpoints `/assign-receivers`, `/view`, `/tracking/toggle`. Equivalent to `trackViews` / `trackViews *`. |
| `@Document` / `@isDocument` | MongoDB instead of PostgreSQL. PK becomes string ObjectID. |
| `@SoftDelete` | `deleted_at`, trash/restore instead of hard delete. Equivalent to `softDelete` / `softDelete *`. |
| `@Draftable` | `IsDraft`, `DraftOfId`, `/draft`, `/publish`. Equivalent to `draftable` / `draftable *`. |
| `@ActiveStatus` / `@IsActive` | `isActive` boolean default `TRUE`. |

File-level directives (`gdl-advanced.html`): `archived`, `softDelete`, `draftable`, `trackViews`, each with a name or `*`.

```gdl
softDelete Customer
draftable *
trackViews Order
open Article(read)
open EntityName
```

`open EntityName` disables auth for all actions. `open Entity(read, create)` is selective.

---

## Config keys & wizard outputs

Two shapes exist in the corpus. They are **not** identical. Do not treat one as a silent superset of the other.

### A. `configuration.html` “fullest” template

Nested under `go-duck:` unless noted.

```yaml
go-duck:
  name: "go-duck-master-app"
  version: "1.0.0"
  environment-tag: "prod"   # goduck.io/environment label; default "prod"
  server:
    port: 8080
    read-timeout: "30s"
    write-timeout: "30s"
    grpc:
      addr: ":9000"
      network: "tcp"
    cors:
      allow-origins: ["*"]
      allow-methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  datasource:
    host: "localhost"
    port: 5432
    username: "postgres"
    password: "password"     # sample in the HTML — replace
    database: "go_duck_db"
    max-open-conns: 25
    mongodb:
      enabled: true
      uri: "mongodb://localhost:27017"
      database: "go_duck_mongo"
  messaging:
    mqtt:
      enabled: true
      broker: "tcp://localhost:1883"
    nats:
      enabled: true
      url: "nats://localhost:4222"
  storage:
    s3: { enabled: false, bucket: "bucket-name", region: "us-east-1" }
    gcs: { enabled: false, bucket: "bucket-name", credentials-file: "keys.json" }
    minio: { enabled: true, bucket: "dev", endpoint: "localhost:9000" }
  telemetry:
    otel:
      enabled: true
      endpoint: "localhost:4317"
    metrics:
      prometheus-enabled: true
      stream-enabled: true
      stream-interval: "1s"
  security:
    access-policy:
      cache-ttl: "30s"
```

Guideline table on the same page also names, without a full YAML nest:

- S3/R2: `bucket`, `region`, `access-key`, `secret-key`
- GCS: `credentials-file`
- SFTP/SSH: `host`, `port`, `username`, `key-file`
- GitHub bootstrap: `owner`, `repo`, `token`, `files`
- `metrics.prometheus-enabled` → `GET /metrics`
- `metrics.stream-enabled` → `GET /api/system/stream` (SSE). `stream-interval` examples `"1s"`, `"500ms"`. Observability page says the SSE loop is **fixed at 1s** and does not read `stream-interval` yet.
- `security.access-policy.cache-ttl` caches `access_policies`. Writes via `/management/access-policy` are immediate on the serving pod, within one TTL elsewhere. Failed refresh keeps last-known-good.

### B. Browser wizard `generateYAML()` (`wizard.html`)

100% client-side. Not a `go-duck-cli` command. Download filename `config.yaml`.

Shape it emits (keys only; form also prefills placeholder client secrets — replace them):

```yaml
go-duck:
  name: # app_name, default go-duck-master-app
  version: # default 1.0.0
  server:
    rest:
      port: # default 8080
      protocol: "json"
      api-path-prefix: # /{kebab(app_name)}/api
    grpc:
      addr: # default :9000
      network: # default tcp
      timeout: "1s"
    cors:
      allow-origins: []
      allow-methods: []
      allow-headers: []
  datasource:
    host: # if pg enabled
    port:
    username:
    database:
    ssl-mode: "disable"   # wizard always sets this when Postgres is on
    mongodb: # if enabled: enabled, uri, database
  security:
    keycloak-host:
    keycloak-realm:
    keycloak-app-client-id:
    keycloak-app-client-secret:
    keycloak-service-client-id:
    keycloak-service-secret:
    keycloak-admin-client-id:
    keycloak-admin-secret:
    confidential-mode: # boolean
    rate-limit:
      rps: # form default 100
      burst: 200 # hardcoded in generateYAML, not a form field
  messaging:
    mqtt: { enabled: true, broker: } # broker default tcp://localhost:1883
    nats: { enabled: true, url: }    # default nats://localhost:4222
  cache:
    redis: { enabled:, host:, ttl: } # host localhost:6379, ttl 10m
  resilience:
    circuit-breaker: { enabled: true, failure-threshold: 5 }
  telemetry:
    otel: { enabled:, endpoint:, sampler-ratio: 1.0 } # endpoint default localhost:4317
  logging: # only if datadog enabled
    datadog: { enabled: true, api-key:, site: "datadoghq.com" }
  storage: # only if a provider is selected
    s3: { enabled: true, bucket:, region: } # region default us-east-1
    github: { owner:, repo: }               # split from org/repo field
    bootstrap: { enabled: true, files: ["id_rsa"] } # github path only
  elasticsearch: # if enabled
    enabled: true
    addresses: [] # form default http://localhost:9200
environment: # TOP-LEVEL, not under go-duck
  active_profile: "dev"
```

Wizard storage choices in the UI: none, AWS S3, GCP, MinIO, Git. The JS `generateYAML` only special-cases `s3` and `github`. MinIO/GCS buttons exist in the form; their YAML branches are not in `generateYAML` beyond `storage[activeStorage] = { enabled: true }` when the id matches. TODO: confirm MinIO/GCS button ids (`store-minio`, `store-gcs` appear as element ids).

Form defaults worth recording: CORS origins `*`; methods `GET, POST, PUT, DELETE, OPTIONS` (wizard list omits `PATCH`, fullest template includes `PATCH`); headers `Origin, Content-Type, Accept, Authorization, X-Tenant-ID`; Keycloak host `http://localhost:8080`; realm `go-duck-realm`; app client `go-duck-app`; service client `go-duck-service`; admin client `admin-cli`.

### Other keys named outside those two templates

| Key | Where | Notes |
|-----|--------|--------|
| `go-duck.server.rest.api-path-prefix` | `rest.html`, `integrations.html` | Default `/{app-name}/api`. No `v1` segment. |
| `elasticsearch.enabled`, `elasticsearch.auto_sync` | `elasticsearch.html` | Shown as a bare block, not nested under `go-duck`. Wizard uses `go-duck.elasticsearch.addresses` and does **not** emit `auto_sync`. |
| `go-duck.server.grpc.addr` | `grpc.html` | Default `:9000`. |
| `go-duck.server.grpc.web_enabled` | `grpc.html` | Default false. |
| `go-duck.server.grpc.web_port` | `grpc.html` | Default `9090`. gRPC-Web via `github.com/improbable-eng/grpc-web`. CORS `*`. |
| `server.port` | `gateway.html` | Gateway admin port, default `8080`. |
| `server.proxy-only-port` | `gateway.html` | Default `8081`. `0` disables. |
| `discovery.poll-interval` | `gateway.html` | Default 15s. |
| `discovery.environment` | `gateway.html` | Blank scans every tier. Example `"staging"`. |
| `go-duck.environment-tag` | `configuration.html`, `gateway.html` | Label `goduck.io/environment`. |
| `multitenancy.hide-silo-names` | `multitenancy.html`, `security.html`, `federation.html` | Default **false** in the shipped sample. `true` hides physical DB names from `GET /api/silos/me`. `security.html` also says this toggle lives in `application.yml` while showing the `go-duck:` YAML. |
| `multitenancy.require-role-grant` | `multitenancy.html`, `federation.html` | Default off. When true, caller role must also hold a grant for the tenant UUID. |
| `security.super-admin-role` | `keycloak.html`, `security.html` | Examples: `"SUPER_ADMIN"` and `"platform_admin"`. If unset, `SuperAdminRoleMiddleware` is disabled and calls through. |
| `security.keycloak-*` | `keycloak.html` | Same eight keys as the wizard. **No** `jwks-url` or `issuer` key. JWKS derived as `/realms/{realm}/protocol/openid-connect/certs`. |
| `security.rate-limit.rps` / `burst` | `keycloak.html`, wizard | Redis fixed-window by Keycloak ID; falls back to `golang.org/x/time/rate` per process. |
| `security.confidential-mode` | wizard | UI copy: “Shields management silos”. No further semantics in the HTML. |
| `security.cron-token` | `serverless.html` | Must match `X-Cron-Token` on `POST /api/system/cron`. |
| `cache.redis.enabled`, `host`, `key-prefix` | `redis.html` | Empty `key-prefix` falls back to the microservice name. |
| `cache.valkey.enabled`, `host`, `db`, `ttl`, `key-prefix` | `redis.html` | Mutually exclusive with Redis at generation: warning, Redis wins (Valkey force-disabled). If both left enabled at runtime, Valkey takes priority. |
| `logging.datadog.enabled`, `api-key`, `site`, `service` | `datadog.html`, `observability.html` | `api-key` and `site` accepted but **unused**. DogStatsD hardcoded to `127.0.0.1:8125`. Enabling does not ship logs. |
| `messaging.mqtt.username` / `password` | `mosquitto.html` | Compose defaults named `dev_user` / `dev_password`. `allow_anonymous false`. |
| `messaging.mqtt.topic` prefix | `realtime.html`, `mosquitto.html` | Pattern `{topicPrefix}/{tenantDB}/{entity}/{action}`. Example topic prefix `go-duck/events`. |
| `storage.bootstrap.enabled`, `provider`, `owner`, `repo`, `branch`, `token`, `files` | `storage.html` | `provider`: `github` (default), `azure`, `bitbucket`. |
| `integrations.wso2.enabled`, `publisher-url`, `client-id`, `client-secret`, `gateway-environments` | `integrations.html` | `gateway-environments` accepted but **not wired**. Generator hardcodes `visibility: PUBLIC`. |

Circuit breaker and rate limit are also described in prose on `configuration.html` (Redis-backed RPS/Burst by Keycloak identity) without extra keys beyond the wizard’s `resilience.circuit-breaker`.

---

## API

`{apiPrefix}` = `go-duck.server.rest.api-path-prefix`, default `/{app-name}/api`.

### REST (`rest.html`)

| Verb | Pattern |
|------|---------|
| GET | `{apiPrefix}/{entity}s/search?query=keyword` |
| GET | `{apiPrefix}/{entity}` list + GORM filters |
| POST | `{apiPrefix}/{entity}` |
| PATCH | `{apiPrefix}/{entity}/{id}` |
| DELETE | `{apiPrefix}/{entity}/{id}` |
| POST | `{apiPrefix}/{entity}/bulk` |
| GET | `{apiPrefix}/admin/audit` |
| POST | `/management/tenant/assign` |
| GET | `/management/tenant/provisions` |

- List response is a **bare JSON array**, not `{ "results": [...] }` (`integrations.html` Flutter note).
- `X-Total-Count` header. Pagination `?page=1&size=20` (1-indexed). Sort `?sort=field,direction` (`asc` default, `desc`).
- Eager load `?eager=true`. Example `GET {apiPrefix}/car/1?eager=true`.
- Bulk body is a JSON array. Transactional; one failure rolls back the batch across silos.
- Dynamic join: `GET {apiPrefix}/{entity}s/join/:entityB?onA=id&onB={foreign_id}&type=multiple`. Entity whitelist from GDL; unknown target → 403. Pagination applied on the primary entity first.
- Generic RPC: `GET {apiPrefix}/rpc/:table` uses `db.Table(tableName)`. Pagination **differs**: `?order=id.desc&limit=10&offset=0`.
- Generic join: `GET {apiPrefix}/rpc/join/:entityA/:entityB`.

Filter operators are suffixes on the key, never prefixes on the value (`?age.greaterThan=20`, not `?age=gt.20`):

`.equals` `.notEquals` `.greaterThan` `.lessThan` `.greaterThanOrEqual` `.lessThanOrEqual` `.contains` `.doesNotContain` `.in` `.notIn` `.specified`

JSONB path: `?metadata->a->b.equals=x` compiles to Postgres `#>>`. Segments must match `^[a-zA-Z0-9_]+$`. Invalid segment is **silently dropped** (no 400).

Headers:

- Empty `X-Tenant-ID`: federal broadcast on writes (sync all silos) / reads aggregate — this is the `rest.html` wording. Federation pages qualify reads: fan-out only when the entity is `@Federated` **and** `?federated=true`.
- `X-Tenant-ID: {opaque-uuid}` narrows to one silo. Comma-separated UUIDs for precision harvest. Unknown tenant → 403, not the default DB. `admin_db` is excluded unless the caller is super-admin.

### Elasticsearch (`elasticsearch.html` vs `gdl-annotations.html`)

`elasticsearch.html` still documents `GET /api/search/:entity?q=...`:

- `q=...` → `multi_match` fuzziness `AUTO`
- empty → `match_all`
- example `GET /api/search/car?q=Toyta` matches “Toyota”

`gdl-annotations.html` says the global `/api/search/:entity` route was **removed**; `@Searchable` scaffolds per-entity `GET /api/transactions/search`. `rest.html` lists `GET {apiPrefix}/{entity}s/search?query=keyword`. TODO: three URL shapes in the corpus (`/api/search/:entity?q=`, `/{entity}s/search?query=`, per-entity `/api/{entity}/search`). Document all three; do not collapse them.

Indices prefixed/partitioned per tenant (`elasticsearch.html`). `@Searchable` indexes on mutation.

### GraphQL (`graphql.html`)

Proof of concept. Generated `.graphqls` is a real SDL (entities, enums, relationships). `POST /graphql` exists and resolves tenant/silo context, but **does not execute queries**. Any body returns:

```json
{ "data": "Federated GraphQL Handler active with 3 silos." }
```

Generated resolvers (`Resolve{Entity}Federated`, etc.) are unused. No gqlgen / graphql-go wired in.

### gRPC (`grpc.html`)

- Kratos services per entity. Sample HTTP annotation in the snippet uses `get: "/v1/entity/{id}"` (this `/v1` is in the proto example, not the REST prefix).
- OIDC interceptors in Kratos middleware.
- Native gRPC `:9000` (`go-duck.server.grpc.addr`).
- gRPC-Web opt-in `:9090`.
- Same TenantManager silo routing as REST.
- Serverless mode disables the gRPC server (`serverless.html`).

### Gateway (`gateway.html`)

```bash
go-duck create-gateway -c CONFIG/strait-of-duck-config/config.yaml -o my-gateway
```

- Discovers Services/Deployments with label `goduck.io/managed=true` (generated apps already carry it).
- Poll `discovery.poll-interval` (default 15s). Failed poll keeps last-known-good snapshot.
- In-memory map only. No database.
- Reverse proxy is **not** an auth chokepoint. No header injected. Downstream JWT/DuckGuard still applies. Path `/proxy/:service/*rest`.
- Admin port (`server.port`, default 8080): `/ui/swagger`, `/ui/metrics`, `/api/services`, `/proxy/*`. UI uses `keycloak-js` `onLoad: 'login-required'`. JSON APIs 401 without a token.
- Proxy-only port (`server.proxy-only-port`, default 8081): `/health` and reverse proxy only. UI handlers are not registered. `0` disables.
- Pod logs/metrics: `GET /api/services/:name/swagger.json`, `GET /api/services/:name/metrics`, `GET /api/pods/:namespace/:pod/logs`, `GET /api/pods/:namespace/:pod/metrics`.
- ClusterRole `get/list/watch` on services, endpoints, pods, deployments. Each app gets its own namespace.
- `discovery.environment` filters `goduck.io/environment`.

### Hybrid-Store (`hybrid-store.html`)

- Default store PostgreSQL. `@isDocument` / `@Document` → MongoDB, string `primitive.ObjectID` vs SQL `uint`.
- Cross-DB relationships inject both `gorm` and `bson` tags and coerce ID types.
- Federated harvest runs goroutines across both engines.

### Multi-tenant and federation

- Hard silos: separate database/schema, not shared-table soft tenancy.
- Standard entity: tenant primary DB only.
- `@Federated` entity: writes always write a `DistributedOutbox` row per authorized silo in the same transaction (no opt-in header). Reads fan out only with `?federated=true`.
- Without `@Federated`, extra DBs assigned to a role are not harvested; primary/default only.
- `GET /api/silos/me` returns opaque UUIDs. Physical names included unless `multitenancy.hide-silo-names: true`.
- `POST /management/tenant/assign` creates DB, UUID mapping, migrations. JWT + `SuperAdminRoleMiddleware`.
- `GET /management/tenant/provisions` lists the registry.
- Connections lazy. Silo-connection cache is a singleton so pools stay warm.
- `multitenancy.require-role-grant: true` also requires the caller’s role to hold a grant. Default: UUID alone is the credential (issued via `/api/silos/me`).

### Saga (`saga.html`)

Table `distributed_outbox`: `event_type` (CREATE, UPDATE, DELETE, BULK_…), `payload` JSONB, `status` (PENDING, COMPLETED; FAILED exists in schema but the worker never sets it), `retry_count`.

Worker polls every 10s, max 5 attempts, no backoff. After 5 failures the row stays PENDING. Worker writes with GORM to each target silo plus optional HTTP webhooks.

NATS subject `events.<tenantDB>.{entity}.{action}` is a separate pub/sub channel, not the saga transport. Example `events.acme_db.article.*`.

Serverless: `processOutbox()` is unexported and not registered on `POST /api/system/cron`.

---

## Ops

### WebSockets (`realtime.html`)

- `ws://localhost:8080/ws`
- Fixed actions per entity: `GET_{ENTITY}S` (works), `CREATE_{ENTITY}` (**stub**, does not write).
- Envelope: `{ action, payload, signature }`. HMAC-SHA256 of **payload only**.
- Secret is a hardcoded string in generated `ws/handler.go`: `go-duck-super-secret-key`. Same default in every app until edited.
- `/ws` is behind `JWTMiddleware`, which reads only `Authorization`. Browser `?token=` gets `401 Authorization header required`. Query-param WS auth does not work out of the box.

MQTT topic `{topicPrefix}/{tenantDB}/{entity}/{action}`. Example:

```bash
mosquitto_sub -t "go-duck/events/tokyo_silo/Car/DELETE"
```

NATS:

```bash
nats sub "events.*.Car.>"
```

Mutations broadcast to both brokers when enabled.

### Mosquitto (`mosquitto.html`)

- Package `messaging` (Eclipse Paho). Reconnect, optional TLS.
- `messaging.PublishEvent(prefix, tenant, action, entity, payload, nil)`
- Raw: `messaging.MQTTClient.Publish(topic, qos, retained, payloadBytes)`
- `POST /api/system/mqtt/publish` JSON `{ topic, payload, qos, retained }`, gated by `messaging.mqtt.enabled`.
- Compose broker `allow_anonymous false`. Defaults `dev_user` / `dev_password` via `go-duck.messaging.mqtt.username` / `password`.
- Swagger UI has an MQTT console that needs Mosquitto WebSockets (port 9001).
- Audit is **not** published to MQTT. `AuditMiddleware` writes Postgres for every non-GET, not gated by `@Audited`. Query `GET {apiPrefix}/admin/audit`.

### Audit (`audit.html`)

- Global `AuditMiddleware`: background goroutine after the response. Not in the business transaction. Crash can drop the row.
- Writes master DB table `audit_logs` (plural, GORM default, no `TableName()`), keyed by URL.
- `@Audited` `/history` and `/timeline` read per-silo `audit_log` (singular). Nothing inserts that table, so those endpoints are empty on a fresh app.
- Delta stored as `TEXT`, not `jsonb`. `tenant_db` string for filtering.
- Actor: Keycloak ID and email.
- Metering: Redis quotas. Over quota → HTTP 402 JSON `{ error, limit, current_use, target, auto_reset }`. No success header. `MeteringMiddleware` calls through when under quota.

### Observability (`observability.html`, `otel.html`, `datadog.html`)

- OTel: `otelgin` → controllers → `gorm.io/plugin/opentelemetry/tracing`. Export `otlptracegrpc` to collector `:4317`. Local Jaeger UI `http://localhost:16686`.
- Collector config generated with debug exporter + OTLP to Jaeger only.
- `GET /metrics` Prometheus (`prometheus/client_golang`) for HPA.
- `GET /api/system/stream` SSE event `metrics` (gopsutil). Interval fixed at 1s despite `telemetry.metrics.stream-interval`.
- `GET /api/system/logs/stream` SSE logs.
- `GET /api/system/widget` and `GET /api/system/grid` HTML widgets.
- `GET /api/system/metrics` JSON: `system`, `endpoints`, `status_codes`, `failed_calls`. Cache hit/miss and Redis/Valkey status live under `system` (`redis.html`).
- Datadog: `logger.TraceMetric(name string, value float64, tags []string)` is a **gauge** only. No `Count` / `Histogram` / `Gauge` helpers. No zap. `logger.Info` is printf-style. Logs stay on stdout + SSE; Agent must scrape stdout. StatsD address hardcoded `127.0.0.1:8125`.

---

## Infra

### Security / DuckGuard / Triple-Identity (`security.html`)

- JWT middleware on Gin; Kratos authn on gRPC.
- DuckGuard: data-driven matrix. Naming an endpoint in any ALLOW turns it into a whitelist. Precedence scored (user pin > named role > exact path > named method), not “deny always wins”. Endpoints with no rule stay allowed.
- `POST /management/access-policy` body example: `{ "endpoint": "/api/reports", "method": "GET", "realmRole": "ROLE_FINANCE", "effect": "ALLOW" }`.
- `GET /management/access-policy`, `PATCH /:id/toggle`, `POST /management/access-policy/simulate`.
- Cache `security.access-policy.cache-ttl` default `30s`.
- Super-admin boundary: `/management/*` and `/api/admin/*` vs business `/api/*`.
- Rate limit: Redis fixed window by Keycloak user id (IP fallback). Survives IP changes.
- HMAC-SHA256 on REST-over-WS envelopes (see WebSockets).
- `GET /api/silos/me` sample shape: `{ "tenantId", "roleName" }`.

### Keycloak (`keycloak.html`)

- JWKS in-memory cache, `sync.RWMutex`.
- `StartJWKSCacheWarmer`: fetch on boot, then hourly.
- On-demand refresh at most once per 10 seconds.
- Unknown `kid`: one synchronous refresh before failing.
- Roles: `realm_access.roles` plus every `resource_access.*.roles`.
- Context field `KeycloakID` (anti-spoof for audit/metering).
- Three clients: app (user OIDC), service (M2M), admin (Keycloak Admin API).

### Redis (`redis.html`)

- Cache-aside. Redis down → skip cache, hit DB. Boot probe so a dead cache does not block startup.
- Key shape: `{prefix}:{role}:{Entity}:{id}` example `warehouse-service:public:User:123`. Role prefix, not raw tenant id.
- Invalidation: `cache.ClearPattern(...)` async after mutations.
- API: `cache.Set(key, value, ttl)`, `cache.Get(key, &dest) bool`.
- Valkey uses the same code path with `cache.valkey`.
- Health on `/api/system/metrics`.

### Storage (`storage.html`)

Providers named: AWS S3, GCS, Cloudflare R2, MinIO, generic S3, SFTP, GitHub, Azure DevOps Git (not Blob), Bitbucket (bootstrap).

```go
provider, ok := storage.Providers["gcs"]
url, err := provider.Upload(ctx, "invoices/March.pdf", data)
```

HTTP:

- `POST /api/storage/upload?provider=` multipart field `file`, optional `folder`
- `GET /api/storage/download/:key?provider=`
- Omit `provider` → first enabled provider in `storage.Providers`.

Bootstrap auth: github `Authorization: token`; azure HTTP Basic empty username; bitbucket Basic (if username set) or Bearer.

### Serverless (`serverless.html`)

- AWS: `lambda_main.go`, `aws-lambda-go-api-proxy`, `go build -tags lambda -o bootstrap lambda_main.go`. Init in package `init()`, pool reused while the environment lives.
- Vercel: `api/index.go`, `vercel.json` rewrite `"/(.*)"` → `/api/index`. Router built lazily with `sync.Once`.
- GCF: `gcf_handler.go` export `GoDuckEntry`, `//go:build gcf`, example runtime `go124`, region `us-central1`.
- Shared `router` package with `main.go`.
- gRPC server disabled in serverless.
- `POST /api/system/cron` + header `X-Cron-Token` matching `go-duck.security.cron-token`. Outbox worker is not registered on it.

### Integrations (`integrations.html`)

Angular `HttpClient` uses `page` and `size` (not `pageSize`). Suggests `keycloak-angular`. Flutter must decode a JSON array. WSO2 Publisher import of OpenAPI 3 on boot; also `/v3/api-docs` and `/swagger.json` for Kong, Apigee, JHipster-style clients.

---

## Brand

Website CSS (`index` and shared layout):

- Gradient text: `#6366f1`, `#a855f7`, `#ec4899`
- Active sidebar: blue `#1e40af` / `#3b82f6` on `#ebf5ff`
- Primary buttons in the layout: indigo (`bg-indigo-600` / `bg-indigo-700`)
- Terminal chrome in CLI samples: `#1e1e1e` / `#2d2d2d`
- Fonts: Inter, JetBrains Mono

`logo.png` is a square multicolor mark (yellow / cyan / blue / red), used in the HTML at about 40px next to the wordmark “GO-DUCK”, not as a full-bleed hero photo.

Starlight accent used in this repo: **`#6366f1`**.

---

## Gaps (TODO — not invented)

- How to install the `go-duck` / `go-duck-cli` binary.
- Whether `go-duck` and `go-duck-cli` are the same binary.
- Which Elasticsearch URL is current (`/api/search/:entity?q=` vs `/{entity}s/search?query=` vs per-entity `/search`).
- Whether `elasticsearch.auto_sync` and wizard `elasticsearch.addresses` are both valid, and whether the block is top-level or under `go-duck`.
- `configuration.html` `server.port` vs wizard `server.rest.port` — both appear; REST docs cite `server.rest.api-path-prefix`.
- `confidential-mode` behavior beyond the wizard label.
- Wizard MinIO/GCS YAML beyond `{ enabled: true }`.
- `stream-interval` is documented and also documented as unread.
- GraphQL execution, WS `CREATE_*`, per-silo `audit_log` inserts, Datadog log shipping, WSO2 `gateway-environments`.
