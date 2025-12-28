---
sidebar_position: 5
title: Command Snippets
description: Useful command-line snippets for Nostr development
---

# Command Snippets

Quick reference for common Nostr operations using command-line tools.

## Tools Setup

### Install nak (Nostr Army Knife)

```bash
go install github.com/fiatjaf/nak@latest
```

### Install websocat

```bash
cargo install websocat
# or via package manager
brew install websocat  # macOS
apt install websocat   # Debian/Ubuntu
```

### Install jq

```bash
brew install jq     # macOS
apt install jq      # Debian/Ubuntu
```

## Event Queries

### Fetch Recent Notes

```bash
# Using nak
nak req -k 1 -l 10 wss://relay.damus.io

# Using websocat
echo '["REQ", "x", {"kinds": [1], "limit": 10}]' | \
  websocat -n wss://relay.damus.io
```

### Query by Author

```bash
# Get profile (kind 0)
nak req -k 0 -a <pubkey-hex> wss://relay.damus.io

# Get notes from author
nak req -k 1 -a <pubkey-hex> -l 20 wss://relay.damus.io

# Using websocat
echo '["REQ", "x", {"kinds": [1], "authors": ["<pubkey-hex>"], "limit": 20}]' | \
  websocat -n wss://relay.damus.io
```

### Get Follow List

```bash
# Kind 3 is follow list
nak req -k 3 -a <pubkey-hex> -l 1 wss://relay.damus.io

# Extract followed pubkeys
nak req -k 3 -a <pubkey-hex> -l 1 wss://relay.damus.io | \
  jq -r '.tags[] | select(.[0]=="p") | .[1]'
```

### Get Relay List (NIP-65)

```bash
nak req -k 10002 -a <pubkey-hex> -l 1 wss://relay.damus.io

# Extract relay URLs
nak req -k 10002 -a <pubkey-hex> wss://relay.damus.io | \
  jq -r '.tags[] | select(.[0]=="r") | .[1]'
```

### Search Notes

```bash
# If relay supports NIP-50 search
echo '["REQ", "x", {"kinds": [1], "search": "nostr", "limit": 20}]' | \
  websocat -n wss://relay.nostr.band
```

### Time-Bounded Query

```bash
# Events from last 24 hours
SINCE=$(($(date +%s) - 86400))
nak req -k 1 --since $SINCE -l 50 wss://relay.damus.io

# Events in date range
echo '["REQ", "x", {"kinds": [1], "since": 1700000000, "until": 1700100000}]' | \
  websocat -n wss://relay.damus.io
```

## Event Publishing

### Publish a Note

```bash
# Interactive (will prompt for key)
nak event -c "Hello Nostr!" wss://relay.damus.io

# With private key
nak event -c "Hello Nostr!" --sec <privkey-hex> wss://relay.damus.io

# With reply
nak event -c "Great post!" \
  -e <event-id> \
  --sec <privkey-hex> \
  wss://relay.damus.io
```

### Publish Profile

```bash
nak event -k 0 \
  -c '{"name":"alice","about":"Developer"}' \
  --sec <privkey-hex> \
  wss://relay.damus.io
```

### Publish Follow List

```bash
nak event -k 3 \
  -p <pubkey1> \
  -p <pubkey2> \
  -p <pubkey3> \
  --sec <privkey-hex> \
  wss://relay.damus.io
```

### Delete Event

```bash
# Kind 5 deletion
nak event -k 5 \
  -e <event-id-to-delete> \
  --sec <privkey-hex> \
  wss://relay.damus.io
```

## Key Operations

### Generate Keys

```bash
# Generate new keypair
nak key generate

# Output format
# Private key (hex): <64-char-hex>
# Public key (hex): <64-char-hex>
# nsec: <nsec1...>
# npub: <npub1...>
```

### Convert Between Formats

```bash
# npub to hex
nak decode npub1...

# hex to npub
nak encode npub <hex>

# nsec to hex
nak decode nsec1...

# hex to nsec
nak encode nsec <hex>
```

### Encode Note ID

```bash
# Event ID to note format
nak encode note <event-id-hex>

# Decode note to hex
nak decode note1...
```

### Create NIP-19 Entities

```bash
# Create nprofile (pubkey + relays)
nak encode nprofile \
  --pubkey <hex> \
  --relay wss://relay.damus.io \
  --relay wss://nos.lol

# Create nevent (event + relays)
nak encode nevent \
  --id <event-id> \
  --relay wss://relay.damus.io \
  --author <pubkey>

# Create naddr (replaceable event address)
nak encode naddr \
  --pubkey <hex> \
  --kind 30023 \
  --identifier "my-article" \
  --relay wss://relay.damus.io
```

## Relay Operations

### Check Relay Info (NIP-11)

```bash
# Get relay information document
curl -s -H "Accept: application/nostr+json" https://relay.damus.io/ | jq

# Check supported NIPs
curl -s -H "Accept: application/nostr+json" https://relay.damus.io/ | \
  jq '.supported_nips'

# Get relay name
curl -s -H "Accept: application/nostr+json" https://relay.damus.io/ | \
  jq -r '.name'
```

### Test Relay Connection

```bash
# Quick connectivity test
websocat -v wss://relay.damus.io/ 2>&1 | head -5

# Send ping and wait for response
echo '["REQ", "test", {"limit": 1}]' | \
  timeout 5 websocat -n wss://relay.damus.io | head -1
```

### Count Events (NIP-45)

```bash
# If relay supports COUNT
echo '["COUNT", "x", {"kinds": [1]}]' | \
  websocat -n wss://relay.nostr.band
```

