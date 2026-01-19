import { NextResponse } from 'next/server';
import { buildJiraAuthUrl } from '@standup/core';

export async function GET() {
  const clientId = process.env.JIRA_CLIENT_ID || 'NOT SET';
  const clientSecret = process.env.JIRA_CLIENT_SECRET || 'NOT SET';
  const redirectUri = process.env.JIRA_REDIRECT_URI || 'NOT SET';
  
  // Build the auth URL to see what's being generated
  const authUrl = buildJiraAuthUrl('debug-user');
  
  return NextResponse.json({
    clientId: clientId.substring(0, 8) + '...' + clientId.substring(clientId.length - 4),
    clientSecretSet: clientSecret !== 'NOT SET' && clientSecret.length > 10,
    clientSecretLength: clientSecret.length,
    redirectUri,
    authUrl,
    // Parse the auth URL to show params
    authUrlParams: Object.fromEntries(new URL(authUrl).searchParams.entries()),
  });
}
