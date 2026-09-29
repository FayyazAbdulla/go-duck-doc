---
title: Storage
description: Storage providers, the HTTP bridge, and secret bootstrap.
---

One Go interface covers the providers named in the HTML:

- AWS S3, Cloudflare R2, and other S3-compatible endpoints
- Google Cloud Storage
- MinIO
- SFTP
- GitHub
- Azure DevOps **Git** (not Azure Blob)
- Bitbucket, as a bootstrap source

`storage.InitStorage` fills `storage.Providers` at startup.

```go
provider, ok := storage.Providers["gcs"]
if ok {
    url, err := provider.Upload(ctx, "invoices/March.pdf", data)
}
```

## HTTP

```text
POST /api/storage/upload?provider=
GET  /api/storage/download/:key?provider=
```

Upload is multipart. The file field is `file`. An optional `folder` field prefixes the key. If `provider` is omitted, the first enabled entry in `storage.Providers` is used.

Provider fields from the configuration page:

| Provider | Fields |
|----------|--------|
| S3 / R2 | `bucket`, `region`, `access-key`, `secret-key` |
| GCS | `bucket`, `credentials-file` |
| MinIO | `bucket`, `endpoint` (template also sets `enabled`) |
| SFTP | `host`, `port`, `username`, `key-file` |
| GitHub | `owner`, `repo`, `token`, `files` |

## Bootstrap

Pods can pull key files at startup into an ephemeral `config/` directory instead of baking them into the image.

```yaml
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

Auth by provider:

| `provider` | HTTP auth |
|------------|-----------|
| `github` | `Authorization: token …` |
| `azure` | Basic, empty username |
| `bitbucket` | Basic if a username is set, otherwise Bearer |

The wizard's GitHub path sets `storage.github.owner` / `repo` and `storage.bootstrap.enabled: true` with `files: ["id_rsa"]`. It does not emit `provider`, `branch`, or `token`.
