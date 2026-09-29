# Source: gateway.html

# Strait of Duck Gateway

One command, `go-duck create-gateway`, scaffolds a standalone service that discovers every GO-DUCK microservice running in your cluster, funnels traffic to them through a single address, and gives operators a Keycloak-gated view of the whole fleet — pod counts, live metrics, Swagger docs — without touching your existing apps.

Zero-Config Discovery

Polls the Kubernetes API for Services carrying `goduck.io/managed=true` — a label every generated app's Deployment and Service already carries. Nothing to register by hand.

Two-Port Isolation

An admin port carries the UI and topology data; a second, narrower proxy-only port carries nothing but the reverse proxy — safe to hand a developer without exposing your fleet's map.

No Database, Ever

The discovery cache is a plain in-memory map, rebuilt from the Kubernetes API on every poll. The cluster is the source of truth — this is just a cache in front of it.

## How It Works

01

## Discover

Every `discovery.poll-interval` (default 15s), the gateway lists Services and Deployments cluster-wide, filtered by label, and counts each one's live ready-replica pods.

client-go
ClusterRole

```
// Failed poll? Keep serving the last-known-good snapshot --
// same resilience idiom as DuckGuard ACL's cache.
services, err := clientset.CoreV1().Services("").List(ctx,
metav1.ListOptions{LabelSelector: "goduck.io/managed=true"})

```

02

## Proxy

Requests forward byte-for-byte to the discovered service's ClusterIP — no header injected, no token checked by the gateway itself. Each downstream service's own JWT/DuckGuard ACL middleware still decides access, exactly as if it had been hit directly.

/proxy/:service/*rest

```
// No auth imposed here on purpose -- see "Never the Chokepoint" below
target := &url.URL{Scheme: "http", Host: info.ClusterIP + ":" + port}
httputil.NewSingleHostReverseProxy(target).ServeHTTP(w, r)

```

03

## Observe

Two Keycloak-gated pages: a Swagger switcher that server-side-proxies each service's own docs, and a Metrics page built as a collapsible accordion — expand any service to see its actual pods (phase, node, IP, restarts), not just a count. Every pod has a View Console button: real Kubernetes log output (the same data `kubectl logs` shows) alongside live CPU / Memory / Network / Disk charts, fetched from that specific pod's own IP so you're never watching a different replica than the one you clicked.

/ui/swagger
/ui/metrics

```
// The browser only ever talks to the gateway -- never a
// downstream ClusterIP it usually couldn't reach anyway.
GET /api/services/:name/swagger.json
GET /api/services/:name/metrics
// Per-pod, resolved by IP -- not the Service's ClusterIP
GET /api/pods/:namespace/:pod/logs
GET /api/pods/:namespace/:pod/metrics

```

## Two Ports, One Purpose Each

### Admin Port server.port · default 8080

Carries everything: the Keycloak-gated UI, the `/api/services*` JSON API, and the reverse proxy. Both UI pages force a login (`keycloak-js`, `onLoad: 'login-required'`) before rendering, and the JSON endpoints underneath carry real server-side JWT validation — curling them without a token still 401s.

GET /ui/swagger  ·  GET /ui/metrics

GET /api/services  ·  /proxy/*

### Proxy-Only Port server.proxy-only-port · default 8081

Carries only `/health` and the reverse proxy. Not the admin port with auth "turned off" — the UI and API handlers are never registered on this engine at all, so there's nothing there to bypass. Safe to `kubectl port-forward` to a developer who needs one service without your whole fleet's topology. Set to `0` to disable.

server:

proxy-only-port: 8081

## Never the Chokepoint
By Design, Not Oversight.

Making the reverse proxy an auth chokepoint was considered and deliberately rejected — it would double-auth every request and silently break any route a service intentionally left public: an `open Car(read)` GDL directive, a health check. The gateway funnels the connection; it never decides who gets through.

Pass-Through
No Header Injected

Downstream Decides
Same as a Direct Hit

## Cluster-Scoped RBAC & Tiered Discovery

### Why Cluster-Scoped

Every GO-DUCK app deploys into its own dedicated namespace named after the app — never a shared one. A namespaced `Role` couldn't see across them, so `go-duck create-gateway` ships its own read-only `ClusterRole` (`get/list/watch` on services, endpoints, pods, deployments — nothing else) and `ClusterRoleBinding`.

ServiceAccount
ClusterRole
read-only

### Scoping to One Tier

Every app also carries a `goduck.io/environment` label, sourced from `go-duck.environment-tag` in its own `config.yaml` (default `"prod"`). Point a gateway at just one tier via `discovery.environment` — blank scans every tier it can see.

discovery:

environment: "staging"

Run One Gateway Per Tier

## Give Your Fleet a Front Door

One command scaffolds the whole thing — its own `go.mod`, Dockerfile, and Kubernetes manifests included.

```
go-duck create-gateway -c CONFIG/strait-of-duck-config/config.yaml -o my-gateway
cd my-gateway && go run main.go
# Admin port: http://localhost:8080/ui/swagger
# Proxy-only port: http://localhost:8081/proxy//...
```

Review CLI Reference

See DuckGuard ACL