### Monitor Live Events

```bash
# Stream all kind 1 events (firehose)
echo '["REQ", "stream", {"kinds": [1], "limit": 0}]' | \
  websocat -n --ping-interval 30 wss://relay.damus.io

# Filter by hashtag
echo '["REQ", "stream", {"kinds": [1], "#t": ["nostr"], "limit": 0}]' | \
  websocat -n --ping-interval 30 wss://relay.damus.io
```

## Data Processing

### Parse Event JSON

```bash
# Extract content from events
nak req -k 1 -l 5 wss://relay.damus.io | jq -r '.content'

# Get event IDs
nak req -k 1 -l 5 wss://relay.damus.io | jq -r '.id'

# Get created_at as date
nak req -k 1 -l 5 wss://relay.damus.io | \
  jq -r '.created_at | todate'
```

### Filter Events

```bash
# Events with images
nak req -k 1 -l 100 wss://relay.damus.io | \
  jq 'select(.content | test("\\.(jpg|png|gif)"))'

# Events mentioning a pubkey
nak req -k 1 -l 100 wss://relay.damus.io | \
  jq 'select(.tags[][] == "<pubkey>")'
```

### Count by Kind

```bash
nak req -l 1000 wss://relay.damus.io | \
  jq -s 'group_by(.kind) | map({kind: .[0].kind, count: length})'
```

### Extract Tags

```bash
# Get all hashtags
nak req -k 1 -l 100 wss://relay.damus.io | \
  jq -r '.tags[] | select(.[0]=="t") | .[1]' | \
  sort | uniq -c | sort -rn

# Get all mentioned pubkeys
nak req -k 1 -l 100 wss://relay.damus.io | \
  jq -r '.tags[] | select(.[0]=="p") | .[1]' | \
  sort | uniq -c | sort -rn
```

## Sync Operations

### Export Events

```bash
# Export user's events to file
nak req -a <pubkey> wss://relay.damus.io > events.jsonl

# Export with specific kinds
nak req -k 0 -k 1 -k 3 -a <pubkey> wss://relay.damus.io > profile.jsonl
```

### Import Events

```bash
# Publish events from file
cat events.jsonl | while read event; do
  echo "[\"EVENT\", $event]" | websocat -n wss://destination-relay.com
  sleep 0.1
done
```

### Sync Relays

```bash
# Using nak sync (if available)
nak sync wss://source.com wss://dest.com \
  --filter '{"authors": ["<pubkey>"]}'

# Using strfry
strfry sync wss://relay.damus.io --filter '{"kinds": [1]}'
```

## Advanced Queries

### Get Thread

```bash
# Get root event and all replies
ROOT_ID="<event-id>"
nak req -e $ROOT_ID wss://relay.damus.io
nak req --e-tag $ROOT_ID wss://relay.damus.io
```

### Get Reactions

```bash
# Reactions to an event
nak req -k 7 --e-tag <event-id> wss://relay.damus.io

# Count likes
nak req -k 7 --e-tag <event-id> wss://relay.damus.io | \
  jq -s 'map(select(.content == "+" or .content == "")) | length'
```

### Get Zaps

```bash
# Zap receipts for an event
nak req -k 9735 --e-tag <event-id> wss://relay.damus.io

# Total zapped
nak req -k 9735 --e-tag <event-id> wss://relay.damus.io | \
  jq -r '.tags[] | select(.[0]=="bolt11") | .[1]'
```

### Get Reposts

```bash
# Kind 6 reposts
nak req -k 6 --e-tag <event-id> wss://relay.damus.io
```

## Verification

### Verify Event Signature

```bash
# nak automatically verifies, but to check manually:
nak verify < event.json
```

### Check NIP-05

```bash
# Verify NIP-05 identifier
curl -s "https://example.com/.well-known/nostr.json?name=alice" | \
  jq '.names.alice'
```

## One-Liners

```bash
# Random relay from nostr.watch
curl -s https://api.nostr.watch/v1/online | jq -r '.[]' | shuf | head -1

# Latest note from pubkey
nak req -k 1 -a <pubkey> -l 1 wss://relay.damus.io | jq -r '.content'

# Who does this person follow?
nak req -k 3 -a <pubkey> wss://relay.damus.io | \
  jq -r '.tags[] | select(.[0]=="p") | .[1]' | wc -l

# What relays does this person use?
nak req -k 10002 -a <pubkey> wss://relay.damus.io | \
  jq -r '.tags[] | select(.[0]=="r") | "\(.[2] // "rw"): \(.[1])"'

# Search for notes about bitcoin today
SINCE=$(($(date +%s) - 86400))
echo '["REQ","x",{"kinds":[1],"search":"bitcoin","since":'$SINCE'}]' | \
  websocat -n wss://relay.nostr.band | jq -r '.[2].content' | head -20
```

## Environment Setup

```bash
# Add to ~/.bashrc or ~/.zshrc

# Default relay
export NOSTR_RELAY="wss://relay.damus.io"

# Your keys (be careful with nsec!)
export NOSTR_PUBKEY="<your-pubkey-hex>"

# Handy aliases
alias nostr-req="nak req"
alias nostr-pub="nak event"
alias nostr-info="curl -s -H 'Accept: application/nostr+json'"

# Quick note function
nostr-note() {
  nak event -c "$1" --sec $NOSTR_PRIVKEY $NOSTR_RELAY
}
```

## See Also

- [nak Documentation](https://github.com/fiatjaf/nak)
- [websocat Documentation](https://github.com/vi/websocat)
- [Relay Explorers](../relays/explorers)
- [Protocol Overview](../protocol/overview)
