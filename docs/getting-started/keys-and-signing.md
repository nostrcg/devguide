---
sidebar_position: 3
title: Keys and Signing
description: Understanding cryptographic identity in Nostr
---

# Keys and Signing

Your identity in Nostr is a cryptographic keypair. This page explains how keys work and how events are signed.

## Key Basics

Nostr uses **secp256k1** keys—the same curve used by Bitcoin. Your identity consists of:

| Component | Description | Share? |
|-----------|-------------|--------|
| **Private Key** | 32-byte secret for signing | Never |
| **Public Key** | 32-byte identifier derived from private key | Freely |

### Key Formats

Keys are typically represented in two formats:

**Hex format** (raw):
```
Private: 3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d
Public:  7e7e9c42a91bfef19fa929e5fda1b72e0ebc1a4c1141673e2794234d86addf4e
```

**Bech32 format** (human-readable with prefix):
```
Private: nsec180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyyh6vf
Public:  npub10elfcs4fr0l0r8af98jlmgdh9c8tcxjvz9qkw038js35mp4dma8qzvjptg
```

The bech32 format includes a checksum and makes it clear whether you're looking at a public key (npub) or private key (nsec).

## Generating Keys

### Using nostr-tools (JavaScript)

```javascript
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import { nip19 } from 'nostr-tools';

// Generate new keypair
const sk = generateSecretKey(); // Uint8Array
const pk = getPublicKey(sk);    // hex string

// Convert to bech32 format
const nsec = nip19.nsecEncode(sk);
const npub = nip19.npubEncode(pk);

console.log('Private key (nsec):', nsec);
console.log('Public key (npub):', npub);
```

### Using Python (pynostr)

```python
from nostr.key import PrivateKey

# Generate new keypair
private_key = PrivateKey()
public_key = private_key.public_key

print(f"Private key (hex): {private_key.hex()}")
print(f"Public key (hex): {public_key.hex()}")
print(f"Private key (bech32): {private_key.bech32()}")
print(f"Public key (bech32): {public_key.bech32()}")
```

### Using Rust (nostr-sdk)

```rust
use nostr::prelude::*;

fn main() {
    // Generate new keypair
    let keys = Keys::generate();

    println!("Private key: {}", keys.secret_key().unwrap().to_bech32().unwrap());
    println!("Public key: {}", keys.public_key().to_bech32().unwrap());
}
```

## Event Signing

Events must be signed to prove they came from the claimed author.

### Signing Process

1. **Create event object** (without id and sig):

```json
{
  "pubkey": "author's public key (hex)",
  "created_at": 1234567890,
  "kind": 1,
  "tags": [],
  "content": "Hello, Nostr!"
}
```

2. **Serialize for hashing**:

```javascript
const serialized = JSON.stringify([
  0,                    // Reserved for future use
  event.pubkey,         // Author's public key
  event.created_at,     // Unix timestamp
  event.kind,           // Event kind
  event.tags,           // Tags array
  event.content         // Content string
]);
```

3. **Compute SHA256 hash** → this becomes the event `id`

4. **Sign the id** with private key → this becomes the `sig`

### Using nostr-tools

```javascript
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure';

const sk = generateSecretKey();

const event = finalizeEvent({
  kind: 1,
  content: 'Hello, Nostr!',
  tags: [],
  created_at: Math.floor(Date.now() / 1000),
}, sk);

console.log('Signed event:', event);
// {
//   id: '...',
//   pubkey: '...',
//   created_at: 1234567890,
//   kind: 1,
//   tags: [],
//   content: 'Hello, Nostr!',
//   sig: '...'
// }
```

## Verification

Anyone can verify an event's signature:

```javascript
import { verifyEvent } from 'nostr-tools/pure';

const isValid = verifyEvent(event);
console.log('Signature valid:', isValid);
```

Verification confirms:
- The event ID matches the hash of its contents
- The signature is valid for the claimed public key

## Key Security

:::danger Keep Your Private Key Safe
Your private key is your identity. If someone gets it, they can impersonate you forever. There's no "password reset" in Nostr.
:::

### Best Practices

1. **Never share your nsec** - Treat it like a password
2. **Use a password manager** - Store keys encrypted
3. **Consider hardware signing** - NIP-07 browser extensions
4. **Backup securely** - Multiple encrypted backups
5. **Use separate keys** - Different keys for different purposes

### NIP-07: Browser Extensions

Instead of pasting your private key into apps, use a signing extension:

- [Alby](https://getalby.com/) - Popular Lightning + Nostr extension
- [nos2x](https://github.com/fiatjaf/nos2x) - Minimal Nostr signer
- [Flamingo](https://www.getflamingo.org/) - Full-featured extension

These extensions:
- Store your key securely
- Sign events when apps request
- Never expose your private key to websites

```javascript
// App requests signature from extension
const event = {
  kind: 1,
  content: 'Hello from NIP-07!',
  tags: [],
  created_at: Math.floor(Date.now() / 1000),
};

// Extension handles signing
const signedEvent = await window.nostr.signEvent(event);
```

## NIP-19: Bech32 Entities

NIP-19 defines shareable identifiers:

| Prefix | Description |
|--------|-------------|
| `npub` | Public key |
| `nsec` | Private key |
| `note` | Event ID |
| `nprofile` | Profile with relay hints |
| `nevent` | Event with relay hints |
| `naddr` | Replaceable event address |

```javascript
import { nip19 } from 'nostr-tools';

// Encode
const npub = nip19.npubEncode(publicKeyHex);
const nprofile = nip19.nprofileEncode({
  pubkey: publicKeyHex,
  relays: ['wss://relay.damus.io']
});

// Decode
const { type, data } = nip19.decode(npub);
console.log(type); // 'npub'
console.log(data); // hex public key
```

## Next Steps

Now that you understand keys:

- [Build Your First App](./first-app) - Put it into practice
- [Key Management Guide](../guides/key-management) - Advanced key handling
- [NIP-07 Extension Integration](../guides/building-clients#nip-07-integration)
