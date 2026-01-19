import { getSupabase } from './client';

export interface UserFormatting {
  id: string;
  user_id: string;
  formatting_instructions: string;
  created_at: string;
  updated_at: string;
}

/**
 * Default formatting instructions used when user hasn't customized
 */
export const DEFAULT_FORMATTING = `You are a helpful assistant that generates weekly standup reports from Jira ticket data.

Format requirements:
- Start directly with "## Last Week" (no title header)
- Ticket format: [PROJ-123](https://jira.example.com/browse/PROJ-123) - Concise Name
- Each ticket gets 1-3 bullet points describing work done or planned
- Organize into three sections:

## Last Week
Tickets with activity in the past 7 days. Focus on what was accomplished.

## This Week
"In Progress" and "To Do" tickets. Focus on planned actions. Include due dates when applicable. Put the due date in parentheses after the ticket name.

## Blockers
Dependencies or items you're waiting on. If none, just say "None"
- If a blocker is related to a specific ticket, use the same format: [PROJ-123](url) - Blocker description
- If a blocker is general (not ticket-specific), just describe it without a ticket link

Additional formatting:
- Keep ticket names to 3-5 words that capture the essence
- Use relative due dates: "Due tomorrow", "Due Friday", "Due next Tuesday", "Due 02/01"
- Be concise - 1-3 bullet points per ticket
- If a ticket has recent comments, incorporate relevant context`;

/**
 * Get user's custom formatting or return default
 */
export async function getUserFormatting(userId: string): Promise<string> {
  const { data, error } = await getSupabase()
    .from('user_formatting')
    .select('formatting_instructions')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // Return default if no custom formatting exists
    return DEFAULT_FORMATTING;
  }

  return data.formatting_instructions;
}

/**
 * Check if user has custom formatting stored
 */
export async function hasCustomFormatting(userId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('user_formatting')
    .select('id')
    .eq('user_id', userId)
    .single();

  return !error && !!data;
}

/**
 * Save or update user's custom formatting
 */
export async function saveUserFormatting(
  userId: string,
  instructions: string
): Promise<UserFormatting> {
  const { data, error } = await getSupabase()
    .from('user_formatting')
    .upsert(
      {
        user_id: userId,
        formatting_instructions: instructions,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save formatting: ${error.message}`);
  }

  return data as UserFormatting;
}

/**
 * Delete user's custom formatting (revert to default)
 */
export async function deleteUserFormatting(userId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('user_formatting')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete formatting: ${error.message}`);
  }
}
