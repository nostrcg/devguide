---
sidebar_position: 2
title: How Nostr Works
description: Clients, relays and events, and how a message gets from one user to another
---

# How Nostr Works

Nostr has two kinds of program, clients and relays, and one kind of data, the event. This page explains how they fit together. The exact message formats are in the [Protocol](../protocol/overview.md) section.

![A client signs with the user's key and talks to several relays over WebSockets](/img/diagrams/nostr-architecture.svg)

## Clients

A client is anything that speaks the protocol: a phone app, a web page, a bot, a CLI tool. It:

- holds the user's key, or asks a **signer** to sign for it (a browser extension, a phone app or a remote "bunker"),
- builds events and gets them signed,
- opens a WebSocket to each relay it uses, publishes events and sends queries,
- checks the signature of every event it receives, then shows it.

## Relays

A relay is a WebSocket server that accepts events, stores the ones it wants to keep, and answers queries. Relays don't sync with each other or trust each other. Each one decides what to accept: some are open to all, some require payment or [authentication](https://github.com/nostr-protocol/nips/blob/master/42.md), some only store certain kinds of event.

A relay can't forge an event, because it doesn't have the author's key. It can drop events, refuse them, or go offline. That is why clients use several.

## Events

Everything is an event: a post, a profile, a reaction, a follow list, a relay list. An event is JSON with seven fields: `id`, `pubkey`, `created_at`, `kind`, `tags`, `content` and `sig`. The **kind** number says what it is (1 is a short note, 0 a profile, 3 a follow list, 7 a reaction). The full structure is on [Events](../protocol/events.md).

The `id` is the SHA-256 hash of the event's other fields: `[0, pubkey, created_at, kind, tags, content]`, serialized as JSON. The `sig` is a Schnorr signature of that id, made with the author's secret key. Change any field and the id no longer matches. Sign with another key and the signature fails. So anyone can check an event on their own, and relays and clients don't need to trust each other.

## Publishing an event

```
Client                                Relay
  │                                     │
  │  1. build the event                 │
  │  2. sign it                         │
  │                                     │
  │ ──── ["EVENT", {…}] ──────────────► │
  │                                     │  3. check id and signature
  │                                     │  4. apply its own policy, store
  │ ◄─── ["OK", <id>, true, ""] ─────── │
```

The relay answers every `EVENT` with an `OK`. If it rejects the event, the `OK` says `false` and gives a reason such as `rate-limited:` or `auth-required:`. A client usually sends the same event to several relays and treats it as published once at least one says `true`.

## Reading events

```
Client                                Relay
  │                                     │
  │ ──── ["REQ", "feed", {filter}] ───► │
  │                                     │
  │ ◄─── ["EVENT", "feed", {…}] ─────── │  stored events that match
  │ ◄─── ["EVENT", "feed", {…}] ─────── │
  │ ◄─── ["EOSE", "feed"] ───────────── │  end of stored events
  │                                     │
  │ ◄─── ["EVENT", "feed", {…}] ─────── │  new events, as they arrive
  │                                     │
  │ ──── ["CLOSE", "feed"] ───────────► │
```

A **filter** describes what you want: by author, kind, tag, time range, and a limit. The relay sends the stored matches, then `EOSE`, then keeps the subscription open and pushes new matches until the client sends `CLOSE`. A relay can also end a subscription itself with `CLOSED`. See [Filters](../protocol/filters.md) and [Relay communication](../protocol/relay-communication.md).

## Why several relays

- **Redundancy:** relays go down, delete old events, or block users. A copy on another relay survives.
- **Reach:** not everyone reads from the same relays.

It has a cost. Every relay you connect to sees your IP address and what you ask for, so more relays means more operators who can see your activity.

## Finding the right relays

There is no global index, so a client has to know where to look. Each user publishes a **relay list** (kind 10002, [NIP-65](https://github.com/nostr-protocol/nips/blob/master/65.md)). It names the relays they write to and the relays where they want to receive mentions. To read Alice's posts, query Alice's write relays. To make sure Bob sees your reply, also send it to Bob's read relays. This is called the **outbox model**. Skipping it is the most common reason a new client "can't find" posts.

[Building clients](../guides/building-clients.md) and the wiki's [Build a client](https://github.com/nostrcg/devguide/wiki/Build-a-Client) show the routing code.

## Next steps

- [Keys and signing](./keys-and-signing.md): identity and signers.
- [Build your first app](./first-app.md): put it into practice.
- [Protocol overview](../protocol/overview.md): the reference.
