---
description: Slack bot development patterns using Bolt framework
globs: apps/slack/**
---

# Slack App

## Structure

```
apps/slack/src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   └── api/
│       ├── slack/events/route.ts   # Main webhook
│       └── auth/jira/callback/route.ts
└── lib/slack/
    ├── app.ts                  # Bolt app initialization
    └── handlers/
        ├── standup.ts          # /weekly-standup command
        └── setup.ts            # Setup flow handlers
```

## Bolt App Initialization

Lazy-initialized singleton in `lib/slack/app.ts`:
```typescript
let slackApp: App | null = null;

export function getSlackApp() {
  if (!slackApp) {
    slackApp = new App({
      token: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      receiver: new ExpressReceiver({ ... })
    });
    registerStandupHandlers(slackApp);
    registerSetupHandlers(slackApp);
  }
  return slackApp;
}
```

## API Route Pattern

The `/api/slack/events/route.ts` converts Next.js request to Express format:
```typescript
export async function POST(request: NextRequest) {
  const app = getSlackApp();
  // Convert to Express-compatible request
  // Call app.receiver.app(req, res)
}
```

## Handler Registration

Handlers use Bolt's decorator pattern:
```typescript
export function registerStandupHandlers(app: App) {
  app.command('/weekly-standup', handleStandupCommand);
  app.action('generate_report', handleGenerateReport);
  app.view('setup_modal', handleSetupSubmission);
}
```

## Block Kit Modals

Setup and configuration use Slack modals:
```typescript
await client.views.open({
  trigger_id,
  view: {
    type: 'modal',
    callback_id: 'setup_modal',
    blocks: [ /* Block Kit blocks */ ]
  }
});
```

## Environment Variables

```
SLACK_BOT_TOKEN       # xoxb-... token
SLACK_SIGNING_SECRET  # Request verification
```

## Development

```bash
npm run dev  # Starts on port 3001
```

For local testing, use ngrok to expose webhook URL.
