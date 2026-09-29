---
title: gRPC
description: Kratos services, protoc scripts, ports, and gRPC-Web.
---

Every GDL entity gets a Protobuf service and a Kratos implementation. JWT interceptors sit in the Kratos middleware. Silo selection uses the same tenant manager as REST.

The generated schema sketch uses an HTTP annotation with a `/v1` path. That `/v1` is in the proto example only. REST prefixes do not include `v1`.

```protobuf
service EntityService {
  rpc Get (GetEntityRequest) returns (EntityReply) {
    option (google.api.http) = {
      get: "/v1/entity/{id}"
    };
  }
}
```

## Compile contracts

Run this after `create`, and again after `import-gdl` changes the protos, when you are not building with Docker:

```bash
chmod +x generate.sh
./generate.sh
```

Windows: `.\generate.bat`.

The scripts create `third_party/google/api`, copy `annotations.proto` and `http.proto`, and run `protoc` on `api/**/*.proto`.

Prerequisites: `protoc` on `PATH`, and:

```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

`docker build` / `docker-compose` compile protos in `devops/Dockerfile`, so you can skip the scripts for that path.

## Ports

| Listener | Config | Default |
|----------|--------|---------|
| Native gRPC | `go-duck.server.grpc.addr` | `:9000` |
| gRPC-Web | `go-duck.server.grpc.web_enabled`, `web_port` | off, port `9090` |

gRPC-Web uses `github.com/improbable-eng/grpc-web` around the Kratos server. No Envoy sidecar. When enabled, CORS allows every origin (`Access-Control-Allow-Origin: *`).

[Serverless](/infra/serverless/) builds do not run the gRPC server.

Anchor for new registrations: `// go-duck-needle-add-grpc-service` in `internal/server/grpc.go`. See [CLI](/guides/cli/).
