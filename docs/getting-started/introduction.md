---
sidebar_position: 1
title: Introduction to Nostr
description: What Nostr is, what it is made of, and where to start building
---

# Introduction to Nostr

**Nostr** ("Notes and Other Stuff Transmitted by Relays") is an open protocol for publishing signed messages. It is not an app or a company. Like email or HTTP, it is a shared format that many independent programs speak, so a post written in one Nostr app can be read in any other.

![Clients connect to several relays over WebSockets](/img/diagrams/nostr-network-simple.svg)

## The three parts

- **Events** are signed JSON objects. A post, a profile, a like, a follow list: each is an event. Anyone can check an event's signature, so nobody has to trust the server that delivered it.
- **Relays** are WebSocket servers that store events and answer queries. They don't talk to each other. Anyone can run one, and each relay sets its own rules.
- **Clients** are the apps people use. They sign events with the user's key, send them to a few relays, and query relays for events to show.

That is the whole core protocol, defined in [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md). Everything else (replies, DMs, zaps, long-form articles) is a convention on top, written up as a **NIP** (Nostr Implementation Possibility).

## Why developers use it

- **Identity is a key pair.** There's no account server. The same key works in every Nostr app, and no operator can take it away. The flip side: there's no password reset either.
- **Data moves with the user.** Posts, follows and profile are events the user signed. Any client can fetch them from any relay that has them.
- **No single point of control.** If one relay blocks you, publish to others. Clients usually read from and write to several.
- **The core is small.** One data type, three client messages, five relay messages. You can talk to a relay with a raw WebSocket and about fifty lines of code ([Relay communication](../protocol/relay-communication.md) shows how).

## Keys, briefly

A Nostr identity is a secp256k1 key pair. Inside events and filters, keys are always **64-character lowercase hex**. The `npub1…` and `nsec1…` strings you see in apps are the same keys in bech32 form ([NIP-19](https://github.com/nostr-protocol/nips/blob/master/19.md)). They are for showing to and copying from humans only, and never go inside an event. [Keys and signing](./keys-and-signing.md) covers both forms and how to keep a secret key safe.

## Where to start

1. **[How Nostr works](./how-nostr-works.md)**: the architecture and how a message travels.
2. **[Keys and signing](./keys-and-signing.md)**: identity, key formats and signers.
3. **[Build your first app](./first-app.md)**: a small web client that reads and posts notes, tested against current libraries.

If you prefer the command line, the wiki's [Quick start](https://github.com/nostrcg/devguide/wiki/Quick-Start) gets you from nothing to a published event with [nak](https://github.com/fiatjaf/nak) in five minutes.

## Specs and community

- [NIPs repository](https://github.com/nostr-protocol/nips): the protocol specifications.
- [W3C Nostr Community Group](https://www.w3.org/community/nostr/): the group behind this guide and the [did:nostr](../protocol/did-nostr.md) spec.
- [Awesome Nostr](https://github.com/aljazceru/awesome-nostr): a community list of projects.
