---
title: Saga and outbox
description: Transactional outbox for federated writes. NATS is a separate channel.
---

`@Federated` mutations are committed on the source silo together with rows in `distributed_outbox`. A worker copies those mutations to the other silos. NATS is not that transport.

## Workflow

As listed on the saga page:

1. Client sends `POST /cars` for a federated entity.
2. The controller opens a transaction on the master silo.
3. The local row is saved.
4. A `CREATE` task is saved to `distributed_outbox`, one row per target silo.
5. The transaction commits.
6. `OutboxWorker` polls every 10 seconds.
7. The worker opens a GORM connection to each target database and applies the mutation. Optional HTTP webhooks can run as well.
8. On success the task is marked `COMPLETED`.

## Table

| Field | Type | Notes |
|-------|------|--------|
| `event_type` | string | `CREATE`, `UPDATE`, `DELETE`, `BULK_…` |
| `payload` | JSONB | Delta or entity |
| `status` | string | `PENDING`, `COMPLETED`. `FAILED` exists in the schema and is never set |
| `retry_count` | int | Flat 10s interval, cap of 5, no backoff |

After five failures the row stays `PENDING` and is abandoned.

Every silo gets this table. Reads do not use it; they fan out only when [`?federated=true`](/features/federation/) is set.

## NATS

Subject pattern:

```text
events.<tenantDB>.{entity}.{action}
```

Example subscription: `events.acme_db.article.*`.

That channel is for live notification and cache invalidation. MQTT is the UI broker ([Mosquitto](/ops/mosquitto/)). Neither one replaces the outbox.

## Serverless

`processOutbox()` is unexported and is not registered on `POST /api/system/cron`. A serverless deploy does not drain the outbox unless you export that method or add your own handler. See [Serverless](/infra/serverless/).
