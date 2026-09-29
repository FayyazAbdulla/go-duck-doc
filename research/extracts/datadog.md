# Source: datadog.html

# Datadog & Cloud Monitoring

Harness the power of enterprise-grade observability with GO-DUCK's native Datadog integration for logs, metrics, and APM.

## Overview

GO-DUCK provides a specialized `logger` package that abstracts the complexity of streaming logs and metrics to Datadog. It supports environment-based configuration, ensuring you only pay for what you need in production while keeping local development logs clean.

## Log Streaming

Our logger is designed to be Datadog-ready — but let's be precise about what "ready" means today. Setting `datadog.enabled` to true wires up a DogStatsD client for pushing custom metrics; logging itself is unaffected and stays exactly where it was: plain-text via Go's standard `log` package to stdout and the live SSE broker. Nothing is JSON-formatted, and nothing is shipped to the Datadog Logs API or an Agent automatically. If you want your logs in Datadog, point the Agent's stdout log collection (container autodiscovery) at your service yourself.

Pro-Tip: `logger.Info` is a printf-style wrapper, not a structured/field-based logger — there's no `zap` dependency under the hood. Use it like `logger.Info("User logged in: userID=%s", user.ID)`. Structured key/value logging isn't implemented yet, so faceted search in the Log Explorer will need a parsing pipeline on the Datadog side.

### Configuration

```
go-duck:
logging:
datadog:
enabled: true
api-key: "${DD_API_KEY}"
site: "datadoghq.com"
service: "go-duck-preview"
```

Note: `api-key` and `site` are accepted here but currently unused by the generated code — the DogStatsD client is hardcoded to `127.0.0.1:8125` regardless of config. Run the Datadog Agent as a sidecar/daemonset listening on that address for metrics to actually reach Datadog.

## Custom Metrics (DogStatsD)

The generated code includes a pre-initialized Statsd client, exposed through a single exported helper. You can push custom business metrics directly from your Go services:

- `logger.TraceMetric("orders.placed", 1, []string{"region:us-east"})` - Tracks order volume.

- `logger.TraceMetric("payment.latency", duration, []string{"provider:stripe"})` - Samples payment latency.

- `logger.TraceMetric("active.users", count, []string{"plan:pro"})` - Tracks a point-in-time value.

All three examples call the same `logger.TraceMetric(name string, value float64, tags []string)` function — it's a gauge under the hood, so "counting" versus "sampling" is a matter of how you call it, not separate APIs. There's no `Count`, `Histogram`, or `Gauge` function.

## External Resources

- Datadog Logs Documentation →

- DogStatsD Guide →

- Datadog APM & Distributed Tracing →
