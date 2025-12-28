---
sidebar_position: 3
title: Event Kinds
description: Reference for all Nostr event kinds
---

# Event Kinds

Event kinds are integers that define the type and meaning of an event. This page documents the most commonly used kinds.

## Kind Ranges

| Range | Category | Storage |
|-------|----------|---------|
| 0-999 | Regular events | All stored |
| 1000-9999 | Regular events | All stored |
| 10000-19999 | Replaceable events | Only latest kept |
| 20000-29999 | Ephemeral events | Not stored |
| 30000-39999 | Parameterized replaceable | Latest per `d` tag |
| 40000-49999 | Reserved | - |

## Core Kinds

### Kind 0: User Metadata

Profile information. Content is a JSON object.

```json
{
  "kind": 0,
  "content": "{\"name\":\"Alice\",\"about\":\"Developer\",\"picture\":\"https://example.com/avatar.jpg\",\"nip05\":\"alice@example.com\"}",
  "tags": []
}
```

**Content fields:**
| Field | Description |
|-------|-------------|
| `name` | Display name |
| `about` | Bio/description |
| `picture` | Avatar URL |
| `banner` | Banner image URL |
| `nip05` | NIP-05 identifier |
| `lud16` | Lightning address |
| `website` | Website URL |

### Kind 1: Short Text Note

The basic "post" or "tweet" equivalent.

```json
{
  "kind": 1,
  "content": "Hello, world! This is my first note.",
  "tags": []
}
```

### Kind 3: Follow List

List of pubkeys the user follows. Replaceable.

```json
{
  "kind": 3,
  "content": "{\"wss://relay.example.com\":{\"read\":true,\"write\":true}}",
  "tags": [
    ["p", "pubkey1", "wss://relay1.com", "alice"],
    ["p", "pubkey2", "wss://relay2.com", "bob"]
  ]
}
```

### Kind 4: Encrypted Direct Message (Deprecated)

NIP-04 encrypted DMs. Consider NIP-44 (kind 1059) instead.

```json
{
  "kind": 4,
  "content": "<encrypted content>?iv=<iv>",
  "tags": [["p", "<recipient pubkey>"]]
}
```

### Kind 5: Deletion Request

Request to delete events.

```json
{
  "kind": 5,
  "content": "These events were posted by mistake",
  "tags": [
    ["e", "event-id-to-delete"],
    ["e", "another-event-id"]
  ]
}
```

### Kind 6: Repost

Repost/boost of another event.

```json
{
  "kind": 6,
  "content": "<original event JSON>",
  "tags": [
    ["e", "original-event-id", "wss://relay.com"],
    ["p", "original-author-pubkey"]
  ]
}
```

### Kind 7: Reaction

Like, emoji reaction, or similar.

```json
{
  "kind": 7,
  "content": "+",
  "tags": [
    ["e", "event-being-reacted-to"],
    ["p", "author-of-reacted-event"]
  ]
}
```

**Content values:**
- `+` - Like
- `-` - Dislike
- Emoji (e.g., `🤙`, `🔥`) - Custom reaction

## Social Kinds

### Kind 1984: Report

Report content or users for moderation.

```json
{
  "kind": 1984,
  "content": "Reason for report",
  "tags": [
    ["e", "reported-event-id", "spam"],
    ["p", "reported-pubkey", "impersonation"]
  ]
}
```

### Kind 9735: Zap Receipt

Lightning payment receipt (from wallet service).

```json
{
  "kind": 9735,
  "content": "Optional message",
  "tags": [
    ["p", "recipient-pubkey"],
    ["e", "zapped-event-id"],
    ["bolt11", "lnbc..."],
    ["description", "<kind 9734 zap request JSON>"]
  ]
}
```

### Kind 30023: Long-form Content

Blog posts, articles. Parameterized replaceable.

```json
{
  "kind": 30023,
  "content": "# My Article\n\nThis is a long-form article...",
  "tags": [
    ["d", "my-article-slug"],
    ["title", "My Article Title"],
    ["summary", "Brief description"],
    ["published_at", "1700000000"],
    ["t", "technology"]
  ]
}
```

## Lists (NIP-51)

### Kind 10000: Mute List

Muted pubkeys and threads.

```json
{
  "kind": 10000,
  "content": "",
  "tags": [
    ["p", "muted-pubkey-1"],
    ["p", "muted-pubkey-2"],
    ["e", "muted-thread-id"]
  ]
}
```

### Kind 10001: Pin List

Pinned events/notes.

```json
{
  "kind": 10001,
  "content": "",
  "tags": [
    ["e", "pinned-event-1"],
    ["e", "pinned-event-2"]
  ]
}
```

### Kind 30000: Custom Lists

Generic lists with custom identifiers.

```json
{
  "kind": 30000,
  "tags": [
    ["d", "my-favorite-devs"],
    ["p", "pubkey1"],
    ["p", "pubkey2"]
  ]
}
```

## Application Kinds

### Kind 1063: File Metadata

Metadata for files/media (NIP-94).

```json
{
  "kind": 1063,
  "content": "Description of the file",
  "tags": [
    ["url", "https://example.com/file.jpg"],
    ["m", "image/jpeg"],
    ["x", "<sha256 hash>"],
    ["size", "102400"],
    ["dim", "1920x1080"]
  ]
}
```

### Kind 30009: Badge Definition

Define achievements/badges (NIP-58).

```json
{
  "kind": 30009,
  "tags": [
    ["d", "early-adopter"],
    ["name", "Early Adopter"],
    ["description", "Joined before 2024"],
    ["image", "https://example.com/badge.png"],
    ["thumb", "https://example.com/badge-thumb.png"]
  ]
}
```

### Kind 31990: App Handler

Declare which event kinds an app handles (NIP-89).

```json
{
  "kind": 31990,
  "tags": [
    ["d", "my-app-identifier"],
    ["k", "1"],
    ["k", "30023"]
  ],
  "content": "{\"name\":\"My App\",\"about\":\"Handles notes and articles\"}"
}
```

## Relay-Related Kinds

### Kind 10002: Relay List Metadata

User's preferred relays (NIP-65).

```json
{
  "kind": 10002,
  "content": "",
  "tags": [
    ["r", "wss://relay1.com", "read"],
    ["r", "wss://relay2.com", "write"],
    ["r", "wss://relay3.com"]
  ]
}
```

### Kind 30078: App-Specific Data

Store application data in relays.

```json
{
  "kind": 30078,
  "tags": [["d", "app-settings-myapp"]],
  "content": "{\"theme\":\"dark\",\"notifications\":true}"
}
```

## Quick Reference Table

| Kind | Name | Replaceable | NIP |
|------|------|-------------|-----|
| 0 | Metadata | Yes | 1 |
| 1 | Short Note | No | 1 |
| 3 | Follows | Yes | 2 |
| 4 | Encrypted DM | No | 4 |
| 5 | Deletion | No | 9 |
| 6 | Repost | No | 18 |
| 7 | Reaction | No | 25 |
| 1984 | Report | No | 56 |
| 9735 | Zap Receipt | No | 57 |
| 10000 | Mute List | Yes | 51 |
| 10001 | Pin List | Yes | 51 |
| 10002 | Relay List | Yes | 65 |
| 30000 | Custom Lists | Param | 51 |
| 30023 | Long-form | Param | 23 |

## See Also

- [Full NIPs Repository](https://github.com/nostr-protocol/nips)
- [Event Structure](./events)
- [Working with Filters](./filters)
