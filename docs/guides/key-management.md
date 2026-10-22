---
sidebar_position: 1
title: Key Management
description: How Nostr apps should handle secret keys - signers first, NIP-49 ncryptsec when you must store one
---

# Key Management

A Nostr identity is one secp256k1 key pair. The secret key (`nsec`, or 32 bytes of hex) signs everything. Whoever holds it *is* the user. There is no password reset, and the protocol has no agreed way to rotate a key. Design your app so the key is exposed to as few places as possible.

## The order of preference

1. **Don't touch the key: use a signer.** On desktop that's a NIP-07 browser extension, on Android a NIP-55 signer app such as Amber, and anywhere a NIP-46 remote signer ("bunker"). Your app asks the signer to sign and never sees the key. The code is in [Building clients](./building-clients.md) and [Mobile development](./mobile-development.md). The wiki's [Signers & login](https://github.com/nostrcg/devguide/wiki/Extensions) page lists signers that are maintained in 2026.
2. **If you must hold a key, store it encrypted** as a NIP-49 `ncryptsec`, and decrypt it only in memory when the user unlocks the app.
3. **Never** store a raw `nsec` in `localStorage`, logs, analytics, crash reports or the clipboard. Never ask users to paste their main key into a website.

:::caution Unrecommended NIPs
The NIPs README marks these as **unrecommended**. Don't build new features on them:

- **NIP-06** (deriving keys from a BIP-39 mnemonic): "prefer a single nsec". Back up with NIP-49 instead.
- **NIP-26** (delegated event signing): "adds unnecessary burden for little gain". Use a NIP-46 bunker to let another app sign for you.
:::

## Generate and encrypt a key (NIP-49)

