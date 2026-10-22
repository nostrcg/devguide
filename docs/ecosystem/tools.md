---
sidebar_position: 3
title: Developer Tools
description: Command-line, browser and testing tools for Nostr development, checked October 2026
---

# Developer Tools

The tools Nostr developers actually use in October 2026, and what each is for. Commands were run with nak v0.21.2. For full cheat-sheets, see the wiki pages linked from each section.

`🟢 active · 🟡 quiet (6–12 months) · 🔴 archived or dead · checked Oct 2026`

## Command line

### nak 🟢

[nak](https://github.com/fiatjaf/nak) is the Nostr army knife: one binary that makes keys, signs and publishes events, queries relays, decodes NIP-19 codes, runs a throwaway relay, acts as a NIP-46 bunker and signs NIP-98 HTTP requests.

```bash
# Linux / macOS: downloads the latest release binary
curl -sSL https://raw.githubusercontent.com/fiatjaf/nak/master/install.sh | sh

# or, with Go
go install github.com/fiatjaf/nak@latest
```

The everyday commands:

```bash
# a throwaway key; nak reads NOSTR_SECRET_KEY, so it never goes on the command line
export NOSTR_SECRET_KEY=$(nak key generate)
echo "$NOSTR_SECRET_KEY" | nak key public

# a local in-memory relay on ws://localhost:10547 (run in its own terminal)
nak serve

# publish, then read back
nak event -c 'hello' ws://localhost:10547
nak req -k 1 -l 3 ws://localhost:10547

# read from public relays
nak req -k 1 -l 3 wss://relay.primal.net wss://relay.nostr.net

# decode npub, nevent, nprofile, naddr… to hex and relay hints
nak decode npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s

# a relay's NIP-11 info document
nak relay wss://relay.primal.net

# check an event's id and signature (exit code 0 if valid)
nak verify < event.json

# offline reference: a kind's schema, a NIP's text
nak kind 10050
nak nip 17
```

:::tip
In scripts and `while read` loops, nak reads stdin whenever it isn't a terminal. Add `</dev/null` to `nak event` and `nak req` there, or it swallows your input.
:::

Full reference: the wiki's [nak](https://github.com/nostrcg/devguide/wiki/NAK) page. Multi-step recipes with `jq`: [Snippets](https://github.com/nostrcg/devguide/wiki/Snippets).

### websocat 🟢

[websocat](https://github.com/vi/websocat) is a generic WebSocket client. Use it to see the raw relay messages, exactly as the relay sends them:

```bash
echo '["REQ","x",{"kinds":[1],"limit":2}]' | timeout 5 websocat -n wss://relay.primal.net
```

More on the wiki's [websocat](https://github.com/nostrcg/devguide/wiki/Websocat) page.

### Others

- [nostril](https://github.com/jb55/nostril) 🟡: a small C tool that creates and signs events. Last commit Dec 2025.
- 🔴 [nostcat](https://github.com/blakejakopovic/nostcat): no commits since 2023. Use nak.

:::caution Keys from the command line
Use `nak key generate` for test keys. `openssl rand -hex 32` can, very rarely, produce a value that isn't a valid secp256k1 key. Don't generate BIP-39 mnemonics (NIP-06): the NIPs now recommend a single key. To store a key encrypted, use NIP-49 (`ncryptsec`): `nak key encrypt`. See [Key Management](../guides/key-management.md).
:::

## In the browser

| Tool | What it does |
|---|---|
| [nak web](https://nak.nostr.com) | Decode, encode, sign and publish in the browser, with your NIP-07 extension |
| [njump.me](https://njump.me) ([source](https://github.com/fiatjaf/njump)) | Renders any `npub`, `nevent` or `naddr` as a static web page; good for checking what you published |
| [Hello World](https://nostrapps.github.io/helloworld/hello.html) | A one-button page that calls `window.nostr.getPublicKey()`: checks that an extension works |

For signer extensions, bunkers and Android signers, and which are still maintained, see the wiki's [Signers & login](https://github.com/nostrcg/devguide/wiki/Extensions) page.

## Testing

| Need | Tool |
|---|---|
| A throwaway relay for development | `nak serve` (above); `nak serve --help` lists options for AUTH, negentropy and Blossom |
| A relay inside your test process | Rust `MockRelay` ([Rust](../libraries/rust.md#test-against-an-in-process-relay)) or a khatru relay ([Go](../libraries/go.md)) |
| A NIP-01 compliance suite for a relay you are writing | [relay-tester](https://github.com/mikedilger/relay-tester) 🟡: point it at a fresh, empty relay, never a live one. It takes two throwaway keys |
| Checking a relay against the NIPs it advertises | `@nostrwatch/auditor` in [nostr-watch](https://github.com/sandwichfarm/nostr-watch) (alpha) |
| JSON schemas for event kinds, to validate what you publish | [nostrability/schemata](https://github.com/nostrability/schemata) 🟡 |
| A production relay (strfry, nostr-rs-relay…) | See [Running a Relay](../relays/running-a-relay.md) |

More on test setups: [Testing](../guides/testing.md).

## Monitoring relays

- [nostr.watch](https://nostr.watch) shows relay status, built on NIP-66.
- **api.nostr.watch v1 is dead** (502). v2 charges per request (L402 or Cashu).
- The free way is to read NIP-66 monitor events (kind 30166) directly from relays. The wiki's [Relay Explorers](https://github.com/nostrcg/devguide/wiki/Relay-Explorers) page has tested queries, and [Relay Explorers](../relays/explorers.md) covers the sites.

## Reference

- [nostr-protocol/nips](https://github.com/nostr-protocol/nips): the specs. The README has the full kind and tag tables.
- [nostrbook.dev](https://nostrbook.dev): searchable kinds, tags and NIPs.
- `nak kind <n>` and `nak nip <n>` work offline.

## Gone

Don't use these; older guides still mention them.

| Tool | Status |
|---|---|
| nostr.band search, API and relay | 🔴 unreachable since early October 2026 |
| `primal.net/api/...` HTTP endpoints | Not an API: they return the web app. Primal's cache speaks its own WebSocket protocol |
| `npx nostr-tools …` CLI | Never existed; nostr-tools is a library only |
| `nostr-relay-tester` (npm), `nostr-tools/mock` | Don't exist |
| nsecBunker (`nsecbunkerd`) | 🔴 repo wiped in June 2026 |
