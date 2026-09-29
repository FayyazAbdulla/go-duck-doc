# GO-DUCK — Agent & Contributor Guide

GO-DUCK is a Node.js CLI that compiles a **GDL** schema file plus a `config.yaml` into a
complete, buildable Go microservice: Gin REST, Kratos gRPC, GraphQL, GORM/MongoDB models,
Goose migrations, Swagger/Postman docs, and Docker/K8s manifests.

This file describes **how the generator works and how to change it safely**.
Milestone history lives in [CHANGELOG.md](CHANGELOG.md) — do not add release notes here.

## Repository layout

| Path | What it is |
| :--- | :--- |
| `GO-DUCK-CLI/` | The generator. Everything below is relative to this dir. |
| `GO-DUCK-CLI/index.js` | Commander entry point, `generateEntities()`, snapshot/delta engine (~1.7k lines). |
| `GO-DUCK-CLI/parser/gdl.js` | GDL → `{ entities, relationships, enums, openEntities }`. |
| `GO-DUCK-CLI/validators/gdlValidator.js` | Static analysis; runs before every `create` / `import-gdl`. |
| `GO-DUCK-CLI/generators/*.js` | 34 subsystem emitters (one per concern: cache, storage, swagger, …). |
| `GO-DUCK-CLI/generators/gateway.js` | Not a GDL-app subsystem — a standalone service generator (`create-gateway`). Writes its own `main.go`/`go.mod`/K8s manifests, entirely independent of `generateEntities()`. |
| `GO-DUCK-CLI/templates/` | Handlebars sources: `go/`, `kratos/`, `proto/`, `graphql/`, `docs/`, `angular/`. |
| `GO-DUCK-CLI/utils/file_manager.js` | `fs-extra` Proxy implementing the code-preservation engine. |
| `CONFIG/` | Reference configs: `config.yaml`, `-hybrid`, `-mongo-only`, `-psql-only`, `-serverless`. |
| `GDL/` | Sample GDL schemas. |
| `SAMPLE-GO-APP/` | Reference output — standard container build. |
| `SAMPLE-GO-SERVERLESS-APP/` | Reference output — serverless build, background workers disabled. |
| `KNOWN_ISSUES/` | Unresolved field reports. Read before debugging relationship/FK bugs. |

## Commands

| Command | Purpose |
| :--- | :--- |
| `create` | Full scaffold from `config.yaml` + GDL directory. |
| `import-gdl <path>` | **Stateful incremental update.** Diffs against `.go-duck/` snapshots, emits only delta migrations. |
| `validate-gdl <path>` | Static analysis only, no code written. `--smart` adds semantic/naming rules. |
| `init` | Bootstrap `config/config.yaml` in the current folder. |
| `gdl-planner` | Drag-and-drop schema builder web UI (default port 8000). |
| `serve` | Interactive GUI + documentation preview server on port 2026. |
| `generate-angular-sdk <path>` | Emit typed Angular clients from GDL. |
| `create-gateway` | Scaffold Strait of Duck Gateway (SDG) — standalone K8s-discovery reverse proxy, not part of the entity/GDL pipeline. Own config root (`strait-of-duck:`), own `-c`/`-o` flags only; the shared flags below don't apply. |

Shared flags (`create`/`import-gdl`/`generate-angular-sdk` only): `--preserve-root` (skip `main.go`,
`push.sh`, `devops/`, config loader, telemetry), `--reset` / `--rebase` (ignore all preserve
needles), `--smart` (strict validation).

## The generation pipeline

