# Source: configuration.html

# Master Configuration

The Fullest config.yaml Technical Reference

The `config.yaml` file is the "Central Nervous System" of your GO-DUCK microservice. It controls everything from high-performance server tuning to distributed resilience and multi-cloud object storage.

### The "Fullest" Template

YAML 1.2

`go-duck:
name: "go-duck-master-app"
version: "1.0.0"
# Stamped as the goduck.io/environment K8s label -- lets a
# Strait of Duck Gateway scope discovery to one tier. Default "prod".
environment-tag: "prod"

# --- Network & Server ---
server:
port: 8080
read-timeout: "30s"
write-timeout: "30s"
grpc:
addr: ":9000"
network: "tcp"
cors:
allow-origins: ["*"]
allow-methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

# --- Persistence (Hybrid Store) ---
datasource:
host: "localhost"
port: 5432
username: "postgres"
password: "password"
database: "go_duck_db"
max-open-conns: 25
mongodb:
enabled: true
uri: "mongodb://localhost:27017"
database: "go_duck_mongo"

# --- Messaging Hub ---
messaging:
mqtt:
enabled: true
broker: "tcp://localhost:1883"
nats:
enabled: true
url: "nats://localhost:4222"

# --- Object Storage ---
storage:
s3: { enabled: false, bucket: "bucket-name", region: "us-east-1" }
gcs: { enabled: false, bucket: "bucket-name", credentials-file: "keys.json" }
minio: { enabled: true, bucket: "dev", endpoint: "localhost:9000" }

# --- Telemetry & Metrics ---
telemetry:
otel:
enabled: true
endpoint: "localhost:4317"
metrics:
prometheus-enabled: true
stream-enabled: true
stream-interval: "1s"

# --- DuckGuard ACL (Federated Access Matrix) ---
security:
access-policy:
cache-ttl: "30s"

## Technical Guideline Reference

###

1. Project Identity (go-duck)

Parameter
Purpose

name
The root Go module name. Used for all internal imports and project scaffolding.

version
Semantic versioning injected into Swagger docs and internal build manifests.

###

2. Hybrid Persistence (datasource)

Parameter
Purpose

host/port/database
PostgreSQL connection details for the Relational Silo and Multi-Tenant Registry.

max-open-conns
GORM connection pool limit. Critical for preventing port exhaustion in federated environments.

mongodb.enabled
Toggles the NoSQL Document engine. If true, the app supports @isDocument` and recursive GDL structures.

###

3. Unified Messaging Hub (messaging)

Parameter
Purpose

mqtt.broker
Real-time notification hub. Broadcasts schema mutations directly to the frontend for UI reactivity.

nats.url
High-performance internal streaming. Powering the CQRS logic and cross-microservice events.

###

4. Universal Storage Bridge (storage)

GO-DUCK provides a unified Go Interface for 7 different providers. Switch providers by simply changing the 'enabled' flag.

Provider
Key Configuration

AWS S3 / R2
bucket, region, access-key, secret-key

Google GCS
credentials-file (JSON service account path)

SFTP / SSH
host, port, username, key-file

GitHub Bootstrap
owner, repo, token, files (Automated infrastructure discovery)

###

5. Telemetry & Metrics (telemetry)

Integrated observability stack powering OpenTelemetry traces, Prometheus metrics, and Server-Sent Events (SSE) streaming dashboards.

Parameter
Purpose

otel.enabled
Enables OpenTelemetry context propagation across Gin routers and GORM database drivers.

metrics.prometheus-enabled
Exposes a `/metrics` endpoint for Kubernetes Horizontal Pod Autoscaling (HPA) and Prometheus scraping.

metrics.stream-enabled
Exposes a `/api/system/stream` Server-Sent Events endpoint streaming CPU, Memory, and Load percentages.

metrics.stream-interval
The refresh rate of the SSE stream (e.g., "1s", "500ms").

###

6. Access Control & Environment Tags (security, environment-tag)

DuckGuard ACL's Federated Access Matrix and this app's discovery tier for a Strait of Duck Gateway.

Parameter
Purpose

environment-tag
Top-level (not under `security:`). Stamped as the `goduck.io/environment` label on this app's Deployment/Service by the generator. Default `"prod"` if omitted.

security.access-policy.cache-ttl
How long DuckGuard ACL caches the `access_policies` rule set in each pod's memory before re-reading it from the database. Default 30s — a write made through `/management/access-policy` is visible immediately on the pod that served it, within one TTL everywhere else.

#### Distributed Resilience

- Circuit Breaker: Prevents cascading failures when DB/MQ or Search is down.

- Rate Limit: Distributed Redis-backed throttler (RPS/Burst) targeting by Keycloak Identity.

#### Industrial Search

- Elasticsearch: Full-text engine with Spring-style query string mapping.

- Auto Sync: Real-time indexing triggered by Repository mutators.

Previous Category

💻 CLI Reference

Next Category

📡 REST & Search API
