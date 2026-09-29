# Changelog

Milestone history for GO-DUCK-CLI, newest first. Architecture, generator pipeline,
and contribution guidance live in [AGENTS.md](AGENTS.md) — this file is history only.

Entries dated before 2026-07-15 were migrated verbatim from the milestone log that
previously lived in `AGENTS.md`.

## Unreleased

Shipped on `feature/wso2-apimanager` and `feature/db-mig-fix`, not yet folded into a dated
milestone entry.

- **Zero-Indexed Pagination Alignment Across REST, gRPC, and Client SDKs (2026-09-07)**:
  fixed offset calculation across all entity controllers (`GetAll`, `GroupBy`), Kratos gRPC services,
  and SDK templates (Angular, Ionic). Previously, controllers used `(page - 1) * size` with default `page=0`,
  which caused both `page=0` and `page=1` to incorrectly return the identical 1st page (`offset = 0`).
  Standardized to 0-based indexing: `offset := page * size` (with `page < 0` guarded to `0` and default `size=20`),
  ensuring `page=0` returns the 1st page, `page=1` returns the 2nd page, `page=2` returns the 3rd page, and so on.

- **Tenant Provision Registry Management Endpoint (`GET /management/tenant/provisions`) (2026-09-07)**:
  added a new SuperAdmin management endpoint `GET /management/tenant/provisions` to query and inspect the
  complete `tenant_roles` database-silo provisioning registry table. Includes optional query filtering by
  `tenantId`, `roleName`, and `dbName`. Updated the generated Swagger documentation, Postman collection,
  AI endpoint markdown reference, and web documentation.

- **SonarQube DevOps Container & Automated Quality Benchmark Audit (2026-09-02)**: added
  SonarQube Community Edition Docker image (`sonarqube:community` on port 9000 with persistent data/extension/log
  volumes) to `devops/services.yml` and Kubernetes manifests (`k8s/sonarqube.yaml`). Scaffolding now emits
  `sonar-project.properties` pre-configured for Go (`coverage.out`, exclusions for generated protos/manifests/docs)
  and an automated audit script (`sonar_benchmark.sh` in project root and `devops/`, with `0o755` permissions).
  Running `./sonar_benchmark.sh` executes `go test -coverprofile=coverage.out`, runs SonarScanner (via local CLI
  or Docker `sonarsource/sonar-scanner-cli`), inspects microservice modules/controllers/models, and renders a
  comprehensive, print-ready HTML benchmark audit report (`sonarqube_benchmark_report.html`) complete with
  Quality Gate status, Grade A metrics cards, layer-by-layer breakdown, and verified entity tables.

- **Schema Diffing & Non-Destructive Migration DDL Engine Fixed (2026-09-02)**: resolved critical
  schema diffing and SQL generation bugs. (1) In `index.js`, field comparison in `delta` calculation
  previously used case-sensitive literal equality (`f.name === pf.name`), causing field casing variations
  (e.g., camelCase vs. snake_case like `contactPhoneNumber` vs. `contact_phone_number`) to be classified
  simultaneously as a deleted field and a new field; fixed by normalizing field comparisons with `toSnakeCase()`.
  (2) `generators/migrations.js` now tracks emitted columns (`emittedColumnsInUp`) and cross-checks active
  schema fields to prevent emitting contradictory `ADD COLUMN IF NOT EXISTS` and `DROP COLUMN IF EXISTS` on
  the same target table within the same migration pass. (3) Replaced destructive `DROP COLUMN` + `ADD COLUMN`
  fallback on column type alterations with non-destructive PostgreSQL native
  `ALTER TABLE <table> ALTER COLUMN <col> TYPE <new_type> USING <col>::<new_type>` (and symmetric reversal in
  Down migrations), preventing permanent data loss during type migrations.

- **Strait of Duck Gateway: per-pod console logs and system vitals, plus two pre-existing build
  bugs fixed along the way (2026-08-21)**: the metrics UI (`/ui/metrics`) previously only listed
  services with a bare pod count. It's now a collapsible accordion — each service expands to list
  every individual pod (phase, node, IP, restart count), and each pod has a "View Console" button
  opening a detail modal with **real** Kubernetes pod logs (`clientset.CoreV1().Pods().GetLogs()`,
  the same data `kubectl logs` shows — not synthesized) plus live CPU/Memory/Network/Disk vitals
  charted with Chart.js, polling that specific pod's own `/api/system/metrics` directly by pod IP
  (not the Service's ClusterIP, which would load-balance to a random pod instead of the one clicked).
  `generators/gateway.js`'s `discovery/k8s.go` now also lists Pods (not just Services/Deployments)
  and groups them by the `goduck.io/service` label; `router/router.go` gained
  `GET /api/pods/:namespace/:pod/logs` and `.../metrics`; the RBAC ClusterRole gained a
  `pods/log` `get` grant (log access is a separate subresource from `pods` itself). Network/disk
  data required extending `generators/telemetry.js`'s `SystemMetrics` (used by every generated
  app, not just the gateway) with `disk_total_mb`/`disk_used_mb`/`disk_used_pct` (via
  `gopsutil/v3/disk`) and cumulative `net_bytes_sent`/`net_bytes_recv` (via `gopsutil/v3/net`) —
  both packages were already transitive deps of the existing `gopsutil/v3` require, no new module.
  **Found and fixed two pre-existing bugs while establishing a build baseline before starting**:
  (1) `proxy/reverse_proxy.go` imported `net/url` (unused) and used `strings.HasPrefix` without
  importing `strings` at all — the generator has never produced a compiling gateway until this fix;
  (2) a `go vet`-flagged `fmt.Sprintf("/services/%%s%%s", ...)` — the escaped `%%s` produces a
  literal `%s` in Go (zero actual verbs) rather than an interpolated one, always yielding the literal
  string `/services/%s%s` on the one dead code path that used it. Verified via a fresh
  `create-gateway` generation: `go build`, `go vet`, and `gofmt -l` all clean; extracted the
  generated inline JS/HTML and confirmed via `node --check` (valid JS) and a DOM-id cross-reference
  (every `getElementById` call resolves to a real element) that the new accordion/modal wiring is
  structurally sound. Not verified against a live cluster in this sandbox (none available) — a real
  pod discovery + log-streaming + chart-polling smoke test is still worth doing against an actual
  deployment.
