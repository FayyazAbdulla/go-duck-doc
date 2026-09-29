---
title: Strait of Duck Gateway
description: Kubernetes service discovery and a pass-through reverse proxy.
---

```bash
go-duck create-gateway -c CONFIG/strait-of-duck-config/config.yaml -o my-gateway
cd my-gateway && go run main.go
```

The website home page spells the same command as `go-duck-cli create-gateway`. The CLI README, the usage guide, and `gateway.html` use `go-duck create-gateway`.

The gateway’s own YAML is rooted at `strait-of-duck:`, not `go-duck:`. Sample path: `CONFIG/strait-of-duck-config/config.yaml`. App config still uses `go-duck:`, including `environment-tag`. `environment.active_profile` only selects `application-{profile}.yml`. The gateway does not read it.

The process has no database. It polls the Kubernetes API and keeps an in-memory map. A failed poll keeps the last good snapshot.

Generated apps already set the label `goduck.io/managed=true` on the Deployment and Service. The gateway lists Services and Deployments with that label and counts ready pods. Default poll: `discovery.poll-interval` of 15s.

Each app is deployed in its own namespace, so the scaffold includes a read-only `ClusterRole` (`get`, `list`, `watch` on services, endpoints, pods, and deployments) and a `ClusterRoleBinding`.

## Two ports

| Port | Config | What is registered |
|------|--------|--------------------|
| Admin, default 8080 | `server.port` | Keycloak-gated `/ui/swagger` and `/ui/metrics`, `/api/services`, and `/proxy/*` |
| Proxy-only, default 8081 | `server.proxy-only-port` | `/health` and the reverse proxy only |

Set `proxy-only-port` to `0` to disable it. The proxy-only listener never registers the UI or JSON handlers, so it is not the admin port with auth turned off.

UI pages use `keycloak-js` with `onLoad: 'login-required'`. `/api/services` returns 401 without a bearer token.

```text
GET /ui/swagger
GET /ui/metrics
GET /api/services/:name/swagger.json
GET /api/services/:name/metrics
GET /api/pods/:namespace/:pod/logs
GET /api/pods/:namespace/:pod/metrics
```

Pod metrics and logs are requested by pod IP, not by the Service ClusterIP.

Local defaults from the page:

```text
http://localhost:8080/ui/swagger
http://localhost:8081/proxy/<service>/...
```

## Proxy behavior

```text
/proxy/:service/*rest
```

The gateway forwards to `http://{ClusterIP}:{port}`. It does not check a token and does not inject a header. The downstream service's JWT middleware and [DuckGuard](/infra/security/) still run. An [`open`](/gdl/advanced/) route stays public.

The forwarded path is `"/" + serviceName + rest`, not the wildcard tail alone. Generated apps mount REST at `/<service-name>/api` (`resolveApiPrefix`). Dropping the service segment makes the **downstream** app return 404. `Registry.Get()` tries an exact name first, then a match that ignores hyphens and case, so `plk-access-control` can resolve a service labeled `plk-accesscontrol`.

Discovery polls Services, Deployments, and Pods. The default label selector is `goduck.io/managed=true` (`discovery.label-selector`). Two more labels are stamped beside it: `goduck.io/service` (app name, map key) and `goduck.io/environment` (from `go-duck.environment-tag`, default `"prod"`). Apps generated before those labels existed stay invisible until they are redeployed. `/health` reports `degraded` when the last successful poll is older than `discovery.cache-ttl`. That flag is a signal. Reads keep serving the last good snapshot.

The ClusterRole is `get`/`list`/`watch` on services, endpoints, pods, and deployments, plus `get` on the `pods/log` subresource. Manifests land in `devops/k8s/gateway.yaml`.

## One tier

Apps are labeled `goduck.io/environment` from `go-duck.environment-tag` (default `"prod"`). A gateway can watch one tier:

```yaml
discovery:
  environment: "staging"
```

An empty `discovery.environment` scans every tier the ClusterRole can see. The page recommends one gateway per tier.
