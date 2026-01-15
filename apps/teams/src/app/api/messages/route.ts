import { NextRequest, NextResponse } from 'next/server';
import { adapter, bot } from '@/lib/teams';

/**
 * Handle incoming Bot Framework messages from Teams
 * This is the webhook endpoint configured in Azure Bot Service
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the incoming request
    const body = await request.json();
    const headers: Record<string, string> = {};

    // Convert NextRequest headers to plain object
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Create a mock response to capture the Bot Framework's response
    let responseBody = '';
    let responseStatus = 200;

    const mockResponse = {
      status: (code: number) => {
        responseStatus = code;
        return mockResponse;
      },
      send: (data: string) => {
        responseBody = data;
        return mockResponse;
      },
      end: () => mockResponse,
    };

    // Process the activity through the adapter
    await adapter.process(
      {
        body,
        headers,
        method: 'POST',
      } as any,
      mockResponse as any,
      async (context) => {
        await bot.run(context);
      }
    );

    return new NextResponse(responseBody || null, {
      status: responseStatus,
    });
  } catch (error) {
    console.error('[Bot API Error]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Bot Framework also makes GET requests for health checks
export async function GET() {
  return new NextResponse('Bot is running', { status: 200 });
}
