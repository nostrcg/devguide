---
sidebar_position: 2
title: Relay Implementations
description: Overview of Nostr relay software options
---

# Relay Implementations

This page covers the major relay implementations available for running your own Nostr relay.

## Quick Comparison

| Relay | Language | Database | Best For | Difficulty |
|-------|----------|----------|----------|------------|
| strfry | C++ | LMDB | High performance | Medium |
| nostream | TypeScript | PostgreSQL | Production features | Medium |
| nostr-rs-relay | Rust | SQLite/PG | Easy setup | Easy |
| khatru | Go | Custom | Custom relays | Medium |
| fonstr | JavaScript | In-memory | Testing/dev | Easy |
| hyper-nostr | JavaScript | Hyperbeedee | P2P sync | Easy |

## strfry

High-performance C++ relay with advanced features.

**Repository:** [github.com/hoytech/strfry](https://github.com/hoytech/strfry)

### Features

- Extremely fast (handles millions of events)
- LMDB database (memory-mapped, crash-resistant)
- Negentropy sync protocol for relay-to-relay sync
- Plugin system for custom policies
- Low memory usage

### Quick Start

```bash
git clone https://github.com/hoytech/strfry.git
cd strfry
git submodule update --init
make setup-golpe
make -j4
./strfry relay
```

### Docker

```bash
docker run -p 7777:7777 -v $(pwd)/data:/app/strfry-db hoytech/strfry
```

### Supported NIPs

NIP-01, NIP-02, NIP-04, NIP-09, NIP-11, NIP-12, NIP-15, NIP-16, NIP-20, NIP-22, NIP-26, NIP-28, NIP-33, NIP-40, NIP-42, NIP-45, NIP-50

## nostream

Production-ready TypeScript relay with rich features.

**Repository:** [github.com/Cameri/nostream](https://github.com/Cameri/nostream)

### Features

- Docker-ready deployment
- PostgreSQL for scalability
- Payment integration (NIP-57)
- Rate limiting and abuse prevention
- Metrics and monitoring
- Horizontal scaling support

### Quick Start

```bash
git clone https://github.com/Cameri/nostream.git
cd nostream
cp .env.sample .env
docker compose up -d
```

### Configuration

Edit `.env`:

```bash
RELAY_NAME="My Nostream Relay"
RELAY_PUBKEY="your-hex-pubkey"
RELAY_CONTACT="admin@example.com"

POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_USER=nostr
POSTGRES_PASSWORD=secure_password
```

## nostr-rs-relay

Rust relay with SQLite, easy to set up.

**Repository:** [github.com/scsibug/nostr-rs-relay](https://github.com/scsibug/nostr-rs-relay)

### Features

- Simple configuration
- SQLite or PostgreSQL backend
- Low resource usage
- NIP-42 authentication
- Configurable limits

### Installation

```bash
# From cargo
cargo install nostr-rs-relay

# Run
nostr-rs-relay --db ./nostr.db
```

### Docker

```bash
docker pull scsibug/nostr-rs-relay
docker run -p 7777:8080 scsibug/nostr-rs-relay
```

With custom config:

```bash
docker run -it -p 7000:8080 \
  --mount src=$(pwd)/config.toml,target=/usr/src/app/config.toml,type=bind \
  --mount src=$(pwd)/data,target=/usr/src/app/db,type=bind \
  nostr-rs-relay
```

## khatru

Go relay framework for building custom relays.

**Repository:** [github.com/fiatjaf/khatru](https://github.com/fiatjaf/khatru)

### Features

- Modular, extensible design
- Build custom relay logic
- Go ecosystem integration
- Easy to embed in applications

### Example

```go
package main

import (
    "github.com/fiatjaf/khatru"
)

func main() {
    relay := khatru.NewRelay()

    relay.StoreEvent = append(relay.StoreEvent, func(ctx context.Context, event *nostr.Event) error {
        // Custom storage logic
        return db.SaveEvent(event)
    })

    relay.QueryEvents = append(relay.QueryEvents, func(ctx context.Context, filter nostr.Filter) (chan *nostr.Event, error) {
        // Custom query logic
        return db.QueryEvents(filter)
    })

    relay.Start("0.0.0.0", 7777, nil)
}
```

## fonstr

Simple JavaScript relay for testing and development.

**Repository:** [github.com/nostrapps/fonstr](https://github.com/nostrapps/fonstr)

### Quick Start

```bash
npx fonstr
```

With HTTPS:

```bash
bin/relay.js -h
```

Requires `privkey.pem` and `fullchain.pem` in current directory.

### Use Cases

- Local development
- Testing clients
- Learning the protocol
- Phone-based relay (experimental)

## hyper-nostr

Distributed relay using Hyperswarm for P2P sync.

**Repository:** [github.com/Ruulul/hyper-nostr](https://github.com/Ruulul/hyper-nostr)

### Features

- P2P relay synchronization
- Hyperswarm for peer discovery
- Hyperbeedee database
- No central coordination needed

### Installation

```bash
npm install -g hyper-nostr
hyper-nostr 3338 nostr
```

### Testing

```bash
echo '["REQ", "test", {}]' | websocat -n ws://localhost:3338/nostr
```

### Supported NIPs

NIP-01, NIP-02, NIP-04, NIP-09, NIP-11, NIP-12, NIP-16, NIP-20, NIP-33, NIP-45, NIP-50

## Python Relay

Simple Python relay for learning.

```bash
pip install nostr-relay
nostr-relay serve
```

## Choosing a Relay

### For Production

1. **strfry** - Best performance, complex setup
2. **nostream** - Feature-rich, Docker-friendly

### For Development

1. **fonstr** - Quickest to start
2. **nostr-rs-relay** - Simple and reliable

### For Custom Use Cases

1. **khatru** - Build exactly what you need
2. **hyper-nostr** - P2P/distributed scenarios

## See Also

- [Running a Relay](./running-a-relay)
- [Configuration](./configuration)
- [Hosting Options](./hosting)
