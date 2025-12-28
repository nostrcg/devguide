---
sidebar_position: 7
title: DID:Nostr
description: Decentralized Identifiers for Nostr
---

# DID:Nostr

The `did:nostr` method enables Decentralized Identifiers (DIDs) on the Nostr network, bridging Nostr with the W3C DID ecosystem.

**Specification:** [nostrcg.github.io/did-nostr](https://nostrcg.github.io/did-nostr/)

## Overview

A Nostr DID is simply a Nostr public key formatted as a DID:

```
did:nostr:<64-character-hex-pubkey>
```

**Example:**
```
did:nostr:124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2
```

### Key Points

- Uses the raw 64-character hex public key (not npub)
- No on-chain registration required
- Uniqueness derived from cryptographic key generation
- Compatible with W3C Verifiable Credentials

## DID Document Structure

A minimal did:nostr document:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/multikey/v1"
  ],
  "id": "did:nostr:124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2",
  "type": "DIDNostr",
  "verificationMethod": [{
    "id": "did:nostr:124c0fa9...#key-0",
    "type": "Multikey",
    "controller": "did:nostr:124c0fa9...",
    "publicKeyMultibase": "fe70102124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2"
  }],
  "authentication": ["did:nostr:124c0fa9...#key-0"],
  "assertionMethod": ["did:nostr:124c0fa9...#key-0"]
}
```

### Optional Fields

**Profile Information (from kind 0):**

```json
{
  "profile": {
    "name": "Alice",
    "about": "Building the decentralized web",
    "picture": "https://example.com/photo.jpg",
    "nip05": "alice@example.com",
    "lud16": "alice@getalby.com",
    "timestamp": 1737906600
  }
}
```

**Social Graph (from kind 3):**

```json
{
  "follows": [
    "did:nostr:32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245",
    "did:nostr:46fcbe3065eaf1ae7811465924e48923363ff3f526bd6f73d7c184147700e3a8"
  ]
}
```

**Relay Service Endpoints:**

```json
{
  "service": [{
    "id": "did:nostr:124c0fa9...#relay1",
    "type": "Relay",
    "serviceEndpoint": "wss://relay.example.com/"
  }]
}
```

**Alternative Identities:**

```json
{
  "alsoKnownAs": [
    "https://alice.example.com/#me",
    "at://alice.bsky.social"
  ]
}
```

## Resolution Strategies

### 1. Offline-First (Minimal)

Generate a valid DID document from the public key alone, without network access:

```typescript
function resolveOffline(did: string): DIDDocument {
  const pubkey = did.replace('did:nostr:', '');

  // Convert to Multikey format
  const multikey = toMultikey(pubkey);

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/multikey/v1'
    ],
    id: did,
    type: 'DIDNostr',
    verificationMethod: [{
      id: `${did}#key-0`,
      type: 'Multikey',
      controller: did,
      publicKeyMultibase: multikey
    }],
    authentication: [`${did}#key-0`],
    assertionMethod: [`${did}#key-0`]
  };
}
```

### 2. HTTP Resolution (Fastest)

Query the `.well-known` path:

```typescript
async function resolveHTTP(
  did: string,
  domain: string
): Promise<DIDDocument | null> {
  const pubkey = did.replace('did:nostr:', '');
  const url = `https://${domain}/.well-known/did/nostr/${pubkey}.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
```

### 3. Enhanced Resolution (Relay Queries)

Augment with Nostr relay data:

```typescript
async function resolveEnhanced(
  did: string,
  pool: SimplePool,
  relays: string[]
): Promise<DIDDocument> {
  const pubkey = did.replace('did:nostr:', '');

  // Start with minimal document
  const doc = resolveOffline(did);

  // Fetch profile (kind 0)
  const profiles = await pool.querySync(relays, {
    kinds: [0],
    authors: [pubkey],
    limit: 1
  });

  if (profiles.length > 0) {
    const profile = JSON.parse(profiles[0].content);
    doc.profile = {
      name: profile.name,
      about: profile.about,
      picture: profile.picture,
      nip05: profile.nip05,
      lud16: profile.lud16,
      timestamp: profiles[0].created_at
    };
  }

  // Fetch follows (kind 3)
  const contactLists = await pool.querySync(relays, {
    kinds: [3],
    authors: [pubkey],
    limit: 1
  });

  if (contactLists.length > 0) {
    doc.follows = contactLists[0].tags
      .filter(t => t[0] === 'p')
      .map(t => `did:nostr:${t[1]}`);
  }

  // Fetch relay list (kind 10002)
  const relayLists = await pool.querySync(relays, {
    kinds: [10002],
    authors: [pubkey],
    limit: 1
  });

  if (relayLists.length > 0) {
    doc.service = relayLists[0].tags
      .filter(t => t[0] === 'r')
      .map((t, i) => ({
        id: `${did}#relay${i}`,
        type: 'Relay',
        serviceEndpoint: t[1]
      }));
  }

  return doc;
}
```

## Multikey Encoding

Transform Nostr's BIP-340 x-only public key to W3C Multikey format:

```typescript
function toMultikey(pubkeyHex: string): string {
  // 1. Parse the 32-byte x-only public key
  const xOnly = hexToBytes(pubkeyHex);

  // 2. Determine parity and add prefix
  //    (0x02 for even y, 0x03 for odd)
  const parityByte = determineParityByte(xOnly);
  const compressed = new Uint8Array([parityByte, ...xOnly]);

  // 3. Add secp256k1 multicodec prefix (0xe7, 0x01)
  const withCodec = new Uint8Array([0xe7, 0x01, ...compressed]);

  // 4. Encode with multibase base16-lower (prefix 'f')
  return 'f' + bytesToHex(withCodec);
}

