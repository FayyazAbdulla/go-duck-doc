---
title: Redis
description: Cache-aside keys, prefixes, Valkey, and invalidation.
---

Cache-aside: a miss or a dead Redis skips the cache and reads the database. A connectivity probe at startup keeps a down cache from blocking boot.

Keys are prefixed with the caller's tenant **role**, not a raw tenant id, so two tenants do not share entries. Example from the page:

```text
warehouse-service:public:User:123
```

The format is described as prefix, role, entity, id. If `key-prefix` is empty, the microservice name is used (the page's example is `pmb-warehouseModule`).

```yaml
go-duck:
  cache:
    redis:
      enabled: true
      host: "localhost:6379"
      key-prefix: "warehouse-service"
```

The wizard emits `cache.redis.enabled`, `host`, and `ttl` (form default `10m`) and does not emit `key-prefix`.

After mutating REST or gRPC calls, the controller clears keys with `cache.ClearPattern(...)` on a background goroutine. There is a short window before SCAN and DEL finish.

```go
import "go-duck-preview/cache"

cache.Set("my-key", myStruct, 10*time.Minute)

var target MyStruct
found := cache.Get("my-key", &target) // bool, not an error
```

## Valkey

Same behavior, different block:

```yaml
go-duck:
  cache:
    valkey:
      enabled: true
      host: "localhost:6379"
      db: 0
      ttl: "10m"
      key-prefix: "warehouse-service"
```

At generation time, enabling both prints a warning and Redis wins (Valkey is forced off). If both are still enabled at runtime, Valkey is preferred. Pick one.

Hit and miss counters, engine name, connection status, and version are on `GET /api/system/metrics` inside `system` (`cache_hits`, `cache_misses`, `cache_type`, `redis_status`, `redis_version`, `redis_connected`).

The rate limiter also uses Redis when it is reachable. That path is separate from this cache. See [Security](/infra/security/).
