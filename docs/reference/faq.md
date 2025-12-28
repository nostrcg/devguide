---
sidebar_position: 4
title: FAQ
description: Frequently asked questions about Nostr development
---

# Frequently Asked Questions

Common questions about Nostr development.

## General

### What is Nostr?

Nostr (Notes and Other Stuff Transmitted by Relays) is a simple, open protocol for decentralized social networking. It uses cryptographic keys for identity and relays for message distribution.

### How is Nostr different from ActivityPub/Mastodon?

| Aspect | Nostr | ActivityPub |
|--------|-------|-------------|
| Identity | Cryptographic keys | Server accounts |
| Portability | Full (take keys anywhere) | Limited (server-dependent) |
| Complexity | Simple JSON events | Complex protocol |
| Servers | Dumb relays | Smart servers |
| Censorship | Hard (many relays) | Easy (server admin) |

### Is Nostr encrypted?

By default, events are public. Encryption is available via:
- NIP-04 (deprecated)
- NIP-44 (recommended)
- NIP-59 (gift wrap)

### Can I delete my posts?

You can publish deletion requests (kind 5), but relays are not required to honor them. Treat anything published as potentially permanent.

## Keys & Identity

### What happens if I lose my private key?

There is no recovery mechanism. Your identity and all associated data are lost. Always maintain secure backups.

### Can I change my key?

You can migrate to a new key by:
1. Announcing the migration from your old key
2. Having followers re-follow your new key
3. There's no automatic migration

### Should I use the same key everywhere?

Consider using different keys for:
- Main identity (maximum security)
- Testing/development (less critical)
- Bots/automation (isolated)

### How do NIP-07 extensions work?

Browser extensions like Alby and nos2x:
1. Store your private key securely
2. Provide `window.nostr` API
3. Sign events when requested
4. Never expose your key to websites

## Events & Protocol

### What's the maximum event size?

Varies by relay, typically 64KB-1MB. Check relay's NIP-11 info:
```json
"limitation": {
  "max_content_length": 65535
}
```

### How long are events stored?

Depends on relay policy:
- Some keep everything
- Some limit by age (e.g., 30 days)
- Some limit by count per pubkey
- Ephemeral kinds (20000-29999) aren't stored

### Can I edit events?

Events are immutable. For updates:
- Replaceable events (kind 0, 3, 10000-19999): publish new version
- Parameterized replaceable (30000-39999): publish with same `d` tag
- Regular events: publish correction and reference original

### Why are my events not appearing?

Common causes:
1. Invalid signature
2. Relay policy rejection
3. Rate limiting
4. Relay not storing that kind
5. Network/connection issues

Debug steps:
```javascript
// Verify event locally
console.log(verifyEvent(event));

// Check relay response
pool.publish([relay], event).then(result => {
  console.log('Publish result:', result);
});
```

## Relays

### How many relays should I use?

Recommendations:
- **Minimum:** 3 for redundancy
- **Typical:** 5-10 for good reach
- **Maximum:** Consider performance impact

### Which relays should I use?

Start with popular public relays:
- wss://relay.damus.io
- wss://nos.lol
- wss://relay.nostr.band

Then add based on:
- Your region
- Your community
- Special features needed

### Why do I need multiple relays?

- **Redundancy:** If one goes down, others work
- **Reach:** Different relays have different users
- **Privacy:** Don't reveal all activity to one party
- **Speed:** Geographic distribution

### How do I run my own relay?

See [Running a Relay](../relays/running-a-relay). Quick start:
```bash
docker run -p 7777:7777 hoytech/strfry
```

## Development

### Which library should I use?

| Language | Recommendation |
|----------|---------------|
| JavaScript | nostr-tools |
| Rust | nostr-sdk |
| Python | pynostr or nostr-sdk bindings |
| Go | go-nostr |

### How do I test without affecting production?

1. Run a local relay for testing
2. Use test keys (never production keys)
3. Use test relays when available

### How do I handle rate limits?

```javascript
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.max = maxRequests;
    this.window = windowMs;
    this.requests = [];
  }

  async acquire() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.window);

    if (this.requests.length >= this.max) {
      const waitTime = this.window - (now - this.requests[0]);
      await new Promise(r => setTimeout(r, waitTime));
    }

    this.requests.push(Date.now());
  }
}
```

### How do I implement NIP-07 fallback?

```javascript
async function sign(event) {
  if (window.nostr) {
    return window.nostr.signEvent(event);
  }
  // Fallback to local key
  if (localSecretKey) {
    return finalizeEvent(event, localSecretKey);
  }
  throw new Error('No signing method available');
}
```

## Common Errors

### "Invalid signature"

Causes:
- Signing with wrong key
- Event modified after signing
- Incorrect serialization

Fix: Verify event creation process:
```javascript
const event = finalizeEvent({...}, secretKey);
console.log(verifyEvent(event)); // Should be true
```

### "Duplicate event"

The same event ID was already received. This is normal for publishing to multiple relays. Handle gracefully:
```javascript
if (message.startsWith('duplicate')) {
  // Not an error
  return;
}
```

### "Rate limited"

Slow down your requests. Implement backoff:
```javascript
async function publishWithRetry(event, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await pool.publish(relays, event);
    } catch (e) {
      if (e.message.includes('rate')) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      } else throw e;
    }
  }
}
```

### "Connection closed"

WebSocket disconnected. Implement reconnection:
```javascript
function createReconnectingPool() {
  const pool = new SimplePool();
  // SimplePool handles reconnection automatically
  return pool;
}
```

## NIPs

### Which NIPs are required?

Only NIP-01 is truly required. In practice, also implement:
- NIP-02 (follows)
- NIP-10 (threading)
- NIP-19 (bech32)

### How do I check if a relay supports a NIP?

```javascript
const info = await getRelayInfo(relayUrl);
const supportsZaps = info.supported_nips?.includes(57);
```

### Where do I find NIP specifications?

Official repository: [github.com/nostr-protocol/nips](https://github.com/nostr-protocol/nips)

## Getting Help

### Where can I ask questions?

- [W3C Nostr Community Group](https://www.w3.org/community/nostr/)
- GitHub issues on relevant repos
- Nostr itself (using Nostr clients)
- [nostr.how](https://nostr.how)

### Where can I report bugs?

- Library bugs: Library's GitHub
- Protocol issues: [NIPs repo](https://github.com/nostr-protocol/nips)
- Client bugs: Client's GitHub

## See Also

- [Getting Started](../getting-started/introduction)
- [Protocol Overview](../protocol/overview)
- [Libraries Overview](../libraries/overview)
