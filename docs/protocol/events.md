---
sidebar_position: 2
title: Events
description: The Nostr event structure, how ids and signatures are computed, tags, and creating and verifying events in code
---

# Events

An event is the only data type in Nostr. Posts, profiles, reactions, follow lists and relay lists are all events. This page is the canonical reference for the structure. The [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) spec has the last word.

## Structure

This is a real reply event, signed with the throwaway test key from [Keys and signing](../getting-started/keys-and-signing.md). You can check it yourself with `nak verify`.

```json
{
  "id": "16c919ba88ee92164740ccc60d031eaf514ee4ee4cbe980a1ccbb944bb716c5e",
  "pubkey": "b0eac043f3e04418711b47c72d44481e3d6b1fde19202a2c0d9b4580f934c4f3",
  "created_at": 1792650060,
  "kind": 1,
  "tags": [
    ["e", "3840c24f14afcc3682d145f3d8a5a8684a273294470f88c38827ad6ed035b569", "wss://relay.primal.net", "root", "b0eac043f3e04418711b47c72d44481e3d6b1fde19202a2c0d9b4580f934c4f3"],
    ["p", "b0eac043f3e04418711b47c72d44481e3d6b1fde19202a2c0d9b4580f934c4f3"]
  ],
  "content": "Replying to my own note.",
  "sig": "b0f67c0852a3dcc41a480887d1be71b4fb9409ccf0df71abc61bccef3047b3089c90e7c3103323ca1468464e027c492ac1359540b089b523417c403ce32154d9"
}
```

| Field | Type | Meaning |
|---|---|---|
| `id` | 64-char lowercase hex | SHA-256 of the serialized event (below) |
| `pubkey` | 64-char lowercase hex | The author's public key |
| `created_at` | integer | Unix time in seconds, set by the author |
| `kind` | integer, 0–65535 | What the event is. See [Event kinds](./kinds.md) |
| `tags` | array of arrays of strings | Metadata and references |
| `content` | string | The payload. Its meaning depends on the kind |
| `sig` | 128-char lowercase hex | 64-byte BIP-340 Schnorr signature of the id |

## The id and the signature

To get the `id`, serialize this array as JSON and take the SHA-256 of its UTF-8 bytes:

```
[0, <pubkey>, <created_at>, <kind>, <tags>, <content>]
```

NIP-01's rules for the serialization:

- UTF-8 encoding, and no whitespace or line breaks between tokens.
- In strings, escape exactly these characters: line feed `\n`, double quote `\"`, backslash `\\`, carriage return `\r`, tab `\t`, backspace `\b`, form feed `\f`. Every other character goes in as-is (no `\uXXXX` escapes for non-ASCII text).

JavaScript's `JSON.stringify` follows these rules for any text without other control characters (U+0000–U+001F, which it writes as `\u00XX`). The `sig` is a Schnorr signature over the 32 id bytes.

Your library does all of this for you. Here it is by hand, to show there's nothing hidden:

```bash
npm i @noble/curves @noble/hashes
```

```js
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js'
import { schnorr } from '@noble/curves/secp256k1.js'

const sk = schnorr.utils.randomSecretKey()
const event = {
  pubkey: bytesToHex(schnorr.getPublicKey(sk)),
  created_at: Math.floor(Date.now() / 1000),
  kind: 1,
  tags: [['t', 'nostr']],
  content: 'Hello, "Nostr"!\nSecond line ✨',
}

// NIP-01: sha256 over the UTF-8 bytes of this array, no whitespace
const serialized = JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content])
const hash = sha256(utf8ToBytes(serialized))
event.id = bytesToHex(hash)

// BIP-340 Schnorr signature over the 32-byte id (bytes, not a hex string)
event.sig = bytesToHex(schnorr.sign(hash, sk))

console.log(schnorr.verify(hexToBytes(event.sig), hash, hexToBytes(event.pubkey)))
// true
```

The result passes nostr-tools' `verifyEvent`. With @noble v2, import paths need the `.js` suffix, and `schnorr.sign` takes bytes: passing a hex string throws.

## Tags

A tag is an array of strings. The first element is the tag **name**, the second its **value**, and the rest have meanings set per tag. Relays index every tag whose name is a single letter (`a`–`z`, `A`–`Z`), using its first value, so you can [filter](./filters.md) on them with `#e`, `#p`, `#t` and so on.

