---
sidebar_position: 3
title: Keys and Signing
description: Nostr identity, key formats, generating keys, and signing without handling the user's secret key
---

# Keys and Signing

A Nostr identity is a key pair. The public key is who you are. The secret key signs your events. This page covers the formats, how to generate and convert keys, and why your app should usually let a **signer** hold the secret key instead.

## Key basics

Nostr uses the **secp256k1** curve (the same one Bitcoin uses) with **BIP-340 Schnorr** signatures.

| | Size | Share it? |
|---|---|---|
| **Secret key** | 32 bytes | Never |
| **Public key** | 32 bytes (the x-coordinate only) | Yes, it is your identity |

## Two formats for the same key

**Hex** is what the protocol uses: inside events, in filters, everywhere on the wire. **Bech32** ([NIP-19](https://github.com/nostr-protocol/nips/blob/master/19.md)) adds a prefix and a checksum so humans can tell keys apart and catch typos. It is for display and copy-paste only.

Here is one key pair in both forms. It was generated for this page and is public, so **never use it for anything**:

```
secret (hex):  8a2601dbb2c852bae1ebe530f9065719cc5e03c4fdb02809267a47c7ffa82c7d
public (hex):  b0eac043f3e04418711b47c72d44481e3d6b1fde19202a2c0d9b4580f934c4f3

nsec:  nsec13gnqrkajepft4c0tu5c0jpjhr8x9uq7ylkczszfx0fru0lag937sxluhzm
npub:  npub1kr4vqslnupzpsugmglrj63zgrc7kk877rysz5tqdndzcp7f5cnesfa404t
```

:::caution
Never put an `npub` or `nsec` inside an event or a filter. Decode it to hex first. Clients should accept both forms from users and convert internally.
:::

## Generating keys

### Command line (nak)

```bash
# a throwaway secret key, kept out of your shell history
export NOSTR_SECRET_KEY=$(nak key generate)

# the public key, as hex and as npub (the secret goes in on stdin, not argv)
echo "$NOSTR_SECRET_KEY" | nak key public
nak encode npub $(echo "$NOSTR_SECRET_KEY" | nak key public)

# decode any NIP-19 code back to hex
nak decode npub1kr4vqslnupzpsugmglrj63zgrc7kk877rysz5tqdndzcp7f5cnesfa404t
```

nak reads `NOSTR_SECRET_KEY` from the environment, so you never pass the key with `--sec`. The wiki's [nak page](https://github.com/nostrcg/devguide/wiki/NAK) has install steps.

### JavaScript (nostr-tools)

```bash
npm i nostr-tools @noble/hashes
```

```js
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'

// a new key: 32 random bytes (Uint8Array)
const sk = generateSecretKey()
// the matching public key, as 64-char hex
const pk = getPublicKey(sk)

console.log('secret (hex):', bytesToHex(sk))
console.log('public (hex):', pk)
console.log('nsec:', nip19.nsecEncode(sk))
console.log('npub:', nip19.npubEncode(pk))

// importing a key you already have
const { type, data } = nip19.decode('npub1kr4vqslnupzpsugmglrj63zgrc7kk877rysz5tqdndzcp7f5cnesfa404t')
console.log(type, data)
// 'npub' 'b0eac043f3e04418711b47c72d44481e3d6b1fde19202a2c0d9b4580f934c4f3'
const sk2 = hexToBytes('8a2601dbb2c852bae1ebe530f9065719cc5e03c4fdb02809267a47c7ffa82c7d')
console.log(getPublicKey(sk2) === data)
// true
```

`@noble/hashes` supplies the hex helpers. Note the `.js` at the end of its import path: version 2 requires it.

### Python (nostr-sdk)

```bash
pip install nostr-sdk
```

```python
from nostr_sdk import Keys, PublicKey

keys = Keys.generate()
print("secret (hex):", keys.secret_key().to_hex())
print("public (hex):", keys.public_key().to_hex())
print("nsec:", keys.secret_key().to_bech32())
print("npub:", keys.public_key().to_bech32())

# parse accepts hex or bech32
pk = PublicKey.parse("npub1kr4vqslnupzpsugmglrj63zgrc7kk877rysz5tqdndzcp7f5cnesfa404t")
print(pk.to_hex())
```

### Rust (nostr)

```bash
cargo add nostr --features os-rng
```

```rust
use nostr::prelude::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let keys = Keys::generate();
    println!("nsec: {}", keys.secret_key().to_bech32()?);
    println!("npub: {}", keys.public_key().to_bech32()?);
    Ok(())
}
```

`Keys::generate()` needs the `os-rng` feature. Without it the function doesn't exist. The `nostr-sdk` crate, which adds a relay client, re-exports all of this.

Tested in October 2026 with nak 0.21.2, nostr-tools 2.25.2, nostr-sdk 0.45.1 (Python) and nostr 0.45.5 (Rust).

## Signing

Signing an event means: serialize `[0, pubkey, created_at, kind, tags, content]` as JSON, hash it with SHA-256 to get the `id`, and sign the id with the secret key to get the `sig`. Libraries do all three in one call:

```js
import { finalizeEvent, verifyEvent, generateSecretKey } from 'nostr-tools/pure'

const sk = generateSecretKey()
const event = finalizeEvent({
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  content: 'Hello, Nostr!',
}, sk)
// event now has id, pubkey and sig

console.log(verifyEvent(event))
// true
```

[Events](../protocol/events.md) shows the serialization rules in detail, with code that computes the id and signature by hand.

## Let a signer hold the key

:::danger
A secret key can't be changed or reset. Anyone who gets it can post as that user forever. Don't ask users to paste their `nsec` into your app.
:::

Ask a **signer** instead. Your app gets the public key and sends unsigned events to be signed. It never sees the secret key.

| Where | Standard | Examples (Oct 2026) |
|---|---|---|
| Browser extension | [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md) `window.nostr` | Alby, nos2x (Chromium), nos2x-fox (Firefox) |
| Android app | [NIP-55](https://github.com/nostr-protocol/nips/blob/master/55.md) | Amber |
| Remote "bunker" | [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md) Nostr Remote Signing | Amber, Clave (iOS), Aegis |

The wiki's [Signers & login](https://github.com/nostrcg/devguide/wiki/Extensions) page lists maintained signers with status, and has tested code for all three.

A NIP-07 extension gives you two required methods:

```js
if (!window.nostr) throw new Error('No NIP-07 signer found')

// hex public key; the first call usually opens a permission prompt
const pubkey = await window.nostr.getPublicKey()

// the extension adds id, pubkey and sig
const signed = await window.nostr.signEvent({
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  content: 'Hello from NIP-07!',
})
```

Extensions may also offer `nip44.encrypt` / `nip44.decrypt`. `nip04.*` is deprecated, and there is no `getRelays()`: read the user's relays from their kind 10002 event instead. Call `getPublicKey()` from a button click, not on page load, because extensions inject `window.nostr` late.

## Storing a key you must keep

Sometimes your own software has to hold a key: a bot, a server, a test account. Then:

- **Encrypt it at rest** with [NIP-49](https://github.com/nostr-protocol/nips/blob/master/49.md). It turns the key into an `ncryptsec1…` string protected by a passphrase:

  ```js
  import { generateSecretKey } from 'nostr-tools/pure'
  import * as nip49 from 'nostr-tools/nip49'

  const sk = generateSecretKey()
  // 16 = scrypt cost (2^16): about 64 MiB of memory and 100 ms per attempt
  const ncryptsec = nip49.encrypt(sk, 'a long passphrase', 16)
  console.log(ncryptsec)
  // ncryptsec1...

  const back = nip49.decrypt(ncryptsec, 'a long passphrase')
  console.log(Buffer.from(back).equals(Buffer.from(sk)))
  // true
  ```

- **Keep it off the command line.** Arguments show up in `ps` and in shell history. Pass keys in environment variables or files, or point tools at a bunker URL.
- **Use separate keys** for bots and tests, so a leak doesn't touch a person's identity.
- **Back it up.** There is no recovery if it's lost.

Mnemonic seed phrases ([NIP-06](https://github.com/nostr-protocol/nips/blob/master/06.md)) are marked **unrecommended**: the NIPs README says to prefer a single nsec, backed up with NIP-49.

More detail is in the [Key management](../guides/key-management.md) guide.

## NIP-19 identifiers

| Prefix | Contains |
|---|---|
| `npub` | Public key |
| `nsec` | Secret key |
| `note` | Event id |
| `nprofile` | Public key plus relay hints |
| `nevent` | Event id plus relay hints, author and kind (all optional) |
| `naddr` | Address of an addressable event: kind, author, `d` tag, relay hints |

```js
import * as nip19 from 'nostr-tools/nip19'

const pubkey = 'b0eac043f3e04418711b47c72d44481e3d6b1fde19202a2c0d9b4580f934c4f3'

// a profile pointer with relay hints
const nprofile = nip19.nprofileEncode({ pubkey, relays: ['wss://relay.primal.net'] })

// an addressable event (kind 30023 article with d tag "hello")
const naddr = nip19.naddrEncode({ kind: 30023, pubkey, identifier: 'hello', relays: ['wss://nos.lol'] })

// decode anything and switch on the type
for (const code of [nprofile, naddr]) {
  const { type, data } = nip19.decode(code)
  console.log(type, data)
}
```

In note text, these codes appear as `nostr:` URIs ([NIP-21](https://github.com/nostr-protocol/nips/blob/master/21.md), [NIP-27](https://github.com/nostr-protocol/nips/blob/master/27.md)), for example `nostr:npub1kr4vqs…`.

## Next steps

- [Build your first app](./first-app.md): log in with a signer, read and post.
- [Events](../protocol/events.md): what gets signed, field by field.
