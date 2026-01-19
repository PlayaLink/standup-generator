import { TurnContext, CardFactory, MessageFactory } from 'botbuilder';
import {
  getOrCreateTeamsUser,
  getJiraConfig,
  hasValidToken,
  fetchTickets,
  generateStandupReport,
  getTicketNames,
  saveTicketNames,
} from '@standup/core';
import {
  createReportCard,
  createNoTicketsCard,
  createJiraNotConnectedCard,
  createNoBoardSelectedCard,
  createErrorCard,
} from '../cards';

/**
 * Handle the standup command
 * Generates and sends a standup report
 */
export async function handleStandupCommand(
  context: TurnContext
): Promise<void> {
  const teamsUserId = context.activity.from.aadObjectId || context.activity.from.id;
  const tenantId = context.activity.conversation.tenantId || 'unknown';

  // Let user know we're working on it
  await context.sendActivity('Generating your weekly standup report...');

  try {
    // Get user from database
    const user = await getOrCreateTeamsUser(teamsUserId, tenantId);

    // Check if user has Jira connected
    const hasJira = await hasValidToken(user.id, 'jira');
    if (!hasJira) {
      await context.sendActivity(
        MessageFactory.attachment(
          CardFactory.adaptiveCard(createJiraNotConnectedCard())
        )
      );
      return;
    }

    // Check if user has selected a board
    const jiraConfig = await getJiraConfig(user.id);
    if (!jiraConfig?.board_id || !jiraConfig?.project_key) {
      await context.sendActivity(
        MessageFactory.attachment(
          CardFactory.adaptiveCard(createNoBoardSelectedCard())
        )
      );
      return;
    }

    // Fetch tickets from Jira
    const tickets = await fetchTickets({
      userId: user.id,
      projectKey: jiraConfig.project_key,
    });

    if (tickets.length === 0) {
      await context.sendActivity(
        MessageFactory.attachment(
          CardFactory.adaptiveCard(createNoTicketsCard())
        )
      );
      return;
    }

    // Get existing ticket names for consistency
    const existingNames = await getTicketNames(user.id);

    // Generate report using Claude
    const { report, newTicketNames } = await generateStandupReport(
      tickets,
      jiraConfig.jira_base_url,
      existingNames
    );

    // Save updated ticket names
    await saveTicketNames(user.id, newTicketNames);

    // Send report
    await context.sendActivity(
      MessageFactory.attachment(CardFactory.adaptiveCard(createReportCard(report)))
    );
  } catch (error) {
    console.error('Error generating standup:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    await context.sendActivity(
      MessageFactory.attachment(
        CardFactory.adaptiveCard(
          createErrorCard(
            'Error Generating Standup',
            `${errorMessage}\n\nTry again or contact support if this persists.`
          )
        )
      )
    );
  }
}
