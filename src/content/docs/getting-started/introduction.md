---
title: Introduction
description: What GO-DUCK generates from a GDL blueprint.
---

**GO-DUCK** is a Go microservice generator. A [GDL](/gdl/getting-started/) file describes entities, enums, and relationships. The CLI turns that file into a service: Gin REST, Kratos gRPC, GORM on PostgreSQL, optional MongoDB, Goose migrations, Protobuf, a GraphQL schema file, Keycloak JWT middleware, and Kubernetes manifests.

The local product site (V3.0) is the source for this documentation:

`/Users/abdulla/Work/current-go-duck-doc/Website`

## What a generated service includes

- **REST** under `go-duck.server.rest.api-path-prefix` (default `/{app-name}/api`), with JPA-style filters, pagination, and `X-Total-Count`.
- **gRPC** on `go-duck.server.grpc.addr` (default `:9000`), with an optional gRPC-Web proxy.
- **Hybrid-Store** — PostgreSQL by default; `@isDocument` stores an entity in MongoDB.
- **Hard silos** — a separate database per tenant, addressed by an opaque `X-Tenant-ID`.
- **DuckGuard ACL** — an in-process allow/deny matrix, cached for `security.access-policy.cache-ttl` (default `30s`).
- **Messaging** — MQTT for UI events and NATS subjects for internal routing, when enabled.
- **OpenAPI** at `/v3/api-docs`, with `/swagger.json` still available.

GraphQL schema generation is real. Query execution is not: `POST /graphql` returns a fixed placeholder. See [GraphQL](/features/graphql/).

## How evolution works

The generator keeps a snapshot in `.go-duck/` at the project root. Later imports diff that snapshot and emit Goose migrations (`ADD COLUMN`, `DROP COLUMN`, or `DROP TABLE` when an entity is marked `@Delete`). Files that contain `// @go-duck-preserve` are skipped unless you pass `--reset`.

Install the generator with `npm install -g go-duck-cli`, then `go-duck init` and `go-duck create`. See [Install](/getting-started/install/).

## Next

- [Install and first generate](/getting-started/install/)
- [GDL](/gdl/getting-started/)
- [CLI reference](/guides/cli/)
- [Configuration](/guides/configuration/)
