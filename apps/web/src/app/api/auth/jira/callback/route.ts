import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForTokens,
  storeJiraTokens,
  fetchCloudId,
  upsertJiraConfig,
  getOrCreateWebUser,
} from '@standup/core';

interface JiraUserResponse {
  accountId: string;
  emailAddress: string;
  displayName: string;
  active: boolean;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(new URL('/?error=missing_params', request.url));
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Fetch and store cloud ID first (needed for API calls)
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

    // Fetch current user info from Jira to get verified email
    const userResponse = await fetch(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/myself`,
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: 'application/json',
        },
      }
    );

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      throw new Error(`Failed to fetch Jira user info: ${errorText}`);
    }

    const jiraUser: JiraUserResponse = await userResponse.json();

    if (!jiraUser.emailAddress) {
      throw new Error(
        'Unable to retrieve email from Jira. Please ensure your Jira profile has an email address.'
      );
    }

    // Get or create user with the verified email from Jira
    const user = await getOrCreateWebUser(jiraUser.emailAddress);

    // Store tokens for the user
    await storeJiraTokens(user.id, tokens);

    // Store Jira config
    await upsertJiraConfig(user.id, {
      jira_cloud_id: cloudId,
      jira_base_url: jiraBaseUrl,
    });

    // Redirect to dashboard with user info for localStorage
    // Use the verified email from Jira (we already verified it exists above)
    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.searchParams.set('userId', user.id);
    dashboardUrl.searchParams.set('email', jiraUser.emailAddress);
    dashboardUrl.searchParams.set('jira_connected', 'true');

    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error('Jira OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/?error=${encodeURIComponent(error instanceof Error ? error.message : 'oauth_failed')}`,
        request.url
      )
    );
  }
}
