---
sidebar_position: 9
title: NIP-05 Verification
description: Setting up NIP-05 identifier verification
---

# NIP-05 Verification

NIP-05 maps Nostr public keys to DNS-based internet identifiers, enabling human-readable addresses like `alice@example.com`.

## How It Works

1. User adds `nip05` field to their profile (kind 0)
2. Client fetches `https://example.com/.well-known/nostr.json?name=alice`
3. Server returns JSON mapping name to public key
4. Client verifies the pubkey matches

```
alice@example.com  →  Fetch /.well-known/nostr.json
                   →  Verify pubkey matches profile
                   →  Display ✓ verified
```

## Setting Up Verification

### 1. Create nostr.json

Create `/.well-known/nostr.json` on your domain:

```json
{
  "names": {
    "alice": "a1b2c3d4e5f6..."
  },
  "relays": {
    "a1b2c3d4e5f6...": [
      "wss://relay.damus.io",
      "wss://nos.lol"
    ]
  }
}
```

The `relays` field is optional but helps clients find where to reach you.

### 2. Server Configuration

#### Nginx

```nginx
location /.well-known/nostr.json {
    add_header Access-Control-Allow-Origin *;
    add_header Content-Type application/json;
    try_files $uri =404;
}
```

#### Apache

```apache
<Directory "/.well-known">
    Header set Access-Control-Allow-Origin "*"
</Directory>

<Files "nostr.json">
    ForceType application/json
</Files>
```

#### Caddy

```
example.com {
    header /.well-known/nostr.json Access-Control-Allow-Origin *
    file_server
}
```

### 3. Update Your Profile

Add the `nip05` field to your kind 0 event:

```javascript
const profileEvent = finalizeEvent({
  kind: 0,
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  content: JSON.stringify({
    name: 'Alice',
    about: 'Building on Nostr',
    picture: 'https://example.com/avatar.jpg',
    nip05: 'alice@example.com'  // Add this
  })
}, secretKey);

await pool.publish(relays, profileEvent);
```

## Domain-Level Verification

To verify with just a domain (e.g., `_@example.com`), use `_` as the name:

```json
{
  "names": {
    "_": "a1b2c3d4e5f6..."
  }
}
```

The user would set `nip05` to `_@example.com` or just `example.com`.

## GitHub Pages Setup

Host verification for free on GitHub Pages:

1. Create a repository (e.g., `nostr-verification`)

2. Create `.well-known/nostr.json`:
```json
{
  "names": {
    "yourname": "your-64-char-hex-pubkey"
  }
}
```

3. Add `_config.yml` to include dotfiles:
```yaml
include: [".well-known"]
```

4. Enable GitHub Pages in repository settings

5. Set `nip05` to `yourname@yourusername.github.io`

## Dynamic Verification Service

For multiple users, create a dynamic endpoint:

```typescript
// Express.js example
app.get('/.well-known/nostr.json', async (req, res) => {
  const { name } = req.query;

  // Set CORS header
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (!name) {
    // Return all users (optional)
    const allUsers = await getAllNostrUsers();
    return res.json({
      names: allUsers.reduce((acc, user) => {
        acc[user.name] = user.pubkey;
        return acc;
      }, {})
    });
  }

  // Find specific user
  const user = await findUserByName(name);

  if (!user) {
    return res.json({ names: {} });
  }

  res.json({
    names: {
      [name]: user.pubkey
    },
    relays: {
      [user.pubkey]: user.relays || []
    }
  });
});
```

## Client Verification

### Verify a NIP-05 Identifier

```typescript
interface NIP05Result {
  pubkey: string;
  relays?: string[];
}

async function verifyNIP05(
  identifier: string
): Promise<NIP05Result | null> {
  // Parse identifier
  let name: string;
  let domain: string;

  if (identifier.includes('@')) {
    [name, domain] = identifier.split('@');
  } else {
    name = '_';
    domain = identifier;
  }

  // Fetch nostr.json
  const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const pubkey = data.names?.[name];

    if (!pubkey) return null;

    return {
      pubkey,
      relays: data.relays?.[pubkey]
    };
  } catch (error) {
    console.error('NIP-05 verification failed:', error);
    return null;
  }
}
```

### Verify Profile NIP-05

```typescript
async function verifyProfile(profile: NostrEvent): Promise<boolean> {
  try {
    const metadata = JSON.parse(profile.content);
    const nip05 = metadata.nip05;

    if (!nip05) return false;

    const result = await verifyNIP05(nip05);

    if (!result) return false;

    // Check if the pubkey matches
    return result.pubkey === profile.pubkey;
  } catch {
    return false;
  }
}
```

### Using nostr-tools

```typescript
import { nip05 } from 'nostr-tools';

// Query NIP-05
const profile = await nip05.queryProfile('alice@example.com');
// Returns: { pubkey: '...', relays: ['wss://...'] }

// Verify user's profile
const metadata = JSON.parse(profileEvent.content);
if (metadata.nip05) {
  const verified = await nip05.queryProfile(metadata.nip05);
  if (verified?.pubkey === profileEvent.pubkey) {
    console.log('NIP-05 verified!');
  }
}
```

## Caching Verification

```typescript
class NIP05Cache {
  private cache: Map<string, { result: NIP05Result | null; expires: number }>;
  private ttl: number;

  constructor(ttlMinutes: number = 60) {
    this.cache = new Map();
    this.ttl = ttlMinutes * 60 * 1000;
  }

  async verify(identifier: string): Promise<NIP05Result | null> {
    const cached = this.cache.get(identifier);
    if (cached && cached.expires > Date.now()) {
      return cached.result;
    }

    const result = await verifyNIP05(identifier);
    this.cache.set(identifier, {
      result,
      expires: Date.now() + this.ttl
    });

    return result;
  }

  invalidate(identifier: string) {
    this.cache.delete(identifier);
  }
}
```

## Best Practices

### For Users

1. **Use your own domain** - More trustworthy than free services
2. **Keep it simple** - Use a memorable identifier
3. **Maintain it** - Keep the JSON file updated if keys change
4. **Use HTTPS** - Required for verification to work

### For Developers

1. **Cache results** - Avoid repeated requests
2. **Handle failures gracefully** - Network issues are common
3. **Don't block on verification** - Verify asynchronously
4. **Show verification status** - Display checkmarks or badges

### For Service Providers

1. **Set CORS headers** - Required for browser clients
2. **Use proper Content-Type** - `application/json`
3. **Don't redirect** - Clients must ignore redirects
4. **Handle query params** - Support `?name=` filtering

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| CORS error | Missing header | Add `Access-Control-Allow-Origin: *` |
| 404 error | Wrong path | Ensure `.well-known/nostr.json` exists |
| JSON parse error | Invalid JSON | Validate JSON syntax |
| Pubkey mismatch | Wrong key format | Use 64-char lowercase hex |
| Redirect followed | Server redirects | Configure server to not redirect |

## Verification Services

If you don't have a domain, use these services:

| Service | Format | Notes |
|---------|--------|-------|
| nostr.directory | name@nostr.directory | Free |
| iris.to | name@iris.to | Free with Iris |
| nostrplebs.com | name@nostrplebs.com | Paid |
| nostrcheck.me | name@nostrcheck.me | Free |

## Security Considerations

- NIP-05 is **identification, not authentication**
- Anyone controlling a domain can claim any identifier
- Don't rely solely on NIP-05 for trust decisions
- Combine with Web of Trust for better security

## See Also

- [NIP-05 Specification](https://github.com/nostr-protocol/nips/blob/master/05.md)
- [Keys and Signing](../getting-started/keys-and-signing)
- [Social Graph](./social-graph)
