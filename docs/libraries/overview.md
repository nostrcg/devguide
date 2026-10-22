---
sidebar_position: 1
title: Libraries Overview
description: Which Nostr library to start with in each language, as of October 2026
---

# Libraries Overview

One pick per language, then the details on each language's page. Versions and status were checked against the package registries and repos in October 2026.

`🟢 active · 🟡 quiet (6–12 months) · 🔴 archived or dead · checked Oct 2026`

## The pick

| Language | Start with | Version | Docs |
|---|---|---|---|
| JavaScript / TypeScript | [nostr-tools](https://github.com/nbd-wtf/nostr-tools) | 🟢 2.25 | [jsr.io/@nostr/tools](https://jsr.io/@nostr/tools/doc) · [our page](./javascript.md) |
| Rust | [nostr-sdk](https://crates.io/crates/nostr-sdk) (Nostr Dev Kit) | 🟢 0.45 | [doc.nostrdevkit.org](https://doc.nostrdevkit.org/) · [our page](./rust.md) |
| Python | [nostr-sdk](https://pypi.org/project/nostr-sdk/) (Rust bindings) | 🟢 0.45 | [doc.nostrdevkit.org](https://doc.nostrdevkit.org/) · [our page](./python.md) |
| Go | [fiatjaf.com/nostr](https://pkg.go.dev/fiatjaf.com/nostr) | 🟢 untagged | [pkg.go.dev](https://pkg.go.dev/fiatjaf.com/nostr) · [our page](./go.md) |
| Kotlin / Android | [Quartz](https://github.com/vitorpamplona/quartz) | 🟢 2.0 | [other languages](./other.md) |
| Swift / iOS | [nostr-sdk-swift](https://github.com/nostrdevkit/nostr-sdk-swift) | 🟢 0.45 | [other languages](./other.md) |
| Dart / Flutter | [ndk](https://github.com/relaystr/ndk) | 🟢 0.10 | [other languages](./other.md) |

```bash
# JavaScript / TypeScript
npm i nostr-tools
# Rust
cargo add nostr-sdk
# Python
pip install nostr-sdk
# Go (no semver tags yet; this records a pseudo-version in go.mod)
go get fiatjaf.com/nostr@master
# Dart / Flutter
dart pub add ndk
```

:::caution Three different "NDKs"
**NDK** in JavaScript is [`@nostr-dev-kit/ndk`](https://github.com/nostr-dev-kit/ndk). **Nostr Dev Kit** is the 2026 name of the Rust project formerly called rust-nostr, plus its Python, Kotlin, Swift and C# bindings. **`ndk` on pub.dev** is a third, unrelated Dart SDK. Check which one a tutorial means.
:::

## What changed since older guides

- **rust-nostr is now Nostr Dev Kit.** The repo moved to [github.com/nostrdevkit/nostr](https://github.com/nostrdevkit/nostr). Old links redirect, but binding package names changed (for example npm `@rust-nostr/nostr-sdk` → `@nostrdevkit/nostr-sdk-web`, Maven `org.rust-nostr` → `org.nostrdevkit`). The 0.45 API is very different from 0.35-era examples.
- **go-nostr and khatru are archived.** Both moved into the module `fiatjaf.com/nostr` (khatru is now `fiatjaf.com/nostr/khatru`).
- **Python: use `nostr-sdk`.** `python-nostr` (PyPI name `nostr`) is dead, and pynostr is quiet.
- **nostr-tools 2.17+ changed two signatures.** `pool.subscribeMany()` takes one filter object, and `pool.publish()` returns an array of promises. Code written for older versions silently breaks. See [JavaScript](./javascript.md).

## Choosing well

- **Prefer libraries that do outbox routing (NIP-65) for you.** Users publish to their own relays; a client that only reads a fixed relay list misses most posts. applesauce, welshman, NDK, @nostr/gadgets, nostr-sdk and Quartz handle this.
- **Don't hold user keys if you can avoid it.** Check that the library can sign through a NIP-07 extension, a NIP-46 bunker or a NIP-55 Android signer. See [Key Management](../guides/key-management.md).
- **Pin versions.** Almost every Nostr library is below 1.0 and breaks its API between minor releases. The Rust and Python SDKs call themselves alpha.
- **Encrypt with NIP-44, message with NIP-17.** NIP-04 is deprecated. All four main picks implement NIP-44 and NIP-17 gift wraps.
- **Treat old lists with care.** [awesome-nostr](https://github.com/aljazceru/awesome-nostr) is useful, but in October 2026 it still pointed at several archived or moved repos.

## Don't use

| Package | Why |
|---|---|
| npm `nostr` (nostr-js) | 🔴 last release 2023 |
| `nostr-react`, `@nostr-connect/connect` | 🔴 unmaintained since 2023–2024 |
| npm `@rust-nostr/nostr-sdk` | 🔴 deprecated; use `@nostrdevkit/nostr-sdk-web` |
| PyPI `nostr` (python-nostr), `nostr-protocol` | 🔴 dead; use `nostr-sdk` |
| PyPI `nostr-tools` | Unrelated to the JavaScript library of the same name |
| `github.com/nbd-wtf/go-nostr`, `github.com/fiatjaf/khatru` | 🔴 archived; use `fiatjaf.com/nostr` |

The [wiki's Libraries page](https://github.com/nostrcg/devguide/wiki/Libraries) keeps the longer list of alternatives.
