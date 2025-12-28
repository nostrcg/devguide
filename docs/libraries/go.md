---
sidebar_position: 5
title: Go Libraries
description: Nostr libraries for Go development
---

# Go Libraries

Go is excellent for building high-performance Nostr relays and backend services.

## go-nostr

The primary Go library for Nostr development.

**Install:**
```bash
go get github.com/nbd-wtf/go-nostr
```

**Repository:** [github.com/nbd-wtf/go-nostr](https://github.com/nbd-wtf/go-nostr)

### Key Generation

```go
package main

import (
    "fmt"
    "github.com/nbd-wtf/go-nostr"
    "github.com/nbd-wtf/go-nostr/nip19"
)

func main() {
    // Generate new keypair
    sk := nostr.GeneratePrivateKey()
    pk, _ := nostr.GetPublicKey(sk)

    // Encode to bech32
    nsec, _ := nip19.EncodePrivateKey(sk)
    npub, _ := nip19.EncodePublicKey(pk)

    fmt.Printf("Private key (nsec): %s\n", nsec)
    fmt.Printf("Public key (npub): %s\n", npub)
}
```

### Creating Events

```go
package main

import (
    "github.com/nbd-wtf/go-nostr"
    "time"
)

func main() {
    sk := nostr.GeneratePrivateKey()
    pk, _ := nostr.GetPublicKey(sk)

    event := nostr.Event{
        PubKey:    pk,
        CreatedAt: nostr.Timestamp(time.Now().Unix()),
        Kind:      1,
        Tags:      nostr.Tags{
            {"t", "nostr"},
            {"t", "golang"},
        },
        Content:   "Hello from Go!",
    }

    // Sign the event
    event.Sign(sk)

    fmt.Printf("Event ID: %s\n", event.ID)
    fmt.Printf("Event JSON: %s\n", event.String())
}
```

### Connecting to Relays

```go
package main

import (
    "context"
    "fmt"
    "github.com/nbd-wtf/go-nostr"
)

func main() {
    ctx := context.Background()

    relay, err := nostr.RelayConnect(ctx, "wss://relay.damus.io")
    if err != nil {
        panic(err)
    }
    defer relay.Close()

    fmt.Printf("Connected to %s\n", relay.URL)
}
```

### Publishing Events

```go
func publishEvent(ctx context.Context, event nostr.Event) error {
    relay, err := nostr.RelayConnect(ctx, "wss://relay.damus.io")
    if err != nil {
        return err
    }
    defer relay.Close()

    err = relay.Publish(ctx, event)
    if err != nil {
        return fmt.Errorf("failed to publish: %w", err)
    }

    fmt.Println("Event published successfully")
    return nil
}
```

### Subscribing to Events

```go
package main

import (
    "context"
    "fmt"
    "github.com/nbd-wtf/go-nostr"
)

func main() {
    ctx := context.Background()

    relay, err := nostr.RelayConnect(ctx, "wss://relay.damus.io")
    if err != nil {
        panic(err)
    }
    defer relay.Close()

    // Create filter
    filters := []nostr.Filter{{
        Kinds: []int{1},
        Limit: 10,
    }}

    // Subscribe
    sub, err := relay.Subscribe(ctx, filters)
    if err != nil {
        panic(err)
    }

    // Handle events
    for ev := range sub.Events {
        fmt.Printf("Event from %s: %s\n", ev.PubKey[:8], ev.Content)
    }
}
```

### Multi-Relay Connection

```go
package main

import (
    "context"
    "github.com/nbd-wtf/go-nostr"
)

func main() {
    ctx := context.Background()

    relayURLs := []string{
        "wss://relay.damus.io",
        "wss://nos.lol",
        "wss://relay.nostr.band",
    }

    pool := nostr.NewSimplePool(ctx)

    // Subscribe across all relays
    filters := []nostr.Filter{{
        Kinds: []int{1},
        Limit: 20,
    }}

    for ev := range pool.SubManyEose(ctx, relayURLs, filters) {
        fmt.Printf("From %s: %s\n", ev.Relay.URL, ev.Event.Content)
    }
}
```

### Verifying Events

```go
func verifyEvent(event nostr.Event) bool {
    // Check ID
    if !event.CheckID() {
        return false
    }

    // Check signature
    ok, err := event.CheckSignature()
    if err != nil || !ok {
        return false
    }

    return true
}
```

### NIP-19 Encoding/Decoding

```go
import "github.com/nbd-wtf/go-nostr/nip19"

// Encode
nsec, _ := nip19.EncodePrivateKey(sk)
npub, _ := nip19.EncodePublicKey(pk)
note, _ := nip19.EncodeNote(eventID)

// Encode with relay hints
nprofile, _ := nip19.EncodeProfile(pk, []string{"wss://relay.example.com"})
nevent, _ := nip19.EncodeEvent(eventID, []string{"wss://relay.example.com"}, pk)

// Decode
prefix, data, _ := nip19.Decode(npub)
// prefix = "npub", data = hex pubkey

// Decode profile
_, profile, _ := nip19.Decode(nprofile)
// profile.PublicKey, profile.Relays
```

### Building a Simple Relay

```go
package main

import (
    "github.com/nbd-wtf/go-nostr"
    "github.com/nbd-wtf/go-nostr/relayer"
    "log"
)

type MyRelay struct {
    storage map[string]nostr.Event
}

func (r *MyRelay) Name() string {
    return "my-relay"
}

func (r *MyRelay) Init() error {
    r.storage = make(map[string]nostr.Event)
    return nil
}

func (r *MyRelay) AcceptEvent(ctx context.Context, event *nostr.Event) bool {
    // Accept all events
    return true
}

func (r *MyRelay) SaveEvent(ctx context.Context, event *nostr.Event) error {
    r.storage[event.ID] = *event
    return nil
}

func (r *MyRelay) QueryEvents(ctx context.Context, filter nostr.Filter) (chan *nostr.Event, error) {
    ch := make(chan *nostr.Event)
    go func() {
        for _, event := range r.storage {
            if filter.Matches(&event) {
                ch <- &event
            }
        }
        close(ch)
    }()
    return ch, nil
}

func main() {
    relay := &MyRelay{}
    server, _ := relayer.NewServer(relay)
    log.Fatal(server.Start("0.0.0.0", 7777))
}
```

### Webhook/HTTP Service Example

```go
package main

import (
    "encoding/json"
    "net/http"
    "github.com/nbd-wtf/go-nostr"
)

var sk = nostr.GeneratePrivateKey()

func postNoteHandler(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Content string `json:"content"`
    }

    json.NewDecoder(r.Body).Decode(&req)

    pk, _ := nostr.GetPublicKey(sk)
    event := nostr.Event{
        PubKey:    pk,
        CreatedAt: nostr.Now(),
        Kind:      1,
        Content:   req.Content,
    }
    event.Sign(sk)

    // Publish to relay
    ctx := r.Context()
    relay, _ := nostr.RelayConnect(ctx, "wss://relay.damus.io")
    defer relay.Close()

    relay.Publish(ctx, event)

    json.NewEncoder(w).Encode(map[string]string{
        "id": event.ID,
    })
}

func main() {
    http.HandleFunc("/post", postNoteHandler)
    http.ListenAndServe(":8080", nil)
}
```

## Best Practices

1. **Use context** for cancellation and timeouts:
   ```go
   ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
   defer cancel()
   ```

2. **Handle relay disconnections:**
   ```go
   relay.OnDisconnect = func() {
       log.Println("Disconnected, reconnecting...")
       // Implement reconnection logic
   }
   ```

3. **Use connection pooling** for multiple relays

4. **Verify events** before processing

5. **Rate limit** your publishing

## See Also

- [go-nostr GitHub](https://github.com/nbd-wtf/go-nostr)
- [Go Relay Implementations](../relays/implementations)
- [Running Relays Guide](../relays/running-a-relay)
