# Source: security.html

# Zero-Trust Identity

GO-DUCK enforces a battle-hardened, identity-first firewall. Built on standard OIDC, our zero-trust architecture ensures every request is verified, authorized, and traced from the gateway to the database.

OIDC Hardened

Native integration with Keycloak for real-time JWT validation and anti-spoofing context verification.

RSA Signed WebSocket

Secure "REST-over-WS" implementation using HMAC-SHA256 signatures for total message integrity.

Zero-Trust Multi-Tenancy

No cross-tenant data leakage. Identity automatically selects the secure silo at the middleware layer.

## The Secure Lifecycle

01

## Protocol Verification

Every request—HTTP, gRPC, or WebSocket—is challenged for a valid OIDC identity. The generator automatically scaffolds the necessary middleware for each protocol.

gin.jwt
kratos.authn

```
// Example: JWTMiddleware automatically extracting Federated Role
authHeader := ctx.GetHeader("Authorization")
claims, _ := keycloak.Verify(authHeader)

// Silo matching happens here!
siloID := MapRoleToSilo(claims.RealmRole)

```

## DuckGuard ACL

Authorization as data, not something compiled into your routes. DuckGuard ACL evaluates the Federated Access Matrix — a four-axis grid of `endpoint × method × realm role × user identity` stored in the master registry — on every request, resolved by specificity, never declaration order.

### One Rule Locks a Route

Naming an endpoint in any `ALLOW` rule turns it into a whitelist — no companion `DENY` needed. A blanket `DENY *` plus a role-specific `ALLOW` still composes correctly, because precedence is scored (user pin > named role > exact path > named method), not "deny always wins."

POST /management/access-policy

{ "endpoint": "/api/reports", "method": "GET",

"realmRole": "ROLE_FINANCE", "effect": "ALLOW" }

### Purely Additive

An endpoint no rule mentions stays allowed. Enabling DuckGuard on a running deployment changes nothing until an operator writes a rule — and the rule set lives in memory, cached for `security.access-policy.cache-ttl` (default 30s), serving the last-known-good snapshot if a refresh fails rather than an empty one.

security:

access-policy:

cache-ttl: "30s"

### Simulate Before You Trust It

Precedence between overlapping wildcard and role rules is the part operators get wrong — `POST /management/access-policy/simulate` dry-runs any caller against the live matrix without issuing the request, so you can check before you rely on it.

GET /management/access-policy
PATCH /:id/toggle
POST /simulate

## Silo Discovery & Privacy

### Silo Discovery API

Authenticated users can discover their accessible silos via `GET /api/silos/me`. This allows front-end applications to build dynamic tenant selection interfaces.

GET /api/silos/me

[

{ "tenantId": "bc72-91a0...", "roleName": "branch_usa" }

]

### HideSiloNames Toggle

For maximum zero-trust compliance, you can hide internal DB-Names from the discovery API by enabling the `HideSiloNames` toggle in `application.yml`.

go-duck:

multitenancy:

hide-silo-names: true

## Anti-Burst Shielding
Distributed Protection.

Protect your infrastructure from "Noisy Neighbors" and NAT spoofing. Our Distributed Redis Rate Limiter tracks clients by Keycloak UserID—ensuring that limiting persists even if a user switches IPs or devices.

Redis-Backed
Fixed-Window Limit

Identity-First
Safe from NAT Spoofing

## The Super Admin Boundary

### Standard Business APIs

Endpoints under `/api/*` are accessible to any authenticated user with a valid silo mapping. These handle standard CRUD, Federated Search, and Usage Reporting.

/api/cars
/api/silos/me
/api/search/*

### Confidential Control Plane

Sensitive endpoints under `/management/*` and `/api/admin/*` are restricted to the Super Admin Role defined in `application.yml`.

go-duck:
security:
super-admin-role: "platform_admin"

Confidential Mode Enabled

## Ready for Production Security?

Deploy zero-trust identity across your cluster with one command.

Review Keycloak Setup
