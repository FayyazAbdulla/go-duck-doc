---
title: WebSockets
description: The /ws action dispatcher, HMAC envelopes, and why query-token auth fails.
---

`ws://localhost:8080/ws` is a fixed action switch, not a REST-over-WebSocket proxy. There is no `Method` or `Path` field. Unknown actions return an “Unknown action” error.

Per entity the generated actions are:

| Action | Behavior |
|--------|----------|
| `GET_{ENTITY}S` | Reads via `db.Table(...)` |
| `CREATE_{ENTITY}` | Stub. The handler does not write (`_ = db`). The message is acknowledged and ignored |

```javascript
const ws = new WebSocket(`ws://localhost:8080/ws`);

ws.onopen = () => {
  ws.send(JSON.stringify({
    action: "GET_CARS",
    payload: "{}",
    signature: "2d7a221f7dbb2..." // HMAC-SHA256 hex of payload
  }));
};
```

## HMAC

| | |
|--|--|
| Algorithm | HMAC-SHA256 |
| Signed bytes | `payload` only |

The secret is not per client. Generated `ws/handler.go` contains the literal `go-duck-super-secret-key`. Every new app gets that same string until someone edits the file. Change it before production. See [Precautions](/reference/precautions/).

## Browser tokens

`/ws` uses `JWTMiddleware`, which only reads the `Authorization` header. A browser `WebSocket` cannot set that header. `ws://localhost:8080/ws?token=...` fails with `401 Authorization header required` before the upgrade. Use a client that can set handshake headers, or a proxy that copies a query token into `Authorization`.

Successful REST mutations are also published to MQTT and NATS when those brokers are enabled. That path is separate from `/ws`. See [Mosquitto](/ops/mosquitto/).
