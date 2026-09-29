---
title: Observability
description: Prometheus, SSE metrics, Jaeger, and the system JSON payload.
---

Generated services expose several telemetry endpoints. Tracing and Datadog each have their own pages: [OpenTelemetry](/ops/otel/), [Datadog](/ops/datadog/).

## Endpoints

| Endpoint | Role |
|----------|------|
| `GET /metrics` | Prometheus text (`prometheus/client_golang`), used by HPA |
| `GET /api/system/stream` | SSE, event name `metrics`, about once a second |
| `GET /api/system/logs/stream` | SSE of log lines |
| `GET /api/system/metrics` | JSON snapshot (same families as the SSE payload) |
| `GET /api/system/widget` | HTML widget |
| `GET /api/system/grid` | HTML grid |

`telemetry.metrics.prometheus-enabled` and `telemetry.metrics.stream-enabled` turn the Prometheus and SSE endpoints on in the [configuration template](/guides/configuration/).

`telemetry.metrics.stream-interval` is documented (`"1s"`, `"500ms"`) and, on the observability page, **not read** by the broadcast loop. The loop is fixed at one second.

SSE and `/api/system/metrics` share this shape (fields abbreviated):

```json
{
  "system": {
    "uptime": "10 days, 4 hours, 7 minutes",
    "heap_alloc_mb": 104,
    "goroutines": 52,
    "redis_status": "up",
    "cache_hits": 8213,
    "cache_misses": 402,
    "cache_type": "Valkey"
  },
  "endpoints": {
    "GET /api/account": { "count": 1733, "mean_time_ms": 338.2, "max_time_ms": 1050.2 }
  },
  "status_codes": {
    "200": { "count": 546626, "mean_time_ms": 487.64, "max_time_ms": 3.45 }
  },
  "failed_calls": 284
}
```

`system` also carries process CPU, open files, GC stats, pod CPU limit fields, and Redis or Valkey version when cache is enabled. See [Redis](/infra/redis/).

Traces start at the `otelgin` middleware, follow `context` through controllers, and include SQL via `gorm.io/plugin/opentelemetry/tracing`. Local Jaeger is `http://localhost:16686`.
