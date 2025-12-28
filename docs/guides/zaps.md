---
sidebar_position: 8
title: Lightning Zaps
description: Implementing NIP-57 Lightning Zaps
---

# Lightning Zaps

Zaps are Lightning Network payments integrated into Nostr via NIP-57. They enable tipping content creators directly from any Nostr client.

## Overview

Zaps involve three parties:

1. **Sender** - User sending sats
2. **Recipient** - User receiving sats (has Lightning address)
3. **LNURL Server** - Creates invoices and zap receipts

### Event Kinds

| Kind | Name | Purpose |
|------|------|---------|
| 9734 | Zap Request | Sender's payment intent |
| 9735 | Zap Receipt | Proof of payment |

## Client Implementation

### 1. Check Zap Support

First, verify the recipient supports zaps:

```typescript
async function getZapEndpoint(pubkey: string): Promise<string | null> {
  // Fetch recipient's profile
  const profile = await fetchProfile(pubkey);
  if (!profile) return null;

  const metadata = JSON.parse(profile.content);
  const lud16 = metadata.lud16; // e.g., "alice@getalby.com"

  if (!lud16) return null;

  // Convert Lightning address to LNURL endpoint
  const [name, domain] = lud16.split('@');
  const url = `https://${domain}/.well-known/lnurlp/${name}`;

  // Fetch LNURL-pay info
  const response = await fetch(url);
  const lnurlInfo = await response.json();

  // Check if zaps are supported
  if (!lnurlInfo.allowsNostr || !lnurlInfo.nostrPubkey) {
    return null;
  }

  return lnurlInfo.callback;
}
```

### 2. Create Zap Request

```typescript
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools';

interface ZapRequestParams {
  recipientPubkey: string;
  eventId?: string;           // Event being zapped (optional)
  amount: number;             // Millisatoshis
  relays: string[];
  content?: string;           // Optional message
  senderSecretKey: Uint8Array;
}

