# Source: storage.html

# The Universal Storage Bridge

Say goodbye to vendor lock-in. GO-DUCK provides an elite, cloud-agnostic abstraction that bridges 8 global storage providers under a single, unified developer experience.

☁️

#### Cloud Native

AWS S3, Google Cloud Storage, and Cloudflare R2.

🏛️

#### On-Premises

High-performance MinIO and Generic S3-compatible clusters.

🛡️

#### Legacy & Git

High-security SFTP (SSH) and Private GitHub persistence.

🗂️

#### Azure DevOps (Git)

Private Azure DevOps Git repository persistence, analogous to the GitHub provider. Not Azure Blob Storage.

Featured Elite Service

## Remote Secret Bootstrapper
The Death of Secret Sprawl.

In modern, ephemeral Kubernetes clusters, host-path storage is a liability and "baking" keys into Docker images is a security nightmare. The **Remote Secret Bootstrapper** is your Zero-Trust solution for identity management — pulling from GitHub (the default), Azure DevOps, or Bitbucket, whichever your org already trusts.

#### Why Architects Love It:

-
✓
Zero-Bake Images: Your Docker images remain clean and generic. No customer-specific keys are ever stored in the container layers.

-
✓
Ephemeral Isolation: Credentials are pulled into volatile RAM/Config storage on startup. When the pod dies, the keys vanish.

-
✓
Centralized Identity: Rotate keys for 1,000 pods instantly by updating a single private repository — on GitHub, Azure DevOps, or Bitbucket.

```
# application.yml
go-duck:
storage:
bootstrap:
enabled: true
provider: "github" # github (default) | azure | bitbucket
owner: "MyOrg"
repo: "InfraSecrets"
branch: "prod"
token: "${GH_BOOTSTRAP_TOKEN}"
files:
- "gcs-service-account.json"
- "id_rsa"

```

Automatically supplied to GCS & SFTP providers upon successful handshake.

Auth differs per backend:

github → `Authorization: token `

azure → HTTP Basic, empty username

bitbucket → Basic (if username set) or Bearer

## The 3-Tier Lifecycle

01

The Fetch

Worker connects to the configured backend API (GitHub, Azure DevOps, or Bitbucket) at T-0 (App Startup).

02

The Pulse

Secrets are hydrated locally in the ephemeral `config/` directory.

03

The Link

Storage drivers discover the keys and initialize with zero friction.

## One Interface. Infinite Clouds.

```
// storage.InitStorage(cfg) runs once at app startup, populating storage.Providers
provider, ok := storage.Providers["gcs"] // or c.Query("provider") in an HTTP handler
if ok {
url, err := provider.Upload(ctx, "invoices/March.pdf", data)
}

```

## Hot-Swap via REST

Beyond the Go interface, every generated service also exposes the storage bridge over HTTP — this is the concrete "pick a provider per request" mechanism behind the pitch above:

POST
`/api/storage/upload?provider=`
Multipart form upload — send the file in the `file` field, with an optional `folder` field to namespace the key.

GET
`/api/storage/download/:key?provider=`
Streams the object back from whichever provider you name.

Omit `provider` and it falls back to the first enabled provider in `storage.Providers` — fine for single-provider setups, but worth being explicit about once you're juggling more than one.
