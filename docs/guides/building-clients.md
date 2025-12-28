---
sidebar_position: 2
title: Building Clients
description: Guide to building Nostr client applications
---

# Building Clients

This guide covers best practices and patterns for building Nostr client applications.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  Your Client                     │
├──────────────┬───────────────┬─────────────────┤
│     UI       │    State      │    Services     │
│  Components  │   Management  │                 │
├──────────────┴───────────────┴─────────────────┤
│                 Nostr Layer                      │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │   Keys   │ │  Events  │ │ Relay Manager   │ │
│  └──────────┘ └──────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Key Management

### NIP-07 Integration

Always prefer browser extensions for key management:

```javascript
class NostrAuth {
  async getPublicKey() {
    if (!window.nostr) {
      throw new Error('No Nostr extension found');
    }
    return window.nostr.getPublicKey();
  }

  async signEvent(event) {
    if (!window.nostr) {
      throw new Error('No Nostr extension found');
    }
    return window.nostr.signEvent(event);
  }

  isAvailable() {
    return typeof window !== 'undefined' && !!window.nostr;
  }
}

// Usage
const auth = new NostrAuth();

if (auth.isAvailable()) {
  const pubkey = await auth.getPublicKey();
  console.log('Logged in as:', pubkey);
}
```

### Fallback for Local Keys

For development or when extension isn't available:

```javascript
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';

class LocalKeyManager {
  constructor() {
    this.secretKey = null;
  }

  generate() {
    this.secretKey = generateSecretKey();
    return getPublicKey(this.secretKey);
  }

  import(nsec) {
    const { data } = nip19.decode(nsec);
    this.secretKey = data;
    return getPublicKey(this.secretKey);
  }

  sign(event) {
    return finalizeEvent(event, this.secretKey);
  }
}
```

## Relay Management

### Connection Pool

```javascript
import { SimplePool } from 'nostr-tools';

class RelayManager {
  constructor() {
    this.pool = new SimplePool();
    this.relays = new Set();
  }

  addRelay(url) {
    this.relays.add(url);
  }

  removeRelay(url) {
    this.relays.delete(url);
  }

  async publish(event) {
    const relayList = [...this.relays];
    return Promise.allSettled(
      this.pool.publish(relayList, event)
    );
  }

  subscribe(filters, callbacks) {
    return this.pool.subscribeMany(
      [...this.relays],
      filters,
      callbacks
    );
  }

  async query(filter) {
    return this.pool.querySync([...this.relays], filter);
  }
}
```

### Default Relay List

```javascript
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.snort.social',
  'wss://nostr.wine',
];
```

### User's Relay List (NIP-65)

```javascript
async function getUserRelays(pubkey) {
  const events = await pool.querySync(DEFAULT_RELAYS, {
    kinds: [10002],
    authors: [pubkey],
    limit: 1
  });

  if (events.length === 0) return DEFAULT_RELAYS;

  const relayList = events[0].tags
    .filter(t => t[0] === 'r')
    .map(t => ({
      url: t[1],
      read: !t[2] || t[2] === 'read',
      write: !t[2] || t[2] === 'write'
    }));

  return relayList;
}
```

## Event Handling

### Event Store

```javascript
class EventStore {
  constructor() {
    this.events = new Map();
    this.byAuthor = new Map();
    this.byKind = new Map();
  }

  add(event) {
    // Store by ID
    this.events.set(event.id, event);

    // Index by author
    if (!this.byAuthor.has(event.pubkey)) {
      this.byAuthor.set(event.pubkey, new Set());
    }
    this.byAuthor.get(event.pubkey).add(event.id);

    // Index by kind
    if (!this.byKind.has(event.kind)) {
      this.byKind.set(event.kind, new Set());
    }
    this.byKind.get(event.kind).add(event.id);
  }

  getByAuthor(pubkey) {
    const ids = this.byAuthor.get(pubkey) || new Set();
    return [...ids].map(id => this.events.get(id));
  }

  getByKind(kind) {
    const ids = this.byKind.get(kind) || new Set();
    return [...ids].map(id => this.events.get(id));
  }
}
```

### Profile Handling

