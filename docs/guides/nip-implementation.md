---
sidebar_position: 4
title: Implementing NIPs
description: How to read, implement and test Nostr Implementation Possibilities (NIPs)
---

# Implementing NIPs

NIPs are **Nostr Implementation Possibilities**: short specs in [nostr-protocol/nips](https://github.com/nostr-protocol/nips). Only NIP-01 is required. Everything else is optional, and a NIP matters only when clients and relays actually implement it. This page covers how to approach a NIP, and points to the pages where the common ones are implemented with tested code.

## Read the NIP, then check reality

1. **Read the NIP itself** on GitHub master, not a summary. NIPs change: kind 3's relay `content` is deprecated in favour of NIP-65, NIP-39 identities moved from kind 0 to kind 10011, and NIP-46 now separates the remote-signer key from the user key.
2. **Check its status** in the [README](https://github.com/nostr-protocol/nips#list). Struck-through entries are **unrecommended**, among them NIP-04 (use NIP-17), NIP-06, NIP-26, NIP-28 and NIP-72 (use NIP-29), NIP-15 (use NIP-99) and NIP-90. Each NIP is also marked `draft` or `final`, and `optional` or `mandatory`.
3. **Check the kind numbers** against the README's kinds table, and follow the NIP-01 ranges: 1000–9999 regular, 10000–19999 replaceable, 20000–29999 ephemeral, 30000–39999 addressable. Kinds 0 and 3 are replaceable too.
4. **Look at an existing implementation.** nostr-tools, Nostr Dev Kit (nostr-sdk, formerly rust-nostr) and NDK implement most NIPs. Reading theirs shows you the edge cases, and testing against them catches interoperability bugs. See [Libraries](../libraries/overview.md).
5. **Ask what clients actually do.** For anything with many implementations (threads, zaps, DMs), check what popular clients emit before you decide what to accept. Be strict in what you send and tolerant in what you read.

## Where each NIP is implemented in this guide

| NIP | What | Where |
|---|---|---|
| 01 | Events, filters, relay messages | [Events](../protocol/events.md), [Filters](../protocol/filters.md), [Relay communication](../protocol/relay-communication.md) |
| 02, 51 | Follow lists, mute lists | [Social graph](./social-graph.md) |
| 05 | `name@domain` identifiers | [NIP-05 verification](./nip05-verification.md) |
| 07, 46, 55 | Signers | [Building clients](./building-clients.md), [Mobile development](./mobile-development.md) |
| 10, 25, 27 | Replies, reactions, mentions | [Building clients](./building-clients.md) |
| 11 | Relay information document | [Relay information](../reference/relay-info.md) |
| 19 | `npub`, `nevent`, `naddr` … | [Keys and signing](../getting-started/keys-and-signing.md) |
| 44 | Encryption | [Testing](./testing.md) (round-trip test). Use it through a signer's `nip44` methods |
| 49 | Encrypted secret keys | [Key management](./key-management.md) |
| 57 | Zaps | [Lightning zaps](./zaps.md) |
| 65 | Relay lists, outbox model | [Building clients](./building-clients.md) |
| 85 | Trusted assertions | [Social graph](./social-graph.md) |
| All | Index and statuses | [NIPs overview](../protocol/nips.md), [NIP index](../reference/nip-index.md) |

## Example: NIP-42 relay authentication

NIP-42 isn't covered elsewhere in the guides, so here it is in full. A relay that requires AUTH sends a challenge and rejects writes or reads with an `auth-required:` prefix. The client signs a kind 22242 event containing the challenge and the relay URL, and retries. nostr-tools does the retry when you give it an `onauth` signer. Tested with nostr-tools 2.25.2 against `nak serve --auth`:

```js
import { generateSecretKey, finalizeEvent } from 'nostr-tools/pure'
import { SimplePool } from 'nostr-tools/pool'

const sk = generateSecretKey()
// a local test signer; in an app, use window.nostr or a BunkerSigner
const signer = { signEvent: async t => finalizeEvent(t, sk) }
const relays = [process.env.RELAY ?? 'ws://localhost:10547']
const pool = new SimplePool()
// sign the relay's kind 22242 challenge when it says auth-required
const onauth = template => signer.signEvent(template)

const note = await signer.signEvent({
  kind: 1, created_at: Math.floor(Date.now() / 1000), tags: [], content: 'hello',
})
const results = await Promise.allSettled(pool.publish(relays, note, { onauth }))
// connection failures reject with a string, relay rejections with an Error
console.log(results.map(r => r.status === 'fulfilled' ? 'ok' : String(r.reason?.message ?? r.reason)))

// reads too: querySync has no onauth, so subscribe
const reader = new SimplePool()
reader.subscribeEose(relays, { ids: [note.id] }, {
  onauth,
  onevent: ev => console.log('read back', ev.id === note.id),
  // stored events are in: close both pools so the script exits
  oneose: () => { reader.close(relays); pool.close(relays) },
})
```

```text
[ 'ok' ]
read back true
```

Without `onauth`, the same publish fails with `auth-required: event`. `querySync` and `get` don't take `onauth`, so use `subscribe` or `subscribeEose` to read from relays that require AUTH. Authenticate only to relays the user chose: AUTH tells the relay who the user is.

## Testing your implementation

- Test against a throwaway relay (`nak serve`, or `nak serve --auth` for NIP-42), never against public relays. [Testing](./testing.md) has a ready-made Vitest and Playwright setup.
- Check your events with `nak verify`, and check your filters with nostr-tools' `matchFilter`.
- Test with input you didn't write: real events pulled from relays (`nak req -l 200 wss://relay.primal.net > sample.jsonl`). Real data has missing tags, extra fields and odd encodings that hand-written fixtures don't.
- Use the test vectors in the NIP, where it has them (NIP-44 and NIP-49 do).
