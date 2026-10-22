---
sidebar_position: 7
title: Social Graph
description: Follows, mutes, follow suggestions, web-of-trust filtering and linked identities on Nostr
---

# Social Graph

Nostr has no central "friends" table. The social graph is a set of signed events, which any client can fetch and compute over. Use it to build the home feed, suggest people to follow, and keep spam out of replies and notifications.

## Building blocks

| What | Kind | Spec | Notes |
|---|---|---|---|
| Follow list | 3 | [NIP-02](https://github.com/nostr-protocol/nips/blob/master/02.md) | Replaceable. One `["p", <hex>, <relay>, <petname>]` tag per follow. Its `content` relay JSON is deprecated: relays are in kind 10002 |
| Mute list | 10000 | [NIP-51](https://github.com/nostr-protocol/nips/blob/master/51.md) | `p`, `t`, `word` and `e` tags. Private items are NIP-44-encrypted to yourself in `content` |
| Follow sets | 30000 | NIP-51 | Named lists of people. Starter packs are kind 39089 |
| Relay list | 10002 | [NIP-65](https://github.com/nostr-protocol/nips/blob/master/65.md) | Where to read each person's notes (see [Building clients](./building-clients.md)) |
| Linked identities | 10011 | [NIP-39](https://github.com/nostr-protocol/nips/blob/master/39.md) | `["i", "github:alice", "<gist id>"]` tags |
| Trusted assertions | 30382–30385, 10040 | [NIP-85](https://github.com/nostr-protocol/nips/blob/master/85.md) | Signed scores from providers the user chooses |

A follow list is public and there's no "followers" event. To find who follows someone, query `{ kinds: [3], '#p': [pubkey] }`. Any answer is a lower bound: no relay has every follow list.

## Read a follow list

`wss://purplepag.es` specialises in profiles and lists. Tested with nak v0.21.2; the key is just a well-known example:

```bash
PK=3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d

# how many people does this key follow?
nak req -k 3 -a $PK -l 1 wss://purplepag.es \
  | jq '[.tags[] | select(.[0]=="p")] | length'
```

In code, take the newest kind 3 per author. Fetch many lists in **one** request with a batched `authors` filter, not one request per person. This function, and the trust set built from it below, were tested with nostr-tools 2.25.2. For a key with 199 follows, it fetched every follow's list and built a set of 3,774 trusted keys in under a second:

```js
import { SimplePool } from 'nostr-tools/pool'

const pool = new SimplePool()
const INDEXERS = ['wss://purplepag.es', 'wss://relay.primal.net']

// newest kind 3 per author, fetched in batches (one REQ per batch, not per user)
async function followLists(pubkeys, batch = 300) {
  const latest = new Map()
  for (let i = 0; i < pubkeys.length; i += batch) {
    const authors = pubkeys.slice(i, i + batch)
    for (const ev of await pool.querySync(INDEXERS, { kinds: [3], authors })) {
      if ((latest.get(ev.pubkey)?.created_at ?? -1) < ev.created_at) latest.set(ev.pubkey, ev)
    }
  }
  const out = new Map()
  for (const [pk, ev] of latest) {
    out.set(pk, ev.tags.filter(t => t[0] === 'p' && /^[0-9a-f]{64}$/.test(t[1])).map(t => t[1]))
  }
  return out
}

// keys within two hops: my follows, plus anyone followed by at least `min` of them
async function trustedSet(me, min = 3) {
  const mine = (await followLists([me])).get(me) ?? []
  const counts = new Map()
  for (const list of (await followLists(mine)).values()) {
    for (const pk of new Set(list)) counts.set(pk, (counts.get(pk) ?? 0) + 1)
  }
  const trusted = new Set([me, ...mine])
  for (const [pk, n] of counts) if (n >= min) trusted.add(pk)
  return trusted
}
```

## Update follows and mutes

Kinds 3 and 10000 are replaceable: each publish replaces the **whole** list. To add one follow, fetch the newest list, append a tag, and publish the result. Tested against `nak serve` with a throwaway key (`export NOSTR_SECRET_KEY=$(nak key generate)`, `R=ws://localhost:10547`, `NEW=<hex pubkey to follow>`):

```bash
PK=$(echo "$NOSTR_SECRET_KEY" | nak key public)

nak req -k 3 -a $PK $R </dev/null > follows.jsonl
if [ -s follows.jsonl ]; then
  # newest list + one p tag (unless already there), as kind 3
  jq -s -c --arg p $NEW 'max_by(.created_at) | {kind: 3, content,
      tags: (if any(.tags[]; .[0]=="p" and .[1]==$p) then .tags
             else .tags + [["p", $p]] end)}' follows.jsonl \
    | nak event $R
else
  # an empty fetch is not an empty list
  echo "no follow list found: not publishing"
fi
```

:::danger An empty fetch is not an empty list
If a client publishes a follow list built from a stale or partial copy, the user's follows are gone. Before you write, fetch kind 3 from the user's write relays and an indexer such as `wss://purplepag.es`, and keep the newest `created_at`. If you can't find the current list, refuse to write. Keep tags you don't understand, and leave `content` unchanged.
:::

## Apply the mute list

Public mutes are tags. Private ones are a NIP-44-encrypted JSON array of tags in `content`, encrypted to the user's own key. Lists written by older clients may use NIP-04 there instead. `pool`, `where`, `me` and `signer` are set up as in [Building clients](./building-clients.md). Tested with a NIP-44-capable signer against `nak serve`:

```js
// the user's mute list (NIP-51): public tags, plus private ones encrypted to self
async function loadMutes() {
  const events = await pool.querySync(where, { kinds: [10000], authors: [me] })
  const latest = events.reduce((a, b) => (!a || b.created_at > a.created_at ? b : a), null)
  if (!latest) return { pubkeys: new Set(), words: [], hashtags: new Set() }

  let tags = [...latest.tags]
  if (latest.content && signer.nip44) {
    try {
      tags = tags.concat(JSON.parse(await signer.nip44.decrypt(me, latest.content)))
    } catch {
      // older lists may use NIP-04 here; skip what you can't decrypt
    }
  }
  const values = name => tags.filter(t => t[0] === name).map(t => t[1])
  return {
    pubkeys: new Set(values('p')),
    words: values('word').map(w => w.toLowerCase()),
    hashtags: new Set(values('t').map(t => t.toLowerCase())),
  }
}

function isMuted(ev, mutes) {
  if (mutes.pubkeys.has(ev.pubkey)) return true
  if (ev.tags.some(t => t[0] === 't' && mutes.hashtags.has(t[1]?.toLowerCase()))) return true
  const text = ev.content.toLowerCase()
  return mutes.words.some(w => text.includes(w))
}
```

Apply mutes everywhere: feeds, replies, notifications, search and zap lists.

## Recommend follows

Friends of friends: count who your follows follow, and drop the keys you already follow. Tested with nak v0.21.2 against `wss://purplepag.es`. The sample uses your first 20 follows:

```bash
PK=<hex pubkey>
RELAY=wss://purplepag.es

# who you follow
nak req -k 3 -a $PK -l 1 $RELAY </dev/null \
  | jq -r '.tags[] | select(.[0]=="p") | .[1]' \
  | sort -u > mine.txt

# who they follow, counted
head -20 mine.txt | while read f; do
  nak req -k 3 -a $f -l 1 $RELAY </dev/null \
    | jq -r '.tags[] | select(.[0]=="p") | .[1]'
done | sort | uniq -c | sort -rn \
  | grep -v -F -f mine.txt | grep -v $PK | head -10
```

Each output line is a count and a pubkey. `</dev/null` stops nak from reading the loop's input as filters. Remove muted keys before you show the results. In an app, `followLists()` above gets the same counts in one batched request.

## Web of trust

Spam on an open protocol is handled with the graph, not by a central moderator:

- **Client-side filtering:** show replies, notifications and DMs only from keys in `trustedSet()` (follows, plus keys followed by several of your follows), minus mutes. This is cheap and works offline once the lists are cached.
- **Trusted assertions (NIP-85):** heavy graph maths (PageRank-style ranks, follower counts, report counts) is too much for a phone. A provider computes it and publishes signed kind 30382 events, one per user (`d` tag = pubkey), with tags such as `["rank", "89"]`. The user lists the providers they trust in kind 10040. Providers are still few in 2026.
- **WoT relays:** relays such as [wot-relay](https://github.com/barrydeen/wot-relay) accept only notes from their owner's web of trust.

See the wiki's [Social graph](https://github.com/nostrcg/devguide/wiki/Social-Graph) page for the services and their status.

## Linked identities (NIP-39)

Users claim accounts on other platforms with `i` tags in a **kind 10011** event: `["i", "<platform>:<identity>", "<proof>"]`. These claims are not kind 0 fields. For GitHub, the proof is a gist ID, and the gist, made by that user, must contain the user's `npub`. This check was tested against the example claim in NIP-39 (true for the right key, false for another key or another username):

```js
import * as nip19 from 'nostr-tools/nip19'

// does github:<user> really claim this pubkey? (NIP-39, kind 10011 i tag)
async function checkGithubClaim(pubkey, iTag) {
  const [, claim, gistId] = iTag
  const user = claim.slice('github:'.length).toLowerCase()
  const res = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`)
  if (!res.ok) return false
  const gist = await res.json()
  if (gist.owner?.login?.toLowerCase() !== user) return false
  // accept any gist file by that user that contains the npub
  const npub = nip19.npubEncode(pubkey)
  return Object.values(gist.files).some(f => f.content?.includes(npub))
}
```

Other platforms (Twitter, Mastodon, Telegram) define their own proof formats in NIP-39. Until you've checked a claim, show it as unverified.

## Linked data: did:nostr

The W3C Nostr Community Group maps Nostr identities to linked data. `did:nostr:<64-hex pubkey>` resolves to a DID document holding the key, profile and follows. It is a Community Group draft ([did:nostr spec](https://nostrcg.github.io/did-nostr/)), not a NIP. See [did:nostr](../protocol/did-nostr.md).

## Related

- [Feed algorithms](./algorithms.md): ranking feeds on top of this graph.
- [Building clients](./building-clients.md): loading follows and their relays.
