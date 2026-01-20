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
    console.log(`Fetching Jira tickets from last ${daysBack} days...`);
    const tickets = await fetchTickets({
      userId,
      projectKey,
      boardId,
      daysBack,
    });

    // Log tickets grouped by status
    const ticketsByStatus = tickets.reduce((acc, ticket) => {
      const status = ticket.status || 'Unknown';
      if (!acc[status]) {
        acc[status] = [];
      }
      const commentCount = ticket.comments?.length || 0;
      acc[status].push({
        key: ticket.key,
        summary: ticket.summary,
        commentCount,
      });
      return acc;
    }, {} as Record<string, { key: string; summary: string; commentCount: number }[]>);
    
    console.log('=== Jira Tickets Fetched ===');
    console.log(`Total: ${tickets.length} tickets`);
    Object.entries(ticketsByStatus).forEach(([status, ticketList]) => {
      console.log(`\n${status}:`);
      ticketList.forEach((t) => {
        console.log(`  ${t.key} - ${t.summary} (${t.commentCount} comments)`);
      });
    });
    console.log('\n============================');

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

    return NextResponse.json({ report, ticketsByStatus, rawTickets: tickets });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
}