```javascript
class ProfileManager {
  constructor(relayManager) {
    this.relays = relayManager;
    this.profiles = new Map();
  }

  async getProfile(pubkey) {
    // Check cache
    if (this.profiles.has(pubkey)) {
      return this.profiles.get(pubkey);
    }

    // Fetch from relays
    const events = await this.relays.query({
      kinds: [0],
      authors: [pubkey],
      limit: 1
    });

    if (events.length > 0) {
      const profile = JSON.parse(events[0].content);
      this.profiles.set(pubkey, profile);
      return profile;
    }

    return null;
  }

  async updateProfile(profile) {
    const event = {
      kind: 0,
      content: JSON.stringify(profile),
      tags: [],
      created_at: Math.floor(Date.now() / 1000)
    };

    const signed = await this.auth.signEvent(event);
    await this.relays.publish(signed);
    this.profiles.set(signed.pubkey, profile);
  }
}
```

## Feed Building

### Timeline Feed

```javascript
async function buildFeed(follows, since, limit = 50) {
  const filter = {
    kinds: [1, 6],  // Notes and reposts
    authors: follows,
    since,
    limit
  };

  const events = await relayManager.query(filter);

  // Sort by timestamp
  events.sort((a, b) => b.created_at - a.created_at);

  return events;
}
```

### Thread View

```javascript
async function getThread(rootEventId) {
  // Get root event
  const rootEvents = await relayManager.query({
    ids: [rootEventId]
  });

  if (rootEvents.length === 0) return null;

  // Get all replies
  const replies = await relayManager.query({
    kinds: [1],
    '#e': [rootEventId]
  });

  // Build thread tree
  return buildThreadTree(rootEvents[0], replies);
}

function buildThreadTree(root, replies) {
  const replyMap = new Map();

  for (const reply of replies) {
    const parentId = reply.tags
      .filter(t => t[0] === 'e')
      .map(t => t[1])
      .pop();  // Last 'e' tag is typically the parent

    if (!replyMap.has(parentId)) {
      replyMap.set(parentId, []);
    }
    replyMap.get(parentId).push(reply);
  }

  function buildTree(event) {
    return {
      event,
      replies: (replyMap.get(event.id) || [])
        .sort((a, b) => a.created_at - b.created_at)
        .map(buildTree)
    };
  }

  return buildTree(root);
}
```

## UI Patterns

### Loading States

```javascript
function useFeed(pubkey) {
  const [state, setState] = useState({
    loading: true,
    events: [],
    error: null
  });

  useEffect(() => {
    const sub = pool.subscribeMany(relays, [
      { kinds: [1], authors: [pubkey], limit: 20 }
    ], {
      onevent(event) {
        setState(prev => ({
          ...prev,
          events: [...prev.events, event].sort((a, b) =>
            b.created_at - a.created_at
          )
        }));
      },
      oneose() {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => sub.close();
  }, [pubkey]);

  return state;
}
```

### Infinite Scroll

```javascript
function useInfiniteNotes(authors) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const oldestRef = useRef(Math.floor(Date.now() / 1000));

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);

    const events = await pool.querySync(relays, {
      kinds: [1],
      authors,
      until: oldestRef.current,
      limit: 20
    });

    if (events.length > 0) {
      oldestRef.current = Math.min(...events.map(e => e.created_at));
      setNotes(prev => [...prev, ...events]);
    }

    setLoading(false);
  };

  return { notes, loadMore, loading };
}
```

## Caching

### LocalStorage Cache

```javascript
const CACHE_KEY = 'nostr_cache';
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function getCached(key) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const entry = cache[key];

    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
  } catch (e) {
    console.error('Cache read error:', e);
  }
  return null;
}

function setCache(key, data) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[key] = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Cache write error:', e);
  }
}
```

## Error Handling

```javascript
async function publishWithRetry(event, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const results = await relayManager.publish(event);
      const successes = results.filter(r => r.status === 'fulfilled');

      if (successes.length > 0) {
        return { success: true, count: successes.length };
      }

      throw new Error('No relay accepted the event');
    } catch (error) {
      lastError = error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }

  throw lastError;
}
```

## See Also

- [Build Your First App](../getting-started/first-app)
- [Libraries Overview](../libraries/overview)
- [Key Management](./key-management)
