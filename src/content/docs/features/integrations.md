---
title: Integrations
description: Angular and Flutter clients, OpenAPI, and WSO2 publisher settings.
---

`{apiPrefix}` is `go-duck.server.rest.api-path-prefix`, default `/{app-name}/api`.

## Angular

The integrations page uses `HttpClient` and points at `keycloak-angular` for tokens. Pagination params are `page` and `size`.

Filter calls put the operator on the query key:

```typescript
params = new HttpParams().set(`${queryField}.${operator}`, value);
// ?age.greaterThan=20
```

Search in that snippet calls `{apiPrefix}/rpc/entity`. Entity lists call `{apiPrefix}/entitys`. See [REST](/features/rest/) for the difference between `/rpc/:table` and the per-entity routes.

## Flutter

The list endpoint returns a JSON array. Decode it as a `List`. Indexing `['results']` throws.

Send `Authorization: Bearer` and, when you are pinning a silo, `X-Tenant-ID`.

## OpenAPI

Generated services expose OpenAPI JSON at `/v3/api-docs`. `/swagger.json` remains for older clients. The home page describes a Swagger UI that can use Keycloak SSO.

## WSO2

On startup, a generated API can register its OpenAPI 3 spec with the WSO2 Publisher API:

```yaml
go-duck:
  integrations:
    wso2:
      enabled: true
      publisher-url: "https://localhost:9443/api/am/publisher/v3"
      client-id: "YOUR_WSO2_CLIENT_ID"
      client-secret: "YOUR_WSO2_CLIENT_SECRET"
      gateway-environments:
        - "Production"
        - "Sandbox"
```

`gateway-environments` is accepted and not used. Registration hardcodes `visibility: PUBLIC` and does not call a separate “deploy to environment” API.

Kong, Apigee, and JHipster-style clients can pull `/v3/api-docs` without this block.
