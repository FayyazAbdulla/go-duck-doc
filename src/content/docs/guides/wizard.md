---
title: Config wizard
description: Browser config.yaml builder, and how it differs from gdl-planner.
---

The wizard page is a static, client-side form. It builds `config.yaml` in the browser and downloads that file. No `go-duck` command runs it.

A different tool plans entities:

```text
go-duck-cli gdl-planner [-p/--port <number>]
```

Default port `8000`. That is an Angular schema planner, not this form.

## What the form emits

`generateYAML()` always nests settings under `go-duck`, then adds a **top-level** `environment.active_profile: "dev"` (not under `go-duck`).

The [configuration reference](/guides/configuration/) shows a second, flatter template (`server.port` instead of `server.rest.port`, and no Keycloak block). Both are in the local HTML. REST routing is documented against `go-duck.server.rest.api-path-prefix`, which only the wizard emits.

Keys the wizard writes:

| Area | Keys |
|------|------|
| Identity | `name`, `version` |
| REST | `server.rest.port` (default 8080), `server.rest.protocol` (`json`), `server.rest.api-path-prefix` (`/{kebab-name}/api`) |
| gRPC | `server.grpc.addr` (`:9000`), `network` (`tcp`), `timeout` (`1s`) |
| CORS | `allow-origins`, `allow-methods`, `allow-headers` |
| Postgres | `datasource.host`, `port`, `username`, `database`, `ssl-mode` (`disable` when Postgres is enabled) |
| MongoDB | `datasource.mongodb.enabled`, `uri`, `database` |
| Keycloak | `security.keycloak-host`, `keycloak-realm`, `keycloak-app-client-id`, `keycloak-app-client-secret`, `keycloak-service-client-id`, `keycloak-service-secret`, `keycloak-admin-client-id`, `keycloak-admin-secret` |
| Other security | `security.confidential-mode`, `security.rate-limit.rps`, `security.rate-limit.burst` (burst is fixed at `200` in the script) |
| Messaging | `messaging.mqtt.enabled`, `messaging.mqtt.broker`, `messaging.nats.enabled`, `messaging.nats.url` |
| Redis | `cache.redis.enabled`, `host`, `ttl` |
| Resilience | `resilience.circuit-breaker.enabled` (`true`), `failure-threshold` (`5`) |
| OTel | `telemetry.otel.enabled`, `endpoint`, `sampler-ratio` (`1.0`) |
| Datadog | `logging.datadog.enabled`, `api-key`, `site` (`datadoghq.com`) — only if that toggle is on |
| Elasticsearch | `elasticsearch.enabled`, `elasticsearch.addresses` — only if that toggle is on |
| S3 | `storage.s3.enabled`, `bucket`, `region` |
| GitHub | `storage.github.owner`, `storage.github.repo`, and `storage.bootstrap.enabled` with `files: ["id_rsa"]` |

The form's sample client secrets are placeholders. Replace them before any shared environment. The script does not emit `service` under Datadog; the [Datadog](/ops/datadog/) page does.

The fullest template on the configuration page includes timeouts, pool size, MinIO, GCS, Prometheus, and `environment-tag`. The wizard script does not emit those. Copy them from [configuration](/guides/configuration/) if you need them.

UI storage buttons include MinIO and GCP. The script only special-cases `s3` and `github`. For any other selected id it sets `storage.<id>.enabled: true` and nothing else.

`confidential-mode` is only labeled in the UI (“Shields management silos”). No further behavior is specified on the page.
