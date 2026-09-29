# Source: otel.html

# OpenTelemetry (OTel) & Jaeger

Master the art of distributed tracing to debug complex inter-service communications in real-time.

## What is OpenTelemetry?

OpenTelemetry is a collection of tools, APIs, and SDKs used to instrument, generate, collect, and export telemetry data (metrics, logs, and traces). GO-DUCK implements a "Full-Stack Tracing" strategy.

## The Trace Pipeline

Trace context is automatically propagated across your entire stack:

HTTP Router (Gin)

Service/Controller

Database (GORM)

Each database query is automatically tagged with the `trace_id` of the incoming HTTP request. This allows you to identify exactly which REST call caused a slow SQL query.

### The OTel Collector

GO-DUCK apps don't speak directly to tracing backends. Instead, they export via gRPC to an otel-collector sidecar. Out of the box the generated collector config wires up exactly two exporters — a debug console logger and OTLP to Jaeger. It's a standard, off-the-shelf OTel Collector though, so extending its config to also fan out to Datadog, Honeycomb, or anywhere else that speaks OTLP is a config edit away, not something you need to fight the generator for — it just isn't generated for you by default.

## Visualizing with Jaeger

In local development, GO-DUCK spins up a Jaeger instance. It provides a web-based UI to search and visualize your traces.

```
# Open Jaeger UI locally
open http://localhost:16686
```

## External Resources

- OpenTelemetry Official Docs →

- Jaeger Tracing Documentation →

- OTel Collector Guide →
