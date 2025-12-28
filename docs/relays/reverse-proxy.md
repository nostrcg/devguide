---
sidebar_position: 5
title: Reverse Proxy
description: Setting up reverse proxy for Nostr relays
---

# Reverse Proxy Configuration

A reverse proxy handles SSL termination and routes traffic to your relay. This page covers setup for popular options.

## Why Use a Reverse Proxy?

- **SSL/TLS termination** - Handle HTTPS/WSS encryption
- **Automatic certificates** - Let's Encrypt integration
- **Load balancing** - Distribute traffic across multiple relays
- **Security** - Hide relay server, add rate limiting
- **Static content** - Serve NIP-11 info and landing pages

## Caddy (Recommended)

Caddy is the simplest option with automatic HTTPS.

### Installation

```bash
# Ubuntu/Debian
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### Basic Configuration

Edit `/etc/caddy/Caddyfile`:

```
relay.example.com {
    reverse_proxy localhost:7777
}
```

That's it! Caddy automatically obtains and renews SSL certificates.

### Advanced Configuration

```
relay.example.com {
    # Handle WebSocket upgrades
    @websocket {
        header Upgrade websocket
    }
    reverse_proxy @websocket localhost:7777

    # Handle NIP-11 info requests
    @nostr_info {
        header Accept application/nostr+json
    }
    reverse_proxy @nostr_info localhost:7777

    # Serve static landing page
    file_server {
        root /var/www/relay
    }

    # Enable compression
    encode gzip

    # Logging
    log {
        output file /var/log/caddy/relay.log
    }
}
```

### Apply Configuration

```bash
sudo systemctl reload caddy
```

## nginx

More control, but requires manual certificate management.

### Installation

```bash
sudo apt install nginx certbot python3-certbot-nginx
```

### Get SSL Certificate

```bash
sudo certbot certonly --nginx -d relay.example.com
```

### Configuration

Create `/etc/nginx/sites-available/relay`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name relay.example.com;
    return 301 https://$server_name$request_uri;
}

# Main server block
server {
    listen 443 ssl http2;
    server_name relay.example.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/relay.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/relay.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # WebSocket proxy
    location / {
        proxy_pass http://127.0.0.1:7777;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/relay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Auto-Renew Certificates

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet && systemctl reload nginx
```

## HAProxy

For high-availability and load balancing.

### Configuration

```haproxy
global
    log stdout format raw local0
    maxconn 4096

defaults
    mode http
    timeout connect 5s
    timeout client 60s
    timeout server 60s
    option http-server-close

frontend https_front
    bind *:443 ssl crt /etc/haproxy/certs/relay.pem

    # Detect WebSocket
    acl is_websocket hdr(Upgrade) -i websocket

    # Route to relay backend
    use_backend relay_backend if is_websocket
    default_backend relay_backend

backend relay_backend
    # Enable WebSocket
    option http-server-close
    timeout tunnel 1h

    # Health check
    option httpchk GET /

    # Relay servers
    server relay1 127.0.0.1:7777 check
    server relay2 127.0.0.1:7778 check backup
```

## Traefik

Modern edge router with Docker integration.

### docker-compose.yml

```yaml
version: '3'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "443:443"
      - "8080:8080"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./letsencrypt:/letsencrypt"

  relay:
    image: hoytech/strfry
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.relay.rule=Host(`relay.example.com`)"
      - "traefik.http.routers.relay.entrypoints=websecure"
      - "traefik.http.routers.relay.tls.certresolver=letsencrypt"
      - "traefik.http.services.relay.loadbalancer.server.port=7777"
```

## Testing

### Verify WebSocket

```bash
# Using websocat
websocat wss://relay.example.com

# Send test request
["REQ", "test", {"limit": 1}]
```

### Verify NIP-11

```bash
curl -H "Accept: application/nostr+json" https://relay.example.com/
```

### Check SSL

```bash
openssl s_client -connect relay.example.com:443
```

## Common Issues

### "502 Bad Gateway"

- Relay not running on expected port
- Check: `curl http://localhost:7777`

### "WebSocket connection failed"

- Missing upgrade headers
- Check nginx/Caddy WebSocket configuration

### "Certificate errors"

- Wrong domain in certificate
- Expired certificate
- Check: `certbot certificates`

## See Also

- [Running a Relay](./running-a-relay)
- [Configuration](./configuration)
- [Hosting](./hosting)
