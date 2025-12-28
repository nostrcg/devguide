---
sidebar_position: 3
title: Developer Tools
description: Tools for Nostr development and debugging
---

# Developer Tools

This page covers tools that help you build, test, and debug Nostr applications.

## Command Line Tools

### nak

Swiss army knife for Nostr.

- **Repository:** [github.com/fiatjaf/nak](https://github.com/fiatjaf/nak)

**Install:**
```bash
go install github.com/fiatjaf/nak@latest
```

**Usage:**
```bash
# Generate keys
nak key generate
nak key public <nsec>

# Fetch events
nak req -k 1 -l 10 wss://relay.damus.io

# Publish event
echo '{"kind":1,"content":"Hello!"}' | nak event wss://relay.damus.io

# Decode NIP-19
nak decode npub1...

# Verify event
cat event.json | nak verify
```

### nostril

Simple event creator.

- **Repository:** [github.com/jb55/nostril](https://github.com/jb55/nostril)

```bash
# Create and sign a note
nostril --sec <hex-secret> --content "Hello Nostr"

# Create with envelope for relay
nostril --sec <hex-secret> --envelope --content "Hello" | websocat wss://relay.damus.io
```

### nostr-tools CLI

CLI from nostr-tools package.

```bash
npx nostr-tools generate-key
npx nostr-tools sign-event <event.json>
```

## Browser Extensions

### Alby

Lightning + Nostr browser extension.

- **Website:** [getalby.com](https://getalby.com)
- **Browsers:** Chrome, Firefox, Safari

**Features:**
- NIP-07 signing
- Lightning wallet
- Budget controls
- Multiple accounts

### nos2x

Minimal Nostr signing extension.

- **Repository:** [github.com/fiatjaf/nos2x](https://github.com/fiatjaf/nos2x)
- **Browsers:** Chrome, Firefox

**Features:**
- Lightweight
- Pure NIP-07
- Open source

### Flamingo

Full-featured Nostr extension.

- **Website:** [getflamingo.org](https://getflamingo.org)

**Features:**
- NIP-07 signing
- NIP-44 encryption
- Multiple keys

## Testing Tools

### WebSocket Test Clients

#### websocat

CLI WebSocket client.

```bash
# Install
cargo install websocat

# Connect to relay
websocat wss://relay.damus.io

# Send subscription
["REQ","test",{"kinds":[1],"limit":5}]
```

#### wscat

Node.js WebSocket client.

```bash
npm install -g wscat

wscat -c wss://relay.damus.io
> ["REQ","sub1",{"kinds":[1],"limit":3}]
```

### Relay Testing

#### nostr-relay-tester

Test relay NIP compliance.

```bash
npx nostr-relay-tester wss://relay.example.com
```

#### relay-tools

Relay inspection utilities.

```bash
# Check relay info
curl -H "Accept: application/nostr+json" https://relay.example.com/

# Test connection
websocat wss://relay.example.com/ -n
```

## Development Environments

### Local Relay for Testing

Run a local relay for development:

```bash
# Using strfry
docker run -p 7777:7777 hoytech/strfry

# Using nostream
docker run -p 7777:7777 cameri/nostream
```

### Mock Relay

For unit testing:

```javascript
import { createMockRelay } from 'nostr-tools/mock';

const relay = createMockRelay();
// Returns events you've injected
```

## Debugging

### Event Inspector

Paste events to decode:

```javascript
// Browser console
const event = JSON.parse('{"id":"...","pubkey":"..."}');

// Decode pubkey
import { nip19 } from 'nostr-tools';
console.log(nip19.npubEncode(event.pubkey));

// Verify signature
import { verifyEvent } from 'nostr-tools/pure';
console.log(verifyEvent(event));
```

### Network Debugging

Chrome DevTools:
1. Open Network tab
2. Filter by WS (WebSocket)
3. Click connection to see messages

Firefox:
1. Open Network tab
2. Filter by WS
3. View Messages panel

### Common Debug Patterns

```javascript
// Log all relay messages
relay.onmessage = (msg) => {
  console.log('Received:', JSON.parse(msg.data));
};

// Track subscriptions
const subs = new Map();
function subscribe(id, filter) {
  console.log(`Subscribe ${id}:`, filter);
  subs.set(id, filter);
}
```

## Key Management

### Key Generation

```bash
# Using nak
nak key generate

# Using openssl
openssl rand -hex 32
```

### Bech32 Encoding

```bash
# Encode pubkey to npub
echo "pubkey-hex" | nak encode npub

# Decode npub to hex
nak decode npub1...
```

### Mnemonic (BIP-39)

```javascript
import { generateMnemonic, mnemonicToEntropy } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

const mnemonic = generateMnemonic(wordlist);
console.log(mnemonic);
// witch collapse practice feed shame open despair creek road again ice least
```

## API Tools

### Nostr.band API

Query aggregated Nostr data.

```bash
# Search notes
curl "https://api.nostr.band/v0/search?q=bitcoin&limit=10"

# Get trending
curl "https://api.nostr.band/v0/trending/notes"

# Get profile
curl "https://api.nostr.band/v0/p/npub1..."
```

### Primal API

Cached Nostr data access.

```bash
curl "https://primal.net/api/feed/latest"
```

## Monitoring

### nostr.watch

- **Website:** [nostr.watch](https://nostr.watch)

**Features:**
- Relay uptime monitoring
- NIP support detection
- Performance metrics

### Relay Stats

Track your relay's metrics:

```bash
# Prometheus endpoint (if supported)
curl http://localhost:7777/metrics

# Relay info
curl -H "Accept: application/nostr+json" http://localhost:7777/
```

## Useful Utilities

### Event ID Calculation

```javascript
import { getEventHash } from 'nostr-tools/pure';

const event = {
  pubkey: '...',
  created_at: Math.floor(Date.now() / 1000),
  kind: 1,
  tags: [],
  content: 'test'
};

const id = getEventHash(event);
```

### NIP-05 Verification

```bash
# Check NIP-05 identifier
curl "https://example.com/.well-known/nostr.json?name=alice"
```

### Relay List Discovery

```javascript
// Get user's relay list (NIP-65)
const filter = {
  kinds: [10002],
  authors: [pubkey],
  limit: 1
};
```

## See Also

- [Libraries Overview](../libraries/overview)
- [Testing Guide](../guides/testing)
- [Nostr Clients](./clients)
