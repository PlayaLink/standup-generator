/**
 * Create the help card showing available commands
 */
export function createHelpCard() {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: 'Weekly Standup Generator',
        weight: 'Bolder',
        size: 'Large',
      },
      {
        type: 'TextBlock',
        text: 'Generate standup reports from your Jira tickets.',
        wrap: true,
        spacing: 'Small',
      },
      {
        type: 'TextBlock',
        text: 'Available Commands:',
        weight: 'Bolder',
        spacing: 'Medium',
      },
      {
        type: 'FactSet',
        facts: [
          {
            title: 'setup',
            value: 'Connect your Jira account and select a board',
          },
          {
            title: 'standup',
            value: 'Generate your weekly standup report',
          },
          {
            title: 'help',
            value: 'Show this help message',
          },
        ],
      },
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: 'Get Started',
        data: {
          action: 'setup',
        },
      },
    ],
  };
}
