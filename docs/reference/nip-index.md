---
sidebar_position: 2
title: NIP Index
description: Every NIP in the nostr-protocol/nips repository, with its status badges
---

{/* GENERATED from nostr-protocol/nips README.md at 7b5ea85 (2026-10-21). Do not edit by hand; regenerate. */}

# NIP Index

NIPs are **Nostr Implementation Possibilities**. This page lists every NIP in the
[NIPs README](https://github.com/nostr-protocol/nips/), generated from the repository at commit
`7b5ea85` (2026-10-21). For a short guided tour of the NIPs most apps need, see
[NIPs](../protocol/nips.md).

## How to read the status

Each NIP file starts with badges. The **Status** column copies them.

- `draft` or `final`. Almost every NIP, including NIP-01, is `draft`. Draft NIPs are widely deployed; the label
  means the text can still change.
- `mandatory` or `optional`. Only NIP-01 is `mandatory`.
- `relay` means relays need to do something to support the NIP.
- `unrecommended` (see below).
- A blank status means the NIP file has no badge line.

The README marks some NIPs **unrecommended** and strikes them through. They stay listed so old events can still be read,
but new software should use the replacement named in the reason.

## Unrecommended NIPs

| NIP | Title | Reason |
|---|---|---|
| [03](https://github.com/nostr-protocol/nips/blob/master/03.md) | OpenTimestamps Attestations for Events | vulnerable to one specific attack, needs update |
| [04](https://github.com/nostr-protocol/nips/blob/master/04.md) | Encrypted Direct Message | deprecated in favor of [NIP-17](https://github.com/nostr-protocol/nips/blob/master/17.md) |
| [06](https://github.com/nostr-protocol/nips/blob/master/06.md) | Basic key derivation from mnemonic seed phrase | prefer a single nsec |
| [08](https://github.com/nostr-protocol/nips/blob/master/08.md) | Handling Mentions | deprecated in favor of [NIP-27](https://github.com/nostr-protocol/nips/blob/master/27.md) |
| [15](https://github.com/nostr-protocol/nips/blob/master/15.md) | Nostr Marketplace (for resilient marketplaces) | too complicated, try [99](https://github.com/nostr-protocol/nips/blob/master/99.md) instead |
| [26](https://github.com/nostr-protocol/nips/blob/master/26.md) | Delegated Event Signing | adds unnecessary burden for little gain |
| [28](https://github.com/nostr-protocol/nips/blob/master/28.md) | Public Chat | try [NIP-29](https://github.com/nostr-protocol/nips/blob/master/29.md) instead |
| [31](https://github.com/nostr-protocol/nips/blob/master/31.md) | Dealing with Unknown Events | unnecessarily bloated |
| [72](https://github.com/nostr-protocol/nips/blob/master/72.md) | Moderated Communities | try [NIP-29](https://github.com/nostr-protocol/nips/blob/master/29.md) instead |
| [90](https://github.com/nostr-protocol/nips/blob/master/90.md) | Data Vending Machines | this got totally out of control, prefer use-case-specific microstandards |
| [96](https://github.com/nostr-protocol/nips/blob/master/96.md) | HTTP File Storage Integration | replaced by Blossom |
| [BE](https://github.com/nostr-protocol/nips/blob/master/BE.md) | Nostr BLE Communications Protocol | only implemented once and unclear whether it works, requires review |
| [EE](https://github.com/nostr-protocol/nips/blob/master/EE.md) | E2EE Messaging using MLS Protocol | superseded by the [Marmot Protocol](https://github.com/marmot-protocol/marmot) |

## All NIPs

| NIP | Title | Status |
|---|---|---|
| [01](https://github.com/nostr-protocol/nips/blob/master/01.md) | Basic protocol flow description | `draft` `mandatory` `relay` |
| [02](https://github.com/nostr-protocol/nips/blob/master/02.md) | Follow List | `final` `optional` |
| [03](https://github.com/nostr-protocol/nips/blob/master/03.md) | ~~OpenTimestamps Attestations for Events~~ | `draft` `unrecommended` `optional` |
| [04](https://github.com/nostr-protocol/nips/blob/master/04.md) | ~~Encrypted Direct Message~~ | `final` `unrecommended` `optional` `relay` |
| [05](https://github.com/nostr-protocol/nips/blob/master/05.md) | Mapping Nostr keys to DNS-based internet identifiers | `final` `optional` |
| [06](https://github.com/nostr-protocol/nips/blob/master/06.md) | ~~Basic key derivation from mnemonic seed phrase~~ | `draft` `unrecommended` `optional` |
| [07](https://github.com/nostr-protocol/nips/blob/master/07.md) | `window.nostr` capability for web browsers | `draft` `optional` |
| [08](https://github.com/nostr-protocol/nips/blob/master/08.md) | ~~Handling Mentions~~ | `final` `unrecommended` `optional` |
| [09](https://github.com/nostr-protocol/nips/blob/master/09.md) | Event Deletion Request | `draft` `optional` `relay` |
| [10](https://github.com/nostr-protocol/nips/blob/master/10.md) | Text Notes and Threads | `draft` `optional` |
| [11](https://github.com/nostr-protocol/nips/blob/master/11.md) | Relay Information Document | `draft` `optional` `relay` |
| [13](https://github.com/nostr-protocol/nips/blob/master/13.md) | Proof of Work | `draft` `optional` `relay` |
| [14](https://github.com/nostr-protocol/nips/blob/master/14.md) | Subject tag in text events | `draft` `optional` |
| [15](https://github.com/nostr-protocol/nips/blob/master/15.md) | ~~Nostr Marketplace (for resilient marketplaces)~~ | `draft` `unrecommended` `optional` |
| [17](https://github.com/nostr-protocol/nips/blob/master/17.md) | Private Direct Messages | `draft` `optional` `relay` |
| [18](https://github.com/nostr-protocol/nips/blob/master/18.md) | Reposts | `draft` `optional` |
| [19](https://github.com/nostr-protocol/nips/blob/master/19.md) | bech32-encoded entities | `draft` `optional` |
| [21](https://github.com/nostr-protocol/nips/blob/master/21.md) | `nostr:` URI scheme | `draft` `optional` |
| [22](https://github.com/nostr-protocol/nips/blob/master/22.md) | Comment | `draft` `optional` |
| [23](https://github.com/nostr-protocol/nips/blob/master/23.md) | Long-form Content | `draft` `optional` |
| [24](https://github.com/nostr-protocol/nips/blob/master/24.md) | Extra metadata fields and tags | `draft` `optional` |
| [25](https://github.com/nostr-protocol/nips/blob/master/25.md) | Reactions | `draft` `optional` |
| [26](https://github.com/nostr-protocol/nips/blob/master/26.md) | ~~Delegated Event Signing~~ | `draft` `unrecommended` `optional` `relay` |
| [27](https://github.com/nostr-protocol/nips/blob/master/27.md) | Text Note References | `draft` `optional` |
| [28](https://github.com/nostr-protocol/nips/blob/master/28.md) | ~~Public Chat~~ | `draft` `unrecommended` `optional` |
| [29](https://github.com/nostr-protocol/nips/blob/master/29.md) | Relay-based Groups | `draft` `optional` `relay` |
| [30](https://github.com/nostr-protocol/nips/blob/master/30.md) | Custom Emoji | `draft` `optional` |
| [31](https://github.com/nostr-protocol/nips/blob/master/31.md) | ~~Dealing with Unknown Events~~ | `draft` `unrecommended` `optional` |
| [32](https://github.com/nostr-protocol/nips/blob/master/32.md) | Labeling | `draft` `optional` |
| [34](https://github.com/nostr-protocol/nips/blob/master/34.md) | `git` stuff | `draft` `optional` |
| [35](https://github.com/nostr-protocol/nips/blob/master/35.md) | Torrents | `draft` `optional` |
| [36](https://github.com/nostr-protocol/nips/blob/master/36.md) | Sensitive Content | `draft` `optional` |
| [37](https://github.com/nostr-protocol/nips/blob/master/37.md) | Draft Events | `draft` `optional` |
| [38](https://github.com/nostr-protocol/nips/blob/master/38.md) | User Statuses | `draft` `optional` |
| [39](https://github.com/nostr-protocol/nips/blob/master/39.md) | Linking Profiles to Other Platforms | `draft` `optional` |
| [40](https://github.com/nostr-protocol/nips/blob/master/40.md) | Expiration Timestamp | `draft` `optional` `relay` |
| [42](https://github.com/nostr-protocol/nips/blob/master/42.md) | Authentication of clients to relays | `draft` `optional` `relay` |
| [43](https://github.com/nostr-protocol/nips/blob/master/43.md) | Relay Access Metadata and Requests | `draft` `optional` `relay` |
| [44](https://github.com/nostr-protocol/nips/blob/master/44.md) | Encrypted Payloads (Versioned) | `optional` |
| [45](https://github.com/nostr-protocol/nips/blob/master/45.md) | Counting results | `draft` `optional` `relay` |
| [46](https://github.com/nostr-protocol/nips/blob/master/46.md) | Nostr Remote Signing |  |
| [47](https://github.com/nostr-protocol/nips/blob/master/47.md) | Nostr Wallet Connect | `draft` `optional` |
| [48](https://github.com/nostr-protocol/nips/blob/master/48.md) | Bridged Events | `draft` `optional` |
| [49](https://github.com/nostr-protocol/nips/blob/master/49.md) | Private Key Encryption (`ncryptsec`) | `draft` `optional` |
| [50](https://github.com/nostr-protocol/nips/blob/master/50.md) | Search Capability | `draft` `optional` `relay` |
| [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | Lists | `draft` `optional` |
| [52](https://github.com/nostr-protocol/nips/blob/master/52.md) | Calendar Events | `draft` `optional` |
| [53](https://github.com/nostr-protocol/nips/blob/master/53.md) | Live Streaming and Spaces | `draft` `optional` |
| [54](https://github.com/nostr-protocol/nips/blob/master/54.md) | Wiki | `draft` `optional` |
| [55](https://github.com/nostr-protocol/nips/blob/master/55.md) | Android Signer Application | `draft` `optional` |
| [56](https://github.com/nostr-protocol/nips/blob/master/56.md) | Reporting | `optional` |
| [57](https://github.com/nostr-protocol/nips/blob/master/57.md) | Lightning Zaps | `draft` `optional` |
| [58](https://github.com/nostr-protocol/nips/blob/master/58.md) | Badges | `draft` `optional` |
| [59](https://github.com/nostr-protocol/nips/blob/master/59.md) | Gift Wrap | `optional` `relay` |
| [5A](https://github.com/nostr-protocol/nips/blob/master/5A.md) | Static Websites (nsites) | `draft` `optional` |
| [60](https://github.com/nostr-protocol/nips/blob/master/60.md) | Cashu Wallet | `draft` `optional` |
| [61](https://github.com/nostr-protocol/nips/blob/master/61.md) | Nutzaps | `draft` `optional` |
| [62](https://github.com/nostr-protocol/nips/blob/master/62.md) | Request to Vanish | `draft` `optional` `relay` |
| [64](https://github.com/nostr-protocol/nips/blob/master/64.md) | Chess (PGN) | `draft` `optional` |
| [65](https://github.com/nostr-protocol/nips/blob/master/65.md) | Relay List Metadata | `draft` `optional` |
| [66](https://github.com/nostr-protocol/nips/blob/master/66.md) | Relay Discovery and Liveness Monitoring | `draft` `optional` `relay` |
| [67](https://github.com/nostr-protocol/nips/blob/master/67.md) | EOSE Completeness Hint | `draft` `optional` |
| [68](https://github.com/nostr-protocol/nips/blob/master/68.md) | Picture-first feeds | `draft` `optional` |
| [69](https://github.com/nostr-protocol/nips/blob/master/69.md) | Peer-to-peer Order events | `draft` `optional` |
| [70](https://github.com/nostr-protocol/nips/blob/master/70.md) | Protected Events | `draft` `optional` `relay` |
| [71](https://github.com/nostr-protocol/nips/blob/master/71.md) | Video Events | `draft` `optional` |
| [72](https://github.com/nostr-protocol/nips/blob/master/72.md) | ~~Moderated Communities~~ | `draft` `unrecommended` `optional` |
| [73](https://github.com/nostr-protocol/nips/blob/master/73.md) | External Content IDs | `draft` `optional` |
| [75](https://github.com/nostr-protocol/nips/blob/master/75.md) | Zap Goals | `draft` `optional` |
| [77](https://github.com/nostr-protocol/nips/blob/master/77.md) | Negentropy Syncing | `draft` `optional` `relay` |
| [78](https://github.com/nostr-protocol/nips/blob/master/78.md) | Application-specific data | `draft` `optional` `relay` |
| [7D](https://github.com/nostr-protocol/nips/blob/master/7D.md) | Forum Threads | `draft` `optional` |
| [84](https://github.com/nostr-protocol/nips/blob/master/84.md) | Highlights | `draft` `optional` |
| [85](https://github.com/nostr-protocol/nips/blob/master/85.md) | Trusted Assertions | `draft` `optional` |
| [86](https://github.com/nostr-protocol/nips/blob/master/86.md) | Relay Management API | `draft` `optional` |
| [87](https://github.com/nostr-protocol/nips/blob/master/87.md) | Cashu and Fedimint Discoverability | `draft` `optional` |
| [88](https://github.com/nostr-protocol/nips/blob/master/88.md) | Polls | `draft` `optional` |
| [89](https://github.com/nostr-protocol/nips/blob/master/89.md) | Recommended Application Handlers | `draft` `optional` |
| [90](https://github.com/nostr-protocol/nips/blob/master/90.md) | ~~Data Vending Machines~~ | `draft` `unrecommended` `optional` |
| [92](https://github.com/nostr-protocol/nips/blob/master/92.md) | Media Attachments Metadata (`imeta`) |  |
| [94](https://github.com/nostr-protocol/nips/blob/master/94.md) | File Metadata | `draft` `optional` |
| [96](https://github.com/nostr-protocol/nips/blob/master/96.md) | ~~HTTP File Storage Integration~~ | `draft` `unrecommended` `optional` |
| [98](https://github.com/nostr-protocol/nips/blob/master/98.md) | HTTP Auth | `draft` `optional` |
| [99](https://github.com/nostr-protocol/nips/blob/master/99.md) | Classified Listings | `draft` `optional` |
| [A0](https://github.com/nostr-protocol/nips/blob/master/A0.md) | Voice Messages |  |
| [A4](https://github.com/nostr-protocol/nips/blob/master/A4.md) | Public Messages | `draft` `optional` |
| [B0](https://github.com/nostr-protocol/nips/blob/master/B0.md) | Web Bookmarks | `draft` `optional` |
| [B7](https://github.com/nostr-protocol/nips/blob/master/B7.md) | Blossom | `draft` `optional` |
| [BE](https://github.com/nostr-protocol/nips/blob/master/BE.md) | ~~Nostr BLE Communications Protocol~~ | `draft` `unrecommended` `optional` |
| [C0](https://github.com/nostr-protocol/nips/blob/master/C0.md) | Code Snippets | `draft` `optional` |
| [C7](https://github.com/nostr-protocol/nips/blob/master/C7.md) | Chats | `draft` `optional` |
| [CD](https://github.com/nostr-protocol/nips/blob/master/CD.md) | Slash Commands | `draft` `optional` |
| [A3](https://github.com/nostr-protocol/nips/blob/master/A3.md) | payto: Payment Targets | `draft` `optional` |
| [CC](https://github.com/nostr-protocol/nips/blob/master/CC.md) | Geocaching | `draft` `optional` |
| [EE](https://github.com/nostr-protocol/nips/blob/master/EE.md) | ~~E2EE Messaging using MLS Protocol~~ | `final` `unrecommended` `optional` |
| [F4](https://github.com/nostr-protocol/nips/blob/master/F4.md) | Podcasts | `draft` `optional` |

The list follows the order of the README. Message types (`EVENT`, `REQ`, `CLOSE`, `AUTH`, `COUNT`, `OK`, `EOSE`,
`CLOSED`, `NOTICE`) are covered in [Relay Communication](../protocol/relay-communication.md).

Offline, `nak nip` lists the NIPs and `nak nip 44` prints one.
