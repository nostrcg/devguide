---
sidebar_position: 3
title: Rust Libraries
description: Nostr Dev Kit (formerly rust-nostr) nostr and nostr-sdk crates, version 0.45
---

# Rust Libraries

The main Rust library is **Nostr Dev Kit**, the project formerly called rust-nostr. It publishes two crates:

| Crate | What it is | Status |
|---|---|---|
| [nostr](https://crates.io/crates/nostr) | Protocol types: keys, events, filters, NIP helpers | 🟢 0.45.5 |
| [nostr-sdk](https://crates.io/crates/nostr-sdk) | Client: relay pool, subscriptions, gossip routing, in-process relays | 🟢 0.45.4 |

Repo: [github.com/nostrdevkit/nostr](https://github.com/nostrdevkit/nostr) (`github.com/rust-nostr/nostr` redirects). Book: [doc.nostrdevkit.org](https://doc.nostrdevkit.org/). API: [docs.rs/nostr-sdk](https://docs.rs/nostr-sdk).

:::caution Alpha API
The crates call themselves alpha, and the API changes between minor versions. Most Rust snippets on the web target 0.35–0.40 and **do not compile on 0.45**: `Client::new(keys)`, `publish_text_note`, `EventBuilder::text_note`, `handle_notifications`, `RelayPoolNotification` and `fetch_events(vec![filter], timeout)` are gone. Pin the version you test against. GitHub tags stop at v0.44.0; use crates.io for the current version.
:::

Every example below was compiled and run in October 2026 with nostr-sdk 0.45.4, nostr 0.45.5 and rustc 1.99, against `nak serve` (a local relay on `ws://localhost:10547`, see [Testing](../guides/testing.md)) or live public relays.

## Install

```toml
[dependencies]
nostr-sdk = "0.45"
tokio = { version = "1", features = ["full"] }

# only for the NIP-44 and NIP-17 examples
nostr = { version = "0.45", features = ["nip44", "nip59"] }
```

Add `features = ["local-relay"]` to `nostr-sdk` for the [in-process relay](#test-against-an-in-process-relay) example.

## Publish and read back

`Client::default()` has no signer. You sign with `EventBuilder::new(..).finalize(&keys)` and send the signed event.

```rust
use std::time::Duration;

use nostr_sdk::prelude::*;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // A throwaway key. Never hard-code a real nsec.
    let keys = Keys::generate();
    println!("npub: {}", keys.public_key().to_bech32()?);

    let client = Client::default();
    client.add_relay("ws://localhost:10547").await?;
    client.connect().await;

    // Publish a text note
    let event = EventBuilder::new(Kind::TextNote, "hello from nostr-sdk").finalize(&keys)?;
    let output = client.send_event(&event).await?;
    println!("sent {} to {:?}", output.id(), output.success);
    println!("failed: {:?}", output.failed);

    // Read it back
    let filter = Filter::new().author(keys.public_key()).kind(Kind::TextNote).limit(10);
    let events = client
        .fetch_events(filter)
        .timeout(Duration::from_secs(10))
        .await?;
    for event in events {
        println!("{}", event.content);
    }

    client.shutdown().await;
    Ok(())
}
```

`send_event` returns an `Output` with the relays that accepted (`success`) and rejected (`failed`) the event. Check `success` is not empty before you tell the user it was posted.

## Subscribe to new events

`subscribe` opens a long-lived subscription; events arrive on the `notifications()` stream.

```rust
use nostr_sdk::prelude::*;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::default();
    client.add_relay("wss://relay.primal.net").await?;
    client.add_relay("wss://relay.nostr.net").await?;
    client.connect().await;

    // Only new notes from now on
    let filter = Filter::new().kind(Kind::TextNote).since(Timestamp::now());
    let output = client.subscribe(filter).await?;
    println!("subscription id: {}", output.id());

    let mut notifications = client.notifications();
    let mut seen = 0;
    while let Some(notification) = notifications.next().await {
        if let ClientNotification::Event { relay_url, event, .. } = notification {
            println!("{relay_url}: {}", event.content);
            seen += 1;
            if seen == 5 {
                break;
            }
        }
    }

    client.shutdown().await;
    Ok(())
}
```

For a one-shot stream that ends at EOSE, use `client.stream_events(filter).timeout(..).policy(ReqExitPolicy::ExitOnEOSE)`; see the [stream-events example](https://github.com/nostrdevkit/nostr/tree/master/nostr-sdk/examples).

## NIP-19 identifiers

```rust
use nostr_sdk::prelude::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let pk = PublicKey::from_hex("32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245")?;

    // npub
    let npub = pk.to_bech32()?;
    println!("{npub}");
    assert_eq!(PublicKey::from_bech32(&npub)?, pk);

    // nprofile: a pubkey plus relay hints
    let profile = Nip19Profile::new(pk, [RelayUrl::parse("wss://relay.primal.net")?]);
    let nprofile = profile.to_bech32()?;
    println!("{nprofile}");

    // Decode anything that starts with npub, nsec, note, nevent, nprofile or naddr
    match Nip19::from_bech32(&nprofile)? {
        Nip19::Profile(p) => println!("pubkey {} relays {:?}", p.public_key, p.relays),
        other => println!("{other:?}"),
    }
    Ok(())
}
```

Filters and tags always use hex. Bech32 (`npub`, `nevent`…) is for display and links.

## NIP-44 encryption

Needs the `nip44` feature on the `nostr` crate.

```rust
use nostr::nips::nip44::{self, Version};
use nostr_sdk::prelude::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let alice = Keys::generate();
    let bob = Keys::generate();

    let payload = nip44::encrypt(alice.secret_key(), &bob.public_key(), "hi bob", Version::V2)?;
    println!("{payload}");

    let plaintext = nip44::decrypt(bob.secret_key(), &alice.public_key(), &payload)?;
    assert_eq!(plaintext, "hi bob");
    println!("{plaintext}");
    Ok(())
}
```

## NIP-17 private messages

Needs the `nip59` feature on the `nostr` crate. The builder wraps a kind 14 message in a seal (kind 13) and a gift wrap (kind 1059) addressed to the receiver.

```rust
use std::time::Duration;

use nostr::nips::nip17::PrivateDirectMessageBuilder;
use nostr::nips::nip59::UnwrappedGift;
use nostr_sdk::prelude::*;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let alice = Keys::generate();
    let bob = Keys::generate();

    let client = Client::default();
    client.add_relay("ws://localhost:10547").await?;
    client.connect().await;

    // kind 14 message -> sealed (13) -> gift-wrapped (1059) for Bob
    let wrap = PrivateDirectMessageBuilder::new(bob.public_key(), "hi bob").finalize(&alice)?;
    client.send_event(&wrap).await?;

    // Bob fetches gift wraps tagged with his pubkey and unwraps them
    let filter = Filter::new().kind(Kind::GiftWrap).pubkey(bob.public_key());
    let events = client.fetch_events(filter).timeout(Duration::from_secs(5)).await?;
    for event in events {
        let gift = UnwrappedGift::from_gift_wrap(&bob, &event)?;
        println!("{} says {}", gift.sender == alice.public_key(), gift.rumor.content);
    }

    client.shutdown().await;
    Ok(())
}
```

In a real client, publish the gift wrap to the receiver's kind 10050 inbox relays, and send a second copy wrapped to yourself so your other devices can show the sent message. `nostr::nips::nip17::extract_relay_list` reads a kind 10050 event.

## Test against an in-process relay

With the `local-relay` feature, `MockRelay` starts an in-memory relay on a random local port: handy in unit and integration tests. `LocalRelay::builder()` builds a configurable one with storage and rate limits.

```rust
use std::time::Duration;

use nostr_sdk::prelude::*;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // An in-process relay on a random local port (feature "local-relay")
    let relay = MockRelay::run().await?;
    let url = relay.url().await;

    let keys = Keys::generate();
    let client = Client::default();
    client.add_relay(&url).await?;
    client.connect().await;

    let event = EventBuilder::new(Kind::TextNote, "test").finalize(&keys)?;
    client.send_event(&event).await?;

    let events = client
        .fetch_events(Filter::new().author(keys.public_key()))
        .timeout(Duration::from_secs(5))
        .await?;
    assert_eq!(events.len(), 1);
    println!("ok: {url} returned {} event", events.len());
    Ok(())
}
```

## Related crates

All from the same repo, version 0.45.x:

| Crate | Use |
|---|---|
| `nostr-connect` | NIP-46 remote signing (client and signer side) |
| `nostr-lmdb`, `nostr-ndb`, `nostr-sqlite` | Storage backends for the client or a local relay |
| `nwc` | Nostr Wallet Connect (NIP-47) client |
| `nostr-blossom` | Blossom media client |

Other Rust libraries: [nostr-types](https://github.com/mikedilger/nostr-types) (🟡, used by Gossip and chorus). For full relays written in Rust, see [Relay Implementations](../relays/implementations.md).

## Bindings for other languages

The same Rust core is published for other languages from [nostrdevkit/nostr-sdk-ffi](https://github.com/nostrdevkit/nostr-sdk-ffi), version 0.45.1:

| Language | Package |
|---|---|
| Python | `pip install nostr-sdk` (see [Python](./python.md)) |
| Kotlin | `org.nostrdevkit:nostr-sdk`, `-jvm`, `-kmp` |
| Swift | [nostrdevkit/nostr-sdk-swift](https://github.com/nostrdevkit/nostr-sdk-swift) |
| C# | `dotnet add package Nostr.Sdk` |
| JavaScript | `@nostrdevkit/nostr-sdk-web`, `-node`, `-react-native` (little used; prefer [nostr-tools](./javascript.md)) |
| Flutter | 🔴 `nostr-sdk-flutter` is unmaintained, says its README |

The bindings follow the Rust API closely, so the examples above translate almost line for line.
