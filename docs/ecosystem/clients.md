---
sidebar_position: 1
title: Nostr Clients
description: Open-source Nostr clients to test against and learn from, checked October 2026
---

# Nostr Clients

As a developer you need clients for two things: checking that the events your code publishes show up correctly elsewhere, and reading real code that already solves outbox routing, caching, zaps or private messages. Every client below is open source, and each repo was checked with the GitHub API in October 2026.

`🟢 active · 🟡 quiet (6–12 months) · 🔴 archived or dead · checked Oct 2026`

**Where to start reading:** for a web client, Coracle (outbox routing) or noStrudel (applesauce). For iOS, Damus. For Android, Amethyst.

## Mobile and desktop

| Client | Platforms · language | Status | Worth reading for |
|---|---|---|---|
| **Damus** · [site](https://damus.io) · [repo](https://github.com/damus-io/damus) | iOS, macOS · Swift | 🟢 | Uses [nostrdb](https://github.com/damus-io/nostrdb), an embedded C event database |
| **Notedeck** · [repo](https://github.com/damus-io/notedeck) | Linux, macOS, Windows, Android · Rust | 🟢 | Multi-column client from the Damus team, also on nostrdb |
| **Amethyst** · [site](https://amethyst.social) · [repo](https://github.com/vitorpamplona/amethyst) | Android · Kotlin | 🟢 v1.19 | Very wide NIP coverage; its protocol layer is the [Quartz](https://github.com/vitorpamplona/quartz) library |
| **Primal** · [site](https://primal.net) · [Android](https://github.com/PrimalHQ/primal-android-app) · [iOS](https://github.com/PrimalHQ/primal-ios-app) · [web](https://github.com/PrimalHQ/primal-web-app) | Kotlin, Swift, TypeScript | 🟢 | Apps backed by Primal's caching service |
| **Nostur** · [site](https://nostur.com) · [repo](https://github.com/nostur-com/nostur-ios-public) | iOS, macOS · Swift | 🟢 | Native Swift client |
| **YakiHonne** · [site](https://yakihonne.com) · [mobile](https://github.com/YakiHonne/mobile-app) · [web](https://github.com/YakiHonne/web-app) | Dart (Flutter), JavaScript | 🟢 | Long-form articles (NIP-23), social and payments |
| **Gossip** · [repo](https://github.com/mikedilger/gossip) | Linux, macOS, Windows · Rust | 🔴 idle | The early outbox-model reference client. Its author marked it idle in 2026; the [YGGverse/gossip](https://github.com/YGGverse/gossip) fork continues it |

## Web

| Client | Language | Status | Worth reading for |
|---|---|---|---|
| **Jumble** · [site](https://jumble.social) · [repo](https://github.com/CodyTseng/jumble) | TypeScript | 🟢 | Browsing feeds relay by relay |
| **noStrudel** · [site](https://nostrudel.ninja) · [repo](https://github.com/hzrd149/nostrudel) | TypeScript | 🟢 | Power-user client; built on [applesauce](https://applesauce.build) |
| **Coracle** · [site](https://coracle.social) · [repo](https://github.com/coracle-social/coracle) | Svelte | 🟢 | Outbox routing, built on [welshman](https://welshman.coracle.social) |
| **Flotilla** · [site](https://flotilla.social) · [repo](https://github.com/coracle-social/flotilla) | Svelte | 🟢 | Discord-style communities hosted on relays |
| **Snort** · [site](https://snort.social) · [repo](https://github.com/v0l/snort) | TypeScript (React) | 🟢 | Its core is the `@snort/system` library |
| **Iris** · [site](https://iris.to) · [repo](https://github.com/irislib/iris-client) | TypeScript | 🟢 | Offline-first, social-graph filtering. The old `iris-messenger` repo is archived |
| **Ditto** · [site](https://ditto.pub) · [repo](https://gitlab.com/soapbox-pub/ditto) | TypeScript | 🟢 | Built with [Nostrify](https://nostrify.dev) |

## Messaging and other apps

| App | Status | Notes |
|---|---|---|
| **0xchat** · [site](https://0xchat.com) · [repo](https://github.com/0xchat-app/0xchat-app-main) | 🟢 | Private chat and groups (Flutter) |
| **White Noise** · [site](https://whitenoise.chat) · [iOS](https://github.com/marmot-protocol/whitenoise-ios) · [Android](https://github.com/marmot-protocol/whitenoise-android) | 🟢 | MLS group messaging over Nostr ([Marmot](https://github.com/marmot-protocol/marmot)) |
| **Keychat** · [site](https://keychat.io) · [repo](https://github.com/keychat-io/keychat-app) | 🟢 | Encrypted chat, ecash wallet and mini apps |
| **Shopstr** · [site](https://shopstr.market) · [repo](https://github.com/shopstr-eng/shopstr) | 🟢 | Marketplace. The old `shopstr.store` domain is gone |

Quiet since mid-2025: [Olas](https://github.com/pablof7z/olas) (photos) and [Highlighter](https://github.com/pablof7z/highlighter) (highlights and long-form), both last pushed July–August 2025.

## Moved, archived or dead

| Project | What happened |
|---|---|
| Iris (old), `irislib/iris-messenger` | 🔴 archived; replaced by `irislib/iris-client` |
| Nostros | 🔴 archived Feb 2025 |
| Habla (habla.news) | 🔴 site gone |
| Stemstr | 🔴 site gone |
| White Noise (Flutter), `marmot-protocol/whitenoise` | 🔴 archived; split into the iOS, Android and web repos |
| Nosky, Nozzle, Hamstr | 🔴 archived or no commits since 2023–2024 |

## Testing your events in clients

- Post to a public relay that the client reads (for example `wss://relay.primal.net`), then open the event in two or three clients from different families: one web (Jumble or noStrudel), one iOS (Damus or Nostur), one Android (Amethyst).
- [njump.me](https://njump.me) renders any `nevent`, `naddr` or `npub` as a plain web page: a quick way to share a link to what you published.
- Use a throwaway key for tests, never your main account.

## Client discovery (NIP-89)

[NIP-89](https://github.com/nostr-protocol/nips/blob/master/89.md) lets apps announce which event kinds they handle (kind 31990), and users recommend apps for a kind (kind 31989). If your app handles a new kind, publish a kind 31990 so other clients can link to it.

## Finding more

- [nostr.net](https://nostr.net): a directory of Nostr apps and resources
- [awesome-nostr](https://github.com/aljazceru/awesome-nostr): long list; check each entry, some links are stale
- The wiki's [Client Implementations](https://github.com/nostrcg/devguide/wiki/Client-Implementations) page

To build your own, start with [Build Your First App](../getting-started/first-app.md) and [Building Clients](../guides/building-clients.md).
