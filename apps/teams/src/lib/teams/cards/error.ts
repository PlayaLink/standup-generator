/**
 * Create an error card
 */
export function createErrorCard(title: string, message: string) {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: title,
        weight: 'Bolder',
        size: 'Large',
        color: 'Attention',
      },
      {
        type: 'TextBlock',
        text: message,
        wrap: true,
        spacing: 'Small',
      },
    ],
  };
}

/**
 * Create Jira not connected error card
 */
export function createJiraNotConnectedCard() {
  return createErrorCard(
    'Jira Not Connected',
    'Please run the "setup" command first to connect your Jira account.'
  );
}

/**
 * Create no board selected error card
 */
export function createNoBoardSelectedCard() {
  return createErrorCard(
    'No Board Selected',
    'Please run the "setup" command to select your Jira board.'
  );
}
