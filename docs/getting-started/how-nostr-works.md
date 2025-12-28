---
sidebar_position: 2
title: How Nostr Works
description: Understand the architecture and message flow in Nostr
---

# How Nostr Works

This page explains the fundamental architecture of Nostr and how clients, relays, and events work together.

## Architecture Overview

Nostr follows a simple client-relay model:

![Nostr Architecture](/img/diagrams/nostr-architecture.svg)

## The Three Components

### 1. Clients

Clients are user-facing applications. They:

- Generate or import user keypairs
- Create and sign events
- Connect to relays via WebSocket
- Publish events to relays
- Subscribe to events from relays
- Render content for users

Clients can be web apps, mobile apps, desktop apps, CLI tools, or anything that speaks the Nostr protocol.

### 2. Relays

Relays are WebSocket servers that:

- Accept connections from clients
- Receive and validate events
- Store events (persistence varies by relay)
- Respond to subscription requests
- Forward matching events to subscribers

Relays are "dumb"—they don't need to trust each other or coordinate. Each operates independently.

### 3. Events

Events are the atomic unit of data in Nostr. Every piece of information—posts, follows, reactions, profiles—is an event.

```json
{
  "id": "event identifier (sha256 hash)",
  "pubkey": "author's public key",
  "created_at": 1234567890,
  "kind": 1,
  "tags": [
    ["e", "referenced-event-id"],
    ["p", "referenced-pubkey"]
  ],
  "content": "The message content",
  "sig": "signature of the event"
}
```

## Message Flow

### Publishing an Event

```
Client                              Relay
  │                                   │
  │  1. Create event JSON             │
  │  2. Sign with private key         │
  │                                   │
  │  ──["EVENT", {...}]──────────────►│
  │                                   │
  │                        3. Verify  │
  │                        4. Store   │
  │                                   │
  │  ◄──["OK", id, true, ""]──────────│
  │                                   │
```

### Subscribing to Events

```
Client                              Relay
  │                                   │
  │  ──["REQ", "sub-id", {...}]──────►│
  │                                   │
  │  ◄──["EVENT", "sub-id", {...}]────│  (existing events)
  │  ◄──["EVENT", "sub-id", {...}]────│
  │  ◄──["EOSE", "sub-id"]────────────│  (end of stored events)
  │                                   │
  │  ◄──["EVENT", "sub-id", {...}]────│  (new events as they arrive)
  │                                   │
```

## WebSocket Messages

Nostr uses JSON arrays over WebSocket. The first element identifies the message type.

### Client to Relay

| Message | Format | Description |
|---------|--------|-------------|
| EVENT | `["EVENT", <event>]` | Publish an event |
| REQ | `["REQ", <sub-id>, <filter>, ...]` | Subscribe to events |
| CLOSE | `["CLOSE", <sub-id>]` | Close a subscription |

### Relay to Client

| Message | Format | Description |
|---------|--------|-------------|
| EVENT | `["EVENT", <sub-id>, <event>]` | An event matching subscription |
| OK | `["OK", <event-id>, <success>, <msg>]` | Result of EVENT |
| EOSE | `["EOSE", <sub-id>]` | End of stored events |
| NOTICE | `["NOTICE", <message>]` | Human-readable message |

## Filters

Clients request events using filters:

```json
{
  "ids": ["specific-event-ids"],
  "authors": ["pubkeys-to-follow"],
  "kinds": [1, 6, 7],
  "#e": ["event-ids-in-tags"],
  "#p": ["pubkeys-in-tags"],
  "since": 1234567890,
  "until": 1234567899,
  "limit": 100
}
```

## Multiple Relays

Users typically connect to multiple relays for:

- **Redundancy**: If one relay goes down, others still work
- **Reach**: Different relays may have different users
- **Privacy**: Spread your metadata across relays

```javascript
const relays = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
];

// Connect to all and publish to all
for (const url of relays) {
  const ws = new WebSocket(url);
  // ...
}
```

## Event Verification

Events are self-authenticating through cryptographic signatures:

1. Serialize the event content
2. SHA256 hash produces the event ID
3. Sign the ID with the private key
4. Anyone can verify using the public key

This means relays don't need to trust clients, and clients don't need to trust relays.

## Next Steps

Now that you understand the architecture:

- Learn about [Keys and Signing](./keys-and-signing)
- Explore [Event Types](../protocol/events)
- [Build Your First App](./first-app)
