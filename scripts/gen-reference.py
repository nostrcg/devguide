#!/usr/bin/env python3
"""Regenerate docs/reference/event-kinds.md and docs/reference/nip-index.md
from a local clone of https://github.com/nostr-protocol/nips.

usage: python3 -I gen-reference.py <nips-dir> <site-dir>
"""
import re
import subprocess
import sys
from pathlib import Path

NIPS = Path(sys.argv[1])
SITE = Path(sys.argv[2])
BASE = "https://github.com/nostr-protocol/nips/blob/master/"

readme = (NIPS / "README.md").read_text()
lines = readme.splitlines()

try:
    commit = subprocess.run(
        ["git", "-C", str(NIPS), "log", "-1", "--format=%h %cs"],
        capture_output=True, text=True, check=True).stdout.split()
except Exception:
    commit = ["unknown", "unknown"]

# reference-style link definitions: [name]: url
refdefs = dict(re.findall(r"^\[([^\]]+)\]:\s*(\S+)", readme, re.M))


def fix_links(s: str) -> str:
    """Make README-relative links absolute so they work on the site."""
    s = re.sub(r"\]\(([0-9A-Za-z]{2})\.md\)", lambda m: f"]({BASE}{m.group(1)}.md)", s)
    # [text][ref]
    s = re.sub(r"\[([^\]]+)\]\[([^\]]+)\]",
               lambda m: f"[{m.group(1)}]({refdefs.get(m.group(2), '#')})", s)
    # bare [ref] that has a definition and isn't followed by ( or [
    s = re.sub(r"\[([^\]]+)\](?![(\[])",
               lambda m: f"[{m.group(1)}]({refdefs[m.group(1)]})" if m.group(1) in refdefs else m.group(0), s)
    return s


def section(title: str) -> list[str]:
    start = lines.index(title) + 1
    out = []
    for ln in lines[start:]:
        if ln.startswith("## "):
            break
        out.append(ln)
    return out


# ---------- NIP list ----------
nips = []  # (code, title, unrecommended_reason or None)
for ln in section("## List"):
    m = re.match(r"^- (~~)?\[NIP-([0-9A-Z]{2}): (.+?)\]\(\2\.md\)(.*?)(~~)?$", ln)
    if not m:
        continue
    code, title, rest = m.group(2), m.group(3), m.group(4)
    reason = None
    r = re.search(r"\*\*unrecommended\*\*:\s*(.+)$", rest)
    if r:
        reason = fix_links(r.group(1).rstrip("~").strip())
    nips.append((code, title, reason))

unrecommended = {c for c, _, r in nips if r}


def badges(code: str) -> list[str]:
    f = NIPS / f"{code}.md"
    if not f.exists():
        return []
    for ln in f.read_text().splitlines()[:12]:
        if re.fullmatch(r"\s*(`[a-z]+`\s*)+", ln):
            return re.findall(r"`([a-z]+)`", ln)
    return []


# ---------- kinds table ----------
def kind_type(k: int) -> str:
    # NIP-01 "kind ranges" convention
    if 1000 <= k < 10000 or 4 <= k < 45 or k in (1, 2):
        return "regular"
    if 10000 <= k < 20000 or k in (0, 3):
        return "replaceable"
    if 20000 <= k < 30000:
        return "ephemeral"
    if 30000 <= k < 40000:
        return "addressable"
    return "not defined"


kinds = []
for ln in section("## Event Kinds"):
    if not ln.startswith("| `"):
        continue
    cells = [c.strip() for c in ln.strip().strip("|").split("|")]
    kind, desc, nip = cells[0].strip("`"), cells[1], cells[2]
    first = int(re.match(r"\d+", kind).group(0))
    linked = re.findall(r"\[([0-9A-Z]{2})\]\(\1\.md\)", nip)
    flag = ""
    if "(deprecated)" in nip:
        flag = "deprecated"
    elif linked and all(n in unrecommended for n in linked):
        flag = "unrecommended NIP"
    kinds.append((first, kind, desc, fix_links(nip) if nip else "—", kind_type(first), flag))

kinds.sort(key=lambda r: r[0])

head = f"""{{/* GENERATED from nostr-protocol/nips README.md at {commit[0]} ({commit[1]}). Do not edit by hand; regenerate. */}}
"""

