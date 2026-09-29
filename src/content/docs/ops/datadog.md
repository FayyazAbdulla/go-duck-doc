---
title: Datadog
description: What datadog.enabled actually wires up, and what it does not.
---

`logging.datadog.enabled: true` starts a DogStatsD client for custom metrics. It does not change logging. Logs stay plain text from Go's `log` package, on stdout and on the SSE log stream. They are not JSON and they are not posted to the Datadog Logs API. To get them into Datadog, point the Agent at the container's stdout.

`logger.Info` is printf-style. There is no zap logger and no structured fields:

```go
logger.Info("User logged in: userID=%s", user.ID)
```

## Config

```yaml
go-duck:
  logging:
    datadog:
      enabled: true
      api-key: "${DD_API_KEY}"
      site: "datadoghq.com"
      service: "go-duck-preview"
```

`api-key` and `site` are accepted and unused. The DogStatsD client always dials `127.0.0.1:8125`. Run the Agent as a sidecar or DaemonSet on that address. The wizard emits `enabled`, `api-key`, and `site`, and does not emit `service`.

## Metrics helper

One function, and it is a gauge:

```go
logger.TraceMetric(name string, value float64, tags []string)
```

```go
logger.TraceMetric("orders.placed", 1, []string{"region:us-east"})
logger.TraceMetric("payment.latency", duration, []string{"provider:stripe"})
logger.TraceMetric("active.users", count, []string{"plan:pro"})
```

There is no `Count`, `Histogram`, or `Gauge` helper. Counting versus sampling is how you call `TraceMetric`.
