---
sidebar_position: 7
title: DID:Nostr
description: Using a Nostr public key as a W3C Decentralized Identifier, following the Nostr Community Group's did:nostr spec
---

# DID:Nostr

The `did:nostr` method turns a Nostr public key into a W3C [Decentralized Identifier](https://www.w3.org/TR/did-core/) (DID). A Nostr identity can then be used anywhere DIDs are accepted, such as Verifiable Credentials and Data Integrity proofs, without registering anything anywhere.

:::info Status
The spec is a **Community Group draft, version 0.1.1**, published by the W3C Nostr Community Group. It is a work in progress and may change. This page follows the text as of October 2026. Where they differ, the spec wins.

- Spec: [nostrcg.github.io/did-nostr](https://nostrcg.github.io/did-nostr/)
- Plain-language introduction: [did:nostr Primer](https://nostrcg.github.io/did-nostr/primer.html)
- Repository, issues and test vectors: [github.com/nostrcg/did-nostr](https://github.com/nostrcg/did-nostr)
:::

## The identifier

```
did:nostr:<64-character lowercase hex public key>
```

For example:

```
did:nostr:124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2
```

- The key is the raw hex public key, the same one that appears in events. The `npub` form (here `npub1zfxql2v5quvzanj6ynadndlkvays9lzz9ppaxy5d8zs2l0hqlhfq8fdyst`) is for display only and is never part of the DID.
- The key must be a valid secp256k1 x-only public key: a field element that is the x-coordinate of a point on the curve. Resolvers SHOULD check this.
- Nothing is registered. Generating a key pair creates the DID.

## The DID document

Resolving a DID gives a **DID document**. For `did:nostr`, the document is a projection of the key and, optionally, of the user's signed Nostr events.

### Minimal document

A resolver can build this from the identifier alone, with no network access. Every conforming resolver MUST be able to. This is the spec's test vector `minimal_document_2_3_1`:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://www.w3.org/ns/cid/v1",
    "https://w3id.org/nostr/context"
  ],
  "id": "did:nostr:124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2",
  "type": "DIDNostr",
  "verificationMethod": [
    {
      "id": "did:nostr:124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2#key1",
      "type": "Multikey",
      "controller": "did:nostr:124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2",
      "publicKeyMultibase": "fe70102124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2"
    }
  ],
  "authentication": ["#key1"],
  "assertionMethod": ["#key1"]
}
```

- `@context` leads with DID Core, then [Controlled Identifiers v1.0](https://www.w3.org/TR/cid-1.0/) (which defines `Multikey` and `publicKeyMultibase`), then the Nostr context.
- `type` MUST be `"DIDNostr"`.
- The verification method's `id` and `controller` are absolute. `authentication` and `assertionMethod` use the relative reference `#key1`.

### Complete document

With relay data added, a document can also carry relays, a profile, follows and a change time. This is the spec's example, verbatim:

```json
{
    "@context": ["https://www.w3.org/ns/did/v1", "https://www.w3.org/ns/cid/v1", "https://w3id.org/nostr/context"],
    "id": "did:nostr:124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2",
    "alsoKnownAs": [
        "https://alice.example.com/#me",
        "https://social.example.com/@alice",
        "at://alice.bsky.social"
    ],
    "type": "DIDNostr",
    "verificationMethod": [
        {
            "id": "did:nostr:124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2#key1",
            "type": "Multikey",
            "controller": "did:nostr:124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2",
            "publicKeyMultibase": "fe70102124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2"
        }
    ],
    "authentication": ["#key1"],
    "assertionMethod": ["#key1"],
    "service": [
        {
            "id": "did:nostr:124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2#relay1",
            "type": "Relay",
            "serviceEndpoint": "wss://relay.damus.io/"
        }
    ],
    "profile": {
        "name": "Alice", 
        "about": "Building the decentralized web",
        "picture": "https://example.com/alice.jpg",
        "created_at": 1737906600
    },
    "follows": [
        "did:nostr:32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245",
        "did:nostr:46fcbe3065eaf1ae7811465924e48923363ff3f526bd6f73d7c184147700e3a8"
    ],
    "modified": "2025-01-26T15:50:00Z"
}
```

| Field | Source | Notes |
|---|---|---|
| `service` | kind 10002 relay list | Entries of type `Relay`. Origin-level URLs MUST end in `/` (`wss://relay.example.com/`). The spec says documents SHOULD include relays |
| `profile` | kind 0 | Optional. `created_at` is the kind 0 event's `created_at` in Unix seconds (earlier drafts called it `timestamp`) |
| `follows` | kind 3 | Optional. A list of DIDs. For large follow lists, include a **bounded subset** (the spec suggests 100–500). The complete signed list stays in the kind 3 event on the user's relays |
| `modified` | all of the above | ISO 8601 UTC time of the newest `created_at` among the kind 0, 3 and 10002 events used. Documents that include those parts SHOULD have it. A missing `modified` doesn't mean your cached copy is current |
| `alsoKnownAs` | the controller | Optional. Other identifiers for the same subject: a WebID, an ActivityPub or AT Protocol handle, another DID. These are claims to verify, for example by checking for a link back. Users can put `alsoKnownAs` in their kind 0 profile, which makes the claim signed |

Because `modified` comes only from signed events, every mirror computes the same value for the same state. Use it to avoid overwriting newer data: before publishing a follow list, compare your cached kind 3 `created_at` with the document's `modified` and re-fetch if it's older.

## The Multikey encoding

`publicKeyMultibase` is built from the x-only key like this:

1. Start with the 32-byte x-only key from the identifier.
2. Prepend a parity byte to make a 33-byte compressed key: `0x02` for even y, `0x03` for odd y.
3. Prepend the multicodec varint for secp256k1 public keys, `0xe7 0x01`.
4. Encode as multibase base16-lower, which adds the prefix `f`.

For `124c0f…fdd2` that gives `fe70102124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2`.

**On the parity byte.** Under BIP-340 an x-only key means the point with even y. So a resolver that has only the identifier (minimal resolution) always emits `0x02`. A document the controller publishes MAY carry `0x03` if they hold the full key and its y is odd, for example a key derived by tweaking. **Implementations SHOULD accept both prefixes** (the parity note goes further and says verifiers MUST). The x-coordinate, and so the identifier and BIP-340 signature checks, are the same either way. The repo's [parity model note](https://github.com/nostrcg/did-nostr/blob/gh-pages/parity-model.md) explains this in full.

The spec chose Multikey, rather than a raw-hex encoding, after discussion with the W3C Credentials Community Group about a BIP-340 Data Integrity cryptosuite ([w3c-ccg/community#254](https://github.com/w3c-ccg/community/issues/254)).

## Resolving

The spec's resolution strategy, in order:

1. **HTTP:** fetch `https://<domain>/.well-known/did/nostr/<pubkey>.json` from a domain that hosts the document. Resolvers MAY look for a `didResolver` field in the user's [NIP-05](../guides/nip05-verification.md) `nostr.json` to find such a host.
2. **Offline:** build the minimal document from the key.
3. **Enhanced:** optionally query Nostr relays for kinds 0, 3 and 10002 and add `service`, `profile`, `follows` and `modified`.

This module implements all three, plus conversion to and from `npub`:

```bash
npm i nostr-tools
```

```js
// did.mjs: did:nostr resolution per the CG draft v0.1.1
import { SimplePool } from 'nostr-tools/pool'
import * as nip19 from 'nostr-tools/nip19'

const CONTEXT = [
  'https://www.w3.org/ns/did/v1',
  'https://www.w3.org/ns/cid/v1',
  'https://w3id.org/nostr/context',
]

export function parseDid(did) {
  const m = /^did:nostr:([0-9a-f]{64})$/.exec(did)
  if (!m) throw new Error('not a did:nostr identifier')
  return m[1]
}

// Multikey: 'f' (base16-lower) + 'e701' (secp256k1-pub multicodec) + '02' + x-only key
export function toMultikey(pubkeyHex) {
  return 'fe70102' + pubkeyHex.toLowerCase()
}

// Minimal (offline) resolution: no network needed
export function resolveOffline(did) {
  parseDid(did)
  return {
    '@context': CONTEXT,
    id: did,
    type: 'DIDNostr',
    verificationMethod: [{
      id: `${did}#key1`,
      type: 'Multikey',
      controller: did,
      publicKeyMultibase: toMultikey(parseDid(did)),
    }],
    authentication: ['#key1'],
    assertionMethod: ['#key1'],
  }
}

