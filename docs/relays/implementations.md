---
sidebar_position: 2
title: Relay Implementations
description: Overview of Nostr relay software options
---

# Relay Implementations

Relay software that is maintained in October 2026, and what each is good for. To install one, go to [Running a Relay](./running-a-relay.md).

`🟢 active · 🟡 quiet (6–12 months) · 🔴 archived or dead · checked Oct 2026`. Status is the last push or release on the canonical repo.

## Which one?

| You want… | Use |
|---|---|
| A local relay for development and tests | `nak serve` |
| A fast public relay with negentropy sync | **strfry** |
| A single binary on SQLite | **nostr-rs-relay** |
| Postgres, paid admission, Tor/I2P, an admin console | **nostream** |
| Your own relay logic in Go | **khatru** |
| A personal relay with inbox, outbox, DMs and media | **HAVEN** |
| A relay on an Android phone | **Citrine** |
| Only notes from your web of trust | **WoT relay** |
| An invite-only community relay | **pyramid** or **zooid** |

## General-purpose relays

| Relay | Status | Notes |
|---|---|---|
| [strfry](https://github.com/hoytech/strfry) (C++, LMDB) | 🟢 1.1.3 | Runs many large relays. The README lists NIPs 1, 2, 4, 9, 11, 28, 40, 42, 45, 70, 77. Negentropy sync, streaming, router, write-policy plugins, Prometheus `/metrics`. No search (NIP-50). |
| [nostr-rs-relay](https://sr.ht/~gheartsfield/nostr-rs-relay/) (Rust, SQLite or Postgres) | 🟢 0.10.0 | Canonical repo on sourcehut; [GitHub](https://github.com/scsibug/nostr-rs-relay) is a mirror. NIP-05 gating, gRPC admission server, pay-to-relay. No NIP-77. |
| [nostream](https://github.com/cameri/nostream) (TypeScript, Postgres + Redis) | 🟢 3.6.2 | Docker Compose setup and a `nostream` CLI. Admission fees through ZEBEDEE, LNbits, LNURL, Nodeless, OpenNode or NWC. NIP-42, 43, 45, 50, 66, 77 behind settings. Tor and I2P. |
| [chorus](https://github.com/mikedilger/chorus) (Rust) | 🟡 Apr 2026 | Personal relay by default. Built-in Blossom server, NIP-86 management API. The author has marked Gossip idle; check activity before you depend on it. |
| [rnostr](https://github.com/rnostr/rnostr) (Rust, LMDB) | 🟢 | Docker image `rnostr/rnostr`. |
| [cagliostr](https://github.com/mattn/cagliostr) (C++, SQLite or Postgres) | 🟢 | Small and fast. |
| [grain](https://github.com/0ceanSlim/grain) (Go, LMDB) | 🟢 | Configurable relay with a dashboard. |
| [nostrcheck-server](https://github.com/quentintaranpino/nostrcheck-server) (TypeScript, MariaDB) | 🟢 | Relay, Blossom file hosting and NIP-05 in one. |
| [servus](https://github.com/servus-social/servus) (Rust) | 🟢 | Relay, personal website and Blossom server in one binary. |
| [HORNETS](https://github.com/HORNET-Storage/HORNETS-Nostr-Relay) (Go) | 🟢 | Relay with a dashboard; paid, public or invite-only. |
| [wisp](https://github.com/privkeyio/wisp) (Zig, LMDB) | 🟢 | New. "Spider mode" pulls notes from people you follow. |
| [nosflare](https://github.com/Spl0itable/nosflare) (JavaScript) | 🟢 | Serverless relay on Cloudflare Workers, Durable Objects and D1. |
| [NNostr](https://github.com/Kukks/NNostr) (C#, Postgres) | 🟢 | .NET relay and client library. |
| [nak serve](https://github.com/fiatjaf/nak) (Go, memory) | 🟢 v0.21.2 | Test relay at `ws://localhost:10547`. `--negentropy`, `--blossom`, `--auth` flags. Nothing is saved. |
| [fonstr](https://github.com/nostrapps/fonstr) (JavaScript, memory) | 🟢 0.0.26 | Dev/test only. `npx fonstr`, 1,000 events in memory by default. For a relay on Android, use Citrine. |

## Frameworks: build your own relay

| Framework | Status | Notes |
|---|---|---|
| **khatru** (Go) | 🟢 | The usual way to write a relay with custom rules. It moved into the `fiatjaf.com/nostr` module: [docs](https://pkg.go.dev/fiatjaf.com/nostr/khatru), [source](https://gitworkshop.dev/fiatjaf.com/nostrlib). Includes LMDB, Bolt and mmm event stores, a Blossom server, NIP-29 helpers and ready-made policies. The old `github.com/fiatjaf/khatru` repo is archived. |
| [rely](https://github.com/pippellia-btc/rely) (Go) | 🟢 v1.5.2 | Alternative Go framework. |
| [nostr-relay](https://github.com/CodyTseng/nostr-relay) (TypeScript) | 🟢 | The README calls it WIP. Also a desktop app, [nostr-relay-tray](https://github.com/CodyTseng/nostr-relay-tray). |
| [`nostr-relay-builder`](https://crates.io/crates/nostr-relay-builder) (Rust) | 🟢 0.44.1 (0.45 in alpha) | From [Nostr Dev Kit](https://github.com/nostrdevkit/nostr). Builds a relay inside your program. For tests with nostr-sdk 0.45, the `local-relay` feature's `MockRelay` is simpler: see [Rust](../libraries/rust.md#test-against-an-in-process-relay). |

A tested khatru relay is on [Running a Relay](./running-a-relay.md).

## Personal and community relays

| Relay | Status | Notes |
|---|---|---|
| [HAVEN](https://github.com/barrydeen/haven) | 🟢 v1.2.2 | Four relays in one (private, chat, inbox, outbox) plus Blossom. Built on khatru. Moved from `bitvora/haven`. |
| [Citrine](https://github.com/greenart7c3/Citrine) | 🟢 v3.2.0 | A relay that runs on Android. Install from Zapstore, F-Droid, Obtainium or GitHub releases. |
| [WoT relay](https://github.com/barrydeen/wot-relay) | 🟡 v0.2.1 | Accepts notes only from your web of trust. Moved from `bitvora/wot-relay`. |
| [chronicle](https://github.com/dtonon/chronicle) | 🟢 | Personal outbox relay with web-of-trust spam protection. |
| [pyramid](https://github.com/fiatjaf/pyramid) | 🟢 | Invite-tree community relay. Built on khatru. |
| [zooid](https://gitea.coracle.social/coracle/zooid) | 🟢 | Multi-tenant relay for Flotilla groups (NIP-29, 43, 86). Replaces frith and triflector. |

For media, run a [Blossom](https://github.com/hzrd149/blossom) server: [blossom-server](https://github.com/hzrd149/blossom-server) (TypeScript), [route96](https://github.com/v0l/route96) (Rust), or the one built into HAVEN, chorus, servus or nostrcheck-server. Quick starts are on the wiki's [Run a relay](https://github.com/nostrcg/devguide/wiki/Tutorials) page.

## Dead or archived

| Project | Status |
|---|---|
| [hyper-nostr](https://github.com/Ruulul/hyper-nostr) | 🔴 No commits since May 2023. |
| [nostr-relay on PyPI](https://pypi.org/project/nostr-relay/) (Python) | 🔴 Last release Jun 2024; fails to build on Python 3.14. |
| [pyrelay](https://github.com/johnny423/pyrelay) (Python) | 🔴 No commits since Apr 2023. |
| [saltivka](https://github.com/viktorvsk/saltivka) (Ruby) | 🔴 No commits since Jan 2024. |
| [relay29](https://github.com/fiatjaf/relay29) | 🔴 Archived. Use `fiatjaf.com/nostr/nip29` or zooid. |
| khatru and go-nostr on GitHub | 🔴 Archived. Use `fiatjaf.com/nostr`. |

:::caution
`cargo install nostr-rs-relay` installs crate 0.8.12 from August 2023. Use Docker or build from source instead.
:::

## See also

- [Running a Relay](./running-a-relay.md)
- [Configuration](./configuration.md)
- [Relay Explorers](./explorers.md): which software public relays run, from their NIP-11 documents.
