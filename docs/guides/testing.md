---
sidebar_position: 5
title: Testing
description: Test Nostr apps with real test runners and a throwaway local relay
---

# Testing Nostr Applications

Don't test against public relays. They rate-limit, drop events and keep everything you publish. Run a throwaway relay instead: [`nak serve`](https://github.com/nostrcg/devguide/wiki/NAK) starts an in-memory relay in one command, and its data disappears when it exits.

Everything on this page was run in October 2026 with nak v0.21.2, Node 24, nostr-tools 2.25.2, Vitest 3.2 and Playwright 1.64.

## A shell smoke test

Good for CI, or for checking that a relay URL, key or event works at all. `nak verify` exits non-zero if the id or signature is wrong.

```bash
# a relay that lives only for this test run
nak serve --port 10547 </dev/null >/dev/null 2>&1 &
RELAY_PID=$!
trap 'kill $RELAY_PID' EXIT
sleep 1
R=ws://localhost:10547

export NOSTR_SECRET_KEY=$(nak key generate)
EV=$(nak event -c 'smoke test' $R </dev/null)
ID=$(echo "$EV" | jq -r .id)

# the relay returns it, and the signature checks out
nak req -i $ID $R </dev/null | nak verify && echo "ok: $ID"
```

Every nak command that signs reads `$NOSTR_SECRET_KEY`. Without it, nak falls back to a per-machine default key, so set it explicitly in tests.

## Unit and integration tests with Vitest

```bash
npm i -D vitest nostr-tools
```

Install [nak](https://github.com/nostrcg/devguide/wiki/NAK) and make sure it is on your `PATH`. A Vitest global setup starts `nak serve` once for the whole run and passes its URL to the tests:

```js title="vitest.config.js"
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: './test/relay-setup.js',
    include: ['test/**/*.test.js'],
  },
})
```

```js title="test/relay-setup.js"
// starts a throwaway in-memory relay (nak serve) for the whole test run
import { spawn } from 'node:child_process'
import { Relay } from 'nostr-tools/relay'

const PORT = process.env.RELAY_PORT ?? '10547'

export async function setup({ provide }) {
  const nak = spawn('nak', ['serve', '--port', PORT], { stdio: 'ignore' })
  const url = `ws://localhost:${PORT}`
  // wait until the relay accepts connections
  for (let i = 0; ; i++) {
    try {
      const r = await Relay.connect(url)
      r.close()
      break
    } catch (e) {
      if (i > 50) throw new Error('nak serve did not start: ' + e.message)
      await new Promise(r => setTimeout(r, 100))
    }
  }
  provide('relayUrl', url)
  return () => nak.kill()
}
```

Run with `npx vitest run`. Set `RELAY_PORT` if 10547 is taken.

### Events, filters and encryption

These need no relay. Use nostr-tools' own `matchFilter` rather than writing your own: it handles `ids`, `authors`, `kinds`, `#tag`, `since` and `until`.

```js title="test/events.test.js"
import { describe, it, expect } from 'vitest'
import { generateSecretKey, getPublicKey, finalizeEvent, verifyEvent } from 'nostr-tools/pure'
import { matchFilter } from 'nostr-tools/filter'
import * as nip44 from 'nostr-tools/nip44'

const sk = generateSecretKey()
const pk = getPublicKey(sk)
const note = (content, tags = []) => finalizeEvent(
  { kind: 1, created_at: Math.floor(Date.now() / 1000), tags, content }, sk)

describe('events', () => {
  it('signs and verifies', () => {
    const ev = note('hello')
    expect(ev.pubkey).toBe(pk)
    expect(ev.id).toMatch(/^[0-9a-f]{64}$/)
    expect(verifyEvent(ev)).toBe(true)
  })

  it('rejects a tampered event', () => {
    const ev = note('hello')
    // finalizeEvent marks the object as verified and a spread copies that
    // flag, so build a fresh object
    const forged = JSON.parse(JSON.stringify({ ...ev, content: 'goodbye' }))
    expect(verifyEvent(forged)).toBe(false)
  })
})

describe('filters', () => {
  it('matches ids, authors, kinds and tags', () => {
    const ev = note('gm', [['t', 'nostr']])
    expect(matchFilter({ ids: [ev.id] }, ev)).toBe(true)
    expect(matchFilter({ authors: [pk], kinds: [1], '#t': ['nostr'] }, ev)).toBe(true)
    expect(matchFilter({ '#t': ['bitcoin'] }, ev)).toBe(false)
    expect(matchFilter({ kinds: [1], since: ev.created_at + 1 }, ev)).toBe(false)
  })
})

describe('nip44', () => {
  it('round-trips between two keys', () => {
    const bob = generateSecretKey()
    const ciphertext = nip44.encrypt('secret', nip44.getConversationKey(sk, getPublicKey(bob)))
    const plaintext = nip44.decrypt(ciphertext, nip44.getConversationKey(bob, pk))
    expect(plaintext).toBe('secret')
  })
})
```

:::caution verifyEvent trusts a cached flag
`finalizeEvent` and `verifyEvent` mark the event object as verified (in a symbol property). Later `verifyEvent` calls return that flag without checking again, even if you have changed a field since. An object spread copies the flag. To test a forgery, build a fresh object, for example with `JSON.parse(JSON.stringify(…))`. Events that arrive from relays are plain parsed JSON, so this only affects objects you made yourself.
:::

### Talking to the relay

Two things often go wrong in relay tests:

