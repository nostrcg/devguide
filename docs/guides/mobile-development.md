---
sidebar_position: 3
title: Mobile Development
description: Building Nostr apps for iOS, Android, and mobile web
---

# Mobile Development

Nostr's architecture separates identity (key management) from applications. This means mobile apps don't require browser extensions—there are multiple signing approaches that work natively on mobile devices.

## Signing Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SIGNING OPTIONS                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Built-in Keys  │ External Signer │    Remote Signer        │
│                 │                 │                         │
│  Keys stored    │  Separate app   │  Key on another         │
│  in app's       │  handles all    │  device entirely        │
│  secure storage │  signing        │  (NIP-46)               │
├─────────────────┼─────────────────┼─────────────────────────┤
│  Damus (iOS)    │  Amber (Android)│  Nostr Connect          │
│  Amethyst       │                 │  nsecBunker             │
│  Primal         │                 │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## Approach 1: Native Apps with Built-in Signing

Most popular Nostr mobile apps store keys securely on-device using platform security features.

### iOS Development

iOS apps use the Keychain for secure key storage:

```swift
import Security

class NostrKeyManager {
    private let service = "nostr-keys"

    func storePrivateKey(_ privateKey: Data, for pubkey: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: pubkey,
            kSecValueData as String: privateKey,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.unableToStore
        }
    }

    func getPrivateKey(for pubkey: String) throws -> Data {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: pubkey,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess, let data = result as? Data else {
            throw KeychainError.notFound
        }
        return data
    }
}
```

