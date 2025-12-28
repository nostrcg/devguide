---
sidebar_position: 5
title: Testing
description: Testing Nostr applications
---

# Testing Nostr Applications

This guide covers testing strategies for Nostr clients, relays, and libraries.

## Testing Setup

### Local Relay for Testing

Run a local relay for isolated testing:

```bash
# Using strfry
docker run -p 7777:7777 hoytech/strfry

# Using a simple relay
npx nostr-relay
```

### Test Configuration

```javascript
const TEST_RELAYS = ['ws://localhost:7777'];

const testPool = new SimplePool();
```

## Unit Testing

### Testing Event Creation

```javascript
import { describe, it, expect } from 'vitest';
import { generateSecretKey, getPublicKey, finalizeEvent, verifyEvent } from 'nostr-tools/pure';

describe('Event Creation', () => {
  it('should create valid signed event', () => {
    const sk = generateSecretKey();
    const event = finalizeEvent({
      kind: 1,
      content: 'Test note',
      tags: [],
      created_at: Math.floor(Date.now() / 1000)
    }, sk);

    expect(event.id).toHaveLength(64);
    expect(event.sig).toHaveLength(128);
    expect(verifyEvent(event)).toBe(true);
  });

  it('should include correct tags', () => {
    const sk = generateSecretKey();
    const event = finalizeEvent({
      kind: 1,
      content: 'Test with tags',
      tags: [
        ['e', 'abc123'],
        ['p', 'def456']
      ],
      created_at: Math.floor(Date.now() / 1000)
    }, sk);

    expect(event.tags).toHaveLength(2);
    expect(event.tags[0][0]).toBe('e');
  });
});
```

### Testing Filters

```javascript
describe('Filter Matching', () => {
  it('should match by kind', () => {
    const filter = { kinds: [1] };
    const event = { kind: 1, content: 'test' };

    expect(matchFilter(filter, event)).toBe(true);
  });

  it('should match by author', () => {
    const filter = { authors: ['abc123'] };
    const event = { pubkey: 'abc123' };

    expect(matchFilter(filter, event)).toBe(true);
  });

  it('should match by time range', () => {
    const now = Math.floor(Date.now() / 1000);
    const filter = { since: now - 3600, until: now };
    const event = { created_at: now - 1800 };

    expect(matchFilter(filter, event)).toBe(true);
  });
});

function matchFilter(filter, event) {
  if (filter.kinds && !filter.kinds.includes(event.kind)) return false;
  if (filter.authors && !filter.authors.includes(event.pubkey)) return false;
  if (filter.since && event.created_at < filter.since) return false;
  if (filter.until && event.created_at > filter.until) return false;
  return true;
}
```

### Testing Encryption

```javascript
import { nip44 } from 'nostr-tools';

describe('NIP-44 Encryption', () => {
  it('should encrypt and decrypt correctly', () => {
    const sk1 = generateSecretKey();
    const pk1 = getPublicKey(sk1);
    const sk2 = generateSecretKey();
    const pk2 = getPublicKey(sk2);

    const plaintext = 'Secret message';

    // Encrypt from sk1 to pk2
    const convKey1 = nip44.v2.utils.getConversationKey(sk1, pk2);
    const ciphertext = nip44.v2.encrypt(plaintext, convKey1);

    // Decrypt from sk2 using pk1
    const convKey2 = nip44.v2.utils.getConversationKey(sk2, pk1);
    const decrypted = nip44.v2.decrypt(ciphertext, convKey2);

    expect(decrypted).toBe(plaintext);
  });
});
```

## Integration Testing

### Testing Relay Communication

```javascript
describe('Relay Integration', () => {
  let pool;

  beforeAll(() => {
    pool = new SimplePool();
  });

  afterAll(() => {
    pool.close(['ws://localhost:7777']);
  });

  it('should publish and retrieve event', async () => {
    const sk = generateSecretKey();
    const event = finalizeEvent({
      kind: 1,
      content: `Test ${Date.now()}`,
      tags: [],
      created_at: Math.floor(Date.now() / 1000)
    }, sk);

    // Publish
    await pool.publish(['ws://localhost:7777'], event);

    // Wait a bit
    await new Promise(r => setTimeout(r, 500));

    // Retrieve
    const events = await pool.querySync(['ws://localhost:7777'], {
      ids: [event.id]
    });

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe(event.id);
  });

  it('should handle subscription', async () => {
    const events = [];
    const sk = generateSecretKey();
    const pk = getPublicKey(sk);

    const sub = pool.subscribeMany(
      ['ws://localhost:7777'],
      [{ kinds: [1], authors: [pk], limit: 5 }],
      {
        onevent(event) {
          events.push(event);
        }
      }
    );

    // Publish some events
    for (let i = 0; i < 3; i++) {
      const event = finalizeEvent({
        kind: 1,
        content: `Test ${i}`,
        tags: [],
        created_at: Math.floor(Date.now() / 1000)
      }, sk);
      await pool.publish(['ws://localhost:7777'], event);
    }

    await new Promise(r => setTimeout(r, 1000));
    sub.close();

    expect(events.length).toBeGreaterThanOrEqual(3);
  });
});
```

