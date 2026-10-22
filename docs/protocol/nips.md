---
sidebar_position: 5
title: NIPs (Nostr Implementation Possibilities)
description: How the NIP specs work, which ones to start with for each kind of app, and which ones not to build on
---

# NIPs (Nostr Implementation Possibilities)

NIPs are the specification documents for Nostr. They live in one GitHub repository, [nostr-protocol/nips](https://github.com/nostr-protocol/nips). Each one is a short Markdown file named by its number or code (`01.md`, `65.md`, `B7.md`). This page explains how to read them and which ones matter for what you're building. It was checked against the repository on 21 October 2026.

:::info Not a checklist
The NIPs README says it plainly: *"NIPs listed here are not a protocol checklist… Don't implement something just because it exists in this repo."* Implement NIP-01, then add only what your app needs.
:::

## How NIPs are labelled

Each NIP has badges under its title:

- **`draft`** or **`final`**: almost every NIP is `draft`, including NIP-01. Only a few, such as 02 and 05, are `final`. "Draft" doesn't mean unused: most of the protocol in daily use is draft.
- **`mandatory`** or **`optional`**: only NIP-01 is mandatory.
- **`relay`**: the NIP needs relay support, not just client support.

Separately, the README's list marks some NIPs **unrecommended** (struck through, with a reason). Those are the ones to avoid; see [below](#dont-build-on-these).

NIP-12, 16, 20 and 33 have been merged into NIP-01. A relay's `supported_nips` list shouldn't need to mention them.

## Where to start, by app

| Building… | Start with |
|---|---|
| **Any client** | [01](https://github.com/nostr-protocol/nips/blob/master/01.md) protocol · [19](https://github.com/nostr-protocol/nips/blob/master/19.md) `npub`/`nevent`/`naddr` · [21](https://github.com/nostr-protocol/nips/blob/master/21.md) `nostr:` URIs · [65](https://github.com/nostr-protocol/nips/blob/master/65.md) relay lists · [11](https://github.com/nostr-protocol/nips/blob/master/11.md) relay info |
| **Login** | [07](https://github.com/nostr-protocol/nips/blob/master/07.md) browser signer · [46](https://github.com/nostr-protocol/nips/blob/master/46.md) Nostr Remote Signing · [55](https://github.com/nostr-protocol/nips/blob/master/55.md) Android signer · [49](https://github.com/nostr-protocol/nips/blob/master/49.md) `ncryptsec` |
| **Social** | [02](https://github.com/nostr-protocol/nips/blob/master/02.md) follows · [10](https://github.com/nostr-protocol/nips/blob/master/10.md) threads · [18](https://github.com/nostr-protocol/nips/blob/master/18.md) reposts · [22](https://github.com/nostr-protocol/nips/blob/master/22.md) comments · [25](https://github.com/nostr-protocol/nips/blob/master/25.md) reactions · [27](https://github.com/nostr-protocol/nips/blob/master/27.md) mentions · [51](https://github.com/nostr-protocol/nips/blob/master/51.md) lists · [05](https://github.com/nostr-protocol/nips/blob/master/05.md) handles |
| **Private messages** | [17](https://github.com/nostr-protocol/nips/blob/master/17.md) DMs · [44](https://github.com/nostr-protocol/nips/blob/master/44.md) encryption · [59](https://github.com/nostr-protocol/nips/blob/master/59.md) gift wrap · group chat: [Marmot](https://github.com/marmot-protocol/marmot) (MLS) |
| **Chat and communities** | [29](https://github.com/nostr-protocol/nips/blob/master/29.md) relay-based groups · [C7](https://github.com/nostr-protocol/nips/blob/master/C7.md) chats · [7D](https://github.com/nostr-protocol/nips/blob/master/7D.md) forum threads |
| **Long-form** | [23](https://github.com/nostr-protocol/nips/blob/master/23.md) articles · [22](https://github.com/nostr-protocol/nips/blob/master/22.md) comments · [57](https://github.com/nostr-protocol/nips/blob/master/57.md) zaps |
| **Media** | [B7](https://github.com/nostr-protocol/nips/blob/master/B7.md) + [Blossom](https://github.com/hzrd149/blossom) uploads · [92](https://github.com/nostr-protocol/nips/blob/master/92.md) `imeta` · [68](https://github.com/nostr-protocol/nips/blob/master/68.md) pictures · [71](https://github.com/nostr-protocol/nips/blob/master/71.md) video |
| **Payments** | [57](https://github.com/nostr-protocol/nips/blob/master/57.md) zaps · [47](https://github.com/nostr-protocol/nips/blob/master/47.md) Wallet Connect · [60](https://github.com/nostr-protocol/nips/blob/master/60.md) / [61](https://github.com/nostr-protocol/nips/blob/master/61.md) Cashu wallet and nutzaps |
| **A relay** | [01](https://github.com/nostr-protocol/nips/blob/master/01.md) · [11](https://github.com/nostr-protocol/nips/blob/master/11.md) · [42](https://github.com/nostr-protocol/nips/blob/master/42.md) auth · [45](https://github.com/nostr-protocol/nips/blob/master/45.md) count · [62](https://github.com/nostr-protocol/nips/blob/master/62.md) vanish · [70](https://github.com/nostr-protocol/nips/blob/master/70.md) protected events · [77](https://github.com/nostr-protocol/nips/blob/master/77.md) sync · [86](https://github.com/nostr-protocol/nips/blob/master/86.md) management API |
| **HTTP services** | [98](https://github.com/nostr-protocol/nips/blob/master/98.md) HTTP auth · [05](https://github.com/nostr-protocol/nips/blob/master/05.md) `nostr.json` |

## How NIPs build on each other

NIPs often reuse others. Some links worth knowing:

- **NIP-17** DMs use NIP-44 encryption inside NIP-59 seals and gift wraps, sent to the relays in the recipient's kind 10050 list. Relays should serve gift wraps only after NIP-42 AUTH.
- **NIP-46** remote signing sends its kind 24133 messages encrypted with NIP-44.
- **NIP-57** zaps need the recipient's Lightning address (`lud16`, from the kind 0 profile, [NIP-24](https://github.com/nostr-protocol/nips/blob/master/24.md)) and an LNURL server that supports Nostr. They don't depend on any relay feature.
- **NIP-65** relay lists are what make reading other people's notes reliable. Most other features assume you know where users publish.

## Don't build on these

These are marked **unrecommended** in the NIPs README:

| NIP | README's reason | Use instead |
|---|---|---|
| 03 OpenTimestamps | Vulnerable to one specific attack, needs update | — |
| 04 Encrypted DMs | Deprecated in favour of 17 | **17** + 44 + 59 |
| 06 Keys from a seed phrase | Prefer a single nsec | One nsec, backed up with **49** |
| 08 Handling mentions | Deprecated in favour of 27 | **27** |
| 15 Marketplace | Too complicated | **99** classified listings |
| 26 Delegated signing | Unnecessary burden for little gain | **46** remote signing |
| 28 Public chat | — | **29** relay-based groups |
| 31 Unknown events | Unnecessarily bloated | — |
| 72 Moderated communities | — | **29** relay-based groups |
| 90 Data Vending Machines | Got out of control | Use-case-specific microstandards |
| 96 HTTP file storage | Replaced by Blossom | **B7** Blossom |
| BE BLE communications | Implemented once, unclear whether it works | — |
| EE MLS messaging | Superseded by Marmot | [Marmot](https://github.com/marmot-protocol/marmot) |

You'll still meet old events of these kinds (kind 4 DMs, for example), so a client may want to read them. Don't write new ones.

## Recent changes

The wiki's [Protocol basics](https://github.com/nostrcg/devguide/wiki/Protocol-Basics) keeps a short changelog. Highlights from 2024 to 2026:

- NIP-01 dropped prefix matching in filters (exact 64-char hex only) and says empty filter lists match nothing.
- NIP-07 added `nip44.*`, deprecated `nip04.*`, and has no `getRelays()`: read kind 10002 instead.
- NIP-17 replaced NIP-04 for private messages, and Blossom replaced NIP-96 for files.
- Kind 1111 comments (NIP-22) work on any root. "Parameterized replaceable" events are now called addressable.
- New NIPs include [67](https://github.com/nostr-protocol/nips/blob/master/67.md) (an `EOSE` completeness hint), [5A](https://github.com/nostr-protocol/nips/blob/master/5A.md) (static sites), [85](https://github.com/nostr-protocol/nips/blob/master/85.md) (trusted assertions) and [43](https://github.com/nostr-protocol/nips/blob/master/43.md) (relay access requests).

## Reading and following NIPs

- **[nips.nostr.com](https://nips.nostr.com)** is a searchable viewer of the repository.
- **[nostrbook.dev](https://nostrbook.dev)** is a reference of kinds, tags and NIPs.
- **`nak nip 17`** prints a NIP in your terminal, and **`nak kind 30023`** describes a kind.
- To follow changes, use GitHub's **Watch** button on the repository (Custom → Pull requests), or clone it and read `git log`. Most discussion happens in pull requests.
- New NIPs start as pull requests. The README's "Criteria for acceptance" section says what a new NIP needs, including implementations in at least two clients and one relay where it applies.

## See also

- [Event kinds](./kinds.md): the kinds these NIPs define.
- [NIP implementation guide](../guides/nip-implementation.md): working through common NIPs in code.
