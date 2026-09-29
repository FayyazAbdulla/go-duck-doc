# Source: cli.html

Generator Engine

# CLI Usage & Evolution

How to safely use the GO-DUCK Generator without destroying your manual Go code edits over time.

##

1. The Command Pipeline

The GO-DUCK-CLI operates on basically two commands. The initialization of your system, and the continuous evolution pipeline.

Terminal

Bash

```
# Command 1: Fresh Creation
# Scaffold an entirely new ecosystem. This generates ALL baseline infrastructure.
go-duck create -o ./MY_APP -c config.yaml -g initial_schema.gdl

# Command 2: Incremental Stateful Update
# Used whenever you modify your GDL (add an entity, drop a column, add a link)
go-duck import-gdl my_new_schema.gdl -o ./MY_APP

# Use --preserve-root to regenerate models & routes without overwriting custom root files
# (Protects main.go, devops/, push.sh, and top-level configs)
go-duck import-gdl my_new_schema.gdl -o ./MY_APP --preserve-root

# Add --smart flag to enable strict semantic naming validation and reserved keyword checking
go-duck import-gdl my_new_schema.gdl -o ./MY_APP --preserve-root --smart

# Force overwrite all @go-duck-preserve customized files back to default level zero state
go-duck import-gdl my_new_schema.gdl -o ./MY_APP --reset

# Preview an import with ZERO files written -- prints every migration's full SQL,
# flags anything destructive (DROP TABLE / DROP COLUMN) in red, no risk
go-duck import-gdl my_new_schema.gdl -o ./MY_APP --dry-run

# Command 3: Validator Only
# Static analysis to check for architectural flaws, typings, and smart interoperability
go-duck validate-gdl my_new_schema.gdl --smart

# Command 4: Fleet Gateway
# Scaffold a standalone service that discovers your GO-DUCK microservices in
# Kubernetes and reverse-proxies to them through one port (see Strait of Duck Gateway)
go-duck create-gateway -c CONFIG/strait-of-duck-config/config.yaml -o my-gateway
```

#### Tip: Preview destructive migrations before they exist

`--dry-run` runs the entire real generation pipeline — same diffing, same logic, nothing skipped — but every write is intercepted and logged instead of touching disk. There's no separate "preview mode" to drift out of sync with the real one; it's the exact same code path with the write step swapped out.

##

2. Schema Evolution & the `.go-duck/` State

"If I run the generator to import a new GDL, will it overwrite my database or delete existing entities?" No, thanks to stateful evolution.

The generator maintains a stateful snapshot of every entity it has ever generated inside the hidden `.go-duck/` directory at the root of your target project. When you run `import-gdl`, the CLI intelligently merges existing entities with newly parsed entities and executes targeted diff operations:

1. Snapshot Merging
Supports splitting your entities into multiple GDL files. Unspecified active models are loaded from the `.go-duck/` folder and merged with new entities, keeping active routers and endpoints in sync.

2. Column Alterations
Adding, dropping, or modifying fields inside entity blocks generates specific `ADD COLUMN` or `DROP COLUMN` SQL statements in a timestamped Goose migration file.

3. Complete Purging
Marking an entity with the `@Delete` annotation automatically triggers a database `DROP TABLE` SQL migration, purges all generated Go/Protobuf code files, and clears its snapshot.

#### Warning

Never manually delete `.go-duck/` unless you are intentionally wiping the entire database state and starting configuration completely from scratch.

##

3. Needles & Safe Code Preservation

"If I write custom endpoints or modify a generated service, will running the generator wipe them out?" No, as long as you use Needles!

### The Global Preservation Needle

If you need to significantly rewrite a generated file (like a controller or a model) and want to prevent the generator from ever overwriting it again, simply add this exact string anywhere in the file (usually at the very top):

`// @go-duck-preserve`
The CLI intercepts the file-writing stream, detects the needle, and safely skips it.

For targeted injections (like adding routes to `main.go`), the generator utilizes specific anchor comments. For example, inside `main.go`, you will see markers exactly like `// go-duck-needle-add-init-server`.

When the generator runs an incremental update, it doesn't arbitrarily overwrite `main.go` via a template. It opens the existing compiled `main.go` file, locates the Needle anchor point via REGEX, and safely inserts the new syntax directly below it.

Active Go Anchor Needle Locations (DO NOT DELETE)

- // go-duck-needle-add-import (main.go)

- // go-duck-needle-add-init-repository (main.go)

- // go-duck-needle-add-grpc-service (internal/server/grpc.go)

Previous Category

🔮 Advanced GDL

Next Category

⚙️ Master Configuration
