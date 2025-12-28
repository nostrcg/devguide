---
sidebar_position: 6
title: Feed Algorithms
description: Implementing sorting and ranking algorithms for Nostr feeds
---

# Feed Algorithms

Strategies for sorting, ranking, and filtering Nostr events to create engaging feeds.

## Chronological Sorting

The simplest approach - sort by `created_at` timestamp.

```typescript
function sortChronological(events: NostrEvent[]): NostrEvent[] {
  return events.sort((a, b) => b.created_at - a.created_at);
}
```

### Pros and Cons

| Pros | Cons |
|------|------|
| Simple to implement | Spam can dominate |
| Predictable for users | No quality signal |
| No bias introduced | Popular content buried |

## Engagement-Based Ranking

Weight events by reactions and reposts.

### Reaction Counting

```typescript
interface EngagementScore {
  eventId: string;
  likes: number;
  reposts: number;
  replies: number;
  zaps: number;
  zapAmount: number;
}

async function getEngagement(
  eventId: string,
  relay: string
): Promise<EngagementScore> {
  const pool = new SimplePool();

  // Fetch reactions (kind 7)
  const reactions = await pool.querySync([relay], {
    kinds: [7],
    '#e': [eventId]
  });

  // Fetch reposts (kind 6)
  const reposts = await pool.querySync([relay], {
    kinds: [6],
    '#e': [eventId]
  });

  // Fetch replies (kind 1 referencing this event)
  const replies = await pool.querySync([relay], {
    kinds: [1],
    '#e': [eventId]
  });

  // Fetch zaps (kind 9735)
  const zaps = await pool.querySync([relay], {
    kinds: [9735],
    '#e': [eventId]
  });

  const zapAmount = zaps.reduce((sum, zap) => {
    const bolt11 = zap.tags.find(t => t[0] === 'bolt11')?.[1];
    // Parse amount from bolt11 invoice
    return sum + parseZapAmount(bolt11);
  }, 0);

  return {
    eventId,
    likes: reactions.filter(r => r.content === '+' || r.content === '').length,
    reposts: reposts.length,
    replies: replies.length,
    zaps: zaps.length,
    zapAmount
  };
}
```

### Weighted Scoring

```typescript
function calculateScore(engagement: EngagementScore): number {
  const weights = {
    like: 1,
    repost: 3,
    reply: 5,
    zap: 10,
    zapSats: 0.001  // Per sat
  };

  return (
    engagement.likes * weights.like +
    engagement.reposts * weights.repost +
    engagement.replies * weights.reply +
    engagement.zaps * weights.zap +
    engagement.zapAmount * weights.zapSats
  );
}
```

## Time Decay Algorithms

Balance recency with engagement.

### Hacker News Style

```typescript
function hackerNewsScore(
  engagement: number,
  ageHours: number,
  gravity: number = 1.8
): number {
  return engagement / Math.pow(ageHours + 2, gravity);
}

function rankEvents(events: NostrEvent[]): NostrEvent[] {
  const now = Math.floor(Date.now() / 1000);

  return events
    .map(event => {
      const ageHours = (now - event.created_at) / 3600;
      const engagement = getEngagementSync(event.id);
      const score = hackerNewsScore(engagement, ageHours);
      return { event, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.event);
}
```

### Reddit Hot Algorithm

```typescript
function redditHotScore(
  ups: number,
  downs: number,
  created_at: number
): number {
  const score = ups - downs;
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const seconds = created_at - 1134028003; // Reddit epoch

  return sign * order + seconds / 45000;
}
```

## Web of Trust Scoring

Weight content by social graph distance.

### Follow Graph Distance

```typescript
async function getFollowDistance(
  userPubkey: string,
  authorPubkey: string,
  pool: SimplePool,
  relays: string[]
): Promise<number> {
  if (userPubkey === authorPubkey) return 0;

  // Get user's follows
  const userFollows = await getFollows(userPubkey, pool, relays);
  if (userFollows.has(authorPubkey)) return 1;

  // Check follows of follows
  for (const follow of userFollows) {
    const secondDegree = await getFollows(follow, pool, relays);
    if (secondDegree.has(authorPubkey)) return 2;
  }

  return Infinity;
}

function wotScore(
  engagement: number,
  distance: number
): number {
  const distanceWeight = {
    0: 10,   // Self
    1: 5,    // Direct follow
    2: 2,    // Follow of follow
    Infinity: 0.5  // Unknown
  };

  return engagement * (distanceWeight[distance] || 0.5);
}
```

### PageRank-Style Scoring

```typescript
function calculatePageRank(
  followGraph: Map<string, Set<string>>,
  iterations: number = 20,
  dampingFactor: number = 0.85
): Map<string, number> {
  const nodes = Array.from(followGraph.keys());
  const n = nodes.length;
  let ranks = new Map<string, number>();

  // Initialize with equal rank
  nodes.forEach(node => ranks.set(node, 1 / n));

  for (let i = 0; i < iterations; i++) {
    const newRanks = new Map<string, number>();

    for (const node of nodes) {
      let rank = (1 - dampingFactor) / n;

      // Sum contributions from followers
      for (const [follower, following] of followGraph) {
        if (following.has(node)) {
          rank += dampingFactor * (ranks.get(follower)! / following.size);
        }
      }

      newRanks.set(node, rank);
    }

    ranks = newRanks;
  }

  return ranks;
}
```

## Trending Detection

Find content gaining traction quickly.

### Velocity-Based Trending