`create` and `import-gdl` run the same ordered sequence ([index.js:838](GO-DUCK-CLI/index.js#L838)
and [index.js:1041](GO-DUCK-CLI/index.js#L1041)). Order matters — later stages consume the
`entities` array returned by `generateEntities()`.

1. **Load config** — `loadConfig()` reads YAML and unwraps the `go-duck:` root key.
2. **Validate** — `validateGDL()` runs and calls `process.exit(1)` on any error, *before* a
   single file is written. This is the fail-fast gate; never bypass it.
3. **Persist config** — copied to `<output>/.go-duck/config.yaml` so later `import-gdl` runs in
   the generated project can find it without `-c`.
4. **Infrastructure generators** (skipped under `--preserve-root`) — config loader, logger, MQTT,
   cache, resilience, telemetry, devops.
5. **`generateEntities()`** ([index.js:459](GO-DUCK-CLI/index.js#L459)) — the core. Parses every
   `.gdl` file, dedupes by name, computes the delta, writes models/controllers/interceptors,
   saves snapshots, purges deleted entities, emits Goose migrations.
6. **Downstream generators** — Kratos, repository, GraphQL, PostgREST, multitenancy, audit,
   metering, security, access policy, websocket, outbox, NATS, broker, storage, AI, services,
   router, Elasticsearch, serverless.
7. **Docs** — Swagger, Postman, MQTT dictionary, HTML guide, AI blueprint, WSO2 module.
8. **Root files** — `main.go`, `go.mod`, `.tool-versions`, then `go mod tidy`.

### Snapshot & delta engine

State lives in `<output>/.go-duck/<entityname>.json` — one JSON snapshot per entity, written by
`saveEntitySnapshot()` at the end of each entity's generation.

On `import-gdl`, `generateEntities()` is called with `isImport = true`:

- Previous snapshots are loaded and **merged** into the parsed set. Entities absent from the
  current GDL file are re-added from snapshot, along with their relationships, enums, and open
  rules. This is what makes multi-file GDL safe — importing one file never wipes the others.
- Entities carrying `@Delete` are stripped from the active set and pushed to `delta.deletedEntities`.
- The delta shape is `{ newEntities, newFields, deletedFields, alteredFields, alteredAnnotations,
  newRelationships, deletedRelationships, alteredRelationships, deletedEntities }`
  ([index.js:544](GO-DUCK-CLI/index.js#L544)).
- `alteredAnnotations` exists so annotation-only changes (e.g. adding `@TrackViews` with no new
  fields) still produce a migration. If you add an annotation that has a schema side effect, it
  must be tracked here or the migration will silently not fire.
- `generateLiquibaseChangelogs()` (in `generators/migrations.js`, Goose-flavoured despite the name)
  consumes the delta and emits only the required SQL.

**Dead-code purging:** deleted entities have their model, controller, interceptor, snapshot,
`api/v1/*.proto`, `*.pb.go`, and `internal/service/*.go` removed
([index.js:743](GO-DUCK-CLI/index.js#L743)). Any new per-entity artifact you introduce must be
added to that purge list, or `@Delete` will leave an orphaned file that breaks `go build`.

### Code-preservation engine

[utils/file_manager.js](GO-DUCK-CLI/utils/file_manager.js) exports an `fs-extra` **Proxy** that
intercepts `writeFile` / `writeFileSync`. If the target file already exists and contains the
needle `// @go-duck-preserve`, the write is skipped.

Consequences for generator authors:

- Always `import fs from '../utils/file_manager.js'` in a generator — importing `fs-extra`
  directly bypasses preservation and will clobber user code.
- Only `writeFile`/`writeFileSync` are intercepted. `fs.copy`, `fs.outputFile`, and `fs.writeJson`
  are **not** protected.
- `--reset` / `--rebase` call `setResetMode(true)` to disable the check globally.

## GDL reference

### Entity annotations

Parsed in [parser/gdl.js:349](GO-DUCK-CLI/parser/gdl.js#L349). Accepted either before the
declaration (`@Audited entity Invoice {`) or after the name (`entity Invoice @Audited {`).

| Annotation | Effect |
| :--- | :--- |
| `@Audited` | Mutations logged to `audit_log`. |
| `@Federated` | Participates in multi-silo parallel harvest + atomic broadcast writes. |
| `@Searchable` | Real-time Elasticsearch sync on every mutation. |
| `@Document` / `@isDocument` | Stored in MongoDB instead of PostgreSQL. |
| `@Delete` | Purge entity: `DROP TABLE` migration + dead-code removal. |
| `@SoftDelete` | `deleted_at` tracking, `/trashed` and `/{id}/restore` endpoints. |
| `@Draftable` | `is_draft` column, `/draft` and `/publish` endpoints. |
| `@TrackViews` | Shadow `{entity}_read_receipt` table + assign/view/toggle endpoints. |
| `@ArchiveStatus` | Injects a generated `archived` boolean field. |
| `@ActiveStatus` / `@IsActive` | Injects a generated `isActive` boolean, defaulting to `TRUE`. |

### Global directives

Bottom-of-file directives applying to a comma-separated list or `*`
([parser/gdl.js:482-544](GO-DUCK-CLI/parser/gdl.js#L482-L544)):
`archived`, `softDelete`, `draftable`, `trackViews`. Example: `softDelete Staff,Customer` or
`trackViews *`.

`open <Entity>` marks endpoints public (no JWT), with optional granularity: `open Car(read, create)`.

### Field-level

`required`, `unique` inline modifiers; `@Version` marks the optimistic-locking column
([parser/gdl.js:311](GO-DUCK-CLI/parser/gdl.js#L311)).

Temporal types are strict: `LocalDate` (calendar date), `Instant` / `DateTime` / `ZonedDateTime`
(timestamp), `Time` (time-only). A bare `date` is rejected by the parser on purpose — it used to
be misread as a field name and produce duplicate declarations.

## How to extend

### Add a GDL annotation end-to-end

Using `@TrackViews` as the worked reference — it touches every layer:

1. **Parse** — add the flag in `parser/gdl.js` alongside the others (~line 349) and include it in
   the returned entity object (~line 365).
2. **Delta** — if it has a schema side effect, register it in the `alteredAnnotations` comparison
   in `index.js` so annotation-only changes trigger a migration.
3. **Migrate** — handle it in `generators/migrations.js` for both the new-entity and altered-entity
   paths.
4. **Emit** — consume `entity.<yourFlag>` in `templates/go/controller.go.hbs` and
   `templates/go/router.go.hbs`.
5. **Document** — `generators/swagger.js` for OpenAPI, `generators/postman.js` for the collection,
   `generators/docs.js` + `generators/ai_docs.js` for the HTML/LLM guides.
6. **Purge** — if it creates a per-entity file, add it to the `@Delete` cleanup list at
   [index.js:743](GO-DUCK-CLI/index.js#L743).
7. **Reference** — add a row to the annotation table above.

Skipping step 2 or 6 is the most common source of the "works on `create`, broken on `import-gdl`"
class of bug.

### Add a generator

Create `generators/<name>.js` exporting an async `generate<Name>(config, outputDir, ...)`, import
it in `index.js`, and call it in **both** the `create` and `import-gdl` action bodies — they are
separate code paths and drift between them is a recurring defect. Import `fs` from
`utils/file_manager.js`, not `fs-extra`.

**If the generated Go code imports a new external package, add it to the `go.mod` template too —
in both places.** `index.js` hardcodes the emitted `go.mod`'s `require` block twice (once in
`create`, once in `import-gdl`; find both with `grep -n "const goModContent" index.js`). This
template is not derived from the generators, so nothing enforces the two staying in sync with what
`templates/go/*.hbs` and `generators/*.js` actually import — that drift is exactly what caused a
real production failure (`go: updates to go.mod needed`, 2026-08-17, see CHANGELOG) that only
surfaced inside a Docker build, at the very last step, after ten minutes of protoc/Kratos toolchain
setup. `generators/devops.js`'s Dockerfile now runs `go mod tidy` right before the build as a
safety net, but that only papers over drift — fix it at the source. Before adding a generator with
a new dependency, grep the actual import path across `templates/` and `generators/*.js` to confirm
what's really needed (over-including in the template is harmless and self-corrects via `go mod
tidy`; under-including is what breaks the build).

**Don't add network fetches to generated build scripts or Dockerfiles — bundle the file instead.**
`generate.sh`/`generate.bat`/the Dockerfile used to each independently `curl` `google/api/{annotations,http}.proto`
from `raw.githubusercontent.com`'s unpinned `master` branch at compile time, with no `-f`/`--fail`
flag. `raw.githubusercontent.com` rate-limits; curl treats a 429 as success; the rate-limit page
got written into the `.proto` file and protoc failed on line 1 with no indication a network fetch
was the real cause (2026-08-17, see CHANGELOG). If a generator needs a small, stable external file,
bundle it in `templates/` and copy it at generation time (`fs.copy`, see
`generators/kratos.js`'s `third_party/google/api/*.proto` handling) rather than fetching it later
when there's no CLI process left to fall back on or report a clear error.

## How to verify a change

There is currently **no automated test suite** (`npm test` exits 1) and no generated `*_test.go`.
Until that changes, verify manually — and prefer regenerating a sample app over reasoning about
templates:

```bash
# 1. Static analysis only — fastest signal
node GO-DUCK-CLI/index.js validate-gdl GDL --smart

# 2. Full regeneration into a throwaway dir
node GO-DUCK-CLI/index.js create -c CONFIG/config.yaml -g GDL -o /tmp/gd-check

# 3. The real gate: it must compile
cd /tmp/gd-check && go build ./... && go vet ./...

# 4. Incremental path — regressions hide here, not in `create`
node GO-DUCK-CLI/index.js import-gdl GDL -o /tmp/gd-check
cd /tmp/gd-check && go build ./...
```

Exercise the config matrix when touching persistence, cache, or devops:
`config-psql-only.yaml`, `config-mongo-only.yaml`, `config-hybrid.yaml`, `config-serverless.yaml`,
plus a zero-entity run (empty GDL dir) — the generators have explicit `entities.length == 0`
branches that inject blank identifiers to satisfy the Go compiler, and they break easily.

## Architecture invariants

Behaviours that are load-bearing. Changing them is a breaking change, not a refactor.

**JPA-style filter field/path segments must pass through `ParseJPAFilterField`
(`templates/go/controller.go.hbs`) / `parseFilterKey` (`generators/postgrest.js`) before
touching SQL.** The dynamic filter loop (`GET /api/{entity}`, the dynamic join endpoint, `GroupBy`,
and the RPC layer) resolves query-string keys like `?fieldName.equals=value` into a raw SQL column
reference spliced directly into `query.Where(dbField+" = ?", val)` — GORM only parameter-binds
`val`, never `dbField`. An unvalidated field name is a SQL injection vector via a crafted query
*key*, not just a value; `ParseJPAFilterField`/`parseFilterKey` reject anything that doesn't match
`^[a-zA-Z0-9_]+$` per segment before it's used. Do not build `dbField` by hand again.

**JSONB filtering is a generic arrow-path convention, not per-key generated code.** GDL never
declares a JSON/JSONB field's inner structure — content is entirely user-defined — so
`?metadata->status.equals=value` (arbitrarily nested: `?metadata->a->b.equals=value`) is resolved
via Postgres's `#>>` path operator (`"metadata"#>>'{a,b}'`), always extracting as text so every
existing operator (`equals`, `contains`, `greaterThan`, `in`, `specified`, …) keeps working
unchanged. This was broken until 2026-08-17: the filter loop naively snake-cased the *entire* raw
key into a bare column reference, so a bare JSONB field filter produced a Postgres type error and a
nested-path filter (`metadata.status.equals=...`) produced `WHERE metadata.status = ?`, which
Postgres rejects as a missing table reference. `generators/postgrest.js`'s RPC layer already had a
working single-level `->`/`->>` scheme before this; both are now unified on the same
multi-level `#>>` convention.

**Triple-Identity Registry.** Three layers: Keycloak realm role (`dealer_tokyo`) → opaque UUID
exposed to clients via `X-Tenant-ID` → physical database name (`dealership_silo_japan_prod`).
Physical names must never reach a client; the indirection exists to block ID enumeration.

**Silo-Connection-Cache.** `TenantDBManager` holds two independently guarded maps — `conns`
(`map[string]*tenantConn`, under `mu`) and `mongoConns` (`map[string]*tenantMongoConn`, under
`mongoMu`) — of lazily initialised, kept-warm singletons
([generators/multitenancy.js](GO-DUCK-CLI/generators/multitenancy.js)). Per-request pool creation
would exhaust ports at 100+ silos. Pool caps are applied per singleton. The mutexes are separate so
Mongo lookups never block behind Postgres setup.

**Master fallback on invalid tenant.** A request carrying an explicit `X-Tenant-ID` that resolves to zero tenant mappings must silently fall back to the master database instead of returning a 403. A request with *no* `X-Tenant-ID` at all also falls back to the master DB. Note: this overrides a previous (2026-08-18) rule that enforced a strict "Zero-trust fallback" rejecting invalid IDs. The current rule is that an invalid or unresolvable tenant ID must always use the master database. Do not fail the call.

**Tenant UUID is self-sufficient by default, not role-scoped — configurably.** A comma-separated
`X-Tenant-ID` resolves directly to those silos
([generators/multitenancy.js](GO-DUCK-CLI/generators/multitenancy.js), `TenantMiddleware`). By
default (`multitenancy.require-role-grant: false`) the opaque UUID is the credential on its own,
independent of which realm role the caller holds — handed out per-grant via `GET /api/silos/me`,
whoever holds a valid tenant UUID can route a request to that silo. Set
`multitenancy.require-role-grant: true` to instead require the caller's own realm role to also carry
an explicit `tenant_roles` grant for that tenant (role AND tenant_id, both required) — per-user
provisioning onto a secondary silo, not just UUID possession. `admin_db` is carved out in both modes
unless the caller holds the super-admin role. The `tenant_id` comparison is case-insensitive
(`LOWER(tenant_id)`) on both the lookup and at provisioning time (`CreateDatabaseAndMigrate` now
lowercases `TenantID` the same way it already lowercased `DBName`) — before 2026-08-18 the comparison
was case-sensitive while the incoming header was always lower-cased, so any tenant provisioned with a
mixed-case ID could never be routed to, silently falling back to the master DB per the bug above.

**Access policy is additive, and decided by specificity.** Marketed as **DuckGuard ACL** (the
enforcement layer) over the **Federated Access Matrix / FAM** (the rule set). Those names appear in
`README.md`, `CLI_GUIDE.md`, and `FEATURES/` only — the generator, Go package, table, and route
names are all `access_policy` / `access_policies`, and renaming them would break every deployed
project's migration state. `EvaluateAccessPolicy`
([generators/access_policy.js](GO-DUCK-CLI/generators/access_policy.js)) scores each matching rule
— user pin +8, named realm role +4, exact endpoint +2, named method +1, plus `Priority × 100` — and
the highest score wins; an exact tie resolves to DENY. It is deliberately *not* "deny overrides",
because that would make the wildcard-DENY + role-ALLOW carve-out impossible. An endpoint named by
any active ALLOW rule becomes a whitelist (non-matching callers are denied); an endpoint no rule
mentions is allowed, so an empty table is behaviourally identical to not having the engine. Do not
"harden" that default to deny — it is what makes the feature safe to ship to existing deployments.
The middleware is registered globally, before the route groups, so it also covers root-level public
routes; it therefore resolves identity itself, and an unverified token yields an *anonymous*
identity rather than trusted claims — never authorize from unvalidated JWT claims, or a forged role
would satisfy an ALLOW carve-out. On a database read failure the cache serves the previous snapshot
rather than an empty set, so a blip cannot silently drop every DENY rule.

**`00002_init_access_policy.sql` stays numbered below the entity migrations.** Timestamped entity
migrations (`20260814…`) already sit in existing projects' changelogs, so a low version arrives as
*unapplied* and the generated migrator — Goose with `WithAllowOutofOrder(true)` — applies it on the
next start. Renumbering it to a current timestamp silently strands every pre-existing project.

**The `goduck.io/*` labels are the entire discovery contract.** Marketed as **Strait of Duck
Gateway (SDG)** (docs-only name; code stays `generators/gateway.js`, command `create-gateway`,
same disclosure convention as DuckGuard ACL). `devops.js` stamps three labels on every generated
app's Deployment (top-level + pod template) and Service alongside the pre-existing `app:` label —
additive only, `selector`/`matchLabels` are untouched, so this cannot affect routing or rollouts:
`goduck.io/managed` (existence check — is this a GO-DUCK app at all), `goduck.io/service` (the app
name, read back by the gateway to key its discovery map), and `goduck.io/environment` (sourced from
`go-duck.environment-tag` in that app's own config.yaml, default `"prod"` — an independent concept
from the `environment.active_profile` top-level YAML key, which only controls which
`application-{profile}.yml` the *running binary* loads and is never read by `devops.js` at all,
since `loadConfig()` only unwraps the `go-duck:` root). SDG's discovery cache (`discovery/k8s.go`
inside the gateway's own generated output) polls the Kubernetes API filtered by
`discovery.label-selector` (default `goduck.io/managed=true`) plus, if the gateway's own
`discovery.environment` is set, an appended `,goduck.io/environment=<value>` clause. Renaming any
of the three keys breaks discovery for every already-deployed app with no warning. Apps generated
before this shipped are invisible to the gateway until redeployed — a one-time, one-way gap, not a
bug. Discovery is necessarily cluster-scoped (`ClusterRole`, not `Role`): every GO-DUCK app deploys
into its own dedicated namespace named after the app (see `applyNs` in `devops.js`), never a shared
one.

**SDG never gates the traffic it proxies.** `/proxy/:service/*rest` forwards to a discovered
service's ClusterIP with zero auth imposed by the gateway itself — each downstream service's own
JWT/DuckGuard ACL middleware still governs it exactly as if hit directly. Only the gateway's *own*
UI (`/ui/swagger`, `/ui/metrics`) and JSON API (`/api/services*`) are Keycloak-gated. Making the
generic proxy path itself an auth chokepoint was considered and deliberately rejected — it would
double-auth every request and silently break any route a service intentionally left public (an
`open` GDL directive, a health check).

**The proxy re-prepends the service name; it does not forward the bare wildcard tail.**
`proxy/reverse_proxy.go`'s handler sets `c.Request.URL.Path = "/" + serviceName + c.Param("rest")`,
*not* `c.Param("rest")` alone. `resolveApiPrefix` (`utils/naming.js`) defaults every app's REST
mount point to `/<service-name>/api`, so the downstream router expects requests to still carry its
own service-name segment — dropping it produces a 404 from the *downstream app*, which is easy to
misdiagnose as a gateway routing bug rather than a stripped path segment. Do not "simplify" this
back to forwarding just the wildcard tail. `Registry.Get()` also tries a hyphen/case-insensitive
fallback after the exact match, so `plk-access-control` resolves a service literally labeled
`plk-accesscontrol` — deliberate tolerance for naming drift between where a service is called from
and what it's named in `config.yaml`, not something to "fix" into requiring exact matches.

**SDG runs two ports on two separate `*gin.Engine` route trees, never one engine with conditional
routes.** `SetupRouter` (admin, `server.port`, default 8080) carries the UI, `/api/services*`, and
`/proxy/*`. `SetupProxyOnlyRouter` (`server.proxy-only-port`, default 8081, 0 disables it) carries
only `/health` and `/proxy/*rest` — the UI/API handlers aren't hidden behind a check on this
listener, they're never registered on it at all, so there's no code path to bypass. Do not collapse
these into one engine gated by request origin/port inspection: the whole point is that the narrower
surface is safe to `kubectl port-forward` or SSH-tunnel to a developer without also handing them
the admin port's fleet-wide topology view, and that guarantee only holds if the handlers are
structurally absent, not conditionally hidden.

**Anti-thundering-herd.** Distributed cron uses Redis `SETNX` with a 55s TTL so exactly one pod
executes; losers return 200 immediately. Redis-protocol only, so Valkey works unchanged.

**Silo migrations never hold the global lock.** `GetDB` holds `m.mu` only to look up or insert the
map entry; dialling and migrating happen outside it under the entry's own `sync.Once`
([generators/multitenancy.js](GO-DUCK-CLI/generators/multitenancy.js)). Never move migration back
inside the critical section — an `RWMutex` writer blocks all readers, so that stalls every tenant
lookup in the process, not just the cold one.

**Silo migrations are advisory-locked and fail closed.** `EnsureTenantSchema` builds a per-call
`goose.Provider` with `WithSessionLocker`, so pods serialise per database rather than racing.
Never reintroduce `goose.SetDialect` / `SetTableName` / `SetBaseFS` — those are package globals and
race when silos migrate concurrently. A silo that fails to migrate is not cached and does not serve
traffic; the next request retries setup.

**Negative-cache prevention.** Empty tenant-mapping slices are never cached — caching a miss
during provisioning previously caused a 24-hour tenant lockout.

**Recursive BSON parity.** Nested GDL brace structures map to JSONB in SQL and recursive
`bson`-tagged structs in Mongo, and must stay structurally identical to the Protobuf definitions.

**Migration diffing must normalize column names via `toSnakeCase`.** When diffing `prev.fields`
against `entity.fields` in `index.js`, comparisons must use `toSnakeCase(f.name) === toSnakeCase(pf.name)`.
Raw string equality fails across camelCase/snake_case variations and marks the same column for both
simultaneous addition and deletion in the same migration block. Active target entity fields must never be
dropped (`generators/migrations.js`), and column type modifications must always emit non-destructive PostgreSQL
`ALTER TABLE <table> ALTER COLUMN <col> TYPE <new_type> USING <col>::<new_type>` instead of dropping and
re-adding columns.

**SonarQube DevOps tooling contract.** `devops/services.yml` ships `sonarqube:community` on port 9000 with
persistent volumes and `SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true`. Every scaffolded project includes
`sonar-project.properties` and an automated audit script (`sonar_benchmark.sh` in root and `devops/`) that
runs Go test coverage, executes SonarScanner, and compiles a standalone HTML report
(`sonarqube_benchmark_report.html`) matching the Quality Gate and benchmark styling standards.

## Known gaps

Current state, so agents don't re-derive it or claim these are done:

1. **Secrets in ConfigMaps.** The full deployment config, including datasource password, Keycloak
   client secret, S3/R2 keys, and cron token, is dumped verbatim into a K8s `ConfigMap`
   ([generators/devops.js:555](GO-DUCK-CLI/generators/devops.js#L555)) alongside the correctly
   wired `Secret`.
2. **No generator tests.** ~11.5k lines of JS with no fixtures or golden files.
3. **`SAMPLE-GO-APP` is stale and needs regenerating.** Its committed controllers reference
   `models.DistributedOutbox` fields (`AggregateType`, `AggregateID`, `EventType`) that its own
   `models/outbox.go` does not define, so it does not compile. Its `migrations/migrations.go` also
   still uses the `goose.SetTableName` / `SetDialect` / `SetBaseFS` globals that the invariant above
   says never to reintroduce, and `middleware/tenant_middleware.go` plus `router/router.go` still
   call `RunGoNativeMigrationsForTenant`. Freshly generated output is correct — only the checked-in
   sample has drifted.
4. **Zero-entity scaffold does not build.** `router.go` references `controllers.AIController`, which
   is not emitted when there are no entities. Pre-existing; reproduces on unmodified `main`.

Note: `internal/service` referencing `pb.Unimplemented*ServiceServer` is **not** a gap — those
symbols come from `protoc` codegen, which is a required build step. `go build ./...` on a fresh
`create` will fail there until protobuf generation has been run.

## Reference environments

- **SAMPLE-GO-APP** — standard container build from `CONFIG/config.yaml`, all background services
  active (gRPC, outbox workers).
- **SAMPLE-GO-SERVERLESS-APP** — from `CONFIG/config-serverless.yaml`, background workers disabled
  for cold-start efficiency. Route logic is shared via the `router` package, so both entry points
  stay at parity.
