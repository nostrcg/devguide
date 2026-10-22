---
sidebar_position: 5
title: Reverse Proxy
description: Setting up reverse proxy for Nostr relays
---

# Reverse Proxy Configuration

Relays speak plain `ws://`. A reverse proxy in front adds TLS so clients can connect to `wss://relay.example.com`. The nginx, Caddy and HAProxy configs below were tested in October 2026 against a local relay (`nak serve`, and a khatru relay): they pass WebSocket upgrades, NIP-11 requests and the client's real IP.

## What every proxy must do

| Job | Why |
|---|---|
| Pass the WebSocket upgrade (`Upgrade` and `Connection` headers, HTTP/1.1 to the backend) | Without it, clients get a 400 or a plain HTTP page. |
| Keep idle connections open for a long time | Clients hold one socket for hours. Default proxy timeouts (60 s) drop them. Keep strfry's `autoPingSeconds` below the timeout. |
| Send `GET /` with `Accept: application/nostr+json` to the relay | That is the [NIP-11](../reference/relay-info.md) document. If a website shares the host, don't let it catch these requests. |
| Put the client IP in a header the relay trusts | Rate limits and IP bans need the real IP, not `127.0.0.1`. |

:::danger Overwrite `X-Forwarded-For`, don't append
nginx's `$proxy_add_x_forwarded_for` and HAProxy's `option forwardfor` add the client's IP after whatever the client sent. khatru-based relays (including HAVEN) take the first public IP in the header, so a client could forge its IP. Use `$remote_addr` in nginx and `set-header` in HAProxy. Caddy replaces the header by default. Bind the relay itself to `127.0.0.1` so only the proxy can reach it.
:::

Then tell the relay which header to read:

| Relay | Setting |
|---|---|
| strfry | `relay.realIpHeader = "x-real-ip"` in `strfry.conf` (lower case) |
| nostr-rs-relay | `remote_ip_header = "x-forwarded-for"` in `[network]` |
| nostream | `network.remoteIpHeader` and `network.trustedProxies` in `.nostr/settings.yaml` |
| khatru-based relays, HAVEN | always read `X-Forwarded-For`; bind to `127.0.0.1` |

Key details are on [Configuration](./configuration.md).

## nginx

The `location` block was tested with nginx 1.28 against a relay; the whole server block passes `nginx -t` with a test certificate. The certificate paths are the ones `certbot --nginx` creates.

```nginx
server {
    listen 443 ssl;
    server_name relay.example.com;
    ssl_certificate     /etc/letsencrypt/live/relay.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/relay.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:7777;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 1d;
        proxy_send_timeout 1d;
    }
}
```

Get the certificate (from strfry's [DEPLOYMENT.md](https://github.com/hoytech/strfry/blob/master/docs/DEPLOYMENT.md)):

```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d relay.example.com
```

The Debian and Ubuntu certbot package renews certificates with a systemd timer, so you don't need a cron job. For HTTP/2 on nginx 1.25.1 and later, add `http2 on;` inside the `server` block rather than `listen 443 ssl http2`. If the relay also serves Blossom uploads, add `client_max_body_size 100m;` (the default is 1 MB).

## Caddy

Caddy gets a certificate by itself, proxies WebSocket upgrades without extra config, and sets `X-Forwarded-For` to the real client IP. Tested with Caddy 2.11. Install it from the [Caddy docs](https://caddyserver.com/docs/install).

**Relay only:**

```caddyfile
relay.example.com {
	reverse_proxy localhost:7777
}
```

**Relay and a website on the same domain.** WebSocket and NIP-11 requests go to the relay; everything else gets the static site:

```caddyfile
relay.example.com {
	@websocket {
		header Connection *Upgrade*
		header Upgrade websocket
	}
	reverse_proxy @websocket localhost:7777

	@nip11 header Accept *application/nostr+json*
	reverse_proxy @nip11 localhost:7777

	root * /var/www/html
	file_server
}
```

The `@nip11` matcher only helps relays that answer NIP-11 at their WebSocket URL. fonstr 0.0.25 serves it at `/relay/info` instead.

## HAProxy

The `frontend` and `backend` were tested with HAProxy 3.2, and the whole file passes `haproxy -c`. `timeout tunnel` keeps WebSockets open after the upgrade. The `.pem` holds the certificate and key together, as in the [nostr-rs-relay reverse-proxy guide](https://github.com/scsibug/nostr-rs-relay/blob/master/docs/reverse-proxy.md).

```haproxy
defaults
    mode http
    timeout connect 5s
    timeout client 50s
    timeout server 50s

frontend fe_relay
    bind :443 ssl crt /etc/certs/relay.example.com.pem alpn h2,http/1.1
    bind :80
    http-request redirect scheme https code 301 unless { ssl_fc }
    http-request set-header X-Real-IP %[src]
    http-request set-header X-Forwarded-For %[src]
    default_backend relay

backend relay
    timeout tunnel 1h
    server relay 127.0.0.1:7777
```

The nostr-rs-relay guide says Firefox can have WebSocket trouble over HTTP/2 on HAProxy 2.3 and older. Upgrade HAProxy, or drop `h2` from `alpn`.

## Check it works

```bash
# NIP-11 document: JSON, not your website
curl -H 'Accept: application/nostr+json' https://relay.example.com

# WebSocket round trip
nak event -c 'proxy test' wss://relay.example.com
nak req -k 1 -l 1 wss://relay.example.com
```

:::tip
Behind Cloudflare's proxy, your relay sees Cloudflare's IP. Read the `CF-Connecting-IP` header instead (nostr-rs-relay: `remote_ip_header = "cf-connecting-ip"`; nostream: `remoteIpHeader: cf-connecting-ip`).
:::

Traefik and more examples: [nostr-rs-relay docs/reverse-proxy.md](https://github.com/scsibug/nostr-rs-relay/blob/master/docs/reverse-proxy.md). Apache and HAVEN-specific setups: the [HAVEN README](https://github.com/barrydeen/haven).
