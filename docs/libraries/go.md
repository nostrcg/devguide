---
sidebar_position: 5
title: Go Libraries
description: fiatjaf.com/nostr, the successor to go-nostr, with khatru for relays
---

# Go Libraries

Use **[fiatjaf.com/nostr](https://pkg.go.dev/fiatjaf.com/nostr)**. It replaces go-nostr and bundles the relay framework khatru, event stores and helpers for most NIPs as subpackages.

| Module | Status |
|---|---|
| `fiatjaf.com/nostr`: client, relay pool, keys, NIP packages (`nip19`, `nip44`, `nip17`, `nip46`…) | 🟢 untagged, updated Oct 2026 |
| `fiatjaf.com/nostr/khatru`: framework for writing relays | 🟢 |
| `fiatjaf.com/nostr/eventstore/...`: storage (LMDB, BoltDB, Bleve, in-memory) | 🟢 |
| `fiatjaf.com/nostr/sdk`: caching, profile loading, outbox relay selection | 🟢 |
| [github.com/nbd-wtf/go-nostr](https://github.com/nbd-wtf/go-nostr) | 🔴 archived Nov 2025 |
| [github.com/fiatjaf/khatru](https://github.com/fiatjaf/khatru) | 🔴 archived Sep 2025 |

The code is not on GitHub. It is hosted on Nostr-native git; browse it at [gitworkshop.dev](https://gitworkshop.dev/fiatjaf.com/nostrlib) or read the API on [pkg.go.dev](https://pkg.go.dev/fiatjaf.com/nostr).

:::caution Not a drop-in for go-nostr
The API changed: keys are typed (`nostr.SecretKey`, `nostr.PubKey`, `nostr.ID` are byte arrays, not hex strings), kinds are `nostr.Kind`, `Pool` replaces `SimplePool`, and methods take one `Filter` instead of `Filters`. go-nostr examples will not compile.
:::

## Install

There are no semver tags yet, so `@master` resolves to a pseudo-version. Commit `go.sum` and upgrade on purpose.

```bash
go get fiatjaf.com/nostr@master
```

The module needs Go 1.25 or newer. The examples below were built with Go 1.27.3 against the 21 Oct 2026 pseudo-version (`v0.0.0-20261021183943-35ed1794ff30`) and run against `nak serve` (`ws://localhost:10547`) or live relays.

## Publish and read back

```go
package main

import (
	"context"
	"fmt"
	"time"

	"fiatjaf.com/nostr"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	relays := []string{"ws://localhost:10547"}

	// A throwaway key. Never hard-code a real nsec.
	sk := nostr.Generate()
	pk := sk.Public()

	evt := nostr.Event{
		Kind:      nostr.KindTextNote,
		CreatedAt: nostr.Now(),
		Tags:      nostr.Tags{},
		Content:   "hello from fiatjaf.com/nostr",
	}
	// Sign sets PubKey, ID and Sig
	if err := evt.Sign(sk); err != nil {
		panic(err)
	}

	pool := nostr.NewPool()

	// Publish: one result per relay
	for res := range pool.PublishMany(ctx, relays, evt) {
		if res.Error != nil {
			fmt.Println("failed", res.RelayURL, res.Error)
		} else {
			fmt.Println("published to", res.RelayURL)
		}
	}

	// Fetch: the channel closes after every relay sends EOSE
	filter := nostr.Filter{Kinds: []nostr.Kind{nostr.KindTextNote}, Authors: []nostr.PubKey{pk}, Limit: 10}
	for ie := range pool.FetchMany(ctx, relays, filter, nostr.SubscriptionOptions{}) {
		fmt.Println(ie.Relay.URL, ie.Event.Content)
	}
}
```

`PublishMany` returns a channel with one `PublishResult` per relay, closed when all have answered. `FetchMany` ends at EOSE; `SubscribeMany` stays open.

## Subscribe to new events

```go
package main

import (
	"context"
	"fmt"
	"time"

	"fiatjaf.com/nostr"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	relays := []string{"wss://relay.primal.net", "wss://relay.nostr.net"}
	pool := nostr.NewPool()

	// Only new notes. The pool drops duplicates seen on several relays.
	filter := nostr.Filter{Kinds: []nostr.Kind{nostr.KindTextNote}, Since: nostr.Now()}

	seen := 0
	for ie := range pool.SubscribeMany(ctx, relays, filter, nostr.SubscriptionOptions{}) {
		fmt.Printf("%s %s: %.60q\n", ie.Relay.URL, ie.Event.PubKey.Hex()[:8], ie.Event.Content)
		seen++
		if seen == 5 {
			cancel() // closes the subscriptions
		}
	}
}
```

## Keys, NIP-19 and verification

```go
package main

import (
	"fmt"

	"fiatjaf.com/nostr"
	"fiatjaf.com/nostr/nip19"
)

func main() {
	sk := nostr.Generate()
	pk := sk.Public()
	fmt.Println("hex pubkey:", pk.Hex())
	fmt.Println("npub:", nip19.EncodeNpub(pk))

	// Decode returns a prefix and a typed value
	jb55 := nostr.MustPubKeyFromHex("32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245")
	nprofile := nip19.EncodeNprofile(jb55, []string{"wss://relay.primal.net"})
	prefix, value, err := nip19.Decode(nprofile)
	if err != nil {
		panic(err)
	}
	fmt.Println(prefix, value.(nostr.ProfilePointer).PublicKey.Hex())

	// Check a signature before you trust an event
	evt := nostr.Event{Kind: nostr.KindTextNote, CreatedAt: nostr.Now(), Content: "test"}
	if err := evt.Sign(sk); err != nil {
		panic(err)
	}
	fmt.Println("valid id:", evt.CheckID(), "valid sig:", evt.VerifySignature())
}
```

`SecretKeyFromHex` and `PubKeyFromHex` parse hex and return an error; the `Must…` variants panic. Use `nip19.Decode` for anything that starts with `npub`, `nsec`, `nevent`, `nprofile` or `naddr`.

## NIP-44 encryption

```go
package main

import (
	"fmt"

	"fiatjaf.com/nostr"
	"fiatjaf.com/nostr/nip44"
)

func main() {
	alice, bob := nostr.Generate(), nostr.Generate()

	// Both sides derive the same conversation key
	key, _ := nip44.GenerateConversationKey(bob.Public(), alice)
	payload, err := nip44.Encrypt("hi bob", key)
	if err != nil {
		panic(err)
	}
	fmt.Println(payload)

	key2, _ := nip44.GenerateConversationKey(alice.Public(), bob)
	plaintext, err := nip44.Decrypt(payload, key2)
	if err != nil {
		panic(err)
	}
	fmt.Println(plaintext)
}
```

For NIP-17 private messages, see the `fiatjaf.com/nostr/nip17` and `nip59` packages. Don't use `nip04` for anything new.

## A minimal relay with khatru

```go
package main

import (
	"fmt"
	"net/http"

	"fiatjaf.com/nostr/eventstore/slicestore"
	"fiatjaf.com/nostr/khatru"
)

func main() {
	relay := khatru.NewRelay()
	relay.Info.Name = "my test relay"

	// In-memory storage; use eventstore/lmdb for something that persists
	db := &slicestore.SliceStore{}
	if err := db.Init(); err != nil {
		panic(err)
	}
	relay.UseEventstore(db, 500)

	fmt.Println("running on ws://localhost:3334")
	http.ListenAndServe(":3334", relay)
}
```

Test it:

```bash
nak event -c 'hello' ws://localhost:3334
nak req -k 1 ws://localhost:3334
curl -H 'Accept: application/nostr+json' http://localhost:3334
```

The NIP-11 response lists `supported_nips` and `"software":"https://pkg.go.dev/fiatjaf.com/nostr/khatru"`. For persistent storage use `fiatjaf.com/nostr/eventstore/lmdb`; for policies (rejecting kinds, requiring AUTH) see the [khatru package docs](https://pkg.go.dev/fiatjaf.com/nostr/khatru) and [Relay Implementations](../relays/implementations.md).

:::note
nak, the Nostr command-line tool, is built on this library. Its source is a good place to see the API used for real: [github.com/fiatjaf/nak](https://github.com/fiatjaf/nak).
:::
