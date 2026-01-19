import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForTokens,
  storeJiraTokens,
  fetchCloudId,
  upsertJiraConfig,
  getUserById,
} from '@standup/core';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // This is the userId

  if (!code || !state) {
    return NextResponse.redirect(new URL('/?error=missing_params', request.url));
  }

  try {
    const userId = state;

    // Verify user exists
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.redirect(new URL('/?error=invalid_user', request.url));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Store tokens
    await storeJiraTokens(userId, tokens);

    // Fetch and store cloud ID
    const cloudId = await fetchCloudId(tokens.access_token);

    // Get Jira base URL from accessible resources
    const resourcesResponse = await fetch(
      'https://api.atlassian.com/oauth/token/accessible-resources',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: 'application/json',
        },
      }
    );
    const resources = await resourcesResponse.json();
    const jiraBaseUrl = resources[0]?.url || '';

    // Store Jira config
    await upsertJiraConfig(userId, {
      jira_cloud_id: cloudId,
      jira_base_url: jiraBaseUrl,
    });

    // Redirect to dashboard with success
    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.searchParams.set('jira_connected', 'true');

    // Create response with redirect
    const response = NextResponse.redirect(dashboardUrl);

    return response;
  } catch (error) {
    console.error('Jira OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error instanceof Error ? error.message : 'oauth_failed')}`, request.url)
    );
  }
}
