import { NextRequest, NextResponse } from 'next/server';
import { fetchBoards, getJiraTokens, buildJiraAuthUrl } from '@standup/core';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    // Check if user has Jira tokens
    const tokens = await getJiraTokens(userId);

    if (!tokens) {
      return NextResponse.json(
        {
          error: 'Jira not connected',
          needsAuth: true,
          jiraAuthUrl: buildJiraAuthUrl(userId),
        },
        { status: 401 }
      );
    }

    // Fetch boards from Jira
    const boards = await fetchBoards(userId);

    return NextResponse.json({ boards });
  } catch (error) {
    console.error('Fetch boards error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch boards' },
      { status: 500 }
    );
  }
}
