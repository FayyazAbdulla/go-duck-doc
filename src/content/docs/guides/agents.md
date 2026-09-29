---
title: Contributor guide
description: How the Node generator is laid out, and the invariants that must not drift.
---

This is the CLI repository’s `AGENTS.md`: how to change the generator. Milestone dates are on [Changelog](/reference/changelog/). Instructions shipped inside a generated service are on [Generated app notes](/guides/generated-app/).

The generator is Node. `GO-DUCK-CLI/index.js` is the Commander entry. `parser/gdl.js` returns entities, relationships, enums, and open entities. `validators/gdlValidator.js` runs before any write. `generators/*.js` are the emitters. `generators/gateway.js` is not part of `generateEntities()` — it writes a separate module for `create-gateway`. Templates are Handlebars under `templates/` (`go`, `kratos`, `proto`, `graphql`, `docs`, `angular`). Writes go through `utils/file_manager.js`, an `fs-extra` proxy. Importing `fs-extra` directly skips the preserve needle. Only `writeFile` and `writeFileSync` are intercepted. `copy`, `outputFile`, and `writeJson` are not.

`CONFIG/` holds `config.yaml`, `config-hybrid.yaml`, `config-mongo-only.yaml`, `config-psql-only.yaml`, and `config-serverless.yaml`. `SAMPLE-GO-APP` is a checked-in container sample and does not compile as committed. `SAMPLE-GO-SERVERLESS-APP` is the serverless sample.

## Pipeline

`create` and `import-gdl` share this order. Call a new generator from **both** command bodies.

1. Load YAML and unwrap `go-duck:`.
2. `validateGDL()`. Any error calls `process.exit(1)` before a file is written.
3. Copy config to `<output>/.go-duck/config.yaml`.
4. Infrastructure generators, skipped with `--preserve-root`.
5. `generateEntities()` — parse, dedupe, delta, models, controllers, interceptors, snapshots, purges, Goose SQL.
6. Downstream generators (Kratos, repository, GraphQL, PostgREST, multitenancy, audit, metering, security, access policy, websocket, outbox, NATS, storage, router, Elasticsearch, serverless, and the rest).
7. Docs: Swagger, Postman, MQTT dictionary, HTML guide, AI blueprint, WSO2.
8. `main.go`, `go.mod`, `.tool-versions`, then `go mod tidy`.

Delta fields: `newEntities`, `newFields`, `deletedFields`, `alteredFields`, `alteredAnnotations`, `newRelationships`, `deletedRelationships`, `alteredRelationships`, `deletedEntities`. Annotation-only changes (for example adding `@TrackViews`) must be in `alteredAnnotations` or no migration is emitted.

`go.mod` `require` blocks are hardcoded twice in `index.js` (`const goModContent`). A new import has to be added in both. The Dockerfile also runs `go mod tidy` before `go build`.

Do not `curl` files from generated build scripts. Bundle them under `templates/` and copy at generation time. `third_party/google/api/*.proto` is bundled that way.

## Load-bearing behavior

- Filter query **keys** go through `ParseJPAFilterField` / `parseFilterKey` before they are spliced into SQL. GORM binds the value, not the column expression. Segments must match `^[a-zA-Z0-9_]+$`. JSONB paths use Postgres `#>>`.
- DuckGuard names in docs are not the code names. Code, table, and routes stay `access_policy` / `access_policies`. Score: user pin +8, named role +4, exact path +2, named method +1, plus `priority × 100`. An exact tie is DENY. An endpoint with no rule stays allowed. Do not flip that default to deny. Unverified tokens are anonymous, not trusted claims. A failed refresh keeps the previous rule snapshot.
- `00002_init_access_policy.sql` stays numbered below timestamped entity migrations so Goose `WithAllowOutofOrder` still applies it.
- Discovery labels are `goduck.io/managed`, `goduck.io/service`, and `goduck.io/environment`. `environment-tag` is not `environment.active_profile`. The latter only selects `application-{profile}.yml`. Default label selector is `goduck.io/managed=true`. Optional filter: `discovery.environment`.
- The proxy sets the path to `"/" + serviceName + rest`. It does not forward the wildcard alone. `Registry.Get()` tries an exact match, then a hyphen-insensitive fallback.
- Admin and proxy-only listeners are two `gin.Engine` trees. Do not merge them.
- Cron lock is Redis `SETNX` with a 55-second TTL. Losers return 200. Valkey speaks the same protocol.
- Silo migrations run outside the global mutex, under that entry’s `sync.Once`, with a per-call Goose provider and `WithSessionLocker`. Do not call `goose.SetDialect`, `SetTableName`, or `SetBaseFS`. A failed migration is not cached. Empty tenant-mapping slices are not cached.
- Column diffs compare `toSnakeCase` names. Type changes are `ALTER COLUMN ... TYPE ... USING`, not drop and add.
- Nested GDL braces are JSONB in SQL and recursive BSON in Mongo, and must match Protobuf.

Product names **DuckGuard ACL** and **Strait of Duck Gateway** appear in docs only. Generated identifiers stay `access_policy` and `create-gateway`.

## Known gaps (contributor guide)

1. Datasource password, Keycloak client secret, S3/R2 keys, and the cron token are copied into a Kubernetes ConfigMap as well as a Secret.
2. The generator has no automated test suite.
3. `SAMPLE-GO-APP` is stale and does not compile.
4. An empty GDL directory still fails to build because the router references `controllers.AIController`.

`go build` on a fresh `create` also fails until `./generate.sh` has produced the Protobuf servers. That is a required step, not a generator bug.

Manual check:

```bash
node GO-DUCK-CLI/index.js validate-gdl GDL --smart
node GO-DUCK-CLI/index.js create -c CONFIG/config.yaml -g GDL -o /tmp/gd-check
cd /tmp/gd-check && go build ./... && go vet ./...
node GO-DUCK-CLI/index.js import-gdl GDL -o /tmp/gd-check
```

Also regenerate against `config-psql-only.yaml`, `config-mongo-only.yaml`, `config-hybrid.yaml`, and `config-serverless.yaml` when the change touches persistence, cache, or devops.
