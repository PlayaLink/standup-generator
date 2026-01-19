import { NextRequest, NextResponse } from 'next/server';
import { getUserReports, deleteReport } from '@standup/core';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const reports = await getUserReports(userId, limit);

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { reportId, userId } = await request.json();

    if (!reportId || !userId) {
      return NextResponse.json(
        { error: 'reportId and userId are required' },
        { status: 400 }
      );
    }

    await deleteReport(reportId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete report error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete report' },
      { status: 500 }
    );
  }
}
