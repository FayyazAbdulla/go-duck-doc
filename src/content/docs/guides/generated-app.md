---
title: Generated app notes
description: What AGENT_README tells an agent inside a scaffolded GO-DUCK service.
---

Every generated project gets an `AGENT_README` and a `docs/ai/` map. Read those files in the project you are editing. This page is the generator’s instructions, not a substitute for that project’s own blueprint.

## Commands inside a generated app

```bash
go build ./...
./generate.sh          # .\generate.bat on Windows
go mod tidy
docker compose -f devops/docker-compose.yml up -d && go run main.go
./push.sh
```

Files on disk are not proof the module builds. `go mod tidy` and `go build ./...` have to succeed. `go build` fails in `internal/service` until Protobuf has been compiled.

## Invariants

- REST prefixes are lowercase kebab-case. `PaddyCollection` mounts at `/paddy-collection/api`. Swagger, Postman, Docker, and Kubernetes must use that same prefix.
- Image names and Kubernetes resource names are lowercase and DNS-safe.
- When `multitenancy.enabled` is false, HTTP middleware, gRPC interceptors, and the distributed outbox skip tenant routing. The symbols are still generated.
- A secured route with no token returns **401**. A **404** usually means a stale prefix, profile, image, or ConfigMap.
- Keep `.go-duck/config.yaml` and the entity snapshots. Evolve with `import-gdl`, then compare `docs/swagger.json` to `go-duck.server.rest.api-path-prefix` before debugging a missing controller.
- Rebuild the image after regeneration. An old container keeps serving old routes.

The contributor guide still lists an empty GDL directory as a build failure (`controllers.AIController` is referenced and not emitted). An older changelog entry said empty scaffolds were made to compile. Treat the contributor guide’s known-gap list as the later statement. See [Precautions](/reference/precautions/).

## Where to look in the generated tree

| Path | Contents |
|------|----------|
| `docs/ai/ARCHITECTURE.md` | Databases, cache, config, middleware |
| `docs/ai/ENTITIES.md` | Schemas and SQL vs Mongo bindings |
| `docs/ai/ENDPOINTS.md` | REST and OpenAPI routes |
| `docs/ai/PROTOCOLS.md` | GraphQL, MQTT, gRPC, WebSockets |

## Interceptors

Each entity gets an `interceptors/` package. Those files start with `// @go-duck-preserve`, so `import-gdl` leaves them alone unless you pass `--reset` or `--rebase`.

Hooks are `Before` / `After` for `Create`, `Update`, `Patch`, and `Delete`. Payloads are pointers or maps. Mutate them and the controller saves that version.

## Dates and archive directives

Use `LocalDate`, `Instant`, `DateTime`, or `Time`. Bare `Date` is rejected.

`archived EntityA,EntityB` and `archived *` match `@ArchiveStatus`. `@TrackViews` builds the read-receipt shadow table. `--smart` rejects boolean fields that do not start with `is`, `has`, or `can`, and date fields that do not end with `At`, `Date`, or `Time`.
