---
sidebar_position: 7
title: Social Graph
description: Understanding and implementing Nostr's social graph
---

# Social Graph

Nostr's social graph is built from follow lists, forming the foundation for web of trust, content discovery, and spam prevention.

## Core Concepts

### Follow Lists (NIP-02)

Every Nostr user publishes a kind 3 event containing their follow list.

```typescript
interface FollowListEvent {
  kind: 3;
  pubkey: string;          // User's public key
  tags: string[][];        // [["p", pubkey, relay?, petname?], ...]
  content: string;         // Often empty, sometimes relay preferences
  created_at: number;
}

// Example follow list
const followList = {
  kind: 3,
  pubkey: "userPubkey",
  tags: [
    ["p", "friend1Pubkey", "wss://relay.example.com", "alice"],
    ["p", "friend2Pubkey", "wss://nos.lol"],
    ["p", "friend3Pubkey"]
  ],
  content: "",
  created_at: Math.floor(Date.now() / 1000)
};
```

### Fetching Follows

```typescript
import { SimplePool } from 'nostr-tools';

async function getFollows(
  pubkey: string,
  pool: SimplePool,
  relays: string[]
): Promise<Set<string>> {
  const events = await pool.querySync(relays, {
    kinds: [3],
    authors: [pubkey],
    limit: 1
  });

  if (events.length === 0) return new Set();

  const follows = new Set<string>();
  for (const tag of events[0].tags) {
    if (tag[0] === 'p' && tag[1]) {
      follows.add(tag[1]);
    }
  }

  return follows;
}
```

### Followers (Reverse Lookup)

```typescript
async function getFollowers(
  pubkey: string,
  pool: SimplePool,
  relays: string[]
): Promise<Set<string>> {
  // Note: This can be expensive on large relays
  const events = await pool.querySync(relays, {
    kinds: [3],
    '#p': [pubkey]
  });

  return new Set(events.map(e => e.pubkey));
}
```

## Graph Distance

### Degrees of Separation

```typescript
interface GraphNode {
  pubkey: string;
  distance: number;
  path: string[];
}

async function findDistance(
  sourcePubkey: string,
  targetPubkey: string,
  pool: SimplePool,
  relays: string[],
  maxDepth: number = 3
): Promise<GraphNode | null> {
  if (sourcePubkey === targetPubkey) {
    return { pubkey: targetPubkey, distance: 0, path: [sourcePubkey] };
  }

  const visited = new Set<string>([sourcePubkey]);
  const queue: GraphNode[] = [{
    pubkey: sourcePubkey,
    distance: 0,
    path: [sourcePubkey]
  }];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.distance >= maxDepth) continue;

    const follows = await getFollows(current.pubkey, pool, relays);

    for (const followPubkey of follows) {
      if (followPubkey === targetPubkey) {
        return {
          pubkey: targetPubkey,
          distance: current.distance + 1,
          path: [...current.path, targetPubkey]
        };
      }

      if (!visited.has(followPubkey)) {
        visited.add(followPubkey);
        queue.push({
          pubkey: followPubkey,
          distance: current.distance + 1,
          path: [...current.path, followPubkey]
        });
      }
    }
  }

  return null;
}
```

## Web of Trust

### Trust Scoring

```typescript
interface TrustScore {
  pubkey: string;
  score: number;
  distance: number;
  mutualFollows: number;
}

async function calculateTrust(
  userPubkey: string,
  targetPubkey: string,
  pool: SimplePool,
  relays: string[]
): Promise<TrustScore> {
  const userFollows = await getFollows(userPubkey, pool, relays);
  const targetFollows = await getFollows(targetPubkey, pool, relays);
  const targetFollowers = await getFollowers(targetPubkey, pool, relays);

  // Check direct relationship
  const isFollowing = userFollows.has(targetPubkey);
  const isFollowedBack = targetFollows.has(userPubkey);

  // Count mutual follows
  let mutualFollows = 0;
  for (const follow of userFollows) {
    if (targetFollowers.has(follow)) {
      mutualFollows++;
    }
  }

  // Calculate trust score
  let score = 0;

  if (isFollowing && isFollowedBack) {
    score = 100; // Mutual follow
  } else if (isFollowing) {
    score = 80; // Direct follow
  } else if (mutualFollows > 0) {
    // Scale by mutual follows (max 70)
    score = Math.min(70, mutualFollows * 10);
  }

  const distance = isFollowing ? 1 : (mutualFollows > 0 ? 2 : Infinity);

  return { pubkey: targetPubkey, score, distance, mutualFollows };
}
```