| Tag | Format | Meaning | Spec |
|---|---|---|---|
| `e` | `["e", <event id>, <relay hint>, <marker>, <author pubkey>]` | A referenced event. In kind 1 replies the marker is `root` or `reply` | [01](https://github.com/nostr-protocol/nips/blob/master/01.md), [10](https://github.com/nostr-protocol/nips/blob/master/10.md) |
| `p` | `["p", <pubkey>, <relay hint>]` | A referenced user | [01](https://github.com/nostr-protocol/nips/blob/master/01.md) |
| `a` | `["a", "<kind>:<pubkey>:<d>", <relay hint>]` | A referenced addressable or replaceable event (for replaceable kinds, `d` is empty: keep the trailing colon) | [01](https://github.com/nostr-protocol/nips/blob/master/01.md) |
| `d` | `["d", <identifier>]` | The identifier of an addressable event | [01](https://github.com/nostr-protocol/nips/blob/master/01.md) |
| `q` | `["q", <event id or address>, <relay hint>, <pubkey>]` | A quoted event (quote post) | [18](https://github.com/nostr-protocol/nips/blob/master/18.md) |
| `t` | `["t", <hashtag>]` | A hashtag, lowercase | [24](https://github.com/nostr-protocol/nips/blob/master/24.md) |
| `r` | `["r", <url>]` | A referenced URL (in kind 10002, a relay) | [24](https://github.com/nostr-protocol/nips/blob/master/24.md), [65](https://github.com/nostr-protocol/nips/blob/master/65.md) |
| `k` | `["k", <kind>]` | The kind of a referenced event, as a string | [09](https://github.com/nostr-protocol/nips/blob/master/09.md), [25](https://github.com/nostr-protocol/nips/blob/master/25.md) |
| `imeta` | `["imeta", "url …", "m …", …]` | Metadata for a media URL in the content | [92](https://github.com/nostr-protocol/nips/blob/master/92.md) |
| `expiration` | `["expiration", <unix time>]` | Relays should drop the event after this time | [40](https://github.com/nostr-protocol/nips/blob/master/40.md) |
| `nonce` | `["nonce", <nonce>, <target difficulty>]` | Proof of work | [13](https://github.com/nostr-protocol/nips/blob/master/13.md) |
| `-` | `["-"]` | Protected: relays accept it only from the author, after AUTH | [70](https://github.com/nostr-protocol/nips/blob/master/70.md) |

Relay hints may be empty strings. The 4-element `p` tag with a petname, `["p", <pubkey>, <relay>, <petname>]`, belongs to kind 3 follow lists only ([NIP-02](https://github.com/nostr-protocol/nips/blob/master/02.md)).

### Replies

[NIP-10](https://github.com/nostr-protocol/nips/blob/master/10.md) threads kind 1 notes with **marked** `e` tags:

- A direct reply to the thread's first note: one `e` tag marked `root`.
- A reply deeper in a thread: one `e` tag marked `root` (the first note) and one marked `reply` (the note being answered).
- Copy the parent's `p` tags and add a `p` tag for the parent's author, so everyone in the thread is notified.

Kind 1 replies are only for kind 1 notes. To comment on anything else (an article, a picture, a web page), use a kind 1111 comment ([NIP-22](https://github.com/nostr-protocol/nips/blob/master/22.md)).

The only markers are `root` and `reply`. To quote a note without replying to it, use a `q` tag and put the `nostr:nevent1…` reference in the content. Old clients sent unmarked, positional `e` tags. That form is deprecated: read it, but don't write it.

The example at the top of this page is a direct reply.

## Storage classes

The kind number decides how relays store an event:

- **Regular** (1, 2, 4–44, 1000–9999): every event is kept.
- **Replaceable** (0, 3, 10000–19999): only the newest per author and kind.
- **Ephemeral** (20000–29999): forwarded to subscribers, not stored.
- **Addressable** (30000–39999): only the newest per author, kind and `d` tag. These used to be called "parameterized replaceable events".

When two replaceable events have the same `created_at`, the one with the lowest id wins. Details and examples are on [Event kinds](./kinds.md).

## Creating events

### JavaScript (nostr-tools)

```js
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure'

const sk = generateSecretKey()
const event = finalizeEvent({
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [['t', 'nostr']],
  content: 'Hello, Nostr!',
}, sk)

console.log(event)
// { kind, created_at, tags, content, pubkey, id, sig }
```

In a browser app, pass the same template to `window.nostr.signEvent()` instead of holding a key. See [Keys and signing](../getting-started/keys-and-signing.md).

### Python (nostr-sdk)

```python
from nostr_sdk import EventBuilder, Keys, Kind, KindStandard, Tag

keys = Keys.generate()
event = (
    EventBuilder(kind=Kind.from_std(KindStandard.TEXT_NOTE), content="Hello, Nostr!")
    .tags([Tag.hashtag("nostr")])
    .finalize(keys)
)
print(event.as_json())
print(event.verify())
# True
```

### Rust (nostr 0.45)

```rust
use nostr::prelude::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let keys = Keys::generate();

    let event: Event = EventBuilder::new(Kind::TextNote, "Hello, Nostr!")
        .tag(Tag::hashtag("nostr"))
        .finalize(&keys)?;
    println!("{}", event.as_json());

    // check id and signature
    event.verify()?;
    Ok(())
}
```

Add the crate with `cargo add nostr --features os-rng`. Older tutorials use `EventBuilder::text_note(…)`, `sign_with_keys` and `Client::new(keys)`. None of these exist in 0.45.

### Command line (nak)

```bash
# NOSTR_SECRET_KEY must be set; otherwise nak signs with a machine-default key
nak event -k 1 -c "Hello, Nostr!" -t t=nostr ws://localhost:10547
```

All four were run in October 2026 (nostr-tools 2.25.2, nostr-sdk 0.45.1, nostr 0.45.5, nak 0.21.2).

## Verifying events

Check every event you receive. A relay can send you anything.

```js
import { verifyEvent } from 'nostr-tools/pure'

if (!verifyEvent(event)) {
  // wrong id or bad signature: drop it
}
```

`verifyEvent` recomputes the id from the other fields and checks the signature against `pubkey`. nostr-tools' `SimplePool` runs it on every incoming event by default. Keep it that way. From the command line, `echo '<event json>' | nak verify` does the same.

## Good habits

- Use the right kind for the content. Don't put a new data type in kind 1.
- Add relay hints to `e`, `p` and `a` tags when you know where the referenced event lives.
- Use the current time for `created_at`. Many relays reject events too far in the past or future.
- Never edit a signed event. Change it and you must sign it again, which gives a new id.
