---
sidebar_position: 1
title: Key Management
description: Best practices for managing Nostr keys securely
---

# Key Management

Your private key is your identity in Nostr. This guide covers secure key management practices.

## Key Security Fundamentals

:::danger Private Key Security
Your private key grants full control over your Nostr identity. If compromised:
- Someone can impersonate you forever
- There's no password reset or account recovery
- All your followers and reputation transfer to the attacker
:::

### Security Principles

1. **Never share your nsec** - Treat it like a password
2. **Never paste into websites** - Use NIP-07 extensions
3. **Use encrypted storage** - Password managers
4. **Backup securely** - Multiple encrypted copies
5. **Consider key separation** - Different keys for different purposes

## Storage Options

### Browser Extensions (Recommended)

Use NIP-07 extensions to sign without exposing keys:

**Popular Extensions:**
- [Alby](https://getalby.com) - Lightning + Nostr
- [nos2x](https://github.com/fiatjaf/nos2x) - Minimal signer
- [Flamingo](https://getflamingo.org) - Full-featured

**Benefits:**
- Key never exposed to websites
- Permission prompts before signing
- Works across all NIP-07 compatible apps

```javascript
// App requests signature (never sees private key)
if (window.nostr) {
  const pubkey = await window.nostr.getPublicKey();
  const signedEvent = await window.nostr.signEvent(unsignedEvent);
}
```

### Password Managers

Store your nsec in a password manager:

- **1Password** - Business-grade security
- **Bitwarden** - Open source
- **KeePass** - Local storage

**Tips:**
- Store as a secure note
- Include associated npub
- Add relay hints

### Hardware Wallets

For maximum security, use hardware signing:

- **Ledger** - Limited Nostr support
- **Trezor** - Limited Nostr support
- **DIY signers** - Custom implementations

## Key Derivation

### From Mnemonic (BIP-39)

Generate keys from a seed phrase:

```javascript
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import { bytesToHex } from '@noble/hashes/utils';

// Generate mnemonic
const mnemonic = generateMnemonic(wordlist);
console.log('Mnemonic:', mnemonic);
// Save this securely!

// Derive Nostr key (NIP-06 path)
const seed = mnemonicToSeedSync(mnemonic);
const hdKey = HDKey.fromMasterSeed(seed);
const derived = hdKey.derive("m/44'/1237'/0'/0/0");

const privateKey = bytesToHex(derived.privateKey);
```

**NIP-06 Derivation Path:** `m/44'/1237'/<account>'/0/0`

### Advantages of Mnemonic

- **Backup** - 12/24 words easier to write down
- **Recovery** - Standard format, multiple implementations
- **Multiple keys** - Derive many keys from one seed

## Key Rotation

Nostr doesn't have built-in key rotation, but you can migrate:

### Migration Steps

1. **Generate new keypair**
2. **Announce migration** (kind 0 update mentioning new key)
3. **Update NIP-05** verification
4. **Notify followers** through old key
5. **Republish important content** with new key

### Migration Event

```javascript
const migrationNotice = {
  kind: 1,
  content: `Migrating to new key: ${newNpub}. Please follow my new account.`,
  tags: [['p', newPubkey]]
};
```

## Multiple Keys Strategy

Consider using different keys for different purposes:

| Key | Purpose | Security Level |
|-----|---------|----------------|
| Main | Primary identity | Maximum |
| Testing | Development | Low |
| Anonymous | Privacy-sensitive | Medium |
| Bot | Automated posts | Medium |

### Implementation

```javascript
const keys = {
  main: { nsec: process.env.NOSTR_MAIN_NSEC },
  testing: { nsec: process.env.NOSTR_TEST_NSEC },
  bot: { nsec: process.env.NOSTR_BOT_NSEC }
};

function getKey(purpose) {
  const key = keys[purpose];
  if (!key) throw new Error(`Unknown key purpose: ${purpose}`);
  return key;
}
```

## Signing Delegation (NIP-26)

Delegate signing authority without sharing main key:

```javascript
// Create delegation token
const delegation = {
  pubkey: delegateePubkey,
  kind: 1,  // Only kind 1 events
  since: Math.floor(Date.now() / 1000),
  until: Math.floor(Date.now() / 1000) + 86400 * 30,  // 30 days
};

// Sign delegation
const delegationToken = signDelegation(mainPrivateKey, delegation);

// Delegatee includes in their events
const event = {
  kind: 1,
  content: 'Posted on behalf of main account',
  tags: [
    ['delegation', mainPubkey, conditionsString, delegationToken]
  ]
};
```

## Remote Signing (NIP-46)

Sign events from a separate device:

```
┌─────────────┐        Relay        ┌─────────────┐
│  App/Client │◄──────────────────►│   Signer    │
│  (bunker)   │   Encrypted msgs    │  (nsecApp)  │
└─────────────┘                     └─────────────┘
```

### Benefits

- Key stored on secure device
- Works across multiple clients
- Approve each signing request

## Backup Best Practices

### What to Backup

- Private key (nsec)
- Mnemonic phrase (if used)
- Relay list
- NIP-05 verification info

### Backup Methods

1. **Encrypted file** on multiple drives
2. **Paper backup** in secure location
3. **Split key** across multiple locations
4. **Password manager** with 2FA

### Recovery Testing

Periodically verify your backups:

```javascript
import { nip19 } from 'nostr-tools';
import { getPublicKey } from 'nostr-tools/pure';

// Decode backup nsec
const { type, data: sk } = nip19.decode(backupNsec);
const pk = getPublicKey(sk);
const npub = nip19.npubEncode(pk);

// Verify it matches expected npub
console.log('Restored npub:', npub);
```

## Common Mistakes

### Avoid These

1. **Sharing nsec publicly** - Even accidentally in screenshots
2. **Storing in plain text** - Use encryption
3. **Single backup** - Have multiple copies
4. **No testing** - Verify backups work
5. **Trusting random websites** - Use established tools

### If Compromised

1. **Stop using the key immediately**
2. **Post migration notice** from compromised key
3. **Generate new key** and update everywhere
4. **Revoke NIP-05** verification
5. **Alert your followers**

## Tools

### Key Generation

```bash
# Using nak
nak key generate

# Using nostr-tools
npx nostr-tools generate-key
```

### Key Verification

```bash
# Decode and verify
nak decode nsec1...
nak decode npub1...

# Verify matching pair
nak key public nsec1...
```

## See Also

- [Keys and Signing](../getting-started/keys-and-signing)
- [NIP-06: Key Derivation](https://github.com/nostr-protocol/nips/blob/master/06.md)
- [NIP-46: Remote Signing](https://github.com/nostr-protocol/nips/blob/master/46.md)
