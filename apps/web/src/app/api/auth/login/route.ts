import { NextResponse } from 'next/server';
import { buildJiraAuthUrl } from '@standup/core';
import crypto from 'crypto';

export async function GET() {
  try {
    // Generate a cryptographically secure random state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Build the Jira OAuth URL with the random state
    const jiraAuthUrl = buildJiraAuthUrl(state);

    return NextResponse.json({
      jiraAuthUrl,
      state, // Client stores this to verify callback
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate login' },
      { status: 500 }
    );
  }
}
