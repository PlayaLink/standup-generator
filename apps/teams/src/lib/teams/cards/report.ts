/**
 * Create the standup report card
 */
export function createReportCard(report: string) {
  // Convert markdown to Adaptive Card format
  const formattedReport = formatReportForTeams(report);

  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: 'Weekly Standup Report',
        weight: 'Bolder',
        size: 'Large',
      },
      {
        type: 'TextBlock',
        text: formattedReport,
        wrap: true,
        spacing: 'Medium',
      },
    ],
  };
}

/**
 * Create the generating report card (loading state)
 */
export function createGeneratingCard() {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: 'Generating Your Standup...',
        weight: 'Bolder',
        size: 'Medium',
      },
      {
        type: 'TextBlock',
        text: 'Fetching your tickets and creating your report. This may take a moment.',
        wrap: true,
        spacing: 'Small',
      },
    ],
  };
}

/**
 * Create the no tickets card
 */
export function createNoTicketsCard() {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: 'No Tickets Found',
        weight: 'Bolder',
        size: 'Large',
      },
      {
        type: 'TextBlock',
        text: 'No tickets with recent activity were found on your board. Nothing to report!',
        wrap: true,
        spacing: 'Small',
      },
    ],
  };
}

/**
 * Format the markdown report for Teams display
 * Teams Adaptive Cards support a subset of markdown
 */
function formatReportForTeams(report: string): string {
  return report
    .replace(/^## (.+)$/gm, '**$1**') // Convert ## headers to bold
    .replace(/^### (.+)$/gm, '**$1**') // Convert ### headers to bold
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1]($2)'); // Links work as-is in Adaptive Cards
}
