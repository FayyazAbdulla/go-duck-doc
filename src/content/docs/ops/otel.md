---
title: OpenTelemetry
description: Trace path from Gin through GORM to the collector and Jaeger.
---

Traces are exported with `otlptracegrpc` to an OpenTelemetry Collector. The app does not talk to Jaeger directly.

Path:

1. HTTP router (`otelgin`)
2. Controller and service, via `context`
3. GORM, through `gorm.io/plugin/opentelemetry/tracing`

Each SQL statement is tagged with the request `trace_id`.

Enable export with the configuration template:

```yaml
go-duck:
  telemetry:
    otel:
      enabled: true
      endpoint: "localhost:4317"
```

The wizard also writes `telemetry.otel.sampler-ratio` (fixed at `1.0` in the script). That key is not in the fullest template.

The generated collector config has two exporters: a debug console logger, and OTLP to Jaeger. Datadog, Honeycomb, or another OTLP backend means editing that collector config yourself. It is not generated.

Local UI, from the packaged compose file:

```text
http://localhost:16686
```
