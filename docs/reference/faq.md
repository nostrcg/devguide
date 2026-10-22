---
sidebar_position: 4
title: FAQ
description: Short answers to common Nostr development questions, with links to the full pages
---

# Frequently Asked Questions

Short answers, each with a link to the page that covers the topic in full.

## General

### What is Nostr?

An open protocol. Users sign JSON events with their own keys and publish them to relays, which are simple servers that store
and forward events. Clients read from whichever relays they like. See [Introduction](../getting-started/introduction.md).

### Is Nostr encrypted?

Events are public by default. For private messages, use [NIP-17](https://github.com/nostr-protocol/nips/blob/master/17.md):
the message is encrypted with [NIP-44](https://github.com/nostr-protocol/nips/blob/master/44.md) and wrapped in a
[NIP-59](https://github.com/nostr-protocol/nips/blob/master/59.md) gift wrap (kind `1059`), which also hides who is talking
to whom. NIP-04 (kind `4`) is unrecommended: it leaks metadata and has weaker encryption. Read it only for old messages.

### Can I delete my posts?

You can publish a kind `5` deletion request ([NIP-09](https://github.com/nostr-protocol/nips/blob/master/09.md)). Relays
and clients may honor it, but nothing forces them to, and copies may already exist elsewhere. Treat anything you publish as
permanent. [NIP-62](https://github.com/nostr-protocol/nips/blob/master/62.md) "request to vanish" asks relays to drop
everything from a key.

### Where is the full list of NIPs and kinds?

[NIP Index](nip-index.md) and [Event Kinds](event-kinds.md), both generated from the NIPs repository. The NIPs README is
the source.

## Keys and identity

### What if I lose my secret key?

It's gone. There is no reset. Back it up, ideally encrypted with
[NIP-49](https://github.com/nostr-protocol/nips/blob/master/49.md) (`ncryptsec1…`). See
[Key Management](../guides/key-management.md).

### Can I change my key?

Not in a way the protocol understands. You publish from the new key, tell people from the old one, and they re-follow.

### How should my app get the user's key?

Don't ask for it. Let the user sign with a signer they control:

- [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md) browser extension (`window.nostr`). Required methods are
  `getPublicKey()` and `signEvent()`. `nip44.encrypt`/`nip44.decrypt` are optional; the `nip04` methods are deprecated.
- [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md) remote signer (a "bunker"), which works from any platform.
- [NIP-55](https://github.com/nostr-protocol/nips/blob/master/55.md) Android signer app, such as Amber.

The wiki's [Signers & login](https://github.com/nostrcg/devguide/wiki/Extensions) page has tested code and a list of
signers that are maintained.

## Events

### How big can an event be?

It depends on the relay. Its [NIP-11](relay-info.md) document may list `limitation.max_message_length` (bytes in one
WebSocket message, which caps the whole event) and `max_content_length` (characters in `content`). Relays that don't
publish limits may still enforce them.

### Can I edit an event?

No. An event's id is a hash of its pubkey, `created_at`, kind, tags and content, and the signature covers the id. What you can do depends on the kind:

- **Replaceable** (`0`, `3`, `10000`–`19999`): publish a newer one; relays keep the latest per pubkey and kind.
- **Addressable** (`30000`–`39999`): publish a newer one with the same `d` tag.
- **Regular**: publish a correction, or delete and repost.

Ranges are in [Event Kinds](event-kinds.md#kind-ranges).

### Why doesn't my event show up?

Check the relay's `OK` reply. It says `true` or `false`, plus a message whose prefix explains a rejection: `invalid:`,
`pow:`, `blocked:`, `rate-limited:`, `restricted:`, `mute:`, `auth-required:` or `error:`. A `duplicate:` message comes with
`true`: the relay already has the event.

In nostr-tools, `pool.publish()` returns **an array of promises**, one per relay. Await them together:

```js
import { SimplePool } from 'nostr-tools/pool'
import { finalizeEvent, generateSecretKey, verifyEvent } from 'nostr-tools/pure'

const sk = generateSecretKey()
const event = finalizeEvent(
  { kind: 1, created_at: Math.floor(Date.now() / 1000), tags: [], content: 'hello' },
  sk,
)
console.log('valid locally:', verifyEvent(event))

const relays = ['ws://localhost:10547', 'ws://localhost:10548']
const pool = new SimplePool()

const results = await Promise.allSettled(pool.publish(relays, event))
results.forEach((r, i) =>
  console.log(relays[i], r.status === 'fulfilled' ? `ok: ${r.value}` : `failed: ${r.reason}`),
)
pool.close(relays)
```

Tested with nostr-tools 2.25.2 and two `nak serve` relays. A rejected or unreachable relay shows up as `failed`. Use
`Promise.any(...)` when one success is enough.

Also check that the client reads from the relays you wrote to. Most clients read a user's notes from their
[NIP-65](https://github.com/nostr-protocol/nips/blob/master/65.md) write relays (kind `10002`).

### My filter returns nothing

Common causes:

- `ids`, `authors` and `#e`/`#p` values must be exact 64-character lowercase hex. Prefixes and npubs don't match.
- An empty list such as `"authors": []` matches nothing.
- The relay never saw the event, or clamps `limit` to its `max_limit`.

See [Filters](../protocol/filters.md).

## Relays

### Which relays should I use?

For a user, the relays in their kind `10002` list. For defaults in examples and tests, these answered well in October 2026:
`wss://relay.primal.net`, `wss://relay.nostr.net` and `wss://nos.lol`, plus `wss://purplepag.es` for looking up profiles
and relay lists. For tests that write, run `nak serve` locally (`ws://localhost:10547`).

Relays come and go. Check current status with the tools in [Relay Explorers](../relays/explorers.md) before you hard-code one.

### How many relays should a client use?

Write to the user's own write relays. To read someone's notes, use their write relays (the "outbox" model). This scales
better than connecting everyone to the same handful of big relays. See [Building Clients](../guides/building-clients.md).

### Does SimplePool reconnect for me?

Not reliably. nostr-tools 2.x has an `enableReconnect` option, but in our October 2026 test (2.25.2) a subscription was closed, not resumed, when its relay restarted. Resubscribe yourself with a `since` filter: see the tested wrapper in [Relay communication](../protocol/relay-communication.md).

### How do I check what a relay supports?

Fetch its NIP-11 document and read `supported_nips` and `limitation`. Code is in [Relay Information](relay-info.md).
Only relay-side NIPs belong there; features such as zaps live in clients and wallets, not relays.

### How do I run my own relay?

See [Running a Relay](../relays/running-a-relay.md) and [Relay Implementations](../relays/implementations.md).

## Development

### Which library should I use?

See [Libraries](../libraries/overview.md). In short: nostr-tools for JavaScript and TypeScript, Nostr Dev Kit (formerly
rust-nostr) for Rust and its bindings, `nostr-sdk` for Python, and `fiatjaf.com/nostr` for Go (go-nostr is archived).

### How do I test without touching real users?

Use throwaway keys and a local relay: `nak serve` starts one in memory. See [Testing](../guides/testing.md) and
[Command Snippets](snippets.md).

## Getting help

- NIP discussions: [nostr-protocol/nips](https://github.com/nostr-protocol/nips) issues and pull requests
- This guide: [nostrcg/devguide](https://github.com/nostrcg/devguide) issues, and the
  [wiki](https://github.com/nostrcg/devguide/wiki)
- Bugs in a library or relay: that project's own issue tracker
