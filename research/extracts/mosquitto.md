# Source: mosquitto.html

# Mosquitto & Event Streaming

Architect robust, event-driven microservices using Eclipse Mosquitto for high-performance MQTT messaging.

## Why MQTT?

MQTT is a lightweight, publish-subscribe network protocol that transports messages between devices. In the GO-DUCK ecosystem, we use Eclipse Mosquitto as our primary message broker for ultra-low latency event streaming and internal service notifications.

## The Messaging Package

GO-DUCK generates a clean `messaging` package that abstracts the MQTT client (Eclipse Paho). It handles reconnect strategies, certificate-based TLS (optional), and asynchronous publishing.

Audit logs live in Postgres, not MQTT. The global `AuditMiddleware` writes every non-`GET` request to a database table unconditionally — it isn't gated by `@Audited` at all, and nothing publishes audit events over MQTT. Query the trail via `GET {apiPrefix}/admin/audit`. If real-time audit-over-MQTT is something you need, it isn't implemented today.

### Publishing an Event

The generated `messaging` package exposes two ways to publish, depending on how structured you need the event to be.

```
import "go-duck-preview/messaging"

// Structured, per-entity event — this is what GO-DUCK itself calls after every mutation.
// It builds the topic and envelope for you: {topicPrefix}/{tenantDB}/{entity}/{action}
messaging.PublishEvent(cfg.GoDuck.Messaging.MQTT.TopicPrefix, "tenant", "CREATE", "User", payload, nil)

// OR: raw/arbitrary topic publish via the underlying Paho client —
// use this when you want full control over the topic string, same call the
// /api/system/mqtt/publish bridge handler uses internally.
messaging.MQTTClient.Publish("events/users", 0, false, payloadBytes)
```

## Local Development

Your `docker-compose.yml` includes a pre-configured Mosquitto image. You can use any MQTT client (like MQTT.fx or mosquitto_pub/sub) to listen to your service events. The broker is configured with `allow_anonymous false`, so anonymous connections are rejected — pass credentials (default `dev_user` / `dev_password`, configurable via `go-duck.messaging.mqtt.username`/`password`).

```
# Subscribe to real entity mutation events locally
mosquitto_sub -h localhost -p 1883 -u dev_user -P dev_password -t "go-duck/events/#" -v
```

## Server-Side Publish Bridge

Beyond publishing from Go application code, GO-DUCK also generates a REST bridge for automation and external systems that want to push MQTT messages without a Paho client of their own — gated by `go-duck.messaging.mqtt.enabled`.

```
POST /api/system/mqtt/publish
Content-Type: application/json

{
"topic": "events/custom",
"payload": { "event": "user_signed_up", "email": "dev@goduck.io" },
"qos": 0,
"retained": false
}
```

Under the hood it calls the same raw `messaging.MQTTClient.Publish(topic, qos, retained, payloadBytes)` shown above — this is the "server-side/automation" complement to the interactive browser console described below.

## Interactive Swagger Console

GO-DUCK's automatically generated Swagger UI features a built-in Interactive MQTT Topics Dictionary. By connecting via WebSockets, it allows authenticated users to dynamically SUBSCRIBE to event streams or PUBLISH payloads directly from the documentation interface!

Note: Ensure your Mosquitto broker is configured to accept WebSocket connections (default port 9001) for this feature to work.

## External Resources

- Mosquitto Official Documentation →

- Getting Started with MQTT →

- Eclipse Paho Go Client →