**iOS Libraries:**
- [secp256k1.swift](https://github.com/GigaBitcoin/secp256k1.swift) - Schnorr signatures
- [NostrKit](https://github.com/nickkjordan/NostrKit) - Swift Nostr library

### Android Development

Android apps use the Keystore system:

```kotlin
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

class NostrKeyManager(private val context: Context) {
    private val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    private val sharedPrefs = context.getSharedPreferences("nostr_keys", Context.MODE_PRIVATE)

    fun storePrivateKey(privateKeyHex: String, pubkey: String) {
        // Generate encryption key in hardware-backed keystore
        val keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore"
        )
        keyGenerator.init(
            KeyGenParameterSpec.Builder(
                "nostr_$pubkey",
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .build()
        )
        val secretKey = keyGenerator.generateKey()

        // Encrypt and store the Nostr private key
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, secretKey)
        val encrypted = cipher.doFinal(privateKeyHex.toByteArray())

        sharedPrefs.edit()
            .putString("encrypted_$pubkey", Base64.encodeToString(encrypted, Base64.DEFAULT))
            .putString("iv_$pubkey", Base64.encodeToString(cipher.iv, Base64.DEFAULT))
            .apply()
    }
}
```

**Android Libraries:**
- [secp256k1-kmp](https://github.com/nickkjordan/NostrKit) - Kotlin multiplatform secp256k1
- [nostr-kotlin](https://github.com/nickkjordan/NostrKit) - Kotlin Nostr library

### Cross-Platform (React Native / Flutter)

**React Native:**
```javascript
import * as Keychain from 'react-native-keychain';
import { schnorr } from '@noble/curves/secp256k1';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

class NostrKeyManager {
  async storeKey(nsec, pubkey) {
    await Keychain.setGenericPassword(pubkey, nsec, {
      service: 'nostr-keys',
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
    });
  }

  async sign(eventHash, pubkey) {
    const credentials = await Keychain.getGenericPassword({ service: 'nostr-keys' });
    if (!credentials) throw new Error('Key not found');

    const privateKey = hexToBytes(credentials.password);
    const signature = schnorr.sign(eventHash, privateKey);
    return bytesToHex(signature);
  }
}
```

**Flutter:**
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class NostrKeyManager {
  final _storage = FlutterSecureStorage();

  Future<void> storeKey(String nsec, String pubkey) async {
    await _storage.write(
      key: 'nostr_$pubkey',
      value: nsec,
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
      iOptions: IOSOptions(accessibility: KeychainAccessibility.unlocked_this_device),
    );
  }

  Future<String?> getKey(String pubkey) async {
    return await _storage.read(key: 'nostr_$pubkey');
  }
}
```

## Approach 2: External Signers

External signers are separate apps that handle key storage and signing. Your app requests signatures through intents/deep links.

### Amber (Android)

[Amber](https://github.com/greenart7c3/Amber) is the primary external signer for Android.

**How it works:**
1. User installs Amber and imports their key
2. Your app sends signing requests via Android intents
3. Amber prompts user for approval
4. Signed event returned to your app

```kotlin
// Request signature from Amber
fun requestSignature(event: UnsignedEvent) {
    val intent = Intent(Intent.ACTION_VIEW).apply {
        data = Uri.parse("nostrsigner:${event.toJson()}")
        putExtra("type", "sign_event")
        putExtra("returnType", "signature")
    }
    startActivityForResult(intent, SIGN_REQUEST_CODE)
}

// Handle response
override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode == SIGN_REQUEST_CODE && resultCode == RESULT_OK) {
        val signature = data?.getStringExtra("signature")
        // Attach signature to event
    }
}
```

**Benefits:**
- Keys never leave Amber
- User approves each signature
- Works with any Nostr app that supports it
- Single key management for multiple apps

### iOS Signer Apps

iOS has more restrictions on inter-app communication, but similar patterns exist:
- URL schemes for signing requests
- App groups for shared keychain access
- Universal links for web-to-app flows

## Approach 3: Remote Signing (NIP-46)

NIP-46 (Nostr Connect) allows keys to be stored on a completely separate device. Signing requests are sent encrypted over Nostr relays.

```
┌──────────────┐                         ┌──────────────┐
│  Mobile App  │◄───── Relay ──────────►│ Desktop/     │
│  (client)    │   Encrypted requests   │ Secure Device│
│              │   via kind 24133       │ (signer)     │
└──────────────┘                         └──────────────┘
```

### Connecting to a Remote Signer

```javascript
import { nip46 } from 'nostr-tools';

class RemoteSigner {
  constructor(relayUrl) {
    this.relay = relayUrl;
    this.pool = new SimplePool();
  }

  async connect(bunkerUrl) {
    // bunkerUrl format: bunker://<signer-pubkey>?relay=wss://...&secret=...
    const parsed = nip46.parseBunkerUrl(bunkerUrl);

    this.signerPubkey = parsed.pubkey;
    this.secret = parsed.secret;
    this.relays = parsed.relays;

    // Generate ephemeral keypair for this session
    this.clientSecretKey = generateSecretKey();
    this.clientPubkey = getPublicKey(this.clientSecretKey);

    // Send connect request
    await this.sendRequest('connect', [this.clientPubkey, this.secret]);
  }

  async signEvent(event) {
    const response = await this.sendRequest('sign_event', [JSON.stringify(event)]);
    return JSON.parse(response);
  }

  async sendRequest(method, params) {
    const request = {
      id: crypto.randomUUID(),
      method,
      params
    };

    // Encrypt request with NIP-04
    const encrypted = await nip04.encrypt(
      this.clientSecretKey,
      this.signerPubkey,
      JSON.stringify(request)
    );

    // Publish as kind 24133
    const event = finalizeEvent({
      kind: 24133,
      content: encrypted,
      tags: [['p', this.signerPubkey]],
      created_at: Math.floor(Date.now() / 1000)
    }, this.clientSecretKey);

    await this.pool.publish(this.relays, event);

    // Wait for response...
    return this.waitForResponse(request.id);
  }
}
```

### Available NIP-46 Signers

- **nsecBunker** - Self-hosted remote signer
- **Nostr Connect** - Protocol for remote signing
- **Amber** - Also supports NIP-46 mode

## Progressive Web Apps (PWAs)

Web apps work on any mobile browser and can use multiple signing approaches.

### Local Key Storage

```javascript
// Use IndexedDB with encryption for local keys
import { openDB } from 'idb';

class WebKeyManager {
  async init() {
    this.db = await openDB('nostr-keys', 1, {
      upgrade(db) {
        db.createObjectStore('keys', { keyPath: 'pubkey' });
      }
    });
  }

  async storeKey(privateKey, pubkey, password) {
    // Derive encryption key from password
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const encryptionKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Encrypt the private key
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      encryptionKey,
      new TextEncoder().encode(privateKey)
    );

    await this.db.put('keys', {
      pubkey,
      encrypted: new Uint8Array(encrypted),
      iv,
      salt
    });
  }
}
```

### NIP-07 on Mobile Browsers

Some mobile browsers support extensions:
- **Firefox Android** - Supports nos2x and other extensions
- **Kiwi Browser** - Chrome extension support on Android
- **Orion** - Safari extension support on iOS

For browsers without extension support, fall back to:
1. NIP-46 remote signing
2. Local encrypted key storage
3. Deep links to native signer apps

## Comparison Matrix

| Approach | Security | UX | Cross-App | Offline |
|----------|----------|-----|-----------|---------|
| Built-in Keys | Good | Best | No | Yes |
| External Signer (Amber) | Better | Good | Yes | Yes |
| Remote Signer (NIP-46) | Best | Moderate | Yes | No |
| PWA + Local Keys | Moderate | Good | No | Yes |
| PWA + NIP-46 | Best | Moderate | Yes | No |

## Best Practices

### Key Security

1. **Use platform secure storage** - Keychain (iOS), Keystore (Android)
2. **Never log private keys** - Even in debug builds
3. **Clear memory after use** - Zero out key bytes when done
4. **Biometric protection** - Require Face ID/fingerprint for signing

### User Experience

1. **Support multiple signing methods** - Let users choose
2. **Remember user's signer** - Don't ask every time
3. **Handle signer unavailable** - Graceful degradation
4. **Show signing prompts** - User should know what they're signing

### Example: Multi-Signer Support

```javascript
class SignerManager {
  constructor() {
    this.signer = null;
  }

  async detectAvailableSigners() {
    const signers = [];

    // Check for NIP-07 (browser extension)
    if (typeof window !== 'undefined' && window.nostr) {
      signers.push({ type: 'nip07', name: 'Browser Extension' });
    }

    // Check for Amber (Android)
    if (this.isAndroid() && await this.checkAmberInstalled()) {
      signers.push({ type: 'amber', name: 'Amber' });
    }

    // NIP-46 is always available
    signers.push({ type: 'nip46', name: 'Remote Signer' });

    // Local keys as fallback
    signers.push({ type: 'local', name: 'Local Key' });

    return signers;
  }

  async sign(event) {
    switch (this.signer.type) {
      case 'nip07':
        return window.nostr.signEvent(event);
      case 'amber':
        return this.signWithAmber(event);
      case 'nip46':
        return this.remoteSigner.signEvent(event);
      case 'local':
        return this.signLocally(event);
    }
  }
}
```

## Real-World Examples

### Damus (iOS)
- Native Swift app
- Keys in iOS Keychain
- [Source Code](https://github.com/damus-io/damus)

### Amethyst (Android)
- Native Kotlin app
- Supports both local keys and Amber
- [Source Code](https://github.com/vitorpamplona/amethyst)

### Primal (Cross-platform)
- React Native
- iOS and Android apps
- Web PWA
- [Website](https://primal.net)

## HTTP Schnorr Authentication

The W3C Nostr Community Group is developing [HTTP Authentication Using Schnorr Signatures](https://nostrcg.github.io/http-schnorr-auth/)—a specification that brings Nostr's signing capabilities to standard HTTP authentication.

### Why This Matters for Mobile

Schnorr-based HTTP auth means:
- **Single Sign-On (SSO)** across any service using your Nostr identity
- **No passwords** - sign challenges with your existing Nostr key
- **Works everywhere** - any HTTP client, any platform
- **Pod/server migration** - signed statements can authorize data moves

### Use Case: Decentralized Storage Migration

A user can sign a statement like "move my data from pod A to pod B" and any compliant server can verify and honor that request—no DNS changes or domain ownership required.

```javascript
// Sign a migration authorization
const migrationEvent = {
  kind: 10002,  // Or custom kind for migrations
  content: JSON.stringify({
    action: 'migrate',
    from: 'https://old-pod.example.com',
    to: 'https://new-pod.example.com',
    timestamp: Date.now()
  }),
  tags: [],
  created_at: Math.floor(Date.now() / 1000)
};

const signed = await signer.signEvent(migrationEvent);
// New pod verifies signature matches the user's pubkey
```

This pattern works regardless of whether the user has a domain name or understands DNS—the cryptographic signature is the proof of authorization.

### Related Specifications

- [HTTP Schnorr Auth Spec](https://nostrcg.github.io/http-schnorr-auth/) - W3C Nostr CG draft
- [did:nostr](https://nostrcg.github.io/did-nostr/) - DID method using Nostr keys

## See Also

- [Key Management](./key-management) - Detailed key security practices
- [Building Clients](./building-clients) - General client architecture
- [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md) - Browser extension spec
- [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md) - Remote signing spec
- [NIP-55](https://github.com/nostr-protocol/nips/blob/master/55.md) - Android signer spec
- [HTTP Schnorr Auth](https://github.com/nostrcg/http-schnorr-auth) - CG work item
