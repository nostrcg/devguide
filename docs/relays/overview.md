---
sidebar_position: 1
title: Relays Overview
description: Understanding Nostr relays and their role in the network
---

# Relays Overview

Relays are the backbone of the Nostr network. They store and forward events between clients, enabling decentralized communication.

## What is a Relay?

A relay is a WebSocket server that:

- Accepts connections from clients
- Receives, validates, and stores events
- Responds to subscription requests (filters)
- Forwards matching events to subscribers
- Implements access and moderation policies

![Relay Network Topology](/img/diagrams/relay-topology.svg)

## Why Multiple Relays?

Users typically connect to multiple relays for:

| Reason | Description |
|--------|-------------|
| **Redundancy** | If one relay goes down, others continue working |
| **Reach** | Different relays have different users |
| **Privacy** | Spread your metadata across relays |
| **Speed** | Geographic distribution for lower latency |
| **Features** | Some relays offer unique capabilities |

## Relay Types

### Public Relays

Open to all users, free to read and write.

- **Pros:** Easy to use, wide reach
- **Cons:** Potential spam, may have rate limits

### Paid Relays

Require payment for write access (sometimes read too).

- **Pros:** Higher quality, less spam
- **Cons:** Requires payment

### Private Relays

Require authentication or invitation.

- **Pros:** Controlled access, privacy
- **Cons:** Limited reach

### Specialized Relays

Focus on specific content types or communities.

- Long-form content relays
- Media-focused relays
- Community relays

## Relay Discovery

### NIP-65: Relay List Metadata

Users publish their preferred relays:

```json
{
  "kind": 10002,
  "tags": [
    ["r", "wss://relay.damus.io", "read"],
    ["r", "wss://nos.lol", "write"],
    ["r", "wss://relay.nostr.band"]
  ]
}
```

### NIP-11: Relay Information

Relays serve metadata at their root URL:

```bash
curl -H "Accept: application/nostr+json" https://relay.example.com/
```

### Popular Relay Lists

- [nostr.watch](https://nostr.watch) - Relay monitoring
- [Relay Registry](https://nostr.info/relays/) - Directory

## Default Relays

Common starting relays:

```javascript
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.snort.social',
  'wss://nostr.wine',
  'wss://relay.primal.net',
  'wss://purplepag.es'
];
```

## Relay Responsibilities

### What Relays Must Do

- Accept WebSocket connections
- Validate event signatures
- Respond to REQ with matching events
- Send EOSE after stored events
- Return OK after EVENT

### What Relays May Do

- Store events permanently or temporarily
- Implement rate limiting
- Require authentication (NIP-42)
- Require payment
- Filter certain event kinds
- Implement search (NIP-50)

### What Relays Should Not Do

- Modify event content
- Forge signatures
- Selectively censor without transparency

## Getting Started

Choose your path:

1. **[Use Relays](./implementations)** - Connect to existing relays
2. **[Run a Relay](./running-a-relay)** - Set up your own
3. **[Configure a Relay](./configuration)** - Customize behavior

## See Also

- [Relay Implementations](./implementations)
- [Running a Relay](./running-a-relay)
- [Relay Communication Protocol](../protocol/relay-communication)
