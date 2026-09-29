# Source: wizard.html

# GO-DUCK INDUSTRIAL

Browser Config Generator

System Ready

Commit Blueprint

ℹ️

Two different tools, same duck.
This page is a standalone, 100% client-side `config.yaml` builder — it runs entirely in your browser (form in, YAML out, downloaded as a file) and is not invoked by any `go-duck-cli` command.
If you're looking for the visual GDL schema/relationship diagram viewer, that's a separate, real CLI subcommand: `go-duck-cli gdl-planner [-p/--port ]` (default port `8000`), which launches a compiled Angular app in your browser for planning entities and relationships — a genuinely different tool from this static form.

## Core Orchestration

App Name Identifier

Blueprint Version

Primary HTTP Port

###

Internal Discovery / gRPC Addr

Industrial Zero-Trust Interface

## Hybrid-Store Perspective

Postgres Connector

####

Relational Repository (SQL)

Mongo Connector

####

Document Registry (NoSQL)

## Security Dashboard

#### OIDC Keycloak Integration

Auth Provider Host

Master Realm

App Client ID

App Client Secret

Service Client ID

Service Secret

Keycloak Admin ID

Admin Secret

#### Executive CORS Policy

Permitted Domains

Whitelist Methods

Security Headers

Confidential Boundary
Shields management silos

Rate Limit (RPS)

## Messaging Pipeline

#### MQTT Real-time Hub

Event Sink Prefix
go-duck/events

#### NATS High-Perf Streaming

Cluster Peering
Automatic

#### Distributed Redis Stack

Silo Lifecycle Management & Identity Caching

Power Status

Primary Node Host

TTL Persistence Window

## Universal Components

#### Industrial Storage Bridge

None
AWS S3
GCP Cloud
MinIO
Git Bridge

Environment Bucket

Target Region

Federated Bootstrapping Protocol Active:
Synchronizing SSH/Identity Secrets from Repository

#### Global Resilience Policies

Circuit Breaker
Industrial Mode

Outbox Worker
Broadcast-Sync

## Observability engine

#### Elasticsearch Sync

Spring-Style Federated Searching Engine

Internal Node URL

Industrial Index Prefix

#### Datadog APM Log Stream

Global Site Node
datadoghq.com

#### OpenTelemetry Tracing

Distributed Trace Ratio
1.0 (Audit Precision)
