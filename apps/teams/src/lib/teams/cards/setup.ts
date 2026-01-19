import type { JiraBoard } from '@standup/core';

/**
 * Create the connect Jira card
 */
export function createConnectJiraCard(authUrl: string) {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: 'Connect Jira Account',
        weight: 'Bolder',
        size: 'Large',
      },
      {
        type: 'TextBlock',
        text: "Let's connect your Jira account so we can fetch your tickets.",
        wrap: true,
        spacing: 'Small',
      },
      {
        type: 'TextBlock',
        text: 'Click the button below to authorize access to your Jira account. After authorizing, come back here and type "setup" again.',
        wrap: true,
        spacing: 'Medium',
      },
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'Connect Jira Account',
        url: authUrl,
      },
    ],
  };
}

/**
 * Create the board selection card
 */
export function createBoardSelectionCard(boards: JiraBoard[]) {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: 'Select Your Board',
        weight: 'Bolder',
        size: 'Large',
      },
      {
        type: 'TextBlock',
        text: 'Choose the Jira board you want to track for your weekly standups.',
        wrap: true,
        spacing: 'Small',
      },
      {
        type: 'Input.ChoiceSet',
        id: 'boardSelection',
        style: 'compact',
        isRequired: true,
        placeholder: 'Select a board',
        choices: boards.map((board) => ({
          title: `${board.name} (${board.key})`,
          value: `${board.id}:${board.key}:${board.name}`,
        })),
      },
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: 'Select Board',
        data: {
          action: 'selectBoard',
        },
      },
    ],
  };
}

/**
 * Create the setup complete card
 */
export function createSetupCompleteCard(boardName: string, projectKey: string) {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: "You're All Set!",
        weight: 'Bolder',
        size: 'Large',
        color: 'Good',
      },
      {
        type: 'FactSet',
        facts: [
          {
            title: 'Board',
            value: boardName,
          },
          {
            title: 'Project',
            value: projectKey,
          },
        ],
      },
      {
        type: 'TextBlock',
        text: 'Type "standup" anytime to generate your weekly report.',
        wrap: true,
        spacing: 'Medium',
      },
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: 'Generate Standup Now',
        data: {
          action: 'standup',
        },
      },
    ],
  };
}

/**
 * Create the already configured card
 */
export function createAlreadyConfiguredCard(
  boardName: string,
  projectKey: string
) {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: 'Already Set Up',
        weight: 'Bolder',
        size: 'Large',
        color: 'Good',
      },
      {
        type: 'FactSet',
        facts: [
          {
            title: 'Board',
            value: boardName || 'Unknown',
          },
          {
            title: 'Project',
            value: projectKey || 'Unknown',
          },
        ],
      },
      {
        type: 'TextBlock',
        text: 'Want to use a different board?',
        wrap: true,
        spacing: 'Medium',
      },
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: 'Change Board',
        data: {
          action: 'changeBoard',
        },
      },
      {
        type: 'Action.Submit',
        title: 'Generate Standup',
        data: {
          action: 'standup',
        },
      },
    ],
  };
}
