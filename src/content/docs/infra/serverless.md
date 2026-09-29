---
title: Serverless
description: Lambda, Vercel, and Cloud Functions entrypoints, plus the cron webhook.
---

The same `router` package backs `main.go` and the serverless entrypoints, so middleware and routes match. Each invocation resolves the silo from the JWT. The gRPC server is not started. The outbox worker is not started for you.

| | Binary | Serverless |
|--|--------|------------|
| Process | Long-running | Per invocation |
| Kratos gRPC | On | Off |
| Outbox worker | Background poll | Not registered. `processOutbox()` is unexported |
| Cold start | n/a | `sync.Once` on Vercel and Cloud Functions |

## AWS Lambda

`lambda_main.go` uses `aws-lambda-go-api-proxy` to adapt API Gateway events onto Gin. Connections are opened from package `init()` and reused while AWS keeps the environment.

```bash
export GOOS=linux
export GOARCH=amd64
go build -tags lambda -o bootstrap lambda_main.go
zip function.zip bootstrap
```

## Vercel

`api/index.go` plus:

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/(.*)", "destination": "/api/index" }
  ]
}
```

The Go runtime calls an `http.HandlerFunc` per request, so the router is built on first use under `sync.Once`, not in `init()`.

```bash
vercel login
vercel deploy --prod
```

## Google Cloud Functions

`gcf_handler.go` exports `GoDuckEntry` (`//go:build gcf`). Same lazy `sync.Once` router as Vercel.

```bash
gcloud functions deploy GoDuckEntry \
  --runtime go124 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1
```

## Cron

There is no background goroutine in the serverless entrypoints. The CLI README’s container path uses an external trigger plus a Redis lock so five replicas do not all run the job:

```http
POST /api/system/cron
X-Cron-Token: <go-duck.security.cron-token>
```

The pod that receives it runs `SETNX go-duck:system-cron:lock:my_task` with a 55-second TTL. Redis is single-threaded, so one pod wins and runs `services/scheduler.go`. The others return 200 and stop. Valkey works because the lock is Redis protocol. An internal `robfig/cron/v3` scheduler is generated commented out, with the same lock.

A mismatch on `X-Cron-Token` is rejected. The website serverless page names EventBridge, Cloud Scheduler, and Vercel Cron as callers, and says draining `distributed_outbox` is not registered on this route. See [Saga](/features/saga/). Cold starts skip background outbox workers and cron loops.
