---
sidebar_position: 4
title: Filters
description: How to ask relays for events, the matching rules, and filter code with nostr-tools
---

# Filters

A filter is a JSON object that tells a relay which events you want. You send one or more in a `REQ` message. The relay returns the stored matches, sends `EOSE`, then keeps streaming new matches until you close the subscription. The rules come from [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md).

## Fields

```json
{
  "ids": ["<64-char hex event id>"],
  "authors": ["<64-char hex pubkey>"],
  "kinds": [1, 6, 7],
  "#e": ["<64-char hex event id>"],
  "#p": ["<64-char hex pubkey>"],
  "#t": ["nostr"],
  "since": 1792000000,
  "until": 1792086400,
  "limit": 50
}
```

| Field | Matches events… |
|---|---|
| `ids` | whose `id` is in the list |
| `authors` | whose `pubkey` is in the list |
| `kinds` | whose `kind` is in the list |
| `#<letter>` | with a tag of that single-letter name whose **first value** is in the list (`#e`, `#p`, `#a`, `#t`, `#d`…) |
| `since` | with `created_at >= since` |
| `until` | with `created_at <= until` |
| `limit` | Not a match condition. The maximum number of stored events to return at first, newest first |

Every field is optional.

## Rules that trip people up

- **Exact hex only.** `ids`, `authors`, `#e` and `#p` must hold full 64-character **lowercase hex**. Prefix matching was removed from NIP-01. Decode `npub`/`note`/`nevent` codes to hex first.
- **An empty list matches nothing.** `"authors": []` doesn't mean "any author". The filter can't match, so don't send it. This bites when a follow list hasn't loaded yet.
- **`limit` applies once.** It only shapes the first batch of stored events and is ignored for live events. Relays may return fewer, and often cap it (see their NIP-11 `limitation.max_limit`).
- **`limit: 0`** means "no stored events, just stream new ones".
- **Only single-letter tags are indexed**, and only their first value. You can't filter on `#title` or on the marker of an `e` tag.
- **No text search** in NIP-01. Some relays support a `search` field ([NIP-50](https://github.com/nostr-protocol/nips/blob/master/50.md)).

## How conditions combine

- Values **inside one list** are OR: `{"kinds": [1, 6]}` means kind 1 or kind 6.
- Fields **in one filter** are AND: `{"authors": [A], "kinds": [1]}` means notes *by A*.
- **Several filters** in one `REQ` are OR:

```json
["REQ", "mixed",
  {"authors": ["<alice hex>"], "kinds": [1]},
  {"#p": ["<alice hex>"], "kinds": [1, 7]}
]
```

That subscription returns Alice's notes, plus notes and reactions that mention her.

## Common filters

| Want | Filter |
|---|---|
| A profile | `{"kinds": [0], "authors": [pk]}` |
| Someone's follow list or relay list | `{"kinds": [3], "authors": [pk]}`, `{"kinds": [10002], "authors": [pk]}` |
| A home feed | `{"kinds": [1, 6], "authors": [...follows], "limit": 50}` |
| Replies, reactions, reposts and zaps for a note | `{"kinds": [1, 7, 6, 9735], "#e": [noteId]}` |
| Comments on anything | `{"kinds": [1111], "#E": [id]}` (or `#A` for an addressable root) |
| Notifications | `{"#p": [myPk], "kinds": [1, 7, 6, 9735], "since": lastSeen}` |
| A hashtag | `{"kinds": [1], "#t": ["nostr"], "limit": 50}` |
| An article by address | `{"kinds": [30023], "authors": [pk], "#d": ["hello-nostr"]}` |
| A recent "global" sample | `{"kinds": [1], "limit": 50}` |

Replaceable kinds (0, 3, 10002…) need no `limit`: relays should return only the newest. But when you ask several relays, each may return a different version, so **keep the one with the highest `created_at`** yourself.

## With nostr-tools

```bash
npm i nostr-tools
```

### Subscribe

`subscribeMany(relays, filter, params)` takes **one filter object**, not an array. Older code passed `[filter]`. Since nostr-tools 2.17 that sends an invalid `REQ`, and relays answer with an error and no events.

```js
import { SimplePool } from 'nostr-tools/pool'

const pool = new SimplePool()
const relays = ['wss://relay.primal.net', 'wss://relay.nostr.net']
// any hex pubkey; this one is fiatjaf's
const alice = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d'

const sub = pool.subscribeMany(
  relays,
  { kinds: [1], authors: [alice], limit: 10 },
  {
    onevent(event) {
      console.log('got', event.content)
    },
    oneose() {
      console.log('stored events done; new ones keep arriving')
    },
  }
)

// later
sub.close()
```

The same event often arrives from several relays. Deduplicate by `id`.

### Query once

```js
// waits for EOSE from every relay, then closes; returns an array
const events = await pool.querySync(relays, { kinds: [1], '#t': ['nostr'], limit: 20 })

// the newest single match across relays, or null
const latest = await pool.get(relays, { kinds: [10002], authors: [alice] })
```

### Several filters in one REQ

The pool sends one filter per subscription. To OR several filters in a single `REQ`, open a `Relay` directly:

```js
import { Relay } from 'nostr-tools/relay'

const relay = await Relay.connect('wss://relay.primal.net')
const sub = relay.subscribe([
  { kinds: [1], authors: [alice], limit: 10 },
  { kinds: [1, 7], '#p': [alice], limit: 10 },
], {
  onevent(e) { console.log(e.kind, e.content) },
  oneose() { sub.close(); relay.close() },
})
```

`pool.subscribeMap(requests, params)` sends a different filter to each relay over one pool, which is what you need for the outbox model. See [Building clients](../guides/building-clients.md).

All of the above was run with nostr-tools 2.25.2 against a local `nak serve` relay and relay.primal.net in October 2026. The empty-list rule was checked too: `{ kinds: [1], authors: [] }` returned nothing.

## From the command line

```bash
# 3 recent notes, read-only, from two public relays
nak req -k 1 -l 3 wss://relay.primal.net wss://relay.nostr.net

# by author (fiatjaf's hex pubkey)
nak req -k 1 -a 3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d -l 5 wss://relay.primal.net

# by hashtag
nak req -k 1 -t t=nostr -l 5 wss://relay.primal.net
```

## Being kind to relays

- Ask for what you'll show: set `limit` and a `since` for feeds, and page back with `until` set to the oldest `created_at` you have.
- Close subscriptions you no longer need. Relays limit how many you can hold open (NIP-11 `limitation.max_subscriptions`).
- Split very large `authors` lists into several filters or relays rather than one huge `REQ`.
- Expect relays to differ: some don't keep old events, some only store some kinds, some need [AUTH](./relay-communication.md) before they answer.
