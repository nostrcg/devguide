---
sidebar_position: 4
title: Build Your First App
description: Step-by-step tutorial to create a simple Nostr client
---

# Build Your First App

Let's build a simple Nostr client that can read and post notes. By the end, you'll understand the core concepts through hands-on code.

## What We'll Build

A minimal web app that:
- Generates or imports a keypair
- Connects to relays
- Fetches recent notes
- Posts new notes

## Prerequisites

- Node.js 18+ installed
- Basic JavaScript/TypeScript knowledge
- A code editor

## Step 1: Project Setup

Create a new project:

```bash
mkdir my-nostr-app
cd my-nostr-app
npm init -y
npm install nostr-tools
```

Create an `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My First Nostr App</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
    .note { border: 1px solid #ddd; padding: 1rem; margin: 1rem 0; border-radius: 8px; }
    .note-author { color: #666; font-size: 0.875rem; }
    .note-content { margin-top: 0.5rem; }
    textarea { width: 100%; padding: 0.5rem; }
    button { margin-top: 0.5rem; padding: 0.5rem 1rem; cursor: pointer; }
  </style>
</head>
<body>
  <h1>My Nostr App</h1>

  <div id="key-section">
    <p>Your public key: <code id="pubkey">Loading...</code></p>
    <button id="new-key">Generate New Key</button>
  </div>

  <hr>

  <div id="post-section">
    <h2>Post a Note</h2>
    <textarea id="note-input" rows="3" placeholder="What's on your mind?"></textarea>
    <button id="post-btn">Post</button>
  </div>

  <hr>

  <div id="feed-section">
    <h2>Recent Notes</h2>
    <div id="notes"></div>
  </div>

  <script type="module" src="app.js"></script>
</body>
</html>
```

## Step 2: Connect to Relays

Create `app.js`:

```javascript
import {
  SimplePool,
  generateSecretKey,
  getPublicKey,
  finalizeEvent
} from 'nostr-tools';
import { nip19 } from 'nostr-tools';

// Relay list
const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band'
];

// Initialize pool for managing relay connections
const pool = new SimplePool();

// Key management
let sk = null;
let pk = null;

function initKeys() {
  // Check localStorage for existing key
  const stored = localStorage.getItem('nostr_sk');
  if (stored) {
    sk = Uint8Array.from(JSON.parse(stored));
  } else {
    sk = generateSecretKey();
    localStorage.setItem('nostr_sk', JSON.stringify(Array.from(sk)));
  }
  pk = getPublicKey(sk);

  // Display npub
  const npub = nip19.npubEncode(pk);
  document.getElementById('pubkey').textContent = npub.slice(0, 20) + '...';
}

// Generate new key button
document.getElementById('new-key').addEventListener('click', () => {
  if (confirm('Generate new key? You will lose access to the old one.')) {
    sk = generateSecretKey();
    localStorage.setItem('nostr_sk', JSON.stringify(Array.from(sk)));
    pk = getPublicKey(sk);
    const npub = nip19.npubEncode(pk);
    document.getElementById('pubkey').textContent = npub.slice(0, 20) + '...';
  }
});

// Initialize on load
initKeys();
```

## Step 3: Fetch Notes

Add the subscription logic:

```javascript
async function fetchNotes() {
  const notesDiv = document.getElementById('notes');
  notesDiv.innerHTML = '<p>Loading...</p>';

  try {
    // Subscribe to kind 1 (text notes) from the last hour
    const events = await pool.querySync(RELAYS, {
      kinds: [1],
      limit: 20,
      since: Math.floor(Date.now() / 1000) - 3600 // Last hour
    });

    // Sort by created_at (newest first)
    events.sort((a, b) => b.created_at - a.created_at);

    // Render notes
    notesDiv.innerHTML = '';
    for (const event of events) {
      const noteDiv = document.createElement('div');
      noteDiv.className = 'note';

      const npub = nip19.npubEncode(event.pubkey);
      const date = new Date(event.created_at * 1000).toLocaleString();

      noteDiv.innerHTML = `
        <div class="note-author">${npub.slice(0, 16)}... · ${date}</div>
        <div class="note-content">${escapeHtml(event.content)}</div>
      `;
      notesDiv.appendChild(noteDiv);
    }

    if (events.length === 0) {
      notesDiv.innerHTML = '<p>No notes found in the last hour.</p>';
    }
  } catch (err) {
    notesDiv.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Fetch notes on load
fetchNotes();
```

## Step 4: Post Notes

Add posting functionality:

```javascript
document.getElementById('post-btn').addEventListener('click', async () => {
  const input = document.getElementById('note-input');
  const content = input.value.trim();

  if (!content) {
    alert('Please enter some text');
    return;
  }

  const btn = document.getElementById('post-btn');
  btn.disabled = true;
  btn.textContent = 'Posting...';

  try {
    // Create and sign the event
    const event = finalizeEvent({
      kind: 1,
      content: content,
      tags: [],
      created_at: Math.floor(Date.now() / 1000)
    }, sk);

    // Publish to all relays
    await Promise.all(
      RELAYS.map(relay => pool.publish([relay], event))
    );

    // Clear input and refresh
    input.value = '';
    alert('Posted successfully!');
    fetchNotes();
  } catch (err) {
    alert(`Error posting: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Post';
  }
});
```

## Step 5: Run the App

You'll need a bundler to handle the imports. Use Vite for simplicity:

```bash
npm install vite
npx vite
```

Open `http://localhost:5173` in your browser.

## Complete Code

Here's the full `app.js`:

```javascript
import {
  SimplePool,
  generateSecretKey,
  getPublicKey,
  finalizeEvent
} from 'nostr-tools';
import { nip19 } from 'nostr-tools';

const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band'
];

const pool = new SimplePool();
let sk = null;
let pk = null;

function initKeys() {
  const stored = localStorage.getItem('nostr_sk');
  if (stored) {
    sk = Uint8Array.from(JSON.parse(stored));
  } else {
    sk = generateSecretKey();
    localStorage.setItem('nostr_sk', JSON.stringify(Array.from(sk)));
  }
  pk = getPublicKey(sk);
  const npub = nip19.npubEncode(pk);
  document.getElementById('pubkey').textContent = npub.slice(0, 20) + '...';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function fetchNotes() {
  const notesDiv = document.getElementById('notes');
  notesDiv.innerHTML = '<p>Loading...</p>';

  try {
    const events = await pool.querySync(RELAYS, {
      kinds: [1],
      limit: 20,
      since: Math.floor(Date.now() / 1000) - 3600
    });

    events.sort((a, b) => b.created_at - a.created_at);
    notesDiv.innerHTML = '';

    for (const event of events) {
      const noteDiv = document.createElement('div');
      noteDiv.className = 'note';
      const npub = nip19.npubEncode(event.pubkey);
      const date = new Date(event.created_at * 1000).toLocaleString();
      noteDiv.innerHTML = `
        <div class="note-author">${npub.slice(0, 16)}... · ${date}</div>
        <div class="note-content">${escapeHtml(event.content)}</div>
      `;
      notesDiv.appendChild(noteDiv);
    }

    if (events.length === 0) {
      notesDiv.innerHTML = '<p>No notes found in the last hour.</p>';
    }
  } catch (err) {
    notesDiv.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

document.getElementById('new-key').addEventListener('click', () => {
  if (confirm('Generate new key? You will lose access to the old one.')) {
    sk = generateSecretKey();
    localStorage.setItem('nostr_sk', JSON.stringify(Array.from(sk)));
    pk = getPublicKey(sk);
    const npub = nip19.npubEncode(pk);
    document.getElementById('pubkey').textContent = npub.slice(0, 20) + '...';
  }
});

document.getElementById('post-btn').addEventListener('click', async () => {
  const input = document.getElementById('note-input');
  const content = input.value.trim();

  if (!content) {
    alert('Please enter some text');
    return;
  }

  const btn = document.getElementById('post-btn');
  btn.disabled = true;
  btn.textContent = 'Posting...';

  try {
    const event = finalizeEvent({
      kind: 1,
      content: content,
      tags: [],
      created_at: Math.floor(Date.now() / 1000)
    }, sk);

    await Promise.all(RELAYS.map(relay => pool.publish([relay], event)));
    input.value = '';
    alert('Posted successfully!');
    fetchNotes();
  } catch (err) {
    alert(`Error posting: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Post';
  }
});

initKeys();
fetchNotes();
```

## What's Next?

You've built a working Nostr client! Here are ways to extend it:

### Add Features
- Display user profiles (kind 0)
- Show reactions (kind 7)
- Implement replies (using tags)
- Add image support

### Improve Security
- Integrate NIP-07 for key management
- Don't store keys in localStorage in production

### Learn More
- [Protocol Deep Dive](../protocol/overview)
- [Event Kinds](../protocol/kinds)
- [Building Clients Guide](../guides/building-clients)

## Troubleshooting

**Notes not loading?**
- Check browser console for WebSocket errors
- Some relays may be down—try different ones

**Post not appearing?**
- Relays may have rate limits
- Verify the event format in console

**Key issues?**
- Clear localStorage and regenerate
- Check browser's developer tools for errors