- **Storage subsystem fixed — one failed credential bootstrap silently disabled every storage
  provider, and a dead SFTP connection never recovered (2026-08-20)**: reported by a developer on a
  generated project (`PMB/DocModule`) — file uploads over SFTP started failing after previously
  working. Two bugs in `generators/storage.js`. **(1)** `InitStorage` ran
  `BootstrapCredentials(cfg)` first and returned immediately on any error — a single transient fetch
  failure (network blip, rate limit, expired token fetching the SFTP key file from the configured
  Azure/GitHub/Bitbucket bootstrap repo) skipped registration of *every* provider, including ones
  with no dependency on the fetched file at all (S3, GCS, MinIO, R2, Generic, Azure DevOps git
  storage) — `storage.Providers` stayed permanently empty for the process lifetime, so every
  upload/download hit "No storage providers enabled." Fixed: bootstrap failure is now logged as a
  warning and provider registration continues regardless, matching the non-fatal handling its own
  caller (`router.go`) already assumed. **(2)** `SFTPProvider` dialled its SSH/SFTP connection exactly
  once, at construction (inside `InitStorage`, at boot) — if that single dial failed for any reason
  (SFTP host briefly unreachable, key not yet on disk), `client`/`sshClient` stayed `nil` forever;
  every subsequent request returned "sftp client is not connected" until the process was manually
  restarted, with no self-healing. Fixed: added `connect()` + `ensureConnected()` (mutex-guarded), so
  every `Upload`/`Download` call verifies the connection is actually alive (an idle SSH connection
  can go stale from a network blip without Go noticing until the next syscall) and transparently
  redials if it's missing or dead. Also removed a duplicate `GitHub` provider registration line and
  replaced the previous silent `ssh.Password("fallback")` no-op auth fallback with a clear error when
  neither a key file nor a password is configured. Fixed identically in both the generator template
  and the already-generated `PMB/DocModule` app. Verified via a fresh `create` generation with SFTP
  enabled (`go build`/`go vet` clean) and a full `go build ./...` of the patched `DocModule` app.
- **`X-Tenant-ID` routing fixed — a provisioned tenant silo could be unreachable via its own tenant
  ID (2026-08-18)**: reported by a developer — posting with `X-Tenant-ID` set to their own
  provisioned tenant wasn't landing in that tenant's silo. Traced two compounding bugs in
  `generators/multitenancy.js`'s `TenantMiddleware`. **(1) Case-sensitivity mismatch**: the incoming
  header was force-lowercased (`strings.ToLower(c.GetHeader("X-Tenant-ID"))`) but the SQL lookup
  compared it against `tenant_id` with no `LOWER()` wrapper, while `CreateDatabaseAndMigrate`
  lowercased `DBName` at provisioning time but never normalized `TenantID` the same way — any tenant
  provisioned with a mixed-case ID (normal for a human-chosen ID like `"Tokyo-01"`; only
  auto-generated `uuid.New().String()` IDs happen to always be lowercase) could never match on
  lookup. **(2) Silent fallback instead of a loud error**: when the mapping query returned zero
  rows — from bug (1), or any other mismatch — the middleware silently connected to the
  fallback/default database and let the request proceed as if nothing were wrong, rather than
  rejecting per the already-documented "zero-trust fallback" invariant (`README.md`, `AGENTS.md`).
  A mis-typed or stale `X-Tenant-ID` looked exactly like success, just routed to the wrong database.
  Fixed: (a) `LOWER(tenant_id) IN ?` on both `TenantMiddleware` and `PublicTenantMiddleware`, (b)
  `TenantID` normalized to lowercase at provisioning alongside `DBName`, (c) a request carrying an
  explicit `X-Tenant-ID` that resolves to zero silos is now rejected with 403 instead of falling
  back. Also clarified the underlying authorization model per product decision: a comma-separated
  `X-Tenant-ID` is now resolved by tenant UUID alone, independent of the caller's realm role — the
  opaque UUID (handed out per-grant via `GET /api/silos/me`) is a self-sufficient credential, not a
  filter intersected against the caller's role-authorized silos as it was before. `admin_db` remains
  carved out unless the caller holds the super-admin role. Verified via a fresh `create` generation:
  clean `go build` on `middleware/`, `management/`, `config/`, `models/`, `cache/`. Website docs
  (`README.md`, `multitenancy.html`, `federation.html`) and `AGENTS.md`'s invariant updated to match.
  **Follow-up, same day**: made the authorization model configurable rather than a single fixed
  choice — new `multitenancy.require-role-grant` boolean (`generators/config.js`, default `false`).
  `false` (default) keeps the UUID-sufficient behavior above; `true` reverts the `X-Tenant-ID` path
  to requiring both a role match AND a tenant_id match (`LOWER(role_name) IN ? AND LOWER(tenant_id)
  IN ?`) — lets an operator require per-user provisioning onto secondary silos instead of trusting
  UUID possession alone. Added to all 5 sample `CONFIG/*.yaml` files.
- **`google/api/{annotations,http}.proto` bundled instead of fetched over the network — fixes a
  live, reproduced protoc failure (2026-08-17)**: found via a real `./generate.sh` failure on a
  generated project (`DAD-mock-service`) — `third_party/google/api/annotations.proto:1:1: Expected
  top-level statement`, `Import "google/api/annotations.proto" was not found or had errors`.
  Reproduced the exact cause live: `generate.sh`, `generate.bat`, and `generators/devops.js`'s
  Dockerfile all independently `curl`'d these two files from
  `raw.githubusercontent.com/googleapis/googleapis/master/...` at build/compile time with no
  `-f`/`--fail` flag and no content validation. `raw.githubusercontent.com` is currently rate
  limiting (`HTTP 429`, confirmed with `curl -w '%{http_code}'` against the live URL) — curl treats
  a 429 response as a successful request, so the rate-limit response body gets written into the
  `.proto` file verbatim, and protoc fails on line 1 with an error that gives no indication a
  network fetch is the actual cause. Fixed at the root: the two files (Apache-2.0, ~15KB combined)
  are now bundled in the CLI at `templates/proto/google/api/` and copied into every generated
  project's `third_party/google/api/` at `create`/`import-gdl` time
  (`generators/kratos.js`) — checked into the generated project like any other generated file, so
  neither `generate.sh`/`generate.bat` nor the Dockerfile need network access for this at all
  anymore; both now fail loudly with a clear message instead if the files are somehow missing.
  Also dropped the now-unused `curl` from the Dockerfile's `apk add` line. Verified end-to-end, not
  just reasoned about: generated a fresh project and ran the real `./generate.sh` against the same
  currently-rate-limited network — `farmer.pb.go`/`farmer_grpc.pb.go` compiled successfully.
