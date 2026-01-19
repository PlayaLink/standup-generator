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

  console.log('[jira-callback] Received callback with code:', !!code, 'state:', state);

  if (!code || !state) {
    console.log('[jira-callback] Missing params');
    return NextResponse.redirect(new URL('/?error=missing_params', request.url));
  }

  try {
    const userId = state;

    // Verify user exists
    const user = await getUserById(userId);
    console.log('[jira-callback] User found:', !!user);
    if (!user) {
      return NextResponse.redirect(new URL('/?error=invalid_user', request.url));
    }

    // Exchange code for tokens
    console.log('[jira-callback] Exchanging code for tokens...');
    const tokens = await exchangeCodeForTokens(code);
    console.log('[jira-callback] Tokens received, scopes:', tokens.scope);

    // Store tokens
    console.log('[jira-callback] Storing tokens...');
    await storeJiraTokens(userId, tokens);
    console.log('[jira-callback] Tokens stored successfully');

    // Fetch and store cloud ID
    console.log('[jira-callback] Fetching cloud ID...');
    const cloudId = await fetchCloudId(tokens.access_token);
    console.log('[jira-callback] Cloud ID:', cloudId);

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
