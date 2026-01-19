import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFormatting,
  saveUserFormatting,
  deleteUserFormatting,
  hasCustomFormatting,
  DEFAULT_FORMATTING,
} from '@standup/core';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const formatting = await getUserFormatting(userId);
    const hasCustom = await hasCustomFormatting(userId);

    return NextResponse.json({ formatting, hasCustom });
  } catch (error) {
    console.error('Get formatting error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch formatting' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, formatting } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!formatting || typeof formatting !== 'string') {
      return NextResponse.json(
        { error: 'formatting is required and must be a string' },
        { status: 400 }
      );
    }

    await saveUserFormatting(userId, formatting);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save formatting error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save formatting' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await deleteUserFormatting(userId);

    return NextResponse.json({ success: true, formatting: DEFAULT_FORMATTING });
  } catch (error) {
    console.error('Delete formatting error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete formatting' },
      { status: 500 }
    );
  }
}
