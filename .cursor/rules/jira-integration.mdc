---
description: Jira OAuth flow and API integration patterns
---

# Jira Integration

## OAuth 2.0 Flow

### 1. Generate Auth URL

In `packages/core/src/jira/auth.ts`:
```typescript
export function getJiraAuthUrl(userId: string, redirectUri: string) {
  const state = JSON.stringify({ token: randomBytes(16).toString('hex'), userId });

  return `https://auth.atlassian.com/authorize?` +
    `audience=api.atlassian.com&` +
    `client_id=${process.env.JIRA_CLIENT_ID}&` +
    `scope=${encodeURIComponent('read:jira-work read:jira-user offline_access')}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${encodeURIComponent(state)}&` +
    `response_type=code&` +
    `prompt=consent`;
}
```

### 2. Handle Callback

In `apps/*/src/app/api/auth/jira/callback/route.ts`:
```typescript
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = JSON.parse(request.nextUrl.searchParams.get('state')!);

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);

  // Get accessible resources (cloud ID)
  const resources = await getAccessibleResources(tokens.access_token);

  // Store tokens and config
  await storeJiraTokens(state.userId, tokens);
  await updateJiraConfig(state.userId, resources[0]);
}
```

### 3. Token Exchange

```typescript
const response = await fetch('https://auth.atlassian.com/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    client_id: process.env.JIRA_CLIENT_ID,
    client_secret: process.env.JIRA_CLIENT_SECRET,
    code,
    redirect_uri: process.env.JIRA_REDIRECT_URI
  })
});
```

## API Client

In `packages/core/src/jira/client.ts`:

### Auto Token Refresh
```typescript
async function getValidToken(userId: string) {
  const tokens = await getJiraTokens(userId);

  // Refresh if within 5 minutes of expiry
  if (tokens.expires_at < Date.now() + 5 * 60 * 1000) {
    const refreshed = await refreshToken(tokens.refresh_token);
    await storeJiraTokens(userId, refreshed);
    return refreshed.access_token;
  }

  return tokens.access_token;
}
```

### Fetch Tickets
```typescript
export async function fetchTickets(userId: string) {
  const token = await getValidToken(userId);
  const config = await getJiraConfig(userId);

  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${config.jira_cloud_id}/rest/api/3/search?` +
    `jql=project=${config.project_key} AND assignee=currentUser()`,
    { headers: { Authorization: `Bearer ${token}` }}
  );

  return response.json();
}
```

### Get Boards
```typescript
export async function getBoards(userId: string) {
  const token = await getValidToken(userId);
  const config = await getJiraConfig(userId);

  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${config.jira_cloud_id}/rest/agile/1.0/board`,
    { headers: { Authorization: `Bearer ${token}` }}
  );

  return response.json();
}
```

## Required Scopes

```
read:jira-work   # Read issues, boards, sprints
read:jira-user   # Read user info (for assignee)
offline_access   # Get refresh token
```

## Environment Variables

```
JIRA_CLIENT_ID     # OAuth app client ID
JIRA_CLIENT_SECRET # OAuth app client secret
JIRA_REDIRECT_URI  # Callback URL
```
