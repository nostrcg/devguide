---
sidebar_position: 1
title: Introduction to Nostr
description: Learn what Nostr is and why it matters for decentralized communication
---

# Introduction to Nostr

**Nostr** (Notes and Other Stuff Transmitted by Relays) is a simple, open protocol that enables truly censorship-resistant and decentralized communication.

## What is Nostr?

Nostr is not an app or a service—it's a protocol. Think of it like email or HTTP: a standard way for different software to communicate. Anyone can build apps that use Nostr, and all these apps can interoperate.

At its core, Nostr is remarkably simple:

- **Clients** are apps that users interact with (mobile apps, web apps, desktop apps)
- **Relays** are servers that store and forward messages
- **Events** are signed JSON messages that contain all data

![Nostr Network](/img/diagrams/nostr-network-simple.svg)

## Why Nostr?

### Censorship Resistance

There's no central authority that can ban you or delete your content. You can always publish to relays that will accept your messages.

### Identity Ownership

Your identity is a cryptographic keypair that you control. No company owns your account. You can use the same identity across all Nostr apps.

### Data Portability

Your data isn't locked in a single platform. Switch apps anytime—your followers, posts, and social graph come with you.

### Simplicity

The core protocol is intentionally minimal. A basic client can be built in a few hundred lines of code.

## Key Concepts

### Keys

Your identity in Nostr is a secp256k1 keypair:

- **Private key (nsec)**: Secret key for signing. Never share this.
- **Public key (npub)**: Your public identity. Share freely.

```javascript
// Example: A Nostr keypair
{
  privateKey: "nsec1...", // Keep secret!
  publicKey: "npub1..."   // Your public identity
}
```

### Events

Everything in Nostr is an event—a signed JSON object:

```json
{
  "id": "32-bytes hex string",
  "pubkey": "32-bytes hex string",
  "created_at": 1234567890,
  "kind": 1,
  "tags": [],
  "content": "Hello, Nostr!",
  "sig": "64-bytes hex string"
}
```

### Relays

Relays are simple WebSocket servers that:

- Accept events from clients
- Store events (according to their policies)
- Send events to clients that request them

You typically connect to multiple relays for redundancy.

## Getting Started

Ready to start building? Here's your path:

1. **[How Nostr Works](./how-nostr-works)** - Understand the architecture
2. **[Keys and Signing](./keys-and-signing)** - Learn about cryptographic identity
3. **[Build Your First App](./first-app)** - Create a working Nostr client

## Community

- [W3C Nostr Community Group](https://www.w3.org/community/nostr/)
- [NIPs Repository](https://github.com/nostr-protocol/nips) - Protocol specifications
- [Awesome Nostr](https://github.com/aljazceru/awesome-nostr) - Curated resources

## Next Steps

Continue to [How Nostr Works](./how-nostr-works) to understand the protocol architecture in detail.
