---
title: Keycloak
description: JWT validation, JWKS cache, three clients, and the super-admin role.
---

Generated `middleware.JWTMiddleware()` validates access tokens against Keycloak.

- Signature via JWKS.
- Expiry.
- Roles from `realm_access.roles` and from every `resource_access.*.roles` entry, merged into one set on the Gin context.
- `KeycloakID` stored in the context so audit and metering do not trust a client-supplied id header.

There is no `jwks-url` or `issuer` key. The JWKS URL is built as `/realms/{realm}/protocol/openid-connect/certs` from `keycloak-host` and `keycloak-realm`.

## JWKS cache

In-memory map guarded by `sync.RWMutex`.

- `StartJWKSCacheWarmer` fetches at boot and then every hour.
- A manual refresh runs at most once every 10 seconds.
- A token whose `kid` is missing triggers one synchronous refresh before the request fails.

## Config

```yaml
go-duck:
  security:
    keycloak-host: "http://keycloak:8080"
    keycloak-realm: "go-duck-preview"
    keycloak-app-client-id: "backend-service"
    keycloak-app-client-secret: "change-me"
    keycloak-service-client-id: "backend-service-m2m"
    keycloak-service-secret: "change-me"
    keycloak-admin-client-id: "admin-cli"
    keycloak-admin-secret: "change-me"
    super-admin-role: "SUPER_ADMIN"
```

| Client | Use |
|--------|-----|
| App id and secret | User-facing OIDC |
| Service id and secret | Calls between your services |
| Admin id and secret | Keycloak Admin REST (for example, provisioning realm roles) |

`SuperAdminRoleMiddleware` checks `super-admin-role` case-insensitively against the merged role set. Missing role → 403. If `super-admin-role` is unset, the middleware is disabled and the handler runs. The security page's example value is `"platform_admin"` rather than `"SUPER_ADMIN"`.

Rate limiting by `KeycloakID` is described on [Security](/infra/security/). The gateway UI uses `keycloak-js` with `login-required`; that is separate from this middleware.
