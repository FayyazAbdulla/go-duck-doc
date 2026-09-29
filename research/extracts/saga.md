# Source: saga.html

# Distributed Saga & Outbox

Maintain 100% data consistency across federated database silos, even during network failures, using the Transactional Outbox pattern.

###
01
Atomic Persistence

When a mutation occurs (Create/Update/Delete), the primary silo transaction atomatically persists both the entity and a "Pending Task" in the `distributed_outbox` table.

####

NATS Streaming (CQRS)

Subject Pattern: events.<tenantDB>.{entity}.{action}

High-performance internal messaging bridge for real-time notification and cache invalidation. Supports wildcard subscriptions (e.g., `events.acme_db.article.*`) for ultra-fast, decoupled service-to-service orchestration.

Independent of the Saga guarantee described below — NATS is a separate live pub/sub channel, not how silo-to-silo consistency is actually achieved.

### NATS Performance & CQRS

NATS acts as the nervous system for your microservice's real-time layer — separate from the Saga/Outbox consistency guarantee covered below. While MQTT is optimized for UI/WebSockets, NATS provides the dot-separated power needed for enterprise message routing.

Subject Strategy
Dot-separated subjects for hierarchical routing and filtering.

CQRS Evolution
Easily separate Reads and Writes by listening to NATS events for cache invalidation.

## How it Works

```
# The Saga Workflow
1. Client sends POST /cars (Federated Entity)
2. Controller opens transaction on Master Silo
3. Local Car record is saved
4. "CREATE" task is saved to `distributed_outbox` (one row per target silo)
5. Transaction COMMIT
6. OutboxWorker polls the table every 10s and picks up the task
7. OutboxWorker connects directly to each target silo's DB (GORM) and writes the mutation — plus optional HTTP webhooks
8. On Success, task is marked "COMPLETED"

```

## Outbox Schema

Every silo in your infrastructure includes this safety net automatically:

Field
Type
Description

event_typeStringCREATE, UPDATE, DELETE, BULK_...

payloadJSONBThe delta or entity data

statusStringPENDING, COMPLETED (FAILED is defined in the schema but never set by the current worker — after 5 failed retries the row is silently abandoned in PENDING state)

retry_countIntFlat 10s poll interval; capped at 5 attempts (no backoff)
