# Source: grpc.html

# Scaffolding gRPC
The Kratos Connection.

Experience blazing-fast, binary-efficient communication between your services. GO-DUCK automatically generates production-ready gRPC schemas and Kratos service implementations for every GDL entity.

Protobuf First

Auto-generated `.proto` files with deep field validation and secure gRPC-Gateway metadata definitions.

Kratos secured

OIDC/JWT authentication interceptors baked directly into the Kratos middleware for every generated gRPC service.

## The Protobuf Lifecycle

```
// Generated Service Schema for Entity
service EntityService {
rpc Get (GetEntityRequest) returns (EntityReply) {
option (google.api.http) = {
get: "/v1/entity/{id}"
};
}
}

```

## Compiling Protobuf & gRPC Contracts

GO-DUCK scaffolds script files in the root of the generated project to manage the compilation of `.proto` contracts natively on all operating systems.

#### ⚡ Execution Requirement Guide

- Local Host Execution (Required): You must run the compilation script whenever you first create the microservice, or whenever you modify the GDL schemas and re-run `import-gdl` to generate updated gRPC structures.

- Docker Deployment (Automated): If you compile and run the application via Docker (using `docker build` or `docker-compose`), the multi-stage `devops/Dockerfile` compiles the protobuf definitions internally, so you do not need to run the scripts locally.

###
🛠️ Scaffolded Compiler Scripts

The generator scaffolds both `generate.sh` and `generate.bat` files in the project root. At compilation time, they perform the following tasks:

- Create the `third_party/google/api` dependencies directory.

- Synchronize necessary Google API annotation contracts (`annotations.proto` and `http.proto`) using native command line transfers.

- Recursively find and compile all `.proto` files inside `api/` into Go source files using the `protoc` compiler.

###
🚀 How to Compile

To compile the contract schemas into Go source structures, execute the following commands in the root of your generated application:

Windows (CMD / PowerShell)

```
.\generate.bat
```

Unix / Linux / macOS

```
chmod +x generate.sh
./generate.sh
```

#### 📌 Compilation Prerequisites

Ensure you have the `protoc` binary installed and added to your system's `PATH`.

Also ensure the necessary Go compiler plugins are installed on your environment:

```
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

## Ports & gRPC-Web

#### Native gRPC — `:9000`

The Kratos gRPC server binds to `go-duck.server.grpc.addr`, which defaults to `:9000`.

`go-duck.server.grpc.addr`

#### gRPC-Web Proxy — `:9090` (opt-in)

Disabled by default (`web_enabled: false`). Flip it on to expose a browser-reachable proxy on `web_port` (default `9090`).

`go-duck.server.grpc.web_enabled / web_port`

#### Real, Envoy-less gRPC-Web

When enabled, the proxy is implemented for real using `github.com/improbable-eng/grpc-web`, wrapping the Kratos server directly — no Envoy sidecar required. CORS is explicitly opened to all origins (`Access-Control-Allow-Origin: *`), which means this isn't just for internal service-mesh traffic — it's designed so a browser-based frontend can talk gRPC directly to your service.

## Federated gRPC Resolution

Our gRPC implementation uses its own internal/repository and internal/service layer, built around the same tenant-resolution mechanism (TenantManager) as REST — ensuring that every RPC call is routed to the correct database silo based on the caller's JWT role, exactly like the REST API.

100% Binary
Maximum Throughput
