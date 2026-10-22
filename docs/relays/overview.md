---
sidebar_position: 1
title: Relays Overview
description: Understanding Nostr relays and their role in the network
---

# Relays Overview

A relay is a WebSocket server that accepts signed events from clients, stores some of them, and sends them to clients whose subscriptions match. Relays don't talk to each other unless an operator sets that up. Clients pick which relays to read from and write to.

![Relay Network Topology](/img/diagrams/relay-topology.svg)

The message formats (`EVENT`, `REQ`, `CLOSE`, `OK`, `EOSE`, `CLOSED`, `NOTICE`) are on [Relay Communication](../protocol/relay-communication.md). This section is about choosing, running and operating relays.

## What NIP-01 asks of a relay

- Answer every `EVENT` with an `OK`: `true` if accepted, `false` plus a prefixed reason (`blocked:`, `rate-limited:`, `invalid:`, `pow:`, `restricted:`, `mute:`, `error:`). A `duplicate:` reply comes with `true`.
- Send stored matches for a `REQ`, then `EOSE`, then keep the subscription open for new events.
- Send `CLOSED` with a reason when it refuses a `REQ` or ends a subscription itself.
- Treat an empty filter list (`"authors": []`) as matching nothing.
- Keep only the newest version of replaceable (0, 3, 10000–19999) and addressable (30000–39999) events.

NIP-01 says regular events are "expected to be stored", but relays decide what they keep and for how long. Rate limits, auth ([NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md)), payment, kind allowlists and deleting old events are all up to the operator. A relay must never change an event: the signature would break.

## Why clients use several relays

| Reason | What it means |
|---|---|
| Redundancy | If one relay is down or deletes your notes, copies exist elsewhere. |
| Reach | Your followers read from their relays, not yours. NIP-65 tells them where to look. |
| Features | Search (NIP-50), negentropy sync (NIP-77), groups (NIP-29) and media are offered by some relays only. |

Each extra relay also sees your IP address and what you ask for. More relays means more redundancy, not more privacy.

## Kinds of relay

- **Public**: anyone can read and write. Most have rate limits and spam filters.
- **Paid**: you pay once or by subscription to write. nostream supports this out of the box.
- **Personal**: one owner writes; others may read or send to an inbox. HAVEN and chorus work this way.
- **Community or invite-only**: members only, often through NIP-42 auth or NIP-43 membership. pyramid and zooid do this.
- **Special purpose**: indexers that collect profiles and relay lists (`wss://purplepag.es`), search relays, monitors that publish NIP-66 reports.

Software for each is on [Relay Implementations](./implementations.md).

## Finding relays

**NIP-65 relay lists.** Each user publishes a kind 10002 event with `r` tags. A `read` or `write` marker limits a tag to one direction; no marker means both. Indexer relays collect these lists:

```bash
nak req -k 10002 \
  -a 3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d \
  wss://purplepag.es
```

The output has tags like `["r","wss://pyramid.fiatjaf.com/","write"]` and `["r","wss://inbox.relays.land/","read"]`. Clients that follow the "outbox model" read a person's notes from their write relays and send mentions to their read relays.

**NIP-11 relay information.** An HTTP `GET` with `Accept: application/nostr+json` on the relay URL returns its name, software, supported NIPs and limits:

```bash
curl -H 'Accept: application/nostr+json' https://relay.primal.net
```

Field reference: [Relay Information](../reference/relay-info.md).

**NIP-66 monitors.** Monitors probe relays and publish the results as kind 30166 events. You can query them with `nak` to find relays that are up and support a given NIP. See [Relay Explorers](./explorers.md).

## Relays to start with

Checked Oct 2026: `wss://relay.primal.net`, `wss://nos.lol`, `wss://relay.nostr.net` for general use, and `wss://purplepag.es` for profiles and relay lists. For local development, run `nak serve` (an in-memory relay at `ws://localhost:10547`). Don't hard-code a long list in your app: read the user's kind 10002 and fall back to a few defaults.

## In this section

1. [Relay Implementations](./implementations.md): which software to run, with maintenance status.
2. [Running a Relay](./running-a-relay.md): install and run strfry, nostr-rs-relay, nostream or your own khatru relay.
3. [Configuration](./configuration.md): the real config keys for strfry, nostr-rs-relay and nostream.
4. [Reverse Proxy](./reverse-proxy.md): TLS with nginx, Caddy or HAProxy.
5. [Hosting](./hosting.md): what kind of server you need.
6. [Relay Explorers](./explorers.md): check relays and query NIP-66 monitors.
7. [Sync Tools](./sync-tools.md): copy events between relays with negentropy.
