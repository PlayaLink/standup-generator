---
description: Teams bot development patterns using Bot Framework
globs: apps/teams/**
---

# Teams App

## Structure

```
apps/teams/src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   └── api/
│       ├── messages/route.ts   # Bot Framework webhook
│       └── auth/jira/callback/route.ts
└── lib/teams/
    ├── bot.ts                  # StandupBot class
    ├── adapter.ts              # CloudAdapter setup
    ├── cards/                  # Adaptive Card builders
    └── handlers/
        ├── standup.ts          # Report generation
        └── setup.ts            # Jira connection flow
```

## Bot Class

Extends `ActivityHandler` in `lib/teams/bot.ts`:
```typescript
export class StandupBot extends ActivityHandler {
  constructor() {
    super();
    this.onMessage(async (context, next) => {
      const text = context.activity.text?.toLowerCase();
      if (text.includes('setup')) {
        await handleSetup(context);
      } else if (text.includes('standup') || text.includes('report')) {
        await handleStandup(context);
      }
      await next();
    });
  }
}
```

## CloudAdapter

Lazy-initialized in `lib/teams/adapter.ts`:
```typescript
let adapter: CloudAdapter | null = null;

export function getAdapter() {
  if (!adapter) {
    adapter = new CloudAdapter({
      MicrosoftAppId: process.env.MicrosoftAppId,
      MicrosoftAppPassword: process.env.MicrosoftAppPassword
    });
  }
  return adapter;
}
```

## API Route

The `/api/messages/route.ts` handles Bot Framework protocol:
```typescript
export async function POST(request: NextRequest) {
  const adapter = getAdapter();
  const bot = getBot();
  await adapter.process(request, response, (context) => bot.run(context));
}
```

## Adaptive Cards

Cards built in `lib/teams/cards/`:
```typescript
export function buildSetupCard(): Attachment {
  return CardFactory.adaptiveCard({
    type: 'AdaptiveCard',
    body: [ /* card elements */ ],
    actions: [ /* card actions */ ]
  });
}
```

Send cards via:
```typescript
await context.sendActivity({
  attachments: [buildReportCard(report)]
});
```

## Environment Variables

```
MicrosoftAppId        # Bot registration app ID
MicrosoftAppPassword  # Bot registration password
```

## Development

```bash
npm run dev  # Starts on port 3002
```

Use Bot Framework Emulator or ngrok for local testing.
