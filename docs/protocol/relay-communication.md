---
sidebar_position: 6
title: Relay Communication
description: How clients communicate with Nostr relays
---

# Relay Communication

This page covers the details of client-relay communication over WebSocket.

## Connection Basics

### Connecting to a Relay

```javascript
const ws = new WebSocket('wss://relay.damus.io');

ws.onopen = () => {
  console.log('Connected to relay');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from relay');
};
```

### Using nostr-tools SimplePool

For most applications, use a pool to manage multiple relay connections:

```javascript
import { SimplePool } from 'nostr-tools';

const pool = new SimplePool();
const relays = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band'
];

// The pool manages connections automatically
```

## Message Format

All messages are JSON arrays. The first element is the message type.

## Client → Relay Messages

### EVENT: Publish an Event

```javascript
["EVENT", <signed-event-object>]
```

Example:
```javascript
ws.send(JSON.stringify([
  "EVENT",
  {
    "id": "abc123...",
    "pubkey": "def456...",
    "created_at": 1700000000,
    "kind": 1,
    "tags": [],
    "content": "Hello!",
    "sig": "sig789..."
  }
]));
```

### REQ: Subscribe to Events

```javascript
["REQ", <subscription-id>, <filter>, ...]
```

Example:
```javascript
ws.send(JSON.stringify([
  "REQ",
  "my-subscription",
  { "kinds": [1], "limit": 10 }
]));
```

Multiple filters in one REQ:
```javascript
ws.send(JSON.stringify([
  "REQ",
  "mixed-feed",
  { "kinds": [1], "authors": ["pubkey1"] },
  { "kinds": [1], "authors": ["pubkey2"] }
]));
```

### CLOSE: End a Subscription

```javascript
["CLOSE", <subscription-id>]
```

Example:
```javascript
ws.send(JSON.stringify(["CLOSE", "my-subscription"]));
```

### AUTH: Authenticate (NIP-42)

```javascript
["AUTH", <signed-auth-event>]
```

## Relay → Client Messages

### EVENT: Matching Event

```javascript
["EVENT", <subscription-id>, <event-object>]
```

### OK: Event Acceptance Response

```javascript
["OK", <event-id>, <accepted>, <message>]
```

Examples:
```javascript
["OK", "abc123...", true, ""]                    // Accepted
["OK", "abc123...", false, "duplicate: event"]  // Rejected as duplicate
["OK", "abc123...", false, "blocked: pubkey"]   // Author blocked
["OK", "abc123...", false, "invalid: signature"] // Bad signature
```

### EOSE: End of Stored Events

Indicates all stored events matching the filter have been sent. New events will continue to arrive in real-time.

```javascript
["EOSE", <subscription-id>]
```

### CLOSED: Subscription Closed

Relay closed a subscription (NIP-01):

```javascript
["CLOSED", <subscription-id>, <message>]
```

### NOTICE: Human-Readable Message

```javascript
["NOTICE", <message>]
```

Example:
```javascript
["NOTICE", "Rate limit exceeded. Please slow down."]
```

### AUTH: Authentication Challenge (NIP-42)

```javascript
["AUTH", <challenge-string>]
```

## Subscription Lifecycle

```
Client                              Relay
  │                                   │
  │  ["REQ", "sub1", {filter}]       │
  │──────────────────────────────────►│
  │                                   │
  │  ◄──["EVENT", "sub1", event1]────│  Stored events
  │  ◄──["EVENT", "sub1", event2]────│
  │  ◄──["EOSE", "sub1"]─────────────│  End of stored
  │                                   │
  │  ◄──["EVENT", "sub1", event3]────│  New events (real-time)
  │                                   │
  │  ["CLOSE", "sub1"]               │
  │──────────────────────────────────►│
  │                                   │
```

## Connection Best Practices

### Reconnection Logic

```javascript
function connect(url) {
  const ws = new WebSocket(url);

  ws.onclose = () => {
    // Exponential backoff
    setTimeout(() => connect(url), reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  };

  ws.onopen = () => {
    reconnectDelay = 1000; // Reset on successful connect
    resubscribe(ws); // Restore subscriptions
  };
}
```

### Multiple Relays

Always connect to multiple relays:

```javascript
const relays = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.snort.social',
  'wss://nostr.wine'
];

// Publish to all
async function publishToAll(event) {
  await Promise.allSettled(
    relays.map(url => pool.publish([url], event))
  );
}
```

### Subscription Management

Track your subscriptions:

```javascript
const subscriptions = new Map();

function subscribe(id, filter) {
  subscriptions.set(id, { filter, events: [] });
  ws.send(JSON.stringify(["REQ", id, filter]));
}

function unsubscribe(id) {
  ws.send(JSON.stringify(["CLOSE", id]));
  subscriptions.delete(id);
}

// Clean up on disconnect
ws.onclose = () => {
  subscriptions.clear();
};
```

## Relay Information Document (NIP-11)

Get relay metadata via HTTP:

```javascript
async function getRelayInfo(url) {
  const httpUrl = url.replace('wss://', 'https://').replace('ws://', 'http://');
  const response = await fetch(httpUrl, {
    headers: { Accept: 'application/nostr+json' }
  });
  return response.json();
}

const info = await getRelayInfo('wss://relay.damus.io');
// {
//   name: "Damus Relay",
//   description: "...",
//   supported_nips: [1, 11, 12, ...],
//   software: "git+https://github.com/...",
//   version: "1.0.0"
// }
```

## Authentication (NIP-42)

Some relays require authentication:

```javascript
ws.onmessage = async (msg) => {
  const [type, ...data] = JSON.parse(msg.data);

  if (type === 'AUTH') {
    const challenge = data[0];
    const authEvent = finalizeEvent({
      kind: 22242,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['relay', 'wss://relay.example.com'],
        ['challenge', challenge]
      ],
      content: ''
    }, secretKey);

    ws.send(JSON.stringify(['AUTH', authEvent]));
  }
};
```

## Error Handling

### Common Errors

| Error | Meaning | Solution |
|-------|---------|----------|
| `duplicate` | Event already exists | Ignore, not an error |
| `blocked` | Author/content blocked | Try different relay |
| `rate-limited` | Too many requests | Slow down |
| `invalid` | Malformed event | Check event format |
| `pow` | Proof of work required | Add nonce tag |

### Handling Responses

```javascript
ws.onmessage = (msg) => {
  const [type, ...data] = JSON.parse(msg.data);

  switch (type) {
    case 'OK':
      const [eventId, success, message] = data;
      if (!success) {
        if (message.startsWith('duplicate')) {
          // Not really an error
        } else {
          console.error(`Event rejected: ${message}`);
        }
      }
      break;

    case 'NOTICE':
      console.warn('Relay notice:', data[0]);
      break;

    case 'CLOSED':
      console.log('Subscription closed:', data);
      break;
  }
};
```

## See Also

- [Protocol Overview](./overview)
- [Working with Filters](./filters)
- [Running Relays Guide](../relays/running-a-relay)
