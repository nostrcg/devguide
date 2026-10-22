---
sidebar_position: 1
title: Protocol Overview
description: A map of the Nostr protocol and of the pages in this section
---

# Protocol Overview

Nostr is small. Clients sign JSON **events** and send them to **relays** over WebSockets. Relays store events and answer **filters**. Everything else is a convention on top, written up as a **NIP**. This section is the reference. Each topic has one page:

| Page | What it covers |
|---|---|
| [Events](./events.md) | The event structure, how the id and signature are computed, tags, and creating and verifying events in code |
| [Event kinds](./kinds.md) | What the `kind` number means, the four storage classes, and the kinds you'll meet first |
| [Filters](./filters.md) | How to ask a relay for events, with nostr-tools examples |
| [NIPs](./nips.md) | How the specs are organised, which ones to start with, and which not to build on |
| [Relay communication](./relay-communication.md) | Every message on the wire, `OK`/`CLOSED` reasons, AUTH, and a raw WebSocket client |
| [DID:Nostr](./did-nostr.md) | Using a Nostr key as a W3C Decentralized Identifier |

## Design

- **Signed data, untrusted servers.** Every event carries its author's signature, so relays can't forge or alter it. Clients verify events themselves.
- **Dumb relays, smart clients.** Relays store and forward. Clients decide where to publish, where to read, and how to show things.
- **No global state.** There is no central index or consensus. Each relay has its own subset of events, and users say where their events live ([NIP-65](https://github.com/nostr-protocol/nips/blob/master/65.md) relay lists).
- **Extend by convention.** New features are new event kinds and tags, described in NIPs. Software ignores what it doesn't understand.

![Protocol layers: transport, core protocol, NIPs, applications](/img/diagrams/protocol-stack.svg)

## The pieces

**Transport.** One WebSocket per relay (`wss://…`, or `ws://` for local development). Every message is a JSON array whose first element names the message type: `EVENT`, `REQ` and `CLOSE` from client to relay, and `EVENT`, `OK`, `EOSE`, `CLOSED` and `NOTICE` back. `AUTH` ([NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md)) and `COUNT` ([NIP-45](https://github.com/nostr-protocol/nips/blob/master/45.md)) are common extensions. → [Relay communication](./relay-communication.md)

**Events.** Seven fields: `id`, `pubkey`, `created_at`, `kind`, `tags`, `content`, `sig`. → [Events](./events.md)

**Kinds.** An integer from 0 to 65535 that says what an event is. Its range also says how relays store it: regular, replaceable, ephemeral or addressable. → [Event kinds](./kinds.md)

**Filters.** JSON objects that select events by id, author, kind, tag and time. → [Filters](./filters.md)

**Cryptography.** Keys are secp256k1. The public key is the 32-byte x-coordinate, written as 64 lowercase hex characters. The event id is the SHA-256 of a fixed JSON serialization, and `sig` is a [BIP-340](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki) Schnorr signature of the id. → [Keys and signing](../getting-started/keys-and-signing.md)

## A note, end to end

Alice posts. Bob is already subscribed to her notes on the same relay.

```
Alice                         Relay                          Bob
  │                             │                              │
  │                             │ ◄── ["REQ","s",{authors:[A]}]│
  │                             │ ── ["EOSE","s"] ───────────► │
  │                             │                              │
  │ ── ["EVENT",{note}] ──────► │                              │
  │ ◄── ["OK",id,true,""] ───── │                              │
  │                             │ ── ["EVENT","s",{note}] ───► │
  │                             │                              │
```

In practice Alice publishes to her own write relays, and Bob's client finds those relays from her kind 10002 list. See [How Nostr works](../getting-started/how-nostr-works.md).

## What the protocol does and doesn't promise

**It does:**

- Events can't be forged or changed without the author's key.
- Anyone can run a relay and anyone can write a client.
- A user can take their events to any relay.

**It doesn't:**

- **Delivery or storage.** Relays can go offline, drop events or refuse them.
- **Deletion.** A deletion request ([NIP-09](https://github.com/nostr-protocol/nips/blob/master/09.md)) asks relays to remove events. Copies may survive.
- **Privacy by default.** Most events are public. Relays see your IP and your queries. Private messages need [NIP-17](https://github.com/nostr-protocol/nips/blob/master/17.md).
- **Ordering.** `created_at` is set by the author's clock, and relays send events in no guaranteed order across relays.

## Look things up

- [NIPs repository](https://github.com/nostr-protocol/nips), and [nips.nostr.com](https://nips.nostr.com) for searching it.
- `nak nip 01` prints a NIP in your terminal, and `nak kind 1111` describes a kind.
- The wiki's [Protocol basics](https://github.com/nostrcg/devguide/wiki/Protocol-Basics) puts the essentials on one page.
