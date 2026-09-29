---
title: Configuration
description: The config.yaml template from the configuration page, plus keys documented elsewhere.
---

`config.yaml` is the file `go-duck create -c` reads. The configuration page publishes one “fullest” template. The [wizard](/guides/wizard/) emits a different shape (notably `server.rest` and the Keycloak keys). A key index is on [Config keys](/reference/config-keys/).

Sample passwords in the HTML are examples. Replace them.

## Fullest template

As printed on the configuration page:

```yaml
go-duck:
  name: "go-duck-master-app"
  version: "1.0.0"
  # Stamped as the goduck.io/environment label. Default "prod".
  environment-tag: "prod"

  server:
    port: 8080
    read-timeout: "30s"
    write-timeout: "30s"
    grpc:
      addr: ":9000"
      network: "tcp"
    cors:
      allow-origins: ["*"]
      allow-methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

  datasource:
    host: "localhost"
    port: 5432
    username: "postgres"
    password: "password"
    database: "go_duck_db"
    max-open-conns: 25
    mongodb:
      enabled: true
      uri: "mongodb://localhost:27017"
      database: "go_duck_mongo"

  messaging:
    mqtt:
      enabled: true
      broker: "tcp://localhost:1883"
    nats:
      enabled: true
      url: "nats://localhost:4222"

  storage:
    s3: { enabled: false, bucket: "bucket-name", region: "us-east-1" }
    gcs: { enabled: false, bucket: "bucket-name", credentials-file: "keys.json" }
    minio: { enabled: true, bucket: "dev", endpoint: "localhost:9000" }

  telemetry:
    otel:
      enabled: true
      endpoint: "localhost:4317"
    metrics:
      prometheus-enabled: true
      stream-enabled: true
      stream-interval: "1s"

  security:
    access-policy:
      cache-ttl: "30s"
```

This template uses `server.port`. REST docs and the wizard use `server.rest.port` and `server.rest.api-path-prefix`. Both appear in the corpus.

## What the page says each group does

| Group | Role |
|-------|------|
| `name` | Go module name for imports and scaffolding |
| `version` | Injected into Swagger and build manifests |
| `environment-tag` | Not under `security`. Label `goduck.io/environment` on the Deployment and Service. Default `"prod"` |
| `datasource.host` / `port` / `database` | PostgreSQL for the relational store and the tenant registry |
| `max-open-conns` | GORM pool limit |
| `mongodb.enabled` | Turns on `@isDocument` and document storage |
| `mqtt.broker` | Mutation broadcasts for UI clients |
| `nats.url` | Internal streaming |
| `telemetry.otel.enabled` | OpenTelemetry through Gin and GORM |
| `metrics.prometheus-enabled` | `GET /metrics` |
| `metrics.stream-enabled` | `GET /api/system/stream` |
| `metrics.stream-interval` | Documented examples `"1s"` and `"500ms"`. The observability page says the SSE loop is still fixed at 1 second and does not read this key |
| `security.access-policy.cache-ttl` | How long a pod caches `access_policies`. Default 30s. A write through `/management/access-policy` is immediate on that pod |

The same page lists extra storage fields that are not in the YAML block above:

| Provider | Fields |
|----------|--------|
| AWS S3 / R2 | `bucket`, `region`, `access-key`, `secret-key` |
| Google GCS | `credentials-file` |
| SFTP / SSH | `host`, `port`, `username`, `key-file` |
| GitHub bootstrap | `owner`, `repo`, `token`, `files` |

It also describes a circuit breaker (when DB, MQ, or search is down) and a Redis rate limit by Keycloak identity. The numeric keys for those are in the [wizard](/guides/wizard/) output (`resilience.circuit-breaker`, `security.rate-limit`), not in this template.

Keycloak, Redis `key-prefix`, Valkey, multi-tenancy flags, cron token, and WSO2 are documented on their own pages and collected under [Config keys](/reference/config-keys/).