# ---------- event-kinds.md ----------
ek = [f"""---
sidebar_position: 1
title: Event Kinds Reference
description: Every event kind listed in the NIPs README, with its NIP-01 storage type
---

{head}
# Event Kinds Reference

This table lists every kind in the [NIPs README]({BASE.replace('blob/master/', '')}#event-kinds),
generated from the NIPs repository at commit `{commit[0]}` ({commit[1]}). The README itself says the table
is not exhaustive. For a machine-readable list of all known kinds, use the
[registry-of-kinds](https://github.com/nostr-protocol/registry-of-kinds).

For what kinds are and how to pick one, see [Event Kinds](../protocol/kinds.md).

## Kind ranges

[NIP-01]({BASE}01.md) defines how relays store each kind. The **Type** column below applies these rules.

| Kinds | Type | Relays keep |
|---|---|---|
| `1`, `2`, `4`–`44`, `1000`–`9999` | regular | every event |
| `0`, `3`, `10000`–`19999` | replaceable | the latest event per `pubkey` + `kind` |
| `20000`–`29999` | ephemeral | nothing (forwarded to live subscribers only) |
| `30000`–`39999` | addressable | the latest event per `kind` + `pubkey` + `d` tag |

Kinds `45`–`999` and `40000`–`65535` have no storage rule in NIP-01. How relays store them is up to each relay.

:::caution
Rows marked **unrecommended NIP** come from NIPs that the NIPs README marks as unrecommended.
Rows marked **deprecated** are marked so in the README. Don't build new features on them.
See the [NIP Index](nip-index.md) for the reasons.
:::

## All kinds

| Kind | Description | NIP | Type | Note |
|---|---|---|---|---|
"""]
for _, kind, desc, nip, typ, flag in kinds:
    note = f"⚠️ {flag}" if flag else ""
    ek.append(f"| `{kind}` | {desc} | {nip} | {typ} | {note} |\n")

ek.append("""
A kind with no NIP link is listed in the README without a spec in the repository.
Links to NKBIP, Marmot, nostrocket and joinstr point to specs kept outside the NIPs repository.
""")

# wikistr.com (where the README points NKBIP links) was unreachable in Oct 2026: keep the name, drop the link
DEAD_HOSTS = ("wikistr.com",)
ek_text = re.sub(r"\[([^\]]+)\]\((https?://(?:%s)[^)]*)\)" % "|".join(map(re.escape, DEAD_HOSTS)), r"\1", "".join(ek))
(SITE / "docs/reference/event-kinds.md").write_text(ek_text)

# ---------- nip-index.md ----------
ni = [f"""---
sidebar_position: 2
title: NIP Index
description: Every NIP in the nostr-protocol/nips repository, with its status badges
---

{head}
# NIP Index

NIPs are **Nostr Implementation Possibilities**. This page lists every NIP in the
[NIPs README]({BASE.replace('blob/master/', '')}), generated from the repository at commit
`{commit[0]}` ({commit[1]}). For a short guided tour of the NIPs most apps need, see
[NIPs](../protocol/nips.md).

## How to read the status

Each NIP file starts with badges. The **Status** column copies them.

- `draft` or `final`. Almost every NIP, including NIP-01, is `draft`. Draft NIPs are widely deployed; the label
  means the text can still change.
- `mandatory` or `optional`. Only NIP-01 is `mandatory`.
- `relay` means relays need to do something to support the NIP.
- `unrecommended` (see below).
- A blank status means the NIP file has no badge line.

The README marks some NIPs **unrecommended** and strikes them through. They stay listed so old events can still be read,
but new software should use the replacement named in the reason.

## Unrecommended NIPs

| NIP | Title | Reason |
|---|---|---|
"""]
for code, title, reason in nips:
    if reason:
        ni.append(f"| [{code}]({BASE}{code}.md) | {title} | {reason} |\n")

ni.append("""
## All NIPs

| NIP | Title | Status |
|---|---|---|
""")
for code, title, reason in nips:
    b = " ".join(f"`{x}`" for x in badges(code))
    if reason:
        if "unrecommended" not in b:
            b = (b + " " if b else "") + "`unrecommended`"
        title = f"~~{title}~~"
    ni.append(f"| [{code}]({BASE}{code}.md) | {title} | {b} |\n")

ni.append(f"""
The list follows the order of the README. Message types (`EVENT`, `REQ`, `CLOSE`, `AUTH`, `COUNT`, `OK`, `EOSE`,
`CLOSED`, `NOTICE`) are covered in [Relay Communication](../protocol/relay-communication.md).

Offline, `nak nip` lists the NIPs and `nak nip 44` prints one.
""")

(SITE / "docs/reference/nip-index.md").write_text("".join(ni))

print(f"{len(kinds)} kinds, {len(nips)} NIPs ({len(unrecommended)} unrecommended) from {commit[0]}")
