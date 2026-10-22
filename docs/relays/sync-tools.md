---
sidebar_position: 8
title: Relay Sync Tools
description: Tools for syncing and bridging Nostr relays
---

# Relay Sync Tools

Ways to copy events between relays: a one-off sync with negentropy, continuous mirroring, and plain export and import. Use them to seed a new relay, back up your own notes, or keep two relays of a cluster in step.

## Negentropy (NIP-77)

[NIP-77](https://github.com/nostr-protocol/nips/blob/master/77.md) adds `NEG-OPEN`, `NEG-MSG`, `NEG-CLOSE` and `NEG-ERR` messages. Two sides pick a filter and compare fingerprints of the event sets that match it, narrowing down range by range, until each side knows which IDs it has that the other lacks. Only then are events sent, with ordinary `EVENT` and `REQ`. When the two sets mostly overlap, this uses far less bandwidth than downloading everything.

Both sides must support NIP-77. As of October 2026:

| Software | NIP-77 |
|---|---|
| strfry | Yes, on by default (`relay.negentropy.enabled`) |
| nostream | Yes, off by default (`nip77.enabled`, Postgres backend only) |
| `nak serve` | With `--negentropy` |
| nostr-rs-relay | No |

To find public relays that support it, query NIP-66 monitors for `N=77` ([Relay Explorers](./explorers.md)), or look for `77` in `supported_nips` in the relay's NIP-11 document.

## nak sync

**Tested** with nak v0.21.2 between two `nak serve --negentropy` relays.

```bash
# two-way: this also uploads the local relay's events to relay.example.com
timeout 60 nak sync ws://localhost:10547 wss://relay.example.com
```

`nak sync` works in both directions: after it finishes, each relay has the events that matched on either side. Narrow it with the usual filter flags (`-k`, `-a`, `-t`, `-s`, `-u`, `-d`, `-p`); there is no `--filter` flag:

```bash
# only kind 1 notes from one author
timeout 60 nak sync -k 1 -a <hex-pubkey> \
  ws://localhost:10547 wss://relay.example.com
```

:::caution
If either relay lacks NIP-77, `nak sync` hangs without an error (you only see a `NOTICE` such as `unknown envelope label`). Always wrap it in `timeout`.
:::

## strfry sync

From the [strfry README](https://github.com/hoytech/strfry) and the `strfry sync` usage text in the current source:

```bash
./strfry sync wss://relay.example.com
./strfry sync wss://relay.example.com --dir both
./strfry sync wss://relay.example.com --filter '{"authors":["..."]}'
```

| Flag | Meaning |
|---|---|
| `--dir` | `down` (fetch what you lack), `up` (send what they lack), `both`, or `none`. The usage text in the September 2026 source gives `both` as the default; the README says a plain `sync` downloads. Pass `--dir` explicitly. |
| `--filter` | One filter object, or a JSON array of filters. Default `{}`, the whole database. |
| `--range` | Time window, e.g. `2h-` (last 2 hours) or `1Y-6M` (from a year ago to six months ago). Units: `s m h d w M Y`. |
| `--print-missing` | Only list the IDs that differ; transfer nothing. |
| `--timeout` | Give up after this many seconds without activity (default `0`, never). |

`strfry sync` is one-shot: it reconciles once and exits. There is no `--continuous` flag. A full-database sync against an empty local relay can use a lot of memory and bandwidth; sync with a filter or `--range` first.

## Continuous mirroring

### strfry router

For a process that stays connected and streams events, strfry uses `strfry router` with its own config file, separate from `strfry.conf`:

```bash
strfry router strfry-router.config
```

This example is from strfry's [docs/router.md](https://github.com/hoytech/strfry/blob/master/docs/router.md):

```
connectionTimeout = 20

verbose = false

streams {
    ## Stream down events from our friend relays

    friends {
        dir = "down"
        pluginDown = "/home/user/spam-filter.js"

        urls = [
            "wss://nos.lol"
            "wss://relayable.org"
        ]
    }

    ## Bi-directional streaming within our cluster

    cluster {
        dir = "both"

        urls = [
            "wss://eu.example.com"
            "wss://na.example.com"
        ]
    }

    ## Backup profiles and contact lists to our directory node

    directory {
        dir = "up"
        filter = { "kinds": [0, 3] }

        urls = [
            "ws://internal-directory.example.com"
        ]
    }
}
```

Each stream needs `dir` and `urls`. `filter` narrows what is streamed, and `pluginDown` / `pluginUp` run a [write-policy plugin](./configuration.md) on events in each direction. The router reconnects forever and reloads the file when it changes. A `down` stream only gets new events (it subscribes with `limit: 0`), so run `strfry sync` once first if you also want history.

For a single relay, `strfry stream wss://relay.example.com --dir down` (or `up`, `both`) does the same without a config file.

### nostream mirroring

nostream mirrors from other relays through `mirroring.static[]` in `.nostr/settings.yaml`. Each entry has an `address` (`ws://` or `wss://` URL), `filters` for the subscription, and optionally `limits.event` overrides, a `secret` (nostream-to-nostream only) and `skipAdmissionCheck`. The worker subscribes to the address with those filters and also forwards new local events to it. See [CONFIGURATION.md](https://github.com/cameri/nostream/blob/main/CONFIGURATION.md).

## Export and import

**Tested** with nak v0.21.2. Back up your own events from a relay, then publish them to another. `nak req` closes after `EOSE`; `nak event` republishes an already-signed event unchanged (same ID and signature):

```bash
timeout 60 nak req -a <hex-pubkey> wss://relay.example.com > backup.jsonl

while read -r ev; do
  echo "$ev" | nak event ws://localhost:10547
done < backup.jsonl
```

Most relays cap how many events one `REQ` returns. For a long history, page backwards with `-u` (until) set to the oldest `created_at` you got, or use `nak sync` against a relay that supports NIP-77.

strfry has bulk commands for its own database, from the README:

```bash
cat my-nostr-dump.jsonl | ./strfry import
./strfry download wss://relay.example.com --filter '{"kinds":[0]}' > my-events.jsonl
./strfry scan '{"kinds":[0]}' | ./strfry upload wss://relay.example.com
```

`strfry import` verifies signatures unless you pass `--no-verify`. nostream can import `.jsonl` and `.json` files too (see its README).

:::note Don't broadcast to every relay
Pushing your events, especially your kind 10002 relay list, to every relay a monitor knows about is spam and works against the outbox model. Publish your relay list to your own write relays and a couple of indexers such as `wss://purplepag.es`.
:::

## See also

- [Relay Explorers](./explorers.md): find relays that support NIP-77.
- [Relay Implementations](./implementations.md)
- [strfry docs/negentropy.md](https://github.com/hoytech/strfry/blob/master/docs/negentropy.md): how strfry implements the protocol.
