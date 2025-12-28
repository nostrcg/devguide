---
sidebar_position: 7
title: Relay Explorers
description: Tools for exploring and monitoring Nostr relays
---

# Relay Explorers

Relay explorers allow you to view and monitor specific relays, check their status, and analyze their content.

## Relay Monitoring Services

### nostr.watch

The primary relay monitoring service.

**Website:** [nostr.watch](https://nostr.watch)

**Features:**
- Real-time relay status
- NIP support detection
- Performance metrics
- Historical uptime data
- Geographic distribution

### Nostr Pulse

Web-based relay explorer.

**Website:** [nostrpul.se](https://nostrpul.se/)

**Features:**
- Relay information display
- Event statistics
- Connection testing

## Relay Explorers

### relays.vercel.app

Interactive relay explorer interface.

**Website:** [relays.vercel.app](https://relays.vercel.app)

**Usage:**
```
https://relays.vercel.app/relay/nrelay1qqghwumn8ghj7mn0wd68yv339e3k7mgftj9ag
```

### relay.tools

Relay exploration and management platform.

**Website:** [relay.tools](https://relay.tools)

**Features:**
- Relay dashboard
- Event inspection
- Filter testing

## Command Line Tools

### websocat

Connect and query relays directly.

**Installation:**
```bash
cargo install websocat
```

**Test connectivity:**
```bash
websocat -k -v wss://relay.damus.io/ --ping-interval 5
```

**Subscribe to events:**
```bash
echo '["REQ", "x", {"kinds": [1], "limit": 5}]' | \
  websocat -n --ping-interval 20 wss://relay.damus.io
```

**Query specific author:**
```bash
echo '["REQ", "x", {"kinds":[0,2,10002], "authors": ["pubkey-hex"]}]' | \
  timeout 2 websocat -n --ping-interval 20 wss://relay.damus.io
```

### nak (Nostr Army Knife)

Swiss army knife for Nostr.

**Installation:**
```bash
go install github.com/fiatjaf/nak@latest
```

**Query relay:**
```bash
nak req -k 1 -l 10 wss://relay.damus.io
```

**Get relay info:**
```bash
curl -H "Accept: application/nostr+json" https://relay.damus.io/
```

### wscat

Node.js WebSocket client.

```bash
npm install -g wscat
wscat -c wss://relay.damus.io
```

## Checking Relay Status

### Basic Health Check

```bash
# Check if relay accepts connections
curl -I https://relay.example.com/

# Get NIP-11 info
curl -H "Accept: application/nostr+json" https://relay.example.com/ | jq
```

### Supported NIPs

```bash
curl -s -H "Accept: application/nostr+json" https://relay.example.com/ | \
  jq '.supported_nips'
```

### Connection Test Script

```bash
#!/bin/bash
# test-relay.sh

RELAY=$1

echo "Testing $RELAY..."

# HTTP check
if curl -s -I "$RELAY" > /dev/null 2>&1; then
    echo "✓ HTTP reachable"
else
    echo "✗ HTTP not reachable"
fi

# NIP-11 info
INFO=$(curl -s -H "Accept: application/nostr+json" "$RELAY" 2>/dev/null)
if [ -n "$INFO" ]; then
    echo "✓ NIP-11 info available"
    echo "  Name: $(echo $INFO | jq -r '.name')"
    echo "  NIPs: $(echo $INFO | jq -r '.supported_nips')"
else
    echo "✗ NIP-11 info not available"
fi

# WebSocket test
WS_URL=$(echo "$RELAY" | sed 's/https/wss/' | sed 's/http/ws/')
if echo '["REQ","test",{"limit":1}]' | timeout 5 websocat -n "$WS_URL" 2>/dev/null | head -1 | grep -q "EVENT\|EOSE"; then
    echo "✓ WebSocket working"
else
    echo "✗ WebSocket not working"
fi
```

## Relay Statistics

### Get Event Counts

Using NIP-45 (if supported):

```bash
echo '["COUNT", "stats", {"kinds": [1]}]' | \
  websocat -n wss://relay.example.com
```

### Monitor Firehose

Stream all events (use sparingly):

```bash
echo '["REQ", "firehose", {"kinds": [1], "limit": 0}]' | \
  websocat -n --ping-interval 20 wss://relay.damus.io | \
  while read -r line; do
    echo "$line" | jq -r '.[2].content // empty' | head -c 100
    echo
  done
```

## Relay Lists

### Fetch from Relay

```bash
# Get user's relay list (NIP-65)
echo '["REQ", "x", {"kinds": [10002], "authors": ["pubkey"], "limit": 1}]' | \
  websocat -n wss://relay.damus.io
```

### Online Lists

- [nostr.watch](https://nostr.watch) - Comprehensive relay list
- [relay.nostr.info](https://nostr.info/relays/) - Relay directory
- [Nostr.band API](https://api.nostr.band) - Relay discovery

## Debugging Tips

### Common Issues

| Issue | Check |
|-------|-------|
| Connection refused | Firewall, relay down |
| SSL error | Certificate, domain |
| Timeout | Relay overloaded |
| No events | Filter too restrictive |

### Verbose Connection

```bash
websocat -v wss://relay.example.com 2>&1
```

### Check Response Time

```bash
time (echo '["REQ","x",{"limit":1}]' | \
  timeout 5 websocat -n wss://relay.example.com | head -1)
```

## See Also

- [Relay Overview](./overview)
- [Sync Tools](./sync-tools)
- [Relay Info Reference](../reference/relay-info)