### Strong Set

The "strong set" is a curated group of highly-trusted users used as a starting point for trust calculations.

```typescript
class StrongSet {
  private members: Set<string>;
  private pool: SimplePool;
  private relays: string[];

  constructor(
    initialMembers: string[],
    pool: SimplePool,
    relays: string[]
  ) {
    this.members = new Set(initialMembers);
    this.pool = pool;
    this.relays = relays;
  }

  isMember(pubkey: string): boolean {
    return this.members.has(pubkey);
  }

  async getDistanceFromStrongSet(pubkey: string): Promise<number> {
    if (this.isMember(pubkey)) return 0;

    for (const member of this.members) {
      const follows = await getFollows(member, this.pool, this.relays);
      if (follows.has(pubkey)) return 1;
    }

    // Check second degree
    for (const member of this.members) {
      const follows = await getFollows(member, this.pool, this.relays);
      for (const follow of follows) {
        const secondDegree = await getFollows(follow, this.pool, this.relays);
        if (secondDegree.has(pubkey)) return 2;
      }
    }

    return Infinity;
  }

  async trustScore(pubkey: string): Promise<number> {
    const distance = await this.getDistanceFromStrongSet(pubkey);
    switch (distance) {
      case 0: return 100;
      case 1: return 80;
      case 2: return 50;
      default: return 10;
    }
  }
}
```

## Mute and Block Lists

### Mute List (NIP-51)

```typescript
interface MuteList {
  pubkeys: string[];       // Muted users
  eventIds: string[];      // Muted threads
  hashtags: string[];      // Muted topics
  words: string[];         // Muted keywords
}

async function getMuteList(
  pubkey: string,
  pool: SimplePool,
  relays: string[]
): Promise<MuteList> {
  const events = await pool.querySync(relays, {
    kinds: [10000], // Public mute list
    authors: [pubkey],
    limit: 1
  });

  if (events.length === 0) {
    return { pubkeys: [], eventIds: [], hashtags: [], words: [] };
  }

  const event = events[0];
  return {
    pubkeys: event.tags.filter(t => t[0] === 'p').map(t => t[1]),
    eventIds: event.tags.filter(t => t[0] === 'e').map(t => t[1]),
    hashtags: event.tags.filter(t => t[0] === 't').map(t => t[1]),
    words: event.tags.filter(t => t[0] === 'word').map(t => t[1])
  };
}

function isContentMuted(
  event: NostrEvent,
  muteList: MuteList
): boolean {
  // Check author
  if (muteList.pubkeys.includes(event.pubkey)) return true;

  // Check event ID
  if (muteList.eventIds.includes(event.id)) return true;

  // Check hashtags
  const eventHashtags = event.tags
    .filter(t => t[0] === 't')
    .map(t => t[1].toLowerCase());
  if (muteList.hashtags.some(h => eventHashtags.includes(h.toLowerCase()))) {
    return true;
  }

  // Check words
  const content = event.content.toLowerCase();
  if (muteList.words.some(w => content.includes(w.toLowerCase()))) {
    return true;
  }

  return false;
}
```

## Graph Analysis

### Common Follows

```typescript
async function getCommonFollows(
  pubkey1: string,
  pubkey2: string,
  pool: SimplePool,
  relays: string[]
): Promise<string[]> {
  const follows1 = await getFollows(pubkey1, pool, relays);
  const follows2 = await getFollows(pubkey2, pool, relays);

  return Array.from(follows1).filter(f => follows2.has(f));
}
```

### Suggested Follows

```typescript
async function getSuggestedFollows(
  userPubkey: string,
  pool: SimplePool,
  relays: string[],
  limit: number = 20
): Promise<string[]> {
  const userFollows = await getFollows(userPubkey, pool, relays);

  // Count how many of user's follows also follow each person
  const suggestions = new Map<string, number>();

  for (const follow of userFollows) {
    const theirFollows = await getFollows(follow, pool, relays);

    for (const suggested of theirFollows) {
      // Don't suggest people already followed or self
      if (!userFollows.has(suggested) && suggested !== userPubkey) {
        suggestions.set(suggested, (suggestions.get(suggested) || 0) + 1);
      }
    }
  }

  // Sort by frequency and return top suggestions
  return Array.from(suggestions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([pubkey]) => pubkey);
}
```

