---
sidebar_position: 3
title: Mobile Development
description: Signing on iOS, Android and mobile web - NIP-55 signer apps, NIP-46 bunkers and local keys
---

# Mobile Development

A Nostr app on a phone has the same job as on the desktop: get events signed without spreading the user's secret key around. There are three ways to do it, and most mobile clients support more than one.

| Approach | Platforms | The key lives in | Spec |
|---|---|---|---|
| **Signer app** | Android | A separate app such as [Amber](https://github.com/greenart7c3/Amber) | [NIP-55](https://github.com/nostr-protocol/nips/blob/master/55.md) |
| **Remote signer (bunker)** | iOS, Android, mobile web | Another app, device or server, reached over a relay | [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md) |
| **Local key** | All | Your app, encrypted at rest | [NIP-49](https://github.com/nostr-protocol/nips/blob/master/49.md) for the encrypted form |

Prefer a signer. On Android, support NIP-55 and NIP-46. On iOS there is no app-to-app signing standard, so use NIP-46 (signers include Clave and Aegis). For maintained signers, see the wiki's [Signers & login](https://github.com/nostrcg/devguide/wiki/Extensions).

## Android signer apps (NIP-55)

The client and the signer talk through Android Intents, which open the signer so the user can approve. Once the user has chosen "remember my choice", they can also use a Content Resolver, which answers in the background. The snippets below are from NIP-55.

Declare the `nostrsigner` scheme in `AndroidManifest.xml`, then check for a signer:

```xml
<queries>
  <intent>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="nostrsigner" />
  </intent>
</queries>
```

```kotlin
fun isExternalSignerInstalled(context: Context): Boolean {
  val intent = Intent(Intent.ACTION_VIEW, Uri.parse("nostrsigner:"))
  return context.packageManager.queryIntentActivities(intent, 0).isNotEmpty()
}
```

**Log in** by sending `get_public_key`. You can pass `permissions` so the user pre-approves what you need. The result holds the user's pubkey and the signer's package name. Store both, and don't call `get_public_key` again while the user stays logged in. Send every later request to that package.

**Sign** with an Intent launched through the Activity Result API (`registerForActivityResult` or `rememberLauncherForActivityResult`), not the deprecated `startActivityForResult`:

```kotlin
val intent = Intent(Intent.ACTION_VIEW, Uri.parse("nostrsigner:$payload")).apply {
  `package` = signerPackageName        // omit only for get_public_key
  putExtra("type", "sign_event")
  putExtra("id", event.id)             // optional, echoed back
  putExtra("current_user", userPubkey)
}
launcher.launch(intent)
```

The answer comes back in the result intent's extras: `result` (here, the signature), `event` (the signed event JSON), `id`, and `rejected`:

```kotlin
onResult = { result ->
  if (result.resultCode != Activity.RESULT_OK) {
    // signer error (e.g. crash)
  } else if (result.data?.getBooleanExtra("rejected", false) == true) {
    // user rejected the request
  } else {
    val value = result.data?.getStringExtra("result")
  }
}
```

A user rejection is `RESULT_OK` with `rejected=true`. Any other result code means the signer failed. The same pattern covers `nip44_encrypt`, `nip44_decrypt` (with a `pubkey` extra for the other party) and `decrypt_zap_event`. The `nip04_*` methods also exist, but NIP-04 is deprecated.

**Web pages on Android** can't receive an Intent result. Instead, they open a `nostrsigner:<payload>?type=…&callbackUrl=…` URL, and the signer appends the result to the `callbackUrl` (or copies it to the clipboard). The user sees a prompt for every request, so NIP-55 itself recommends NIP-46 for web apps.

## Remote signers (NIP-46)

The app generates a throwaway **client key**, and the two sides exchange NIP-44-encrypted kind 24133 events over a relay. Three keys are involved, and they can all differ:

- the client key (yours, disposable: delete it on logout),
- the **remote-signer pubkey** (in the `bunker://` URL),
- the **user pubkey** (whatever `get_public_key` returns after you connect).

With a `bunker://` URL, the client's `connect` request is `[<remote-signer-pubkey>, <optional secret>, <optional perms>, <optional client metadata>]`. The client's own pubkey is not a parameter: it is the event's author. The secret works for one connection only. After connecting, **always call `get_public_key`**. Don't assume the user is the signer's key.

nostr-tools' `BunkerSigner` does all of this. It works the same in React Native, Capacitor or a mobile web app. Tested with nostr-tools 2.25.2 against `nak bunker` on a local `nak serve`, October 2026:

```js
import { generateSecretKey } from 'nostr-tools/pure'
import { BunkerSigner, parseBunkerInput } from 'nostr-tools/nip46'

// the bunker://… string the user pasted
const bp = await parseBunkerInput(userInput)
if (!bp) throw new Error('not a bunker:// URL')
// throwaway key for this app session; store it, delete it on logout
const local = generateSecretKey()
const signer = BunkerSigner.fromBunker(local, bp)
// sends connect [remote-signer-pubkey, secret, "", metadata]
await signer.connect({ name: 'My App', url: 'https://app.example.com' })

// the user's pubkey can differ from the remote signer's pubkey
const pubkey = await signer.getPublicKey()
const ev = await signer.signEvent({
  kind: 1, created_at: Math.floor(Date.now() / 1000), tags: [], content: 'hi',
})
await signer.close()
```

With the `nostrconnect://` flow, your app shows a QR code and the signer scans it. Code for that flow, and for testing with `nak bunker`, is on the wiki's [Signers & login](https://github.com/nostrcg/devguide/wiki/Extensions) page. NDK (`NDKNip46Signer`) and rust-nostr's `nostr-connect` crate offer the same thing in other stacks.

On mobile, every request is a network round trip, and the signer may need the user to approve it. Show a pending state, batch what you can, and cache decrypted data locally rather than decrypting again.

## Local keys

If your app holds the key itself, encrypt it at rest and decrypt it only into memory when it's needed:

- **iOS:** the Keychain, with an accessibility class such as `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`. Add a user-presence or biometric access control if you want a prompt.
- **Android:** encrypt the key with an AES key held in the Android Keystore, and store the ciphertext.
- **Cross-platform:** libraries such as `react-native-keychain` or `expo-secure-store` wrap those platform stores.
- **Export and backup:** offer an `ncryptsec` (NIP-49). See [Key management](./key-management.md).

:::caution What the platform keystore does and doesn't do
The keystore protects the stored key at rest and can require the device to be unlocked. It doesn't keep the key in hardware while you sign. The Secure Enclave and Android hardware-backed keys support P-256, not secp256k1, so your app has to decrypt the Nostr key into its own memory to sign with it. Malware or a compromised app process can read it there. If that risk matters, use a signer app or a bunker instead.
:::

## Mobile web and PWAs

Most mobile browsers don't run NIP-07 extensions. Firefox for Android supports extensions, but whether a given signer extension works there varies. Plan for:

1. `window.nostr` if it exists,
2. a NIP-46 login (`bunker://` paste or `nostrconnect://` QR code) as the main path,
3. on Android, a NIP-55 `nostrsigner:` link as an option.

## Open-source apps to learn from

| App | Platform | Signing |
|---|---|---|
| [Damus](https://github.com/damus-io/damus) | iOS | Local key |
| [Amethyst](https://github.com/vitorpamplona/amethyst) | Android | Local key, or NIP-55 (Amber) |
| [Amber](https://github.com/greenart7c3/Amber) | Android | The signer itself: NIP-55 and NIP-46 |

The wiki's [Open-source clients](https://github.com/nostrcg/devguide/wiki/Client-Implementations) page has more.

## Related

- [Key management](./key-management.md): NIP-49, backups, and what to do if a key leaks.
- [Building clients](./building-clients.md): the signer-agnostic client code.
- The W3C Nostr CG's [HTTP authentication using Schnorr signatures](https://nostrcg.github.io/http-schnorr-auth/) is a Community Group draft, not a NIP. For signed HTTP requests today, use [NIP-98](https://github.com/nostr-protocol/nips/blob/master/98.md) (see the wiki's [NIP-98 page](https://github.com/nostrcg/devguide/wiki/NIP%E2%80%9098)).
