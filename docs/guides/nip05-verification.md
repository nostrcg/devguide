---
sidebar_position: 9
title: NIP-05 Verification
description: Serve and check name@domain identifiers for Nostr public keys
---

# NIP-05 Verification

[NIP-05](https://github.com/nostr-protocol/nips/blob/master/05.md) maps an email-like identifier such as `bob@example.com` to a public key. The user puts it in the `nip05` field of their kind 0 profile. Clients fetch `https://example.com/.well-known/nostr.json?name=bob` and show the identifier only if the key it returns matches the profile's author.

NIP-05 *identifies* a user. It doesn't vouch for them. It shows that whoever controls the domain points that name at this key, which carries weight only when the domain itself means something (a company, a project, a person's own site).

The rules that trip people up:

- The local part may only use `a-z0-9-_.`.
- Keys in the response are **lowercase hex**, never `npub`.
- The endpoint **MUST NOT redirect**, and clients **MUST ignore redirects**.
- `_@example.com` is the "root" identifier. Clients may display it as just `example.com`.
- Serve `Access-Control-Allow-Origin: *`, or browser clients can't read the file.
- Clients must follow the **public key**, not the address. If the address later points elsewhere, stop showing it, but don't switch the follow to the new key.

## Serve a static nostr.json

Put this file at `/.well-known/nostr.json` on your domain. The `relays` object is optional but recommended: it tells clients where to find each key's events.

```json title=".well-known/nostr.json"
{
  "names": {
    "_": "b0635d6a9851d3aed0cd6c495b282167acf761729078d975fc341b22650b07b9",
    "bob": "b0635d6a9851d3aed0cd6c495b282167acf761729078d975fc341b22650b07b9"
  },
  "relays": {
    "b0635d6a9851d3aed0cd6c495b282167acf761729078d975fc341b22650b07b9": ["wss://relay.example.com"]
  }
}
```

A static file ignores the `?name=` query and returns every name, which is fine for a few users. The server must return it with a JSON content type and the CORS header. Both configs below were tested in October 2026 (nginx 1.28, Caddy 2.11, on localhost with a local root) with `curl -si 'http://localhost/.well-known/nostr.json?name=bob'`.

**nginx**, inside your `server { }` block:

```nginx
location = /.well-known/nostr.json {
    default_type application/json;
    add_header Access-Control-Allow-Origin "*" always;
}
```

**Caddy:**

```caddyfile
example.com {
	root * /var/www/example
	header /.well-known/nostr.json Access-Control-Allow-Origin *
	file_server
}
```

Caddy serves `.json` files as `application/json` without extra configuration. Whatever server you use, make sure `http://` → `https://` or `www` redirects don't apply to this path when clients request the canonical `https://<domain>` URL.

**GitHub Pages** (and similar static hosts) skip dot-folders unless the repository has a `.nojekyll` file at its root. GitHub Pages doesn't let you set CORS headers, but it already sends `Access-Control-Allow-Origin: *` on its responses.

## Serve names dynamically

For many users, answer per name from your database. Tested with Node 24:

```js title="nip05-server.mjs"
import http from 'node:http'

// name -> { pubkey, relays }; load this from your database
const USERS = {
  bob: {
    pubkey: 'b0635d6a9851d3aed0cd6c495b282167acf761729078d975fc341b22650b07b9',
    relays: ['wss://relay.example.com'],
  },
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname !== '/.well-known/nostr.json') {
    res.writeHead(404).end()
    return
  }
  const name = url.searchParams.get('name') ?? ''
  const body = { names: {}, relays: {} }
  // NIP-05 local parts may only use a-z 0-9 - _ .
  const user = /^[a-z0-9._-]+$/.test(name) ? USERS[name] : undefined
  if (user) {
    body.names[name] = user.pubkey
    body.relays[user.pubkey] = user.relays
  }
  res.writeHead(200, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
  })
  res.end(JSON.stringify(body))
}).listen(process.env.PORT ?? 8080)
```

```bash
$ curl -s 'http://localhost:8080/.well-known/nostr.json?name=bob'
{"names":{"bob":"b0635d6a9851d3aed0cd6c495b282167acf761729078d975fc341b22650b07b9"},"relays":{"b0635d6a9851d3aed0cd6c495b282167acf761729078d975fc341b22650b07b9":["wss://relay.example.com"]}}
```

Unknown or invalid names get an empty `names` object, not an error page. Put it behind your HTTPS reverse proxy, with no redirects on this path.

## Set nip05 on a profile

Kind 0 is replaceable: a new profile replaces the old one entirely. To add `nip05`, fetch the newest profile, change that one field and publish the result. If no profile is found, the script below refuses to write. Tested against `nak serve` with a throwaway key (`export NOSTR_SECRET_KEY=$(nak key generate)`, `R=ws://localhost:10547`):

```bash
PK=$(echo "$NOSTR_SECRET_KEY" | nak key public)

nak req -k 0 -a $PK $R </dev/null > profile.jsonl
if [ -s profile.jsonl ]; then
  # newest profile, with only nip05 changed
  jq -s -c --arg id "bob@example.com" 'max_by(.created_at) | {kind, tags,
      content: (.content | fromjson | .nip05 = $id | tojson)}' profile.jsonl \
    | nak event $R
else
  echo "no profile found: not publishing"
fi
```

On a real account, fetch from the user's write relays and `wss://purplepag.es`, not one relay. The wiki's [Profile metadata](https://github.com/nostrcg/devguide/wiki/Profile) page has more on kind 0. In an app, the same fetch-merge-publish pattern is in [Building clients](./building-clients.md).

## Check an identifier in a client

nostr-tools has this built in. `queryProfile` fetches with `redirect: "manual"` and treats anything but a `200` as a failure, so it already ignores redirects. Tested with nostr-tools 2.25.2:

```js
import * as nip05 from 'nostr-tools/nip05'

// identifier -> pubkey (+ relay hints), or null
const pointer = await nip05.queryProfile('_@fiatjaf.com')
console.log(pointer)

// does this profile's nip05 really point at its author?
const ok = await nip05.isValid(
  '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d', '_@fiatjaf.com')
console.log(ok)
```

```text
{
  pubkey: '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d',
  relays: [ 'wss://pyramid.fiatjaf.com', 'wss://relay.westernbtc.com' ]
}
true
```

In a client:

- Run `isValid(event.pubkey, profile.nip05)` when you render a profile. Show the identifier only if it returns `true`.
- Cache results for a few hours, keyed by pubkey and identifier, and re-check in the background. Domains change hands.
- Treat a network failure as "unverified", not "invalid". In a browser, a missing CORS header looks exactly like a network error, so tell the user to check it.
- For search, `queryProfile('bob@example.com')` gives you the pubkey and relay hints. Then fetch that key's kind 0 and confirm its `nip05` field matches.

If you fetch the file yourself, use `fetch(url, { redirect: 'manual' })` and accept only a `200`.

## Getting an identifier

The simplest identifier is one on a domain you control, served with one of the configs above. Many clients and hosting services also hand out `name@theirdomain` identifiers, but that ties the name to their domain, so it shows who issued the address, not anything about you.
