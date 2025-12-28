---
sidebar_position: 4
title: Implementing NIPs
description: Guide to implementing Nostr Improvement Proposals
---

# Implementing NIPs

This guide covers how to implement various NIPs in your Nostr applications.

## Understanding NIP Structure

NIPs typically define:
- Event kinds to use
- Tag formats
- Content structure
- Expected behavior

## Essential NIPs

### NIP-01: Basic Protocol

The foundation—every client must implement this.

```javascript
// Event structure
const event = {
  id: '',      // sha256 of serialized event
  pubkey: '',  // author's public key
  created_at: Math.floor(Date.now() / 1000),
  kind: 1,
  tags: [],
  content: '',
  sig: ''      // Schnorr signature
};

// Signing
import { finalizeEvent } from 'nostr-tools/pure';
const signedEvent = finalizeEvent(event, secretKey);
```

### NIP-02: Follow List

Store who a user follows:

```javascript
// Create/update follow list
const followList = {
  kind: 3,
  content: JSON.stringify({
    'wss://relay.example.com': { read: true, write: true }
  }),
  tags: follows.map(f => ['p', f.pubkey, f.relay || '', f.petname || ''])
};

// Parse follow list
function parseFollows(event) {
  return event.tags
    .filter(t => t[0] === 'p')
    .map(t => ({
      pubkey: t[1],
      relay: t[2] || null,
      petname: t[3] || null
    }));
}
```

### NIP-05: DNS Verification

Verify identity via DNS:

```javascript
async function verifyNip05(identifier) {
  const [name, domain] = identifier.split('@');
  const url = `https://${domain}/.well-known/nostr.json?name=${name}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.names && data.names[name]) {
      return {
        valid: true,
        pubkey: data.names[name],
        relays: data.relays?.[data.names[name]] || []
      };
    }
  } catch (error) {
    console.error('NIP-05 verification failed:', error);
  }

  return { valid: false };
}

// Server-side: /.well-known/nostr.json
{
  "names": {
    "alice": "pubkey-hex-here"
  },
  "relays": {
    "pubkey-hex-here": ["wss://relay.example.com"]
  }
}
```

### NIP-10: Thread Markers

Implement proper threading:

```javascript
function createReply(replyingTo, rootEvent, content) {
  const tags = [];

  // Root reference
  if (rootEvent) {
    tags.push(['e', rootEvent.id, '', 'root']);
  } else {
    // This is a reply to a root event
    tags.push(['e', replyingTo.id, '', 'root']);
  }

  // Reply reference
  if (rootEvent) {
    tags.push(['e', replyingTo.id, '', 'reply']);
  }

  // Author references
  const mentionedPubkeys = new Set([replyingTo.pubkey]);
  if (rootEvent) {
    mentionedPubkeys.add(rootEvent.pubkey);
  }
  for (const pk of mentionedPubkeys) {
    tags.push(['p', pk]);
  }

  return {
    kind: 1,
    content,
    tags
  };
}
```

### NIP-19: Bech32 Encoding

Handle human-readable identifiers:

```javascript
import { nip19 } from 'nostr-tools';

// Encode
const npub = nip19.npubEncode(pubkeyHex);
const nsec = nip19.nsecEncode(secretKeyBytes);
const noteId = nip19.noteEncode(eventIdHex);

// With metadata
const nprofile = nip19.nprofileEncode({
  pubkey: pubkeyHex,
  relays: ['wss://relay.example.com']
});

const nevent = nip19.neventEncode({
  id: eventIdHex,
  relays: ['wss://relay.example.com'],
  author: pubkeyHex,
  kind: 1
});

// Decode
function parseNostrUri(str) {
  try {
    const { type, data } = nip19.decode(str);
    switch (type) {
      case 'npub':
        return { type: 'pubkey', pubkey: data };
      case 'note':
        return { type: 'event', id: data };
      case 'nprofile':
        return { type: 'profile', ...data };
      case 'nevent':
        return { type: 'event', ...data };
      case 'naddr':
        return { type: 'address', ...data };
      default:
        return null;
    }
  } catch {
    return null;
  }
}
```

### NIP-25: Reactions

Like, dislike, or emoji reactions:

```javascript
function createReaction(targetEvent, reaction = '+') {
  return {
    kind: 7,
    content: reaction,  // '+', '-', or emoji
    tags: [
      ['e', targetEvent.id],
      ['p', targetEvent.pubkey]
    ]
  };
}

