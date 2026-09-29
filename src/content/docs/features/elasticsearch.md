---
title: Elasticsearch
description: Search indexing for @Searchable entities, and the URL shapes the HTML disagrees on.
---

Entities marked [`@Searchable`](/gdl/annotations/) are indexed when they are written. The Elasticsearch page says indexes are prefixed per tenant so one tenant's documents are not returned to another.

## Enable it

GDL:

```text
@Searchable @Audited
entity Car { ... }
```

The Elasticsearch page shows this block in `config.yaml` (not nested under `go-duck` in that snippet):

```yaml
elasticsearch:
  enabled: true
  auto_sync: true
```

The [wizard](/guides/wizard/) emits a different block, under `go-duck`, and only when the toggle is on:

```yaml
go-duck:
  elasticsearch:
    enabled: true
    addresses:
      - "http://localhost:9200"
```

`auto_sync` appears only on the Elasticsearch page. `addresses` appears only in the wizard script. Both are recorded; the HTML does not say they combine.

## Three URL shapes in the corpus

| Page | Route |
|------|--------|
| Elasticsearch | `GET /api/search/:entity?q=...` |
| REST | `GET {apiPrefix}/{entity}s/search?query=keyword` |
| Annotations | per-entity `GET /api/transactions/search` (example). States that global `/api/search/:entity` was removed |

Until those pages are reconciled, call the route your generated OpenAPI lists. Do not assume `q` and `query` are interchangeable; each page names one of them.

### Query behavior on the Elasticsearch page

| Query | Execution |
|-------|-----------|
| `q=...` | `multi_match` with `fuzziness: AUTO` on all fields |
| empty | `match_all` |

Example from that page: `GET /api/search/car?q=Toyta` is described as matching “Toyota”.

JPA-style filters on the main list routes are documented on [REST](/features/rest/), including the note that Lucene query strings and those filters can both be compiled into Elasticsearch `bool` queries.
