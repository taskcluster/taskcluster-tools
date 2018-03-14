---
title: Pulse
---

Pulse is a message bus: it allows participants to publish messages and other
participants to subscribe to those messages. Taskcluster uses this bus to
communicate between microservices, notifying interested parties when specific
events have occurred. The system is based on AMQP in a publish-subscribe
configuration.

All Taskcluster AMQP exchanges are `topic` exchanges. Message bodies are always
JSON, and messages are "copied" to multiple routing keys using the AMQP `Cc`
header.

Usually, we prefix all exchanges from the same component with a common
`exchangePrefix` to ensure uniqueness. For routing keys we strive to always
have the same entries for messages on a given exchange and use `_` if no
value makes sense for the given routing key entry with a specific message.

Each service's reference documentation describes the events the service sends
(if any). Each kind of event is sent on a different exchange, and each event
has a routing key containing characteristics of the event on which consumers
might like to filter.

Pulse is a publicly accessible service, and the pulse message schemas are a
part of Taskcluster's published API, so they make a nicely decoupled
integration point for external services.
