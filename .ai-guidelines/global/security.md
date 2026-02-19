---
description: Security patterns, environment variables, and encryption
---

# Security

## Environment Variables

### Required for All Environments

```bash
# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # service_role key

# Encryption
TOKEN_ENCRYPTION_KEY=<64 hex chars>  # 32 bytes for AES-256

# Jira OAuth
JIRA_CLIENT_ID=xxx
JIRA_CLIENT_SECRET=xxx
JIRA_REDIRECT_URI=https://yourdomain.com/api/auth/jira/callback

# Claude AI
ANTHROPIC_API_KEY=sk-ant-...
```

### Slack App (`apps/slack`)

```bash
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=xxx
```

### Teams App (`apps/teams`)

```bash
MicrosoftAppId=xxx
MicrosoftAppPassword=xxx
```

## Token Encryption

OAuth tokens are encrypted at rest using AES-256-GCM.

### Implementation (`packages/core/src/encryption.ts`)

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'hex');

export function encrypt(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, data] = encrypted.split(':');

  const decipher = createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### Generating Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## OAuth State Validation

Prevent CSRF by validating state parameter:
```typescript
// Generate state with random token + user ID
const state = JSON.stringify({
  token: randomBytes(16).toString('hex'),
  userId
});

// On callback, verify state and extract userId
const parsed = JSON.parse(state);
// Validate token matches expected format
```

## Request Signing

### Slack
Bolt framework handles signing secret verification automatically.

### Teams
Bot Framework adapter validates requests using app password.

## Best Practices

1. Never log tokens or secrets
2. Use service_role key only server-side
3. Store .env files only locally (gitignored)
4. Rotate encryption keys requires re-encrypting all tokens
5. Set appropriate token expiry (Jira tokens expire in 1 hour)
