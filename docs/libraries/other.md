---
sidebar_position: 6
title: Other Languages
description: Nostr libraries for Swift, Kotlin, C#, and more
---

# Other Languages

Nostr libraries are available in many programming languages. Here's a guide to libraries beyond the main ones.

## Swift (iOS/macOS)

### NostrKit

Native Swift library for Apple platforms.

**Swift Package Manager:**
```swift
dependencies: [
    .package(url: "https://github.com/nostr-protocol/nostr-kit.git", from: "1.0.0")
]
```

```swift
import NostrKit

// Generate keys
let keys = try Keys()
print("Public key: \(keys.publicKey.npub)")

// Create event
let event = try Event(
    kind: .textNote,
    content: "Hello from Swift!",
    signedBy: keys
)

// Connect to relay
let relay = try await Relay(url: URL(string: "wss://relay.damus.io")!)
try await relay.send(event)
```

### damus-io/nostr-sdk

The SDK used by the Damus iOS client.

```swift
import NostrSDK

let keypair = Keypair()
let event = try TextNoteEvent(content: "Hello!", signedBy: keypair)
```

## Kotlin (Android)

### nostrpostr

Kotlin library for Android development.

**Gradle:**
```kotlin
implementation("com.github.nicholasgraham:nostrpostr:1.0.0")
```

```kotlin
import nostrpostr.*

// Generate keys
val keys = KeyPair.generate()
println("npub: ${keys.publicKey.toNpub()}")

// Create and sign event
val event = Event(
    kind = 1,
    content = "Hello from Kotlin!",
    tags = listOf()
).sign(keys.privateKey)
```

### rust-nostr Kotlin bindings

Native bindings from rust-nostr:

```kotlin
import rust.nostr.sdk.*

val keys = Keys.generate()
val client = Client(keys)

client.addRelay("wss://relay.damus.io")
client.connect()

client.publishTextNote("Hello from Kotlin!")
```

## C# / .NET

### NNostr

.NET library for Nostr.

**NuGet:**
```bash
dotnet add package NNostr
```

```csharp
using NNostr;

// Generate keys
var keys = new KeyPair();
Console.WriteLine($"Public key: {keys.PublicKey.ToBech32()}");

// Create event
var ev = new NostrEvent {
    Kind = 1,
    Content = "Hello from C#!",
    CreatedAt = DateTimeOffset.UtcNow
};
ev.Sign(keys.PrivateKey);

// Connect and publish
var relay = new NostrRelay("wss://relay.damus.io");
await relay.ConnectAsync();
await relay.PublishEventAsync(ev);
```

### NostrSharp

Another .NET option:

```csharp
using NostrSharp;

var client = new NostrClient();
await client.ConnectAsync("wss://relay.damus.io");

var filter = new NostrFilter { Kinds = new[] { 1 }, Limit = 10 };
await foreach (var ev in client.SubscribeAsync(filter))
{
    Console.WriteLine(ev.Content);
}
```

## Ruby

### nostr-ruby

Ruby gem for Nostr.

```bash
gem install nostr-ruby
```

```ruby
require 'nostr'

# Generate keys
keypair = Nostr::Keypair.new
puts "npub: #{keypair.public_key.to_bech32}"

# Create event
event = Nostr::Event.new(
  kind: 1,
  content: "Hello from Ruby!",
  pubkey: keypair.public_key
)
event.sign(keypair.private_key)

# Connect to relay
relay = Nostr::Relay.new("wss://relay.damus.io")
relay.connect
relay.publish(event)
```

## PHP

### nostr-php

PHP library for Nostr.

```bash
composer require nostr-php/nostr-php
```

```php
<?php
use Nostr\Key\KeyPair;
use Nostr\Event\Event;
use Nostr\Relay\Relay;

// Generate keys
$keys = KeyPair::generate();
echo "npub: " . $keys->getPublicKey()->toBech32() . "\n";

// Create event
$event = new Event();
$event->setKind(1);
$event->setContent("Hello from PHP!");
$event->sign($keys->getPrivateKey());

// Publish
$relay = new Relay("wss://relay.damus.io");
$relay->publish($event);
```

