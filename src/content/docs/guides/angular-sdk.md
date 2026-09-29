---
title: Angular SDK
description: go-duck generate-angular-sdk writes a typed Angular client from GDL.
---

```bash
go-duck generate-angular-sdk <path> [-o <dir>]
go-duck generate-angular-sdk ./GDL -o ../my-angular-app/src/app/core/sdk
```

`-o` / `--output` defaults to `.`.

The CLI README says the output is TypeScript interfaces, enums, Reactive Form builders, and `HttpClient` services, plus a MessagePack interceptor.

Shared flags from the contributor guide also apply to this command: `--preserve-root`, `--reset` / `--rebase`, and `--smart`.

Hand-written Angular snippets for an already generated API are on [Integrations](/features/integrations/). Those use `page` and `size`. Pagination indexing changed in the changelog dated 2026-09-07: see [REST](/features/rest/). The same changelog says the Angular and Ionic SDK templates were updated to the 0-based `page` offset.
