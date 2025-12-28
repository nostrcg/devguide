---
sidebar_position: 4
title: Relay Configuration
description: Configuring Nostr relay software
---

# Relay Configuration

This page covers configuration options for popular relay implementations.

## strfry Configuration

Create `strfry.conf`:

```yaml
##
## strfry configuration
##

# Database location
db = "./strfry-db/"

dbParams {
    # Maximum database size (10GB)
    maxreaders = 256
    mapsize = 10737418240
}

relay {
    # Network binding
    bind = "0.0.0.0"
    port = 7777

    # Set to true behind reverse proxy
    realIpHeader = ""

    # Relay information (NIP-11)
    info {
        name = "My Relay"
        description = "A personal Nostr relay for friends and family"
        pubkey = "32-byte-hex-pubkey"
        contact = "admin@example.com"
        icon = "https://example.com/relay-icon.png"
    }

    # Connection limits
    maxWebsocketPayloadSize = 131072
    autoPingInterval = 55
    enableTcpKeepalive = false

    # Event handling
    enableNegentropy = true

    # Limits
    limits {
        maxMessageLength = 131072
        maxSubscriptions = 20
        maxFilters = 10
        maxSubidLength = 100
        maxEventTags = 100
        maxContentLength = 65535

        # Rate limiting
        messages {
            # Max messages per IP per second
            max = 10
            dripRate = 5
        }
        events {
            # Max events per IP per second
            max = 5
            dripRate = 2
        }
    }

    # Write policy plugin
    writePolicy {
        plugin = "./plugins/write-policy.sh"
    }
}
```

### Write Policy Plugin

Create a script to filter events:

```bash
#!/bin/bash
# plugins/write-policy.sh

# Read event from stdin
event=$(cat)

# Extract kind
kind=$(echo "$event" | jq -r '.kind')

# Allow only specific kinds
case $kind in
    0|1|3|5|6|7|10002)
        echo '{"action":"accept"}'
        ;;
    *)
        echo '{"action":"reject","msg":"Kind not allowed"}'
        ;;
esac
```

## nostream Configuration

Edit `.env`:

```bash
# Relay identity
RELAY_NAME="My Nostream Relay"
RELAY_DESCRIPTION="A production Nostr relay"
RELAY_PUBKEY="your-32-byte-hex-pubkey"
RELAY_CONTACT="admin@example.com"
RELAY_ICON="https://example.com/icon.png"

# Database
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_USER=nostr
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=nostr

# Limits
MAX_EVENT_TAGS=100
MAX_CONTENT_LENGTH=65536

# Rate limiting
EVENT_CREATED_AT_UPPER_LIMIT=60
EVENT_CREATED_AT_LOWER_LIMIT=31536000

# Network
RELAY_PORT=8008

# Payments (optional)
PAYMENTS_ENABLED=false
LNURL_CALLBACK="https://your-lnurl-endpoint.com"

# Mirror (optional)
MIRROR_ENABLED=false
MIRROR_URLS="wss://relay.damus.io"
```

## nostr-rs-relay Configuration

Create `config.toml`:

```toml
[info]
relay_url = "wss://relay.example.com/"
name = "My Relay"
description = "Personal Nostr relay"
pubkey = "your-hex-pubkey"
contact = "admin@example.com"

[database]
# SQLite
data_directory = "./data"

# Or PostgreSQL
# engine = "postgres"
# connection = "postgresql://user:pass@localhost/nostr"

[network]
port = 8080
address = "0.0.0.0"
ping_interval_seconds = 300

[limits]
messages_per_sec = 5
subscriptions_per_min = 60
max_event_bytes = 131072
max_ws_message_bytes = 131072
max_ws_frame_bytes = 131072
broadcast_buffer = 16384
event_persist_buffer = 4096

[authorization]
# Allow specific pubkeys only
#pubkey_whitelist = [
#    "pubkey1",
#    "pubkey2"
#]

[verified_users]
# Require NIP-05 verification
verify_expiration_hours = 168
```

## Common Settings

### Rate Limiting

Protect against abuse:

| Setting | Recommended | Description |
|---------|-------------|-------------|
| Messages/sec | 5-10 | Max messages per connection |
| Events/sec | 2-5 | Max events per connection |
| Subscriptions | 10-20 | Max active subscriptions |
| Connections/IP | 5-10 | Max connections per IP |

### Event Limits

| Setting | Recommended | Description |
|---------|-------------|-------------|
| Content length | 65KB | Max event content size |
| Tags | 100 | Max tags per event |
| Message size | 128KB | Max WebSocket message |
| Time drift | ±60s | Allowed timestamp variance |

### Storage Policies

```yaml
# Keep events for 30 days
retention {
    enabled = true
    maxAgeDays = 30
}

# Limit events per author
quotas {
    maxEventsPerAuthor = 10000
}
```

## NIP-42 Authentication

Require authentication for write access:

### strfry

```yaml
relay {
    authRequired = true
}
```

### nostream

```bash
NIP42_ENABLED=true
NIP42_REQUIRED=true
```

## Paid Relay Setup

### Using nostream

```bash
PAYMENTS_ENABLED=true
PAYMENTS_PROCESSOR=lnbits
LNBITS_URL=https://legend.lnbits.com
LNBITS_API_KEY=your-api-key
ADMISSION_AMOUNT_MSATS=21000
```

### Custom Payment Plugin (strfry)

```bash
#!/bin/bash
# plugins/paid-policy.sh

event=$(cat)
pubkey=$(echo "$event" | jq -r '.pubkey')

# Check if pubkey has paid (call your payment DB)
if check_payment "$pubkey"; then
    echo '{"action":"accept"}'
else
    echo '{"action":"reject","msg":"Payment required"}'
fi
```

## Whitelisting

Allow only specific users:

```toml
# nostr-rs-relay
[authorization]
pubkey_whitelist = [
    "friend1-pubkey",
    "friend2-pubkey",
    "friend3-pubkey"
]
```

## Kind Filtering

Accept only specific event kinds:

```python
# Python policy example
ALLOWED_KINDS = [0, 1, 3, 5, 6, 7, 10002, 30023]

def check_event(event):
    if event['kind'] not in ALLOWED_KINDS:
        return {"action": "reject", "msg": "Kind not allowed"}
    return {"action": "accept"}
```

## Environment Variables

Common environment variables:

```bash
# Logging
LOG_LEVEL=info  # debug, info, warn, error

# Performance
RUST_LOG=info
GOMAXPROCS=4

# Limits
NOFILE=1000000  # File descriptor limit
```

## See Also

- [Running a Relay](./running-a-relay)
- [Reverse Proxy](./reverse-proxy)
- [Relay Info Reference](../reference/relay-info)
