import { TurnContext, CardFactory, MessageFactory } from 'botbuilder';
import crypto from 'crypto';
import {
  getOrCreateTeamsUser,
  getJiraConfig,
  hasValidToken,
  buildJiraAuthUrl,
  fetchBoards,
  updateBoardSelection,
} from '@standup/core';
import {
  createConnectJiraCard,
  createBoardSelectionCard,
  createSetupCompleteCard,
  createAlreadyConfiguredCard,
  createErrorCard,
} from '../cards';

/**
 * Handle the setup command
 * Shows the appropriate setup step based on user's current state
 */
export async function handleSetupCommand(context: TurnContext): Promise<void> {
  const teamsUserId = context.activity.from.aadObjectId || context.activity.from.id;
  const tenantId = context.activity.conversation.tenantId || 'unknown';

  // Get or create user in database
  const user = await getOrCreateTeamsUser(teamsUserId, tenantId);

  // Check if user has Jira connected
  const hasJira = await hasValidToken(user.id, 'jira');
  const jiraConfig = await getJiraConfig(user.id);

  if (!hasJira) {
    // Show connect Jira card
    await showConnectJiraCard(context, user.id);
  } else if (!jiraConfig?.board_id) {
    // Show board selection card
    await showBoardSelectionCard(context, user.id);
  } else {
    // Show current config
    await context.sendActivity(
      MessageFactory.attachment(
        CardFactory.adaptiveCard(
          createAlreadyConfiguredCard(
            jiraConfig.board_name || 'Unknown',
            jiraConfig.project_key || 'Unknown'
          )
        )
      )
    );
  }
}

/**
 * Handle card action submissions
 */
export async function handleSetupAction(
  context: TurnContext,
  action: string,
  data: Record<string, any>
): Promise<void> {
  const teamsUserId = context.activity.from.aadObjectId || context.activity.from.id;
  const tenantId = context.activity.conversation.tenantId || 'unknown';
  const user = await getOrCreateTeamsUser(teamsUserId, tenantId);

  switch (action) {
    case 'setup':
      await handleSetupCommand(context);
      break;

    case 'changeBoard':
      await showBoardSelectionCard(context, user.id);
      break;

    case 'selectBoard':
      await handleBoardSelection(context, user.id, data.boardSelection);
      break;
  }
}

/**
 * Show the connect Jira card with OAuth link
 */
async function showConnectJiraCard(
  context: TurnContext,
  userId: string
): Promise<void> {
  // Generate state token for OAuth
  const state = crypto.randomBytes(16).toString('hex');
  const stateWithUser = `${state}:${userId}`;

  const authUrl = buildJiraAuthUrl(stateWithUser);

  await context.sendActivity(
    MessageFactory.attachment(
      CardFactory.adaptiveCard(createConnectJiraCard(authUrl))
    )
  );
}

/**
 * Show the board selection card
 */
async function showBoardSelectionCard(
  context: TurnContext,
  userId: string
): Promise<void> {
  try {
    const boards = await fetchBoards(userId);

    if (boards.length === 0) {
      await context.sendActivity(
        MessageFactory.attachment(
          CardFactory.adaptiveCard(
            createErrorCard(
              'No Boards Found',
              'No Jira boards were found. Make sure you have access to at least one board.'
            )
          )
        )
      );
      return;
    }

    await context.sendActivity(
      MessageFactory.attachment(
        CardFactory.adaptiveCard(createBoardSelectionCard(boards))
      )
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await context.sendActivity(
      MessageFactory.attachment(
        CardFactory.adaptiveCard(
          createErrorCard('Error Fetching Boards', message)
        )
      )
    );
  }
}

/**
 * Handle board selection from card
 */
async function handleBoardSelection(
  context: TurnContext,
  userId: string,
  selection: string
): Promise<void> {
  if (!selection) {
    await context.sendActivity('Please select a board.');
    return;
  }

  // Selection format: "boardId:projectKey:boardName"
  const [boardId, projectKey, ...boardNameParts] = selection.split(':');
  const boardName = boardNameParts.join(':'); // Handle board names with colons

  await updateBoardSelection(
    userId,
    parseInt(boardId, 10),
    boardName,
    projectKey
  );

  await context.sendActivity(
    MessageFactory.attachment(
      CardFactory.adaptiveCard(createSetupCompleteCard(boardName, projectKey))
    )
  );
}
