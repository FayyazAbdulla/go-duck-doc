---
title: Precautions
description: Secrets, tenancy defaults, and behaviors the HTML marks as incomplete.
---

## Secrets

- Replace every sample password in `config.yaml`. The configuration template uses a literal database password. The wizard prefills Keycloak client secrets. Neither is a production value.
- `security.super-admin-role` must be set wherever `/management/*` is exposed. If it is unset, `SuperAdminRoleMiddleware` allows the request through.
- Generated WebSocket HMAC uses the hardcoded string `go-duck-super-secret-key` in `ws/handler.go`. Change it. Browsers cannot send `Authorization` on the WebSocket handshake, so `?token=` returns 401.
- Local Mosquitto defaults on the Mosquitto page are `dev_user` / `dev_password` with `allow_anonymous false`. Change them outside compose.
- `storage.bootstrap.token` and WSO2 `client-secret` should be environment references, not committed strings.
- `POST /api/system/cron` checks `X-Cron-Token` against `go-duck.security.cron-token`.
- gRPC-Web, when `web_enabled` is true, sends `Access-Control-Allow-Origin: *`.

## Multi-tenant

- `multitenancy.hide-silo-names` defaults to false in the shipped sample. `GET /api/silos/me` then includes physical database names. Set it to `true` if those names must stay on the server.
- Default tenant resolution trusts the opaque UUID alone. Set `multitenancy.require-role-grant: true` to also require a role grant.
- Unknown `X-Tenant-ID` values are 403. They are not rewritten to the default database.
- `admin_db` is excluded from harvest unless the caller is super-admin.
- Cache keys use the tenant role. Leaving `key-prefix` empty still prefixes with the service name, which matters when several services share one Redis.
- Enabling both `cache.redis` and `cache.valkey` is inconsistent between generation (Redis wins) and runtime (Valkey wins). Enable one.
- Do not delete `.go-duck/` unless you mean to drop generator history.

## DuckGuard and public routes

- An endpoint with no ACL rule stays allowed. A single ALLOW rule for an endpoint turns it into a whitelist.
- The Strait of Duck gateway does not authenticate `/proxy`. Downstream middleware does. `open` routes stay public through the proxy.
- The proxy-only port never mounts the admin UI. Do not assume it is “admin with auth off.”

## Kubernetes

- Each generated app uses its own namespace. The gateway needs a cluster-scoped read-only role to see them.
- `environment-tag` becomes `goduck.io/environment`. A gateway with `discovery.environment` set will ignore other tiers.
- `goduck.io/managed=true` is what discovery selects. Removing it hides the service from the gateway.
- HPA scrapes `GET /metrics` only if `telemetry.metrics.prometheus-enabled` is on.
- Serverless entrypoints do not run gRPC and do not drain `distributed_outbox` unless you wire `POST /api/system/cron` yourself.

## Known gaps from the CLI repository

The contributor guide’s current list:

- Kubernetes ConfigMaps receive the full app config, including the datasource password, Keycloak client secret, S3/R2 keys, and cron token, next to the Secret that is supposed to hold them.
- The generator has no test suite. Generated apps get `main_test.go` only, which checks `config.LoadConfig()`.
- The checked-in `SAMPLE-GO-APP` does not compile. Generate a fresh project.
- An empty GDL directory does not build: the router references `controllers.AIController`, which is not emitted. Add at least one entity. An older changelog entry claimed this was fixed; the contributor guide still lists it as open.

`go build ./...` on a new project also fails until `./generate.sh` has run. That is expected.

Redis and Valkey both enabled: the website says generation warns and keeps Redis. The 2026-06-29 changelog says generation **stops**. Do not enable both.

## Known incomplete behavior

Documented in the HTML, not guessed:

- `POST /graphql` returns a fixed string. Resolvers are unused.
- WebSocket `CREATE_{ENTITY}` does not write.
- `@Audited` `/history` and `/timeline` read `audit_log`, which nothing fills. `AuditMiddleware` writes `audit_logs` on the master database, after the response, outside the business transaction.
- Datadog `api-key` and `site` are unused. Metrics go to `127.0.0.1:8125`. Logs are not shipped.
- `telemetry.metrics.stream-interval` is not read; SSE stays at 1 second.
- WSO2 `gateway-environments` is not sent. Visibility is hardcoded `PUBLIC`.
- Outbox rows that fail five times stay `PENDING`. `FAILED` is never written.
- Invalid JSONB path segments are dropped silently (no 400).
- Elasticsearch route and config shape differ across the Elasticsearch page, the REST page, the annotations page, and the wizard. Check the generated OpenAPI before calling a search URL.
