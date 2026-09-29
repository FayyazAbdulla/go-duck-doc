---
title: Changelog
description: Operator-facing changes from the CLI changelog. Full text is in research/cli-sources.
---

History below is taken from `CHANGELOG.md` in the CLI repository (copied to `research/cli-sources/CHANGELOG.md`). Entries are newest first. Internal generator line references stay in that file.

The achievement table in the CLI README (the “560%” scoreboard) is the same history told as marketing. It is not repeated here.

## Unreleased (as of the copied changelog)

- **Pagination is 0-based** (2026-09-07). Offset is `page * size`. Default `size` is 20. `page < 0` is treated as 0. `page=0` is the first page, `page=1` the second. This replaced `(page - 1) * size`, which made `page=0` and `page=1` return the same rows. Angular and Ionic SDK templates were updated with the controllers and gRPC services. The website HTML still describes `page` as 1-indexed. See [REST](/features/rest/).
- **`GET /management/tenant/provisions`** (2026-09-07), super-admin. Optional filters: `tenantId`, `roleName`, `dbName`.
- **SonarQube** scaffold and `./sonar_benchmark.sh` (2026-09-02). See [SonarQube](/ops/sonarqube/).
- **Migrations** (2026-09-02). Field diffs use `toSnakeCase`. Type changes use `ALTER COLUMN ... TYPE ... USING`, not drop plus add.
- **Gateway pod console** (2026-08-21). `/ui/metrics` lists pods. `GET /api/pods/:namespace/:pod/logs` and `.../metrics`. ClusterRole includes `pods/log`. System metrics gained disk and network byte fields.
- **Storage** (2026-08-20). A failed credential bootstrap no longer skips every provider. SFTP redials on the next upload or download if the session is dead.
- **`X-Tenant-ID`** (2026-08-18). Lookup is `LOWER(tenant_id)`. Provisioning lowercases `TenantID`. The changelog and product README say an explicit header that matches nothing is **403**, not a silent master-database write. UUID alone is the credential unless `multitenancy.require-role-grant` is true. The contributor guide later says invalid IDs must fall back to the master database and that this overrides the 403 rule. Both statements are in the uploaded sources. See [Multi-silo](/features/multi-silo/).
- **Protobuf files are bundled** (2026-08-17). `generate.sh` no longer curls `googleapis` at build time.
- **`go.mod` require list** was reconciled with real imports (2026-08-17). The Dockerfile runs `go mod tidy` before `go build`.
- **JSONB filters** use `#>>`. Filter keys must match `^[a-zA-Z0-9_]+$` per segment (2026-08-17).
- **Gateway proxy** forwards `"/" + serviceName + rest`, not the wildcard tail alone (2026-08-16). Image tags follow `config.version`, matching `push.sh`.
- **`create-gateway`** shipped 2026-08-15. Config root `strait-of-duck:`. Labels `goduck.io/managed`, `goduck.io/service`, `goduck.io/environment`.
- **Preserve needle** must be the whole line (2026-08-15).
- **`--dry-run`** on `import-gdl` (2026-08-15).
- **`main_test.go`** smoke test (2026-08-15).
- **DuckGuard / access policy** (2026-08-14, v2.0.5). Table `access_policies`. Migration `00002_init_access_policy.sql` is numbered low on purpose so Goose `WithAllowOutofOrder` applies it on existing projects. Seeded examples ship with `is_active = false`.

## Earlier behavior that is still in the changelog

- Redis and Valkey both enabled **stops generation** (2026-06-29). The website Redis page says generation warns and Redis wins. The changelog is the stricter rule.
- Metering limit `-1` means unlimited (2026-06-26).
- Empty bulk arrays return **400** instead of panicking (2026-07-03).
- `@Version` optimistic locking shipped 2026-07-30 for GORM and MongoDB.
- `GET /api/storage/scan` walks enabled providers until one returns the object (2026-04-18).
- Super-admin roles `admin` and `ROLE_SUPER_ADMIN` can pass `X-Tenant-ID` to impersonate a tenant (2026-06-26).
- Elasticsearch client uses the low-level transport, not the typed API, so Docker builds stay smaller (2026-06-08).
- Search route named in the 2026-05-21 entry: `/api/search/:entity`. The CLI README arsenal also lists `/api/{entity}s/search`. The annotations HTML says the global route was removed. See [Elasticsearch](/features/elasticsearch/).
