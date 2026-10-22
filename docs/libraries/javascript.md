---
sidebar_position: 2
title: JavaScript Libraries
description: nostr-tools 2.25 and the higher-level JavaScript and TypeScript Nostr libraries
---

# JavaScript Libraries

Start with **nostr-tools** for keys, events and relay connections. Add a state layer (applesauce, welshman, NDK or Nostrify) when you need caching, outbox routing and reactive data.

| Library | What it is | Status |
|---|---|---|
| [nostr-tools](https://github.com/nbd-wtf/nostr-tools) | Keys, events, NIP-19/44/17/46, `SimplePool`. The base most others build on | 🟢 2.25 |
| [@nostr/gadgets](https://github.com/nbd-wtf/nostr-gadgets) | Outbox routing, lists, caching on top of nostr-tools. JSR only | 🟢 0.21 |
| [applesauce](https://applesauce.build) | Reactive (RxJS) event store, models, loaders and signers. Used by noStrudel | 🟢 7.0 |
| [welshman](https://welshman.coracle.social) | Coracle's toolkit: networking, routing, store | 🟢 pre-release |
| [Nostrify](https://nostrify.dev) | Pools, storages, signers and policies with swappable interfaces | 🟢 0.55 |
| [NDK](https://nostr-dev-kit.github.io/ndk/) | Outbox-aware framework with caches, signers, Svelte and React bindings | 🟡 3.0.3, Feb 2026 |
| [rx-nostr](https://github.com/penpenpng/rx-nostr) | RxJS relay communication layer | 🟢 |
| [@getalby/sdk](https://github.com/getAlby/js-sdk) | Nostr Wallet Connect (NIP-47) client | 🟢 |

```bash
npm i nostr-tools                 # or: npx jsr add @nostr/tools
npx jsr add @nostr/gadgets
npm i applesauce-core applesauce-relay
npm i @welshman/util @welshman/net
npm i @nostrify/nostrify          # use npm; its JSR package is stale
npm i @nostr-dev-kit/ndk
```

🔴 Don't use: npm `nostr` (2023), `nostr-react`, `@nostr-connect/connect`, and `@rust-nostr/nostr-sdk` (deprecated).

The examples below were run in October 2026 with Node 24, nostr-tools 2.25.2, NDK 3.0.3, Nostrify 0.55.1 and applesauce 7.0, against `nak serve` (a local relay on `ws://localhost:10547`) or live public relays. Node 22+ has a global `WebSocket`; nothing else is needed. Save them as `.mjs` files.

## nostr-tools

Import from subpaths (`nostr-tools/pure`, `nostr-tools/pool`, `nostr-tools/nip19`…) to keep bundles small. API docs: [jsr.io/@nostr/tools](https://jsr.io/@nostr/tools/doc).

:::danger Two breaking changes since older tutorials
- **`pool.subscribeMany(relays, filter, params)` takes ONE filter object.** Passing an array (`[filter]`), as code written before 2.17 does, sends a malformed `REQ`; relays reply `bad req` and you get no events.
- **`pool.publish(relays, event)` returns an array of promises**, one per relay. `await pool.publish(...)` waits for nothing. Use `Promise.any` (at least one relay accepted) or `Promise.allSettled` (per-relay results).
:::

### Keys and NIP-19

```js
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'
import { bytesToHex, hexToBytes } from 'nostr-tools/utils'

const sk = generateSecretKey()        // Uint8Array(32)
const pk = getPublicKey(sk)           // 64-char lowercase hex
const skHex = bytesToHex(sk)          // store it like this if you must
console.log(pk, hexToBytes(skHex).length)

// bech32 is for display and sharing; the protocol uses hex
const npub = nip19.npubEncode(pk)
const nsec = nip19.nsecEncode(sk)
const nprofile = nip19.nprofileEncode({ pubkey: pk, relays: ['wss://relay.primal.net'] })

// decode() tells you what you got
const { type, data } = nip19.decode(nprofile)
console.log(type, data.pubkey === pk, data.relays)
console.log(nip19.decode(npub).data === pk, nip19.decode(nsec).type)
```

Filters and tags always use hex. Never put an `npub` in a filter.

### Sign and verify

```js
import { generateSecretKey, finalizeEvent, verifyEvent } from 'nostr-tools/pure'

const sk = generateSecretKey()
const event = finalizeEvent({
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [['t', 'nostr']],
  content: 'hello',
}, sk)
// finalizeEvent adds pubkey, id and sig
console.log(event.id, event.pubkey)

// Verify any event you did not sign yourself. SimplePool already
// does this for events it receives from relays.
const good = JSON.parse(JSON.stringify(event))
const bad = { ...good, content: 'tampered' }
console.log(verifyEvent(good))   // true
console.log(verifyEvent(bad))    // false
```

:::caution
`verifyEvent` caches its result on the event object. Verify before you change anything, and never verify, edit and verify the same object again.
:::

### Publish and query

```js
import { generateSecretKey, finalizeEvent } from 'nostr-tools/pure'
import { SimplePool } from 'nostr-tools/pool'

const relays = ['ws://localhost:10547']
const pool = new SimplePool()
const sk = generateSecretKey()

// publish() returns one promise per relay
const event = finalizeEvent({
  kind: 1, created_at: Math.floor(Date.now() / 1000), tags: [], content: 'hi',
}, sk)
const results = await Promise.allSettled(pool.publish(relays, event))
results.forEach((r, i) =>
  console.log(relays[i], r.status === 'fulfilled' ? 'ok' : r.reason))

// One-shot query: resolves at EOSE (or after maxWait ms)
const notes = await pool.querySync(relays, { kinds: [1], authors: [event.pubkey], limit: 20 })
console.log(notes.length, 'notes')

// Newest replaceable event (kind 0, 3, 10002...) across relays
const profile = await pool.get(relays, { kinds: [0], authors: [event.pubkey] })
console.log(profile)

pool.close(relays)
```

`querySync` collects everything until EOSE. `get` returns only the newest match, which is what you want for replaceable kinds such as profiles (0), follow lists (3) and relay lists (10002).

### Subscribe

```js
import { SimplePool } from 'nostr-tools/pool'

const relays = ['wss://relay.primal.net', 'wss://relay.nostr.net']
const pool = new SimplePool()

// subscribeMany takes ONE filter object, not an array
const sub = pool.subscribeMany(
  relays,
  { kinds: [1], limit: 5 },
  {
    onevent(event) {
      console.log(event.pubkey.slice(0, 8), event.content.slice(0, 60))
    },
    oneose() {
      console.log('stored events done; new ones keep arriving')
    },
  },
)

// later
setTimeout(() => { sub.close(); pool.close(relays) }, 10_000)
```

`SimplePool` doesn't reliably resume subscriptions when a relay drops, even with `enableReconnect: true` (tested with 2.25.2), so resubscribe yourself: see [Relay communication](../protocol/relay-communication.md). Close subscriptions when a view goes away, and `pool.close(relays)` when you are done.

### NIP-44 encryption

```js
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import * as nip44 from 'nostr-tools/nip44'

const alice = generateSecretKey()
const bob = generateSecretKey()

// Both sides derive the same conversation key
const keyA = nip44.getConversationKey(alice, getPublicKey(bob))
const payload = nip44.encrypt('hi bob', keyA)

const keyB = nip44.getConversationKey(bob, getPublicKey(alice))
console.log(nip44.decrypt(payload, keyB))   // hi bob
```

### NIP-17 private messages

```js
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import { SimplePool } from 'nostr-tools/pool'
import * as nip17 from 'nostr-tools/nip17'

const relays = ['ws://localhost:10547']
const pool = new SimplePool()
const alice = generateSecretKey()
const bob = generateSecretKey()

// A kind 14 message, sealed (13) and gift-wrapped (1059) for Bob
const wrap = nip17.wrapEvent(alice, { publicKey: getPublicKey(bob) }, 'hi bob')
await Promise.any(pool.publish(relays, wrap))

// Bob finds gift wraps addressed to him and unwraps them
const wraps = await pool.querySync(relays, { kinds: [1059], '#p': [getPublicKey(bob)] })
for (const w of wraps) {
  const msg = nip17.unwrapEvent(w, bob)
  console.log(msg.kind, msg.pubkey === getPublicKey(alice), msg.content)
}
pool.close(relays)
```

`nip17.wrapEvent` needs the sender's secret key. When the user signs through an extension or bunker, build the seal and gift wrap with `nostr-tools/nip59` and the signer's `nip44` methods instead. Publish to the receiver's kind 10050 inbox relays, plus a copy wrapped to yourself.

### Signing with the user's key

Don't ask users for their nsec. In the browser, use their NIP-07 extension (`window.nostr.getPublicKey()` and `window.nostr.signEvent(template)`); elsewhere, a NIP-46 bunker through `BunkerSigner` from `nostr-tools/nip46`. Both return the same signed event that `finalizeEvent` does, so the pool code above doesn't change. Tested login code for both is on the wiki's [Signers & login](https://github.com/nostrcg/devguide/wiki/Extensions) page; background is in [Key Management](../guides/key-management.md).

## NDK

```js
import NDK, { NDKEvent, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk'

// In a browser app use `new NDKNip07Signer()` instead of a local key
const signer = NDKPrivateKeySigner.generate()
const ndk = new NDK({ explicitRelayUrls: ['ws://localhost:10547'], signer })
await ndk.connect(2000)   // wait at most 2 s for relays

const note = new NDKEvent(ndk, { kind: 1, content: 'hello from NDK' })
const relays = await note.publish()   // the set of relays that accepted it
console.log('published to', relays.size, 'relay(s)')

const me = await signer.user()
ndk.subscribe(
  { kinds: [1], authors: [me.pubkey] },
  { closeOnEose: true },
  {
    onEvent: (event) => console.log(event.content),
    onEose: () => process.exit(0),
  },
)
```

- Pass a timeout to `connect()`. Without one it waits for every relay, including NDK's default outbox relays (`purplepag.es` and `nos.lol`), and never returns if one of them is unreachable. Set `outboxRelayUrls` to choose your own.
- `ndk.subscribe(filter, opts, handlers)` with `onEvent`/`onEose` is the NDK 3 style; `sub.on('event')` still works but is older.
- Framework bindings: `@nostr-dev-kit/react` and `@nostr-dev-kit/svelte`.

## Nostrify

```js
import { NPool, NRelay1, NSecSigner } from '@nostrify/nostrify'
import { generateSecretKey } from 'nostr-tools/pure'

const relays = ['ws://localhost:10547']

// The routers decide which relays each REQ and EVENT goes to.
// This is where outbox routing plugs in; here it is a fixed list.
const pool = new NPool({
  open: (url) => new NRelay1(url),
  reqRouter: (filters) => new Map(relays.map((url) => [url, filters])),
  eventRouter: () => relays,
})

const signer = new NSecSigner(generateSecretKey())
const event = await signer.signEvent({
  kind: 1,
  content: 'hello from Nostrify',
  tags: [],
  created_at: Math.floor(Date.now() / 1000),
})
await pool.event(event)

// query() takes an array of filters and resolves after EOSE
const events = await pool.query([{ kinds: [1], authors: [await signer.getPublicKey()] }])
console.log(events.map((e) => e.content))

await pool.close()
```

Nostrify methods take arrays of filters (`[{...}]`), unlike nostr-tools. Its README still shows older `reqRelays`/`eventRelays` options; 0.55 uses `reqRouter` and `eventRouter` as above.

## applesauce

```js
import { EventStore } from 'applesauce-core'
import { ProfileModel } from 'applesauce-core/models'
import { RelayPool } from 'applesauce-relay'

const jb55 = '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245'

// One store for the whole app; models re-emit when it changes
const eventStore = new EventStore()
const pool = new RelayPool()

eventStore.model(ProfileModel, jb55).subscribe((profile) => {
  if (profile) console.log('profile:', profile.name)
})

// request() emits events and completes after EOSE
pool.request(['wss://purplepag.es'], { kinds: [0], authors: [jb55] }).subscribe({
  next: (event) => eventStore.add(event),
  complete: () => console.log('done'),
})
```

Models such as `ProfileModel` and `TimelineModel` are observables over the store, which maps well onto UI state. In applesauce 7, `pool.req()` emits wrapped messages (`{ type: 'EVENT', event }`); use `pool.request()` for plain events. See [applesauce.build](https://applesauce.build) for loaders, actions and the React bindings.

## Next

- [Build Your First App](../getting-started/first-app.md): a small client end to end
- [Building Clients](../guides/building-clients.md): feeds, outbox routing, replies
- [Libraries Overview](./overview.md): picks for other languages
