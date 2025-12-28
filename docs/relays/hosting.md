---
sidebar_position: 6
title: Hosting Options
description: Where to host your Nostr relay
---

# Hosting Options

This page covers hosting providers and options for running a Nostr relay.

## Requirements

### Minimum Specs

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 core | 2+ cores |
| RAM | 1 GB | 4+ GB |
| Storage | 20 GB SSD | 100+ GB SSD |
| Bandwidth | 1 TB/month | Unmetered |
| OS | Ubuntu 20.04+ | Ubuntu 22.04 LTS |

### Network Requirements

- IPv4 address (static preferred)
- Port 443 (HTTPS/WSS)
- Low latency connection
- Stable uptime

## Value Providers

Budget-friendly options with good performance.

### Hetzner

**Location:** Germany, Finland, USA

**Pricing:** From €3.79/month

**Pros:**
- Excellent price/performance
- High-quality network
- Dedicated resources

**Cons:**
- Limited US locations
- Strict terms of service

```bash
# Recommended plans
CX11: 1 vCPU, 2GB RAM, 20GB - €3.79/mo
CX21: 2 vCPU, 4GB RAM, 40GB - €5.69/mo
CX31: 2 vCPU, 8GB RAM, 80GB - €9.49/mo
```

### Contabo

**Location:** Germany, USA, Singapore, Japan

**Pricing:** From $5.99/month

**Pros:**
- Very affordable
- Generous resources
- Global locations

**Cons:**
- Can be oversold
- Support varies

### OVHcloud

**Location:** France, Canada, USA, APAC

**Pricing:** From $3.50/month

**Pros:**
- Good network
- DDoS protection included
- Flexible options

### Vultr

**Location:** 25+ worldwide

**Pricing:** From $5/month

**Pros:**
- Many locations
- Easy interface
- Hourly billing

**Cons:**
- Slightly higher pricing

### Netcup

**Location:** Germany, Austria

**Pricing:** From €2.99/month

**Pros:**
- Reliable
- Good network

### DigitalOcean

**Location:** 15+ worldwide

**Pricing:** From $6/month

**Pros:**
- Easy to use
- Great documentation
- Team features

**Cons:**
- Higher pricing

## Cryptocurrency-Friendly

Accept Bitcoin/Lightning payments.

### Bitcoin-VPS.com

**Pricing:** Varies by plan

**Pros:**
- Pay with Bitcoin/Lightning
- Privacy focused

### Bitlaunch

**Pricing:** From $10/month

**Pros:**
- Multiple providers
- Pay with crypto

## Dedicated Servers

For high-performance relays.

### Kimsufi

**Pricing:** From €4.99/month

**Pros:**
- Dedicated hardware
- Unlimited bandwidth

### Hetzner Dedicated

**Pricing:** From €35/month

**Pros:**
- Excellent performance
- SSD storage

## Cloud Platforms

### AWS

```bash
# Recommended instance
t3.small: 2 vCPU, 2GB RAM - ~$15/month
```

**Pros:**
- Scalable
- Many services

**Cons:**
- Complex pricing
- Can be expensive

### Google Cloud

```bash
# Recommended instance
e2-small: 2 vCPU, 2GB RAM - ~$13/month
```

### Oracle Cloud

**Free tier:** 4 OCPUs, 24GB RAM (ARM)

**Pros:**
- Generous free tier
- ARM instances

## Edge/CDN Platforms

### Fly.io

Deploy globally at the edge.

```bash
# Deploy strfry
fly launch
fly deploy
```

**Pros:**
- Global deployment
- Simple scaling

### Railway

```bash
# One-click deploy
railway up
```

## Managed Options

### relay.tools

Managed relay hosting service.

**Pros:**
- No server management
- Easy setup

### Premium Relays

Some relays offer paid hosting or membership.

## Comparison Table

| Provider | Price/mo | Locations | Best For |
|----------|----------|-----------|----------|
| Hetzner | €3.79+ | EU, US | Value |
| Contabo | $5.99+ | Global | Budget |
| Vultr | $5+ | 25+ | Flexibility |
| DigitalOcean | $6+ | 15+ | Beginners |
| OVHcloud | $3.50+ | Global | DDoS protection |
| Kimsufi | €4.99+ | EU | Dedicated |
| Fly.io | $5+ | Edge | Low latency |

## Choosing a Provider

### For Personal Relay

- Hetzner CX11 or Contabo VPS S
- Low cost, sufficient resources
- Single location fine

### For Community Relay

- Hetzner CX21 or Vultr 2GB
- More headroom for growth
- Consider multiple locations

### For High-Traffic Relay

- Dedicated server
- Multiple instances with load balancing
- Consider managed database

## Setup Checklist

1. [ ] Choose provider and plan
2. [ ] Set up server with Ubuntu 22.04
3. [ ] Configure firewall (UFW)
4. [ ] Install relay software
5. [ ] Set up reverse proxy
6. [ ] Configure DNS
7. [ ] Enable monitoring
8. [ ] Set up backups

## See Also

- [Running a Relay](./running-a-relay)
- [Reverse Proxy](./reverse-proxy)
- [Configuration](./configuration)
