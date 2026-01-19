import { NextRequest, NextResponse } from 'next/server';
import {
  fetchTickets,
  generateStandupReport,
  getJiraConfig,
  getTicketNames,
  getUserFormatting,
  saveReport,
  fetchBoardsForProject,
} from '@standup/core';

export async function POST(request: NextRequest) {
  try {
    const { userId, projectKey, boardId, daysBack = 7 } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!projectKey) {
      return NextResponse.json({ error: 'projectKey is required' }, { status: 400 });
    }

    // Get Jira config for base URL
    const jiraConfig = await getJiraConfig(userId);
    if (!jiraConfig) {
      return NextResponse.json(
        { error: 'Jira not configured. Please reconnect your Jira account.' },
        { status: 400 }
      );
    }

    // Fetch tickets from Jira
    const tickets = await fetchTickets({
      userId,
      projectKey,
      boardId,
      daysBack,
    });

    if (tickets.length === 0) {
      return NextResponse.json({
        report: 'No tickets found with activity in the specified time period.',
      });
    }

    // Get custom ticket names for this user
    const ticketNames = await getTicketNames(userId);

    // Get user's custom formatting (or default)
    const customFormatting = await getUserFormatting(userId);

    // Get board name if boardId is provided
    let boardName: string | null = null;
    if (boardId) {
      try {
        const boards = await fetchBoardsForProject(userId, projectKey);
        const board = boards.find((b) => b.id === boardId);
        boardName = board?.name || null;
      } catch {
        // If we can't fetch board name, continue without it
      }
    }

    // Generate report using Claude with custom formatting
    const { report } = await generateStandupReport(
      tickets,
      jiraConfig.jira_base_url,
      ticketNames,
      customFormatting
    );

    // Save report to database
    await saveReport(userId, projectKey, boardName, report);

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
}
