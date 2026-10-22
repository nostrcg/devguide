---
sidebar_position: 6
title: Relay Communication
description: Every message between clients and relays, OK and CLOSED reasons, AUTH, reconnection, and a raw WebSocket client
---

# Relay Communication

Clients talk to relays over a WebSocket. Every message is a JSON array whose first element is the message type. This page is the reference for those messages, based on [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) and the NIPs that extend it.

Open **one connection per relay** and run all your subscriptions over it. Relays limit connections and subscriptions per client.

## Client to relay

| Message | Purpose |
|---|---|
| `["EVENT", <event>]` | Publish a signed event |
| `["REQ", <sub id>, <filter>, <filter>, …]` | Query stored events and subscribe to new ones. Filters are OR'd. See [Filters](./filters.md) |
| `["CLOSE", <sub id>]` | End a subscription |
| `["AUTH", <signed kind 22242 event>]` | Answer an authentication challenge ([NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md)) |
| `["COUNT", <query id>, <filter>, …]` | Ask for a count instead of the events ([NIP-45](https://github.com/nostr-protocol/nips/blob/master/45.md)) |
| `["NEG-OPEN", …]`, `["NEG-MSG", …]`, `["NEG-CLOSE", …]` | Set reconciliation (sync) ([NIP-77](https://github.com/nostr-protocol/nips/blob/master/77.md)) |

A subscription id is any non-empty string of up to 64 characters. It only has to be unique on that connection. Sending a new `REQ` with an id that is already open replaces that subscription.

## Relay to client

| Message | Meaning |
|---|---|
| `["EVENT", <sub id>, <event>]` | An event matching one of your subscriptions |
| `["OK", <event id>, <true\|false>, <message>]` | Accepted or rejected, in reply to every `EVENT`. The message is always present (it may be `""` when accepted) |
| `["EOSE", <sub id>]` | End of stored events. Matching new events keep coming |
| `["CLOSED", <sub id>, <message>]` | The relay refused or ended a subscription |
| `["NOTICE", <message>]` | Human-readable information. Don't parse it |
| `["AUTH", <challenge>]` | An authentication challenge ([NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md)) |
| `["COUNT", <query id>, {"count": <n>}]` | The answer to `COUNT`. May include `"approximate": true` |

Relays that support [NIP-67](https://github.com/nostr-protocol/nips/blob/master/67.md) may add a hint to `EOSE`: `["EOSE", <sub id>, ["finish"]]` means you have every stored match, `"more"` means page further, and `"auth"` means you may see more after AUTH. Ignore hints you don't know.

## OK and CLOSED reasons

When `OK` is `false`, and in every `CLOSED`, the message starts with a machine-readable prefix, a colon, then human-readable text. Branch on the prefix:

| Prefix | Meaning | What to do |
|---|---|---|
| `duplicate:` | The relay already has this event. Comes with **`true`** | Treat as success |
| `pow:` | Not enough proof of work ([NIP-13](https://github.com/nostr-protocol/nips/blob/master/13.md)). May also come with `true` | Mine a `nonce` tag, or use another relay |
| `blocked:` | You, your IP or the content are banned | Use another relay |
| `rate-limited:` | Too much, too fast | Back off and retry later |
| `invalid:` | Malformed event, bad signature, `created_at` too far off | Fix the event |
| `restricted:` | Not allowed, even after AUTH (e.g. paid or whitelisted relay) | Use another relay |
| `auth-required:` | You must AUTH first | Do AUTH, then retry (below) |
| `mute:` | Ephemeral event accepted but nobody was listening | Nothing |
| `error:` | Anything else, e.g. a server problem | Retry later or elsewhere |

Example replies:

```json
["OK", "b1a649ebe8...", true, ""]
["OK", "b1a649ebe8...", true, "duplicate: already have this event"]
["OK", "b1a649ebe8...", false, "rate-limited: slow down there chief"]
["OK", "b1a649ebe8...", false, "auth-required: we only accept events from registered users"]
["CLOSED", "sub1", "auth-required: we can't serve DMs to unauthenticated users"]
```

These lines are copied from NIP-01 and NIP-42. Ids are shortened as in the specs.

## A raw WebSocket client

You don't need a library to speak the protocol. This publishes a note, reads it back, verifies it and closes. It runs in a browser or in Node 22+ (which has a global `WebSocket`). nostr-tools is used only to sign and verify.

```js
// raw.mjs: talk to a relay with nothing but a WebSocket (Node 22+ or a browser)
import { finalizeEvent, generateSecretKey, verifyEvent } from 'nostr-tools/pure'

const RELAY = process.argv[2] ?? 'ws://localhost:10547'
const sk = generateSecretKey()
const note = finalizeEvent({ kind: 1, created_at: Math.floor(Date.now() / 1000), tags: [], content: 'hello over a raw socket' }, sk)

const ws = new WebSocket(RELAY)

ws.onopen = () => {
  ws.send(JSON.stringify(['EVENT', note]))
}

ws.onmessage = (msg) => {
  const [type, ...rest] = JSON.parse(msg.data)
  switch (type) {
    case 'OK': {
      const [id, accepted, reason] = rest
      // "duplicate:" arrives with accepted === true
      console.log('OK', id.slice(0, 8), accepted, reason)
      // now read it back
      if (accepted) ws.send(JSON.stringify(['REQ', 'mine', { ids: [note.id] }]))
      break
    }
    case 'EVENT': {
      const [subId, event] = rest
      // never trust a relay: check id and signature yourself
      if (verifyEvent(event)) console.log('EVENT', subId, event.content)
      break
    }
    case 'EOSE':
      console.log('EOSE', rest[0])
      ws.send(JSON.stringify(['CLOSE', rest[0]]))
      ws.close()
      break
    case 'CLOSED':
      console.log('CLOSED', rest[0], rest[1])
      break
    case 'NOTICE':
      console.log('NOTICE', rest[0])
      break
  }
}
```

```bash
npm i nostr-tools
nak serve &             # a local relay on ws://localhost:10547
node raw.mjs
# OK 1769a16f true
# EVENT mine hello over a raw socket
# EOSE mine
```

Note that it sends the `REQ` only after the `OK`. Send both at once and the query can finish before the event is stored.

## Authentication (NIP-42)

A relay can send `["AUTH", <challenge>]` at any time. To authenticate, sign a kind 22242 event with `relay` (the URL you connected to) and `challenge` tags and send it back in an `AUTH` message. The relay answers with an `OK`. Then retry whatever was refused.

```js
// auth.mjs: answer a NIP-42 challenge, then retry what the relay refused
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure'

const RELAY = process.argv[2] ?? 'ws://localhost:10547'
const sk = generateSecretKey()
const note = finalizeEvent({ kind: 1, created_at: Math.floor(Date.now() / 1000), tags: [], content: 'hi' }, sk)

let challenge = null
let authed = false
const ws = new WebSocket(RELAY)

ws.onopen = () => ws.send(JSON.stringify(['EVENT', note]))

ws.onmessage = (msg) => {
  const [type, ...rest] = JSON.parse(msg.data)
  if (type === 'AUTH') {
    // the relay may send this at any time; keep the latest challenge
    challenge = rest[0]
  } else if (type === 'OK' && rest[0] === note.id) {
    const [, accepted, reason] = rest
    if (!accepted && reason.startsWith('auth-required:') && challenge && !authed) {
      const auth = finalizeEvent({
        kind: 22242,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['relay', RELAY], ['challenge', challenge]],
        content: '',
      }, sk)
      ws.send(JSON.stringify(['AUTH', auth]))
    } else {
      console.log('note accepted:', accepted, reason)
      ws.close()
    }
  } else if (type === 'OK' && !authed) {
    // the OK for our AUTH event; on success, send the note again
    authed = rest[1]
    console.log('auth accepted:', authed, rest[2])
    if (authed) ws.send(JSON.stringify(['EVENT', note]))
  }
}
```

Tested against `nak serve --auth`, a local relay that requires AUTH for everything. It printed `auth accepted: true`, then `note accepted: true`.

AUTH tells the relay who the user is. Only do it with relays the user chose, such as their own relay list or DM relays, and only when a relay asks. With nostr-tools, pass an `onauth` callback and the library handles the exchange:

```js
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure'
import { SimplePool } from 'nostr-tools/pool'

const relays = ['ws://localhost:10547']
const sk = generateSecretKey()
const pool = new SimplePool()

const note = finalizeEvent({ kind: 1, created_at: Math.floor(Date.now() / 1000), tags: [], content: 'hi' }, sk)

// onauth is called when a relay answers "auth-required:"; sign the kind 22242 template it gives you
const onauth = (template) => finalizeEvent(template, sk)

const results = await Promise.allSettled(pool.publish(relays, note, { onauth }))
results.forEach((r, i) => console.log(relays[i], r.status, r.reason?.message ?? r.value))
pool.close(relays)
```

In a browser, use `onauth: (t) => window.nostr.signEvent(t)`. `subscribeMany` takes the same `onauth` parameter.

## Publishing to several relays

`pool.publish(relays, event)` returns **an array of promises**, one per relay, each resolving with the relay's `OK` message or rejecting with its reason. Don't `await` the array itself: that waits for nothing.

```js
// succeed as soon as one relay accepts (throws AggregateError if all reject)
await Promise.any(pool.publish(relays, event))

// or wait for every relay and report
const results = await Promise.allSettled(pool.publish(relays, event))
const accepted = results.filter((r) => r.status === 'fulfilled').length
```

Publish to the user's own write relays (their kind 10002), plus the read relays of anyone you mention or reply to.

## Staying connected

Connections drop: relays restart, phones change networks, idle sockets get closed. A client should:

- reconnect with a back-off (for example 1 s, 2 s, 4 s, up to 30 s),
- reopen its subscriptions, with `since` set to the newest `created_at` it already has, so it doesn't download everything again,
- deduplicate by event id, since the overlap means some events arrive twice.

nostr-tools' `SimplePool` doesn't reconnect by default, and calls `onclose` when a relay drops. It has an `enableReconnect` option, but when we killed a local relay mid-subscription (October 2026, nostr-tools 2.25.2) the subscription was closed rather than resumed. This wrapper handles it explicitly and was tested by killing and restarting a relay:

```js
// resubscribe after the relay drops us, picking up where we left off
export function keepSubscribed(pool, relays, filter, onevent) {
  let newest = 0
  let delay = 1000
  let sub
  let stopped = false

  const open = () => {
    const f = newest ? { ...filter, since: newest } : filter
    sub = pool.subscribeMany(relays, f, {
      onevent(e) {
        delay = 1000
        newest = Math.max(newest, e.created_at)
        onevent(e)
      },
      onclose(reasons) {
        if (stopped) return
        console.warn('subscription closed', reasons)
        // back off: 1 s, 2 s, 4 s … up to 30 s
        setTimeout(open, delay)
        delay = Math.min(delay * 2, 30000)
      },
    })
  }

  open()
  return { close: () => { stopped = true; sub.close() } }
}
```

```js
const sub = keepSubscribed(pool, relays, { kinds: [1], authors: follows, limit: 50 }, (e) => feed.set(e.id, e))
// later
sub.close()
```

## Relay information (NIP-11)

A relay describes itself over HTTP when you request its URL with `Accept: application/nostr+json`: its name, supported NIPs, software and limits such as `max_subscriptions`, `max_limit` and `max_message_length`.

```bash
curl -H 'Accept: application/nostr+json' https://relay.primal.net
nak relay wss://relay.primal.net
```

[Relay info](../reference/relay-info.md) covers the fields and how to use them.

## See also

- [Filters](./filters.md): what to put in a `REQ`.
- [Events](./events.md): what goes in an `EVENT`.
- [Running a relay](../relays/running-a-relay.md): the other side of the socket.
