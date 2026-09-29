---
title: Features overview
description: API and platform capabilities generated from GDL.
---

Generated services share one router package, whether you run `main.go` or a [serverless](/infra/serverless/) entrypoint. The API prefix is `go-duck.server.rest.api-path-prefix`. Default: `/{app-name}/api`. There is no `v1` segment on REST.

## API surface

| Topic | What is generated |
|-------|-------------------|
| [REST and search](/features/rest/) | CRUD, filters, bulk, joins, pagination (0-based `page` in the CLI changelog) |
| [Elasticsearch](/features/elasticsearch/) | `@Searchable` indexing. URL shape differs across pages |
| [GraphQL](/features/graphql/) | SDL file is real. `POST /graphql` does not execute queries |
| [gRPC](/features/grpc/) | Kratos service per entity, default `:9000` |
| [Integrations](/features/integrations/) | Angular and Flutter snippets, WSO2 publisher, `/v3/api-docs` |

## Data and tenancy

| Topic | What is generated |
|-------|-------------------|
| [Hybrid-Store](/features/hybrid-store/) | Postgres and MongoDB, cross-DB relationships |
| [Multi-tenancy](/features/multitenancy/) | Opaque tenant ids, silo cache, hide-silo-names |
| [Multi-silo guide](/features/multi-silo/) | Header, harvest response shape, comma-separated writes |
| [Federation](/features/federation/) | `@Federated` plus `?federated=true` for reads |
| [Saga](/features/saga/) | `distributed_outbox`, 10s poll, 5 attempts |
| [Gateway](/features/gateway/) | Kubernetes discovery and a pass-through proxy |

## Identity

Business routes expect a Keycloak JWT unless the entity is [`open`](/gdl/advanced/). Management routes (`/management/*`, `/api/admin/*`) also require `security.super-admin-role` when that key is set. [DuckGuard](/infra/security/) can narrow that further with stored rules.

Operations (WebSockets, MQTT, audit, traces) are under Operations in the sidebar.
