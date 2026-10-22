---
sidebar_position: 4
title: Build Your First App
description: A tested tutorial for a small web client that logs in with a signer, shows a live feed and posts notes
---

# Build Your First App

This tutorial builds a small web client in plain JavaScript. It logs in with a browser signer (or a throwaway key), shows a live feed of notes, and posts new ones. It is about 100 lines, and it was run end to end in a headless browser in October 2026 with nostr-tools 2.25.2, Vite 8 and nak 0.21.2.

You'll develop against a relay on your own machine, so test posts don't go out to the public network. Step 6 switches to public relays.

## What you need

- **Node.js 22.12 or later.** Vite 8 needs at least 20.19, and Node 20 is end-of-life. (Tested on Node 24.)
- **[nak](https://github.com/fiatjaf/nak)**, for the local relay. Install it with `curl -sSL https://raw.githubusercontent.com/fiatjaf/nak/master/install.sh | sh` or `go install github.com/fiatjaf/nak@latest`. The wiki's [nak page](https://github.com/nostrcg/devguide/wiki/NAK) lists other ways.
- **Optional: a NIP-07 signer extension** such as Alby, nos2x or nos2x-fox. Without one, use the throwaway-key button.

## 1. Create the project

```bash
mkdir my-nostr-app
cd my-nostr-app
npm init -y
npm i nostr-tools
npm i -D vite
```

## 2. Start a local relay

In a second terminal:

```bash
nak serve
# > relay running at ws://localhost:10547
```

This is an in-memory relay for development. It forgets everything when you stop it.

## 3. The page

Create `index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>My first Nostr app</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; }
    .note { border: 1px solid #ccc; border-radius: 8px; padding: .75rem; margin: .75rem 0; white-space: pre-wrap; }
    .meta { color: #666; font-size: .85rem; }
    textarea { width: 100%; }
  </style>
</head>
<body>
  <h1>My first Nostr app</h1>

  <p id="who">Not logged in.</p>
  <button id="login-ext">Log in with extension</button>
  <button id="login-temp">Use a throwaway key</button>

  <form id="post" hidden>
    <textarea id="text" rows="3" placeholder="Write a note"></textarea>
    <button>Post</button> <span id="status"></span>
  </form>

  <h2>Notes</h2>
  <div id="feed"></div>

  <script type="module" src="/main.js"></script>
</body>
</html>
```

## 4. The code

Create `main.js`:

```js
import { SimplePool } from 'nostr-tools/pool'
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'

// Start with the local nak relay. Step 6 switches to public relays.
const RELAYS = ['ws://localhost:10547']

const pool = new SimplePool()
const $ = (id) => document.getElementById(id)

// ---- 1. a signer: anything with getPublicKey() and signEvent()
let signer = null

$('login-ext').onclick = async () => {
  if (!window.nostr) return alert('No NIP-07 extension found')
  signer = window.nostr
  showUser(await signer.getPublicKey())
}

$('login-temp').onclick = () => {
  // kept in memory only: reload the page and it is gone
  const sk = generateSecretKey()
  signer = {
    getPublicKey: async () => getPublicKey(sk),
    signEvent: async (template) => finalizeEvent(template, sk),
  }
  signer.getPublicKey().then(showUser)
}

function showUser(pubkey) {
  $('who').textContent = 'Logged in as ' + nip19.npubEncode(pubkey)
  $('post').hidden = false
}

// ---- 2. the feed: one live subscription, deduped by id, newest first
const notes = new Map()

pool.subscribeMany(RELAYS, { kinds: [1], limit: 20 }, {
  onevent(event) {
    // SimplePool has already checked the id and signature
    notes.set(event.id, event)
    render()
  },
})

function render() {
  const sorted = [...notes.values()].sort((a, b) => b.created_at - a.created_at).slice(0, 50)
  $('feed').replaceChildren(...sorted.map(noteElement))
}

function noteElement(event) {
  const div = document.createElement('div')
  div.className = 'note'
  const meta = document.createElement('div')
  meta.className = 'meta'
  const when = new Date(event.created_at * 1000).toLocaleString()
  meta.textContent = nip19.npubEncode(event.pubkey).slice(0, 16) + '… · ' + when
  const body = document.createElement('div')
  // textContent, never innerHTML: note content is untrusted input
  body.textContent = event.content
  div.append(meta, body)
  return div
}

// ---- 3. posting: sign, publish, and wait for at least one relay to accept
$('post').onsubmit = async (e) => {
  e.preventDefault()
  const content = $('text').value.trim()
  if (!content) return

  const event = await signer.signEvent({
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content,
  })

  $('status').textContent = 'Publishing…'
  // publish() returns one promise per relay
  const results = await Promise.allSettled(pool.publish(RELAYS, event))
  const ok = results.filter((r) => r.status === 'fulfilled').length
  if (ok > 0) {
    $('status').textContent = `Accepted by ${ok} of ${RELAYS.length} relays`
    $('text').value = ''
  } else {
    $('status').textContent = 'Rejected: ' + results.map((r) => r.reason?.message).join('; ')
  }
}
```

What each part does:

1. **The signer.** The rest of the app only needs an object with `getPublicKey()` and `signEvent()`. A NIP-07 extension provides exactly that as `window.nostr`, and it never shows your app the secret key. The throwaway option wraps a key that lives only in memory, so nothing secret is stored in the browser. A [NIP-46 remote signer](https://github.com/nostrcg/devguide/wiki/Extensions) has the same two methods, so you could add it without touching the rest.
2. **The feed.** `subscribeMany` takes a list of relays and **one** filter. It returns the 20 newest stored notes, then keeps streaming new ones. The same note often arrives from several relays, so the `Map` keyed by id removes duplicates. Events arrive in any order, so `render()` sorts by `created_at`.
3. **Rendering.** Note content is written by strangers. `textContent` puts it on the page as plain text, so a note containing `<img src=x onerror=…>` shows up as text and doesn't run. (The test for this page posted exactly that.) Never build note HTML with `innerHTML` and string templates.
4. **Posting.** `pool.publish()` returns **an array of promises**, one per relay. `await` on the array itself waits for nothing, so the code passes it to `Promise.allSettled` and counts how many relays accepted. `Promise.any(pool.publish(…))` is the short form if you only need one success.

## 5. Run it

```bash
npx vite
```

Open the URL it prints (usually `http://localhost:5173`). Click **Use a throwaway key** (or **Log in with extension**), write a note and press **Post**. The status should read "Accepted by 1 of 1 relays", and the note appears at the top of the feed, because the live subscription receives it from the relay.

`npx vite build` writes a static site to `dist/` that you can host anywhere.

## 6. Read the public network

Change the relay list to some public relays:

```js
const RELAYS = ['wss://relay.primal.net', 'wss://relay.nostr.net', 'wss://nos.lol']
```

Reload, and the feed fills with recent notes from strangers. This is a "global" feed: whatever those relays received last. Posting now publishes to the real network, under whatever key you logged in with. Throwaway keys are fine for a test or two, but don't flood public relays with them.

:::tip Where a real client goes next
Real clients don't write every user's notes to the same three relays. They read each user's **relay list** (kind 10002) and post to that user's write relays: the outbox model. They also show names and avatars from kind 0 profiles, build a home feed from the kind 3 follow list, and handle replies and reactions. The wiki's [Build a client](https://github.com/nostrcg/devguide/wiki/Build-a-Client) walks through all of that with tested code, and [Building clients](../guides/building-clients.md) covers it here.
:::

## Troubleshooting

- **The feed is empty.** Check that `nak serve` is still running, and look in the browser console for WebSocket errors. A relay that is down or unreachable just returns nothing.
- **"Rejected: …"** The text after it is the relay's reason. It starts with a machine-readable prefix such as `rate-limited:`, `blocked:` or `auth-required:`. [Relay communication](../protocol/relay-communication.md) explains each one.
- **"No NIP-07 extension found".** The extension isn't installed or isn't enabled for `localhost`. Use the throwaway key, or check the extension's site permissions.

## Learn more

- [Keys and signing](./keys-and-signing.md): key formats, signers and NIP-49 encrypted keys.
- [Filters](../protocol/filters.md): asking relays for exactly what you need.
- [Event kinds](../protocol/kinds.md): profiles, reactions, reposts and the rest.
