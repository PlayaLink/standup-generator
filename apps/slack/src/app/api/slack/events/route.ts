import { NextRequest, NextResponse } from 'next/server';
import { getReceiver } from '@/lib/slack/app';
import { registerAllHandlers } from '@/lib/slack/handlers';

// Track if handlers have been registered
let handlersRegistered = false;

/**
 * Ensure handlers are registered (lazy initialization)
 */
function ensureHandlersRegistered() {
  if (!handlersRegistered) {
    registerAllHandlers();
    handlersRegistered = true;
  }
}

/**
 * Handle Slack events and commands
 * This is the main endpoint that Slack sends all interactions to
 */
export async function POST(request: NextRequest) {
  // Register handlers on first request
  ensureHandlersRegistered();
  const body = await request.text();
  const headers: Record<string, string> = {};

  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Create a mock request/response for Express receiver
  const expressReq = {
    body: JSON.parse(body),
    rawBody: Buffer.from(body),
    headers,
  };

  return new Promise<NextResponse>((resolve) => {
    const expressRes = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      body: '',
      setHeader(key: string, value: string) {
        this.headers[key] = value;
        return this;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      send(body: string) {
        this.body = body;
        resolve(
          new NextResponse(this.body, {
            status: this.statusCode,
            headers: this.headers,
          })
        );
        return this;
      },
      end() {
        resolve(
          new NextResponse(this.body, {
            status: this.statusCode,
            headers: this.headers,
          })
        );
        return this;
      },
    };

    // Process through Bolt
    getReceiver().requestHandler(expressReq as any, expressRes as any);
  });
}

/**
 * Handle URL verification challenge from Slack
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok' });
}
