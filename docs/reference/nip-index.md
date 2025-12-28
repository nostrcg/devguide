---
sidebar_position: 2
title: NIP Index
description: Index of all Nostr Implementation Possibilities
---

# NIP Index

Complete index of NIPs (Nostr Implementation Possibilities) with status and key information.

## Core Protocol

| NIP | Title | Status | Summary |
|-----|-------|--------|---------|
| [01](https://github.com/nostr-protocol/nips/blob/master/01.md) | Basic Protocol Flow | Final | Events, subscriptions, filters |
| [02](https://github.com/nostr-protocol/nips/blob/master/02.md) | Follow List | Final | Contact list management |
| [10](https://github.com/nostr-protocol/nips/blob/master/10.md) | Reply Conventions | Final | Threading with e/p tags |
| [18](https://github.com/nostr-protocol/nips/blob/master/18.md) | Reposts | Final | Boosting events |

## Identity

| NIP | Title | Status | Summary |
|-----|-------|--------|---------|
| [05](https://github.com/nostr-protocol/nips/blob/master/05.md) | DNS Identifiers | Final | alice@domain.com verification |
| [19](https://github.com/nostr-protocol/nips/blob/master/19.md) | bech32 Entities | Final | npub, nsec, note encoding |
| [06](https://github.com/nostr-protocol/nips/blob/master/06.md) | Key Derivation | Draft | BIP-39 mnemonic to keys |

## Content

| NIP | Title | Status | Summary |
|-----|-------|--------|---------|
| [23](https://github.com/nostr-protocol/nips/blob/master/23.md) | Long-form Content | Final | Articles, blog posts |
| [30](https://github.com/nostr-protocol/nips/blob/master/30.md) | Custom Emoji | Final | Emoji shortcodes |
| [36](https://github.com/nostr-protocol/nips/blob/master/36.md) | Sensitive Content | Final | Content warnings |
| [92](https://github.com/nostr-protocol/nips/blob/master/92.md) | Media Attachments | Draft | Image/video in events |
| [94](https://github.com/nostr-protocol/nips/blob/master/94.md) | File Metadata | Final | File attachment info |

## Encryption

| NIP | Title | Status | Summary |
|-----|-------|--------|---------|
| [04](https://github.com/nostr-protocol/nips/blob/master/04.md) | Encrypted DMs | Deprecated | Use NIP-44 instead |
| [44](https://github.com/nostr-protocol/nips/blob/master/44.md) | Encryption | Final | Modern encryption standard |
| [59](https://github.com/nostr-protocol/nips/blob/master/59.md) | Gift Wrap | Final | Encrypted event wrapper |

## Social

| NIP | Title | Status | Summary |
|-----|-------|--------|---------|
| [09](https://github.com/nostr-protocol/nips/blob/master/09.md) | Event Deletion | Final | Deletion requests |
| [25](https://github.com/nostr-protocol/nips/blob/master/25.md) | Reactions | Final | Likes, emoji reactions |
| [32](https://github.com/nostr-protocol/nips/blob/master/32.md) | Labeling | Draft | Content labels |
| [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | Lists | Final | Mutes, bookmarks, etc. |
| [56](https://github.com/nostr-protocol/nips/blob/master/56.md) | Reporting | Draft | Report content/users |
| [72](https://github.com/nostr-protocol/nips/blob/master/72.md) | Communities | Draft | Moderated groups |

## Payments

| NIP | Title | Status | Summary |
|-----|-------|--------|---------|
| [47](https://github.com/nostr-protocol/nips/blob/master/47.md) | Wallet Connect | Draft | Wallet connection |
| [57](https://github.com/nostr-protocol/nips/blob/master/57.md) | Zaps | Final | Lightning payments |
| [75](https://github.com/nostr-protocol/nips/blob/master/75.md) | Zap Goals | Draft | Fundraising goals |

## Relay

| NIP | Title | Status | Summary |
|-----|-------|--------|---------|
| [11](https://github.com/nostr-protocol/nips/blob/master/11.md) | Relay Info | Final | Relay metadata doc |
| [42](https://github.com/nostr-protocol/nips/blob/master/42.md) | Auth | Final | Client authentication |
| [45](https://github.com/nostr-protocol/nips/blob/master/45.md) | Event Counts | Draft | COUNT command |
| [50](https://github.com/nostr-protocol/nips/blob/master/50.md) | Search | Draft | Relay search capability |
| [65](https://github.com/nostr-protocol/nips/blob/master/65.md) | Relay List | Final | User's relay preferences |

## Applications

| NIP | Title | Status | Summary |
|-----|-------|--------|---------|
| [07](https://github.com/nostr-protocol/nips/blob/master/07.md) | Browser Extensions | Final | window.nostr interface |
| [46](https://github.com/nostr-protocol/nips/blob/master/46.md) | Nostr Connect | Final | Remote signing |
| [89](https://github.com/nostr-protocol/nips/blob/master/89.md) | App Handlers | Draft | Event handler apps |
| [90](https://github.com/nostr-protocol/nips/blob/master/90.md) | DVMs | Draft | Data Vending Machines |
| [98](https://github.com/nostr-protocol/nips/blob/master/98.md) | HTTP Auth | Draft | HTTP authentication |

## Specialized

| NIP | Title | Status | Summary |
|-----|-------|--------|---------|
| [13](https://github.com/nostr-protocol/nips/blob/master/13.md) | Proof of Work | Draft | PoW for events |
| [15](https://github.com/nostr-protocol/nips/blob/master/15.md) | Marketplace | Draft | E-commerce |
| [26](https://github.com/nostr-protocol/nips/blob/master/26.md) | Delegated Signing | Draft | Delegation tokens |
| [28](https://github.com/nostr-protocol/nips/blob/master/28.md) | Public Chat | Draft | Chat channels |
| [34](https://github.com/nostr-protocol/nips/blob/master/34.md) | Git | Draft | Code collaboration |
| [38](https://github.com/nostr-protocol/nips/blob/master/38.md) | User Statuses | Draft | Online status |
| [52](https://github.com/nostr-protocol/nips/blob/master/52.md) | Calendar | Draft | Events/calendar |
| [53](https://github.com/nostr-protocol/nips/blob/master/53.md) | Live Activities | Draft | Live streaming |
| [58](https://github.com/nostr-protocol/nips/blob/master/58.md) | Badges | Draft | Achievements |
| [78](https://github.com/nostr-protocol/nips/blob/master/78.md) | App Data | Draft | App-specific storage |
| [99](https://github.com/nostr-protocol/nips/blob/master/99.md) | Classifieds | Draft | Classified listings |

## Implementation Priority

### Tier 1: Essential
Must implement for basic functionality:
- NIP-01: Basic protocol
- NIP-02: Follow list
- NIP-10: Threading
- NIP-19: Bech32 encoding

### Tier 2: Recommended
Strongly recommended for good UX:
- NIP-05: Verification
- NIP-07: Browser extensions
- NIP-25: Reactions
- NIP-65: Relay list

### Tier 3: Feature-Dependent
Based on your app's features:
- NIP-57: Zaps (if payments)
- NIP-23: Long-form (if blogging)
- NIP-44/59: Encryption (if DMs)
- NIP-42: Auth (if private relay)

## Resources

- **Official Repository:** [github.com/nostr-protocol/nips](https://github.com/nostr-protocol/nips)
- **NIP Status Tracker:** Check repo for current status
- **Implementation Guide:** [NIP Implementation](../guides/nip-implementation)

## See Also

- [Protocol Overview](../protocol/overview)
- [Event Kinds Reference](./event-kinds)
- [Implementing NIPs](../guides/nip-implementation)
