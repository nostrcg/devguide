---
sidebar_position: 2
title: JavaScript Libraries
description: Nostr libraries for JavaScript and TypeScript
---

# JavaScript Libraries

JavaScript is the most popular language for Nostr development, with excellent library support for both browser and Node.js environments.

## nostr-tools

The de facto standard library for JavaScript Nostr development.

**Install:**
```bash
npm install nostr-tools
```

**Repository:** [github.com/nbd-wtf/nostr-tools](https://github.com/nbd-wtf/nostr-tools)

### Key Generation

```javascript
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import { nip19 } from 'nostr-tools';

// Generate new keypair
const sk = generateSecretKey(); // Uint8Array
const pk = getPublicKey(sk);    // hex string

// Convert to bech32
const nsec = nip19.nsecEncode(sk);
const npub = nip19.npubEncode(pk);

console.log('Private:', nsec);
console.log('Public:', npub);
```

### Creating Events

```javascript
import { finalizeEvent } from 'nostr-tools/pure';

const event = finalizeEvent({
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [
    ['t', 'nostr'],
    ['p', 'somePubkey']
  ],
  content: 'Hello from nostr-tools!'
}, sk);

console.log(event);
// { id, pubkey, created_at, kind, tags, content, sig }
```

### Verifying Events

```javascript
import { verifyEvent } from 'nostr-tools/pure';

if (verifyEvent(event)) {
  console.log('Valid event');
} else {
  console.log('Invalid signature');
}
```

### Managing Relays

```javascript
import { SimplePool } from 'nostr-tools';

const pool = new SimplePool();

const relays = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band'
];

// Subscribe to events
const sub = pool.subscribeMany(
  relays,
  [{ kinds: [1], limit: 10 }],
  {
    onevent(event) {
      console.log('Got event:', event);
    },
    oneose() {
      console.log('End of stored events');
    }
  }
);

// Later: close subscription
sub.close();
```

### Publishing Events

```javascript
// Publish to all relays
await Promise.all(pool.publish(relays, event));

// Or use the pool's publish method
await pool.publish(relays, event);
```

### Querying Events (One-shot)

```javascript
// Get events once (no real-time updates)
const events = await pool.querySync(
  relays,
  { kinds: [1], limit: 20 }
);

console.log(`Got ${events.length} events`);
```

### NIP-19 Encoding

```javascript
import { nip19 } from 'nostr-tools';

// Encode
const npub = nip19.npubEncode(pubkeyHex);
const nsec = nip19.nsecEncode(secretKeyBytes);
const noteId = nip19.noteEncode(eventIdHex);

// With relay hints
const nprofile = nip19.nprofileEncode({
  pubkey: pubkeyHex,
  relays: ['wss://relay.example.com']
});

const nevent = nip19.neventEncode({
  id: eventIdHex,
  relays: ['wss://relay.example.com'],
  author: pubkeyHex
});

// Decode
const { type, data } = nip19.decode(npub);
// type: 'npub', data: hex pubkey
```

### NIP-07 Integration

Use browser extensions for signing:

```javascript
// Check if extension is available
if (window.nostr) {
  // Get public key
  const pubkey = await window.nostr.getPublicKey();

  // Sign event (extension handles private key)
  const signedEvent = await window.nostr.signEvent({
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: 'Signed with NIP-07!'
  });

  // Encrypt (NIP-04)
  const encrypted = await window.nostr.nip04.encrypt(recipientPubkey, 'secret message');

  // Decrypt (NIP-04)
  const decrypted = await window.nostr.nip04.decrypt(senderPubkey, encrypted);
}
```

### NIP-44 Encryption

Modern encryption standard:

```javascript
import { nip44 } from 'nostr-tools';

// Encrypt
const conversationKey = nip44.v2.utils.getConversationKey(
  senderPrivateKey,
  recipientPublicKey
);
const encrypted = nip44.v2.encrypt(plaintext, conversationKey);

// Decrypt
const decrypted = nip44.v2.decrypt(encrypted, conversationKey);
```

## Nostrify

Flexible TypeScript framework with modular, interchangeable components for relays, signers, and storage.

**Install:**
```bash
npx jsr add @nostrify/nostrify
```

**Documentation:** [nostrify.dev](https://nostrify.dev)

### Core Concepts

Nostrify uses standardized interfaces that can be swapped out:

- **NStore** - Event storage (memory, database, cache)
- **NRelay** - Relay connections (single, pool, outbox)
- **NSigner** - Event signing (keys, NIP-46, custodial)
- **NPolicy** - Spam filtering and moderation

### Basic Usage

```typescript
import { NPool, NRelay1 } from '@nostrify/nostrify';

// Create a relay pool
const pool = new NPool({
  open(url) {
    return new NRelay1(url);
  },
  reqRouter(filters) {
    return new Map([
      ['wss://relay.damus.io', filters],
      ['wss://nos.lol', filters],
    ]);
  },
  eventRouter(event) {
    return ['wss://relay.damus.io', 'wss://nos.lol'];
  },
});

// Query events
const events = await pool.query([{ kinds: [1], limit: 10 }]);

// Subscribe to events
for await (const msg of pool.req([{ kinds: [1], limit: 0 }])) {
  if (msg[0] === 'EVENT') {
    console.log('New event:', msg[2]);
  }
}
```

### Signers

```typescript
import { NSecSigner } from '@nostrify/nostrify';

// Create signer from secret key
const signer = new NSecSigner(secretKey);

// Sign an event
const event = await signer.signEvent({
  kind: 1,
  content: 'Hello from Nostrify!',
  tags: [],
  created_at: Math.floor(Date.now() / 1000),
});
```

### Storage

```typescript
import { NCache } from '@nostrify/nostrify';

// In-memory cache with NIP-01 replaceable event handling
const cache = new NCache({ max: 1000 });

// Store events
await cache.event(event);

// Query from cache
const cached = await cache.query([{ kinds: [0], authors: [pubkey] }]);
```

### Policies

```typescript
import { NPolicy, NostrEvent } from '@nostrify/nostrify';

// Create moderation policy
const policy: NPolicy = {
  async call(event: NostrEvent) {
    // Reject events with too many tags
    if (event.tags.length > 100) {
      return ['reject', 'too many tags'];
    }
    return ['accept'];
  },
};
```

### Why Nostrify?

- **Modular** - Use only what you need
- **Interchangeable** - Swap implementations without changing code
- **Cross-platform** - Works in browsers, Node.js, Deno, Bun
- **TypeScript-first** - Full type safety
- **Works with others** - Use alongside nostr-tools or NDK

## @nostr-dev-kit/ndk

Higher-level SDK with caching and event management.

**Install:**
```bash
npm install @nostr-dev-kit/ndk
```

**Repository:** [github.com/nostr-dev-kit/ndk](https://github.com/nostr-dev-kit/ndk)

### Basic Usage

```javascript
import NDK from '@nostr-dev-kit/ndk';

const ndk = new NDK({
  explicitRelayUrls: [
    'wss://relay.damus.io',
    'wss://nos.lol'
  ]
});

await ndk.connect();

// Create and publish
const event = new NDKEvent(ndk);
event.kind = 1;
event.content = 'Hello from NDK!';
await event.sign();
await event.publish();

// Subscribe
const sub = ndk.subscribe({ kinds: [1], limit: 10 });
sub.on('event', (event) => console.log(event));
```

### User Profiles

```javascript
const user = ndk.getUser({ pubkey: '...' });
await user.fetchProfile();

console.log(user.profile?.name);
console.log(user.profile?.about);
```

## nostr-fetch

Specialized for efficient data fetching.

**Install:**
```bash
npm install nostr-fetch
```

```javascript
import { NostrFetcher } from 'nostr-fetch';

const fetcher = NostrFetcher.init();

const events = await fetcher.fetchAllEvents(
  relays,
  { kinds: [1], authors: [pubkey] },
  { since: oneHourAgo }
);
```

## TypeScript Support

All major libraries have excellent TypeScript support:

```typescript
import type { Event, Filter } from 'nostr-tools';

function processEvents(events: Event[]): void {
  for (const event of events) {
    console.log(event.content);
  }
}

const filter: Filter = {
  kinds: [1],
  limit: 10
};
```

## Framework Integrations

### React

```javascript
import { useEffect, useState } from 'react';
import { SimplePool } from 'nostr-tools';

function useNostrEvents(filter) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const pool = new SimplePool();
    const relays = ['wss://relay.damus.io'];

    const sub = pool.subscribeMany(relays, [filter], {
      onevent(event) {
        setEvents(prev => [...prev, event]);
      }
    });

    return () => sub.close();
  }, [filter]);

  return events;
}
```

### Svelte

```javascript
import { writable } from 'svelte/store';
import { SimplePool } from 'nostr-tools';

export function createNostrStore(relays, filter) {
  const { subscribe, set, update } = writable([]);
  const pool = new SimplePool();

  pool.subscribeMany(relays, [filter], {
    onevent(event) {
      update(events => [...events, event]);
    }
  });

  return { subscribe };
}
```

## Best Practices

1. **Use the pure imports** when possible for smaller bundles:
   ```javascript
   import { generateSecretKey } from 'nostr-tools/pure';
   ```

2. **Close subscriptions** when components unmount

3. **Handle reconnection** - relays can disconnect

4. **Cache events** locally to reduce relay load

5. **Verify events** before trusting them

## See Also

- [nostr-tools GitHub](https://github.com/nbd-wtf/nostr-tools)
- [Nostrify Documentation](https://nostrify.dev)
- [NDK Documentation](https://github.com/nostr-dev-kit/ndk)
- [Build Your First App](../getting-started/first-app)
