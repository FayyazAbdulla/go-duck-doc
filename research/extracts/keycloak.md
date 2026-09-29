# Source: keycloak.html

# Keycloak: Identity & Access Management

Secure your microservices with industrial-strength OIDC/JWT authentication powered by Keycloak.

## Centralized Identity

Identity management is a first-class citizen in GO-DUCK. Every microservice is pre-configured to validate JSON Web Tokens (JWT) issued by Keycloak. This ensures that only authenticated users and services can access your data.

## JWT Validation & Security

The generated `middleware.JWTMiddleware()` handles several critical security tasks:

- Digital Signature Verification: Validates the token against Keycloak's public keys (JWKS).

- Expiration Enforcement: Ensures tokens are still within their valid time window.

- Role Extraction: Merges both `realm_access.roles` and every `resource_access..roles` (client/resource roles) into a single role set and injects it into the Gin context for downstream authorization.

- Context Safety: Populates `KeycloakID` in the context to prevent header spoofing in audit and metering modules.

Authorization: Beyond simple authentication, the middleware extracts both `realm_access.roles` and the roles nested under every `resource_access.` entry from the token, so client-scoped roles work just as well as realm-wide ones. You can use these roles to implement fine-grained RBAC inside your controllers.

## JWKS Caching & Refresh

Verifying a signature against Keycloak on every single request would be a latency tax nobody wants to pay. So the generated middleware keeps an in-memory `jwkCache` (guarded by a `sync.RWMutex`) of Keycloak's public keys, and refreshes it intelligently rather than constantly:

- Background Warmer: On boot, `StartJWKSCacheWarmer` fires an initial fetch and then re-fetches on an hourly ticker, so the cache is rarely stale.

- Rate-Limited Refresh: A manual or on-demand refresh is throttled to at most once every 10 seconds, so a burst of unknown `kid`s can't hammer Keycloak.

- Synchronous Fallback on Cache Miss: If a token arrives signed with a `kid` the cache doesn't recognize (e.g. right after a Keycloak key rotation), the middleware synchronously refreshes the cache once before failing the request — so a fresh key rotation doesn't require a restart.

## Super Admin Boundary: `SuperAdminRoleMiddleware`

Some endpoints (silo provisioning, tenant assignment, access-policy management) shouldn't be reachable by ordinary authenticated users. `SuperAdminRoleMiddleware` enforces this by reading the configured `super-admin-role` and case-insensitively checking it against the caller's merged role set (realm + client roles, see above). If the role isn't present, the request is rejected with a `403 Forbidden` before it ever reaches your controller.

Note: If `super-admin-role` is left unset in configuration, the middleware treats the boundary as disabled and simply calls through — so make sure it's configured in any environment where management endpoints are exposed.

## Distributed Rate Limiting: `RateLimitMiddleware`

Requests are identified by their `KeycloakID` (falling back to client IP for unauthenticated calls) and throttled against the configured `rate-limit.rps` / `rate-limit.burst` values. The middleware prefers a Redis-backed distributed limiter — a fixed-window counter shared across every instance of your service — so scaling horizontally doesn't accidentally multiply your effective rate limit.

If Redis is unreachable, it automatically falls back to a local, in-process `golang.org/x/time/rate` limiter keyed per identifier, so a Redis outage degrades gracefully to per-instance limiting instead of taking rate limiting offline entirely.

## Configuration

Connecting your GO-DUCK app to Keycloak is a simple matter of YAML configuration:

```
go-duck:
security:
keycloak-host: "http://keycloak:8080"
keycloak-realm: "go-duck-preview"
# App client: user-facing OIDC login flows
keycloak-app-client-id: "backend-service"
keycloak-app-client-secret: "change-me"
# Service client: machine-to-machine (M2M) auth between microservices
keycloak-service-client-id: "backend-service-m2m"
keycloak-service-secret: "change-me"
# Admin client: calls the Keycloak Admin REST API (user/role management)
keycloak-admin-client-id: "admin-cli"
keycloak-admin-secret: "change-me"
super-admin-role: "SUPER_ADMIN"
```

Note that there's no `jwks-url` or `issuer` key to set — the JWKS endpoint is derived internally at runtime as `/realms//protocol/openid-connect/certs`. The three client-id/secret pairs exist because they serve different purposes: app credentials drive user-facing authentication, service credentials drive M2M calls between your own microservices, and admin credentials are used exclusively to call the Keycloak Admin API (e.g. for provisioning realm roles).

## External Resources

- Keycloak Official Documentation →

- OpenID Connect (OIDC) Standard →

- JWT.io: Debugging & Decoding Tokens →