## Elixir

### nostrlib

Elixir library for Nostr.

```elixir
# mix.exs
{:nostrlib, "~> 0.1.0"}
```

```elixir
alias Nostrlib.{Keys, Event, Relay}

# Generate keys
{public_key, private_key} = Keys.generate()

# Create event
event = Event.new(1, "Hello from Elixir!")
signed_event = Event.sign(event, private_key)

# Publish
{:ok, relay} = Relay.connect("wss://relay.damus.io")
Relay.publish(relay, signed_event)
```

## Dart/Flutter

### nostr_tools

Dart package for Flutter apps.

```yaml
# pubspec.yaml
dependencies:
  nostr_tools: ^1.0.0
```

```dart
import 'package:nostr_tools/nostr_tools.dart';

void main() async {
  // Generate keys
  final keyPair = generateKeyPair();
  print('npub: ${keyPair.publicKey.toBech32()}');

  // Create event
  final event = Event(
    kind: 1,
    content: 'Hello from Flutter!',
    pubkey: keyPair.publicKey,
    createdAt: DateTime.now(),
  );
  event.sign(keyPair.privateKey);

  // Connect to relay
  final relay = await Relay.connect('wss://relay.damus.io');
  await relay.publish(event);
}
```

## Java

### nostr4j

Java library for Nostr.

```xml
<dependency>
    <groupId>io.github.nostr4j</groupId>
    <artifactId>nostr4j</artifactId>
    <version>1.0.0</version>
</dependency>
```

```java
import nostr4j.*;

// Generate keys
KeyPair keys = KeyPair.generate();
System.out.println("npub: " + keys.getPublicKey().toNpub());

// Create event
Event event = Event.builder()
    .kind(1)
    .content("Hello from Java!")
    .build()
    .sign(keys.getPrivateKey());

// Publish
Relay relay = new Relay("wss://relay.damus.io");
relay.connect();
relay.publish(event);
```

## C/C++

### libnostr

Low-level C library.

```c
#include <nostr.h>

int main() {
    // Generate keys
    nostr_keypair_t *keys = nostr_keypair_generate();

    // Create event
    nostr_event_t *event = nostr_event_new();
    nostr_event_set_kind(event, 1);
    nostr_event_set_content(event, "Hello from C!");
    nostr_event_sign(event, keys);

    // Publish
    nostr_relay_t *relay = nostr_relay_connect("wss://relay.damus.io");
    nostr_relay_publish(relay, event);

    // Cleanup
    nostr_event_free(event);
    nostr_keypair_free(keys);
    nostr_relay_close(relay);

    return 0;
}
```

## Choosing a Library

| Language | Best Choice | Notes |
|----------|-------------|-------|
| Swift | NostrKit | Native iOS/macOS |
| Kotlin | rust-nostr bindings | High performance |
| C# | NNostr | Full .NET support |
| Ruby | nostr-ruby | Idiomatic Ruby |
| PHP | nostr-php | Composer package |
| Elixir | nostrlib | OTP friendly |
| Dart | nostr_tools | Flutter support |
| Java | nostr4j | JVM compatible |

## Finding More Libraries

- [Awesome Nostr](https://github.com/aljazceru/awesome-nostr#libraries) - Comprehensive list
- [Nostr Protocol GitHub](https://github.com/nostr-protocol) - Official resources
- Search package managers (npm, pip, cargo, etc.)

## Contributing Libraries

If you're building a library:

1. Implement NIP-01 basics first
2. Add comprehensive tests
3. Document with examples
4. Submit to Awesome Nostr
5. Consider WebAssembly for cross-platform

## See Also

- [Libraries Overview](./overview)
- [JavaScript Libraries](./javascript)
- [Rust Libraries](./rust)
