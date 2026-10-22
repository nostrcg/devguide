---
sidebar_position: 4
title: Python Libraries
description: nostr-sdk, the Rust-backed Python bindings from Nostr Dev Kit, version 0.45
---

# Python Libraries

Use **[nostr-sdk](https://pypi.org/project/nostr-sdk/)**: Python bindings to the Rust [Nostr Dev Kit](./rust.md) (formerly rust-nostr). It is async, covers the most NIPs, and ships prebuilt wheels for Linux, macOS and Windows.

| Package | Status |
|---|---|
| **[nostr-sdk](https://pypi.org/project/nostr-sdk/)** · [repo](https://github.com/nostrdevkit/nostr-sdk-ffi) | 🟢 0.45.1 (Aug 2026), Python 3.9+ |
| [pynostr](https://github.com/holgern/pynostr): pure Python, fine for small scripts | 🟡 0.7.0 (Aug 2025) |
| `nostr` (python-nostr), `nostr-protocol` | 🔴 dead; don't use |
| `nostr-tools` on PyPI | Unrelated to the JavaScript library of the same name |

```bash
pip install nostr-sdk
```

:::caution Alpha API
nostr-sdk calls itself alpha and changes between minor versions. Older examples that use `Client(keys)`, `send_event_builder` or `handle_notifications` fail on 0.45. Pin the version you test against.
:::

Every example below was run in October 2026 with nostr-sdk 0.45.1 on Python 3.14, against `nak serve` (a local relay on `ws://localhost:10547`) or live public relays.

## Publish and read back

```python
# hello.py
import asyncio
from datetime import timedelta
from nostr_sdk import Client, EventBuilder, Filter, Keys, Kind, KindStandard, RelayUrl, ReqTarget

async def main():
    keys = Keys.generate()
    print("npub:", keys.public_key().to_bech32())

    client = Client()
    await client.add_relay(RelayUrl.parse("ws://localhost:10547"))
    await client.connect()

    # publish a note
    note = EventBuilder(kind=Kind.from_std(KindStandard.TEXT_NOTE), content="hello from python").finalize(keys)
    await client.send_event(note)

    # read it back
    f = Filter().author(keys.public_key()).kind(Kind.from_std(KindStandard.TEXT_NOTE)).limit(10)
    events = await client.fetch_events(ReqTarget.auto([f]), timedelta(seconds=5))
    for e in events:
        print(e.content())

asyncio.run(main())
```

`Client()` has no signer: you sign with `EventBuilder(...).finalize(keys)` and send the signed event. `fetch_events` returns once every relay sends EOSE or the timeout passes.

## Keys and NIP-19

```python
from nostr_sdk import Keys, PublicKey, Nip19, Nip19Enum, Nip19Profile, RelayUrl

keys = Keys.generate()
print(keys.public_key().to_hex())      # 64-char hex, used in the protocol
print(keys.public_key().to_bech32())   # npub1..., for display

# parse() accepts hex or bech32
pk = PublicKey.parse("npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s")
print(pk.to_hex())

nprofile = Nip19Profile(pk, [RelayUrl.parse("wss://relay.primal.net")]).to_bech32()
decoded = Nip19.from_bech32(nprofile).as_enum()
if isinstance(decoded, Nip19Enum.PROFILE):
    print(decoded.nprofile.public_key().to_hex(), decoded.nprofile.relays())
```

Filters and tags always use hex; bech32 (`npub`, `nprofile`…) is for display and links.

:::danger
Never put a real secret key in source code, a command-line argument or a log. Load it from a secret store or an environment variable, or let a [remote signer](../guides/key-management.md) hold it.
:::

## Subscribe to new events

```python
import asyncio
from nostr_sdk import Client, ClientNotification, Filter, Kind, KindStandard, RelayUrl, ReqTarget, Timestamp

async def main():
    client = Client()
    await client.add_relay(RelayUrl.parse("wss://relay.primal.net"))
    await client.add_relay(RelayUrl.parse("wss://relay.nostr.net"))
    await client.connect()

    # only notes created from now on
    f = Filter().kind(Kind.from_std(KindStandard.TEXT_NOTE)).since(Timestamp.now())
    await client.subscribe(ReqTarget.auto([f]))

    stream = client.notifications()
    seen = 0
    while seen < 5:
        n = await stream.next()
        if n is None:
            break
        if isinstance(n, ClientNotification.NEW_EVENT):
            print(n.relay_url, n.event.content()[:60])
            seen += 1

    await client.shutdown()

asyncio.run(main())
```

`notifications()` returns a stream; `await stream.next()` gives the next `ClientNotification` and `None` once the client shuts down.

## NIP-44 encryption

```python
from nostr_sdk import Keys, Nip44Version, nip44_encrypt, nip44_decrypt

alice = Keys.generate()
bob = Keys.generate()

payload = nip44_encrypt(alice.secret_key(), bob.public_key(), "hi bob", Nip44Version.V2)
print(nip44_decrypt(bob.secret_key(), alice.public_key(), payload))
```

## NIP-17 private messages

`nip17_make_private_msg` builds a kind 14 message, seals it (kind 13) and gift-wraps it (kind 1059) for the receiver. `UnwrappedGift.from_gift_wrap` reverses that and checks the seal.

```python
import asyncio
from datetime import timedelta
from nostr_sdk import (Client, Filter, Keys, Kind, KindStandard, RelayUrl, ReqTarget,
                       UnwrappedGift, nip17_make_private_msg)

async def main():
    alice, bob = Keys.generate(), Keys.generate()
    client = Client()
    await client.add_relay(RelayUrl.parse("ws://localhost:10547"))
    await client.connect()

    # kind 14 message -> sealed (13) -> gift-wrapped (1059) for Bob
    wrap = nip17_make_private_msg(alice, bob.public_key(), "hi bob")
    await client.send_event(wrap)

    # Bob fetches gift wraps tagged with his pubkey and unwraps them
    f = Filter().kind(Kind.from_std(KindStandard.GIFT_WRAP)).pubkey(bob.public_key())
    events = await client.fetch_events(ReqTarget.auto([f]), timedelta(seconds=5))
    for e in events:
        gift = UnwrappedGift.from_gift_wrap(bob, e)
        rumor = gift.rumor()
        print(gift.sender().to_bech32() == alice.public_key().to_bech32(), rumor.content())

    await client.shutdown()

asyncio.run(main())
```

In a real client, send the gift wrap to the receiver's kind 10050 inbox relays (`nip17_extract_relay_list` reads that event), and a second copy wrapped to yourself.

## More in the package

The same package has `NostrConnect` (NIP-46 remote signing), `NostrWalletConnect` (NIP-47), `nip05_verify_from_json` and database backends. The [Nostr Dev Kit book](https://doc.nostrdevkit.org/) documents them; the Python API mirrors the [Rust one](./rust.md).

For checking `name@domain` identifiers, see [NIP-05 Verification](../guides/nip05-verification.md).
