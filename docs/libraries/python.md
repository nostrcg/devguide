---
sidebar_position: 4
title: Python Libraries
description: Nostr libraries for Python development
---

# Python Libraries

Python is excellent for scripting, bots, and backend services with Nostr.

## pynostr

The most feature-complete Python Nostr library.

**Install:**
```bash
pip install pynostr
```

**Repository:** [github.com/holgern/pynostr](https://github.com/holgern/pynostr)

### Key Generation

```python
from nostr.key import PrivateKey

# Generate new keypair
private_key = PrivateKey()
public_key = private_key.public_key

print(f"Private (hex): {private_key.hex()}")
print(f"Public (hex): {public_key.hex()}")
print(f"Private (bech32): {private_key.bech32()}")
print(f"Public (bech32): {public_key.bech32()}")
```

### From Existing Key

```python
from nostr.key import PrivateKey

# From hex
private_key = PrivateKey(bytes.fromhex("your-hex-key-here"))

# From bech32 (nsec)
private_key = PrivateKey.from_nsec("nsec1...")
```

### Creating Events

```python
from nostr.event import Event
from nostr.key import PrivateKey
import time

private_key = PrivateKey()

# Create event
event = Event(
    public_key=private_key.public_key.hex(),
    content="Hello from Python!",
    kind=1,
    tags=[
        ["t", "nostr"],
        ["t", "python"]
    ],
    created_at=int(time.time())
)

# Sign the event
event.sign(private_key.hex())

print(f"Event ID: {event.id}")
print(f"Signature: {event.signature}")
```

### Connecting to Relays

```python
import asyncio
from nostr.relay_manager import RelayManager
from nostr.message_type import ClientMessageType

async def main():
    relay_manager = RelayManager()
    relay_manager.add_relay("wss://relay.damus.io")
    relay_manager.add_relay("wss://nos.lol")

    await relay_manager.open_connections()

    # Publish event
    message = event.to_message()
    relay_manager.publish_message(message)

    await asyncio.sleep(2)  # Wait for responses
    await relay_manager.close_connections()

asyncio.run(main())
```

### Subscribing to Events

```python
import asyncio
from nostr.relay_manager import RelayManager
from nostr.filter import Filter, Filters
from nostr.message_type import ClientMessageType

async def main():
    relay_manager = RelayManager()
    relay_manager.add_relay("wss://relay.damus.io")

    await relay_manager.open_connections()

    # Create filter
    filters = Filters([
        Filter(
            kinds=[1],
            limit=10
        )
    ])

    subscription_id = "my-sub"
    relay_manager.add_subscription(subscription_id, filters)

    # Handle incoming messages
    while relay_manager.message_pool.has_events():
        event_msg = relay_manager.message_pool.get_event()
        print(f"Event: {event_msg.event.content}")

    await relay_manager.close_connections()

asyncio.run(main())
```

## python-nostr

Simpler library for basic operations.

**Install:**
```bash
pip install python-nostr
```

```python
from nostr.key import PrivateKey
from nostr.relay_manager import RelayManager
from nostr.event import Event

# Quick start
private_key = PrivateKey()

event = Event(private_key.public_key.hex(), "Hello!")
private_key.sign_event(event)
```

## nostr-sdk (Python Bindings)

Rust-powered bindings for Python.

**Install:**
```bash
pip install nostr-sdk
```

```python
from nostr_sdk import Keys, Client, EventBuilder

async def main():
    # Generate keys
    keys = Keys.generate()
    print(f"Public key: {keys.public_key().to_bech32()}")

    # Create client
    client = Client(keys)

    # Add relays
    await client.add_relay("wss://relay.damus.io")
    await client.connect()

    # Publish note
    builder = EventBuilder.text_note("Hello from nostr-sdk!")
    output = await client.send_event_builder(builder)
    print(f"Event ID: {output.id.to_bech32()}")

import asyncio
asyncio.run(main())
```

## Building a Bot

Example: Auto-responder bot

```python
import asyncio
from nostr.key import PrivateKey
from nostr.event import Event
from nostr.relay_manager import RelayManager
from nostr.filter import Filter, Filters
import time

class NostrBot:
    def __init__(self, nsec: str, relays: list):
        self.private_key = PrivateKey.from_nsec(nsec)
        self.public_key = self.private_key.public_key
        self.relay_manager = RelayManager()
        for relay in relays:
            self.relay_manager.add_relay(relay)

    async def start(self):
        await self.relay_manager.open_connections()

        # Subscribe to mentions
        filters = Filters([
            Filter(
                kinds=[1],
                pubkey_refs=[self.public_key.hex()]
            )
        ])
        self.relay_manager.add_subscription("mentions", filters)

        print(f"Bot started: {self.public_key.bech32()}")
        await self.listen()

    async def listen(self):
        while True:
            if self.relay_manager.message_pool.has_events():
                msg = self.relay_manager.message_pool.get_event()
                await self.handle_mention(msg.event)
            await asyncio.sleep(0.1)

    async def handle_mention(self, event):
        print(f"Mentioned by: {event.public_key}")

        # Create reply
        reply = Event(
            public_key=self.public_key.hex(),
            content="Thanks for the mention!",
            kind=1,
            tags=[
                ["e", event.id, "", "reply"],
                ["p", event.public_key]
            ],
            created_at=int(time.time())
        )
        reply.sign(self.private_key.hex())
        self.relay_manager.publish_message(reply.to_message())

# Usage
bot = NostrBot(
    nsec="nsec1...",
    relays=["wss://relay.damus.io", "wss://nos.lol"]
)
asyncio.run(bot.start())
```

## NIP-05 Verification

```python
import httpx

async def verify_nip05(identifier: str) -> dict:
    """Verify a NIP-05 identifier like alice@example.com"""
    name, domain = identifier.split("@")
    url = f"https://{domain}/.well-known/nostr.json?name={name}"

    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()

        if name in data.get("names", {}):
            return {
                "valid": True,
                "pubkey": data["names"][name],
                "relays": data.get("relays", {}).get(data["names"][name], [])
            }
        return {"valid": False}

# Usage
result = await verify_nip05("alice@example.com")
print(result)
```

## Encryption (NIP-04)

```python
from nostr.key import PrivateKey
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

def encrypt_dm(sender_privkey: PrivateKey, recipient_pubkey: str, message: str) -> str:
    """Encrypt a direct message using NIP-04"""
    shared_secret = sender_privkey.compute_shared_secret(recipient_pubkey)

    iv = os.urandom(16)
    cipher = AESGCM(shared_secret)
    ciphertext = cipher.encrypt(iv, message.encode(), None)

    return f"{base64.b64encode(ciphertext).decode()}?iv={base64.b64encode(iv).decode()}"

def decrypt_dm(recipient_privkey: PrivateKey, sender_pubkey: str, encrypted: str) -> str:
    """Decrypt a direct message"""
    ciphertext_b64, iv_b64 = encrypted.split("?iv=")
    ciphertext = base64.b64decode(ciphertext_b64)
    iv = base64.b64decode(iv_b64)

    shared_secret = recipient_privkey.compute_shared_secret(sender_pubkey)
    cipher = AESGCM(shared_secret)

    return cipher.decrypt(iv, ciphertext, None).decode()
```

## Best Practices

1. **Use async** for relay connections

2. **Handle disconnections:**
   ```python
   async def reconnect_loop():
       while True:
           try:
               await relay_manager.open_connections()
               await listen()
           except Exception as e:
               print(f"Disconnected: {e}")
               await asyncio.sleep(5)
   ```

3. **Rate limit** your publishing

4. **Verify events** before processing

## See Also

- [pynostr GitHub](https://github.com/holgern/pynostr)
- [nostr-sdk Python bindings](https://github.com/rust-nostr/nostr)
- [Building Bots Guide](../guides/building-clients)
