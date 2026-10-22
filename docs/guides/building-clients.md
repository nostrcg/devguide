---
sidebar_position: 2
title: Building Clients
description: Log in with a signer, load follows, fetch a feed with the outbox model, render safely, reply and like
---

# Building Clients

This page walks through what a client actually does: log in, load the user's profile and follows, fetch a feed from the right relays, render notes safely, and reply or like. It uses JavaScript with nostr-tools 2.25.2, and the same steps apply in any [library](../libraries/overview.md). The code was run against live relays (steps 2–4) and a local `nak serve` (step 6) in October 2026. It follows the wiki's [Build a client](https://github.com/nostrcg/devguide/wiki/Build-a-Client) tutorial.

```bash
npm i nostr-tools
```

## 1 · Log in with a signer {#nip-07-integration}

Don't ask users for their nsec. In the browser, a NIP-07 extension gives you a pubkey and signs on request:

```js
if (!window.nostr) throw new Error('Install a NIP-07 signer, or log in with bunker://')
const signer = window.nostr
// hex pubkey; the first call usually opens a permission prompt
const me = await signer.getPublicKey()
```

[NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md) has two required methods, `getPublicKey()` and `signEvent(template)`. `nip44.encrypt`/`decrypt` are optional, and `nip04.*` is deprecated. There is no `getRelays()`: read the user's relays from kind 10002 (step 2). Call `getPublicKey()` from a button click, not on page load, because extensions may inject `window.nostr` late.

Without an extension (on phones, for example), use a NIP-46 remote signer. nostr-tools' `BunkerSigner` has the same `getPublicKey()` and `signEvent()` methods, so the rest of this page doesn't change. The code is in [Mobile development](./mobile-development.md).

## 2 · Load the profile and follows

Start from a few **bootstrap relays**: big general relays, plus `purplepag.es`, which indexes profiles and relay lists.

```js
import { SimplePool } from 'nostr-tools/pool'

const pool = new SimplePool()
// remember which relay each event came from (for relay hints)
pool.trackRelays = true
const BOOTSTRAP = ['wss://purplepag.es', 'wss://relay.primal.net', 'wss://relay.nostr.net']

// the user's relay list (NIP-65); their profile and follows may live only there
const myList = await pool.get(BOOTSTRAP, { kinds: [10002], authors: [me] })
const rTags = (myList?.tags ?? []).filter(t => t[0] === 'r')
const myWriteRelays = rTags.filter(t => t[2] === undefined || t[2] === 'write').map(t => t[1])
const where = [...new Set([...rTags.map(t => t[1]), ...BOOTSTRAP])]

// kind 0: profile JSON (name, display_name, picture, about, nip05, lud16 …)
const meta = await pool.get(where, { kinds: [0], authors: [me] })
let profile = {}
try { profile = meta ? JSON.parse(meta.content) : {} } catch {}

// kind 3: follow list, one ["p", pubkey] tag per follow
const contacts = await pool.get(where, { kinds: [3], authors: [me] })
const follows = (contacts?.tags ?? []).filter(t => t[0] === 'p').map(t => t[1])
```

Kinds 0, 3 and 10002 are **replaceable**: only the newest one counts. `pool.get` returns the newest event it receives. With `querySync`, you get every copy from every relay, unsorted, so keep the highest `created_at` per author yourself (step 3 does this).

If the user has no kind 10002 list, `myWriteRelays` is empty. Ask them to pick relays and publish a list for them, rather than writing to relays they never chose.

## 3 · Find each author's relays (the outbox model)

There's no central server: people post to *their own* relays, listed in their kind 10002 event ([NIP-65](https://github.com/nostr-protocol/nips/blob/master/65.md)). Read each author's notes from their **write** relays. Skipping this is the most common reason a new client "can't find" posts.

```js
// newest event per author: relays return copies, in any order
function newestByAuthor(events) {
  const latest = new Map()
  for (const ev of events) {
    if ((latest.get(ev.pubkey)?.created_at ?? -1) < ev.created_at) latest.set(ev.pubkey, ev)
  }
  return latest
}

const lists = await pool.querySync(BOOTSTRAP, { kinds: [10002], authors: follows })
const relaysOf = new Map()
for (const [pk, ev] of newestByAuthor(lists)) {
  const urls = ev.tags
    .filter(t => t[0] === 'r' && (t[2] === undefined || t[2] === 'write'))
    .map(t => t[1])
  // a few relays per author is plenty
  relaysOf.set(pk, urls.slice(0, 3))
}

// group authors by relay, keep the 20 relays that cover the most people
const byRelay = new Map()
for (const pk of follows) {
  for (const url of relaysOf.get(pk) ?? BOOTSTRAP.slice(1)) {
    if (!byRelay.has(url)) byRelay.set(url, [])
    byRelay.get(url).push(pk)
  }
}
const requests = [...byRelay]
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 20)
  .map(([url, authors]) => ({ url, filter: { kinds: [1], authors, limit: 20 } }))
```

For one test user, 199 follows used 130 different relays, and the top 20 relays covered most of them. Query anyone left uncovered on the bootstrap relays. Production clients also cache relay lists and track which relays fail. Libraries such as applesauce, welshman, NDK and nostr-sdk can do this routing for you.

## 4 · Fetch the feed

`subscribeMap` sends a different filter to each relay over one pool. Events arrive in any order and often more than once, so **dedupe by id and sort by `created_at`**:

```js
const feed = new Map()
const sub = pool.subscribeMap(requests, {
  onevent(ev) {
    // the same note from 3 relays is 1 entry
    feed.set(ev.id, ev)
    // debounce this in a real UI
    render([...feed.values()].sort((a, b) => b.created_at - a.created_at))
  },
  // stored events are in; new ones keep streaming
  oneose() {},
  maxWait: 8000,
})
// later, when the view goes away:
// sub.close()
```

For older pages, query again with `until` set to the oldest `created_at` you have. `until` is inclusive, so expect the boundary notes again:

```js
// "load more": until is inclusive, so the boundary note comes back; the Map dedupes it
const oldest = Math.min(...[...feed.values()].map(e => e.created_at))
const older = await pool.querySync(BOOTSTRAP.slice(1), {
  kinds: [1], authors: follows.slice(0, 300), until: oldest, limit: 50,
})
for (const ev of older) feed.set(ev.id, ev)
```

**Relays push back.** On `auth-required:`, sign a NIP-42 AUTH event and retry. Pass `{ onauth: t => signer.signEvent(t) }` to `publish` or `subscribe`, but only for the user's own relays, since AUTH tells the relay who the user is. On `rate-limited:`, back off. Each relay's NIP-11 document lists its `limitation`s (`max_subscriptions`, `max_limit` and so on). See [Relay information](../reference/relay-info.md). `SimplePool` verifies every event signature by default; keep it that way.

## 5 · Render notes

Note content is plain text containing `nostr:` references ([NIP-27](https://github.com/nostr-protocol/nips/blob/master/27.md)), URLs and hashtags. **Content is untrusted input**, so escape every piece before it becomes HTML:

```js
import * as nip10 from 'nostr-tools/nip10'
import * as nip19 from 'nostr-tools/nip19'
import * as nip27 from 'nostr-tools/nip27'

const esc = s => s.replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const safeUrl = u => /^https:\/\//i.test(u) ? esc(u) : null

// returns HTML in which every piece of user content is escaped
function toHtml(ev) {
  return [...nip27.parse(ev.content)].map(b => {
    if (b.type === 'text') return esc(b.text).replace(/\n/g, '<br>')
    if (b.type === 'hashtag')
      return `<a href="/t/${encodeURIComponent(b.value)}">#${esc(b.value)}</a>`
    if (b.type === 'image' && safeUrl(b.url))
      return `<img src="${safeUrl(b.url)}" loading="lazy">`
    if ((b.type === 'url' || b.type === 'image') && safeUrl(b.url))
      return `<a href="${safeUrl(b.url)}" rel="nofollow noopener">${esc(b.url)}</a>`
    if (b.type === 'reference' && !('id' in b.pointer) && !('identifier' in b.pointer)) {
      const npub = nip19.npubEncode(b.pointer.pubkey)
      return `<a href="/p/${npub}">@${npub.slice(0, 12)}…</a>`
    }
    // nevent / naddr: fetch the referenced event and embed it
    if (b.type === 'reference') return '<span class="quote">[quoted event]</span>'
    return ''
  }).join('')
}
```

We tested it against a hostile note. `<script>`, `javascript:` links and `"><img onerror=…>` all came out as inert text. If your framework renders text nodes (React and Svelte do by default), you get the same safety. Never pass note content to `innerHTML` or `dangerouslySetInnerHTML` without escaping it.