```typescript
interface TrendingEvent {
  event: NostrEvent;
  velocity: number;
  acceleration: number;
}

function calculateVelocity(
  engagementHistory: number[], // Engagement counts per hour
  windowHours: number = 6
): number {
  const recent = engagementHistory.slice(-windowHours);
  const older = engagementHistory.slice(-windowHours * 2, -windowHours);

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length || 1;

  return recentAvg / olderAvg;
}

function findTrending(
  events: NostrEvent[],
  engagementData: Map<string, number[]>
): TrendingEvent[] {
  return events
    .map(event => {
      const history = engagementData.get(event.id) || [];
      const velocity = calculateVelocity(history);
      const acceleration = calculateAcceleration(history);
      return { event, velocity, acceleration };
    })
    .filter(item => item.velocity > 1.5) // Growing 50%+ faster
    .sort((a, b) => b.velocity - a.velocity);
}
```

## Personalization

Tailor feeds to user interests.

### Topic Classification

```typescript
const TOPIC_KEYWORDS: Record<string, string[]> = {
  bitcoin: ['bitcoin', 'btc', 'sats', 'lightning', 'ln', 'hodl'],
  dev: ['code', 'programming', 'rust', 'javascript', 'github', 'api'],
  art: ['art', 'drawing', 'painting', 'nft', 'creative'],
  music: ['music', 'song', 'album', 'spotify', 'soundcloud'],
};

function classifyEvent(event: NostrEvent): string[] {
  const content = event.content.toLowerCase();
  const topics: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => content.includes(kw))) {
      topics.push(topic);
    }
  }

  return topics;
}

function personalizedScore(
  event: NostrEvent,
  userInterests: Map<string, number>
): number {
  const topics = classifyEvent(event);
  let interestBoost = 0;

  for (const topic of topics) {
    interestBoost += userInterests.get(topic) || 0;
  }

  return interestBoost;
}
```

### Learning User Preferences

```typescript
class UserPreferenceLearner {
  private interactions: Map<string, number> = new Map();

  recordInteraction(topic: string, weight: number = 1) {
    const current = this.interactions.get(topic) || 0;
    this.interactions.set(topic, current + weight);
  }

  recordLike(event: NostrEvent) {
    classifyEvent(event).forEach(topic =>
      this.recordInteraction(topic, 1)
    );
  }

  recordZap(event: NostrEvent, amount: number) {
    classifyEvent(event).forEach(topic =>
      this.recordInteraction(topic, Math.log10(amount + 1))
    );
  }

  getPreferences(): Map<string, number> {
    const total = Array.from(this.interactions.values())
      .reduce((a, b) => a + b, 0) || 1;

    const normalized = new Map<string, number>();
    this.interactions.forEach((count, topic) => {
      normalized.set(topic, count / total);
    });

    return normalized;
  }
}
```

## Spam Filtering

Reduce noise in feeds.

### Simple Heuristics

```typescript
function isLikelySpam(event: NostrEvent): boolean {
  const content = event.content;

  // Too many URLs
  const urlCount = (content.match(/https?:\/\//g) || []).length;
  if (urlCount > 3) return true;

  // All caps
  if (content === content.toUpperCase() && content.length > 20) return true;

  // Repeated characters
  if (/(.)\1{10,}/.test(content)) return true;

  // Too many hashtags
  const hashtagCount = (content.match(/#\w+/g) || []).length;
  if (hashtagCount > 10) return true;

  return false;
}
```

### Proof of Work Filter

```typescript
function hasProofOfWork(event: NostrEvent, minBits: number = 20): boolean {
  const nonceTag = event.tags.find(t => t[0] === 'nonce');
  if (!nonceTag) return false;

  const targetBits = parseInt(nonceTag[2] || '0');
  if (targetBits < minBits) return false;

  // Verify the work
  const leadingZeros = countLeadingZeroBits(event.id);
  return leadingZeros >= minBits;
}

function countLeadingZeroBits(hex: string): number {
  let bits = 0;
  for (const char of hex) {
    const nibble = parseInt(char, 16);
    if (nibble === 0) {
      bits += 4;
    } else {
      bits += Math.clz32(nibble) - 28;
      break;
    }
  }
  return bits;
}
```

## Complete Feed Implementation

```typescript
interface FeedConfig {
  algorithm: 'chronological' | 'engagement' | 'wot' | 'trending';
  includeReplies: boolean;
  includeReposts: boolean;
  spamFilter: boolean;
  timeWindow: number; // hours
}

async function buildFeed(
  userPubkey: string,
  config: FeedConfig,
  pool: SimplePool,
  relays: string[]
): Promise<NostrEvent[]> {
  // Get user's follows
  const follows = await getFollows(userPubkey, pool, relays);

  // Fetch events
  const since = Math.floor(Date.now() / 1000) - config.timeWindow * 3600;
  let events = await pool.querySync(relays, {
    kinds: config.includeReposts ? [1, 6] : [1],
    authors: Array.from(follows),
    since
  });

  // Filter replies if needed
  if (!config.includeReplies) {
    events = events.filter(e =>
      !e.tags.some(t => t[0] === 'e' && t[3] === 'reply')
    );
  }

  // Spam filter
  if (config.spamFilter) {
    events = events.filter(e => !isLikelySpam(e));
  }

  // Apply algorithm
  switch (config.algorithm) {
    case 'chronological':
      return sortChronological(events);
    case 'engagement':
      return await sortByEngagement(events, pool, relays);
    case 'wot':
      return await sortByWoT(events, userPubkey, pool, relays);
    case 'trending':
      return await sortByTrending(events, pool, relays);
  }
}
```

## See Also

- [Social Graph](./social-graph)
- [Building Clients](./building-clients)
- [Protocol Filters](../protocol/filters)
