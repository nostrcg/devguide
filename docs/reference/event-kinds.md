---
sidebar_position: 1
title: Event Kinds Reference
description: Every event kind listed in the NIPs README, with its NIP-01 storage type
---

{/* GENERATED from nostr-protocol/nips README.md at 7b5ea85 (2026-10-21). Do not edit by hand; regenerate. */}

# Event Kinds Reference

This table lists every kind in the [NIPs README](https://github.com/nostr-protocol/nips/#event-kinds),
generated from the NIPs repository at commit `7b5ea85` (2026-10-21). The README itself says the table
is not exhaustive. For a machine-readable list of all known kinds, use the
[registry-of-kinds](https://github.com/nostr-protocol/registry-of-kinds).

For what kinds are and how to pick one, see [Event Kinds](../protocol/kinds.md).

## Kind ranges

[NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) defines how relays store each kind. The **Type** column below applies these rules.

| Kinds | Type | Relays keep |
|---|---|---|
| `1`, `2`, `4`–`44`, `1000`–`9999` | regular | every event |
| `0`, `3`, `10000`–`19999` | replaceable | the latest event per `pubkey` + `kind` |
| `20000`–`29999` | ephemeral | nothing (forwarded to live subscribers only) |
| `30000`–`39999` | addressable | the latest event per `kind` + `pubkey` + `d` tag |

Kinds `45`–`999` and `40000`–`65535` have no storage rule in NIP-01. How relays store them is up to each relay.

:::caution
Rows marked **unrecommended NIP** come from NIPs that the NIPs README marks as unrecommended.
Rows marked **deprecated** are marked so in the README. Don't build new features on them.
See the [NIP Index](nip-index.md) for the reasons.
:::

## All kinds

| Kind | Description | NIP | Type | Note |
|---|---|---|---|---|
| `0` | User Metadata | [01](https://github.com/nostr-protocol/nips/blob/master/01.md) | replaceable |  |
| `1` | Short Text Note | [10](https://github.com/nostr-protocol/nips/blob/master/10.md) | regular |  |
| `3` | Follows | [02](https://github.com/nostr-protocol/nips/blob/master/02.md) | replaceable |  |
| `4` | Encrypted Direct Messages | [04](https://github.com/nostr-protocol/nips/blob/master/04.md) | regular | ⚠️ unrecommended NIP |
| `5` | Event Deletion Request | [09](https://github.com/nostr-protocol/nips/blob/master/09.md) | regular |  |
| `6` | Repost | [18](https://github.com/nostr-protocol/nips/blob/master/18.md) | regular |  |
| `7` | Reaction | [25](https://github.com/nostr-protocol/nips/blob/master/25.md) | regular |  |
| `8` | Badge Award | [58](https://github.com/nostr-protocol/nips/blob/master/58.md) | regular |  |
| `9` | Chat Message | [C7](https://github.com/nostr-protocol/nips/blob/master/C7.md) | regular |  |
| `11` | Thread | [7D](https://github.com/nostr-protocol/nips/blob/master/7D.md) | regular |  |
| `13` | Seal | [59](https://github.com/nostr-protocol/nips/blob/master/59.md) | regular |  |
| `14` | Direct Message | [17](https://github.com/nostr-protocol/nips/blob/master/17.md) | regular |  |
| `15` | File Message | [17](https://github.com/nostr-protocol/nips/blob/master/17.md) | regular |  |
| `16` | Generic Repost | [18](https://github.com/nostr-protocol/nips/blob/master/18.md) | regular |  |
| `17` | Reaction to a website | [25](https://github.com/nostr-protocol/nips/blob/master/25.md) | regular |  |
| `20` | Picture | [68](https://github.com/nostr-protocol/nips/blob/master/68.md) | regular |  |
| `21` | Video Event | [71](https://github.com/nostr-protocol/nips/blob/master/71.md) | regular |  |
| `22` | Short-form Portrait Video Event | [71](https://github.com/nostr-protocol/nips/blob/master/71.md) | regular |  |
| `24` | Public Message | [A4](https://github.com/nostr-protocol/nips/blob/master/A4.md) | regular |  |
| `30` | internal reference | NKBIP-03 | regular |  |
| `31` | external web reference | NKBIP-03 | regular |  |
| `32` | hardcopy reference | NKBIP-03 | regular |  |
| `33` | prompt reference | NKBIP-03 | regular |  |
| `40` | Channel Creation | [28](https://github.com/nostr-protocol/nips/blob/master/28.md) | regular | ⚠️ unrecommended NIP |
| `41` | Channel Metadata | [28](https://github.com/nostr-protocol/nips/blob/master/28.md) | regular | ⚠️ unrecommended NIP |
| `42` | Channel Message | [28](https://github.com/nostr-protocol/nips/blob/master/28.md) | regular | ⚠️ unrecommended NIP |
| `43` | Channel Hide Message | [28](https://github.com/nostr-protocol/nips/blob/master/28.md) | regular | ⚠️ unrecommended NIP |
| `44` | Channel Mute User | [28](https://github.com/nostr-protocol/nips/blob/master/28.md) | regular | ⚠️ unrecommended NIP |
| `54` | Podcast Episode | [F4](https://github.com/nostr-protocol/nips/blob/master/F4.md) | not defined |  |
| `62` | Request to Vanish | [62](https://github.com/nostr-protocol/nips/blob/master/62.md) | not defined |  |
| `64` | Chess (PGN) | [64](https://github.com/nostr-protocol/nips/blob/master/64.md) | not defined |  |
| `78` | Application-specific Data | [78](https://github.com/nostr-protocol/nips/blob/master/78.md) | not defined |  |
| `443` | KeyPackage | [Marmot](https://github.com/marmot-protocol/marmot) | not defined |  |
| `444` | Welcome Message | [Marmot](https://github.com/marmot-protocol/marmot) | not defined |  |
| `445` | Group Event | [Marmot](https://github.com/marmot-protocol/marmot) | not defined |  |
| `818` | Merge Requests | [54](https://github.com/nostr-protocol/nips/blob/master/54.md) | not defined |  |
| `1018` | Poll Response | [88](https://github.com/nostr-protocol/nips/blob/master/88.md) | regular |  |
| `1021` | Bid | [15](https://github.com/nostr-protocol/nips/blob/master/15.md) | regular | ⚠️ unrecommended NIP |
| `1022` | Bid confirmation | [15](https://github.com/nostr-protocol/nips/blob/master/15.md) | regular | ⚠️ unrecommended NIP |
| `1040` | OpenTimestamps | [03](https://github.com/nostr-protocol/nips/blob/master/03.md) | regular | ⚠️ unrecommended NIP |
| `1059` | Gift Wrap | [59](https://github.com/nostr-protocol/nips/blob/master/59.md) | regular |  |
| `1063` | File Metadata | [94](https://github.com/nostr-protocol/nips/blob/master/94.md) | regular |  |
| `1068` | Poll | [88](https://github.com/nostr-protocol/nips/blob/master/88.md) | regular |  |
| `1111` | Comment | [22](https://github.com/nostr-protocol/nips/blob/master/22.md) | regular |  |
| `1222` | Voice Message | [A0](https://github.com/nostr-protocol/nips/blob/master/A0.md) | regular |  |
| `1234` | Draft Checkpoint | [37](https://github.com/nostr-protocol/nips/blob/master/37.md) | regular |  |
| `1244` | Voice Message Comment | [A0](https://github.com/nostr-protocol/nips/blob/master/A0.md) | regular |  |
| `1311` | Live Chat Message | [53](https://github.com/nostr-protocol/nips/blob/master/53.md) | regular |  |
| `1337` | Code Snippet | [C0](https://github.com/nostr-protocol/nips/blob/master/C0.md) | regular |  |
| `1617` | Patches | [34](https://github.com/nostr-protocol/nips/blob/master/34.md) | regular |  |
| `1618` | Pull Requests | [34](https://github.com/nostr-protocol/nips/blob/master/34.md) | regular |  |
| `1619` | Pull Request Updates | [34](https://github.com/nostr-protocol/nips/blob/master/34.md) | regular |  |
| `1621` | Issues | [34](https://github.com/nostr-protocol/nips/blob/master/34.md) | regular |  |
| `1622` | Git Replies (deprecated) | [34](https://github.com/nostr-protocol/nips/blob/master/34.md) | regular |  |
| `1630`-`1633` | Status | [34](https://github.com/nostr-protocol/nips/blob/master/34.md) | regular |  |
| `1971` | Problem Tracker | [nostrocket](https://github.com/nostrocket/NIPS/blob/main/Problems.md) | regular |  |
| `1984` | Reporting | [56](https://github.com/nostr-protocol/nips/blob/master/56.md) | regular |  |
| `1985` | Label | [32](https://github.com/nostr-protocol/nips/blob/master/32.md) | regular |  |
| `1987` | AI Embeddings / Vector lists | NKBIP-02 | regular |  |
| `2003` | Torrent | [35](https://github.com/nostr-protocol/nips/blob/master/35.md) | regular |  |
| `2004` | Torrent Comment | [35](https://github.com/nostr-protocol/nips/blob/master/35.md) | regular |  |
| `2022` | Coinjoin Pool | [joinstr](https://gitlab.com/1440000bytes/joinstr/-/blob/main/NIP.md) | regular |  |
| `4550` | Community Post Approval | [72](https://github.com/nostr-protocol/nips/blob/master/72.md) | regular | ⚠️ unrecommended NIP |
| `5128` | nsite manifest snapshot | [5A](https://github.com/nostr-protocol/nips/blob/master/5A.md) | regular |  |
| `7374` | Reserved Cashu Wallet Tokens | [60](https://github.com/nostr-protocol/nips/blob/master/60.md) | regular |  |
| `7375` | Cashu Wallet Tokens | [60](https://github.com/nostr-protocol/nips/blob/master/60.md) | regular |  |
| `7376` | Cashu Wallet History | [60](https://github.com/nostr-protocol/nips/blob/master/60.md) | regular |  |
| `7516` | Geocache log | [CC](https://github.com/nostr-protocol/nips/blob/master/CC.md) | regular |  |
| `7517` | Geocache proof of find | [CC](https://github.com/nostr-protocol/nips/blob/master/CC.md) | regular |  |
| `8000` | Add User | [43](https://github.com/nostr-protocol/nips/blob/master/43.md) | regular |  |
| `8001` | Remove User | [43](https://github.com/nostr-protocol/nips/blob/master/43.md) | regular |  |
| `9000`-`9030` | Group Control Events | [29](https://github.com/nostr-protocol/nips/blob/master/29.md) | regular |  |
| `9041` | Zap Goal | [75](https://github.com/nostr-protocol/nips/blob/master/75.md) | regular |  |
| `9321` | Nutzap | [61](https://github.com/nostr-protocol/nips/blob/master/61.md) | regular |  |
| `9734` | Zap Request | [57](https://github.com/nostr-protocol/nips/blob/master/57.md) | regular |  |
| `9735` | Zap | [57](https://github.com/nostr-protocol/nips/blob/master/57.md) | regular |  |
| `9802` | Highlights | [84](https://github.com/nostr-protocol/nips/blob/master/84.md) | regular |  |
| `10000` | Mute list | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | replaceable |  |
| `10001` | Pin list | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | replaceable |  |
| `10002` | Relay List Metadata | [65](https://github.com/nostr-protocol/nips/blob/master/65.md), [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | replaceable |  |
| `10003` | Bookmark list | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | replaceable |  |
| `10004` | Communities list | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | replaceable |  |
| `10005` | Public chats list | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | replaceable |  |
| `10006` | Blocked relays list | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | replaceable |  |
| `10007` | Search relays list | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | replaceable |  |
| `10008` | Profile Badges | [51](https://github.com/nostr-protocol/nips/blob/master/51.md), [58](https://github.com/nostr-protocol/nips/blob/master/58.md) | replaceable |  |
| `10009` | User groups | [51](https://github.com/nostr-protocol/nips/blob/master/51.md), [29](https://github.com/nostr-protocol/nips/blob/master/29.md) | replaceable |  |
| `10011` | External Identities | [39](https://github.com/nostr-protocol/nips/blob/master/39.md) | replaceable |  |
| `10012` | Favorite relays list | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | replaceable |  |
| `10013` | Private event relay list | [37](https://github.com/nostr-protocol/nips/blob/master/37.md) | replaceable |  |
| `10015` | Interests list | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | replaceable |  |
| `10019` | Nutzap Mint Recommendation | [61](https://github.com/nostr-protocol/nips/blob/master/61.md) | replaceable |  |
| `10020` | Media follows | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | replaceable |  |
| `10021` | Favorite follow sets | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | replaceable |  |
| `10030` | User emoji list | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | replaceable |  |
| `10040` | Trusted Service Providers | [85](https://github.com/nostr-protocol/nips/blob/master/85.md) | replaceable |  |
| `10050` | Relay list to receive DMs | [51](https://github.com/nostr-protocol/nips/blob/master/51.md), [17](https://github.com/nostr-protocol/nips/blob/master/17.md) | replaceable |  |
| `10051` | KeyPackage Relays List | [Marmot](https://github.com/marmot-protocol/marmot) | replaceable |  |
| `10054` | Favorite podcasts list | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | replaceable |  |
| `10063` | User server list | [B7](https://github.com/nostr-protocol/nips/blob/master/B7.md) | replaceable |  |
| `10064` | Authored podcasts list | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | replaceable |  |
| `10096` | File storage server list | [96](https://github.com/nostr-protocol/nips/blob/master/96.md) (deprecated) | replaceable | ⚠️ deprecated |
| `10133` | Payment Targets | [A3](https://github.com/nostr-protocol/nips/blob/master/A3.md) | replaceable |  |
| `10154` | Podcast Metadata | [F4](https://github.com/nostr-protocol/nips/blob/master/F4.md) | replaceable |  |
| `10166` | Relay Monitor Announcement | [66](https://github.com/nostr-protocol/nips/blob/master/66.md) | replaceable |  |
| `10312` | Room Presence | [53](https://github.com/nostr-protocol/nips/blob/master/53.md) | replaceable |  |
| `13194` | Wallet Info | [47](https://github.com/nostr-protocol/nips/blob/master/47.md) | replaceable |  |
| `13534` | Membership Lists | [43](https://github.com/nostr-protocol/nips/blob/master/43.md) | replaceable |  |
| `15128` | Root nsite manifest | [5A](https://github.com/nostr-protocol/nips/blob/master/5A.md) | replaceable |  |
| `17375` | Cashu Wallet Event | [60](https://github.com/nostr-protocol/nips/blob/master/60.md) | replaceable |  |
| `21059` | Ephemeral Gift Wrap | [59](https://github.com/nostr-protocol/nips/blob/master/59.md) | ephemeral |  |
| `22242` | Client Authentication | [42](https://github.com/nostr-protocol/nips/blob/master/42.md) | ephemeral |  |
| `23194` | Wallet Request | [47](https://github.com/nostr-protocol/nips/blob/master/47.md) | ephemeral |  |
| `23195` | Wallet Response | [47](https://github.com/nostr-protocol/nips/blob/master/47.md) | ephemeral |  |
| `24133` | Nostr Connect | [46](https://github.com/nostr-protocol/nips/blob/master/46.md) | ephemeral |  |
| `24242` | Blobs stored on mediaservers | [B7](https://github.com/nostr-protocol/nips/blob/master/B7.md) | ephemeral |  |
| `27235` | HTTP Auth | [98](https://github.com/nostr-protocol/nips/blob/master/98.md) | ephemeral |  |
| `28934` | Join Request | [43](https://github.com/nostr-protocol/nips/blob/master/43.md) | ephemeral |  |
| `28935` | Invite Request | [43](https://github.com/nostr-protocol/nips/blob/master/43.md) | ephemeral |  |
| `28936` | Leave Request | [43](https://github.com/nostr-protocol/nips/blob/master/43.md) | ephemeral |  |
| `30000` | Follow sets | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | addressable |  |
| `30002` | Relay sets | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | addressable |  |
| `30003` | Bookmark sets | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | addressable |  |
| `30004` | Curation sets | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | addressable |  |
| `30005` | Video sets | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | addressable |  |
| `30006` | Picture sets | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | addressable |  |
| `30007` | Kind mute sets | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | addressable |  |
| `30008` | Badge sets | [51](https://github.com/nostr-protocol/nips/blob/master/51.md), [58](https://github.com/nostr-protocol/nips/blob/master/58.md) | addressable |  |
| `30009` | Badge Definition | [58](https://github.com/nostr-protocol/nips/blob/master/58.md) | addressable |  |
| `30015` | Interest sets | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | addressable |  |
| `30017` | Create or update a stall | [15](https://github.com/nostr-protocol/nips/blob/master/15.md) | addressable | ⚠️ unrecommended NIP |
| `30018` | Create or update a product | [15](https://github.com/nostr-protocol/nips/blob/master/15.md) | addressable | ⚠️ unrecommended NIP |
| `30019` | Marketplace UI/UX | [15](https://github.com/nostr-protocol/nips/blob/master/15.md) | addressable | ⚠️ unrecommended NIP |
| `30020` | Product sold as an auction | [15](https://github.com/nostr-protocol/nips/blob/master/15.md) | addressable | ⚠️ unrecommended NIP |
| `30023` | Long-form Content | [23](https://github.com/nostr-protocol/nips/blob/master/23.md) | addressable |  |
| `30024` | Draft Long-form Content | [23](https://github.com/nostr-protocol/nips/blob/master/23.md) | addressable |  |
| `30030` | Emoji sets | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | addressable |  |
| `30040` | Curated Publication Index | NKBIP-01 | addressable |  |
| `30041` | Curated Publication Content | NKBIP-01 | addressable |  |
| `30063` | Release artifact sets | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | addressable |  |
| `30078` | Application-specific Data | [78](https://github.com/nostr-protocol/nips/blob/master/78.md) | addressable |  |
| `30166` | Relay Discovery | [66](https://github.com/nostr-protocol/nips/blob/master/66.md) | addressable |  |
| `30267` | App curation sets | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | addressable |  |
| `30311` | Live Event | [53](https://github.com/nostr-protocol/nips/blob/master/53.md) | addressable |  |
| `30312` | Interactive Room | [53](https://github.com/nostr-protocol/nips/blob/master/53.md) | addressable |  |
| `30313` | Conference Event | [53](https://github.com/nostr-protocol/nips/blob/master/53.md) | addressable |  |
| `30315` | User Statuses | [38](https://github.com/nostr-protocol/nips/blob/master/38.md) | addressable |  |
| `30382` | User Trusted Assertion | [85](https://github.com/nostr-protocol/nips/blob/master/85.md) | addressable |  |
| `30383` | Event Trusted Assertion | [85](https://github.com/nostr-protocol/nips/blob/master/85.md) | addressable |  |
| `30384` | Addressable Trusted Assertion | [85](https://github.com/nostr-protocol/nips/blob/master/85.md) | addressable |  |
| `30402` | Classified Listing | [99](https://github.com/nostr-protocol/nips/blob/master/99.md) | addressable |  |
| `30403` | Draft Classified Listing | [99](https://github.com/nostr-protocol/nips/blob/master/99.md) | addressable |  |
| `30617` | Repository announcements | [34](https://github.com/nostr-protocol/nips/blob/master/34.md) | addressable |  |
| `30618` | Repository state announcements | [34](https://github.com/nostr-protocol/nips/blob/master/34.md) | addressable |  |
| `30818` | Wiki article | [54](https://github.com/nostr-protocol/nips/blob/master/54.md) | addressable |  |
| `30819` | Redirects | [54](https://github.com/nostr-protocol/nips/blob/master/54.md) | addressable |  |
| `31234` | Draft Event | [37](https://github.com/nostr-protocol/nips/blob/master/37.md) | addressable |  |
| `31922` | Date-Based Calendar Event | [52](https://github.com/nostr-protocol/nips/blob/master/52.md) | addressable |  |
| `31923` | Time-Based Calendar Event | [52](https://github.com/nostr-protocol/nips/blob/master/52.md) | addressable |  |
| `31924` | Calendar | [52](https://github.com/nostr-protocol/nips/blob/master/52.md) | addressable |  |
| `31925` | Calendar Event RSVP | [52](https://github.com/nostr-protocol/nips/blob/master/52.md) | addressable |  |
| `31989` | Handler recommendation | [89](https://github.com/nostr-protocol/nips/blob/master/89.md) | addressable |  |
| `31990` | Handler information | [89](https://github.com/nostr-protocol/nips/blob/master/89.md) | addressable |  |
| `32267` | Software Application | — | addressable |  |
| `33534` | Role Definition | [43](https://github.com/nostr-protocol/nips/blob/master/43.md) | addressable |  |
| `34128` | Legacy nsite manifest | [5A](https://github.com/nostr-protocol/nips/blob/master/5A.md) (deprecated) | addressable | ⚠️ deprecated |
| `34235` | Addressable Video Event | [71](https://github.com/nostr-protocol/nips/blob/master/71.md) | addressable |  |
| `34236` | Addressable Short Video Event | [71](https://github.com/nostr-protocol/nips/blob/master/71.md) | addressable |  |
| `34550` | Community Definition | [72](https://github.com/nostr-protocol/nips/blob/master/72.md) | addressable | ⚠️ unrecommended NIP |
| `35128` | Named nsite manifest | [5A](https://github.com/nostr-protocol/nips/blob/master/5A.md) | addressable |  |
| `37516` | Geocache Listing | [CC](https://github.com/nostr-protocol/nips/blob/master/CC.md) | addressable |  |
| `37517` | Geocache Curation List | [CC](https://github.com/nostr-protocol/nips/blob/master/CC.md) | addressable |  |
| `38000` | Mint Recommendation | [87](https://github.com/nostr-protocol/nips/blob/master/87.md) | addressable |  |
| `38172` | Cashu Mint Announcement | [87](https://github.com/nostr-protocol/nips/blob/master/87.md) | addressable |  |
| `38173` | Fedimint Announcement | [87](https://github.com/nostr-protocol/nips/blob/master/87.md) | addressable |  |
| `38383` | Peer-to-peer Order events | [69](https://github.com/nostr-protocol/nips/blob/master/69.md) | addressable |  |
| `39000-9` | Group metadata events | [29](https://github.com/nostr-protocol/nips/blob/master/29.md) | addressable |  |
| `39089` | Starter packs | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | addressable |  |
| `39092` | Media starter packs | [51](https://github.com/nostr-protocol/nips/blob/master/51.md) | addressable |  |
| `39701` | Web bookmarks | [B0](https://github.com/nostr-protocol/nips/blob/master/B0.md) | addressable |  |

A kind with no NIP link is listed in the README without a spec in the repository.
Links to NKBIP, Marmot, nostrocket and joinstr point to specs kept outside the NIPs repository.
