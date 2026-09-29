# Source: observability.html

# Total Observability Ecosystem

Metrics, Datadog streaming, and OpenTelemetry distributed tracing pre-configured natively inside your microservice architecture.

## 1. OpenTelemetry Distributed Tracing (OTel)

With multiple applications talking to each other, debugging an API timeout inside a black-box environment is devastating. GO-DUCK generated apps utilize full-stack OpenTelemetry.

Note: Traces cover the entire round trip. They begin at the `otelgin` Router level, propagate securely via ctx context through your Controllers and Services, and are eventually finalized by the highly optimized `gorm.io/plugin/opentelemetry/tracing` hook at the Database execution level.

### Where to view traces?

The Go application pushes these `otlptracegrpc` trace chunks asynchronously out to an otel-collector container over port `4317`.

```
# The pre-packaged docker-compose spins up a Jaeger UI node
# Point your browser to:
http://localhost:16686
```

## 2. Datadog Integration (Log Consolidation)

If deployed to the cloud, GO-DUCK apps are compatible with Datadog's Agent endpoints immediately. Inside the `application-prod.yml`, flip the `enabled: true` config marker and supply an API key.

```
# Inside application.yml
go-duck:
logging:
datadog:
enabled: true
api-key: "YOUR_NATIVE_DD_AGENT_API_KEY_HERE"
site: "datadoghq.com"
service: "inventory-microservice"
```

### 3. System Infrastructure Metrics (Statsd)

The `logger` package has a sidecar implementation for Datadog's `statsd`, exposed as a single function: `logger.TraceMetric("api.hit", 1, []string{"env:prod"})`. It's a gauge under the hood, so it's the one building block available today for custom dashboard charts — there's no separate `Count`/`Histogram` helper yet.

## 4. Prometheus & Kubernetes Autoscaling (HPA)

For Kubernetes environments, the generated microservices automatically expose a standard `GET /metrics` Prometheus scraping endpoint powered by `github.com/prometheus/client_golang`. This allows the Kubernetes Metrics Server or Prometheus Adapter to constantly poll your API and scale up your Pod Replicas horizontally when traffic increases.

## 5. Real-Time System Streams (SSE)

Need to see exactly how much your server is "holding up" in real time without refreshing a dashboard? GO-DUCK injects a Server-Sent Events (SSE) streaming endpoint at `GET /api/system/stream`.

Powered by `github.com/shirou/gopsutil`, this endpoint streams the exact same nested payload as the full system metrics endpoint below (`system`, `endpoints`, `status_codes`, `failed_calls`) as an SSE `"metrics"` event, once per second. A `telemetry.metrics.stream-interval` config key exists for tuning that interval, but the broadcast loop doesn't read it yet — it's currently fixed at 1 second regardless of what you set.

```
event: metrics
data: {
"system": { "uptime": "10 days, 4 hours, 7 minutes", "heap_alloc_mb": 104, "goroutines": 52, "..." },
"endpoints": { "GET /api/account": { "count": 1733, "mean_time_ms": 338.2, "max_time_ms": 1050.2 } },
"status_codes": { "200": { "count": 546626, "mean_time_ms": 487.64, "max_time_ms": 3.45 } },
"failed_calls": 284
}
```

A sibling endpoint, `GET /api/system/logs/stream`, streams raw log lines over SSE instead of metrics. And for drop-in dashboards without writing any frontend code, `GET /api/system/widget` and `GET /api/system/grid` serve pre-built HTML widgets you can iframe directly.

## 6. Full JHipster-Style System Metrics JSON

For developers who prefer a deep dive into the JVM-style metrics (Go equivalents), a massive, rich telemetry JSON payload is natively exposed at `GET /api/system/metrics`.

This endpoint acts identically to the classic JHipster `/management/jhimetrics` endpoint, and will output:

- System/Go Stats: Process Uptime, GC Pauses, Goroutine counts, Heap allocations, and Open Files.

- HTTP Tracking Middleware: Live request counts, mean execution times, and max execution times grouped by both HTTP Status Codes and specific API Endpoints.

```
{
"system": {
"uptime": "10 days, 4 hours, 7 minutes",
"process_cpu_usage": 1.76,
"system_cpu_usage": 1.76,
"process_files_open": 359,
"heap_alloc_mb": 104,
"heap_sys_mb": 629,
"num_gc": 12,
"gc_pause_total_ms": 45,
"goroutines": 52,
"system_cpu_count": 8,
"total_mem_mb": 16384,
"pod_cpu_limit_pct": 50.0,
"is_pod_cpu_limited": true,
"redis_status": "up",
"redis_version": "7.2.4",
"redis_connected": true,
"cache_hits": 8213,
"cache_misses": 402,
"cache_type": "Valkey"
},
"endpoints": {
"GET /api/account": {
"count": 1733,
"mean_time_ms": 338.208,
"max_time_ms": 1050.2
}
},
"status_codes": {
"200": { "count": 546626, "mean_time_ms": 487.64, "max_time_ms": 3.45 }
},
"failed_calls": 284
}
```
