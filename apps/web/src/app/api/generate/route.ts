import { NextRequest, NextResponse } from 'next/server';
import {
  fetchTickets,
  generateStandupReport,
  getJiraConfig,
  getTicketNames,
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

    // Generate report using Claude
    const { report } = await generateStandupReport(
      tickets,
      jiraConfig.jira_base_url,
      ticketNames
    );

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
}
