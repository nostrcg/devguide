---
sidebar_position: 1
title: Protocol Overview
description: A comprehensive look at the Nostr protocol
---

# Protocol Overview

Nostr is a minimalist protocol for decentralized social networking and data sharing. This page provides a comprehensive overview of how the protocol works.

## Design Principles

Nostr was designed with these principles in mind:

1. **Simplicity** - The protocol should be easy to understand and implement
2. **Resilience** - No single point of failure
3. **Censorship resistance** - Users maintain control of their data
4. **Verifiability** - All messages are cryptographically signed

## Protocol Layers

![Protocol Stack](/img/diagrams/protocol-stack.svg)

## Core Components

### Events

The fundamental data structure. Every piece of data in Nostr is an event.

```json
{
  "id": "<32-bytes lowercase hex sha256>",
  "pubkey": "<32-bytes lowercase hex secp256k1 public key>",
  "created_at": "<unix timestamp in seconds>",
  "kind": "<integer between 0 and 65535>",
  "tags": [
    ["<tag name>", "<value>", "<optional values>..."]
  ],
  "content": "<arbitrary string>",
  "sig": "<64-bytes lowercase hex schnorr signature>"
}
```

[Learn more about Events →](./events)

### Relays

Simple servers that accept, store, and forward events. They communicate with clients over WebSocket.

**Relay responsibilities:**
- Accept connections from clients
- Validate incoming events
- Store events (persistence policies vary)
- Send events matching client subscriptions

**Relay URL format:** `wss://relay.example.com` or `ws://localhost:7777`

[Learn more about Relay Communication →](./relay-communication)

### Clients

Applications that users interact with. Clients:
- Manage user keys
- Create and sign events
- Connect to relays
- Parse and display events

## Message Types

Communication between clients and relays uses JSON arrays over WebSocket.

### Client → Relay

| Type | Format | Description |
|------|--------|-------------|
| `EVENT` | `["EVENT", <event>]` | Publish a signed event |
| `REQ` | `["REQ", <sub-id>, <filter>...]` | Request events & subscribe |
| `CLOSE` | `["CLOSE", <sub-id>]` | Close a subscription |
| `AUTH` | `["AUTH", <event>]` | Authenticate (NIP-42) |
| `COUNT` | `["COUNT", <sub-id>, <filter>...]` | Count matching events (NIP-45) |

### Relay → Client

| Type | Format | Description |
|------|--------|-------------|
| `EVENT` | `["EVENT", <sub-id>, <event>]` | Event matching subscription |
| `OK` | `["OK", <event-id>, <bool>, <msg>]` | Acknowledgment of EVENT |
| `EOSE` | `["EOSE", <sub-id>]` | End of stored events |
| `CLOSED` | `["CLOSED", <sub-id>, <msg>]` | Subscription closed |
| `NOTICE` | `["NOTICE", <message>]` | Human-readable message |
| `AUTH` | `["AUTH", <challenge>]` | Authentication challenge |
| `COUNT` | `["COUNT", <sub-id>, <count>]` | Count response |

## Filters

Clients request events using filter objects:

```json
{
  "ids": ["<event-id>", "..."],
  "authors": ["<pubkey>", "..."],
  "kinds": [0, 1, 3],
  "#e": ["<event-id>", "..."],
  "#p": ["<pubkey>", "..."],
  "since": 1234567890,
  "until": 1234599999,
  "limit": 100
}
```

All conditions are AND. Multiple filters in a REQ are OR.

[Learn more about Filters →](./filters)

## Cryptography

### Keys

- **Algorithm:** secp256k1 (same as Bitcoin)
- **Private key:** 32 bytes, used for signing
- **Public key:** 32 bytes (x-coordinate only), serves as identity

### Event ID

The event ID is computed as:

```
id = sha256(serialize(event))
```

Where serialize produces:
```json
[0, pubkey, created_at, kind, tags, content]
```

### Signatures

- **Algorithm:** Schnorr signatures (BIP-340)
- **What's signed:** The event ID
- **Format:** 64 bytes hex

## NIPs (Nostr Implementation Possibilities)

NIPs are standards that extend the base protocol:

| Category | Examples |
|----------|----------|
| **Core** | NIP-01 (Basic protocol) |
| **Identity** | NIP-05 (DNS identifiers), NIP-19 (bech32 encoding) |
| **Content** | NIP-23 (Long-form), NIP-94 (File metadata) |
| **Interaction** | NIP-25 (Reactions), NIP-57 (Zaps) |
| **Security** | NIP-42 (Authentication), NIP-44 (Encryption) |

[Learn more about NIPs →](./nips)

## Event Flow Example

Here's a complete example of posting and receiving a note:

```
Alice (Client)                 Relay                    Bob (Client)
     │                           │                           │
     │  Connect (WebSocket)      │                           │
     │──────────────────────────►│                           │
     │                           │  ◄───────────────────────│
     │                           │      Connect              │
     │                           │                           │
     │  ["REQ", "feed", ...]     │                           │
     │──────────────────────────►│      Subscribe            │
     │                           │◄──────────────────────────│
     │                           │  ["REQ", "global", ...]   │
     │                           │                           │
     │  ["EVENT", {note}]        │                           │
     │──────────────────────────►│  Store & Forward          │
     │                           │                           │
     │  ◄─["OK", id, true]───────│                           │
     │                           │──["EVENT","global",{note}]│
     │                           │─────────────────────────►│
     │                           │                           │
```

## Protocol Guarantees

**What Nostr guarantees:**
- Messages are cryptographically signed and verifiable
- Anyone can run a relay
- Anyone can build a client
- Events cannot be forged

**What Nostr does NOT guarantee:**
- Message delivery (relays can go offline)
- Permanent storage (relays have policies)
- Privacy (events are typically public)
- Real-time delivery (network conditions vary)

## Next Steps

- [Events in Detail](./events)
- [Event Kinds](./kinds)
- [Working with Filters](./filters)
- [NIPs Reference](./nips)
