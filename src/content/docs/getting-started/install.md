---
title: Install and first generate
description: Install go-duck-cli from npm, then init and create a service.
---

The CLI package is **`go-duck-cli`** (npm). The command you run after install is `go-duck`. The website HTML also writes `go-duck-cli` in a few places; the CLI README uses `go-duck` for every subcommand, including `gdl-planner` and `create-gateway`.

Requirements from the CLI README:

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| Go | 1.21+ |
| Docker | 20+ |
| Docker Compose | v2+ |
| `protoc` | latest, only if you compile gRPC locally |

The published README badge names CLI version **2.0.6**. License: ISC.

## Install

```bash
npm install -g go-duck-cli
go-duck --help
```

From a checkout of the CLI repo, the usage guide instead says:

```bash
cd GO-DUCK-CLI
npm install
npm link
```

You can also invoke the entry point without a global install:

```bash
node GO-DUCK-CLI/index.js create -c CONFIG/config.yaml -g GDL -o /tmp/gd-check
```

## 60-second start

From the CLI README:

```bash
mkdir my-app && cd my-app
go-duck init
go-duck create -c config/config.yaml -g gdl -o .
docker-compose up -d
go run main.go
```

`go-duck init` writes `config/config.yaml` and the folder layout. `create` reads that config and a **directory** of `.gdl` files (`-g gdl`). Gin listens on `:8080`, Kratos gRPC on `:9000`.

The website CLI page shows a single file on `-g` (`-g initial_schema.gdl`). The CLI README’s default for `-g` is the directory `../GDL`. Pass a directory unless you are following that older HTML example.

Design entities in the browser first if you want:

```bash
go-duck gdl-planner -p 8000
# http://localhost:8000
```

## Change the schema later

```bash
go-duck import-gdl new-entities.gdl -o . --dry-run
go-duck import-gdl new-entities.gdl -o . --preserve-root
go-duck validate-gdl new-entities.gdl --smart
```

`--dry-run` prints migration SQL, including `DROP TABLE` / `DROP COLUMN`, and writes nothing.

## Compile Protobuf

Needed for `go run` after `create` or `import-gdl`. Not needed when the image is built with `devops/Dockerfile` — protos are bundled in the project, and the scripts no longer download them.

```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
./generate.sh    # or .\generate.bat
```

`go build ./...` fails in `internal/service` until that step has run. The symbols come from `protoc`, not from a missing generator.

## Next

- [CLI reference](/guides/cli/)
- [Configuration](/guides/configuration/)
- [GDL](/gdl/getting-started/)
