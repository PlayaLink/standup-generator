import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@standup/core';

export async function POST(request: NextRequest) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    // Delete the user's Jira tokens
    const { error } = await getSupabase()
      .from('tokens')
      .delete()
      .eq('user_id', userId)
      .eq('platform', 'jira');

    if (error) {
      throw new Error(`Failed to delete tokens: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect Jira error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
