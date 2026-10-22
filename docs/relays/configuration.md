---
sidebar_position: 4
title: Relay Configuration
description: Configuring Nostr relay software
---

# Relay Configuration

The settings you are most likely to change for strfry, nostr-rs-relay and nostream. Every key and default below is copied from the project's own sample config as of October 2026: [strfry.conf](https://github.com/hoytech/strfry/blob/master/strfry.conf), nostr-rs-relay [config.toml](https://github.com/scsibug/nostr-rs-relay/blob/master/config.toml), and nostream [default-settings.yaml](https://github.com/cameri/nostream/blob/main/resources/default-settings.yaml) plus [CONFIGURATION.md](https://github.com/cameri/nostream/blob/main/CONFIGURATION.md). Keys change between releases, so check the sample that ships with your version.

## strfry

strfry reads the first config it finds: the `--config` option, then `$STRFRY_CONFIG`, then `/etc/strfry.conf`, then `./strfry.conf`. The file uses [taocpp config](https://github.com/taocpp/config/blob/main/doc/Writing-Config-Files.md) syntax, not YAML or TOML. Only `db` is required; everything else has a default. Many keys reload without a restart; the sample marks the ones that need one with "(restart required)".

Keys in this table are written with dots for nesting: `relay.info.name` is `name` inside `info { }` inside `relay { }`.

| Key | Default | What it does |
|---|---|---|
| `db` | `"./strfry-db/"` | LMDB directory. |
| `relay.bind` | `"127.0.0.1"` | Listen address. Use `0.0.0.0` only without a local proxy, or in a container. |
| `relay.port` | `7777` | WebSocket port. |
| `relay.realIpHeader` | `""` | Header holding the client IP behind a proxy, e.g. `"x-real-ip"`. Must be lower case. |
| `relay.nofiles` | `524288` | Open-file limit to request from the OS (`0` = don't set). |
| `relay.info.name`, `description`, `pubkey`, `contact`, `icon`, `banner`, `privacy`, `terms` | | NIP-11 fields. `relay.info.self` is the relay's own pubkey. |
| `relay.auth.enabled` | `true` | NIP-42 AUTH. |
| `relay.auth.serviceUrl` | `""` | Your public `wss://` URL. Needed to validate AUTH responses. |
| `relay.auth.restrictedReadKinds` | `"4, 1059"` | Kinds that need AUTH to read (DMs and gift wraps). |
| `relay.maxWebsocketPayloadSize` | `131072` | Largest incoming frame, bytes. |
| `relay.maxReqFilterSize` | `200` | Filters allowed in one `REQ`. |
| `relay.maxSubsPerConnection` | `200` | Open subscriptions per connection. |
| `relay.maxFilterLimit` | `500` | Most events returned per filter. |
| `relay.autoPingSeconds` | `55` | WebSocket ping interval. Keep it below your proxy's idle timeout. |
| `relay.writePolicy.plugin` | `""` | Path to a write-policy plugin (below). |
| `relay.negentropy.enabled` | `true` | NIP-77 sync. |
| `relay.filterValidation.*` | `enabled = false` | Optional stricter `REQ` rules: filters per REQ, kinds per filter, allowed kinds, require an author or tag. |
| `events.maxEventSize` | `65536` | Largest event (normalised JSON), bytes. |
| `events.rejectEventsNewerThanSeconds` | `900` | Reject events dated more than 15 minutes ahead. |
| `events.rejectEventsOlderThanSeconds` | `94608000` | Reject events older than 3 years. |
| `events.maxNumTags` | `2000` | Tags per event. |
| `events.maxTagValSize` | `1024` | Bytes per tag value. |

This is how the NIP-11 and network parts look in the sample file (comments shortened):

```
relay {
    bind = "127.0.0.1"
    port = 7777
    realIpHeader = ""

    auth {
        enabled = true
        serviceUrl = ""
    }

    info {
        name = "strfry default"
        description = "This is a strfry instance."
        pubkey = ""
        contact = ""
    }
}
```

The sample also has `dbParams`, `relay.compression`, `relay.logging` and `relay.numThreads` blocks. Leave them alone unless you are tuning a busy relay.

### Write-policy plugins

strfry keeps policy (allowlists, rate limits, spam rules) out of the core. A plugin is a long-running program: strfry writes one JSON object per line to its stdin and reads one JSON line back for each. Don't read stdin to the end; handle it line by line.

Each input line has `type` (always `"new"`), `event`, `receivedAt`, `sourceType` (`IP4`, `IP6`, `Import`, `Stream`, `Sync` or `Stored`), `sourceInfo` (usually the IP) and, after NIP-42 AUTH, `authed` (the pubkey). The reply must contain the event's `id`, an `action` (`accept`, `reject` or `shadowReject`) and, for `reject`, a `msg` sent to the client. Details: [docs/plugins.md](https://github.com/hoytech/strfry/blob/master/docs/plugins.md).

The allowlist example from the strfry docs, `whitelist.js`:

```js
#!/usr/bin/env node

const whiteList = {
    '003ba9b2c5bd8afeed41a4ce362a8b7fc3ab59c25b6a1359cae9093f296dac01': true,
};

const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
    let req = JSON.parse(line);

    if (req.type !== 'new') {
        console.error("unexpected request type"); // will appear in strfry logs
        return;
    }

    let res = { id: req.event.id }; // must echo the event's id

    if (whiteList[req.event.pubkey]) {
        res.action = 'accept';
    } else {
        res.action = 'reject';
        res.msg = 'blocked: not on white-list';
    }

    console.log(JSON.stringify(res));
});
```

A kind allowlist in Python. Output must be one minified JSON line per event, flushed:

```python
#!/usr/bin/env python3
import json, sys

ALLOWED_KINDS = {0, 1, 3, 5, 7, 10002}

for line in sys.stdin:
    req = json.loads(line)
    if req.get("type") != "new":
        print("unexpected request type", file=sys.stderr)
        continue
    event = req["event"]
    res = {"id": event["id"]}
    if event["kind"] in ALLOWED_KINDS:
        res["action"] = "accept"
    else:
        res["action"] = "reject"
        res["msg"] = f"blocked: kind {event['kind']} not allowed"
    print(json.dumps(res, separators=(",", ":")), flush=True)
```

Install either one with `chmod a+x` and set `relay.writePolicy.plugin` to its path. strfry reloads the plugin when the file changes.

**Tested** by piping strfry-format input lines into both scripts, including a stdin that stays open (both answer each line at once):

```bash
echo '{"type":"new","event":{"id":"bb","pubkey":"ff","kind":4},"receivedAt":1,"sourceType":"IP4","sourceInfo":"1.2.3.4"}' \
  | ./kinds.py
# {"id":"bb","action":"reject","msg":"blocked: kind 4 not allowed"}
```

If clients see `error: internal error`, the plugin crashed or printed something strfry couldn't parse. Check the strfry log.

## nostr-rs-relay

Settings live in `config.toml` in the working directory (in Docker, `/usr/src/app/config.toml`). Most keys are commented out in the sample, which means the default applies.

| Section | Key | Default | What it does |
|---|---|---|---|
| `[info]` | `relay_url`, `name`, `description`, `pubkey`, `contact`, `relay_icon` | | NIP-11 fields. `pubkey` is 32-byte hex, not npub. |
| `[database]` | `engine` | `"sqlite"` | `sqlite` or `postgres` (Postgres support is marked experimental). |
| `[database]` | `data_directory` | `"."` | Where `nostr.db` lives. Also `--db dirname`. |
| `[database]` | `connection` | | Postgres connection string. |
| `[network]` | `address`, `port` | `"0.0.0.0"`, `8080` | Listen address. Set `127.0.0.1` behind a proxy. |
| `[network]` | `remote_ip_header` | | `"x-forwarded-for"`, or `"cf-connecting-ip"` behind Cloudflare. |
| `[network]` | `ping_interval` | `300` | WebSocket ping, seconds. |
| `[options]` | `reject_future_seconds` | `1800` | Reject events dated this far ahead. |
| `[limits]` | `messages_per_sec` | unlimited | Events per second for the whole server. Set it on a public relay. |
| `[limits]` | `subscriptions_per_min` | unlimited | Per client. The sample suggests about 10. |
| `[limits]` | `max_event_bytes`, `max_ws_message_bytes`, `max_ws_frame_bytes` | `131072` | Size limits. |
| `[limits]` | `event_kind_blacklist`, `event_kind_allowlist` | | Drop or allow by kind. |
| `[limits]` | `limit_scrapers` | `false` | Reject broad queries (kind-only, author-only). |
| `[authorization]` | `pubkey_whitelist` | | Only these pubkeys may publish. |
| `[authorization]` | `nip42_auth`, `nip42_dms` | `false` | NIP-42 AUTH; send DMs (kinds 4, 44) and gift wraps (1059) only to their authenticated recipients. |
| `[verified_users]` | `mode` | `"disabled"` | NIP-05 gating: `enabled`, `passive` or `disabled`. |
| `[verified_users]` | `verify_expiration`, `verify_update_frequency` | `"1 week"`, `"24 hours"` | How long a NIP-05 check is valid, and how often to recheck. |
| `[grpc]` | `event_admission_server` | | External service that accepts or rejects each event (`proto/nauthz.proto`). |
| `[pay_to_relay]` | `enabled`, `processor`, `admission_cost`, `node_url` | `false` | Paid admission through LNbits or Core Lightning (`ClnRest`). |

The `[network]` part for a relay behind a local proxy:

```toml
[network]
address = "127.0.0.1"
port = 8080
remote_ip_header = "x-forwarded-for"
```

## nostream

nostream has two places for settings:

- **`.env`** for secrets and connections. Only `SECRET` is required; `.env.example` lists the rest: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (or `DB_URI`), `REDIS_HOST`, `REDIS_PORT` (or `REDIS_URI`), `RELAY_PORT` (default `8008`), `WORKER_COUNT`, and `NOSTR_CONFIG_DIR`. The default database name and user are both `nostr_ts_relay`.
- **`.nostr/settings.yaml`** for relay policy. The first run copies it from `resources/default-settings.yaml`. Changes are picked up without a restart.

| Key | Default | What it does |
|---|---|---|
| `info.relay_url`, `name`, `description`, `pubkey`, `contact`, `terms_of_service` | placeholders | NIP-11 fields. Replace them. |
| `network.remoteIpHeader` | commented out | `x-forwarded-for` or `cf-connecting-ip`. Only honoured from `network.trustedProxies`. |
| `network.trustedProxies` | loopback and `10.10.10.1` | Proxies allowed to set that header. |
| `network.maxPayloadSize` | `524288` | Largest message, bytes. |
| `payments.enabled`, `payments.processor` | `false`, `zebedee` | Admission fees. Processors are configured under `paymentsProcessors` (zebedee, lnbits, lnurl, nodeless, opennode, nwc). |
| `payments.feeSchedules.admission[]` | disabled, 1,000,000 msats | Fee per pubkey, with pubkey and kind whitelists. |
| `nip05.mode` | `disabled` | `enabled`, `passive` or `disabled`. |
| `nip42.authRequired` | `false` | Require AUTH as the author before publishing. |
| `nip42.restrictedReads` | disabled, kinds 4 and 1059 | Deliver these kinds only to their authenticated author or recipient. |
| `nip43.enabled` | `false` | Invite-based membership. Blocks non-members from publishing. |
| `nip50.enabled` | `false` | Full-text search. |
| `nip77.enabled` | `false` | Negentropy sync (Postgres backend only). |
| `wot.enabled`, `wot.seedPubkey` | `false` | Web-of-trust graph from kind 3 lists. |
| `limits.event.kind.whitelist` / `blacklist` | `[]` | Allow or block kinds. |
| `limits.event.pubkey.whitelist` / `blacklist` | `[]` | Allow or block pubkeys. |
| `limits.event.createdAt.maxPositiveDelta` | `900` | Seconds into the future. |
| `limits.event.rateLimits[]` | per-kind rules | Events per period, by kind range. |
| `limits.event.retention.maxDays` | `-1` (keep) | Delete events older than this. |
| `limits.client.subscription.maxSubscriptions`, `maxFilters`, `maxLimit` | `10`, `10`, `5000` | Per-client query limits. |
| `mirroring.static[]` | `[]` | Relays to mirror from. See [Sync Tools](./sync-tools.md). |
| `admin.enabled` | `false` | Web admin console (needs `ADMIN_PASSWORD` in `.env`). |

The full list with explanations is in [CONFIGURATION.md](https://github.com/cameri/nostream/blob/main/CONFIGURATION.md).

## Settings every public relay should get right

| Concern | strfry | nostr-rs-relay | nostream |
|---|---|---|---|
| Real client IP behind a proxy | `relay.realIpHeader` | `network.remote_ip_header` | `network.remoteIpHeader` + `trustedProxies` |
| NIP-11 identity | `relay.info.*` | `[info]` | `info.*` |
| NIP-42 AUTH | `relay.auth.enabled` + `serviceUrl` | `authorization.nip42_auth` | `nip42.*` |
| Who may write | write-policy plugin | `pubkey_whitelist`, gRPC, pay-to-relay | `limits.event.pubkey.*`, payments, NIP-43 |
| Which kinds | plugin, `filterValidation.allowedKinds` (reads) | `event_kind_allowlist` | `limits.event.kind.*` |

Checking your NIP-11 output after a change: `curl -H 'Accept: application/nostr+json' https://relay.example.com`. The fields are described on [Relay Information](../reference/relay-info.md).
