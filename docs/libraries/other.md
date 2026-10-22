---
sidebar_position: 6
title: Other Languages
description: Verified Nostr libraries for Kotlin, Swift, Dart, Java, C#, PHP, Ruby, C and more
---

# Other Languages

Libraries for languages without their own page. Every repo and package below was checked against GitHub and the package registry in October 2026. We haven't run code in these languages, so this page links to each project's own README instead of showing examples.

`🟢 active · 🟡 quiet (6–12 months) · 🔴 archived or dead · checked Oct 2026`

:::tip Nostr Dev Kit bindings
The Rust [nostr-sdk](./rust.md) is published for Kotlin, Swift, C#, Python and JavaScript from [nostrdevkit/nostr-sdk-ffi](https://github.com/nostrdevkit/nostr-sdk-ffi) (0.45.1). If your language is on that list, you get the same API and NIP coverage as Rust, documented in the [book](https://doc.nostrdevkit.org/).
:::

## Kotlin, Android and the JVM

| Library | Notes | Status |
|---|---|---|
| **[Quartz](https://github.com/vitorpamplona/quartz)** | Amethyst's protocol layer, split out as a Kotlin Multiplatform library (JVM, Android, iOS, Linux): events, NIP-44, relay client, SQLite store | 🟢 2.0.0, Oct 2026 |
| Nostr Dev Kit Kotlin | `org.nostrdevkit:nostr-sdk`, `-jvm`, `-kmp`. The old `org.rust-nostr` coordinates are frozen | 🟢 0.45.1 |
| [nostr-java](https://github.com/tcheeric/nostr-java) | Java 21. Published to its own Maven repo (`https://maven.398ja.xyz/releases`), not Maven Central | 🟢 |
| [nostr4j](https://github.com/NostrGameEngine/nostr4j) | Java client with Blossom and Wallet Connect support | 🟢 |
| [nostr-spring-boot-starter](https://github.com/theborakompanioni/nostr-spring-boot-starter) | Spring Boot integration | 🟢 |

```kotlin
// build.gradle.kts
implementation("com.vitorpamplona.quartz:quartz:2.0.0")
// or the Nostr Dev Kit bindings
implementation("org.nostrdevkit:nostr-sdk:0.45.1")
```

No maintained Scala library turned up; use one of the JVM libraries.

## Swift, iOS and macOS

| Library | Notes | Status |
|---|---|---|
| **[nostr-sdk-swift](https://github.com/nostrdevkit/nostr-sdk-swift)** | Nostr Dev Kit bindings, via Swift Package Manager | 🟢 0.45.1 |
| [nostrdb](https://github.com/damus-io/nostrdb) | Embedded event database in C, used by Damus and Notedeck | 🟢 |
| [nostr-essentials](https://github.com/nostur-com/nostr-essentials) | Helpers from the Nostur client | 🟡 Mar 2026 |
| [nostr-sdk-ios](https://github.com/nostr-sdk/nostr-sdk-ios) | Native Swift SDK | 🟡 last commit Jan 2026, release Feb 2025 |

Add `https://github.com/nostrdevkit/nostr-sdk-swift` as a package dependency in Xcode or `Package.swift`. The older `rust-nostr/nostr-swift` repo is archived.

## Dart and Flutter

| Library | Notes | Status |
|---|---|---|
| **[ndk](https://github.com/relaystr/ndk)** | Outbox-aware SDK. Unrelated to the JavaScript NDK and to Nostr Dev Kit | 🟢 0.10.1 |
| [dart_nostr](https://github.com/anasfik/nostr) | Client library | 🟡 last release Apr 2026 |
| [nostr](https://github.com/ethicnology/dart-nostr) (pub.dev `nostr`) | Event and key primitives | 🟢 |
| nostr-sdk-flutter | Nostr Dev Kit bindings | 🔴 unmaintained, says its README |

```bash
dart pub add ndk
```

## C# and .NET

| Library | Install | Status |
|---|---|---|
| [NNostr](https://github.com/Kukks/NNostr) | `dotnet add package NNostr.Client` (not `NNostr`) | 🟢 0.0.55 |
| Nostr Dev Kit C# | `dotnet add package Nostr.Sdk` | 🟢 0.45.1 |
| [Nostra](https://github.com/lontivero/Nostra) (F#) | NuGet | 🟢 |

## PHP

[nostr-php](https://github.com/nostrver-se/nostr-php) (🟢) moved from the `swentel` GitHub account to `nostrver-se`, but the Composer name didn't change. The stable line is 1.9.x; 2.0.0 is still an alpha. Docs: [nostr-php.dev](https://nostr-php.dev).

```bash
composer require swentel/nostr-php
```

## Ruby

[nostr_ruby](https://github.com/dtonon/nostr-ruby) (🟢 0.3.1). The gem is `nostr_ruby`, with an underscore; `nostr-ruby` doesn't exist. The separate `nostr` gem (wilsonsilva) last released in April 2024.

```bash
gem install nostr_ruby
```

## C, C++, Zig and others

| Language | Library | Status |
|---|---|---|
| C | [libnostr-c](https://github.com/privkeyio/libnostr-c) | 🟢 |
| C | [noscrypt](https://github.com/VnUgE/noscrypt): crypto only | 🟡 Jun 2026 |
| C | [nostrdb](https://github.com/damus-io/nostrdb): embedded event database | 🟢 |
| Perl | [Net::Nostr](https://metacpan.org/pod/Net::Nostr) (`cpanm Net::Nostr`) | 🟢 2.003 |
| Zig | [zig-nostr/nostr](https://github.com/zig-nostr/nostr) | 🟢 small |
| Haskell | [nostr.hs](https://github.com/delirehberi/nostr.hs) | 🟢 small |
| Elixir | [nostr-elixir](https://github.com/nostrdevkit/nostr-elixir): Nostr Dev Kit bindings, no Hex release yet | 🟢 new |

"Small" means a handful of contributors and stars: read the code before you depend on it.

## Not found or dead

These names appear in older guides, including earlier versions of this page. They don't exist or aren't maintained:

| Name | What we found |
|---|---|
| "NostrKit" (`nostr-protocol/nostr-kit`) | No such repo |
| `damus-io/nostr-sdk` | A 2023 fork of rust-nostr, not the SDK Damus uses |
| "nostrpostr" / NostrPostr | 🔴 404, or no commits since 2023 |
| NuGet `NNostr`, gem `nostr-ruby`, Composer `nostr-php/nostr-php`, Hex `nostrlib` | Not on their registries; see the real names above |
| Maven `io.github.nostr4j` | No artifacts |
| Dart `nostr_tools` | Last release 2023 |

## Finding more

- [awesome-nostr](https://github.com/aljazceru/awesome-nostr) lists many more libraries. In October 2026 it still linked several archived or moved repos, so check each one before you use it.
- The [wiki's Libraries page](https://github.com/nostrcg/devguide/wiki/Libraries) is kept in sync with this one.