function createZapRequest(params: ZapRequestParams): NostrEvent {
  const { recipientPubkey, eventId, amount, relays, content, senderSecretKey } = params;

  const tags: string[][] = [
    ['p', recipientPubkey],
    ['amount', amount.toString()],
    ['relays', ...relays],
  ];

  // If zapping a specific event
  if (eventId) {
    tags.push(['e', eventId]);
  }

  const zapRequest = finalizeEvent({
    kind: 9734,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: content || '',
  }, senderSecretKey);

  return zapRequest;
}
```

### 3. Request Invoice

```typescript
async function requestZapInvoice(
  callback: string,
  zapRequest: NostrEvent,
  amount: number
): Promise<string> {
  const encodedZapRequest = encodeURIComponent(JSON.stringify(zapRequest));
  const url = `${callback}?amount=${amount}&nostr=${encodedZapRequest}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'ERROR') {
    throw new Error(data.reason);
  }

  return data.pr; // BOLT11 invoice
}
```

### 4. Complete Zap Flow

```typescript
async function sendZap(
  recipientPubkey: string,
  amount: number, // satoshis
  eventId?: string,
  message?: string
): Promise<string> {
  const amountMsats = amount * 1000;

  // 1. Get zap endpoint
  const callback = await getZapEndpoint(recipientPubkey);
  if (!callback) {
    throw new Error('Recipient does not support zaps');
  }

  // 2. Create zap request
  const zapRequest = createZapRequest({
    recipientPubkey,
    eventId,
    amount: amountMsats,
    relays: ['wss://relay.damus.io', 'wss://nos.lol'],
    content: message,
    senderSecretKey: yourSecretKey,
  });

  // 3. Get invoice
  const invoice = await requestZapInvoice(callback, zapRequest, amountMsats);

  // 4. Pay invoice (integrate with wallet)
  // This step depends on your Lightning wallet integration
  // e.g., WebLN, NWC, or external wallet

  return invoice;
}
```

### 5. WebLN Integration

```typescript
async function payWithWebLN(invoice: string): Promise<void> {
  if (typeof window.webln === 'undefined') {
    throw new Error('WebLN not available');
  }

  await window.webln.enable();
  await window.webln.sendPayment(invoice);
}

// Complete zap with WebLN
async function zapWithWebLN(
  recipientPubkey: string,
  amount: number,
  eventId?: string
): Promise<void> {
  const invoice = await sendZap(recipientPubkey, amount, eventId);
  await payWithWebLN(invoice);
}
```

## Displaying Zaps

### Fetch Zap Receipts

```typescript
async function getZapsForEvent(
  eventId: string,
  pool: SimplePool,
  relays: string[]
): Promise<ZapInfo[]> {
  const zapReceipts = await pool.querySync(relays, {
    kinds: [9735],
    '#e': [eventId],
  });

  return zapReceipts.map(receipt => parseZapReceipt(receipt)).filter(Boolean);
}

interface ZapInfo {
  sender: string;
  recipient: string;
  amount: number;
  message: string;
  eventId?: string;
  timestamp: number;
}

function parseZapReceipt(receipt: NostrEvent): ZapInfo | null {
  try {
    // Get the zap request from the receipt
    const descriptionTag = receipt.tags.find(t => t[0] === 'description');
    if (!descriptionTag) return null;

    const zapRequest = JSON.parse(descriptionTag[1]);

    // Parse amount from bolt11
    const bolt11Tag = receipt.tags.find(t => t[0] === 'bolt11');
    const amount = bolt11Tag ? parseAmount(bolt11Tag[1]) : 0;

    return {
      sender: zapRequest.pubkey,
      recipient: receipt.tags.find(t => t[0] === 'p')?.[1] || '',
      amount,
      message: zapRequest.content,
      eventId: receipt.tags.find(t => t[0] === 'e')?.[1],
      timestamp: receipt.created_at,
    };
  } catch {
    return null;
  }
}
```

### Calculate Zap Totals

```typescript
async function getZapTotal(eventId: string): Promise<number> {
  const zaps = await getZapsForEvent(eventId, pool, relays);
  return zaps.reduce((sum, zap) => sum + zap.amount, 0);
}

// Display format
function formatSats(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
}
```

## Server Implementation

### LNURL-pay Endpoint

Serve LNURL-pay info at `/.well-known/lnurlp/<username>`:

```typescript
app.get('/.well-known/lnurlp/:username', async (req, res) => {
  const { username } = req.params;
  const user = await getUser(username);

  if (!user) {
    return res.status(404).json({ status: 'ERROR', reason: 'User not found' });
  }

  res.json({
    callback: `https://example.com/api/lnurl/pay/${username}`,
    maxSendable: 100000000000, // 1 BTC in msats
    minSendable: 1000,         // 1 sat in msats
    metadata: JSON.stringify([
      ['text/plain', `Zap ${username}`],
      ['text/identifier', `${username}@example.com`],
    ]),
    tag: 'payRequest',
    allowsNostr: true,
    nostrPubkey: user.nostrPubkey, // Your server's nostr pubkey
  });
});
```

### Invoice Callback

```typescript
app.get('/api/lnurl/pay/:username', async (req, res) => {
  const { username } = req.params;
  const { amount, nostr } = req.query;

  // Validate zap request
  let zapRequest;
  if (nostr) {
    try {
      zapRequest = JSON.parse(decodeURIComponent(nostr));

      // Verify signature
      if (!verifyEvent(zapRequest)) {
        return res.status(400).json({ status: 'ERROR', reason: 'Invalid zap request' });
      }

      // Verify kind
      if (zapRequest.kind !== 9734) {
        return res.status(400).json({ status: 'ERROR', reason: 'Not a zap request' });
      }
    } catch {
      return res.status(400).json({ status: 'ERROR', reason: 'Invalid nostr event' });
    }
  }

  // Create invoice with zap request in description
  const invoice = await createInvoice({
    amount: parseInt(amount),
    description: nostr ? decodeURIComponent(nostr) : `Zap ${username}`,
  });

  res.json({ pr: invoice.bolt11, routes: [] });
});
```

### Zap Receipt Creation

When invoice is paid, create and publish zap receipt:

```typescript
async function createZapReceipt(
  paidInvoice: Invoice,
  zapRequest: NostrEvent,
  serverSecretKey: Uint8Array
): Promise<NostrEvent> {
  const tags: string[][] = [
    ['p', zapRequest.tags.find(t => t[0] === 'p')[1]],
    ['bolt11', paidInvoice.bolt11],
    ['description', JSON.stringify(zapRequest)],
  ];

  // Include event reference if present
  const eventTag = zapRequest.tags.find(t => t[0] === 'e');
  if (eventTag) {
    tags.push(['e', eventTag[1]]);
  }

  const zapReceipt = finalizeEvent({
    kind: 9735,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: '',
  }, serverSecretKey);

  // Publish to relays from zap request
  const relaysTag = zapRequest.tags.find(t => t[0] === 'relays');
  if (relaysTag) {
    const relays = relaysTag.slice(1);
    await publishToRelays(zapReceipt, relays);
  }

  return zapReceipt;
}
```

## Verification

### Verify Zap Receipts

```typescript
async function verifyZapReceipt(
  receipt: NostrEvent,
  recipientPubkey: string
): Promise<boolean> {
  // 1. Verify receipt signature
  if (!verifyEvent(receipt)) return false;

  // 2. Get recipient's LNURL info
  const lnurlInfo = await getLnurlInfo(recipientPubkey);
  if (!lnurlInfo) return false;

  // 3. Verify receipt was signed by recipient's LNURL server
  if (receipt.pubkey !== lnurlInfo.nostrPubkey) {
    console.warn('Zap receipt not signed by authorized pubkey');
    return false;
  }

  // 4. Parse and verify embedded zap request
  const descTag = receipt.tags.find(t => t[0] === 'description');
  if (!descTag) return false;

  try {
    const zapRequest = JSON.parse(descTag[1]);
    if (!verifyEvent(zapRequest)) return false;
    if (zapRequest.kind !== 9734) return false;
  } catch {
    return false;
  }

  return true;
}
```

## Nostr Wallet Connect (NWC)

For better UX, use NWC (NIP-47) for wallet integration:

```typescript
import { webln } from '@getalby/sdk';

async function connectNWC(connectionString: string) {
  const nwc = new webln.NWC({ nostrWalletConnectUrl: connectionString });
  await nwc.enable();
  return nwc;
}

async function zapWithNWC(
  nwc: webln.NWC,
  recipientPubkey: string,
  amount: number
): Promise<void> {
  const invoice = await sendZap(recipientPubkey, amount);
  await nwc.sendPayment(invoice);
}
```

## Best Practices

1. **Verify receipts** - Always verify zap receipts before displaying
2. **Cache LNURL info** - Reduce requests to Lightning servers
3. **Handle failures** - Payment can fail at many points
4. **Show pending state** - Indicate when zap is processing
5. **Support anonymous zaps** - Don't require sender authentication

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| No zap support | Missing lud16/lud06 | Check profile metadata |
| Invalid receipt | Wrong server pubkey | Verify against LNURL nostrPubkey |
| Zap not appearing | Relays not receiving | Check relay list in zap request |

## See Also

- [NIP-57 Specification](https://github.com/nostr-protocol/nips/blob/master/57.md)
- [LNURL-pay Spec](https://github.com/lnurl/luds/blob/luds/06.md)
- [Nostr Wallet Connect (NIP-47)](https://github.com/nostr-protocol/nips/blob/master/47.md)