## Mocking

### Mock Relay

```javascript
class MockRelay {
  constructor() {
    this.events = new Map();
    this.subscriptions = new Map();
  }

  publish(event) {
    if (!verifyEvent(event)) {
      return { accepted: false, reason: 'invalid signature' };
    }
    this.events.set(event.id, event);
    this.notifySubscriptions(event);
    return { accepted: true };
  }

  subscribe(id, filters) {
    this.subscriptions.set(id, { filters, events: [] });

    // Send existing matching events
    const matching = this.findMatching(filters);
    return matching;
  }

  unsubscribe(id) {
    this.subscriptions.delete(id);
  }

  findMatching(filters) {
    return [...this.events.values()].filter(event =>
      filters.some(f => this.matches(f, event))
    );
  }

  matches(filter, event) {
    // Implement filter matching
    return true;
  }

  notifySubscriptions(event) {
    for (const [id, sub] of this.subscriptions) {
      if (sub.filters.some(f => this.matches(f, event))) {
        sub.events.push(event);
      }
    }
  }
}
```

### Mock NIP-07 Extension

```javascript
const mockNostr = {
  _privateKey: generateSecretKey(),
  _publicKey: null,

  async getPublicKey() {
    if (!this._publicKey) {
      this._publicKey = getPublicKey(this._privateKey);
    }
    return this._publicKey;
  },

  async signEvent(event) {
    return finalizeEvent(event, this._privateKey);
  },

  async getRelays() {
    return {
      'wss://relay.example.com': { read: true, write: true }
    };
  }
};

// In tests
beforeAll(() => {
  window.nostr = mockNostr;
});

afterAll(() => {
  delete window.nostr;
});
```

## E2E Testing

### Playwright Example

```javascript
import { test, expect } from '@playwright/test';

test.describe('Nostr Client', () => {
  test('should display feed', async ({ page }) => {
    await page.goto('/');

    // Wait for notes to load
    await expect(page.locator('.note')).toHaveCount({ minimum: 1 });
  });

  test('should post note', async ({ page }) => {
    await page.goto('/');

    // Fill in note
    await page.fill('textarea[name="content"]', 'Test note');
    await page.click('button[type="submit"]');

    // Verify it appears
    await expect(page.locator('.note').first()).toContainText('Test note');
  });

  test('should display profile', async ({ page }) => {
    await page.goto('/profile/npub1...');

    await expect(page.locator('.profile-name')).toBeVisible();
    await expect(page.locator('.profile-notes')).toHaveCount({ minimum: 1 });
  });
});
```

## Performance Testing

### Load Testing Relays

```javascript
async function loadTest(relayUrl, numEvents = 1000) {
  const sk = generateSecretKey();
  const startTime = Date.now();

  const events = [];
  for (let i = 0; i < numEvents; i++) {
    events.push(finalizeEvent({
      kind: 1,
      content: `Load test ${i}`,
      tags: [],
      created_at: Math.floor(Date.now() / 1000)
    }, sk));
  }

  const pool = new SimplePool();

  // Publish all events
  await Promise.all(events.map(e => pool.publish([relayUrl], e)));

  const duration = Date.now() - startTime;
  console.log(`Published ${numEvents} events in ${duration}ms`);
  console.log(`Rate: ${(numEvents / duration * 1000).toFixed(2)} events/sec`);
}
```

## Best Practices

1. **Use isolated test relays** - Don't test against production
2. **Clean up after tests** - Remove test events
3. **Test edge cases** - Invalid signatures, malformed events
4. **Test rate limits** - Verify your app handles throttling
5. **Test offline scenarios** - Relay disconnections
6. **Mock external services** - Lightning, NIP-05 verification

## See Also

- [Libraries Overview](../libraries/overview)
- [Developer Tools](../ecosystem/tools)
- [Building Clients](./building-clients)