// HTTP resolution: a domain that hosts the document
export async function resolveHttp(did, domain) {
  const url = `https://${domain}/.well-known/did/nostr/${parseDid(did)}.json`
  const res = await fetch(url)
  if (!res.ok) return null
  const doc = await res.json()
  return doc.id === did ? doc : null
}

// Enhanced resolution: add relays, profile and follows from signed events
export async function resolveEnhanced(did, relays, { maxFollows = 500 } = {}) {
  const pubkey = parseDid(did)
  const doc = resolveOffline(did)
  const pool = new SimplePool()
  // one REQ for all three replaceable kinds; the pool verifies signatures
  const events = await pool.querySync(relays, { kinds: [0, 3, 10002], authors: [pubkey] })
  pool.close(relays)

  // several relays can return different versions: keep the newest per kind
  const latest = {}
  for (const ev of events) {
    if (!latest[ev.kind] || ev.created_at > latest[ev.kind].created_at) latest[ev.kind] = ev
  }

  if (latest[10002]) {
    // keep only valid ws:// or wss:// URLs: relay lists are untrusted input
    const urls = latest[10002].tags
      .filter((t) => t[0] === 'r')
      .flatMap((t) => {
        try {
          const u = new URL(t[1])
          return /^wss?:$/.test(u.protocol) ? [u.href] : []
        } catch {
          return []
        }
      })
    // URL.href adds the trailing slash the spec requires for origin-level relay URLs
    doc.service = [...new Set(urls)].map((url, i) => ({
      id: `${did}#relay${i + 1}`,
      type: 'Relay',
      serviceEndpoint: url,
    }))
  }
  if (latest[0]) {
    try {
      const { name, about, picture, nip05, lud16, website } = JSON.parse(latest[0].content)
      doc.profile = { name, about, picture, nip05, lud16, website, created_at: latest[0].created_at }
    } catch { /* malformed kind 0 content: leave the profile out */ }
  }
  if (latest[3]) {
    // a bounded subset; the full signed list stays on the relays.
    // Taking the last entries assumes clients append new follows.
    const follows = latest[3].tags.filter((t) => t[0] === 'p' && /^[0-9a-f]{64}$/.test(t[1]))
    doc.follows = follows.slice(-maxFollows).map((t) => `did:nostr:${t[1]}`)
  }

  const times = [0, 3, 10002].filter((k) => latest[k]).map((k) => latest[k].created_at)
  if (times.length) doc.modified = new Date(Math.max(...times) * 1000).toISOString().replace('.000Z', 'Z')
  return doc
}