- `pool.publish()` returns **an array of promises**, one per relay, so `await pool.publish(...)` waits for nothing. Use `Promise.allSettled` or `Promise.any`.
- `pool.subscribe()` and `pool.subscribeMany()` take **one** filter object, not an array.

```js title="test/relay.test.js"
import { describe, it, expect, inject, afterAll } from 'vitest'
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure'
import { SimplePool } from 'nostr-tools/pool'
import { Relay } from 'nostr-tools/relay'

const url = inject('relayUrl')
const pool = new SimplePool()
const sk = generateSecretKey()
const now = () => Math.floor(Date.now() / 1000)
const note = content => finalizeEvent({ kind: 1, created_at: now(), tags: [], content }, sk)

afterAll(() => pool.close([url]))

describe('relay round trip', () => {
  it('publishes and reads back', async () => {
    const ev = note('integration test')
    // publish returns one promise per relay
    const [result] = await Promise.allSettled(pool.publish([url], ev))
    expect(result.status).toBe('fulfilled')

    const found = await pool.querySync([url], { ids: [ev.id] })
    expect(found.map(e => e.id)).toEqual([ev.id])
  })

  it('accepts a duplicate as OK', async () => {
    const ev = note('twice')
    await Promise.any(pool.publish([url], ev))
    // relays answer ["OK", id, true, "duplicate: ..."]
    await expect(Promise.any(pool.publish([url], ev))).resolves.toBeDefined()
  })

  it('rejects a bad signature', async () => {
    const ev = note('forged')
    const forged = { ...ev, sig: ev.sig.replace(/^./, c => (c === '0' ? '1' : '0')) }
    const relay = await Relay.connect(url)
    await expect(relay.publish(forged)).rejects.toThrow()
    relay.close()
  })

  it('delivers live events after EOSE', async () => {
    const ev = note('live')
    const got = new Promise(resolve => {
      // nak serve doesn't stream new events to an ids filter: watch the author
      const filter = { kinds: [1], authors: [getPublicKey(sk)], since: ev.created_at }
      const sub = pool.subscribe([url], filter, {
        onevent(e) { if (e.id === ev.id) { sub.close(); resolve(e) } },
        oneose() { pool.publish([url], ev) },
      })
    })
    expect((await got).id).toBe(ev.id)
  })
})
```

```text
 ✓ test/events.test.js (4 tests) 15ms
 ✓ test/relay.test.js (4 tests) 47ms

 Test Files  2 passed (2)
      Tests  8 passed (8)
```

To test NIP-42 AUTH handling, start the relay with `nak serve --auth`. Unauthenticated writes then fail with `auth-required:`. [Implementing NIPs](./nip-implementation.md) has a tested `onauth` example.

## Browser tests with Playwright

Your app talks to a NIP-07 signer through `window.nostr`. In tests, inject a stub that signs with a test key held in Node. The page never sees the key, and the test can check the signed events.

```bash
npm i -D @playwright/test nostr-tools
npx playwright install chromium
```

```js title="e2e/login.spec.js"
import { test, expect } from '@playwright/test'
import { generateSecretKey, getPublicKey, finalizeEvent, verifyEvent } from 'nostr-tools/pure'

// a test key held in Node; the page only sees window.nostr
const sk = generateSecretKey()
const pk = getPublicKey(sk)

test.beforeEach(async ({ page }) => {
  await page.exposeFunction('testSignEvent', template => finalizeEvent(template, sk))
  await page.addInitScript(pubkey => {
    // a NIP-07 stub: getPublicKey and signEvent (add nip44 if your app uses it)
    window.nostr = {
      getPublicKey: async () => pubkey,
      signEvent: async template => window.testSignEvent(template),
    }
  }, pk)
})

test('logs in and signs with a NIP-07 signer', async ({ page }) => {
  // a stand-in app; in your project just page.goto() your dev server
  await page.route('http://app.test/', route => route.fulfill({ contentType: 'text/html', body: `
    <button id="login">Log in</button><pre id="out"></pre>
    <script>
      document.getElementById('login').onclick = async () => {
        const pubkey = await window.nostr.getPublicKey()
        const ev = await window.nostr.signEvent({
          kind: 1, created_at: Math.floor(Date.now() / 1000), tags: [], content: 'hi' })
        document.getElementById('out').textContent = JSON.stringify(ev)
      }
    </script>` }))
  await page.goto('http://app.test/')
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.locator('#out')).not.toBeEmpty()

  const ev = JSON.parse(await page.locator('#out').textContent())
  expect(ev.pubkey).toBe(pk)
  expect(verifyEvent(ev)).toBe(true)
})
```

Run with `npx playwright test`. Real NIP-07 has only two required methods, `getPublicKey()` and `signEvent()`. `nip44.encrypt`/`decrypt` are optional, and `nip04` is deprecated. There is no `getRelays()`, so don't put one in your stub: the app should read kind 10002 instead. See [Building clients](./building-clients.md).

To test a NIP-46 login, run `nak bunker` against your local relay. The steps are on the wiki's [Signers & login](https://github.com/nostrcg/devguide/wiki/Extensions) page.

## Other options

- **In-process relays:** nostr-sdk (Rust, and its Python and other bindings) has a `LocalRelay` you can start inside the test process.
- **Fixtures:** `nak serve --events fixtures.jsonl` starts the relay preloaded with events, one JSON event per line.
- **Load testing:** benchmark against your own relay software, not a public relay. Measure publish round trips (time to the `OK`), not signing time.
