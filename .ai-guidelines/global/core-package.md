---
description: Patterns for working with @standup/core shared library
globs: packages/core/**
---

# Core Package (@standup/core)

## Module Structure

```
packages/core/src/
├── index.ts          # Main exports
├── jira/
│   ├── client.ts     # API client with auto-refresh
│   └── auth.ts       # OAuth URL generation
├── claude/
│   └── index.ts      # Report generation
├── db/
│   ├── client.ts     # Supabase singleton
│   ├── users.ts      # User CRUD
│   ├── configs.ts    # Jira config storage
│   ├── tokens.ts     # OAuth token storage
│   └── ticket-names.ts
└── encryption.ts     # AES-256-GCM
```

## Subpath Exports

Defined in `package.json`:
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./jira": "./dist/jira/index.js",
    "./claude": "./dist/claude/index.js",
    "./db": "./dist/db/index.js",
    "./encryption": "./dist/encryption.js"
  }
}
```

Usage:
```typescript
import { fetchTickets, getBoards } from '@standup/core/jira';
import { generateStandupReport } from '@standup/core/claude';
import { getOrCreateSlackUser, getJiraConfig } from '@standup/core/db';
import { encrypt, decrypt } from '@standup/core/encryption';
```

## Database Functions

User operations (`db/users.ts`):
- `getOrCreateSlackUser(slackUserId, slackTeamId)`
- `getOrCreateTeamsUser(teamsUserId, teamsTenantId)`

Config operations (`db/configs.ts`):
- `getJiraConfig(userId)`
- `updateBoardSelection(userId, boardId, boardName, projectKey)`

Token operations (`db/tokens.ts`):
- `storeJiraTokens(userId, tokens)`
- `getJiraTokens(userId)`
- `hasValidToken(userId, provider)`

## Jira Client

Located in `jira/client.ts`:
- Auto-refreshes tokens before expiration (5-min buffer)
- Provides `fetchTickets(userId)` and `getBoards(userId)`

## Claude Integration

Located in `claude/index.ts`:
- Uses `claude-sonnet-4-20250514` model
- `generateStandupReport(tickets)` returns formatted report

## Build

Uses `tsup` for bundling:
```bash
cd packages/core && npm run build
```

Outputs both CJS and ESM to `dist/`.
