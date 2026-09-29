# Source: serverless.html

#
Serverless Transformation

GO-DUCK isn't just for heavy-duty containers. With the Serverless Transformation Layer, your entire Federated Microservice can be deployed as an elastic, zero-cost-when-idle function on AWS, GCP, or Vercel.

### Stateless Silo Routing

Every serverless invocation is fully isolated and stateless. The system resolves the tenant's database silo dynamically from the JWT, ensuring 100% data privacy even in shared-compute environments.

### Shared Router Pattern

We use a unified internal `router` package. This means your security middlewares, search logic, and endpoint definitions are shared between `main.go` and all serverless entrypoints.

##
1
AWS Lambda

GO-DUCK generates a specialized `lambda_main.go` utilizing the `aws-lambda-go-api-proxy`. This adapter wraps the Gin router and translates API Gateway events into standard HTTP requests.

#### Build for AWS Lambda

```
# Set target OS and Architecture
export GOOS=linux
export GOARCH=amd64

# Build with lambda tag to include the handler
go build -tags lambda -o bootstrap lambda_main.go

# Zip and deploy to AWS
zip function.zip bootstrap
```

Cold Start Warning: Lambda initializations include DB connection pooling. This one-time setup runs inside Go's package-level `init()` function, and the pooled connections stay warm across subsequent invocations for as long as AWS keeps that execution environment alive and reuses it. (The GCF and Vercel adapters below work differently — they lazily build the router per-request and guard it with `sync.Once` instead.)

##
2
Vercel (Serverless Functions)

The system generates an `api/index.go` file compatible with Vercel's Go runtime. By using the generated `vercel.json`, all incoming traffic is routed to this single entrypoint.

#### Immediate Deployment

```
# Login to vercel
vercel login

# Deploy the project
vercel deploy --prod
```

The `vercel.json` configuration handles the necessary rewrites to ensure paths like `/api/users` are correctly served by the Go handler:

```
{
"version": 2,
"rewrites": [
{ "source": "/(.*)", "destination": "/api/index" }
]
}
```

Lazy Init: Vercel's Go runtime invokes your handler as a plain `http.HandlerFunc` per request, so the router can't be built inside `init()` the way Lambda's can. Instead it's constructed lazily on first request and guarded with `sync.Once`, so subsequent invocations on the same warm instance reuse it.

##
3
Google Cloud Functions (GCF)

For GCP, we use the Functions Framework for Go. The generated `gcf_handler.go` exports a standard HTTP trigger named `GoDuckEntry`.

#### Deploying to Cloud Functions

```
# Deploy using gcloud CLI
gcloud functions deploy GoDuckEntry \
--runtime go124 \
--trigger-http \
--allow-unauthenticated \
--region us-central1
```

Ensure the `//go:build gcf` tag is handled correctly by your deployment pipeline if you are building remotely.

Lazy Init: Same pattern as Vercel — the Functions Framework hands you a per-request `http.HandlerFunc`, so the router is built lazily on first invocation and protected with `sync.Once` to stay warm across subsequent calls on the same instance.

##
⏰
Scheduled Work: The Cron Webhook

Serverless functions can't run a persistent background goroutine, so if you need periodic work — outbox draining, cleanup jobs, whatever — the generated router exposes a generic cron entrypoint usable from any deployment mode, including all three above:

```
POST /api/system/cron
X-Cron-Token:
```

Point your platform's scheduler at this endpoint — EventBridge Scheduler for Lambda, Cloud Scheduler for GCF, or Vercel Cron — and it invokes whatever's registered in the cron-task registry. The `X-Cron-Token` header must match your configured `go-duck.security.cron-token`, or the request is rejected.

Heads up: as noted in the table below, outbox draining isn't registered against this endpoint out of the box — you'll need to export `OutboxWorker.processOutbox` and wire it in yourself, or write a bespoke handler.

### Configuration Comparison

Feature
Standard (Binary)
Serverless

Execution Mode
Persistent Process
On-Demand Invocations

gRPC Server (Kratos)
Enabled
Disabled (Async only)

Outbox Worker
Automatic Background
Not wired up out of the box — `processOutbox()` is unexported and isn't registered against the cron endpoint. Bring your own glue.

Cold Start Optimization
N/A
sync.Once initialization