- **`go.mod` template drift fixed — the class of bug behind `go: updates to go.mod needed` failing
  a generated project's Docker build at the very last step (2026-08-17)**: found via a real Azure
  Pipelines failure on a generated project (`PMB/PolicyModule`). Root cause: `index.js`'s hardcoded
  `go.mod` template (written by both `create` and `import-gdl`, previously two independent
  copy-pasted copies) had drifted from what the generator suite actually imports — audited every
  `.hbs` template and generator's Go import statements directly rather than trusting the symptom.
  **Missing** (real imports with no require line — the actual cause of the build failure):
  `github.com/pkg/sftp` (storage.js SFTP), `github.com/shirou/gopsutil/v3` (telemetry.js system
  metrics), `github.com/shopspring/decimal` (the `BigDecimal` GDL type's Go mapping),
  `golang.org/x/crypto` (SFTP key handling), `golang.org/x/time` (security.js rate limiting),
  `go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc` (OTLP trace export). **Unused**
  (confirmed zero references anywhere in `templates/`/`generators/`, safe to drop):
  `github.com/gin-contrib/cors`, `github.com/redis/go-redis/v9` (the actually-used client is
  `go-redis/redis/v8`, a different module), `github.com/99designs/gqlgen`,
  `github.com/vektah/gqlparser/v2`, `github.com/go-resty/resty/v2`. Also hardened
  `generators/devops.js`'s Dockerfile so this class of drift self-heals even if it recurs: added
  `RUN go mod tidy` immediately before the final `go build` step (network-independent — `go.sum` is
  already copied and pins every version, so this only reconciles `require` lines against actual
  imports) and changed `COPY go.mod ./` to `COPY go.mod go.sum* ./`. Verified end-to-end: generated
  a fresh project, `go mod tidy` converged with zero further additions or removals beyond what was
  specified (confirming both the audit and the fix were exactly right), and `go vet` passed clean
  on every package not blocked by the pre-existing, documented, unrelated protobuf-codegen gap
  (`internal/service` needs `protoc` to have run first — see Known Gaps in AGENTS.md).
- **JPA-style JSONB filtering fixed, plus a pre-existing SQL injection vector closed (2026-08-17)**:
  `GET /api/{entity}`'s dynamic filter loop had zero JSONB awareness — a filter on a bare JSONB
  field (`?metadata.equals=x`) produced a Postgres type error, and a nested-path filter
  (`?metadata.status.equals=x`, following the same dot convention as every other field) produced
  `WHERE metadata.status = ?`, which Postgres rejects as a missing table reference (there is no
  table named `metadata`). New `ParseJPAFilterField` helper (generated once per entity into
  `templates/go/controller.go.hbs`, shared by all three GORM filter loops in that file — the main
  endpoint, the dynamic join endpoint, and `GroupBy`) resolves `field->key` / arbitrarily nested
  `field->a->b` into Postgres's `#>>` path operator, always extracted as text so every existing
  operator works unchanged. `generators/postgrest.js`'s RPC layer had its own working
  single-level `->`/`->>` scheme already — unified onto the same multi-level `#>>` convention via a
  new `parseFilterKey` helper there. **Also closed while in this code**: none of these four
  duplicated filter loops validated the query-string *key* before splicing it into a raw SQL
  fragment (`query.Where(dbField+" = ?", val)` — GORM only parameter-binds `val`), a real SQL
  injection vector via a crafted filter field name, not just a value. Both new helpers reject any
  field/path segment not matching `^[a-zA-Z0-9_]+$`, verified against adversarial input
  (`name'; DROP TABLE widgets;--` as a query key) with a throwaway Go harness before landing.
  Swagger docs updated to match: JSON/JSONB fields no longer advertise nonsensical
  `.greaterThan`/`.lessThan` filters on a whole JSON object (`generators/swagger.js`), and the RPC
  endpoint's docstring — which described the wrong syntax entirely (classic PostgREST
  `column=op.value` instead of this project's own `.operator`-suffix convention) — now documents
  what `parseFilterKey` actually implements.
- **SDG reverse-proxy 404s and image-tag mismatch fixed, found via a real deployment (2026-08-16)**:
  `proxy/reverse_proxy.go` was forwarding only the `*rest` wildcard tail (`c.Request.URL.Path =
  c.Param("rest")`), dropping the `:service` segment entirely. Since GO-DUCK apps mount their REST
  API under `api-path-prefix` (default `/<service-name>/api`), the downstream router's own path
  never matched what arrived, producing a 404 *from the downstream app*, not the gateway. Fixed to
  forward `"/" + serviceName + c.Param("rest")`, verified against Gin's actual wildcard-parsing
  behavior with a throwaway `httptest` harness before landing. Also added a hyphen/case-insensitive
  fallback to `Registry.Get()` (exact match tried first) so a caller using `plk-access-control`
  still resolves a service literally named `plk-accesscontrol` — an accepted, documented ambiguity
  on the fallback path only. Separately, `generators/devops.js`'s app Deployment template hardcoded
  `image: ${dockerImageName}:latest` while `push.sh` defaulted to pushing `VERSION:-1.0.0` — two
  independent literals that never matched, so a fresh `create` → `push.sh` → `kubectl apply` always
  deployed a manifest referencing a tag that was never pushed (`imagePullPolicy: IfNotPresent`
  turned that into a silently stuck rollout rather than an obvious error). Both now derive from the
  same `config.version` field. **Deliberately not adopted**: a fallback route pattern
  (`/:service/*rest` registered bare at the top level, gated by a hardcoded exclusion list of
  existing route names) that was found already partially patched into `gateway.js` — removed in
  favor of the root-cause fix above, since a bare wildcard sibling to `/health`/`/ui/*`/`/api/*` is
  collision-prone and the exclusion list doesn't scale.
- **Strait of Duck Gateway / `create-gateway` (2026-08-15)**: New standalone command and generator
  (`generators/gateway.js`) scaffolding a separate Go service — marketed as **Strait of Duck
  Gateway (SDG)**, docs-only name, same disclosure convention as DuckGuard ACL — that discovers
  other GO-DUCK microservices in Kubernetes (polling the API, no watch/informers, no database) and
  reverse-proxies to them (`/proxy/:service/*rest`, no auth imposed by the gateway itself — each
  downstream service's own middleware still governs it) across **two separate ports on two separate
  `*gin.Engine` route trees**: `server.port` (admin, default 8080) carries the Keycloak-gated
  2-page UI (`/ui/swagger`, `/ui/metrics`, each with a live service-picker dropdown; the metrics
  page always shows pod count per service and can drill into a selected service's existing
  `/api/system/metrics`) plus `/api/services*` plus the proxy; `server.proxy-only-port` (default
  8081, `0` disables it) carries *only* `/health` and the proxy — the UI/API handlers are never
  registered on that engine at all, not merely hidden, so it's safe to `kubectl port-forward` or
  SSH-tunnel to a developer without also exposing the fleet's topology. Requires a small, additive
  prerequisite change to
  `generators/devops.js`: every generated app's Deployment and Service now also carry
  `goduck.io/managed`/`goduck.io/service`/`goduck.io/environment` labels (existing `app:`
  label/selectors untouched) — the entire contract the gateway's discovery cache depends on. Apps
  generated before this change are invisible to the gateway until redeployed. Ships its own RBAC
  (`ServiceAccount` + read-only cluster-scoped `ClusterRole`/`ClusterRoleBinding`, since apps each
  live in their own namespace) and sample config at `CONFIG/strait-of-duck-config/config.yaml`,
  rooted at `strait-of-duck:` rather than `go-duck:`. The `goduck.io/environment` label is sourced
  from a new `go-duck.environment-tag` config field (default `"prod"`) — an app's own config.yaml
  chooses its tier, and the gateway's `discovery.environment` setting optionally filters discovery
  down to just one tier (blank, the default, scans every tier it can see). Deliberately a new,
  separate field rather than reusing the pre-existing `environment.active_profile` top-level key,
  which only controls which `application-{profile}.yml` the running binary loads and was never read
  by `devops.js` in the first place (`loadConfig()` only unwraps the `go-duck:` root).
- **Preserve-needle self-trigger bug fix (2026-08-15)**: `hasPreserveNeedle()` in
  `utils/file_manager.js` now requires `// @go-duck-preserve` to be the *entire* trimmed content
  of a line, not merely a substring anywhere in the file. The old whole-file `content.includes()`
  check meant any generator documenting the feature in prose could accidentally trip it on the very
  first write. Confirmed live (not hypothetical) in four already-shipped files that self-froze on
  their first `create` and were never updated by any subsequent `import-gdl`: `AGENT_README.md`,
  `docs/ai/SCHEDULING_AND_PRESERVATION.md`, `docs/ai/INTERCEPTORS.md`
  ([generators/ai_docs.js](GO-DUCK-CLI/generators/ai_docs.js)), and `docs/web/cli.html`
  ([templates/docs/pages/cli.hbs](GO-DUCK-CLI/templates/docs/pages/cli.hbs)). The one legitimate
  production usage — `templates/go/interceptor.go.hbs`, which ships with the needle as line 1 by
  design — still matches correctly.
- **`import-gdl --dry-run` (2026-08-15)**: New flag previews an incremental import without
  writing anything to disk. `utils/file_manager.js` gained a dry-run mode that short-circuits
  every mutating `fs-extra` call the generators use (`writeFile`, `writeFileSync`, `remove`,
  `copy`, `writeJson`) behind the existing preserve-needle check, so the *entire* generation
  pipeline runs unmodified and reports exactly what it would have touched. Migration SQL under
  `migrations/sql/*.sql` is printed in full, with any file containing `DROP TABLE` / `DROP COLUMN`
  flagged in red, closing the "destructive migrations generated with no preview" gap.
- **Generated smoke test (2026-08-15)**: `generators/tests.js` now emits `main_test.go` — a single
  dependency-free test asserting `config.LoadConfig()` succeeds — into every scaffolded project, so
  `go test -v ./...` has at least one real test instead of an empty suite. Also fixed the CI
  workflow itself: `generators/devops.js` was emitting the shell builtin `test -v ./...` instead of
  `go test -v ./...`, which failed on every generated repo's pipeline regardless of test content.
- **DuckGuard ACL — Federated Access Matrix (`v2.0.5`, 2026-08-14)**: New
  `generators/access_policy.js` emits an OPA-style ALLOW/DENY rule engine —
  `models/access_policy.go`, `middleware/access_policy.go`, and a super-admin CRUD API under
  `/management/access-policy` (including a `POST /simulate` dry-run). "DuckGuard ACL" is the
  product name for the enforcement layer and "Federated Access Matrix (FAM)" for the rule set it
  evaluates (`endpoint × method × realm role × user identity`); the generator, package, table, and
  route names all stay `access_policy` / `access_policies`. The matrix is read from the master
  registry, so one rule set governs every silo in the federation with no per-tenant drift. Rules
  live in the `access_policies` table, are cached in-memory per pod (default 30s, tunable via the
  new `security.access-policy.cache-ttl` config field, 2026-08-15), and are invalidated immediately
  on the pod that serves a write. Precedence is by **specificity**, not declaration order and not
  "deny always wins", so `ALLOW /api/reports GET ROLE_FINANCE` restricts a route with a single
  rule. An endpoint no rule mentions is allowed, which keeps the engine purely additive: enabling
  it on a running deployment changes nothing until an operator writes a rule. The middleware is
  registered globally ahead of the route groups so it also governs root-level public routes, and it
  validates the bearer token itself (same JWKS lookup) rather than trusting unverified claims.
- **DuckGuard Matrix Migration (`v2.0.5`, 2026-08-14)**: `migrations.js` now emits
  `00002_init_access_policy.sql`, deliberately numbered *below* the timestamped entity migrations.
  Existing projects already carry higher versions in their changelog, so the generated migrator —
  which runs Goose with `WithAllowOutofOrder(true)` — sees this as pending and applies it on the
  next start, with no manual step. The two seeded example rules ship `is_active = FALSE`.
- **Lazy, Thread-Safe Silo Initialisation (`04751d5`, 2026-08-13)**: `GetDB` now holds the manager
  mutex only long enough to look up or insert the map entry; dialling and migrating happen outside
  it under the entry's own `sync.Once`, so a cold silo no longer stalls every other tenant lookup.
  `EnsureTenantSchema` builds a per-call `goose.Provider` with `WithSessionLocker`, replacing the
  racy `goose.SetDialect` / `SetTableName` / `SetBaseFS` package globals. A silo that fails to
  migrate is not cached and does not serve traffic.
- **Optimistic Locking (`653923c`, 2026-07-30)**: `@Version` concurrency control implemented in
  generated Go controllers for both GORM and MongoDB. This closes the long-standing roadmap item
  — earlier revisions of `AGENTS.md` listed it as unimplemented.
- **Cache Key Namespacing (`3050c60`, `d82832f`, 2026-07-27)**: Configurable key prefixes for
  Redis/Valkey plus per-microservice key isolation, so multiple services sharing one cache
  instance no longer collide. Controllers updated to use the namespaced database context.
- **Cache Invalidation & Tenant Routing (`4a84656`, 2026-08-13)**: Corrected the invalidation
  pattern and added tenant routing diagnostics to the multitenancy generator.
- **Angular SDK Generator (`5356a13`, 2026-07-20)**: New `generate-angular-sdk` command backed by
  `generators/angular_sdk.js`, plus smart GDL validation for generated fields.
- **Migration Type Casting Fix (`b0b06be`, 2026-07-20)**: `DEFAULT` clauses are stripped from SQL
  types during column type casting in the migration generator.
- **OneToMany Validation (`baaef4a`, 2026-07-18)**: `gdlValidator` now rejects manual foreign key
  field declarations on `OneToMany` relationships.

## 2026-07-15 — Zero-Intrusion Read Receipts & View Tracking 🚀

Designed and implemented a completely decoupled "Seen/Unseen" tracking engine for federated microservices, extending GO-DUCK-CLI's structural intelligence without polluting core data models.

#### Implementation Highlights:
- **Zero-Intrusion Data Architecture**: Introducing the `@TrackViews` GDL annotation. When applied, the generator creates an isolated shadow table (`{entity}_read_receipt`) to monitor user view statuses rather than injecting arrays or booleans into the target entity itself.
- **Dynamic API Generation**: Automatically scaffolds dedicated controllers and services exposing `POST /assign-receivers`, `GET /view`, and `GET /tracking/toggle` endpoints for annotated entities.
- **Keycloak Identity Extraction**: The generated `ReadReceiptService` securely extracts the user's opaque Keycloak UUID directly from the validated Gin Context, preventing spoofing of "seen" statuses.
- **Incremental Migration Awareness**: Hardened `migrations.js` to detect pure annotation additions (`isTrackedView: true`) even when no structural fields have changed, ensuring `CREATE TABLE {entity}_read_receipt` is accurately provisioned during `import-gdl` incremental runs.
- **Dynamic OpenAPI Provisioning**: Upgraded `swagger.js` to natively discover `@TrackViews` during generation, dynamically appending the three new endpoints to the `{entity}` API group in the resulting Swagger UI.

## 2026-07-03 — GDL Validator Hardening & Bulk API Stability 🚀

Hardened the `validate-gdl` rules to prevent database collisions and fixed critical runtime vulnerabilities inside the generated bulk operation templates.

#### Implementation Highlights:
- **Relational Collision Prevention**: The GDL validator now explicitly detects and warns *against* manually defining foreign key ID fields (e.g., `long millingBatchId`) when a relationship is already declared in the `relationship` block. This prevents duplicate column mappings in GORM and JSON parsing collisions that cause SQLSTATE 23503 integrity errors.
- **Duplicate Field Detection**: Added static checks to flag duplicate field declarations within the same entity block, alerting developers early to prevent generated code from triggering compiler failures.
- **GORM Bulk Empty-Array Protection**: Injected length verification `len(entities) == 0` in all generated `/bulk` endpoints. Empty array payloads now return `400 Bad Request` instead of triggering fatal GORM empty slice panics.
- **MongoDB ObjectID Hex Generation**: Corrected the bulk insertion response mapping logic for MongoDB collections. Extracted raw `Hex()` values from `primitive.ObjectID` returned by `InsertMany` instead of printing raw struct strings, ensuring downstream outbox workers and telemetry sync seamlessly.
- **GDL Field Type Validation**: Upgraded the `validate-gdl` engine to statically check that all declared field types correspond to known primitives (string, long, instant, jsonb, etc.), defined entities, or defined enums. This prevents typos in GDL types from silently compiling into Go `interface{}` types, causing GORM `unsupported data type` database execution panics.
- **Enforced Automatic Validation**: Embedded static validation checks directly into both the `create` and `import-gdl` command workflows. If the GDL files contain even a single error, the generation process halts immediately before modifying any models, ensuring zero invalid files or GORM conflicts are introduced.
- **Smart Interoperability Validation**: Introduced a strict `--smart` mode for the validator (`go-duck validate-gdl <file> --smart` and `go-duck import-gdl <file> --smart`). It executes a deep static analysis catching SQL reserved keywords, enforcing camelCase/PascalCase boundaries, and enforcing semantic naming standards (e.g., Booleans must start with `is`, `has`, or `can`; Dates must end with `At`, `Date`, or `Time`).

## 2026-06-29 — GDL Static Analysis & Negative Cache Prevention ✅

The engine received major stability upgrades targeting pre-generation code analysis and distributed cache race conditions.

#### Implementation Highlights:
- **GDL Validation Engine**: Built the `validate-gdl` command directly into `index.js`. Performs static analysis on GDL models to enforce correct casing, identify geographic/financial data type mismatches (Integer vs String vs BigDecimal), and scan for missing or dangling relational foreign keys prior to generation.
- **Cache Mutual Exclusivity**: Enforced strict configuration exclusivity between Redis and Valkey. The CLI now physically blocks microservice generation if both engines are simultaneously enabled in `config.yaml`, returning a fatal crash rather than generating conflicting connection pools.
- **Valkey Live Telemetry Dashboard**: Configured the HTML telemetry UI to dynamically render a dedicated Valkey metrics dashboard if Valkey is the active store.
- **Distributed Negative Cache Prevention**: Resolved a 24-hour multi-tenancy lockout race condition (Caching a Miss). When the web UI queries the system instantly after a database provisioning request, the DB may briefly return 0 rows before the transaction commits. The system now refuses to cache empty tenant mapping slices in Redis, correctly defaulting to PostgreSQL until the mapping populates.

## 2026-06-26 — Elite Multitenancy & Swagger Polish ✅

The multi-tenancy and CLI automation engines received a targeted hardening, elevating developer experience and multi-silo stability.

#### Implementation Highlights:
- **Admin Tenant Impersonation & Fallback Fix**: Rewrote the `tenant_middleware` multitenancy logic. Keycloak users with `admin` or `ROLE_SUPER_ADMIN` roles are no longer erroneously forced onto the master fallback database. Super Admins can now effortlessly impersonate specific tenants by passing the `X-Tenant-ID` header while preserving standard role mappings.
- **Deep Artifact Purging for @Delete**: Upgraded the CLI dead-code purger to track and delete legacy Kratos gRPC `api/v1/*.proto` and `internal/service/*.go` artifacts when an entity is purged via the `@Delete` annotation.
- **Dynamic Swagger Conditional Rendering**: Fortified the Swagger UI generator to conditionally hide Storage API endpoints if no Object Storage providers (S3/MinIO/SFTP) are enabled in the active configuration.
- **Unlimited Quota SaaS Metering**: Enhanced the distributed Redis metering engine to recognize `-1` as an unlimited tier, effectively bypassing 402 Payment Required blocks for internal super-users.
- **Pluggable Valkey Caching**: Added native support for Valkey (`valkey/valkey:7.2.5-alpine`) as an open source alternative to Redis. The generator now maps `go-duck.cache.valkey` configuration directly, allowing users to hot-swap Redis for Valkey seamlessly inside `services.yml`, Docker-Compose, and Kubernetes manifests while utilizing wire-compatible routing under the hood.

## 2026-06-15 — GORM Resilience & Relational Eager-Loading Parity ✅

The generation engine was refined to fix edge-case panics, stabilize Postgres foreign key constraints, and cleanly handle flat JSON relational API responses.

#### Implementation Highlights:
- **`ZonedDateTime` GORM Panic Fix**: The GDL parser was updated to explicitly map `ZonedDateTime` fields to native Go `time.Time` and database `TIMESTAMP` definitions, completely eliminating fatal `Table not set` panics caused by unresolved `interface{}` typings.
- **Strict Foreign Key Decoupling**: Refactored the `migrations.js` generator to safely decouple `ADD COLUMN IF NOT EXISTS` from `ADD CONSTRAINT FOREIGN KEY`. This correctly guarantees that `REFERENCES` constraints are applied at the database level even if the underlying integer column was explicitly defined by the developer in the GDL model.
- **Eager Loading & JSON Serialization Fix**: Fixed the dual retrieval APIs (`/api/{entity}` vs `/api/{entity}/eager`) to strictly honor the `eager=false` parameter. Removed artificial `AfterFind` nested struct initializations and corrected `json:"{{from.field}}Id"` struct tags. This ensures `eager=false` endpoints accurately return *just the ID of the foreign object* without bleeding empty `{ "id": 123 }` JSON objects into the response body.
- **Resilient Tenant DB Fallbacks**: Upgraded the `TenantMiddleware` template to seamlessly fallback to the master/default database if a requested `X-Tenant-ID` silo encounters a connection failure, preventing fatal `500 Internal Server Errors`.

## 2026-06-10 — ManyToMany Relationships & Dynamic Swagger Prefixes ✅

The core generation engine was upgraded to support complex many-to-many relationship mapping and runtime dynamic Swagger OpenAPI configurations, bringing GO-DUCK to **495% Elite Status**.

#### Implementation Highlights:
- **Native ManyToMany GDL Engine**: Added complete parsing support for `ManyToMany` relationships in GDL, scaffolding GORM `many2many` join table metadata, generating standard GORM schemas, list representations in GraphQL resolver graphs, and dynamic Goose database migrations.
- **Dynamic Runtime Swagger Prefix Resolution**: Replaced static OpenAPI file serving with a live Go-native handler (`serveDynamicSwagger`) that dynamically inspects runtime config (`api-path-prefix`) in dev vs prod, rewriting path definitions in the OpenAPI schema on the fly and adapting the interactive Swagger UI spec URL.
- **On-Demand Tenant Silo Migrations**: Fortified multi-db multitenancy connection pooling by automatically executing Goose SQL migrations on dynamic tenant databases inside `GetDB` upon initialization, preventing missing relation errors (e.g., `harbour does not exist`) in dynamic silos.
- **GDL Default Parsing Regex Boundary Fix**: Corrected the parsing regex for `default` constraints to enforce word boundaries (`\bdefault\b`), resolving compilation errors when entities contained standard field prefix names such as `defaultConfig`.

## 2026-06-09 — Import Model Integrity & Type Validation ✅

The GDL import pipeline was corrected for production schemas containing omitted relationship target fields and unsupported type declarations.

#### Implementation Highlights:
- **Model Struct Integrity Restored**: `entity.go.hbs` once again emits the entity struct header and store-aware primary key, preventing raw fields from being generated outside a Go type declaration.
- **Relationship Fallback Naming**: Relationships with an omitted target field now derive stable names from the source entity, preventing duplicate `ID` fields and invalid anonymous pointer declarations.
- **Unsupported Type Validation**: The non-existent `date` type now fails with an actionable parser error instead of being misread as a field name and causing duplicate declarations.
- **Existing Temporal Types Preserved**: Calendar dates use `LocalDate`, timestamps use `Instant` or `DateTime`, and time-only values use `Time`; Kratos conversions remain compile-safe for these supported types.
- **Migration Relationship Deduplication**: Foreign keys included in a newly created table are no longer emitted again as redundant `ALTER TABLE` statements.
- **Docker Build Resilience**: Generated Dockerfiles copy `go.mod` independently, allowing `go mod download` to create dependency checksums when `go.sum` is absent from a fresh CI checkout.
- **Docker Repository Name Normalization**: Generated `push.sh`, Compose, Kubernetes, and GitHub Actions image references use lowercase kebab-case repository names. Runtime `DOCKER_USER` and `IMAGE_NAME` overrides are normalized before building, preventing Docker errors such as `repository name must be lowercase`.

## 2026-06-08 — Reliable Incremental GDL Entity Imports ✅

The stateful `import-gdl` workflow was hardened to prevent newly added entities from being silently skipped when developers re-import an existing GDL file.

#### Implementation Highlights:
- **Flexible Annotation Placement**: The recursive GDL parser now accepts entity annotations both before the declaration (`@Audited entity Invoice`) and after the entity name (`entity Invoice @Audited`).
- **Fail-Fast Entity Validation**: Entity-like declarations that cannot be parsed now stop generation with a clear error naming the affected entities instead of reporting a successful import without models, controllers, snapshots, or migrations.
- **Incremental Migration Precision**: Newly parsed entities are added to `delta.newEntities`, producing only the required new `CREATE TABLE` migration while avoiding duplicate table migrations for existing entities.
- **Full Artifact Synchronization**: Importing a new entity creates its model, controller, `.go-duck` snapshot, Goose migration, routes, GraphQL schema, protobuf/Kratos services, Swagger documentation, Postman requests, and MQTT metadata.
- **Stateful Regeneration Preserved**: Existing snapshotted entities are still merged and regenerated where required to preserve multi-file GDL routes, relationships, enums, documentation, and cross-entity code generation.

## 2026-06-08 — Docker Build Stability & Lightweight Elasticsearch Client ✅

The Docker build path was hardened after generated apps hit BuildKit overlay/input-output failures while compiling the massive `github.com/elastic/go-elasticsearch/v8/typedapi` tree during `push.sh` image builds.

#### Implementation Highlights:
- **TypedAPI Compile Graph Removed**: The Elasticsearch generator no longer stores a root `*elasticsearch.Client`, which imports the full typed API surface. It now stores the narrower `esapi.Transport` interface required by `IndexRequest`, `DeleteRequest`, `SearchRequest`, and `InfoRequest`.
- **Low-Level Official Transport Preserved**: Generated apps now construct `github.com/elastic/elastic-transport-go/v8/elastictransport` directly, preserving official Elastic low-level request execution while avoiding unnecessary typed client compilation.
- **Behavioral Parity Maintained**: Real-time `@Searchable` sync, delete cleanup, Lucene/JPA hybrid search, and startup Elasticsearch health checks still execute through `esapi` request types with the same index naming and credential configuration.
- **Generated Dependency Hygiene**: The CLI `go.mod` template now explicitly pins `github.com/elastic/elastic-transport-go/v8` and `github.com/elastic/go-elasticsearch/v8`, and removes the stale unused `github.com/olivere/elastic/v7` dependency from newly generated apps.
- **Sample App Aligned**: `SAMPLE-GO-APP/internal/search/client.go` and `SAMPLE-GO-APP/go.mod` were updated to match the generator output, so `SAMPLE-GO-APP/push.sh` builds from the corrected client path.

## 2026-06-03 — Performance & Developer Experience Upgrades ✅

The core generation engine received critical optimizations targeting API Time-To-First-Byte (TTFB) and Swagger UI usability, further solidifying the Elite Status.

#### Implementation Highlights:
- **Asynchronous Cache Invalidation**: Completely eliminated O(N) synchronous Redis blocking during CRUD operations by offloading `cache.ClearPattern` execution to goroutines.
- **Bulk Federated Outbox Dispatch**: Refactored the `Federated Parallel Harvester` write-path to use lightning-fast GORM Bulk Inserts (`tx.Create(&outboxes)`) instead of iterative N+1 network calls per isolated silo.
- **@ActiveStatus Annotation Support**: CLI seamlessly defaults `IsActive` fields to `true` upon entity creation without breaking zero-value semantics, cleanly separating creation state from PATCH deactivations.
- **Swagger UX Enhancements**: Injected the custom `CaseInsensitiveFilterPlugin` into the Swagger UI layout to enable case-agnostic API searching, and upgraded the default interactive MQTT WebSocket strings to properly resolve `/mqtt`.
- **Wildcard MQTT Subscriptions**: Refactored the interactive MQTT dictionary topics from literal entity paths to multi-tenant wildcard topics (`+/Entity/ACTION`).

## 2026-05-28 — Dynamic Service Namespaces & Network Isolation ✅

Upgraded the Kubernetes manifests generation engine to deploy every single microservice component into its own dynamically generated, isolated namespace, complete with FQDN routing and external NodePort exposure.

#### Implementation Highlights:
- **Dynamic Per-Service Namespaces**: Automatically computes a namespace prefix from the project's config name (e.g. `cfhc-postgres-k8s`, `cfhc-redis-k8s`).
- **Self-Contained Manifests**: Injects a `kind: Namespace` block at the top of every generated YAML file, ensuring `kubectl apply` seamlessly works out of the box without manual namespace provisioning.
- **FQDN Internal Routing**: Upgraded all internal connection strings (e.g., PostgreSQL, NATS, Redis) in the application deployment to use fully qualified domain names (`<service>.<namespace>.svc.cluster.local`), guaranteeing network resolution across strictly isolated namespaces.
- **Predictable NodePort Exposure**: Mapped every infrastructure service explicitly to predictable external NodePorts (30000-32767 range) to allow easy local host access.

## 2026-05-28 — JHipster-Parity Telemetry & Live MQTT UI ✅

The core observability and developer experience engines received massive upgrades, elevating the framework to **440% Elite Status**.

#### Implementation Highlights:
- **Triple-Telemetry Endpoints**: Deployed a complete observability stack including `GET /metrics` for K8s HPA, `GET /api/system/stream` for lightweight SSE dashboarding, and `GET /api/system/metrics` for deep Go-runtime JSON analytics (GC Pauses, Heap Allocations, Goroutines).
- **HTTP Tracking Middleware**: Integrated a highly-concurrent `sync.RWMutex` tracker that automatically monitors request counts, mean latencies, and max latencies mapped directly to both HTTP Status Codes and exact API Endpoints (e.g. `GET /api/account`).
- **Interactive Swagger WebSockets**: Revolutionized the generated Developer Guide by injecting a syntax-highlighted JSON5 MQTT Dictionary that acts as a live console. Developers can now instantly **SUBSCRIBE** or **PUBLISH** payloads directly from the web documentation to the underlying MQTT broker without external tools.

## 2026-05-21 — Zero-Trust Tenant Isolation & Custom Tenant ID Provisioning ✅

Enforced zero-trust multitenant database routing and custom `tenantId` mapping alignment across all protocols.

#### Implementation Highlights:
- **Zero-Trust Fallback Prevention**: Non-admin HTTP and gRPC requests with zero matched tenant mappings are blocked with `403 Forbidden` and `PermissionDenied` errors respectively, preventing unauthorized access and data leak fallback to the master database.
- **Custom Tenant ID Support**: Upgraded the tenant database assignment API and templates to support optional client-specified custom `tenantId` values (such as `tenant_1`), which returns the assigned value in the response body.
- **Unified Endpoint & Routing Alignment**: Standardized the PostgREST engine search route to `/api/rpc/:table`, standardized the centralized audit log route to `/api/admin/audit`, registered `/management/tenant/assign`, and dynamically generated Swagger and Postman targets matching the `@Searchable` elasticsearch search endpoint `/api/search/:entity`.

## 2026-05-21 — Federated Kratos gRPC & Casing Alignment ✅

Successfully aligned GORM/MongoDB multi-tenant database routing across standard HTTP (Gin) and gRPC (Kratos) protocols.

#### Implementation Highlights:
- **Case-Preserving Role Registry**: Modified the registration flow to store roles exactly with the casing provided (e.g. `ROLE_HARBOUR_B`), preserving compatibility with Keycloak defaults.
- **Unified Case-Insensitive Queries**: Upgraded the registry mappings to query `LOWER(role_name)` case-insensitively across both protocols.
- **Kratos Context Injection**: Rewrote the `TenantServerInterceptor` in Kratos gRPC Server to sort mappings based on priority rules, support MongoDB connections, and inject `tenantDBConn` and `tenantMongoDB` directly into the gRPC context, eliminating fallback db leak issues.

## 2026-05-20 — Dynamic Host & Port Configuration ✅

The DevOps, documentation, and Postman engines were upgraded to dynamically resolve and propagate custom host addresses and ports defined in the microservice configurations.

#### Implementation Highlights:
- **Resilient DevOps Port Mapping**: Docker Compose templates (`services.yml` and `docker-compose.yml`) now dynamically map host ports matching standard/custom values for PostgreSQL, Redis, MQTT, Keycloak OIDC, and Elasticsearch as defined in `config.yaml`.
- **Dynamic Documentation & Swagger Parity**: The HTML developer guide, Kratos gRPC guides, and Swagger UI dynamically reflect the correct ports and endpoint targets without any hardcoded defaults.
- **Dynamic Postman Environments**: Scaffolds Postman JSON collections with variables dynamically derived from Keycloak realms, client IDs, credentials, and custom server ports for local/remote deployment environments.

## 2026-04-21 — Dynamic DevOps & Zero-Entity Infrastructure ✅

The DevOps engine and CLI templates were fortified to support completely empty domains and dynamic credential extraction, ensuring the generator never produces mismatched configurations or compiler errors even under edge-case loads.

#### Implementation Highlights:
- **Dynamic DevOps Credential Extraction**: The `devops.js` generator was rebuilt to extract PostgreSQL database names, usernames, and passwords directly from the active `config.yaml` using template literals, replacing legacy hard-coded `go_duck_master` references. This guarantees 100% parity between `docker-compose.yml` and the Go Application properties.
- **Zero-Entity Base Scaffold Stability**: Modified the GraphQL, gRPC Kratos, and Gin Router generators to detect `if entities.length == 0`. It now safely bypasses unused imports and injects blank identifiers (`_ = masterMongo`) to satisfy strict Go compiler rules when scaffolding infrastructure-only microservices.
- **SFTP MkdirAll & Struct Realignment**: Fixed `SFTPProvider` structs to officially map the `remotePath` variable. SFTP native uploads now utilize `filepath.Dir()` and `MkdirAll()` to dynamically construct deep, nested `remote-path` directories per-microservice automatically.
- **SuperAdmin Audit Documentation**: Formally codified the `GET /api/admin/audit` and `POST /management/tenant/assign` boundaries directly into the generated Swagger, HTML, and AI markdown documentation generators to ensure future agents and users recognize the Centralized Audit Engine.

## 2026-04-18 — Real-Time Universal Storage ✅

The Universal Storage Bridge received an elite extension, transforming mock storage stubs into a fully-armed **Universal Storage Mesh**, elevating the framework to **375% Elite Status**.

#### Implementation Highlights:
- **Dynamic Provider Registry (Hot-Swapping)**: Abandoned static "lead provider" mapping in favor of an active memory Map `map[string]StorageProvider`. Allows precise UI-driven uploads and downloads using `?provider=sftp` runtime targeting.
- **Distributed Cross-Scan Retrieval (`/api/storage/scan`)**: A brand new architectural endpoint. If a UI queries a file without knowing its origin, this endpoint synchronously iterates across all enabled storage networks (e.g. AWS -> MinIO -> SFTP -> GitHub) until it finds and returns the bytes, completely abstracting infrastructure.
- **GitHub REST API Engine & Base64 Commits (`storage.github`)**: Natively implements `Upload()` via GitHub Commits API using base64 wrapping, and `Download()` via raw authenticated HTTP GETs.
- **Decoupled Ephemeral Bootstrapping (`storage.bootstrap`)**: Fortified zero-bake K8s logic. `id_rsa` or GCP JSONs are seamlessly pulled from private Git repos into `/config` before the Gin engine even starts.
- **Passwordless Hybrid SFTP**: Dynamically utilizes `golang.org/x/crypto/ssh` keys booted from the ephemeral system to achieve high-throughput, passwordless network transmissions.

## 2026-04-01 — Hybrid-Store Integration ✅

The **MongoDB Hybrid-Store engine** integration achieved 100% feature parity with the legacy PostgreSQL engine, surpassing the 350% milestone to reach **361% Elite Status**.

#### Implementation Highlights:
- **Hybrid-Aware Multitenancy**: `TenantMiddleware` implemented a **Silo-Connection-Cache** (Singletons) to prevent client exhaustion in many-tenant environments.
- **Dual-Protocol gRPC**: Kratos services now handle `uint64` vs `string` IDs dynamically, ensuring heterogeneous entity types can coexist in a single service.
- **Federated Parallel Harvester 2.0**: The Go-routine based aggregation logic was successfully ported to MongoDB, supporting `federated=true` on all Doc entities.
- **Implicit Soft Relationships**: Automatic inference of "Soft Foreign Keys" from GDL relationship blocks. Supports **Cross-Database Relationships** (e.g. SQL child to Mongo parent) with dynamic ID typing (`string` vs `uint64`) and `gorm:"-"` shielding for multi-store structural integrity.
- **Elite Build Compliance**: Automated scaffolding verified that all generated hybrid apps pass `go build` and `go mod tidy` without manual intervention.
