---
sidebar_position: 3
title: Relay Information
description: NIP-11 relay information document reference
---

# Relay Information

Reference for NIP-11 relay information documents and relay discovery.

## NIP-11 Information Document

Relays serve metadata via HTTP at their root URL.

### Request

```bash
curl -H "Accept: application/nostr+json" https://relay.example.com/
```

### Response Format

```json
{
  "name": "Example Relay",
  "description": "A Nostr relay for everyone",
  "pubkey": "32-byte-hex-pubkey",
  "contact": "admin@example.com",
  "supported_nips": [1, 2, 9, 11, 12, 15, 16, 20, 22, 33, 40],
  "software": "https://github.com/Cameri/nostream",
  "version": "1.22.6",
  "limitation": {
    "max_message_length": 65535,
    "max_subscriptions": 20,
    "max_filters": 10,
    "max_subid_length": 100,
    "max_event_tags": 100,
    "max_content_length": 65535,
    "min_pow_difficulty": 0,
    "auth_required": false,
    "payment_required": false,
    "created_at_lower_limit": 31536000,
    "created_at_upper_limit": 60
  },
  "relay_countries": ["US", "EU"],
  "language_tags": ["en"],
  "tags": ["community", "public"],
  "posting_policy": "https://relay.example.com/policy",
  "payments_url": "https://relay.example.com/pay",
  "fees": {
    "admission": [{"amount": 1000000, "unit": "msats"}],
    "subscription": [{"amount": 5000000, "unit": "msats", "period": 2592000}],
    "publication": [{"kinds": [4], "amount": 100, "unit": "msats"}]
  },
  "icon": "https://relay.example.com/icon.png"
}
```

## Field Reference

### Basic Info

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Relay name |
| `description` | string | Relay description |
| `pubkey` | string | Admin's public key |
| `contact` | string | Contact email/URL |
| `software` | string | Software URL |
| `version` | string | Software version |
| `icon` | string | Relay icon URL |

### Supported NIPs

```json
{
  "supported_nips": [1, 2, 9, 11, 12, 15, 16, 20, 22, 33, 40]
}
```

Check before using features:

```javascript
async function checkNipSupport(relayUrl, nip) {
  const info = await getRelayInfo(relayUrl);
  return info.supported_nips?.includes(nip) ?? false;
}
```

### Limitations

| Field | Description |
|-------|-------------|
| `max_message_length` | Maximum WebSocket message size |
| `max_subscriptions` | Max concurrent subscriptions |
| `max_filters` | Max filters per subscription |
| `max_subid_length` | Max subscription ID length |
| `max_event_tags` | Max tags per event |
| `max_content_length` | Max event content length |
| `min_pow_difficulty` | Required proof-of-work |
| `auth_required` | NIP-42 auth required |
| `payment_required` | Payment required to use |
| `created_at_lower_limit` | Max age of events (seconds) |
| `created_at_upper_limit` | Max future date (seconds) |

### Fees

```json
{
  "fees": {
    "admission": [{"amount": 1000000, "unit": "msats"}],
    "subscription": [
      {"amount": 5000000, "unit": "msats", "period": 2592000}
    ],
    "publication": [
      {"kinds": [4], "amount": 100, "unit": "msats"}
    ]
  }
}
```

## Fetching Relay Info

### JavaScript

```javascript
async function getRelayInfo(relayUrl) {
  const httpUrl = relayUrl
    .replace('wss://', 'https://')
    .replace('ws://', 'http://');

  const response = await fetch(httpUrl, {
    headers: { Accept: 'application/nostr+json' }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch relay info: ${response.status}`);
  }

  return response.json();
}

// Usage
const info = await getRelayInfo('wss://relay.damus.io');
console.log(info.name);
console.log(info.supported_nips);
```

### With Timeout

```javascript
async function getRelayInfoWithTimeout(relayUrl, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const httpUrl = relayUrl
      .replace('wss://', 'https://')
      .replace('ws://', 'http://');

    const response = await fetch(httpUrl, {
      headers: { Accept: 'application/nostr+json' },
      signal: controller.signal
    });

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
```

## Relay Discovery

### From User's Relay List (NIP-65)

```javascript
async function getUserRelays(pubkey) {
  const events = await pool.querySync(defaultRelays, {
    kinds: [10002],
    authors: [pubkey],
    limit: 1
  });

  if (events.length === 0) return [];

  return events[0].tags
    .filter(t => t[0] === 'r')
    .map(t => ({
      url: t[1],
      read: !t[2] || t[2] === 'read',
      write: !t[2] || t[2] === 'write'
    }));
}
```

### From NIP-05 Verification

```javascript
async function getRelaysFromNip05(identifier) {
  const [name, domain] = identifier.split('@');
  const url = `https://${domain}/.well-known/nostr.json?name=${name}`;

  const response = await fetch(url);
  const data = await response.json();

  const pubkey = data.names?.[name];
  if (!pubkey) return [];

  return data.relays?.[pubkey] || [];
}
```

## Public Relay Lists

### Monitoring Services

| Service | URL | Description |
|---------|-----|-------------|
| nostr.watch | [nostr.watch](https://nostr.watch) | Relay monitoring |
| nostr.info | [nostr.info/relays](https://nostr.info/relays) | Relay directory |

### Default Relays

Common default relay lists:

```javascript
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.snort.social',
  'wss://nostr.wine',
  'wss://relay.primal.net',
  'wss://purplepag.es'
];
```

## Relay Categories

### By Purpose

| Type | Description | Example |
|------|-------------|---------|
| General | Accept most events | relay.damus.io |
| Paid | Require payment | nostr.wine |
| Private | Auth required | Personal relays |
| Specialized | Specific content | Long-form only |

### By Region

Consider geographic distribution for:
- Lower latency
- Legal compliance
- Resilience

## Best Practices

1. **Check NIP support** before using features
2. **Respect limitations** to avoid disconnection
3. **Use multiple relays** for reliability
4. **Cache relay info** to reduce requests
5. **Handle missing fields** gracefully

```javascript
function getMaxContent(relayInfo) {
  return relayInfo?.limitation?.max_content_length ?? 65535;
}

function isAuthRequired(relayInfo) {
  return relayInfo?.limitation?.auth_required ?? false;
}
```

## See Also

- [Relay Implementations](../relays/implementations)
- [Running a Relay](../relays/running-a-relay)
- [NIP-11 Specification](https://github.com/nostr-protocol/nips/blob/master/11.md)
