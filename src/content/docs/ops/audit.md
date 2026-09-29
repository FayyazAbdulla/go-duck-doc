---
title: Audit
description: Where audit rows are written, and why /history can be empty.
---

Two audit paths exist, and they do not meet.

## What actually gets rows

`AuditMiddleware` is global Gin middleware. It runs for every non-GET request. It is not gated by [`@Audited`](/gdl/annotations/). It does not publish to MQTT.

The write happens in a goroutine after the response is sent. It is not in the request's database transaction. If the process dies in that window, the audit row is lost.

The row lands in `audit_logs` (plural) on the **master** database. GORM pluralizes the name; there is no `TableName()` override. The key is the URL path, not the entity.

`GET {apiPrefix}/admin/audit` reads this trail (super-admin).

Recorded attributes:

| Attribute | Storage |
|-----------|---------|
| Actor | Keycloak id and email |
| Delta | JSON text in a `TEXT` column, not `jsonb` |
| Tenant | `tenant_db` string |

## What `@Audited` endpoints read

`/history` and `/timeline` on an `@Audited` entity query `audit_log` (singular) in the **tenant** silo. Nothing in the current generator inserts into that table, so a fresh app returns an empty history. The source calls this a known limitation, not an intentional split.

## Metering

A separate Redis quota middleware can reject a caller with HTTP 402:

```json
{
  "error": "SaaS Quota Exceeded for user",
  "limit": 1000,
  "current_use": 1001,
  "target": "user:abc123",
  "auto_reset": true
}
```

Under quota, the middleware adds no header and calls through. The audit page does not name the config keys for the numeric limit.
