---
sidebar_position: 6
title: Feed Algorithms
description: How Nostr feeds are ranked in 2026, with a tested "hot among my follows" script
---

# Feed Algorithms

On Nostr the user chooses the algorithm. Relays return events that match a filter, sorted newest first. Any other order is computed by something else: the client, a curating relay, or a service.

## How feeds are delivered in 2026

| Approach | How it works |
|---|---|
| **Client-side** (standard) | The client fetches follows' notes plus reactions and zaps, and ranks them locally. Private, but uses a lot of bandwidth |
| **Relay feeds** (common) | A topic or community relay curates what it accepts, so the relay *is* the feed. Users save favourite relays in kind 10012 ([NIP-51](https://github.com/nostr-protocol/nips/blob/master/51.md)) |
| **Caching services** (common) | A server ingests the firehose and serves trending and explore views over its own API. Primal is the main example ([primal-server](https://github.com/PrimalHQ/primal-server)) |
| **Trusted assertions** (new) | A provider publishes signed scores ([NIP-85](https://github.com/nostr-protocol/nips/blob/master/85.md): kind 30383 for events, 30382 for users). See [Social graph](./social-graph.md) |
| **DVM feeds** (unrecommended) | NIP-90 "content discovery" jobs. NIP-90 was marked unrecommended in 2026 ("prefer use-case-specific microstandards"). Don't build new features on it |

## A "hot among my follows" feed

Four steps: get the follows, fetch their recent notes, fetch reactions and zaps on those notes, and score with a time decay. Tested with nak v0.21.2 and jq 1.8. It takes a few seconds end to end:

```bash
PK=<hex pubkey>
R=wss://relay.primal.net

# 1. the first 50 people you follow
nak req -k 3 -a $PK -l 1 wss://purplepag.es </dev/null \
  | jq -r '.tags[] | select(.[0]=="p") | .[1]' \
  | head -50 > follows.txt

# 2. their notes from the last 24 hours
SINCE=$(( $(date +%s) - 86400 ))
nak req -k 1 -s $SINCE -l 200 $(sed 's/^/-a /' follows.txt) \
  $R </dev/null > notes.jsonl

# 3. reactions (7) and zap receipts (9735) on those notes
nak req -k 7 -k 9735 $(jq -r '"-e " + .id' notes.jsonl) \
  $R </dev/null > signals.jsonl

# 4. score = (reactions + 3 x zaps) / (age in hours + 2)^1.5
jq -rn --slurpfile n notes.jsonl --slurpfile s signals.jsonl '
  ($s | map({w: (if .kind == 9735 then 3 else 1 end),
             e: ([.tags[] | select(.[0] == "e")][-1][1])})
      | group_by(.e) | map({(.[0].e): (map(.w) | add)})
      | add // {}) as $pts
  | $n | map({id, s: (($pts[.id] // 0)
      / pow((now - .created_at) / 3600 + 2; 1.5))})
  | sort_by(-.s) | .[:10][] | "\(.s * 100 | round) \(.id)"'
```

Each output line is a score and a note id, best first. The decay is the Hacker News "gravity" formula, so a fresh note with a few reactions beats a day-old one with many.

The script is a starting point. Before you use the signals for real:

- **Validate zaps.** Anyone can publish a kind 9735 receipt. Count only receipts that pass the checks in [Lightning zaps](./zaps.md), and weight by the invoice amount rather than a flat 3.
- **Count reactions properly.** If a reaction has several `e` tags, NIP-25 says the target is the last one, and the script uses that tag. Treat `-` as a dislike, and count each reacting key once.
- **Count replies separately.** A `#e` query also matches mentions, quotes and replies deeper in the thread. If you want direct replies, parse the NIP-10 markers.
- **Weight by trust.** Drop signals from keys outside the user's web of trust or on their mute list ([Social graph](./social-graph.md)). Otherwise a bot farm decides your feed.
- **Scale.** Public relays rate-limit bursts. Batch authors and ids into a few large filters, as the script does, and for bigger feeds index into your own relay.

## Top-level notes only

Many feeds hide replies. Use the NIP-10 markers, not tag positions. A direct reply to a top-level note carries only a `root` marker, so checking for a `reply` marker alone lets those replies through. `nip10.parse` handles both cases, and old positional tags too. Tested with nostr-tools 2.25.2:

```js
import * as nip10 from 'nostr-tools/nip10'

// keep top-level notes: a reply has nip10.parse(ev).reply set,
// including a direct reply that carries only a 'root' marker
const isReply = ev => nip10.parse(ev).reply !== undefined
const topLevel = notes => notes.filter(ev => !isReply(ev))
```

Notes that only mention or quote another event (old `mention`-marked or positional mention tags, `q` tags) count as top-level.

## What people rank by

The ideas behind most feeds come from Keyan's (huumn) [algo examples gist](https://gist.github.com/huumn/437925d2861007f12723c72f355959b1) and NIPs issue [#522](https://github.com/nostr-protocol/nips/issues/522):

| Level | Examples |
|---|---|
| Single signal | Newest first, most zapped, most reactions, most replies, content contains "x" |
| Combined | Sums of the above, with a time decay ("most zapped, biased to recent") |
| Personalised | The combined scores weighted by *my* follow graph, or by a PageRank-style rank (NIP-85 `rank`) |
| Product features | Home feed, trending topics, who to follow ([Social graph](./social-graph.md)) |

Proof of work ([NIP-13](https://github.com/nostr-protocol/nips/blob/master/13.md)) is another cheap spam signal. Read the difficulty from the event id's leading zero bits, and give it weight only if the note has a `nonce` tag that commits to a target.
