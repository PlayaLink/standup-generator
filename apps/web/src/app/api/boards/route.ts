import { NextRequest, NextResponse } from 'next/server';
import { fetchBoards, getJiraTokens, buildJiraAuthUrl } from '@standup/core';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  console.log('[boards] GET request for userId:', userId);

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    // Check if user has Jira tokens
    const tokens = await getJiraTokens(userId);
    console.log('[boards] Tokens found:', !!tokens);

    if (!tokens) {
      console.log('[boards] No tokens, redirecting to auth');
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
    console.log('[boards] Fetching boards from Jira...');
    const boards = await fetchBoards(userId);
    console.log('[boards] Boards fetched successfully:', boards.length);

    return NextResponse.json({ boards });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[boards] Fetch boards error:', errorMessage);

    // Only trigger re-authentication for specific Jira API scope/auth errors
    // Don't catch generic "Unauthorized" as that could be from other sources
    const isJiraAuthError =
      errorMessage.includes('scope does not match') ||
      errorMessage.includes('401 Unauthorized') ||
      errorMessage.includes('invalid_grant') ||
      errorMessage.includes('access_denied');

    console.log('[boards] Is Jira auth error:', isJiraAuthError);

    if (isJiraAuthError) {
      console.log('[boards] Triggering re-auth due to Jira error');
      return NextResponse.json(
        {
          error: 'Jira authentication needs to be updated',
          needsAuth: true,
          jiraAuthUrl: buildJiraAuthUrl(userId),
        },
        { status: 401 }
      );
    }

    // Return the actual error message for debugging
    console.log('[boards] Returning 500 error');
    return NextResponse.json(
      { error: errorMessage || 'Failed to fetch boards' },
      { status: 500 }
    );
  }
}
