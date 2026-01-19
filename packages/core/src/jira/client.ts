import { getJiraAccessToken } from './auth';
import { getJiraConfig } from '../db/configs';

export interface JiraUserProfile {
  accountId: string;
  displayName: string;
  emailAddress: string;
  avatarUrl: string;
}

export interface JiraTicket {
  key: string;
  summary: string;
  status: string;
  assignee: string | null;
  description: string | null;
  dueDate: string | null;
  updated: string;
  comments: JiraComment[];
}

export interface JiraComment {
  author: string;
  body: string;
  created: string;
}

export interface JiraProject {
  id: string;
  name: string;
  key: string;
}

export interface JiraAgileBoard {
  id: number;
  name: string;
  type: string;
}

/** @deprecated Use JiraProject instead */
export type JiraBoard = JiraProject;

/**
 * Create authenticated headers for Jira API requests
 */
async function getJiraHeaders(userId: string): Promise<HeadersInit> {
  const accessToken = await getJiraAccessToken(userId);
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

/**
 * Get the base URL for Jira API calls
 */
async function getJiraApiUrl(userId: string): Promise<string> {
  const config = await getJiraConfig(userId);
  if (!config) {
    throw new Error('Jira not configured for user');
  }
  return `https://api.atlassian.com/ex/jira/${config.jira_cloud_id}`;
}

/**
 * Fetch the current user's profile from Jira
 */
export async function fetchCurrentUser(userId: string): Promise<JiraUserProfile> {
  const baseUrl = await getJiraApiUrl(userId);
  const headers = await getJiraHeaders(userId);

  const response = await fetch(`${baseUrl}/rest/api/3/myself`, { headers });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch current user: ${error}`);
  }

  const user = (await response.json()) as {
    accountId: string;
    displayName: string;
    emailAddress: string;
    avatarUrls: {
      '48x48': string;
      '32x32': string;
      '24x24': string;
      '16x16': string;
    };
  };

  return {
    accountId: user.accountId,
    displayName: user.displayName,
    emailAddress: user.emailAddress,
    avatarUrl: user.avatarUrls['48x48'],
  };
}

/**
 * Fetch all projects the user has access to
 */
export async function fetchProjects(userId: string): Promise<JiraProject[]> {
  const baseUrl = await getJiraApiUrl(userId);
  const headers = await getJiraHeaders(userId);

  const response = await fetch(`${baseUrl}/rest/api/3/project`, { headers });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch projects: ${error}`);
  }

  const projects = (await response.json()) as Array<{
    id: string;
    key: string;
    name: string;
  }>;

  return projects.map((project) => ({
    id: project.id,
    key: project.key,
    name: project.name,
  }));
}

/** @deprecated Use fetchProjects instead */
export const fetchBoards = fetchProjects;

/**
 * Get Basic Auth headers for Agile API (OAuth doesn't work with Agile API)
 */
function getBasicAuthHeaders(): HeadersInit {
  const email = process.env.ATLASSIAN_EMAIL;
  const token = process.env.ATLASSIAN_API_TOKEN?.replace(/'/g, '');
  
  if (!email || !token) {
    throw new Error('Missing ATLASSIAN_EMAIL or ATLASSIAN_API_TOKEN for Agile API');
  }
  
  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  return {
    Authorization: `Basic ${auth}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

/**
 * Fetch all boards for a specific project using the Agile API
 * Note: Uses Basic Auth because OAuth doesn't work with Jira's Agile API
 */
export async function fetchBoardsForProject(
  userId: string,
  projectKeyOrId: string
): Promise<JiraAgileBoard[]> {
  // Get the Jira base URL from config (need it for direct API calls)
  const config = await getJiraConfig(userId);
  if (!config?.jira_base_url) {
    throw new Error('Jira not configured for user');
  }

  // Use Basic Auth - OAuth scope doesn't work with Agile API
  const headers = getBasicAuthHeaders();
  const url = `${config.jira_base_url}/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKeyOrId)}`;

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch boards for project ${projectKeyOrId}: ${response.status} ${error}`);
  }

  const data = (await response.json()) as {
    values: Array<{
      id: number;
      name: string;
      type: string;
    }>;
  };

  return data.values.map((board) => ({
    id: board.id,
    name: board.name,
    type: board.type,
  }));
}

