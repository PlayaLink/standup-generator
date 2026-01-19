import { NextRequest, NextResponse } from 'next/server';
import { fetchProjects, getJiraTokens, buildJiraAuthUrl } from '@standup/core';

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

    // Fetch projects from Jira (returns as "boards" for backwards compatibility)
    const projects = await fetchProjects(userId);

    // Return as "boards" for backwards compatibility with UI
    return NextResponse.json({ boards: projects });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Only trigger re-authentication for specific Jira API scope/auth errors
    const isJiraAuthError =
      errorMessage.includes('scope does not match') ||
      errorMessage.includes('401 Unauthorized') ||
      errorMessage.includes('invalid_grant') ||
      errorMessage.includes('invalid_client') ||
      errorMessage.includes('Failed to refresh token') ||
      errorMessage.includes('failed to retrieve client') ||
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
      { error: errorMessage || 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