export const npubToDid = (npub) => `did:nostr:${nip19.decode(npub).data}`
export const didToNpub = (did) => nip19.npubEncode(parseDid(did))

// Decoding: accept both parity prefixes; the x-only key is the identifier either way
export function fromMultikey(mb) {
  const m = /^fe7010[23]([0-9a-f]{64})$/.exec(mb)
  if (!m) throw new Error('not a base16 secp256k1 Multikey')
  return m[1]
}
```

Usage:

```js
import { resolveOffline, resolveEnhanced } from './did.mjs'

const did = 'did:nostr:3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d'
console.log(resolveOffline(did))
console.log(await resolveEnhanced(did, ['wss://purplepag.es', 'wss://relay.primal.net', 'wss://relay.nostr.net']))
```

Tested in October 2026 with nostr-tools 2.25.2. `toMultikey` matches all five `key_transformation` test vectors. `resolveOffline` reproduces `minimal_document_2_3_1` exactly. `fromMultikey` passes both `key_decoding` vectors, including odd parity. `resolveEnhanced` was run against live relays for the key above.

Things the code is careful about:

- **One query, newest wins.** It sends one `REQ` for kinds 0, 3 and 10002. Different relays can return different versions of a replaceable event, so it keeps the highest `created_at` per kind instead of taking the first result.
- **Signatures.** `SimplePool` verifies every event before handing it over. Keep that on: the document is only as trustworthy as the events behind it.
- **Bounded follows.** At most `maxFollows` entries go in the document.

To validate an identifier fully, check that the key is on the curve. This uses @noble/curves (`npm i @noble/curves`):

```js
import { secp256k1 } from '@noble/curves/secp256k1.js'

// the spec: resolvers SHOULD check the key is a real x-only secp256k1 point
export function isValidNostrKey(hex) {
  if (!/^[0-9a-f]{64}$/.test(hex)) return false
  try {
    secp256k1.Point.fromHex('02' + hex)
    return true
  } catch {
    return false
  }
}
```

It rejects the all-zero and all-`f` keys from the test vectors, and accepts real keys.

## Hosting documents

To support HTTP resolution, serve documents at `/.well-known/did/nostr/<pubkey>.json`. The spec says the endpoint SHOULD:

- return a complete document, minimal or enhanced,
- use the media type `application/did+json` (or `application/did+ld+json`),
- send `ETag`, `Cache-Control` and `Last-Modified` headers.

Earlier drafts had a `Nostr-Timestamp` header. It has been **removed** in favour of the `modified` field.

A small Node server that resolves on request, using the module above:

```js
// didserver.mjs: serve /.well-known/did/nostr/<pubkey>.json
import http from 'node:http'
import crypto from 'node:crypto'
import { resolveEnhanced } from './did.mjs'

