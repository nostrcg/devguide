---
sidebar_position: 8
title: Relay Sync Tools
description: Tools for syncing and bridging Nostr relays
---

# Relay Sync Tools

Tools and techniques for synchronizing events between relays.

## Why Sync Relays?

- **Backup:** Replicate events to personal relay
- **Migration:** Move from one relay to another
- **Bridging:** Connect different relay networks
- **Archiving:** Preserve historical events

## Negentropy Sync (strfry)

strfry includes built-in negentropy sync for efficient relay-to-relay synchronization.

### How It Works

Negentropy is a set reconciliation protocol that efficiently determines which events differ between two relays without transferring all events.

### Sync Command

```bash
# Sync from remote relay to local
strfry sync wss://relay.damus.io

# Sync specific filter
strfry sync wss://relay.damus.io --filter '{"kinds":[1],"limit":1000}'

# Continuous sync
strfry sync wss://relay.damus.io --continuous
```

### Configuration

Add to `strfry.conf`:

```yaml
sync {
    # Relays to sync with
    upstreams = [
        "wss://relay.damus.io",
        "wss://nos.lol"
    ]

    # Filter for sync
    filter = {
        "kinds": [0, 1, 3, 7]
    }

    # Sync interval (seconds)
    interval = 300
}
```

## NAK (Nostr Army Knife)

nak includes sync capabilities.

### Installation

```bash
go install github.com/fiatjaf/nak@latest
```

### Sync Usage

```bash
# Sync events from one relay to another
nak sync wss://source-relay.com wss://destination-relay.com

# With filter
nak sync wss://source.com wss://dest.com --filter '{"authors":["pubkey"]}'
```

### Guide

For detailed instructions, see: [NAK Sync Guide](https://habla.news/u/alex@gleasonator.dev/nak-sync)

## Manual Sync Scripts

### Export and Import

```bash
# Export from one relay
echo '["REQ","export",{"kinds":[1],"limit":10000}]' | \
  websocat -n wss://source-relay.com > events.jsonl

# Process and publish to another relay
cat events.jsonl | jq -c '.[2] // empty' | while read event; do
  echo "[\"EVENT\",$event]" | websocat -n wss://dest-relay.com
done
```

### Sync Script

```bash
#!/bin/bash
# sync-events.sh

SOURCE="wss://source-relay.com"
DEST="wss://destination-relay.com"
PUBKEY="your-pubkey-hex"

# Fetch events from source
echo "Fetching events from $SOURCE..."
echo "[\"REQ\",\"sync\",{\"authors\":[\"$PUBKEY\"],\"limit\":1000}]" | \
  timeout 30 websocat -n "$SOURCE" | \
  jq -c 'select(.[0] == "EVENT") | .[2]' > /tmp/events.jsonl

# Count events
COUNT=$(wc -l < /tmp/events.jsonl)
echo "Found $COUNT events"

# Publish to destination
echo "Publishing to $DEST..."
cat /tmp/events.jsonl | while read event; do
  echo "[\"EVENT\",$event]" | websocat -n "$DEST"
  sleep 0.1  # Rate limiting
done

echo "Done!"
```

## Hyper-Nostr P2P Sync

hyper-nostr enables peer-to-peer relay synchronization.

### Setup

```bash
npm install -g hyper-nostr

# Start relay with topic
hyper-nostr 3338 nostr
```

### How It Works

- Relays join a "topic" (DHT key)
- Automatically discover peers
- Sync events in real-time
- No central coordinator needed

### Use Cases

- Distributed relay networks
- Offline-first applications
- Resilient sync infrastructure

## RSS Bridges

Sync content to/from RSS feeds.

### nostrss

Publish RSS feeds to Nostr.

**Repository:** [github.com/Asone/nostrss](https://github.com/Asone/nostrss)

```bash
# Clone and configure
git clone https://github.com/Asone/nostrss
cd nostrss
cp config.example.toml config.toml
# Edit config.toml with your feeds and keys

# Run
cargo run
```

### atomstr

Convert Nostr to Atom feeds.

**Repository:** [git.sr.ht/~psic4t/atomstr](https://git.sr.ht/~psic4t/atomstr)

## Mirroring

### nostream Mirror Mode

Configure nostream to mirror events from other relays:

```bash
MIRROR_ENABLED=true
MIRROR_URLS="wss://relay.damus.io,wss://nos.lol"
```

### Custom Mirror Script

```python
#!/usr/bin/env python3
# mirror.py

import asyncio
import json
import websockets

SOURCE = "wss://source-relay.com"
DEST = "wss://dest-relay.com"

async def mirror():
    async with websockets.connect(SOURCE) as source:
        async with websockets.connect(DEST) as dest:
            # Subscribe to all events
            await source.send(json.dumps(["REQ", "mirror", {"limit": 0}]))

            async for message in source:
                data = json.loads(message)
                if data[0] == "EVENT":
                    event = data[2]
                    await dest.send(json.dumps(["EVENT", event]))
                    print(f"Mirrored: {event['id'][:16]}...")

asyncio.run(mirror())
```

## Update Relay Lists

Publish your relay list (NIP-65) to multiple relays:

```bash
# Using nak
for relay in $(curl -s https://api.nostr.watch/v1/online | jq -r '.[]'); do
  nak event -c "" \
    -t r=wss://relay1.com \
    -t r=wss://relay2.com \
    -t r=wss://relay3.com \
    --kind 10002 \
    --sec $PRIVKEY \
    $relay
done
```

## Best Practices

1. **Rate limit** sync operations to avoid overloading relays
2. **Use filters** to sync only needed events
3. **Verify events** before publishing to destination
4. **Monitor** sync progress and errors
5. **Deduplicate** to avoid publishing duplicates

## See Also

- [Relay Explorers](./explorers)
- [Relay Implementations](./implementations)
- [Snippets Reference](../reference/snippets)
