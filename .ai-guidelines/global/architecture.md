---
description: Detailed architecture, tech stack, and patterns for the standup generator
---

# Architecture

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | Turborepo 2.0 with npm workspaces |
| Runtime | Node.js 18+ |
| Language | TypeScript 5.3 |
| Web Framework | Next.js 14 (App Router) |
| UI | React 18 |
| Database | Supabase (PostgreSQL) |
| AI | Claude API (@anthropic-ai/sdk) |
| Slack | @slack/bolt 4.6 |
| Teams | botbuilder 4.22 |

## Package Relationships

```
@standup/core (packages/core)
    ├── jira/      → Jira OAuth + API client
    ├── claude/    → AI report generation
    ├── db/        → Supabase operations
    └── encryption → Token encryption

apps/slack
    └── depends on @standup/core

apps/teams
    └── depends on @standup/core
```

## Data Flow

```
User Command (Slack/Teams)
    ↓
Next.js API Route
    ↓
Platform Handler (Bolt / Bot Framework)
    ↓
Database Lookup (user, config)
    ↓
Jira API (fetch tickets)
    ↓
Claude API (generate report)
    ↓
Response to User
```

## File Organization

### Apps (`apps/slack`, `apps/teams`)

```
src/
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Landing page
│   └── api/
│       ├── slack/events/route.ts   # Slack webhook
│       └── auth/jira/callback/route.ts
└── lib/
    └── slack/           # or teams/
        ├── app.ts       # Platform client init
        └── handlers/    # Command handlers
```

### Core Package (`packages/core`)

```
src/
├── index.ts             # Main exports
├── jira/
│   ├── client.ts        # API client with auto-refresh
│   └── auth.ts          # OAuth helpers
├── claude/
│   └── index.ts         # Report generation
├── db/
│   ├── client.ts        # Supabase client
│   ├── users.ts         # User operations
│   ├── configs.ts       # Jira config operations
│   ├── tokens.ts        # OAuth token storage
│   └── ticket-names.ts  # Cached ticket names
└── encryption.ts        # AES-256-GCM encryption
```

## Key Patterns

### Lazy Initialization
Platform clients initialize on first request to avoid build-time errors:
```typescript
let slackApp: App | null = null;
export function getSlackApp() {
  if (!slackApp) {
    slackApp = new App({ ... });
    registerHandlers(slackApp);
  }
  return slackApp;
}
```

### Subpath Exports
Core package uses subpath exports for tree-shaking:
```typescript
import { fetchTickets } from '@standup/core/jira';
import { generateReport } from '@standup/core/claude';
import { getOrCreateSlackUser } from '@standup/core/db';
```

### Token Auto-Refresh
Jira tokens refresh automatically before expiration in `@packages/core/src/jira/client.ts`.
