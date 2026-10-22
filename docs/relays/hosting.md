---
sidebar_position: 6
title: Hosting Options
description: Where to host your Nostr relay
---

# Hosting Options

Any Linux VPS with a public IP works. Use a current LTS release such as Ubuntu 24.04 or Debian 13.

## What you need

- **Personal or small community relay:** 1–2 GB RAM, 1–2 vCPU, 20–50 GB SSD. strfry's own deployment guide uses a 1 vCPU / 2 GB / 50 GB NVMe VPS.
- **Busy public relay:** more RAM (LMDB and Postgres use it as cache), fast NVMe disk, and plenty of bandwidth.
- **A domain name** with an A (and AAAA) record pointing at the server, for TLS.
- **Ports 80 and 443** reachable for the [reverse proxy](./reverse-proxy.md). Keep the relay port itself closed.

## Bandwidth matters more than CPU

A public relay sends far more than it receives: each event goes out to every subscriber whose filter matches. A Blossom media server serves images and video. Egress is usually the biggest cost.

- Compare **included traffic** and the **price per extra TB**, not only the monthly price.
- Big clouds (AWS, GCP, Azure) charge per GB out. Budget VPS hosts usually include several TB.
- [getdeploying.com's egress table](https://getdeploying.com/reference/data-egress) compares bandwidth prices across providers.
- Put a CDN or cache in front of Blossom media. Blobs are addressed by hash and never change, so they cache well.

## Providers

Links checked Oct 2026. Plans and prices change often, so check the provider's site. This is a list, not an endorsement.

| Type | Providers |
|---|---|
| Budget VPS and dedicated | [Hetzner](https://www.hetzner.com/cloud/), [Contabo](https://contabo.com/en/vps/), [netcup](https://www.netcup.com/en/server/vps), [OVHcloud](https://www.ovhcloud.com/), [Kimsufi](https://www.kimsufi.com/en/) |
| Mainstream clouds | [DigitalOcean](https://www.digitalocean.com/), [Vultr](https://www.vultr.com/), [Akamai Cloud (Linode)](https://www.linode.com/), [Scaleway](https://www.scaleway.com/en/), [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/) (Always Free Arm instances) |
| Pay with bitcoin | [bitcoin-vps.com](https://bitcoin-vps.com/) (a directory of hosts that take bitcoin and Lightning), [Njalla](https://njal.la/) |
| Compare offers | [Server Hunter](https://www.serverhunter.com/) |

## Other options

- **Hosted relays:** services such as [relay.tools](https://relay.tools/) run a relay for you, paid in sats.
- **Serverless:** [nosflare](https://github.com/Spl0itable/nosflare) runs a relay on Cloudflare Workers.
- **At home:** [Citrine](https://github.com/greenart7c3/Citrine) on Android, or HAVEN on a home server behind a tunnel.

The wiki keeps a longer, annotated list: [Hosting](https://github.com/nostrcg/devguide/wiki/Hosting). Once you have a server, follow [Running a Relay](./running-a-relay.md).
