# Source: audit.html

# Forensic Accountability
& Metering Engine.

Achieve sub-millisecond accountability. GO-DUCK generates a forensic-grade auditing and hierarchical metering engine that tracks every action across your entire distributed ecosystem.

###
🔍 Row-Level Forensics

Any GDL entity marked `@Audited` is meant to track "Who did What and When" at the row level. In the current implementation, the entity-level `/history`/`/timeline` read path and the actual write path are not yet joined up — see the "Where Audit Rows Actually Land" note below for the full picture.

Keycloak Role Tracking
Tenant Partitioning

###
📊 Hierarchical SaaS Metering

Track and limit API bandwidth in real-time via Redis. Automatically enforce dynamic quotas targeted at Individual Users or Realm Roles.

HTTP/1.1 402 Payment Required
{
"error": "SaaS Quota Exceeded for user",
"limit": 1000,
"current_use": 1001,
"target": "user:abc123",
"auto_reset": true
}

MeteringMiddleware never sets a response header on success or failure — it silently calls through when you're under quota, and returns this JSON body with a 402 status when you're over it.

## The Forensic Loop
Immutable Evidence.

01

Interception

Middleware extracts Keycloak Role, UserID, and TenantID from the incoming request envelope.

02

Verification

The SaaS Metering engine checks Redis for remaining bandwidth. Rejects if Daily/Monthly limits are exceeded.

03

Persistence

There's no GORM lifecycle hook involved. A global Gin middleware, `AuditMiddleware`, fires the write in a detached background goroutine after the response has already been sent — a fast, fire-and-forget design that keeps TTFB low but is explicitly not atomic with the mutation's own transaction. A crash between the response and the goroutine completing silently drops the audit row.

## Audit Schema Excellence

Event Attribute
Security Value

Actor IdentityCaptures the Subject (KeycloakID) and modifying user's email of the initiator.

Historical DeltaA JSON-serialized snapshot of the object before and after the mutation, stored as a `TEXT` column — not a native `jsonb` column.

Tenant ReferenceA `tenant_db` string field records which tenant the mutation belonged to, for filtering after the fact.

### Where Audit Rows Actually Land (Known Limitation)

The entity-level `/history` and `/timeline` read endpoints for `@Audited` entities query a per-tenant-silo `audit_log` table (singular). The global `AuditMiddleware` described above, however, writes to a different table — `audit_logs` (plural, GORM's default pluralization, no `TableName()` override) — on the master database, keyed by URL path rather than by entity.

Currently, the entity-level `/history`/`/timeline` endpoints and the global audit middleware write to different tables in different databases — this is a known limitation, not by design. Nothing in the codebase currently inserts rows into the per-silo `audit_log` table, so in a fresh app those endpoints return empty results. The global `AuditMiddleware` (master DB, `audit_logs` table) is the audit source of truth today.
