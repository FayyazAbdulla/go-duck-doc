# Source: redis.html

# Redis: Distributed Caching & Beyond

Optimize your microservice performance with blitz-fast distributed caching using Redis.

## Cache Architecture

GO-DUCK implements a "Cache-Aside" strategy. This ensures that your application remains resilient: if Redis is unreachable, a nil-check fallback in the cache layer skips straight to the database rather than erroring — plus a one-time connectivity probe at boot so a dead cache never blocks startup.

## Multi-Tenant & Microservice Isolation

Standard caching in a multi-tenant app is dangerous. GO-DUCK solves this by Role-Prefixing every key automatically, using the caller's resolved tenant role (not a raw tenant ID). Your cache keys look like `warehouse-service:public:User:123`, preventing data leaks across tenants.

To prevent key collisions when multiple independent microservices share the same Redis/Valkey instance, GO-DUCK supports transparent namespacing using the `key-prefix` property in `application.yml`:

```
go-duck:
cache:
redis:
enabled: true
host: "localhost:6379"
key-prefix: "warehouse-service" # Custom namespace prefix
```

If `key-prefix` is left empty, the application automatically falls back to using the microservice name (e.g., `pmb-warehouseModule`) as the prefix. The final cache key format is evaluated as: `:::` (for example: `warehouse-service:public:User:123`).

Automatic Invalidation: The controller layer invalidates the matching cache keys after each mutating REST/gRPC call, dispatched as a fire-and-forget background goroutine (`cache.ClearPattern(...)`) — not synchronous, so there's a small async window before a SCAN+DEL completes.

### Direct Cache Usage

```
import "go-duck-preview/cache"

// Store a value for 10 minutes
cache.Set("my-key", myStruct, 10*time.Minute)

// Retrieve and deserialize -- returns a bool (found/not found), not an error
var target MyStruct
found := cache.Get("my-key", &target)
```

## Valkey: The Open-Source Alternative

Every cache-aside repository, key-prefix rule, and invalidation path above works identically against Valkey — swap the config block and nothing else changes.

```
go-duck:
cache:
valkey:
enabled: true
host: "localhost:6379"
db: 0
ttl: "10m"
key-prefix: "warehouse-service"
```

Mutually exclusive: enabling both `cache.redis.enabled` and `cache.valkey.enabled` at generation time triggers a warning and Redis wins (Valkey is force-disabled). At runtime, if both are somehow left enabled, Valkey takes priority instead — don't rely on that edge case, pick one.

Live cache health — hit/miss counters, which engine is active, connection status, and reported version — is exposed on `/api/system/metrics` under the same `system` object as CPU/memory stats.

## External Resources

- Redis Official Documentation →

- Go-Redis Client Library →

- The Cache-Aside Pattern →
