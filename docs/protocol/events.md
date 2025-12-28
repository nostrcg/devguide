---
sidebar_position: 2
title: Events
description: Understanding Nostr events in detail
---

# Events

Events are the atomic unit of data in Nostr. Every piece of information—posts, profiles, reactions, follows—is represented as an event.

## Event Structure

```json
{
  "id": "4376c65d2f232afbe9b882a35baa4f6fe8667c4e684749af565f981833ed6a65",
  "pubkey": "6e468422dfb74a5738702a8823b9b28168abab8655faacb6853cd0ee15deee93",
  "created_at": 1673347337,
  "kind": 1,
  "tags": [
    ["e", "3da979448d9ba263864c4d6f14984c423a3838364ec255f03c7904b1ae77f206"],
    ["p", "bf2376e17ba4ec269d10fcc996a4746b451152be9031fa48e74553dde5526bce"]
  ],
  "content": "This is a reply to another note!",
  "sig": "908a15e46fb4d8675bab026fc230a0e3542bfade63da02d542fb78b2a8513fcd..."
}
```

### Field Details

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | 32-byte lowercase hex SHA256 hash of the serialized event |
| `pubkey` | string | 32-byte lowercase hex public key of the event creator |
| `created_at` | integer | Unix timestamp in seconds |
| `kind` | integer | Event type identifier (0-65535) |
| `tags` | array | Array of arrays containing tag data |
| `content` | string | Arbitrary string content (interpretation depends on kind) |
| `sig` | string | 64-byte lowercase hex Schnorr signature |

## Computing the Event ID

The event ID is a SHA256 hash of the serialized event data:

```javascript
const serialized = JSON.stringify([
  0,                    // Reserved for future use
  event.pubkey,         // Author's public key
  event.created_at,     // Unix timestamp
  event.kind,           // Event kind
  event.tags,           // Tags array
  event.content         // Content string
]);

const id = sha256(serialized);
```

The serialization must follow these rules:
- No whitespace
- UTF-8 encoding
- No escaping of Unicode characters
- Numbers without quotes

## Signing Events

Events are signed using Schnorr signatures (BIP-340):

```javascript
import { schnorr } from '@noble/curves/secp256k1';

const signature = schnorr.sign(eventId, privateKey);
```

The signature covers only the event ID (which is a hash of all other fields).

## Tags

Tags are arrays of strings that add metadata to events.

### Standard Tag Types

| Tag | Format | Description |
|-----|--------|-------------|
| `e` | `["e", "<event-id>", "<relay-url>", "<marker>"]` | Reference to another event |
| `p` | `["p", "<pubkey>", "<relay-url>", "<petname>"]` | Reference to a user |
| `a` | `["a", "<kind>:<pubkey>:<d-tag>", "<relay-url>"]` | Reference to replaceable event |
| `d` | `["d", "<identifier>"]` | Identifier for replaceable events |
| `t` | `["t", "<hashtag>"]` | Hashtag |
| `r` | `["r", "<url>"]` | Reference to URL |
| `nonce` | `["nonce", "<nonce>", "<target>"]` | Proof of work |
| `subject` | `["subject", "<subject>"]` | Subject/title |
| `expiration` | `["expiration", "<timestamp>"]` | Expiration time |

### Event Reference Markers

The `e` tag can include markers for threading:

```json
["e", "<event-id>", "<relay>", "root"]    // Thread root
["e", "<event-id>", "<relay>", "reply"]   // Direct parent
["e", "<event-id>", "<relay>", "mention"] // Mention (not a reply)
```

### Example: Tagged Event

```json
{
  "kind": 1,
  "content": "Check out this article!",
  "tags": [
    ["e", "abc123...", "wss://relay.example.com", "root"],
    ["p", "def456...", "wss://relay.example.com"],
    ["t", "nostr"],
    ["t", "development"],
    ["r", "https://example.com/article"]
  ]
}
```

## Event Categories

Events are categorized by how they should be stored:

### Regular Events (most kinds)

Stored by relays as independent events. Multiple events of the same kind from the same author are all kept.

### Replaceable Events (kinds 0, 3, 10000-19999)

Only the latest event (by `created_at`) is kept. Older events are discarded.

```json
{
  "kind": 0,
  "content": "{\"name\": \"Alice\", \"about\": \"Nostr developer\"}",
  "created_at": 1700000000
}
```

### Parameterized Replaceable Events (kinds 30000-39999)

Like replaceable, but identified by both kind and `d` tag. Each unique `d` value is a separate replaceable.

```json
{
  "kind": 30023,
  "tags": [["d", "my-blog-post"]],
  "content": "Long form article content...",
  "created_at": 1700000000
}
```

### Ephemeral Events (kinds 20000-29999)

Should not be stored by relays. Used for real-time communication.

```json
{
  "kind": 20001,
  "content": "User is typing...",
  "created_at": 1700000000
}
```

## Creating Events in Code

### JavaScript (nostr-tools)

```javascript
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure';

const sk = generateSecretKey();

const event = finalizeEvent({
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [
    ['t', 'nostr'],
    ['p', 'recipientPubkey']
  ],
  content: 'Hello, Nostr!'
}, sk);

console.log(event);
// { id, pubkey, created_at, kind, tags, content, sig }
```

### Rust (nostr-sdk)

```rust
use nostr::prelude::*;

let keys = Keys::generate();
let event = EventBuilder::text_note("Hello, Nostr!")
    .tags([Tag::hashtag("nostr")])
    .sign_with_keys(&keys)?;

println!("{}", event.as_json());
```

### Python (pynostr)

```python
from nostr.event import Event
from nostr.key import PrivateKey

private_key = PrivateKey()

event = Event(
    kind=1,
    content="Hello, Nostr!",
    tags=[["t", "nostr"]]
)
event.sign(private_key.hex())

print(event.to_message())
```

## Verifying Events

Always verify events before trusting them:

```javascript
import { verifyEvent } from 'nostr-tools/pure';

if (verifyEvent(event)) {
  console.log('Valid event');
} else {
  console.log('Invalid signature or ID');
}
```

Verification checks:
1. Event ID matches the hash of serialized data
2. Signature is valid for the claimed public key

## Best Practices

1. **Always verify** incoming events before processing
2. **Use appropriate kinds** for your content type
3. **Include relay hints** in `e` and `p` tags when possible
4. **Set reasonable timestamps** - don't backdate or future-date events
5. **Use markers** for replies to enable proper threading

## See Also

- [Event Kinds Reference](./kinds)
- [Working with Filters](./filters)
- [NIPs Specification](./nips)
