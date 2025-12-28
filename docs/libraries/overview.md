---
sidebar_position: 1
title: Libraries Overview
description: Nostr libraries across different programming languages
---

# Libraries Overview

This section covers the most popular libraries for building Nostr applications across different programming languages.

## Choosing a Library

| Language | Primary Library | Best For |
|----------|----------------|----------|
| JavaScript/TypeScript | nostr-tools | Web apps, Node.js |
| Rust | nostr-sdk, rust-nostr | High-performance, native apps |
| Python | pynostr, python-nostr | Scripts, bots, backends |
| Go | go-nostr | Backend services |
| Swift | NostrKit | iOS/macOS apps |
| Kotlin | nostrpostr | Android apps |

## Library Categories

### Full SDKs

Complete solutions with connection management, signing, and utilities:
- **nostr-tools** (JS)
- **nostr-sdk** (Rust)
- **go-nostr** (Go)

### Core Libraries

Focused on protocol primitives:
- **rust-nostr** (Rust)
- **nostr-js** (JS)

### Specialized Libraries

Focused on specific features:
- **NIP-07** browser extensions
- **Lightning/Zap** integrations
- **NIP-44** encryption libraries

## Quick Comparison

### JavaScript

```javascript
import { SimplePool, generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools';

const sk = generateSecretKey();
const pk = getPublicKey(sk);

const event = finalizeEvent({
  kind: 1,
  content: 'Hello!',
  tags: [],
  created_at: Math.floor(Date.now() / 1000)
}, sk);
```

### Rust

```rust
use nostr_sdk::prelude::*;

let keys = Keys::generate();
let client = Client::new(keys);

client.add_relay("wss://relay.damus.io").await?;
client.connect().await;

client.publish_text_note("Hello!").await?;
```

### Python

```python
from nostr.key import PrivateKey
from nostr.event import Event

private_key = PrivateKey()
event = Event(content="Hello!")
event.sign(private_key.hex())
```

### Go

```go
import "github.com/nbd-wtf/go-nostr"

sk := nostr.GeneratePrivateKey()
pk, _ := nostr.GetPublicKey(sk)

event := nostr.Event{
    PubKey:    pk,
    CreatedAt: nostr.Now(),
    Kind:      1,
    Content:   "Hello!",
}
event.Sign(sk)
```

## Feature Matrix

| Feature | nostr-tools | nostr-sdk | go-nostr | pynostr |
|---------|-------------|-----------|----------|---------|
| Key generation | ✓ | ✓ | ✓ | ✓ |
| Event signing | ✓ | ✓ | ✓ | ✓ |
| Relay pool | ✓ | ✓ | ✓ | ✓ |
| NIP-04 DMs | ✓ | ✓ | ✓ | ✓ |
| NIP-44 encryption | ✓ | ✓ | Partial | - |
| NIP-57 Zaps | ✓ | ✓ | ✓ | - |
| NIP-42 Auth | ✓ | ✓ | ✓ | ✓ |
| WebSocket | ✓ | ✓ | ✓ | ✓ |

## Getting Started

Choose your language:

- **[JavaScript/TypeScript](./javascript)** - Most popular, great for web
- **[Rust](./rust)** - High performance, type safe
- **[Python](./python)** - Quick prototyping, scripting
- **[Go](./go)** - Efficient backend services
- **[Other Languages](./other)** - Swift, Kotlin, C#, more

## Community Resources

- [Awesome Nostr](https://github.com/aljazceru/awesome-nostr) - Comprehensive list
- [Nostr.how](https://nostr.how) - Learning resources
- [NIPs Repository](https://github.com/nostr-protocol/nips) - Specifications
