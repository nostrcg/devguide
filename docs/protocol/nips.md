---
sidebar_position: 5
title: NIPs (Nostr Implementation Possibilities)
description: Understanding the NIP standards system
---

# NIPs (Nostr Implementation Possibilities)

NIPs are the specification documents that define how Nostr works. They range from the core protocol to optional features.

## What are NIPs?

NIPs are standards documents hosted at [github.com/nostr-protocol/nips](https://github.com/nostr-protocol/nips). They define:

- Core protocol behavior
- Event kinds and their formats
- Optional features and extensions
- Best practices for implementations

## NIP Categories

### Core Protocol

| NIP | Title | Description |
|-----|-------|-------------|
| [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) | Basic Protocol | Fundamental protocol definition |
| [NIP-02](https://github.com/nostr-protocol/nips/blob/master/02.md) | Follow List | Contact list and petnames |
| [NIP-10](https://github.com/nostr-protocol/nips/blob/master/10.md) | Reply Threading | Conventions for replies |

### Identity & Keys

| NIP | Title | Description |
|-----|-------|-------------|
| [NIP-05](https://github.com/nostr-protocol/nips/blob/master/05.md) | DNS-Based Verification | Mapping identifiers to pubkeys |
| [NIP-19](https://github.com/nostr-protocol/nips/blob/master/19.md) | Bech32 Entities | Human-readable key encoding |
| [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md) | Nostr Connect | Remote signing protocol |

### Content Types

| NIP | Title | Description |
|-----|-------|-------------|
| [NIP-23](https://github.com/nostr-protocol/nips/blob/master/23.md) | Long-form Content | Articles and blog posts |
| [NIP-30](https://github.com/nostr-protocol/nips/blob/master/30.md) | Custom Emoji | Custom emoji in events |
| [NIP-94](https://github.com/nostr-protocol/nips/blob/master/94.md) | File Metadata | File attachments |

### Encryption & Security

| NIP | Title | Description |
|-----|-------|-------------|
| [NIP-04](https://github.com/nostr-protocol/nips/blob/master/04.md) | Encrypted DMs | Direct messages (deprecated) |
| [NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md) | Authentication | Client-relay auth |
| [NIP-44](https://github.com/nostr-protocol/nips/blob/master/44.md) | Versioned Encryption | Modern encryption standard |

### Social Features

| NIP | Title | Description |
|-----|-------|-------------|
| [NIP-25](https://github.com/nostr-protocol/nips/blob/master/25.md) | Reactions | Likes and emoji reactions |
| [NIP-57](https://github.com/nostr-protocol/nips/blob/master/57.md) | Zaps | Lightning payments |
| [NIP-51](https://github.com/nostr-protocol/nips/blob/master/51.md) | Lists | Mute lists, bookmarks, etc. |

### Relay Features

| NIP | Title | Description |
|-----|-------|-------------|
| [NIP-11](https://github.com/nostr-protocol/nips/blob/master/11.md) | Relay Information | Relay metadata document |
| [NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md) | Authentication | Relay authentication |
| [NIP-65](https://github.com/nostr-protocol/nips/blob/master/65.md) | Relay List Metadata | User's relay preferences |

## Essential NIPs

### NIP-01: Basic Protocol

Defines the core protocol:
- Event structure and signing
- WebSocket message formats
- Filter syntax
- Relay behavior

Every implementation must support NIP-01.

### NIP-19: Bech32 Entities

Defines human-readable encodings:

```
npub1...  → Public key
nsec1...  → Private key (never share!)
note1...  → Event ID
nprofile1...  → Profile + relay hints
nevent1...  → Event + relay hints
naddr1...  → Replaceable event address
```

Example:
```javascript
import { nip19 } from 'nostr-tools';

// Encode
const npub = nip19.npubEncode(pubkeyHex);

// Decode
const { type, data } = nip19.decode(npub);
```

### NIP-05: DNS Verification

Maps human-readable identifiers to pubkeys:

`alice@example.com` → looks up `https://example.com/.well-known/nostr.json`

```json
{
  "names": {
    "alice": "pubkey-hex-here"
  },
  "relays": {
    "pubkey-hex-here": ["wss://relay.example.com"]
  }
}
```

### NIP-57: Zaps (Lightning Payments)

Enables Lightning payments integrated with events:

1. Client creates kind 9734 zap request
2. Sends to recipient's LNURL endpoint
3. User pays invoice
4. Wallet service creates kind 9735 zap receipt

## NIP Statuses

NIPs have different maturity levels:

| Status | Meaning |
|--------|---------|
| **Draft** | Work in progress |
| **Final** | Stable, implemented |
| **Deprecated** | Superseded by newer NIP |

## Implementing NIPs

### Check Requirements

Some NIPs depend on others:
- NIP-57 (Zaps) requires NIP-01, NIP-09
- NIP-46 (Connect) requires NIP-01, NIP-44

### Graceful Degradation

Not all relays/clients support all NIPs:

```javascript
// Check if NIP-07 extension is available
if (window.nostr) {
  const event = await window.nostr.signEvent(unsignedEvent);
} else {
  // Fallback: use local key
  const event = finalizeEvent(unsignedEvent, secretKey);
}
```

### Feature Detection

Query relay capabilities:

```javascript
const response = await fetch('https://relay.example.com/', {
  headers: { Accept: 'application/nostr+json' }
});
const info = await response.json();
console.log(info.supported_nips); // [1, 11, 42, ...]
```

## Common NIP Combinations

### Social Client

Essential:
- NIP-01 (Core)
- NIP-02 (Follows)
- NIP-10 (Threading)
- NIP-19 (Encoding)

Recommended:
- NIP-05 (Verification)
- NIP-25 (Reactions)
- NIP-57 (Zaps)

### Chat Application

Essential:
- NIP-01 (Core)
- NIP-44 (Encryption)

Recommended:
- NIP-19 (Encoding)
- NIP-42 (Auth)

### Long-form Platform

Essential:
- NIP-01 (Core)
- NIP-23 (Articles)

Recommended:
- NIP-05 (Verification)
- NIP-57 (Zaps)
- NIP-94 (Media)

## Keeping Up to Date

The NIPs repository is actively developed:

```bash
# Watch the repository
gh repo star nostr-protocol/nips
```

Follow these resources:
- [NIPs GitHub](https://github.com/nostr-protocol/nips)
- [Nostr.how](https://nostr.how)
- Nostr clients for protocol discussions

## See Also

- [Official NIPs Repository](https://github.com/nostr-protocol/nips)
- [Event Kinds Reference](./kinds)
- [NIP Implementation Guide](../guides/nip-implementation)