**Threads** ([NIP-10](https://github.com/nostr-protocol/nips/blob/master/10.md)): read the `e` tag markers, not tag positions. The old "last `e` tag is the parent" rule is deprecated. `nip10.parse(event)` returns `{ root, reply, mentions, quotes, … }`. A direct reply to a top-level note carries only a `root` marker, and `parse` then sets `reply` to the root too. So a note is a reply exactly when `reply` is set.

## 6 · Reply, like and edit the profile

Have the signer sign an event template, then publish it to the **user's write relays** (from step 2). Add the parent author's read relays if you want them to see it.

```js
const now = () => Math.floor(Date.now() / 1000)
// a relay where the parent was seen ("" is allowed)
const relayHint = [...(pool.seenOn.get(parent.id) ?? [])][0]?.url ?? ''
// notify everyone in the thread, not just the author
const pTags = [...new Set([...parent.tags.filter(t => t[0] === 'p').map(t => t[1]), parent.pubkey])]
  .map(pk => ['p', pk])

// NIP-10: replying to a top-level note
const replyEv = await signer.signEvent({
  kind: 1,
  created_at: now(),
  content: 'nice post!',
  tags: [['e', parent.id, relayHint, 'root', parent.pubkey], ...pTags],
})

// NIP-25 like
const likeEv = await signer.signEvent({
  kind: 7,
  created_at: now(),
  content: '+',
  tags: [['e', parent.id, relayHint], ['p', parent.pubkey], ['k', String(parent.kind)]],
})

// one promise per relay: check them all
const onauth = t => signer.signEvent(t)
for (const ev of [replyEv, likeEv]) {
  const results = await Promise.allSettled(pool.publish(myWriteRelays, ev, { onauth }))
  if (!results.some(r => r.status === 'fulfilled')) console.error('no relay accepted', ev.id)
}
```

This reply is to a top-level note. Deeper in a thread, keep the parent's `root` tag and add `["e", parent.id, relayHint, "reply", parent.pubkey]`. To load the replies and reactions on a note, query `{ kinds: [1, 1111, 7, 6, 9735], '#e': [note.id] }`. NIP-22 comments deeper in a thread tag the root with an uppercase `E`, so also query `{ kinds: [1111], '#E': [note.id] }`. Validate zap receipts before counting them ([Lightning zaps](./zaps.md)).

**Editing the profile** follows the same rule as every replaceable event: fetch the newest copy, merge, publish. Writing a kind 0 built from defaults wipes the user's other fields, and an empty fetch result means "not found", not "empty":

```js
async function updateProfile(changes) {
  const events = await pool.querySync(where, { kinds: [0], authors: [me] })
  // an empty result is not an empty profile: refuse rather than wipe it
  if (events.length === 0) throw new Error('profile not found, not overwriting it')
  const latest = events.reduce((a, b) => (b.created_at > a.created_at ? b : a))
  const content = { ...JSON.parse(latest.content), ...changes }
  const ev = await signer.signEvent({
    kind: 0,
    created_at: Math.max(now(), latest.created_at + 1),
    tags: latest.tags,
    content: JSON.stringify(content),
  })
  await Promise.any(pool.publish(myWriteRelays, ev, { onauth }))
  return content
}
```

The same applies to follow lists (kind 3) and relay lists (kind 10002): keep tags you don't understand. Recipes are in [Social graph](./social-graph.md).

## Where to go next

| Add… | Read |
|---|---|
| Names and avatars for everyone you show | Batch one kind 0 query for all the pubkeys on screen, and cache the results |
| Private messages | [NIP-17](https://github.com/nostr-protocol/nips/blob/master/17.md) gift-wrapped DMs, sent to the recipient's kind 10050 relays. Don't use NIP-04. The pitfalls are listed at the end of the wiki's [Build a client](https://github.com/nostrcg/devguide/wiki/Build-a-Client) |
| Media uploads | Blossom servers from the user's kind 10063 list ([NIP-B7](https://github.com/nostr-protocol/nips/blob/master/B7.md)), described with `imeta` tags ([NIP-92](https://github.com/nostr-protocol/nips/blob/master/92.md)) |
| Zaps | [Lightning zaps](./zaps.md) |
| Mutes, spam filtering, follow suggestions | [Social graph](./social-graph.md) and [Feed algorithms](./algorithms.md) |
| Tests | [Testing](./testing.md) |
