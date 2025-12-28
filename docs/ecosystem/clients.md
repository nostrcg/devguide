---
sidebar_position: 1
title: Nostr Clients
description: Overview of Nostr client applications
---

# Nostr Clients

Nostr clients are applications that users interact with. This page covers the major clients and their features.

## What Makes a Good Client?

- **Key management** - Secure handling of private keys or NIP-07 support
- **Relay management** - Connect to multiple relays
- **NIP support** - Implementation of relevant NIPs
- **Performance** - Fast loading and smooth UX
- **Cross-platform** - Available on user's preferred platform

## Mobile Clients

### iOS

#### Damus

The most popular iOS Nostr client.

- **Platform:** iOS, macOS
- **Repository:** [github.com/damus-io/damus](https://github.com/damus-io/damus)
- **Website:** [damus.io](https://damus.io)

**Features:**
- Full social experience
- Lightning zaps (NIP-57)
- NIP-05 verification
- Image/video uploads
- Thread views

#### Primal

Feature-rich client with caching layer.

- **Platform:** iOS, Android, Web
- **Website:** [primal.net](https://primal.net)

**Features:**
- Built-in caching for performance
- Premium features available
- Wallet integration
- Advanced search

### Android

#### Amethyst

Full-featured Android client.

- **Platform:** Android
- **Repository:** [github.com/vitorpamplona/amethyst](https://github.com/vitorpamplona/amethyst)

**Features:**
- Communities support
- Live streams
- Zaps
- NIP-05 verification
- Multiple accounts

#### Nostros

Minimalist Android client.

- **Repository:** [github.com/KoalaSat/nostros](https://github.com/KoalaSat/nostros)

**Features:**
- Lightweight
- Focus on privacy
- Tor support

## Web Clients

### Snort

Modern web client with clean UI.

- **Website:** [snort.social](https://snort.social)
- **Repository:** [github.com/v0l/snort](https://github.com/v0l/snort)

**Features:**
- Fast performance
- NIP-07 support
- Zaps
- Dark mode
- Progressive Web App

### Iris

Social web client with unique features.

- **Website:** [iris.to](https://iris.to)
- **Repository:** [github.com/irislib/iris-messenger](https://github.com/irislib/iris-messenger)

**Features:**
- Gun.js integration
- Offline support
- Encrypted DMs
- No signup required

### nostrudel

Power-user focused client.

- **Website:** [nostrudel.ninja](https://nostrudel.ninja)
- **Repository:** [github.com/hzrd149/nostrudel](https://github.com/hzrd149/nostrudel)

**Features:**
- Advanced relay management
- DVMs support
- Multiple view modes
- Developer-friendly

### Coracle

Community-focused client.

- **Website:** [coracle.social](https://coracle.social)
- **Repository:** [github.com/coracle-social/coracle](https://github.com/coracle-social/coracle)

**Features:**
- Groups/communities
- Relay-focused
- Clean interface

## Desktop Clients

### Gossip

Native desktop client in Rust.

- **Repository:** [github.com/mikedilger/gossip](https://github.com/mikedilger/gossip)
- **Platform:** Windows, macOS, Linux

**Features:**
- High performance
- Local database
- Advanced relay scoring
- Privacy focused

### More

Native macOS client.

- **Website:** [more.nostr.app](https://more.nostr.app)
- **Platform:** macOS

## Specialized Clients

### Long-form Content

#### Habla

Blog platform for Nostr (NIP-23).

- **Website:** [habla.news](https://habla.news)
- **Repository:** [github.com/verbiricha/habla.news](https://github.com/verbiricha/habla.news)

#### Yakihonne

Long-form and curated content.

- **Website:** [yakihonne.com](https://yakihonne.com)

### Media

#### Stemstr

Music-focused Nostr client.

- **Website:** [stemstr.app](https://stemstr.app)

#### Slidestr

Image galleries and photography.

- **Website:** [slidestr.net](https://slidestr.net)

### Marketplace

#### Shopstr

E-commerce on Nostr.

- **Website:** [shopstr.store](https://shopstr.store)

### Chat

#### 0xchat

Private messaging client.

- **Website:** [0xchat.com](https://0xchat.com)

## Client Features Matrix

| Client | Platform | Zaps | DMs | NIP-05 | Long-form |
|--------|----------|------|-----|--------|-----------|
| Damus | iOS | ✓ | ✓ | ✓ | - |
| Amethyst | Android | ✓ | ✓ | ✓ | ✓ |
| Primal | All | ✓ | ✓ | ✓ | - |
| Snort | Web | ✓ | ✓ | ✓ | - |
| Iris | Web | ✓ | ✓ | ✓ | - |
| Gossip | Desktop | ✓ | ✓ | ✓ | - |
| Habla | Web | ✓ | - | ✓ | ✓ |

## Building Your Own Client

Starting points:

1. **[Build Your First App](../getting-started/first-app)** - Basic tutorial
2. **[Building Clients Guide](../guides/building-clients)** - In-depth guide
3. **[Libraries Overview](../libraries/overview)** - Choose your language

Key considerations:
- Start with core features (notes, profiles, follows)
- Implement NIP-07 for key management
- Use multiple relays for reliability
- Consider mobile-first design

## Client Discovery

Find more clients:

- [Nostr Apps](https://nostr.net) - Directory of Nostr applications
- [Awesome Nostr](https://github.com/aljazceru/awesome-nostr#clients) - Curated list
- [Nostr.how](https://nostr.how/clients) - Client guides

## See Also

- [Relay Implementations](../relays/overview)
- [Developer Tools](./tools)
- [Building Clients Guide](../guides/building-clients)
