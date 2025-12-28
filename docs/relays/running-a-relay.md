---
sidebar_position: 3
title: Running a Relay
description: Step-by-step guide to running your own Nostr relay
---

# Running a Relay

This guide walks you through setting up and running your own Nostr relay.

## Prerequisites

- A server (VPS or local machine)
- Domain name (for production)
- Basic command-line knowledge

## Quick Start Options

### Fastest: fonstr (Testing)

```bash
npx fonstr
```

Your relay is now running at `ws://localhost:4444`.

### Simple: nostr-rs-relay

```bash
# Install
cargo install nostr-rs-relay

# Run
nostr-rs-relay
```

Relay runs at `ws://localhost:8080`.

### Production: strfry with Docker

```bash
# Create data directory
mkdir -p strfry-data

# Run
docker run -d \
  --name strfry \
  -p 7777:7777 \
  -v $(pwd)/strfry-data:/app/strfry-db \
  hoytech/strfry

# Check logs
docker logs strfry
```

## Full Production Setup

### 1. Provision a Server

**Recommended specs:**
- 2+ CPU cores
- 4GB+ RAM
- 50GB+ SSD storage
- Ubuntu 22.04 LTS

**Providers:** See [Hosting Options](./hosting)

### 2. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install basics
sudo apt install -y git curl build-essential
```

### 3. Install Relay Software

#### Option A: strfry

```bash
# Install dependencies
sudo apt install -y git g++ make libssl-dev zlib1g-dev \
  liblmdb-dev libflatbuffers-dev libsecp256k1-dev libzstd-dev

# Clone and build
git clone https://github.com/hoytech/strfry.git
cd strfry
git submodule update --init
make setup-golpe
make -j$(nproc)

# Install
sudo cp strfry /usr/local/bin/
```

#### Option B: nostream

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone nostream
git clone https://github.com/Cameri/nostream.git
cd nostream

# Configure
cp .env.sample .env
nano .env  # Edit settings

# Start
docker compose up -d
```

### 4. Configure the Relay

Create configuration file (strfry example):

```bash
sudo mkdir -p /etc/strfry
sudo nano /etc/strfry/strfry.conf
```

```yaml
db = "/var/lib/strfry/db"

relay {
    bind = "127.0.0.1"
    port = 7777

    info {
        name = "My Relay"
        description = "A personal Nostr relay"
        pubkey = "your-hex-pubkey-here"
        contact = "admin@yourdomain.com"
    }

    limits {
        maxMessageLength = 131072
        maxSubscriptions = 20
        maxFilters = 10
        maxEventTags = 100
    }
}
```

### 5. Create Systemd Service

```bash
sudo nano /etc/systemd/system/strfry.service
```

```ini
[Unit]
Description=strfry Nostr Relay
After=network.target

[Service]
Type=simple
User=nostr
Group=nostr
WorkingDirectory=/var/lib/strfry
ExecStart=/usr/local/bin/strfry --config=/etc/strfry/strfry.conf relay
Restart=always
RestartSec=5
LimitNOFILE=1000000

[Install]
WantedBy=multi-user.target
```

```bash
# Create user and directories
sudo useradd -r -s /bin/false nostr
sudo mkdir -p /var/lib/strfry/db
sudo chown -R nostr:nostr /var/lib/strfry

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable strfry
sudo systemctl start strfry

# Check status
sudo systemctl status strfry
```

### 6. Set Up Reverse Proxy

See [Reverse Proxy Configuration](./reverse-proxy) for detailed instructions.

Quick Caddy setup:

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Configure
sudo nano /etc/caddy/Caddyfile
```

```
relay.yourdomain.com {
    reverse_proxy localhost:7777
}
```

```bash
sudo systemctl reload caddy
```

### 7. Test Your Relay

```bash
# Test WebSocket connection
echo '["REQ", "test", {"limit": 1}]' | websocat wss://relay.yourdomain.com

# Check NIP-11 info
curl -H "Accept: application/nostr+json" https://relay.yourdomain.com/
```

## Maintenance

### Monitoring

```bash
# View logs
sudo journalctl -u strfry -f

# Check resource usage
htop
```

### Backup

```bash
# strfry (LMDB)
./strfry export > backup-$(date +%Y%m%d).jsonl

# nostream (PostgreSQL)
docker exec nostream-db pg_dump -U nostr nostr > backup.sql
```

### Updates

```bash
# strfry
cd strfry
git pull
make -j$(nproc)
sudo systemctl restart strfry

# nostream
cd nostream
git pull
docker compose pull
docker compose up -d
```

## Troubleshooting

### Connection Refused

```bash
# Check if relay is running
sudo systemctl status strfry

# Check if port is open
sudo ss -tlnp | grep 7777

# Check firewall
sudo ufw status
sudo ufw allow 7777
```

### SSL Errors

```bash
# Check Caddy logs
sudo journalctl -u caddy -f

# Verify certificate
openssl s_client -connect relay.yourdomain.com:443
```

### High Memory Usage

- Check database size
- Review event retention policies
- Consider adding swap

## See Also

- [Configuration](./configuration)
- [Reverse Proxy](./reverse-proxy)
- [Hosting Options](./hosting)
