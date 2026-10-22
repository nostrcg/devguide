---
sidebar_position: 8
title: Lightning Zaps
description: Send, receive and verify NIP-57 zaps, with code tested against real Lightning wallets
---

# Lightning Zaps

A zap is a Lightning payment that leaves a public, signed record on Nostr. [NIP-57](https://github.com/nostr-protocol/nips/blob/master/57.md) defines two events:

| Kind | Name | Who signs it | Published? |
|---|---|---|---|
| 9734 | Zap request | The sender | No. It goes to the recipient's LNURL server over HTTP |
| 9735 | Zap receipt | The recipient's LNURL server (its `nostrPubkey`) | Yes, to the relays named in the request |

A receipt only says that the recipient's server *claims* an invoice was paid. Anyone can publish a kind 9735 event, so a client **must validate receipts** before it counts or displays them.

The code on this page uses nostr-tools 2.25.2, `@getalby/sdk` 8.1.1, `light-bolt11-decoder` 3.2.0, `@noble/hashes` 2.x and `@scure/base` 2.x on Node 24. It was tested in October 2026 with real payments between two [NWC faucet](https://faucet.nwc.dev) test wallets, both against Alby's Lightning addresses and against the server at the end of this page.

```bash
npm i nostr-tools @getalby/sdk light-bolt11-decoder @noble/hashes @scure/base
```

## The flow

1. Find the recipient's LNURL-pay endpoint: from the `zap` tags on the event, else from `lud16` (or `lud06`) in their kind 0 profile.
2. `GET` it. Zaps are supported only if `allowsNostr` is `true` and `nostrPubkey` is a valid hex key. Keep `callback`, `minSendable`, `maxSendable` and `nostrPubkey`.
3. Sign a kind 9734 zap request. Don't publish it: send it to the `callback` with a `GET`, as the `nostr` query parameter, together with `amount` (millisats) and `lnurl`.
4. The server validates the request and returns a **description-hash** invoice, where the description is the zap request JSON and nothing else.
5. Pay the invoice with any wallet.
6. The server publishes a kind 9735 receipt to the relays in the request.
7. Clients fetch receipts and validate them before showing them.

## Client: send a zap

Put the helpers below in `zap-lib.mjs`.

**Step 1: check the address supports zaps.** nostr-tools has `nip57.getZapEndpoint`, but it returns only the callback. You need `nostrPubkey` later to validate receipts, so fetch the endpoint yourself:

```js title="zap-lib.mjs"
import { bech32 } from '@scure/base'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js'
import { decode } from 'light-bolt11-decoder'
import { makeZapRequest } from 'nostr-tools/nip57'
import { verifyEvent } from 'nostr-tools/pure'

const HEX64 = /^[0-9a-f]{64}$/

// Step 1: resolve a lud16 address to LNURL-pay info and check it supports zaps
export async function getZapInfo(lud16) {
  const [name, domain] = lud16.split('@')
  const url = `https://${domain}/.well-known/lnurlp/${name}`
  const res = await (await fetch(url)).json()
  if (res.tag !== 'payRequest') throw new Error('not an LNURL-pay endpoint')
  if (res.allowsNostr !== true || !HEX64.test(res.nostrPubkey ?? ''))
    throw new Error('this address does not support zaps')
  return {
    callback: res.callback,
    // the key that must sign this recipient's zap receipts
    nostrPubkey: res.nostrPubkey,
    minSendable: res.minSendable, // millisats
    maxSendable: res.maxSendable,
    // bech32 "lnurl1..." form of the URL, for the lnurl tag
    lnurl: bech32.encode('lnurl', bech32.toWords(utf8ToBytes(url)), 1023),
  }
}
```

**Steps 2–4: request the invoice.** `makeZapRequest` builds the kind 9734 template with `p`, `amount`, `relays`, and, for an event, `e`, `a` and `k` tags. It doesn't add the recommended `lnurl` tag, so add it yourself. Before you pay, check that the invoice is for the amount you asked for:

```js title="zap-lib.mjs (continued)"
// Steps 2-3: sign a zap request, send it to the callback, check the invoice
export async function requestZapInvoice({ info, signer, recipient, event, sats, comment, relays }) {
  const amount = sats * 1000
  if (amount < info.minSendable || amount > info.maxSendable)
    throw new Error('amount outside the min/max this address accepts')

  const template = makeZapRequest(event
    ? { event, amount, comment, relays }
    : { pubkey: recipient, amount, comment, relays })
  template.tags.push(['lnurl', info.lnurl])
  const zapRequest = await signer.signEvent(template)

  const json = JSON.stringify(zapRequest)
  const u = new URL(info.callback)
  u.searchParams.set('amount', String(amount))
  u.searchParams.set('nostr', json)
  u.searchParams.set('lnurl', info.lnurl)
  const res = await (await fetch(u)).json()
  if (!res.pr) throw new Error(res.reason ?? 'no invoice returned')

  // don't pay an invoice that doesn't commit to what you asked for
  const inv = decode(res.pr)
  const get = name => inv.sections.find(s => s.name === name)?.value
  if (Number(get('amount')) !== amount) throw new Error('invoice amount mismatch')
  if (get('description_hash') !== bytesToHex(sha256(utf8ToBytes(json))))
    console.warn('invoice does not commit to the zap request (description hash)')
  return res.pr
}
```

**Step 5: pay it,** and then look for the receipt. Here a [NIP-47 Wallet Connect](https://github.com/nostr-protocol/nips/blob/master/47.md) connection pays the invoice. `NWCClient` is in `@getalby/sdk/nwc`. Treat the `nostr+walletconnect://` URL as a secret, because it can spend from the wallet. In a browser you can also pass the invoice to a WebLN wallet or show it as a QR code.

```js
import { NWCClient } from '@getalby/sdk/nwc'
import { SimplePool } from 'nostr-tools/pool'
import { getZapInfo, requestZapInvoice, checkZapReceipt } from './zap-lib.mjs'

// `note` is the event being zapped, `profile` its author's kind 0,
// `nwcUrl` the user's nostr+walletconnect:// connection string
const { lud16 } = JSON.parse(profile.content)
const info = await getZapInfo(lud16)

const relays = ['wss://relay.primal.net', 'wss://nos.lol'] // where the receipt goes
const pr = await requestZapInvoice({
  info, signer: window.nostr, event: note, sats: 21, comment: 'great post', relays,
})

// pay it: here over Nostr Wallet Connect (NIP-47); the NWC URL is a secret
const wallet = new NWCClient({ nostrWalletConnectUrl: nwcUrl })
await wallet.payInvoice({ invoice: pr })
wallet.close()

// the recipient's server publishes the receipt; check it before you count it
const pool = new SimplePool()
await new Promise(r => setTimeout(r, 5000))
const receipts = await pool.querySync(relays, { kinds: [9735], '#e': [note.id] })
const zaps = receipts.map(r => checkZapReceipt(r, info, { strict: false })).filter(z => z.ok)
const total = zaps.reduce((sum, z) => sum + z.msats, 0) / 1000
console.log(`${zaps.length} zaps, ${total} sats`)
```

For a zap to a profile rather than a note, pass `recipient: <hex pubkey>` instead of `event`.

### Zap splits

If the zapped event has `zap` tags (`["zap", <pubkey>, <relay>, <weight>]`), pay the people they list instead of the author. Split the amount by weight. If no tag has a weight, split it equally. If only some tags have weights, the tags without one get nothing. Send each recipient a separate zap request, with their own LNURL endpoint.

## Client: validate receipts

NIP-57 Appendix F requires two checks, recommends a third, and Appendix E recommends a fourth:

| Check | Level |
|---|---|
| The receipt's `pubkey` is the recipient's `nostrPubkey` from step 1 | MUST |
| The `bolt11` invoice amount equals the zap request's `amount` tag, if present | MUST |
| The zap request's `lnurl` tag, if present, equals the recipient's lnurl | SHOULD |
| `SHA256(description)` equals the invoice's description hash | SHOULD |

The function below also verifies both signatures and checks that the receipt's `p` and `e` tags match the request:

```js title="zap-lib.mjs (continued)"
// Appendix F: is this kind 9735 a real zap for this recipient?
// nostrPubkey and lnurl come from getZapInfo() for the zapped user
export function checkZapReceipt(receipt, { nostrPubkey, lnurl }, { strict = true } = {}) {
  const fail = reason => ({ ok: false, reason })
  if (receipt.kind !== 9735 || !verifyEvent(receipt)) return fail('bad receipt event')
  // MUST: signed by the recipient's LNURL server
  if (receipt.pubkey !== nostrPubkey) return fail('not signed by the nostrPubkey')
  const tag = name => receipt.tags.find(t => t[0] === name)?.[1]
  const bolt11 = tag('bolt11')
  const description = tag('description')

  let zapRequest, inv
  try {
    zapRequest = JSON.parse(description)
    inv = decode(bolt11)
  } catch {
    return fail('unparseable description or bolt11')
  }
  if (zapRequest.kind !== 9734 || !verifyEvent(zapRequest)) return fail('bad zap request')
  const zr = name => zapRequest.tags.find(t => t[0] === name)?.[1]
  const get = name => inv.sections.find(s => s.name === name)?.value
  const msats = Number(get('amount'))

  // MUST: invoice amount equals the zap request amount (if present)
  if (zr('amount') !== undefined && Number(zr('amount')) !== msats) return fail('amount mismatch')
  // SHOULD: the zap request's lnurl is the recipient's
  if (zr('lnurl') !== undefined && zr('lnurl') !== lnurl) return fail('lnurl mismatch')
  // the receipt is about the same recipient and note as the request
  if (tag('p') !== zr('p') || tag('e') !== zr('e')) return fail('p/e tags differ from the request')
  // SHOULD: the invoice commits to the zap request
  const hashOk = get('description_hash') === bytesToHex(sha256(utf8ToBytes(description)))
  if (strict && !hashOk) return fail('description hash mismatch')

  return { ok: true, hashOk, sender: zapRequest.pubkey, msats, comment: zapRequest.content }
}
```

To load the zaps on a note, query `{ kinds: [9735], '#e': [note.id] }`. For a profile, query `{ kinds: [9735], '#p': [pubkey] }`. Run each receipt through `checkZapReceipt` with the zapped user's `getZapInfo()` result, and cache that result per user.

:::caution The description hash in practice
In October 2026, many receipts on public relays fail the SHOULD-level description-hash check. We sampled 300 recent receipts on relay.primal.net. 136 matched, 126 had a hash that doesn't match the `description` tag, and 31 had no description hash at all. Most of the mismatches came from one large provider. The Alby test wallets we used also returned plain-description invoices.

With `strict: true` (the default), `checkZapReceipt` rejects those receipts. Use `{ strict: false }` to count them, and use the `hashOk` field if you want to show them differently. Never relax the two MUST checks: they are what stop fake zaps.
:::

## Server: accept zaps

To receive zaps on your own domain, add two fields to your LNURL-pay endpoint (`/.well-known/lnurlp/<user>`): `allowsNostr: true`, and `nostrPubkey`, the key your server signs receipts with. Then the callback has to do three things:

1. **Validate the zap request** (Appendix D). It MUST have a valid signature, tags, exactly one `p` tag and 0 or 1 `e` tags. It should have a `relays` tag. If it has an `amount` tag, the tag MUST equal the `amount` query parameter. An `a` tag MUST be a valid event coordinate. There MUST be 0 or 1 `P` tags, and a `P` tag MUST equal the receipt's pubkey. nostr-tools' `validateZapRequest` checks the signature, the `p` tag, `e` hex and the `relays` tag. The other checks are below.
2. **Create a description-hash invoice** over the exact zap request string. Store the zap request until the invoice is paid.
3. **When the invoice is paid**, publish a kind 9735 receipt (Appendix E) to the request's relays. It carries the request's `p`, `e` and `a` tags, a `P` tag with the sender's pubkey, `bolt11`, `description` (the zap request JSON) and optionally `preimage`, with `created_at` set to the time the invoice was paid. `makeZapReceipt` builds it.

This server does all three, using a wallet reached over NWC to create invoices and to get "payment received" notifications. It serves `alice@<your domain>`. Run it behind HTTPS (see [Reverse proxy](../relays/reverse-proxy.md)), with `BASE_URL=https://<your domain>`:

```js title="zap-server.mjs"
import http from 'node:http'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js'
import { NWCClient } from '@getalby/sdk/nwc'
import { validateZapRequest, makeZapReceipt } from 'nostr-tools/nip57'
import { finalizeEvent, getPublicKey } from 'nostr-tools/pure'
import { SimplePool } from 'nostr-tools/pool'

// secrets come from the environment, never from argv
const serverKey = hexToBytes(process.env.ZAP_SERVER_KEY)
const nostrPubkey = getPublicKey(serverKey)
const wallet = new NWCClient({ nostrWalletConnectUrl: process.env.NWC_URL })
const BASE = process.env.BASE_URL // e.g. https://example.com
const USERS = { alice: true } // the addresses you serve
const MIN = 1000, MAX = 10_000_000 // millisats
const pool = new SimplePool()
const pending = new Map() // payment_hash -> zap request JSON (use a database)

// Appendix D, on top of nostr-tools' checks (signature, p, e, relays)
function checkZapRequest(json, amountParam) {
  const err = validateZapRequest(json)
  if (err) return err
  const zr = JSON.parse(json)
  if (zr.kind !== 9734) return 'not a kind 9734'
  const count = name => zr.tags.filter(t => t[0] === name).length
  if (count('p') !== 1) return 'must have exactly one p tag'
  if (count('e') > 1) return 'must have 0 or 1 e tags'
  if (count('P') > 1) return 'must have 0 or 1 P tags'
  const P = zr.tags.find(t => t[0] === 'P')
  if (P && P[1] !== nostrPubkey) return 'P tag must equal the receipt pubkey'
  const amount = zr.tags.find(t => t[0] === 'amount')
  if (amount && amount[1] !== amountParam) return 'amount tag differs from amount parameter'
  const a = zr.tags.find(t => t[0] === 'a')
  if (a && !/^\d+:[0-9a-f]{64}:.*$/.test(a[1] ?? '')) return 'invalid a tag'
  return null
}

const json = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
  res.end(JSON.stringify(body))
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, BASE)
  const m = url.pathname.match(/^\/(?:\.well-known\/)?lnurlp\/([a-z0-9._-]+)(\/callback)?$/)
  if (!m || !USERS[m[1]]) return json(res, 404, { status: 'ERROR', reason: 'unknown user' })
  const name = m[1]
  const metadata = JSON.stringify([['text/identifier', `${name}@${url.host}`], ['text/plain', `Sats for ${name}`]])

  if (!m[2]) {
    // LUD-06/16 pay request, plus the two NIP-57 fields
    return json(res, 200, {
      tag: 'payRequest', callback: `${BASE}/lnurlp/${name}/callback`,
      minSendable: MIN, maxSendable: MAX, metadata,
      allowsNostr: true, nostrPubkey,
    })
  }

  const amount = url.searchParams.get('amount')
  const nostr = url.searchParams.get('nostr')
  if (!/^\d+$/.test(amount ?? '') || +amount < MIN || +amount > MAX)
    return json(res, 200, { status: 'ERROR', reason: 'bad amount' })

  try {
    let descriptionHash
    if (nostr) {
      const reason = checkZapRequest(nostr, amount)
      if (reason) return json(res, 200, { status: 'ERROR', reason })
      // the description is the zap request and nothing else
      descriptionHash = bytesToHex(sha256(utf8ToBytes(nostr)))
    } else {
      // a plain LNURL payment: hash the metadata as LUD-06 says
      descriptionHash = bytesToHex(sha256(utf8ToBytes(metadata)))
    }
    const inv = await wallet.makeInvoice({ amount: +amount, description_hash: descriptionHash })
    if (nostr) pending.set(inv.payment_hash, nostr)
    return json(res, 200, { pr: inv.invoice, routes: [] })
  } catch (e) {
    return json(res, 200, { status: 'ERROR', reason: 'could not create invoice' })
  }
}).listen(process.env.PORT ?? 8080)

// Appendix E: when an invoice is paid, publish the zap receipt
await wallet.subscribeNotifications(async ({ notification_type, notification: tx }) => {
  const zapRequest = pending.get(tx.payment_hash)
  if (notification_type !== 'payment_received' || !zapRequest) return
  pending.delete(tx.payment_hash)
  const receipt = finalizeEvent(makeZapReceipt({
    zapRequest,
    bolt11: tx.invoice,
    preimage: tx.preimage,
    paidAt: new Date(tx.settled_at * 1000),
  }), serverKey)
  // in production, accept only wss:// URLs and reject IP literals and private
  // or loopback hosts: these URLs come from a stranger's zap request
  const relays = JSON.parse(zapRequest).tags.find(t => t[0] === 'relays').slice(1, 6)
  await Promise.allSettled(pool.publish(relays, receipt))
}, ['payment_received'])
```

```bash
# a throwaway key for testing; in production, load it from a secret store
export ZAP_SERVER_KEY=$(nak key generate)
read -rs NWC_URL && export NWC_URL   # paste the wallet's NWC URL, then Enter
BASE_URL=https://example.com PORT=8080 node zap-server.mjs
```

We tested it end to end: a client zapped `alice@localhost`, a second faucet wallet paid the invoice, the server published a receipt to a local `nak serve`, and `checkZapReceipt` returned `ok: true, hashOk: true`. A request with two `p` tags got `must have exactly one p tag`.

Notes for production:

- Keep `pending` in a database. The receipt must still go out if the server restarts between invoice and payment.
- Limit how many relays you publish each receipt to (the code takes 5).
- Your wallet must support NIP-47 `make_invoice` with `description_hash`, and `payment_received` notifications. The NWC faucet wallets we tested with do. Check `wallet.getInfo()` for your wallet.
- NIP-57 links [cln-nostr-zapper](https://github.com/jb55/cln-nostr-zapper) as its reference server, for Core Lightning.

## Related

- [NIP-57](https://github.com/nostr-protocol/nips/blob/master/57.md), [NIP-47 Wallet Connect](https://github.com/nostr-protocol/nips/blob/master/47.md), [NIP-75 zap goals](https://github.com/nostr-protocol/nips/blob/master/75.md).
- [NIP-61 Nutzaps](https://github.com/nostr-protocol/nips/blob/master/61.md): Cashu ecash tips, where the token itself is published, so no LNURL server is involved.
- "Private" and anonymous zaps are not in NIP-57 (see its "Future Work"), and few clients support them.
- [Feed algorithms](./algorithms.md) and [Social graph](./social-graph.md) use zaps as ranking and trust signals. Count only validated receipts.
