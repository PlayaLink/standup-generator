import { NextRequest, NextResponse } from 'next/server';
import { fetchCurrentUser } from '@standup/core/jira';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const profile = await fetchCurrentUser(userId);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Fetch user profile error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
