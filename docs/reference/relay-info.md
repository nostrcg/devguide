---
sidebar_position: 3
title: Relay Information
description: NIP-11 relay information document fields, and how to fetch and use them
---

# Relay Information

A relay describes itself in a JSON document defined by [NIP-11](https://github.com/nostr-protocol/nips/blob/master/11.md).
This page lists the fields NIP-11 defines (as of October 2026) and shows how to fetch the document.

## Request

Send an HTTP(S) `GET` to the relay's WebSocket URL, with `ws` swapped for `http`, and this header:

```text
Accept: application/nostr+json
```

```bash
curl -s -m 10 -H 'Accept: application/nostr+json' https://relay.primal.net | jq
```

Or use nak, which does the same thing:

```bash
nak relay wss://relay.primal.net
```

Relays must send CORS headers on this response, so browsers can fetch it directly.

## Top-level fields

Every field is optional. Clients must ignore fields they don't understand.

| Field | Type | Meaning |
|---|---|---|
| `name` | string | Display name. Should be under 30 characters. |
| `description` | string | Plain text. Paragraphs are separated by double newlines. |
| `banner` | URL | Image that represents the relay. |
| `icon` | URL | Small, ideally square, image for relay lists. |
| `pubkey` | hex | The admin's pubkey. Clients can send it [NIP-17](https://github.com/nostr-protocol/nips/blob/master/17.md) DMs. |
| `self` | hex | The relay's own pubkey, for events the relay signs itself. |
| `contact` | URI | Other admin contact, such as `mailto:` or `https:`. A pubkey is preferred. |
| `supported_nips` | integer[] | NIPs the relay implements. Client-side NIPs should not be listed. |
| `software` | URL | Homepage of the relay software. |
| `version` | string | Software version or commit. |
| `terms_of_service` | URL | Terms of service document. |
| `limitation` | object | Limits the relay enforces (see below). |
| `payments_url` | URL | Where to pay, for paid relays. |
| `fees` | object | Fee schedule (see below). |

Relays often add their own extra fields. For example, strfry adds `"negentropy": 1`.

## `limitation`

| Field | Meaning |
|---|---|
| `max_message_length` | Maximum bytes of one incoming WebSocket message (from `[` to `]`, UTF-8). This also caps event size. |
| `max_subscriptions` | Open subscriptions allowed per connection. |
| `max_limit` | The relay clamps each filter's `limit` to this, usually without telling you. |
| `default_limit` | Number of events returned for a filter with no `limit`. |
| `max_subid_length` | Longest subscription id accepted. |
| `max_event_tags` | Most entries allowed in an event's `tags`. |
| `max_content_length` | Most Unicode characters allowed in `content`. `max_message_length` still applies. |
| `min_pow_difficulty` | Required [NIP-13](https://github.com/nostr-protocol/nips/blob/master/13.md) proof-of-work. |
| `auth_required` | [NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md) AUTH is needed before anything else. If `false`, some actions may still need AUTH. |
| `payment_required` | Payment is needed before anything else. |
| `restricted_writes` | Only some events are accepted (a whitelist, a niche kind, paid users). Normal spam filtering doesn't count. |
| `created_at_lower_limit` | How far in the past `created_at` may be, in seconds. |
| `created_at_upper_limit` | How far in the future `created_at` may be, in seconds. |

`max_filters`, `relay_countries`, `language_tags`, `tags` and `posting_policy` were removed from NIP-11. Some old relays and
libraries still have them. Don't rely on them.

## `fees`

```json
{
  "payments_url": "https://my-relay/payments",
  "fees": {
    "admission": [{ "amount": 1000000, "unit": "msats" }],
    "subscription": [{ "amount": 5000000, "unit": "msats", "period": 2592000 }],
    "publication": [{ "kinds": [4], "amount": 100, "unit": "msats" }]
  }
}
```

`period` is in seconds. `publication` fees can apply to specific `kinds`.

## A real response

From `nak relay wss://relay.primal.net` (October 2026, reformatted):

```json
{
  "name": "Primal Public Relay",
  "description": "Primal Public Relay",
  "pubkey": "dd9b989dfe5e0840a92538f3e9f84f674e5f17ab05932efbacb4d8e6c905f302",
  "contact": "primal.net",
  "supported_nips": [1, 2, 4, 9, 11, 28, 40, 45, 70],
  "software": "git+https://github.com/hoytech/strfry.git",
  "version": "1.1.3",
  "limitation": {
    "max_message_length": 1000000,
    "max_subscriptions": 20,
    "max_limit": 500,
    "created_at_lower_limit": 0,
    "created_at_upper_limit": 0,
    "auth_required": false,
    "payment_required": false,
    "restricted_writes": false
  },
  "icon": "https://blossom.primal.net/4aa623c632c62f0ae442547e263931ca58c58acf79c718f79ba943e4591c6076.png",
  "negentropy": 1
}
```

Real documents don't always follow the spec. Here `contact` is not a URI and `software` is not a plain homepage URL.
Parse defensively.

## Fetch it in JavaScript

Plain `fetch`, for browsers and Node 18+:

```js
async function getRelayInfo(relayUrl, timeoutMs = 5000) {
  const url = relayUrl.replace(/^ws(s?):\/\//, 'http$1://')
  const res = await fetch(url, {
    headers: { Accept: 'application/nostr+json' },
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return res.json()
}

const info = await getRelayInfo('wss://relay.primal.net')
console.log(info.name, info.software, info.supported_nips)

const limits = info.limitation ?? {}
console.log('max_message_length:', limits.max_message_length ?? 'not advertised')
console.log('auth_required:', limits.auth_required === true)
```

nostr-tools 2.25 has a helper:

```js
import { fetchRelayInformation } from 'nostr-tools/nip11'

const doc = await fetchRelayInformation('wss://relay.nostr.net')
console.log(doc.name, doc.supported_nips?.includes(77) ? 'has NIP-77' : 'no NIP-77')
```

Both were run with Node 24 in October 2026. `fetchRelayInformation` has no timeout of its own, so wrap it if a slow relay
would block you.

## Using it

- Check `supported_nips` before you depend on a relay feature, such as `45` for `COUNT`, `50` for search or `77` for negentropy sync.
- Size requests to `max_limit`. If you get exactly `max_limit` events back, page with `until` to get the rest.
- If `auth_required` or `restricted_writes` is `true`, expect `auth-required:` or `restricted:` rejections and handle them.
- Cache the document. It changes rarely, and fetching it for every connection is wasted work.
- Treat it as a claim. A relay can advertise a NIP it handles badly, or none at all. Some relays don't serve NIP-11, and some
  refuse command-line HTTP clients while browsers work.

## Finding relays

NIP-11 describes one relay you already know about. To find relays:

- **A user's relays**: their kind `10002` relay list ([NIP-65](https://github.com/nostr-protocol/nips/blob/master/65.md)).
  `nak relays npub1…` prints it. Indexer relays such as `wss://purplepag.es` hold many of these lists.
- **Relays in general**: [NIP-66](https://github.com/nostr-protocol/nips/blob/master/66.md) monitors publish kind `30166`
  reports with uptime, round-trip times and supported NIPs. [Relay Explorers](../relays/explorers.md) shows how to query them.

## See also

- [Relay Communication](../protocol/relay-communication.md): the WebSocket messages
- [Relay Explorers](../relays/explorers.md): monitoring sites and NIP-66
- [Command Snippets](snippets.md): comparing several relays' NIP-11 documents