const RELAYS = ['wss://purplepag.es', 'wss://relay.primal.net', 'wss://relay.nostr.net']

http.createServer(async (req, res) => {
  const m = /^\/\.well-known\/did\/nostr\/([0-9a-f]{64})\.json$/.exec(req.url)
  if (!m) return res.writeHead(404).end()

  let doc
  try {
    doc = await resolveEnhanced(`did:nostr:${m[1]}`, RELAYS)
  } catch {
    // never let one bad event take the server down
    return res.writeHead(502).end()
  }
  const body = JSON.stringify(doc)
  const etag = '"' + crypto.createHash('sha256').update(body).digest('hex').slice(0, 16) + '"'
  if (req.headers['if-none-match'] === etag) return res.writeHead(304).end()

  res.writeHead(200, {
    'Content-Type': 'application/did+json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'max-age=3600',
    ETag: etag,
    ...(doc.modified && { 'Last-Modified': new Date(doc.modified).toUTCString() }),
  })
  res.end(body)
}).listen(process.env.PORT ?? 8080)
```

```bash
PORT=8080 node didserver.mjs
curl -i http://localhost:8080/.well-known/did/nostr/3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d.json
```

Tested: it returned `200` with the headers above, `304` when sent the same `If-None-Match`, and `404` for other paths. In production, cache resolved documents instead of querying relays on every request. Serve the endpoint over HTTPS, since resolvers fetch `https://`.

## Operations

- **Create:** generate a secp256k1 key pair with a secure random source and write `did:nostr:` plus the hex public key. See [Keys and signing](../getting-started/keys-and-signing.md).
- **Read:** resolve as above.
- **Update:** the identifier is permanent. The document changes when the user publishes a newer kind 0, 3 or 10002 event. The next resolution reflects it, and `modified` moves forward.
- **Deactivate:** version 0.1.1 defines no key rotation or deactivation. If the key is lost or stolen there is no recovery within the method. The spec lists this as an open item for a future revision.

## Security and privacy

- **The key is everything.** Losing it loses the identifier, and a stolen key can't be revoked.
- **Relays can withhold or filter events**, which affects enhanced resolution. Use several relays and `wss://`.
- **One DID links everything** done with that key. Use separate keys for contexts you want to keep apart.
- **Everything is public:** the document, the profile, the follows and the relay list. Relay choices can hint at a user's region or preferences, and `alsoKnownAs` publicly links identities.

## Implementations

Listed in the spec, status checked October 2026:

| Project | What | Status |
|---|---|---|
| [DID:nostr Explorer](https://nostrapps.github.io/did-explorer/) ([source](https://github.com/nostrapps/did-explorer)) | Web viewer for DID documents, profiles and follows | 🟡 last commit Dec 2025 |
| [nostr-did-resolver](https://github.com/block-core/nostr-did-resolver) | TypeScript resolver using relay discovery, by Blockcore | 🟡 last commit Feb 2026 |
| [create-agent](https://github.com/melvincarvalho/create-agent) | CLI and library that generates did:nostr identities (`npm create agent`) | 🟢 active |

The spec also lists an HTTP resolver at nostr.rocks. It didn't respond when this page was checked. An earlier Rust implementation by Block, Inc. ([TBD54566975/did-nostr](https://github.com/TBD54566975/did-nostr)) is discontinued. The repository's test vectors were generated with the [nostr-did](https://github.com/sirraya-labs/nostr-did) Rust crate.

Implementations may lag behind the current draft. Check their output against the [test vectors](https://github.com/nostrcg/did-nostr/tree/gh-pages/test-vectors).

## See also

- [W3C DID Core](https://www.w3.org/TR/did-core/) and [Controlled Identifiers](https://www.w3.org/TR/cid-1.0/)
- [BIP-340](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki): Schnorr signatures for secp256k1
- [Keys and signing](../getting-started/keys-and-signing.md)
- [Social graph](../guides/social-graph.md)
