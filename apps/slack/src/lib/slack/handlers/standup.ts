import { getApp, sendDirectMessage } from '../app';
import {
  getOrCreateSlackUser,
  getJiraConfig,
  hasValidToken,
  fetchTickets,
  generateStandupReport,
  getTicketNames,
  saveTicketNames,
} from '@standup/core';

/**
 * Handle /weekly-standup command
 * Generates and posts a standup report to the user
 */
export function registerStandupHandler() {
  getApp().command('/weekly-standup', async ({ command, ack, respond }) => {
    // Acknowledge immediately to avoid timeout
    await ack();

    const slackUserId = command.user_id;
    const slackTeamId = command.team_id;

    // Let user know we're working on it
    await respond({
      response_type: 'ephemeral',
      text: '⏳ Generating your weekly standup report...',
    });

    try {
      // Get user from database
      const user = await getOrCreateSlackUser(slackUserId, slackTeamId);

      // Check if user has Jira connected
      const hasJira = await hasValidToken(user.id, 'jira');
      if (!hasJira) {
        await respond({
          response_type: 'ephemeral',
          replace_original: true,
          text: '❌ Jira not connected. Run `/standup-setup` first to connect your account.',
        });
        return;
      }

      // Check if user has selected a board
      const jiraConfig = await getJiraConfig(user.id);
      if (!jiraConfig?.board_id || !jiraConfig?.project_key) {
        await respond({
          response_type: 'ephemeral',
          replace_original: true,
          text: '❌ No board selected. Run `/standup-setup` to select your Jira board.',
        });
        return;
      }

      // Fetch tickets from Jira
      const tickets = await fetchTickets({
        userId: user.id,
        projectKey: jiraConfig.project_key,
      });

      if (tickets.length === 0) {
        await respond({
          response_type: 'ephemeral',
          replace_original: true,
          text: '📭 No tickets found with recent activity. Nothing to report!',
        });
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

      // Send report as DM
      await sendDirectMessage(slackUserId, formatReportForSlack(report));

      // Confirm to user
      await respond({
        response_type: 'ephemeral',
        replace_original: true,
        text: '✅ Your weekly standup has been sent to your DMs!',
      });
    } catch (error) {
      console.error('Error generating standup:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await respond({
        response_type: 'ephemeral',
        replace_original: true,
        text: `❌ Error generating standup: ${errorMessage}\n\nTry again or contact support if this persists.`,
      });
    }
  });
}

/**
 * Format markdown report for Slack
 * Slack auto-links URLs, so we just expose the URL directly
 */
function formatReportForSlack(report: string): string {
  return report
    // Convert markdown links [text](url) to just the URL (Slack auto-links)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$2')
    // Convert ## headers to bold
    .replace(/^## (.+)$/gm, '*$1*')
    // Convert ### headers to bold
    .replace(/^### (.+)$/gm, '*$1*')
    // Use bullet points
    .replace(/^- /gm, '• ');
}
