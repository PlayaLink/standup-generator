import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateWebUser, getJiraTokens, buildJiraAuthUrl } from '@standup/core';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get or create user
    const user = await getOrCreateWebUser(email);

    // Check if user has Jira tokens
    const tokens = await getJiraTokens(user.id);
    const jiraConnected = !!tokens;

    // If not connected to Jira, provide auth URL
    let jiraAuthUrl = '';
    if (!jiraConnected) {
      // Use user ID as state for OAuth callback
      jiraAuthUrl = buildJiraAuthUrl(user.id);
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      jiraConnected,
      jiraAuthUrl,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    );
  }
}
