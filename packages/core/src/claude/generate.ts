import Anthropic from '@anthropic-ai/sdk';
import { JiraTicket } from '../jira/client';
import { DEFAULT_SYSTEM_PROMPT } from './prompts';

const anthropic = new Anthropic();

// Re-export for backwards compatibility
export { DEFAULT_SYSTEM_PROMPT };

/**
 * Generate a standup report from Jira tickets
 */
export async function generateStandupReport(
  tickets: JiraTicket[],
  jiraBaseUrl: string,
  ticketNames: Record<string, string> = {},
  customFormatting?: string
): Promise<{ report: string; newTicketNames: Record<string, string> }> {
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const systemPrompt = customFormatting || DEFAULT_SYSTEM_PROMPT;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate a weekly standup report from this Jira data.

Jira base URL for links: ${jiraBaseUrl}
Today's date: ${todayStr}

Existing ticket names (use these for consistency if the ticket appears):
${JSON.stringify(ticketNames, null, 2)}

Ticket data:
${JSON.stringify(tickets, null, 2)}

After generating the report, also output a JSON block with any NEW ticket names you created, in this format:
\`\`\`json
{"PROJ-123": "Short ticket name", "PROJ-456": "Another name"}
\`\`\``,
      },
    ],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';

  // Extract new ticket names from JSON block
  const newTicketNames = extractTicketNames(responseText, ticketNames);

  // Remove the JSON block from the report
  const report = responseText.replace(/```json[\s\S]*?```/g, '').trim();

  return { report, newTicketNames };
}

/**
 * Extract ticket names from Claude's response
 */
function extractTicketNames(
  response: string,
  existingNames: Record<string, string>
): Record<string, string> {
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) {
    return { ...existingNames };
  }

  try {
    const newNames = JSON.parse(jsonMatch[1]);
    return { ...existingNames, ...newNames };
  } catch {
    return { ...existingNames };
  }
}

/**
 * Format markdown report for Slack
 * Slack auto-links URLs, so we just expose the URL directly
 * Converts:
 * - Markdown links [text](url) → just the URL (Slack auto-links)
 * - ## headers → *bold*
 * - - bullets → • bullets
 */
export function formatReportForSlack(report: string): string {
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

/**
 * Format a due date as relative text
 */
export function formatRelativeDueDate(dueDate: string | null): string | null {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return `Overdue`;
  if (diffDays === 0) return `Due today`;
  if (diffDays === 1) return `Due tomorrow`;

  const dayOfWeek = due.toLocaleDateString('en-US', { weekday: 'long' });
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

  if (due <= endOfWeek) {
    return `Due ${dayOfWeek}`;
  }

  const endOfNextWeek = new Date(endOfWeek);
  endOfNextWeek.setDate(endOfWeek.getDate() + 7);

  if (due <= endOfNextWeek) {
    return `Due next ${dayOfWeek}`;
  }

  return `Due ${due.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}`;
}
