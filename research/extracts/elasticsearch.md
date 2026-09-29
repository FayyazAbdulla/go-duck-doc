# Source: elasticsearch.html

# Elasticsearch: The Search Powerhouse

Unlock high-performance, fuzzy full-text search across your entire federated ecosystem. GO-DUCK bridges your relational silos with an elite Elasticsearch sync engine.

### Spring-Style Queries

Query your data using a simple, powerful query string syntax inspired by Spring Data Elasticsearch.

### Transactional Sync

Entities marked with `@Searchable` are automatically indexed the moment they hit the database.

### Multi-Tenant Isolation

Search indices are automatically prefixed and partitioned to ensure zero data leakage between tenants.

## Search Controller Reference

GET
`/api/search/:entity?q=...`

Example: Fuzzy Search

GET /api/search/car?q=Toyta

// Matches "Toyota" via automatic ES Fuzziness

Query Pattern
Elasticsearch Execution

q=...
multi_match with fuzziness: AUTO on all fields

(empty)
match_all (standard listing)

## Activating the Search Engine

#### 1. Annotate your GDL

Simply add `@Searchable` to any entity block.

@Searchable @Audited

entity Car { ... }

#### 2. Enable in Config

Toggle the search engine globally in your `config.yaml`.

elasticsearch:

enabled: true

auto_sync: true

#### Why Elasticsearch?

-

Offload heavy search queries from your transactional database.

-

Enterprise-grade relevancy scoring and multi-language support.

-

Handle millions of records with sub-millisecond response times.