// Get reactions for an event
async function getReactions(eventId) {
  const events = await pool.querySync(relays, {
    kinds: [7],
    '#e': [eventId]
  });

  const counts = { '+': 0, '-': 0 };
  const emojis = {};

  for (const event of events) {
    if (event.content === '+') counts['+']++;
    else if (event.content === '-') counts['-']++;
    else {
      emojis[event.content] = (emojis[event.content] || 0) + 1;
    }
  }

  return { counts, emojis };
}
```

### NIP-57: Zaps (Lightning)

Implement Lightning payments:

```javascript
// 1. Get zap endpoint from user's profile
async function getZapEndpoint(pubkey) {
  const profile = await getProfile(pubkey);
  const lud16 = profile?.lud16;

  if (!lud16) return null;

  const [name, domain] = lud16.split('@');
  const url = `https://${domain}/.well-known/lnurlp/${name}`;

  const response = await fetch(url);
  return response.json();
}

// 2. Create zap request
function createZapRequest(recipientPubkey, eventId, amount, relays) {
  return {
    kind: 9734,
    content: '',
    tags: [
      ['p', recipientPubkey],
      ['amount', String(amount * 1000)],  // millisats
      ['relays', ...relays],
      ...(eventId ? [['e', eventId]] : [])
    ]
  };
}

// 3. Get invoice from LNURL endpoint
async function getZapInvoice(zapEndpoint, zapRequest, amount) {
  const signedRequest = await signEvent(zapRequest);
  const encoded = encodeURIComponent(JSON.stringify(signedRequest));

  const url = `${zapEndpoint.callback}?amount=${amount * 1000}&nostr=${encoded}`;
  const response = await fetch(url);
  const data = await response.json();

  return data.pr;  // Lightning invoice
}
```

## Advanced NIPs

### NIP-42: Relay Authentication

Handle authentication challenges:

```javascript
function handleAuthChallenge(challenge, relayUrl) {
  const authEvent = {
    kind: 22242,
    content: '',
    tags: [
      ['relay', relayUrl],
      ['challenge', challenge]
    ],
    created_at: Math.floor(Date.now() / 1000)
  };

  return signEvent(authEvent);
}

// In WebSocket handler
ws.onmessage = async (msg) => {
  const [type, ...data] = JSON.parse(msg.data);

  if (type === 'AUTH') {
    const challenge = data[0];
    const authEvent = await handleAuthChallenge(challenge, ws.url);
    ws.send(JSON.stringify(['AUTH', authEvent]));
  }
};
```

### NIP-44: Encryption

Modern encryption for DMs:

```javascript
import { nip44 } from 'nostr-tools';

// Encrypt
function encryptMessage(senderSk, recipientPk, plaintext) {
  const conversationKey = nip44.v2.utils.getConversationKey(
    senderSk,
    recipientPk
  );
  return nip44.v2.encrypt(plaintext, conversationKey);
}

// Decrypt
function decryptMessage(recipientSk, senderPk, ciphertext) {
  const conversationKey = nip44.v2.utils.getConversationKey(
    recipientSk,
    senderPk
  );
  return nip44.v2.decrypt(ciphertext, conversationKey);
}
```

### NIP-65: Relay List Metadata

User's relay preferences:

```javascript
// Publish relay list
function createRelayListEvent(relays) {
  return {
    kind: 10002,
    content: '',
    tags: relays.map(r => {
      if (r.read && r.write) return ['r', r.url];
      if (r.read) return ['r', r.url, 'read'];
      if (r.write) return ['r', r.url, 'write'];
    }).filter(Boolean)
  };
}

// Parse relay list
function parseRelayList(event) {
  return event.tags
    .filter(t => t[0] === 'r')
    .map(t => ({
      url: t[1],
      read: !t[2] || t[2] === 'read',
      write: !t[2] || t[2] === 'write'
    }));
}
```

## Testing NIP Compliance

```javascript
// Verify event structure
function validateEvent(event) {
  const errors = [];

  if (!event.id || event.id.length !== 64) {
    errors.push('Invalid event ID');
  }
  if (!event.pubkey || event.pubkey.length !== 64) {
    errors.push('Invalid pubkey');
  }
  if (typeof event.created_at !== 'number') {
    errors.push('Invalid created_at');
  }
  if (typeof event.kind !== 'number') {
    errors.push('Invalid kind');
  }
  if (!Array.isArray(event.tags)) {
    errors.push('Invalid tags');
  }
  if (typeof event.content !== 'string') {
    errors.push('Invalid content');
  }
  if (!event.sig || event.sig.length !== 128) {
    errors.push('Invalid signature');
  }

  return errors;
}
```

## See Also

- [NIPs Repository](https://github.com/nostr-protocol/nips)
- [Protocol Overview](../protocol/overview)
- [Event Kinds](../protocol/kinds)
