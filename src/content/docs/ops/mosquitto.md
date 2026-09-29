---
title: Mosquitto
description: MQTT topics, the publish bridge, and local broker defaults.
---

MQTT (Eclipse Mosquitto, Paho client in the generated `messaging` package) carries UI-facing events. NATS carries internal subjects. Audit rows are not MQTT messages; they are written by `AuditMiddleware` to Postgres. Read them with `GET {apiPrefix}/admin/audit`.

## Topics

After a successful create, update, or delete, if MQTT is enabled:

```text
{topicPrefix}/{tenantDB}/{entity}/{action}
```

```bash
mosquitto_sub -t "go-duck/events/tokyo_silo/Car/DELETE"
```

NATS, for comparison:

```text
events.{tenantDB}.{entity}.{action}
nats sub "events.*.Car.>"
```

## From Go

```go
import "go-duck-preview/messaging"

messaging.PublishEvent(cfg.GoDuck.Messaging.MQTT.TopicPrefix, "tenant", "CREATE", "User", payload, nil)

messaging.MQTTClient.Publish("events/users", 0, false, payloadBytes)
```

`PublishEvent` builds `{topicPrefix}/{tenantDB}/{entity}/{action}`. The raw client is what `POST /api/system/mqtt/publish` uses.

## HTTP bridge

Gated by `go-duck.messaging.mqtt.enabled`:

```http
POST /api/system/mqtt/publish
Content-Type: application/json

{
  "topic": "events/custom",
  "payload": { "event": "user_signed_up", "email": "dev@goduck.io" },
  "qos": 0,
  "retained": false
}
```

## Local broker

`docker-compose.yml` sets `allow_anonymous false`. The page names default credentials `dev_user` / `dev_password`, overridable with `go-duck.messaging.mqtt.username` and `password`.

```bash
mosquitto_sub -h localhost -p 1883 -u dev_user -P dev_password -t "go-duck/events/#" -v
```

Replace those defaults outside a local compose file. The Swagger MQTT console needs the broker's WebSocket listener (port 9001 in the page).

Broker URL in config is `messaging.mqtt.broker` (template and wizard both use `tcp://localhost:1883`).