// Example:
// Input:  124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2
// Output: fe70102124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2
```

## CRUD Operations

### Create

Generate a DID by creating a Nostr keypair:

```typescript
import { generateSecretKey, getPublicKey } from 'nostr-tools';

function createNostrDID(): { did: string; secretKey: Uint8Array } {
  const secretKey = generateSecretKey();
  const pubkey = getPublicKey(secretKey);

  return {
    did: `did:nostr:${pubkey}`,
    secretKey
  };
}
```

### Read (Resolve)

Use any of the three resolution strategies above.

### Update

**Not supported.** The DID document is derived from Nostr events. To "update" the document, publish new Nostr events (kind 0, 3, 10002) and re-resolve.

### Delete

**Not supported.** Nostr DIDs cannot be deactivated. Loss of the private key means loss of control.

## Converting Between Formats

```typescript
import { nip19 } from 'nostr-tools';

// npub to DID
function npubToDid(npub: string): string {
  const { data } = nip19.decode(npub);
  return `did:nostr:${data}`;
}

// DID to npub
function didToNpub(did: string): string {
  const pubkey = did.replace('did:nostr:', '');
  return nip19.npubEncode(pubkey);
}

// hex to DID
function hexToDid(pubkey: string): string {
  return `did:nostr:${pubkey.toLowerCase()}`;
}
```

## Hosting DID Documents

Serve DID documents via `.well-known`:

```
https://example.com/.well-known/did/nostr/<pubkey>.json
```

**Nginx configuration:**

```nginx
location ~ ^/.well-known/did/nostr/([a-f0-9]{64})\.json$ {
    alias /var/www/did-documents/$1.json;
    add_header Content-Type application/json;
    add_header Access-Control-Allow-Origin *;
}
```

**Dynamic resolution (Node.js):**

```typescript
app.get('/.well-known/did/nostr/:pubkey.json', async (req, res) => {
  const { pubkey } = req.params;

  if (!/^[a-f0-9]{64}$/.test(pubkey)) {
    return res.status(400).json({ error: 'Invalid pubkey' });
  }

  const did = `did:nostr:${pubkey}`;
  const document = await resolveEnhanced(did, pool, relays);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Nostr-Timestamp', Math.floor(Date.now() / 1000));
  res.json(document);
});
```

## Use Cases

### Verifiable Credentials

Issue credentials signed with Nostr keys:

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential"],
  "issuer": "did:nostr:124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2",
  "credentialSubject": {
    "id": "did:nostr:32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245",
    "achievement": "Nostr Developer"
  }
}
```

### Cross-Platform Identity

Link Nostr identity to other systems:

```json
{
  "alsoKnownAs": [
    "did:web:alice.example.com",
    "did:key:z6Mkf...",
    "at://alice.bsky.social"
  ]
}
```

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Key loss | No recovery - maintain secure backups |
| Correlation | Use separate DIDs for different contexts |
| Public data | Don't include sensitive info in documents |
| Relay trust | Use multiple relays, verify signatures |

## Reference Implementations

- [DID:nostr Explorer](https://nostrcg.github.io/did-nostr/) - Web visualization tool
- [nostr.rocks Resolver](https://nostr.rocks) - HTTP resolution service
- [nostr-did-resolver](https://github.com/nickreynolds/nostr-did-resolver) - TypeScript library

## See Also

- [W3C DID Core](https://www.w3.org/TR/did-core/)
- [did:nostr Specification](https://nostrcg.github.io/did-nostr/)
- [Keys and Signing](../getting-started/keys-and-signing)
- [Social Graph](../guides/social-graph)