export interface FetchTicketsOptions {
  userId: string;
  projectKey: string;
  boardId?: number;
  daysBack?: number;
}

/**
 * Fetch tickets from a project with recent activity
 */
export async function fetchTickets(options: FetchTicketsOptions): Promise<JiraTicket[]> {
  const { userId, projectKey, daysBack = 7 } = options;

  const baseUrl = await getJiraApiUrl(userId);
  const headers = await getJiraHeaders(userId);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  // Phase 1: Get tickets assigned to current user with recent activity
  const jql = `project = "${projectKey}" AND assignee = currentUser() AND updatedDate >= "${cutoffStr}"`;

  const response = await fetch(
    `${baseUrl}/rest/api/3/search/jql`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jql,
        fields: ['key', 'summary', 'status', 'assignee', 'duedate', 'updated'],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch tickets: ${error}`);
  }

  const data = (await response.json()) as { issues: any[] };
  const issues = data.issues || [];

  // Phase 2: Filter tickets that need details
  const ticketsNeedingDetails = issues.filter((issue: any) => {
    const status = issue.fields.status?.name;
    const updated = new Date(issue.fields.updated);
    const isRecent = updated >= cutoffDate;
    const isActive = ['In Progress', 'To Do'].includes(status);
    return isRecent || isActive;
  });

  // Phase 3: Fetch details for filtered tickets
  const tickets: JiraTicket[] = await Promise.all(
    ticketsNeedingDetails.map(async (issue: any) => {
      const details = await fetchTicketDetails(userId, issue.key, cutoffDate);
      return details;
    })
  );

  return tickets;
}

/**
 * Fetch detailed ticket info including description and comments
 */
async function fetchTicketDetails(
  userId: string,
  ticketKey: string,
  cutoffDate: Date
): Promise<JiraTicket> {
  const baseUrl = await getJiraApiUrl(userId);
  const headers = await getJiraHeaders(userId);

  // Fetch ticket with rendered fields
  const response = await fetch(
    `${baseUrl}/rest/api/3/issue/${ticketKey}?expand=renderedFields&fields=summary,status,assignee,description,duedate,updated,comment`,
    { headers }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch ticket ${ticketKey}: ${error}`);
  }

  const issue = (await response.json()) as {
    key: string;
    fields: {
      summary: string;
      status?: { name: string };
      assignee?: { displayName: string };
      duedate?: string;
      updated: string;
      comment?: { comments: any[] };
    };
    renderedFields?: { description?: string };
  };

  // Filter comments to only recent ones
  const comments: JiraComment[] = (issue.fields.comment?.comments || [])
    .filter((c: any) => new Date(c.created) >= cutoffDate)
    .map((c: any) => ({
      author: c.author?.displayName || 'Unknown',
      body: extractTextFromAdf(c.body),
      created: c.created,
    }));

  return {
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status?.name || 'Unknown',
    assignee: issue.fields.assignee?.displayName || null,
    description: issue.renderedFields?.description || null,
    dueDate: issue.fields.duedate || null,
    updated: issue.fields.updated,
    comments,
  };
}

/**
 * Extract plain text from Atlassian Document Format (ADF)
 */
function extractTextFromAdf(adf: any): string {
  if (!adf || typeof adf === 'string') return adf || '';

  if (adf.type === 'text') return adf.text || '';

  if (adf.content && Array.isArray(adf.content)) {
    return adf.content.map(extractTextFromAdf).join('');
  }

  return '';
}
