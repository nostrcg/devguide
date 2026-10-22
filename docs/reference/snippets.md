---
sidebar_position: 5
title: Command Snippets
description: Tested command-line recipes for Nostr with nak, websocat, curl and jq
---

# Command Snippets

Copy-paste shell recipes for common Nostr jobs. Each one was run in October 2026 with
[nak](https://github.com/fiatjaf/nak) v0.21.2, websocat, `curl` and `jq`.

For every nak subcommand and flag, see the wiki's [nak cheat-sheet](https://github.com/nostrcg/devguide/wiki/NAK).
For more pipelines, see the wiki's [Snippets](https://github.com/nostrcg/devguide/wiki/Snippets) and
[websocat](https://github.com/nostrcg/devguide/wiki/Websocat) pages.

## Setup

```bash
# nak: install script from the README (Linux / macOS)
curl -sSL https://raw.githubusercontent.com/fiatjaf/nak/master/install.sh | sh
# or
go install github.com/fiatjaf/nak@latest
```

websocat: `brew install websocat`, `cargo install websocat`, or a binary from its
[releases](https://github.com/vi/websocat/releases). `jq` is in every package manager.

Write recipes go to a local throwaway relay, so start one in another terminal:

```bash
# ws://localhost:10547, in memory, gone when you stop it
nak serve
```

Every nak command that signs reads `$NOSTR_SECRET_KEY`. Use a throwaway key for these recipes:

```bash
export NOSTR_SECRET_KEY=$(nak key generate)
```

:::caution
With no `$NOSTR_SECRET_KEY` and no `--sec`, nak signs with a per-machine default key (`nak key default` shows it).
Don't pass a real key as `--sec <key>` on the command line, where it lands in shell history and `ps`. To use a real key,
type it without echo: `read -rs NOSTR_SECRET_KEY && export NOSTR_SECRET_KEY`.
:::

:::note
`nak req` and `nak event` read from stdin whenever stdin isn't a terminal. In scripts, loops and CI, add `</dev/null`
to each call, or nak waits for input forever.
:::

## Keys and encoding

```bash
# hex public key of your secret key (read from stdin, not argv)
echo "$NOSTR_SECRET_KEY" | nak key public

# hex → npub, npub → hex
nak encode npub <hex-pubkey>
nak decode npub1…

# nevent and nprofile with a relay hint
nak encode nevent --relay wss://relay.primal.net <event-id>
nak encode nprofile --relay wss://relay.primal.net <hex-pubkey>

# naddr for an addressable event
nak encode naddr -k 30023 -d my-article -a <hex-pubkey>
```

nak v0.21.2 has no `encode note`. Use `nevent`, which can also carry relay hints and the author. `nak decode` still reads `note1…` codes.

## Query relays

Filters take **hex** pubkeys and ids. Convert npubs with `nak decode` first.

```bash
PK=32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245

# an author's last 3 notes, with dates
nak req -k 1 -a $PK -l 3 wss://relay.primal.net \
  | jq -r '"\(.created_at | todate)  \(.content[0:60])"'

# profile from an indexer relay (content is JSON inside JSON)
nak req -k 0 -a $PK wss://purplepag.es \
  | jq -r .content | jq '{name, nip05}'

# how many accounts they follow
nak req -k 3 -a $PK wss://purplepag.es \
  | jq '[.tags[] | select(.[0]=="p")] | length'

# their relay list (NIP-65), with read/write markers
nak req -k 10002 -a $PK wss://purplepag.es \
  | jq -r '.tags[] | select(.[0]=="r") | "\(.[1]) \(.[2] // "read+write")"'

# notes with a hashtag
nak req -k 1 -t t=nostr -l 5 wss://relay.primal.net | jq -r .content

# notes from the last hour (GNU date; on macOS use: date -v-1H +%s)
nak req -k 1 -s "$(date -d '1 hour ago' +%s)" -l 10 wss://relay.primal.net
```

Different relays may hold different versions of a replaceable event. `nak fetch` asks the author's relays and
prints every version it finds. Keep the newest:

```bash
nak fetch -k 0 npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s \
  | jq -s 'max_by(.created_at) | .content | fromjson | .name'
```

### Full-text search (NIP-50)

Only relays that list `50` in `supported_nips` support search. `wss://search.nos.today` did in October 2026:

```bash
nak req -k 1 --search bitcoin -l 5 wss://search.nos.today | jq -r .content
```

### Count (NIP-45)

```bash
# follow lists that include $PK, as counted by one relay
nak count -k 3 -p $PK wss://relay.primal.net
```

The answer is one relay's count, not a network total.

## Threads, reactions and reposts

`-i` matches an event id. `-e` matches an `#e` tag, which is how replies, reactions and reposts point at their target.

```bash
ID=<hex-event-id>
R=wss://relay.primal.net

# the event itself
nak req -i $ID $R | jq -r .content

# replies
nak req -k 1 -e $ID $R | jq -r .content

# reactions, grouped
nak req -k 7 -e $ID $R | jq -r .content | sort | uniq -c | sort -rn

# who reposted it
nak req -k 6 -e $ID $R | jq -r .pubkey
```

## Publish (to the local relay)

```bash
R=ws://localhost:10547

# a note
nak event -c 'hello' $R

# a reply: root e-tag with a marker, and a p-tag for the author
nak event -c 'a reply' -t e="<root-id>;;root" -p <root-author-hex> $R

# a reaction
nak event -k 7 -c '+' -e <event-id> -p <author-hex> $R

# a long-form article (addressable: kind 30023 + d tag)
nak event -k 30023 -d my-article -t title='Hello' -c '# Title' $R

# ask relays to delete one of your events (NIP-09)
nak event -k 5 -e <your-event-id> $R
```

With no relay URL, `nak event` only prints the signed event.

:::danger
Kinds `0` (profile), `3` (follow list) and `10002` (relay list) are **replaceable**. Publishing one with your real key replaces
the old one, so a snippet that publishes a fresh follow list wipes your real follows. Always fetch the current event,
edit it, and publish the edited version. The wiki's [Snippets](https://github.com/nostrcg/devguide/wiki/Snippets) page shows
the safe relay-list flow.
:::

## Verify

```bash
# exit 0 if id and signature are valid
nak event -c test | nak verify && echo ok

# a tampered event fails
nak event -c test | jq -c '.content="tampered"' | nak verify
```

## Back up, restore and sync

```bash
# export everything one author has on a relay
nak req -a <hex-pubkey> wss://relay.primal.net > backup.jsonl

# re-publish it, as-is, to another relay (signatures are kept)
while read -r ev; do
  echo "$ev" | nak event ws://localhost:10547
done < backup.jsonl
```

Relays clamp results to their `max_limit` (see [Relay Information](relay-info.md)), so a big export needs several
requests paged with `-u <until-timestamp>`.

To copy only what's missing, use negentropy sync ([NIP-77](https://github.com/nostr-protocol/nips/blob/master/77.md)).
Both relays must support it; for local tests start them with `nak serve --negentropy`:

```bash
# two-way: each side gets what the other has; -k, -a and -s narrow it
timeout 60 nak sync ws://localhost:10547 ws://localhost:10548
```

If either side lacks NIP-77, `sync` hangs without an error, hence the `timeout`.

## Relays over raw WebSocket

websocat shows exactly what a relay sends. `-n` keeps the socket open after stdin ends, so pair it with `timeout`:

```bash
echo '["REQ","x",{"kinds":[1],"limit":3}]' \
  | timeout 5 websocat -n wss://relay.primal.net \
  | jq -r 'select(.[0]=="EVENT") | .[2].content'

# REQ then CLOSE
printf '%s\n' '["REQ","s",{"kinds":[1],"limit":1}]' '["CLOSE","s"]' \
  | timeout 5 websocat -n wss://relay.primal.net
```

## Sample the firehose

```bash
# 30 seconds of new notes (-l 0 skips stored ones)
timeout 30 nak req -k 1 -l 0 --stream wss://relay.primal.net > sample.jsonl
wc -l < sample.jsonl

# busiest authors in the sample
jq -r .pubkey sample.jsonl | sort | uniq -c | sort -rn | head
```

## Relay info and NIP-05

```bash
# compare several relays' NIP-11 documents
for r in relay.primal.net relay.nostr.net purplepag.es; do
  curl -s -m 10 -H 'Accept: application/nostr+json' "https://$r" \
    | jq -c '{name, software, supported_nips}'
done

# NIP-05: name@domain → pubkey
curl -s 'https://damus.io/.well-known/nostr.json?name=jb55' | jq -r '.names.jb55'

# the same, plus relay hints
nak decode jb55@damus.io
```

The NIP-11 fields are explained in [Relay Information](relay-info.md).

:::tip
`relay.damus.io` often answers command-line tools with HTTP 503 while browsers connect fine. If a recipe fails there,
use `wss://relay.primal.net`, `wss://relay.nostr.net` or `wss://nos.lol` instead.
:::
