---
sidebar_position: 1
title: Event Kinds Reference
description: Complete reference of Nostr event kinds
---

# Event Kinds Reference

This page provides a comprehensive reference of all standardized Nostr event kinds.

## Kind Ranges

| Range | Category | Behavior |
|-------|----------|----------|
| 0-999 | Regular | All events stored |
| 1000-9999 | Regular | All events stored |
| 10000-19999 | Replaceable | Only latest kept per pubkey |
| 20000-29999 | Ephemeral | Not stored by relays |
| 30000-39999 | Parameterized Replaceable | Latest kept per pubkey+d-tag |
| 40000-49999 | Reserved | Future use |

## Core Kinds (0-999)

| Kind | Name | NIP | Description |
|------|------|-----|-------------|
| 0 | Metadata | 1 | User profile (name, about, picture) |
| 1 | Short Text Note | 1 | Basic text post |
| 2 | Recommend Relay | 1 | Relay recommendation (deprecated) |
| 3 | Follows | 2 | Contact/follow list |
| 4 | Encrypted Direct Message | 4 | DM (deprecated, use NIP-44) |
| 5 | Event Deletion | 9 | Request to delete events |
| 6 | Repost | 18 | Repost/boost |
| 7 | Reaction | 25 | Like, emoji reaction |
| 8 | Badge Award | 58 | Award a badge |
| 16 | Generic Repost | 18 | Repost of any event kind |
| 40 | Channel Creation | 28 | Create public chat channel |
| 41 | Channel Metadata | 28 | Update channel metadata |
| 42 | Channel Message | 28 | Message in channel |
| 43 | Channel Hide Message | 28 | Hide channel message |
| 44 | Channel Mute User | 28 | Mute user in channel |

## Regular Kinds (1000-9999)

| Kind | Name | NIP | Description |
|------|------|-----|-------------|
| 1021 | Bid | 15 | Auction bid |
| 1022 | Bid Confirmation | 15 | Confirm auction bid |
| 1040 | OpenTimestamps | 03 | Timestamp attestation |
| 1059 | Gift Wrap | 59 | Encrypted event wrapper |
| 1063 | File Metadata | 94 | File/media metadata |
| 1311 | Live Chat Message | 53 | Live stream chat |
| 1617 | Patches | 34 | Code patches |
| 1621 | Issues | 34 | Issue tracking |
| 1622 | Replies | 34 | Issue replies |
| 1971 | Problem Tracker | 34 | Problem definition |
| 1984 | Reporting | 56 | Report users/content |
| 1985 | Label | 32 | Content labeling |
| 4550 | Community Post Approval | 72 | Mod approval |
| 5000-5999 | Job Request | 90 | DVMs job request |
| 6000-6999 | Job Result | 90 | DVMs job result |
| 7000 | Job Feedback | 90 | DVMs feedback |
| 9041 | Zap Goal | 75 | Fundraising goal |
| 9734 | Zap Request | 57 | Zap request |
| 9735 | Zap | 57 | Zap receipt |

## Replaceable Kinds (10000-19999)

| Kind | Name | NIP | Description |
|------|------|-----|-------------|
| 10000 | Mute List | 51 | Muted users/threads |
| 10001 | Pin List | 51 | Pinned notes |
| 10002 | Relay List Metadata | 65 | User's relay preferences |
| 10003 | Bookmark List | 51 | Bookmarked events |
| 10004 | Communities List | 51 | Joined communities |
| 10005 | Public Chats List | 51 | Joined chat channels |
| 10006 | Blocked Relays List | 51 | Blocked relay URLs |
| 10007 | Search Relays List | 51 | Preferred search relays |
| 10015 | Interests List | 51 | User interests |
| 10030 | User Emoji List | 51 | Custom emoji |
| 10050 | DM Relay List | 17 | Preferred DM relays |
| 10096 | File Storage Servers | 96 | File storage preferences |
| 13194 | Wallet Info | 47 | Wallet metadata |

## Ephemeral Kinds (20000-29999)

| Kind | Name | NIP | Description |
|------|------|-----|-------------|
| 20001 | Typing Indicator | - | User typing status |
| 21000 | Ephemeral Event | - | Generic ephemeral |
| 22242 | Client Authentication | 42 | Relay auth event |
| 24133 | Nostr Connect | 46 | Remote signing |
| 27235 | HTTP Auth | 98 | HTTP authentication |

## Parameterized Replaceable Kinds (30000-39999)

| Kind | Name | NIP | Description |
|------|------|-----|-------------|
| 30000 | Follow Sets | 51 | Named follow lists |
| 30001 | Generic Lists | 51 | Custom lists |
| 30002 | Relay Sets | 51 | Named relay lists |
| 30003 | Bookmark Sets | 51 | Bookmark categories |
| 30004 | Curation Sets | 51 | Curated content |
| 30008 | Profile Badges | 58 | Displayed badges |
| 30009 | Badge Definition | 58 | Define a badge |
| 30015 | Interest Sets | 51 | Interest categories |
| 30017 | Stall | 15 | Marketplace stall |
| 30018 | Product | 15 | Marketplace product |
| 30023 | Long-form Content | 23 | Articles, blogs |
| 30024 | Draft Long-form | 23 | Unpublished drafts |
| 30030 | Emoji Sets | 51 | Emoji collections |
| 30078 | Application-specific Data | 78 | App settings |
| 30311 | Live Event | 53 | Live stream |
| 30315 | User Statuses | 38 | Online status |
| 30402 | Classified Listing | 99 | Classifieds |
| 30617 | Repository Announcement | 34 | Git repository |
| 31922 | Date Calendar Event | 52 | Date-based event |
| 31923 | Time Calendar Event | 52 | Time-based event |
| 31924 | Calendar | 52 | Calendar definition |
| 31925 | Calendar RSVP | 52 | RSVP response |
| 31989 | Handler Recommendation | 89 | App recommendations |
| 31990 | Handler Information | 89 | App handler info |
| 34550 | Community Definition | 72 | Define community |

## Usage Examples

### Kind 0: Metadata

```json
{
  "kind": 0,
  "content": "{\"name\":\"alice\",\"about\":\"Developer\",\"picture\":\"https://...\"}"
}
```

### Kind 1: Text Note

```json
{
  "kind": 1,
  "content": "Hello, Nostr!",
  "tags": [["t", "nostr"]]
}
```

### Kind 3: Follows

```json
{
  "kind": 3,
  "content": "{\"wss://relay.example.com\":{}}",
  "tags": [["p", "pubkey1"], ["p", "pubkey2"]]
}
```

### Kind 7: Reaction

```json
{
  "kind": 7,
  "content": "+",
  "tags": [["e", "event-id"], ["p", "author-pubkey"]]
}
```

### Kind 30023: Long-form

```json
{
  "kind": 30023,
  "content": "# My Article\n\nContent...",
  "tags": [
    ["d", "article-slug"],
    ["title", "My Article"],
    ["published_at", "1700000000"]
  ]
}
```

## See Also

- [Events in Detail](../protocol/events)
- [NIPs Reference](./nip-index)
- [Filters](../protocol/filters)
