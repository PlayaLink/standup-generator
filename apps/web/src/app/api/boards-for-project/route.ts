import { NextRequest, NextResponse } from 'next/server';
import { fetchBoardsForProject, getJiraTokens, buildJiraAuthUrl } from '@standup/core';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const projectKey = searchParams.get('projectKey');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  if (!projectKey) {
    return NextResponse.json({ error: 'projectKey is required' }, { status: 400 });
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

    // Fetch boards for the project from Jira Agile API
    const boards = await fetchBoardsForProject(userId, projectKey);

    return NextResponse.json({ boards });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // For scope errors with the Agile API, just return empty boards
    // The board selection is optional - users can still generate reports by project
    if (errorMessage.includes('scope does not match')) {
      return NextResponse.json({ boards: [] });
    }

    // Only trigger re-authentication for actual auth errors (not scope mismatch)
    const isJiraAuthError =
      errorMessage.includes('401 Unauthorized') ||
      errorMessage.includes('invalid_grant') ||
      errorMessage.includes('access_denied');

    if (isJiraAuthError) {
      return NextResponse.json(
        {
          error: 'Jira authentication needs to be updated',
          needsAuth: true,
          jiraAuthUrl: buildJiraAuthUrl(userId),
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: errorMessage || 'Failed to fetch boards' },
      { status: 500 }
    );
  }
}
