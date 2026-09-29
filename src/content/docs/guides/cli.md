---
title: CLI reference
description: go-duck commands and flags from the CLI README, usage guide, and website HTML.
---

Package: `go-duck-cli`. Binary: `go-duck`. Install: [Install](/getting-started/install/).

Two published defaults for `create` disagree. The CLI README is listed first. The usage guide (`CLI_GUIDE.md`) is noted where it differs. The website `cli.html` examples use a single `.gdl` file and do not mention `init`, `serve`, or `generate-angular-sdk`.

## Commands

| Command | Role |
|---------|------|
| `init` | Write `config/config.yaml` and folders in the current directory |
| `create` | Full scaffold from config + GDL |
| `import-gdl <path>` | Diff against `.go-duck/` and emit only the delta |
| `validate-gdl <path>` | Static analysis, no writes. Also runs before `create` and `import-gdl` |
| `generate-angular-sdk <path>` | Typed Angular client. See [Angular SDK](/guides/angular-sdk/) |
| `gdl-planner` | Visual schema builder. Default port **8000** |
| `serve` | GUI and docs preview on **http://localhost:2026** |
| `create-gateway` | Strait of Duck Gateway. Config root is `strait-of-duck:`, not `go-duck:` |

Shared flags on `create`, `import-gdl`, and `generate-angular-sdk` (contributor guide): `--preserve-root`, `--reset` / `--rebase`, `--smart`. `create-gateway` only takes `-c` and `-o`.

## `init`

```bash
go-duck init
```

Run once in an empty directory before the first `create`.

## `create`

```bash
go-duck create [options]
go-duck create -c my-app/config.yaml -o my-app -g my-app/gdl
```

| Flag | README default | Description |
|------|----------------|-------------|
| `-c, --config` | `../CONFIG/config.yaml` | Config file |
| `-o, --output` | `.` | Output directory |
| `-g, --gdl` | `../GDL` | Directory of `.gdl` files |
| `--preserve-root` | off | Skip `main.go`, `push.sh`, and `devops/` |

The usage guide’s default for `--output` is `../SAMPLE-GO-FUNCTION`, not `.`. Its example omits `-g`:

```bash
go-duck create -c ./CONFIG/config.yaml -o ./MyGeneratedApp
```

Reference configs in the CLI repo `CONFIG/` directory: `config-hybrid.yaml`, `config-mongo-only.yaml`, `config-psql-only.yaml`, `config-serverless.yaml`, plus `config.yaml`.

Serverless generation from the usage guide:

```bash
node GO-DUCK-CLI/index.js create -c CONFIG/config-serverless.yaml -g GDL -o MyServerlessApp
```

## `import-gdl`

```bash
go-duck import-gdl <file> [options]
go-duck import-gdl new-entities.gdl -o my-existing-app --preserve-root
go-duck import-gdl new-entities.gdl -o my-existing-app --preserve-root --smart
go-duck import-gdl new-entities.gdl -o my-existing-app --dry-run
```

| Flag | Description |
|------|-------------|
| `-o, --output` | App root. README default `.` |
| `--preserve-root` | Skip `main.go`, `push.sh`, `devops/`. Contributor guide also lists the config loader and telemetry |
| `--smart` | Reserved SQL keywords, boolean names (`is` / `has` / `can`), date names (`At` / `Date` / `Time`), before any write |
| `--reset` / `--rebase` | Ignore `// @go-duck-preserve` and overwrite |
| `--dry-run` | Full pipeline, no disk writes. Prints migration SQL. `DROP TABLE` / `DROP COLUMN` are flagged |

The preserve needle must be the **entire trimmed line**. A mention of the string inside a paragraph does not count (fixed 2026-08-15, after docs files froze themselves).

Do not delete `.go-duck/`. Snapshots are one JSON file per entity. Importing one GDL file merges the others from that folder. Config is copied to `<output>/.go-duck/config.yaml`, so a later import inside the project can find it without `-c`.

`@Delete` on an entity emits `DROP TABLE` and removes the model, controller, interceptor, snapshot, `api/v1/*.proto`, `*.pb.go`, and `internal/service/*.go`.

Field renames are compared after `toSnakeCase`, so `contactPhoneNumber` and `contact_phone_number` are the same column. Type changes emit `ALTER COLUMN ... TYPE ... USING`, not drop-and-readd.

## `validate-gdl`

```bash
go-duck validate-gdl <file> [--smart]
go-duck validate-gdl ./GDL/milling.gdl
```

Runs before every `create` and `import-gdl` and exits if there is an error, before any file is written. Checks include duplicate fields, unknown types, PascalCase entities, camelCase fields, and a warning when you declare a foreign-key field that a `relationship` block already owns. `--smart` adds reserved words and the `is`/`has`/`can` and `*At`/`*Date`/`*Time` naming rules. Financial `float`/`double` fields get a warning to use `BigDecimal`.

## `gdl-planner` and `serve`

```bash
go-duck gdl-planner -p 8000
go-duck serve
```

The website wizard (`wizard.html`) is still a separate static form. It is not `gdl-planner` and not `serve`.

## `create-gateway`

```bash
go-duck create-gateway -c CONFIG/strait-of-duck-config/config.yaml -o my-gateway
```

| Flag | Default |
|------|---------|
| `-c, --config` | `../CONFIG/strait-of-duck-config/config.yaml` |
| `-o, --output` | `.` |

Details: [Gateway](/features/gateway/).

## Needles

```go
// @go-duck-preserve
```

Anchors the website CLI page says not to delete:

- `// go-duck-needle-add-import` in `main.go`
- `// go-duck-needle-add-init-repository` in `main.go`
- `// go-duck-needle-add-grpc-service` in `internal/server/grpc.go`

Generated interceptors ship with the preserve needle on line 1. See [Generated app notes](/guides/generated-app/).

## Verify a generator change

From the contributor guide. There is no `npm test` suite.

```bash
node GO-DUCK-CLI/index.js validate-gdl GDL --smart
node GO-DUCK-CLI/index.js create -c CONFIG/config.yaml -g GDL -o /tmp/gd-check
cd /tmp/gd-check && go build ./... && go vet ./...
node GO-DUCK-CLI/index.js import-gdl GDL -o /tmp/gd-check
cd /tmp/gd-check && go build ./...
```
