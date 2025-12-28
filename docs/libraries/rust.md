---
sidebar_position: 3
title: Rust Libraries
description: Nostr libraries for Rust development
---

# Rust Libraries

Rust offers high-performance Nostr libraries ideal for native applications, relays, and backend services.

## nostr-sdk

Full-featured SDK for building Nostr clients.

**Add to Cargo.toml:**
```toml
[dependencies]
nostr-sdk = "0.35"
tokio = { version = "1", features = ["full"] }
```

**Repository:** [github.com/rust-nostr/nostr](https://github.com/rust-nostr/nostr)

### Quick Start

```rust
use nostr_sdk::prelude::*;

#[tokio::main]
async fn main() -> Result<()> {
    // Generate keys
    let keys = Keys::generate();
    println!("Public key: {}", keys.public_key().to_bech32()?);

    // Create client
    let client = Client::new(keys);

    // Add relays
    client.add_relay("wss://relay.damus.io").await?;
    client.add_relay("wss://nos.lol").await?;

    // Connect
    client.connect().await;

    // Publish a note
    let output = client.publish_text_note("Hello from Rust!").await?;
    println!("Published: {}", output.id().to_bech32()?);

    Ok(())
}
```

### Key Management

```rust
use nostr_sdk::prelude::*;

// Generate new keys
let keys = Keys::generate();

// From hex secret key
let keys = Keys::parse("nsec1...")?;

// From mnemonic (BIP-39)
let mnemonic = Mnemonic::generate(12)?;
let keys = Keys::from_mnemonic(mnemonic, None)?;

// Get bech32 representations
let nsec = keys.secret_key().to_bech32()?;
let npub = keys.public_key().to_bech32()?;
```

### Creating Events

```rust
use nostr_sdk::prelude::*;

let keys = Keys::generate();

// Simple text note
let event = EventBuilder::text_note("Hello!")
    .sign_with_keys(&keys)?;

// With tags
let event = EventBuilder::text_note("Check this out!")
    .tags([
        Tag::hashtag("nostr"),
        Tag::public_key(some_pubkey),
    ])
    .sign_with_keys(&keys)?;

// Metadata (kind 0)
let metadata = Metadata::new()
    .name("Alice")
    .about("Nostr developer")
    .picture("https://example.com/avatar.jpg");

let event = EventBuilder::metadata(&metadata)
    .sign_with_keys(&keys)?;

// Reaction
let event = EventBuilder::reaction(&target_event, "+")
    .sign_with_keys(&keys)?;
```

### Subscribing to Events

```rust
use nostr_sdk::prelude::*;

#[tokio::main]
async fn main() -> Result<()> {
    let keys = Keys::generate();
    let client = Client::new(keys);

    client.add_relay("wss://relay.damus.io").await?;
    client.connect().await;

    // Create filter
    let filter = Filter::new()
        .kinds([Kind::TextNote])
        .limit(10);

    // Subscribe
    let output = client.subscribe(vec![filter], None).await?;
    println!("Subscription ID: {}", output.id());

    // Handle events
    client.handle_notifications(|notification| async {
        if let RelayPoolNotification::Event { event, .. } = notification {
            println!("Got event: {}", event.content);
        }
        Ok(false) // Continue handling
    }).await?;

    Ok(())
}
```

### Fetching Events

```rust
// Fetch with filter
let filter = Filter::new()
    .author(pubkey)
    .kinds([Kind::TextNote])
    .limit(20);

let events = client.fetch_events(vec![filter], Duration::from_secs(10)).await?;

for event in events {
    println!("{}: {}", event.pubkey.to_bech32()?, event.content);
}
```

### NIP-44 Encryption

```rust
use nostr_sdk::prelude::*;

let sender_keys = Keys::generate();
let receiver_keys = Keys::generate();

// Encrypt
let encrypted = nip44::encrypt(
    sender_keys.secret_key(),
    &receiver_keys.public_key(),
    "Secret message",
)?;

// Decrypt
let decrypted = nip44::decrypt(
    receiver_keys.secret_key(),
    &sender_keys.public_key(),
    &encrypted,
)?;
```

### Database Support

Store events locally:

```toml
[dependencies]
nostr-sdk = { version = "0.35", features = ["lmdb"] }
```

```rust
use nostr_sdk::prelude::*;

let database = NostrLMDB::open("./nostr-db")?;
let client = Client::builder()
    .database(database)
    .build();
```

## rust-nostr (Core Library)

Lower-level library focused on protocol primitives.

```toml
[dependencies]
nostr = "0.35"
```

### Event Handling

```rust
use nostr::prelude::*;

// Create unsigned event
let unsigned = UnsignedEvent::new(
    Kind::TextNote,
    "Hello!",
    vec![],
);

// Sign
let keys = Keys::generate();
let event = unsigned.sign_with_keys(&keys)?;

// Verify
assert!(event.verify().is_ok());

// Serialize
let json = event.as_json();
let parsed: Event = Event::from_json(&json)?;
```

### Filter Building

```rust
use nostr::prelude::*;

let filter = Filter::new()
    .authors([pubkey1, pubkey2])
    .kinds([Kind::TextNote, Kind::Repost])
    .since(Timestamp::now() - 3600)
    .limit(50);

// Multiple tag filters
let filter = Filter::new()
    .hashtag("nostr")
    .hashtag("rust")
    .event(some_event_id);
```

## Building a Relay

```rust
use nostr_sdk::prelude::*;
use tokio::net::TcpListener;
use tokio_tungstenite::accept_async;

#[tokio::main]
async fn main() -> Result<()> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;

    while let Ok((stream, _)) = listener.accept().await {
        tokio::spawn(async move {
            let ws_stream = accept_async(stream).await.unwrap();
            // Handle Nostr messages...
        });
    }

    Ok(())
}
```

See [strfry](https://github.com/hoytech/strfry) for a production relay implementation.

## FFI Bindings

nostr-sdk provides bindings for other languages:

- **Python:** `pip install nostr-sdk`
- **JavaScript:** `npm install @rust-nostr/nostr-sdk`
- **Kotlin:** Available on Maven
- **Swift:** Swift Package Manager

## Error Handling

```rust
use nostr_sdk::prelude::*;

async fn publish_note(client: &Client, content: &str) -> Result<EventId> {
    let output = client.publish_text_note(content).await?;

    // Check if at least one relay accepted
    if output.success.is_empty() {
        return Err(Error::msg("No relay accepted the event"));
    }

    Ok(output.id())
}
```

## Performance Tips

1. **Use connection pooling** - nostr-sdk handles this automatically

2. **Batch operations** when possible:
   ```rust
   let filters = vec![filter1, filter2, filter3];
   let events = client.fetch_events(filters, timeout).await?;
   ```

3. **Use local database** for caching

4. **Consider async runtime** - Tokio is recommended

## See Also

- [rust-nostr GitHub](https://github.com/rust-nostr/nostr)
- [nostr-sdk Documentation](https://docs.rs/nostr-sdk)
- [Running Relays Guide](../relays/running-a-relay)