[NIP-49](https://github.com/nostr-protocol/nips/blob/master/49.md) encrypts a secret key with a password. It derives a key with scrypt and encrypts with XChaCha20-Poly1305. The result is a bech32 string that starts with `ncryptsec1`. nostr-tools 2.25.2 implements it (tested on Node 24, October 2026):

```js
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'
import * as nip49 from 'nostr-tools/nip49'
import { bytesToHex } from 'nostr-tools/utils'

// a new identity: 32 random bytes from a CSPRNG
const sk = generateSecretKey()
const pk = getPublicKey(sk)
console.log(nip19.npubEncode(pk))

// encrypt for storage or backup (NIP-49); never store the raw key
const password = 'correct horse battery staple' // from the user
const ncryptsec = nip49.encrypt(sk, password)

// later: unlock with the same password
const unlocked = nip49.decrypt(ncryptsec, password)
console.log(bytesToHex(unlocked) === bytesToHex(sk)) // true

// a wrong password throws
try { nip49.decrypt(ncryptsec, 'wrong') } catch { console.log('wrong password rejected') }

// NIP-49 test vector (password "nostr")
const v = 'ncryptsec1qgg9947rlpvqu76pj5ecreduf9jxhselq2nae2kghhvd5g7dgjtcxfqtd67p9m0w57lspw8gsq6yphnm8623nsl8xn9j4jdzz84zm3frztj3z7s35vpzmqf6ksu8r89qk5z2zxfmu5gv8th8wclt0h4p'
console.log(bytesToHex(nip49.decrypt(v, 'nostr')))
```

```text
npub1wrkrg87mflm9dqkjdec3edl8rv8t53vedsc873ykgk7h7r2dwrgq7vckdz
true
wrong password rejected
3501454135014541350145413501453fefb02227e449e57cf4d3a3ce05378683
```

The last line matches the spec's test vector. Things to know:

- **Cost:** `encrypt(sec, password, logn = 16)`. With `logn` 16, scrypt uses 64 MiB of memory and takes about 0.1 s. Each step up doubles both: 18 needs 256 MiB, 20 needs 1 GiB (about 2 s). Choose the highest value your slowest target device can handle.
- **Key security byte:** the fourth argument records whether the key was ever handled insecurely: `0x00` known insecure, `0x01` not known to be, `0x02` (the default) not tracked.
- nostr-tools normalises the password to Unicode NFKC, as the spec requires, so the same password typed on another device still works.
- **Don't publish ncryptsec strings** to relays. Collecting many encrypted keys makes cracking easier.
- Clear decrypted keys and passwords from memory when you are done, where your platform allows it (for example `sk.fill(0)` on the `Uint8Array`).

## Keys on the command line

[nak](https://github.com/nostrcg/devguide/wiki/NAK) reads the key from the `NOSTR_SECRET_KEY` environment variable. That keeps it out of `ps` and shell history, unlike `--sec`. Tested with nak v0.21.2:

```bash
# a throwaway key for experiments
export NOSTR_SECRET_KEY=$(nak key generate)

# its public key, as hex and as npub
echo "$NOSTR_SECRET_KEY" | nak key public
echo "$NOSTR_SECRET_KEY" | nak key public | nak encode npub

# npub/nsec/nprofile/... back to hex
nak decode npub1cwkxg4hjhyjq3ztkczxj0r77uwt9ztpx523cf4pjunk7r9836gqscqekyk
```

`NOSTR_SECRET_KEY` can also hold an `ncryptsec` or a `bunker://` URL. With an `ncryptsec`, nak asks for the password each time it signs, so the plaintext key never sits in your environment:

```bash
export NOSTR_SECRET_KEY=ncryptsec1...
# prompts: "type the password to decrypt your secret key"
nak event -c 'signed with an encrypted key' ws://localhost:10547
```

`nak key encrypt <secret> <password>` creates an ncryptsec, but it takes the password as an argument, so the password ends up in your shell history. Use it only with throwaway keys, or create the ncryptsec in code as above. If `NOSTR_SECRET_KEY` and `--sec` are both unset, nak signs with a per-machine default key (`nak key default`). Set the key explicitly so you don't publish under the wrong identity.

## Backups

- **Back up the `ncryptsec`**, not the raw nsec. Use a password manager, or paper kept in a separate place from the password.
- **Test the restore:** decrypt the backup on another device and check that the public key matches before you rely on it.
- A bunker or signer app may keep its own encrypted backup. Know where it is and how to export it.

## Separate keys

Use a different key for each purpose: your personal identity, a bot, a relay operator key, each test environment. If one leaks, the others are unaffected. Test keys should be generated fresh (`nak key generate`) and never used on the public network.

## If a key leaks

Nostr has no protocol-level revocation or rotation. A leaked key stays usable by whoever has it. What you can do:

1. Generate a new key and set up the profile, follows and relay list (kinds 0, 3 and 10002) under it.
2. Point your NIP-05 address (`name@yourdomain`) at the new public key. Clients re-check NIP-05 and will stop showing the old key as you. See [NIP-05 verification](./nip05-verification.md).
3. Post from both keys that you have moved, and ask people to follow the new one.
4. Revoke what the old key could reach: NIP-46 bunker sessions, NWC wallet connections, and accounts on services that log in with it.

## Hardware and threshold signing

Signing devices for Nostr are still rare. The wiki's [Signers & login](https://github.com/nostrcg/devguide/wiki/Extensions) page tracks the maintained options. Two directions are worth knowing:

- **Remote signing (NIP-46):** the key lives on one device or server, and every app asks it to sign over a relay.
- **Threshold keys (FROST):** the key is split into shares that must cooperate to sign, as in the Keep signer for Android. No single device ever holds the whole key.

Phone keystores (iOS Keychain, Android Keystore) protect a stored key at rest, but the app still decrypts it into memory to sign. The Secure Enclave and most hardware-backed Android keys don't support secp256k1. See [Mobile development](./mobile-development.md).

## Common mistakes

- Generating keys with `Math.random()`. Use `generateSecretKey()` or another CSPRNG.
- Passing secrets on the command line (`--sec nsec1…`), or printing them in logs or CI output.
- Writing the raw key to `localStorage` or `AsyncStorage`.
- Sending the user's nsec to your server "for convenience".
- Treating a NIP-05 address as the identity. Follow and store **public keys**. NIP-05 is a pointer that can change.
