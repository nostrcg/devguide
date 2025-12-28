---
sidebar_position: 4
title: Filters
description: Querying events with Nostr filters
---

# Filters

Filters are JSON objects used to request events from relays. Understanding filters is essential for building efficient Nostr applications.

## Filter Structure

```json
{
  "ids": ["<event-id>", "..."],
  "authors": ["<pubkey>", "..."],
  "kinds": [1, 6, 7],
  "#e": ["<event-id>", "..."],
  "#p": ["<pubkey>", "..."],
  "#t": ["nostr", "development"],
  "since": 1700000000,
  "until": 1700086400,
  "limit": 100
}
```

## Filter Fields

### ids

Match specific event IDs. Can use prefixes.

```json
{"ids": ["abc123...", "def456..."]}
```

### authors

Match events from specific public keys.

```json
{"authors": ["pubkey1...", "pubkey2..."]}
```

### kinds

Match specific event kinds.

```json
{"kinds": [1]}           // Only kind 1
{"kinds": [1, 6, 7]}     // Kinds 1, 6, or 7
```

### Tag Filters (#)

Match events containing specific tag values. Use `#<tagname>`.

```json
{"#e": ["event-id"]}      // Events referencing this event
{"#p": ["pubkey"]}        // Events mentioning this pubkey
{"#t": ["bitcoin"]}       // Events with this hashtag
{"#a": ["30023:pk:slug"]} // Events referencing this address
```

### since

Only events created after this timestamp (inclusive).

```json
{"since": 1700000000}     // Events after Nov 14, 2023
```

### until

Only events created before this timestamp (inclusive).

```json
{"until": 1700086400}     // Events before Nov 15, 2023
```

### limit

Maximum number of events to return.

```json
{"limit": 100}            // Return at most 100 events
```

## Filter Logic

### Within a Filter: AND

All conditions in a single filter are AND-ed:

```json
{
  "authors": ["alice-pubkey"],
  "kinds": [1],
  "since": 1700000000
}
// Events from Alice, kind 1, after timestamp
```

### Multiple Filters: OR

Multiple filters in a REQ are OR-ed:

```json
["REQ", "my-sub",
  {"authors": ["alice"], "kinds": [1]},
  {"authors": ["bob"], "kinds": [1]}
]
// Notes from Alice OR notes from Bob
```

### Within Arrays: OR

Values within an array are OR-ed:

```json
{"kinds": [1, 6, 7]}      // kind 1 OR 6 OR 7
{"authors": ["a", "b"]}   // author a OR author b
```

## Common Patterns

### User's Feed

Get notes from followed users:

```javascript
const filter = {
  kinds: [1],
  authors: followedPubkeys,  // Array of pubkeys
  limit: 50,
  since: Math.floor(Date.now() / 1000) - 86400  // Last 24 hours
};
```

### User Profile

Get user's metadata:

```javascript
const filter = {
  kinds: [0],
  authors: [userPubkey],
  limit: 1
};
```

### Thread/Replies

Get all replies to an event:

```javascript
const filter = {
  kinds: [1],
  "#e": [eventId]
};
```

### User Activity

Get a user's recent activity:

```javascript
const filter = {
  kinds: [1, 6, 7],  // notes, reposts, reactions
  authors: [userPubkey],
  limit: 100
};
```

### Hashtag Search

Find events with a specific hashtag:

```javascript
const filter = {
  kinds: [1, 30023],  // notes and articles
  "#t": ["nostr"],
  limit: 50
};
```

### Global Feed

Get recent public notes:

```javascript
const filter = {
  kinds: [1],
  limit: 50
};
```

## Subscription Management

### Creating Subscriptions

```javascript
import { SimplePool } from 'nostr-tools';

const pool = new SimplePool();
const relays = ['wss://relay.damus.io', 'wss://nos.lol'];

// Subscribe with callback
const sub = pool.subscribeMany(
  relays,
  [{ kinds: [1], limit: 10 }],
  {
    onevent(event) {
      console.log('Received:', event);
    },
    oneose() {
      console.log('End of stored events');
    }
  }
);

// Later: close subscription
sub.close();
```

### Querying (One-shot)

```javascript
// Get events and close automatically
const events = await pool.querySync(
  relays,
  { kinds: [1], limit: 10 }
);
```

## Performance Tips

### Use Limits

Always include `limit` to avoid overwhelming responses:

```json
{"kinds": [1], "limit": 100}
```

### Use Time Bounds

Constrain queries with `since` and `until`:

```javascript
const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
const filter = {
  kinds: [1],
  since: oneHourAgo,
  limit: 50
};
```

### Be Specific

More specific filters = faster responses:

```javascript
// Bad: Gets everything
{"kinds": [1]}

// Good: Specific to what you need
{"kinds": [1], "authors": [pubkey], "limit": 20}
```

### Prefix Matching

IDs and authors support prefix matching for efficiency:

```json
{"ids": ["abc"]}       // Matches any ID starting with "abc"
{"authors": ["a1b2"]}  // Matches any pubkey starting with "a1b2"
```

## Multiple Subscriptions

Clients can have multiple active subscriptions:

```javascript
// Feed subscription
pool.subscribeMany(relays, [feedFilter], {
  onevent: handleFeedEvent
});

// Notification subscription
pool.subscribeMany(relays, [notificationFilter], {
  onevent: handleNotification
});

// Profile subscription
pool.subscribeMany(relays, [profileFilter], {
  onevent: handleProfile
});
```

## Relay Behavior

Different relays may have different:
- **Storage limits** - May not have old events
- **Rate limits** - May throttle requests
- **Filtering policies** - May not serve all kinds
- **Query limits** - May cap `limit` values

Always connect to multiple relays for reliability.

## See Also

- [Relay Communication](./relay-communication)
- [Event Kinds](./kinds)
- [Libraries Overview](../libraries/overview)
