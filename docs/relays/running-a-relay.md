---
sidebar_position: 3
title: Running a Relay
description: Step-by-step guide to running your own Nostr relay
---

# Running a Relay

How to get a relay running, from a throwaway test relay to a public strfry server. To choose software first, see [Relay Implementations](./implementations.md). Each section says whether its commands were **tested** (Linux, Oct 2026) or copied from the project's current README.

:::note
Every relay here speaks plain `ws://`. For `wss://` on a domain, put it behind a [reverse proxy](./reverse-proxy.md) that handles TLS.
:::

## For development: nak serve

**Tested** with nak v0.21.2. An in-memory relay at `ws://localhost:10547`. Nothing is kept when it stops.

```bash
nak serve
# options: --port 10547, --negentropy (NIP-77), --blossom, --auth (NIP-42)
```

Install instructions for nak are in the [nak README](https://github.com/fiatjaf/nak) and on the wiki's [nak page](https://github.com/nostrcg/devguide/wiki/NAK).

## strfry

From the [strfry README](https://github.com/hoytech/strfry). Build on Debian or Ubuntu:

```bash
sudo apt install -y git g++ make libssl-dev zlib1g-dev liblmdb-dev libflatbuffers-dev libsecp256k1-dev libzstd-dev
git clone https://github.com/hoytech/strfry && cd strfry/
git submodule update --init
make setup-golpe
make -j4
```

Run it:

```bash
./strfry relay
```

This reads `./strfry.conf` and stores data in `./strfry-db/`. The default config listens on `127.0.0.1:7777`, which is what you want behind a reverse proxy. To upgrade later:

```bash
git pull
make update-submodules
make -j4
```

### strfry as a service

These steps follow strfry's [DEPLOYMENT.md](https://github.com/hoytech/strfry/blob/master/docs/DEPLOYMENT.md). Install the binary and create a user and data directory:

```bash
sudo cp strfry /usr/local/bin
sudo useradd -M -s /usr/sbin/nologin strfry
sudo mkdir /var/lib/strfry
sudo chown strfry:strfry /var/lib/strfry
sudo chmod 755 /var/lib/strfry
```

Edit `strfry.conf` before copying it to `/etc` (strfry looks there by default):

- `db = "/var/lib/strfry/"`
- `relay.info.name`, `description`, `pubkey`, `contact`: shown in the NIP-11 document.
- `relay.auth.serviceUrl = "wss://relay.example.com"`: required for NIP-42 AUTH to work.
- `relay.realIpHeader = "x-real-ip"`: the header your proxy sets. Without it, rate limits and logs see `127.0.0.1`.
- `relay.nofiles`: set it to the value of `ulimit -Hn`, or `0`.

All keys are explained on [Configuration](./configuration.md).

```bash
sudo cp strfry.conf /etc/strfry.conf
sudo chown strfry:strfry /etc/strfry.conf
```

Put this unit at `/etc/systemd/system/strfry.service` (from DEPLOYMENT.md):

```ini
[Unit]
Description=strfry relay service

[Service]
User=strfry
ExecStart=/usr/local/bin/strfry relay
Restart=on-failure
RestartSec=5
ProtectHome=yes
NoNewPrivileges=yes
ProtectSystem=full
LimitCORE=1000000000

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable strfry.service
sudo systemctl start strfry
sudo systemctl status strfry
```

### strfry in Docker

strfry has no official image (`hoytech/strfry` does not exist on Docker Hub). The repo ships a `Dockerfile` and `sample-docker-compose.yaml`. The most-used community image is [dockurr/strfry](https://hub.docker.com/r/dockurr/strfry); from its README:

```bash
docker run -it --rm --name strfry -p 7777:7777 \
  -v "${PWD:-.}/strfry-db:/app/strfry-db" \
  -v "${PWD:-.}/strfry.conf:/etc/strfry.conf" \
  --stop-timeout 120 docker.io/dockurr/strfry
```

Inside a container, `relay.bind` must be `0.0.0.0` or the published port can't reach it. Publish the port only on localhost (`-p 127.0.0.1:7777:7777`) if a proxy on the host fronts it.

## nostr-rs-relay

The canonical repo is on [sourcehut](https://sr.ht/~gheartsfield/nostr-rs-relay/). From the [Docker Hub README](https://hub.docker.com/r/scsibug/nostr-rs-relay):

```bash
mkdir data
# publish on 127.0.0.1 only: Docker-published ports bypass ufw,
# and the reverse proxy is what faces the internet
docker run -it -p 127.0.0.1:7000:8080 \
  --mount src=$(pwd)/data,target=/usr/src/app/db,type=bind \
  scsibug/nostr-rs-relay:latest
```

The relay is then at `ws://localhost:7000`, with its SQLite database in `./data`. To change settings, copy the sample [`config.toml`](https://github.com/scsibug/nostr-rs-relay/blob/master/config.toml) and add `--mount src=$(pwd)/config.toml,target=/usr/src/app/config.toml,type=bind`.

From source (repo README). It listens on `0.0.0.0:8080`, all interfaces, unless you change `network.address`:

```bash
sudo apt-get install build-essential cmake protobuf-compiler pkg-config libssl-dev
git clone -q https://git.sr.ht/~gheartsfield/nostr-rs-relay
cd nostr-rs-relay
cargo build -q -r
RUST_LOG=warn,nostr_rs_relay=info ./target/release/nostr-rs-relay
```

## nostream

From the [nostream README](https://github.com/cameri/nostream). It runs with Postgres and Redis under Docker Compose. Install Docker from the [official guide](https://docs.docker.com/engine/install/); the README says Snap, Brew and Debian-repo Docker are not supported. The `nostream` command is installed with pnpm.

```bash
git clone https://github.com/Cameri/nostream.git
cd nostream
echo "SECRET=$(openssl rand -hex 128)" > .env

# installs the nostream command from the checkout
pnpm add -g .

# or: nostream start --tor | --i2p
nostream start
nostream stop
```

nginx with a Let's Encrypt certificate in one step:

```bash
RELAY_DOMAIN=relay.example.com CERTBOT_EMAIL=you@example.com nostream start --nginx
```

The first run creates `.nostr/settings.yaml`, which holds the relay policy. The old `./scripts/start` scripts are now `nostream start`, `nostream stop`, `nostream update` and so on ([CLI.md](https://github.com/Cameri/nostream/blob/main/CLI.md)).

## khatru: write your own relay

**Tested** with Go 1.27 and `fiatjaf.com/nostr` from 21 Oct 2026. khatru lives in the `fiatjaf.com/nostr` module; the old GitHub repo is archived. It needs Go 1.25+ and a C compiler (LMDB uses cgo).

```bash
mkdir myrelay && cd myrelay
go mod init myrelay
go get fiatjaf.com/nostr@master
```

`main.go`:

```go
package main

import (
	"fmt"
	"net/http"
	"os"

	"fiatjaf.com/nostr/eventstore/lmdb"
	"fiatjaf.com/nostr/khatru"
	"fiatjaf.com/nostr/khatru/policies"
)

func main() {
	relay := khatru.NewRelay()
	relay.Info.Name = "my relay"
	relay.Info.Description = "a khatru test relay"

	db := &lmdb.LMDBBackend{Path: "./data"}
	os.MkdirAll(db.Path, 0o755)
	if err := db.Init(); err != nil {
		panic(err)
	}
	relay.UseEventstore(db, 400)

	// accept only profiles, notes and follow lists
	relay.OnEvent = policies.RestrictToSpecifiedKinds(
		false, 0, 1, 3)

	// localhost only: put a reverse proxy in front
	fmt.Println("running on 127.0.0.1:3334")
	http.ListenAndServe("127.0.0.1:3334", relay)
}
```

```bash
go mod tidy
go run .
```

In another terminal:

```bash
# accepted
nak event -c 'hello khatru' ws://localhost:3334

# rejected: "blocked: received event kind 7 not allowed"
nak event -k 7 -c '+' ws://localhost:3334
```

:::caution
khatru takes the client IP from `X-Forwarded-For` whenever the header is present, whoever sent it. Keep it bound to `127.0.0.1` and expose it only through a proxy that overwrites that header (see [Reverse Proxy](./reverse-proxy.md)). The same applies to HAVEN and other khatru-based relays.
:::

`relay.OnRequest` filters queries the same way. More ready-made rules are in `khatru/policies`, and more examples (Blossom, GRASP git hosting, exclusive access) are in `khatru/examples` in the [source](https://gitworkshop.dev/fiatjaf.com/nostrlib) and the [package docs](https://pkg.go.dev/fiatjaf.com/nostr/khatru).

## Personal relays

HAVEN (a personal relay with inbox, outbox, private notes and Blossom), Citrine (Android) and fonstr (a quick `npx` relay) have copy-paste setups on the wiki's [Run a relay](https://github.com/nostrcg/devguide/wiki/Tutorials) page.

## Check that it works

**Tested** against `nak serve`, khatru and both through nginx and Caddy.

```bash
# NIP-11 document: should be JSON
curl -H 'Accept: application/nostr+json' https://relay.example.com

# write and read back
nak event -c 'hello' wss://relay.example.com
nak req -k 1 -l 1 wss://relay.example.com
```

`nak event` signs with `$NOSTR_SECRET_KEY` if it is set, or with a default per-machine key. Don't put a real key on the command line.

## Backups and maintenance

**strfry** (from the README). Export everything as JSONL, oldest first:

```bash
strfry --config /etc/strfry.conf export > backup.jsonl
```

Restore with `strfry import < backup.jsonl`. Before upgrading to a strfry release with a new database format, use a fried export, which re-imports faster:

```bash
./strfry export --fried > dbdump.jsonl
mv strfry-db/data.mdb data.mdb.bak
./strfry import --fried < dbdump.jsonl
```

To reclaim disk space, stop strfry and compact:

```bash
./strfry compact - > strfry-db/data.mdb.compacted
mv strfry-db/data.mdb.compacted strfry-db/data.mdb
```

**nostr-rs-relay** keeps everything in one SQLite file in its data directory (`nostr.db` by default). **nostream** stores events in the Postgres database `nostr_ts_relay` (user `nostr_ts_relay`, from `.env.example`). Test a backup by restoring it once.

## Before you go public

- TLS through a [reverse proxy](./reverse-proxy.md) that passes WebSocket upgrades and overwrites `X-Forwarded-For`.
- The relay reads the real client IP from that proxy header.
- Only ports 22, 80 and 443 open. With ufw and nginx: `sudo ufw allow 22/tcp`, `sudo ufw allow 'Nginx Full'`, then `sudo ufw enable`. Don't open the relay port (7777, 8080) itself.
- A NIP-11 document with a name, description, contact and your pubkey.
- Rate limits, size limits and, if you need them, a write policy ([Configuration](./configuration.md)).
- Backups of the data directory, tested by restoring once.
- Monitoring. strfry serves Prometheus metrics at `/metrics` on the relay port; block that path at the proxy if you don't want it public.

Then pick a server: [Hosting](./hosting.md).
