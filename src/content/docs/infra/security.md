---
title: Security
description: Keycloak JWT, DuckGuard ACL, super-admin routes, and rate limits.
---

HTTP, gRPC, and the WebSocket upgrade all expect an OIDC bearer token unless a route was generated as [`open`](/gdl/advanced/) or sits on the gateway's proxy-only port (the gateway itself does not authenticate proxied traffic).

JWT checks, JWKS caching, and the three Keycloak clients are on [Keycloak](/infra/keycloak/). Silo ids are on [Multi-tenancy](/features/multitenancy/).

## DuckGuard ACL

Rules live in the master registry, table `access_policies`, not in route code. Each rule is `endpoint × method × realm role × user identity` with an effect of ALLOW or DENY.

If any ALLOW rule names an endpoint, that endpoint becomes a whitelist. You do not also need a DENY. A blanket `DENY *` plus a role ALLOW still works, because precedence is a score:

1. User pin
2. Named role
3. Exact path
4. Named method

“Deny always wins” is not the rule. An endpoint that no rule mentions stays allowed. Turning the feature on changes nothing until someone writes a rule.

```http
POST /management/access-policy

{ "endpoint": "/api/reports", "method": "GET", "realmRole": "ROLE_FINANCE", "effect": "ALLOW" }
```

Also, from the CLI README:

| Method | Path |
|--------|------|
| GET, POST | `/management/access-policy` |
| PUT, DELETE | `/management/access-policy/:id` |
| PATCH | `/management/access-policy/:id/toggle` (`is_active`) |
| POST | `/management/access-policy/simulate` |

Simulate evaluates a caller against the live matrix and does not perform the business request. Administration requires the super-admin role.

The contributor guide scores matches as user pin +8, named role +4, exact path +2, named method +1, plus `priority × 100`. An exact tie is DENY. A lone DENY, with no ALLOW for that endpoint, is a blacklist. Any ALLOW that names the endpoint turns it into a whitelist. Code, table, and routes stay `access_policy` / `access_policies`. The product name is docs-only.

`cache-ttl` accepts a Go duration (`10s`, `1m`, `500ms`). The contributor guide says `0` or an unset value still uses the 30-second floor, so caching cannot be turned off by accident. The migration is `00002_init_access_policy.sql`, numbered low so Goose applies it out of order on existing projects. The two seeded example rules ship with `is_active` false.

The write handler calls `InvalidateAccessPolicyCache()` on the pod that served `POST`. Other pods wait until their own TTL. There is no cross-pod signal. Reads are in process memory, not Redis.

Cache:

```yaml
go-duck:
  security:
    access-policy:
      cache-ttl: "30s"
```

A failed refresh serves the previous snapshot, not an empty list. A write is visible immediately on the pod that handled it, and within one TTL on the others.

## Super-admin boundary

| Surface | Who |
|---------|-----|
| `/api/*` business routes, `/api/silos/me` | Authenticated caller with a silo mapping |
| `/management/*`, `/api/admin/*` | `security.super-admin-role`, when that key is set |

Examples in the HTML: `"platform_admin"` (security page) and `"SUPER_ADMIN"` (Keycloak page). If the key is missing, the middleware does not enforce the boundary.

The wizard has `security.confidential-mode`. The UI says it shields management silos. The HTML does not define the flag further.

## Rate limit

Redis fixed window, keyed by Keycloak user id, so a new IP does not reset the budget. If Redis is down, the process falls back to `golang.org/x/time/rate` for that instance only. Unauthenticated calls use the client IP.

Wizard keys: `security.rate-limit.rps` (form default 100) and `burst` (hardcoded `200`).

## WebSocket signatures

REST-over-WS envelopes use HMAC-SHA256 of the payload. The generated default secret is documented on [WebSockets](/ops/websockets/) and must be replaced.
