---
sidebar_position: 7
title: Relay Explorers
description: Tools for exploring and monitoring Nostr relays
---

# Relay Explorers

How to find relays that are up, see what they support, and measure response times. Useful when you choose default relays for a client, and when you check your own relay. In 2026 the most reliable source is the raw data: NIP-66 monitor events, which you can query with `nak`.

All commands on this page were tested on 22 October 2026 with nak v0.21.2 and `jq`.

## Check one relay

```bash
# NIP-11 info: name, software, supported NIPs, limits
curl -H 'Accept: application/nostr+json' https://relay.primal.net | jq

# the same through nak
nak relay relay.primal.net

# does it answer a query? nak closes after EOSE
nak req -k 1 -l 1 wss://relay.primal.net
```

The `software` and `supported_nips` fields tell you what a relay runs. For example, relay.primal.net reports `git+https://github.com/hoytech/strfry.git` and NIPs 1, 2, 4, 9, 11, 28, 40, 45, 70. Field reference: [Relay Information](../reference/relay-info.md).

Some relays turn away command-line tools with a 503 or 403 even though they work in browsers. Before you call a relay dead, check its NIP-66 reports below.

## Query relay monitors yourself (NIP-66)

[NIP-66](https://github.com/nostr-protocol/nips/blob/master/66.md) monitors probe relays and publish what they find as Nostr events:

| Kind | What it is |
|---|---|
| **30166** | One relay's status, re-published by each monitor at regular intervals. Addressable: `d` is the relay URL. |
| **10166** | A monitor's announcement: `frequency` (seconds) and the `c` checks it runs (`open`, `read`, `nip11`, `dns`, `ssl`, …). |

Tags on a 30166 report:

- `rtt-open`, `rtt-read`, `rtt-write`: round-trip times in ms
- `N`: supported NIPs
- `R`: requirements (`auth`, `!payment`, …)
- `n`: network (`clearnet`, `tor`, …)
- `T`: relay type
- `t`: topics; `k`: accepted kinds
- `g`: geohash

Relays that collect these reports (checked Oct 2026): `wss://monitorlizard.nostr1.com` (fresh data from several monitors) and `wss://relay.nostr.watch`.

**Latest reports on any relay:**

```bash
nak req -k 30166 -l 3 wss://monitorlizard.nostr1.com
```

**Reports about one relay.** Monitors write the `d` tag as a normalised URL with a trailing slash:

```bash
nak req -k 30166 -d wss://nos.lol/ -l 2 wss://monitorlizard.nostr1.com
```

**Relays that support a NIP**, here NIP-77 negentropy, with their connect time in ms:

```bash
nak req -k 30166 -t N=77 -l 10 wss://monitorlizard.nostr1.com \
  | jq -r '[(.tags[]|select(.[0]=="d")|.[1]),
            (.tags[]|select(.[0]=="rtt-open")|.[1])] | @tsv'
```

```text
wss://ngit.danconwaydev.com/	836
wss://relay.letsfo.com/	595
wss://support.nostr1.com/	332
…
```

**Which monitors publish there, how often and what they check:**

```bash
nak req -k 10166 -l 5 wss://monitorlizard.nostr1.com \
  | jq -c '{pubkey: .pubkey[0:12],
      freq: (.tags[]|select(.[0]=="frequency")|.[1]),
      checks: [.tags[]|select(.[0]=="c")|.[1]]}'
```

```text
{"pubkey":"db57acaa893e","freq":"600","checks":["open","read","nip11"]}
{"pubkey":"3e3cf4f932be","freq":"3600","checks":["open","read","info","nip11","dns","ssl"]}
```

:::note
Monitors disagree, and some publish stale data. Look at `created_at`, and treat a relay as up only if recent reports from more than one monitor say so. NIP-66 also says clients must not *require* 30166 events to work.
:::

To run your own monitor, see `@nostrwatch/relaymon` (alpha) in the [nostr-watch monorepo](https://github.com/sandwichfarm/nostr-watch). nostream can also probe relays (`nip66` in its settings).

## Explorer websites

Checked Oct 2026.

| Site | What it does |
|---|---|
| [nostr.watch](https://nostr.watch/) | Relay list and status dashboard built on NIP-66 ([source](https://github.com/sandwichfarm/nostr-watch)). Alpha UI. |
| [nostrpul.se](https://nostrpul.se/) | Relay status pages from NIP-66 events. |
| [nostrwat.ch](https://nostrwat.ch/) | Relay status map. |
| [relays.vercel.app](https://relays.vercel.app/) | Relay list and per-relay view. Operator unknown. |
| [GeoRelays](https://github.com/permissionlesstech/georelays) | Scripts and a dataset: crawl relays and estimate where they are hosted. |
| [relay.tools](https://relay.tools/) | A commercial relay host with a browser for the relays it hosts. Not a neutral explorer. |

:::caution
The api.nostr.watch v1 API is dead (502), and v2 is a paid API. Query NIP-66 events instead, as above. nostr.band, next.nostr.watch and relay.guide are gone or no longer about Nostr.
:::

## More tools

- [nak](https://github.com/fiatjaf/nak): `relay` (NIP-11), `relays <pubkey>` (a user's NIP-65 relays), `req`, `count`, `sync`, `serve`. Recipes on the wiki's [nak page](https://github.com/nostrcg/devguide/wiki/NAK).
- [websocat](https://github.com/vi/websocat) for raw WebSocket messages: wiki [Websocat](https://github.com/nostrcg/devguide/wiki/Websocat) page. It doesn't close on `EOSE`, so wrap it in `timeout`.
- [Developer Tools](../ecosystem/tools.md) and [Snippets](../reference/snippets.md) on this site.
