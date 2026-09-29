# Source: realtime.html

# WebSockets & MQTT Event Streaming

Execute REST requests securely over full-duplex WebSocket connections or subscribe to async CRUD event streaming.

## 1. Per-Entity WS Action Dispatcher

GO-DUCK's WebSocket endpoint at `ws://localhost:8080/ws` is not a generic REST-over-WebSocket proxy. It's a fixed `switch msg.Action` dispatcher with a hardcoded action set per entity — `GET_{ENTITY}S` and `CREATE_{ENTITY}` — that calls `db.Table(...)` directly. There's no Gin routing involved on the WS path at all, and no arbitrary `Method`/`Path` to dispatch on.

Heads up — `CREATE_{ENTITY}` is a non-functional stub today. The generated handler for the create action is an explicit POC placeholder (`_ = db // Acknowledge for POC`) — it does not write to the database. A "create" sent over WS is silently acknowledged and no-ops. Reads (`GET_{ENTITY}S`) work as documented.

### Browser/JS Connection Spec

```
const ws = new WebSocket(`ws://localhost:8080/ws`);

ws.onopen = () => {
// The dispatcher recognizes a fixed action set per entity: GET_{ENTITY}S, CREATE_{ENTITY}.
// It is not an arbitrary REST method/path proxy — unknown actions fall through
// to a default "Unknown action" error branch.
ws.send(JSON.stringify({
action: "GET_CARS",
payload: "{}",
signature: "2d7a221f7dbb2..." // HMAC-SHA256 hex digest of payload
}));
};

ws.onmessage = (event) => console.log("Received via WS:", event.data);
```

####

Message Integrity (HMAC-SHA256)

Every WebSocket envelope must be signed, but the scheme is simpler — and more fragile — than it sounds.

Algorithm
HMAC-SHA256

Signed Data
payload only (no method/path — there isn't one)

The secret is not derived from any per-client API key — it's a hardcoded literal string (`"go-duck-super-secret-key"`) baked directly into the generated `ws/handler.go`. Every generated app ships with the same default secret unless a developer manually edits it before production use.

Known limitation — query-param token auth doesn't work. The generated `/ws` route is protected by `JWTMiddleware`, which only reads the `Authorization` header — it never inspects query params. Because browsers can't set custom headers during a WebSocket handshake, connecting with `ws://localhost:8080/ws?token=...` gets a `401 Authorization header required` before the connection ever upgrades. Token-based WS auth from a plain browser `WebSocket` object is not currently functional out of the box — you'll need a proxy/gateway that translates a query param into a header, or a WS client library that supports custom handshake headers, as a workaround.

## 2. Unified Messaging Hub (MQTT & NATS)

GO-DUCK features a Multi-Broker Messaging Hub. Every successful `CREATE / UPDATE / DELETE` on any model is simultaneously broadcast to both brokers if enabled.

#### MQTT (Real-time UI)

Topic Pattern: `{topicPrefix}/{tenantDB}/{entity}/{action}`

```
# Listen to Car Deletions in the tokyo tenant
mosquitto_sub -t "go-duck/events/tokyo_silo/Car/DELETE"
```

#### NATS (High-Perf CQRS)

Subject Pattern: `events.{tenantDB}.{entity}.{action}`

```
# Listen to any Car mutations across all silos
nats sub "events.*.Car.>"
```
