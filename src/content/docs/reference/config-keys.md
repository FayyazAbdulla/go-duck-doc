---
title: Config keys
description: Keys named in the local HTML. Two templates disagree; both are listed.
---

Keys below are copied from the local Website HTML. Sample secret values are omitted. If a key appears in only one template, that is noted.

The configuration page nests almost everything under `go-duck:`. The wizard also writes a top-level `environment.active_profile` (`"dev"`).

## Identity and discovery

| Key | Where documented |
|-----|------------------|
| `go-duck.name` | Configuration template, wizard |
| `go-duck.version` | Configuration template, wizard |
| `go-duck.description` | CLI README sample |
| `go-duck.environment-tag` | Configuration template and CLI README. Default `"prod"`. Label `goduck.io/environment`. Not the same key as top-level `environment.active_profile` |
| `discovery.poll-interval` | Gateway. Default 15s |
| `discovery.environment` | Gateway. Empty scans all tiers. Lives in the gateway file, under `strait-of-duck:` |
| `discovery.label-selector` | Contributor guide. Default `goduck.io/managed=true` |
| `discovery.cache-ttl` | Gateway README. `/health` reports `degraded` when the last good poll is older than this. Not a read gate |
| `environment.active_profile` | Wizard only. Top-level, value `"dev"` |

## Server

| Key | Where documented |
|-----|------------------|
| `server.port` | Configuration template (8080). Gateway admin port, same default |
| `server.read-timeout`, `server.write-timeout` | Configuration template (`30s`) |
| `server.proxy-only-port` | Gateway. Default 8081. `0` disables |
| `server.rest.port` | Wizard. Default 8080 |
| `server.rest.protocol` | Wizard (`"json"`). CLI README also documents `"messagepack"` with `Accept: application/msgpack` |
| `server.rest.api-path-prefix` | Wizard, REST, integrations. Default `/{app-name}/api` |
| `server.grpc.addr` | Both. Default `:9000` |
| `server.grpc.network` | Both. `"tcp"` |
| `server.grpc.timeout` | Wizard. `"1s"` |
| `server.grpc.web_enabled` | gRPC page. Default false |
| `server.grpc.web_port` | gRPC page. Default `9090` |
| `server.cors.allow-origins` | Both |
| `server.cors.allow-methods` | Both. Template includes `PATCH`; wizard form default does not |
| `server.cors.allow-headers` | Wizard |

The configuration template places `port` directly under `server`. The wizard places REST under `server.rest`. REST docs refer to `server.rest.api-path-prefix`.

## Datasource

| Key | Where documented |
|-----|------------------|
| `datasource.host`, `port`, `username`, `password`, `database` | Configuration template. Wizard omits `password` |
| `datasource.max-open-conns` | Configuration template (`25`) |
| `datasource.ssl-mode` | Wizard, set to `"disable"` when Postgres is enabled |
| `datasource.mongodb.enabled`, `uri`, `database` | Both |

## Security and tenancy

| Key | Where documented |
|-----|------------------|
| `security.keycloak-host` | Keycloak page, wizard |
| `security.keycloak-realm` | Keycloak page, wizard |
| `security.keycloak-app-client-id` | Keycloak page, wizard |
| `security.keycloak-app-client-secret` | Keycloak page, wizard |
| `security.keycloak-service-client-id` | Keycloak page, wizard |
| `security.keycloak-service-secret` | Keycloak page, wizard |
| `security.keycloak-admin-client-id` | Keycloak page, wizard |
| `security.keycloak-admin-secret` | Keycloak page, wizard |
| `security.super-admin-role` | Keycloak page, security page. Unset disables the middleware |
| `security.confidential-mode` | Wizard. Behavior not specified beyond the UI label |
| `security.rate-limit.rps` | Wizard (form default 100), Keycloak page |
| `security.rate-limit.burst` | Wizard hardcodes `200` |
| `security.access-policy.cache-ttl` | Configuration template. Default `30s` |
| `security.cron-token` | Serverless page. Header `X-Cron-Token` |
| `multitenancy.enabled` | CLI README sample (`true`). When false, tenant routing and the outbox are bypassed |
| `multitenancy.hide-silo-names` | Multi-tenancy, security, federation, CLI README. Sample default false |
| `multitenancy.require-role-grant` | Multi-tenancy, federation, changelog 2026-08-18. Default false |

No `jwks-url` or `issuer` key exists in the corpus.

## Messaging, cache, resilience

| Key | Where documented |
|-----|------------------|
| `messaging.mqtt.enabled`, `messaging.mqtt.broker` | Configuration template, wizard |
| `messaging.mqtt.username`, `messaging.mqtt.password` | Mosquitto page |
| `messaging.nats.enabled`, `messaging.nats.url` | Configuration template, wizard |
| `cache.redis.enabled`, `host` | Redis page, wizard |
| `cache.redis.ttl` | Wizard |
| `cache.redis.key-prefix` | Redis page. Empty falls back to the service name |
| `cache.valkey.enabled`, `host`, `db`, `ttl`, `key-prefix` | Redis page |
| `resilience.circuit-breaker.enabled` | Wizard (`true`) |
| `resilience.circuit-breaker.failure-threshold` | Wizard (`5`) |

## Telemetry, search, logs

| Key | Where documented |
|-----|------------------|
| `telemetry.otel.enabled`, `telemetry.otel.endpoint` | Configuration template, wizard |
| `telemetry.otel.sampler-ratio` | Wizard (`1.0`) |
| `telemetry.metrics.prometheus-enabled` | Configuration template |
| `telemetry.metrics.stream-enabled` | Configuration template |
| `telemetry.metrics.stream-interval` | Configuration template. Observability page says the loop ignores it |
| `logging.datadog.enabled`, `api-key`, `site` | Datadog page, wizard. `api-key` and `site` are unused. StatsD is `127.0.0.1:8125` |
| `logging.datadog.service` | Datadog page, observability page. Not emitted by the wizard |
| `elasticsearch.enabled`, `elasticsearch.auto_sync` | Elasticsearch page, shown un-nested |
| `go-duck.elasticsearch.enabled`, `go-duck.elasticsearch.addresses` | Wizard. No `auto_sync` |

## Storage and integrations

| Key | Where documented |
|-----|------------------|
| `storage.s3.enabled`, `bucket`, `region` | Configuration template, wizard |
| `storage.s3.access-key`, `storage.s3.secret-key` | Configuration guideline table (also for R2) |
| `storage.gcs.enabled`, `bucket`, `credentials-file` | Configuration template |
| `storage.minio.enabled`, `bucket`, `endpoint` | Configuration template |
| `storage` SFTP `host`, `port`, `username`, `key-file` | Configuration guideline table |
| `storage.github.owner`, `repo` | Wizard |
| `storage` GitHub `owner`, `repo`, `token`, `files` | Configuration guideline table |
| `storage.bootstrap.enabled`, `provider`, `owner`, `repo`, `branch`, `token`, `files` | Storage page. `provider`: `github`, `azure`, `bitbucket` |
| `integrations.wso2.enabled`, `publisher-url`, `client-id`, `client-secret`, `gateway-environments` | Integrations page. `gateway-environments` is not applied |

See [Precautions](/reference/precautions/) before copying sample passwords from the HTML templates.