### Influence Score

```typescript
async function calculateInfluence(
  pubkey: string,
  pool: SimplePool,
  relays: string[],
  depth: number = 2
): Promise<number> {
  const followers = await getFollowers(pubkey, pool, relays);

  if (depth <= 1) {
    return followers.size;
  }

  let influence = followers.size;

  for (const follower of followers) {
    const secondaryFollowers = await getFollowers(follower, pool, relays);
    influence += secondaryFollowers.size * (1 / depth);
  }

  return influence;
}
```

## Graph Caching

### In-Memory Cache

```typescript
class SocialGraphCache {
  private followsCache: Map<string, Set<string>> = new Map();
  private followersCache: Map<string, Set<string>> = new Map();
  private cacheTimestamps: Map<string, number> = new Map();
  private maxAge: number = 5 * 60 * 1000; // 5 minutes

  async getFollows(
    pubkey: string,
    pool: SimplePool,
    relays: string[]
  ): Promise<Set<string>> {
    const cacheKey = `follows:${pubkey}`;
    const cached = this.followsCache.get(pubkey);
    const timestamp = this.cacheTimestamps.get(cacheKey);

    if (cached && timestamp && Date.now() - timestamp < this.maxAge) {
      return cached;
    }

    const follows = await getFollows(pubkey, pool, relays);
    this.followsCache.set(pubkey, follows);
    this.cacheTimestamps.set(cacheKey, Date.now());

    return follows;
  }

  invalidate(pubkey: string) {
    this.followsCache.delete(pubkey);
    this.followersCache.delete(pubkey);
    this.cacheTimestamps.delete(`follows:${pubkey}`);
    this.cacheTimestamps.delete(`followers:${pubkey}`);
  }
}
```

## Proof of Following

Demonstrate follow relationship cryptographically.

```typescript
interface FollowProof {
  follower: string;
  followee: string;
  followListEvent: NostrEvent;
  verified: boolean;
}

async function createFollowProof(
  followerPubkey: string,
  followeePubkey: string,
  pool: SimplePool,
  relays: string[]
): Promise<FollowProof | null> {
  const events = await pool.querySync(relays, {
    kinds: [3],
    authors: [followerPubkey],
    limit: 1
  });

  if (events.length === 0) return null;

  const followListEvent = events[0];
  const hasFollow = followListEvent.tags.some(
    t => t[0] === 'p' && t[1] === followeePubkey
  );

  return {
    follower: followerPubkey,
    followee: followeePubkey,
    followListEvent,
    verified: hasFollow
  };
}
```

## Identity Interoperability

### Linking External Identities

Nostr supports linking to external identity systems via NIP-39.

```typescript
interface IdentityLink {
  platform: string;
  identity: string;
  proof: string;
}

async function getIdentityLinks(
  pubkey: string,
  pool: SimplePool,
  relays: string[]
): Promise<IdentityLink[]> {
  const events = await pool.querySync(relays, {
    kinds: [0],
    authors: [pubkey],
    limit: 1
  });

  if (events.length === 0) return [];

  const profile = JSON.parse(events[0].content);

  // Check for identity claims in profile
  const links: IdentityLink[] = [];

  // GitHub
  if (profile.github) {
    links.push({
      platform: 'github',
      identity: profile.github,
      proof: `https://gist.github.com/${profile.github}`
    });
  }

  // Twitter
  if (profile.twitter) {
    links.push({
      platform: 'twitter',
      identity: profile.twitter,
      proof: '' // Would need to verify tweet
    });
  }

  return links;
}
```

### DID:Nostr

Nostr keys can be expressed as Decentralized Identifiers.

```typescript
function pubkeyToDid(pubkey: string): string {
  return `did:nostr:${pubkey}`;
}

function didToPubkey(did: string): string | null {
  if (!did.startsWith('did:nostr:')) return null;
  return did.slice(10);
}
```

## Best Practices

1. **Cache aggressively** - Follow lists change infrequently
2. **Limit graph depth** - 2-3 degrees is usually sufficient
3. **Use pagination** - Large follower sets can be massive
4. **Consider privacy** - Some users have encrypted follow lists
5. **Handle missing data** - Not all users have follow lists

## See Also

- [Feed Algorithms](./algorithms)
- [Protocol Filters](../protocol/filters)
- [Keys and Signing](../getting-started/keys-and-signing)
