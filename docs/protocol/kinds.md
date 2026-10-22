---
sidebar_position: 3
title: Event Kinds
description: What the kind number means, how relays store each range, and the kinds you will use first
---

# Event Kinds

The `kind` is an integer from 0 to 65535 that says what an event is and how to read its `content` and `tags`. This page covers the storage ranges and the kinds most apps meet first. For the full list, see the kinds table in the [NIPs README](https://github.com/nostr-protocol/nips#event-kinds) or the machine-readable [registry of kinds](https://github.com/nostr-protocol/registry-of-kinds). From the command line, `nak kind 1111` describes any kind.

## Ranges

[NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) groups kinds by how relays store them:

| Kinds | Class | What relays keep |
|---|---|---|
| 1, 2, 4–44, 1000–9999 | **Regular** | Every event |
| 0, 3, 10000–19999 | **Replaceable** | Only the newest per `pubkey` + `kind` |
| 20000–29999 | **Ephemeral** | Nothing: forwarded to live subscribers, not stored |
| 30000–39999 | **Addressable** | Only the newest per `pubkey` + `kind` + `d` tag |

- If two replaceable events have the same `created_at`, the one with the lowest id (in lexical order) wins.
- An addressable event is referenced by its address, `<kind>:<pubkey>:<d>`, in an `a` tag or an `naddr`. These were called "parameterized replaceable events" before NIP-01 renamed them.
- These are conventions. A relay may still keep old versions or refuse some kinds.

:::caution Replaceable events and partial data
When you update a replaceable event (a profile, a follow list, a relay list), the new event **replaces** the old one. Fetch the latest version from the user's relays first, change it, then publish. If you publish a follow list built from a stale or empty copy, the user loses their follows.
:::

## Kinds you'll meet first

| Kind | What | Class | Spec |
|---|---|---|---|
| 0 | Profile metadata | Replaceable | [01](https://github.com/nostr-protocol/nips/blob/master/01.md), [24](https://github.com/nostr-protocol/nips/blob/master/24.md) |
| 1 | Short text note | Regular | [10](https://github.com/nostr-protocol/nips/blob/master/10.md) |
| 3 | Follow list | Replaceable | [02](https://github.com/nostr-protocol/nips/blob/master/02.md) |
| 5 | Deletion request | Regular | [09](https://github.com/nostr-protocol/nips/blob/master/09.md) |
| 6 / 16 | Repost of a kind 1 / of any other kind | Regular | [18](https://github.com/nostr-protocol/nips/blob/master/18.md) |
| 7 | Reaction | Regular | [25](https://github.com/nostr-protocol/nips/blob/master/25.md) |
| 9 | Chat message | Regular | [C7](https://github.com/nostr-protocol/nips/blob/master/C7.md) |
| 11 | Forum thread | Regular | [7D](https://github.com/nostr-protocol/nips/blob/master/7D.md) |
| 13 | Seal | Regular | [59](https://github.com/nostr-protocol/nips/blob/master/59.md) |
| 14 / 15 | Private message / private file message | (never published directly) | [17](https://github.com/nostr-protocol/nips/blob/master/17.md) |
| 20 / 21 / 22 | Picture / video / short video | Regular | [68](https://github.com/nostr-protocol/nips/blob/master/68.md), [71](https://github.com/nostr-protocol/nips/blob/master/71.md) |
| 62 | Request to vanish | — (45–999: no NIP-01 rule) | [62](https://github.com/nostr-protocol/nips/blob/master/62.md) |
| 1059 | Gift wrap | Regular | [59](https://github.com/nostr-protocol/nips/blob/master/59.md) |
| 1111 | Comment | Regular | [22](https://github.com/nostr-protocol/nips/blob/master/22.md) |
| 1984 | Report | Regular | [56](https://github.com/nostr-protocol/nips/blob/master/56.md) |
| 9734 / 9735 | Zap request / zap receipt | Regular | [57](https://github.com/nostr-protocol/nips/blob/master/57.md) |
| 10000 | Mute list | Replaceable | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) |
| 10001 / 10003 | Pinned notes / bookmarks | Replaceable | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) |
| 10002 | Relay list | Replaceable | [65](https://github.com/nostr-protocol/nips/blob/master/65.md) |
| 10050 | Relays for receiving DMs | Replaceable | [17](https://github.com/nostr-protocol/nips/blob/master/17.md) |
| 10063 | Blossom media servers | Replaceable | [B7](https://github.com/nostr-protocol/nips/blob/master/B7.md) |
| 13194 / 23194 / 23195 | Wallet Connect info / request / response | Replaceable / ephemeral | [47](https://github.com/nostr-protocol/nips/blob/master/47.md) |
| 22242 | Relay authentication | Ephemeral | [42](https://github.com/nostr-protocol/nips/blob/master/42.md) |
| 24133 | Remote signing | Ephemeral | [46](https://github.com/nostr-protocol/nips/blob/master/46.md) |
| 27235 | HTTP auth | Ephemeral | [98](https://github.com/nostr-protocol/nips/blob/master/98.md) |
| 30000 | Follow sets | Addressable | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) |
| 30023 | Long-form article | Addressable | [23](https://github.com/nostr-protocol/nips/blob/master/23.md) |
| 30078 | App-specific data | Addressable | [78](https://github.com/nostr-protocol/nips/blob/master/78.md) |
| 39000–39009 | Group metadata (written by the relay) | Addressable | [29](https://github.com/nostr-protocol/nips/blob/master/29.md) |

Kind 4 (NIP-04 encrypted DMs) is **unrecommended**: it leaks metadata (who talks to whom, and when) and its encryption is not state of the art. Use NIP-17 instead (below).

## Examples

The examples show only `kind`, `tags` and `content`. Each was signed and accepted by a relay when this page was written.

### Kind 0: profile

`content` is a JSON object, as a string. `name` is the short handle and `display_name` the longer, richer name. Clients should still set `name`.

```json
{
  "kind": 0,
  "tags": [],
  "content": "{\"name\":\"alice\",\"display_name\":\"Alice 🌻\",\"about\":\"Building on Nostr\",\"picture\":\"https://example.com/alice.jpg\",\"nip05\":\"alice@example.com\",\"lud16\":\"alice@example.com\",\"website\":\"https://example.com\"}"
}
```

Other fields from [NIP-24](https://github.com/nostr-protocol/nips/blob/master/24.md) include `banner` and `bot`. `nip05` is a verified handle ([NIP-05](../guides/nip05-verification.md)) and `lud16` a Lightning address for [zaps](../guides/zaps.md).

### Kind 1: note

Plain text. Mentions are `nostr:` URIs in the text ([NIP-27](https://github.com/nostr-protocol/nips/blob/master/27.md)), and replies use marked `e` tags. See [Events → Replies](./events.md).

### Kind 3: follow list

One `p` tag per follow. The relay URL and the petname are optional. `content` is not used: put relays in kind 10002, not here.

```json
{
  "kind": 3,
  "content": "",
  "tags": [
    ["p", "b0eac043f3e04418711b47c72d44481e3d6b1fde19202a2c0d9b4580f934c4f3", "wss://relay.primal.net", "alice"],
    ["p", "7e7e9c42a91bfef19fa929e5fda1b72e0ebc1a4c1141673e2794234d86addf4e"]
  ]
}
```

### Kind 5: deletion request

Lists the events to delete (`e` for ids, `a` for addresses) and their kinds (`k`). Relays should delete referenced events by the same author. It is a request: copies elsewhere may survive.

```json
{
  "kind": 5,
  "content": "posted by mistake",
  "tags": [
    ["e", "3840c24f14afcc3682d145f3d8a5a8684a273294470f88c38827ad6ed035b569"],
    ["k", "1"]
  ]
}
```

### Kind 7: reaction

`+` is a like, `-` a dislike, and any other content an emoji reaction. Tag the event, its author and its kind.

```json
{
  "kind": 7,
  "content": "+",
  "tags": [
    ["e", "3840c24f14afcc3682d145f3d8a5a8684a273294470f88c38827ad6ed035b569", "wss://relay.primal.net", "b0eac043f3e04418711b47c72d44481e3d6b1fde19202a2c0d9b4580f934c4f3"],
    ["p", "b0eac043f3e04418711b47c72d44481e3d6b1fde19202a2c0d9b4580f934c4f3"],
    ["k", "1"]
  ]
}
```

### Kind 10002: relay list

The **outbox model**. An `r` tag with no marker means read and write. `write` relays are where the user posts, so read their notes there. `read` relays are where they want to receive mentions, so send replies there too.

```json
{
  "kind": 10002,
  "content": "",
  "tags": [
    ["r", "wss://relay.primal.net/"],
    ["r", "wss://nos.lol/", "write"],
    ["r", "wss://relay.nostr.net/", "read"]
  ]
}
```

DMs use a separate list, kind 10050, with `relay` tags.

### Kind 10000: mute list

Public entries go in tags. A list can also hold private entries, encrypted to the user's own key, in `content` ([NIP-51](https://github.com/nostr-protocol/nips/blob/master/51.md)).

```json
{
  "kind": 10000,
  "content": "",
  "tags": [
    ["p", "b0eac043f3e04418711b47c72d44481e3d6b1fde19202a2c0d9b4580f934c4f3"],
    ["t", "spam"],
    ["word", "giveaway"],
    ["e", "3840c24f14afcc3682d145f3d8a5a8684a273294470f88c38827ad6ed035b569"]
  ]
}
```

### Kind 30000: follow set

A named group of people. Each `d` value is a separate list.

```json
{
  "kind": 30000,
  "content": "",
  "tags": [
    ["d", "nostr-devs"],
    ["title", "Nostr devs"],
    ["p", "b0eac043f3e04418711b47c72d44481e3d6b1fde19202a2c0d9b4580f934c4f3"],
    ["p", "7e7e9c42a91bfef19fa929e5fda1b72e0ebc1a4c1141673e2794234d86addf4e"]
  ]
}
```

### Kind 30023: long-form article

Markdown in `content`. The `d` tag is the article's stable identifier. Publishing again with the same `d` replaces it.

```json
{
  "kind": 30023,
  "content": "# Hello\n\nMarkdown body…",
  "tags": [
    ["d", "hello-nostr"],
    ["title", "Hello, Nostr"],
    ["summary", "A first article"],
    ["published_at", "1792650000"],
    ["t", "nostr"]
  ]
}
```

### Kind 1111: comment

Comments work on any event, address or external id. Uppercase tags point at the **root** of the thread, lowercase at the **parent**. For a top-level comment they're the same. Because the parent here is addressable, the comment also carries an `e` tag with the version's id.

```json
{
  "kind": 1111,
  "content": "Great article!",
  "tags": [
    ["A", "30023:b0eac043f3e04418711b47c72d44481e3d6b1fde19202a2c0d9b4580f934c4f3:hello-nostr", "wss://nos.lol/"],
    ["K", "30023"],
    ["P", "b0eac043f3e04418711b47c72d44481e3d6b1fde19202a2c0d9b4580f934c4f3"],
    ["a", "30023:b0eac043f3e04418711b47c72d44481e3d6b1fde19202a2c0d9b4580f934c4f3:hello-nostr", "wss://nos.lol/"],
    ["e", "3840c24f14afcc3682d145f3d8a5a8684a273294470f88c38827ad6ed035b569", "wss://nos.lol/"],
    ["k", "30023"],
    ["p", "b0eac043f3e04418711b47c72d44481e3d6b1fde19202a2c0d9b4580f934c4f3"]
  ]
}
```

### Kind 30078: app data

Settings or state for one app, under a `d` tag the app chooses. The content is up to the app and is public unless you encrypt it.

```json
{
  "kind": 30078,
  "content": "{\"theme\":\"dark\"}",
  "tags": [["d", "com.example.myapp/settings"]]
}
```

## Private messages: kinds 14, 13 and 1059

[NIP-17](https://github.com/nostr-protocol/nips/blob/master/17.md) DMs nest three events:

1. The message is a kind 14 **rumor**: an event that is never signed, so it can't be proven if it leaks.
2. It is encrypted with [NIP-44](https://github.com/nostr-protocol/nips/blob/master/44.md) into a kind 13 **seal**, signed by the sender.
3. The seal is encrypted again into a kind 1059 **gift wrap**, signed by a random one-time key and tagged only with the recipient.

Relays see only gift wraps from random keys. Send one wrap per recipient plus one to yourself, to each recipient's kind 10050 relays. After unwrapping, check that the seal's `pubkey` matches the rumor's `pubkey`. The wiki's [Build a client](https://github.com/nostrcg/devguide/wiki/Build-a-Client) lists the other traps.

## Zaps: kinds 9734 and 9735

A **zap request** (9734) is signed by the sender and sent over HTTP to the recipient's LNURL `callback` URL. It is not published to relays. When the invoice is paid, the recipient's LNURL server publishes a **zap receipt** (9735). The receipt has the `bolt11` invoice and the original request in a `description` tag. Clients must validate receipts as NIP-57 describes. See [Zaps](../guides/zaps.md).

## Picking a kind for something new

- Check the [NIPs README](https://github.com/nostr-protocol/nips#event-kinds) and the [registry of kinds](https://github.com/nostr-protocol/registry-of-kinds) first. Reuse an existing kind if it fits.
- Pick the range by storage: regular for things that accumulate, replaceable for one-per-user state, addressable for many named documents per user, ephemeral for signals.
- For one app's settings or state, kind 30078 may be enough.
