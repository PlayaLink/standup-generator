import { getSupabase } from './client';
import { DEFAULT_SYSTEM_PROMPT } from '../prompts';

export interface UserFormatting {
  id: string;
  user_id: string;
  formatting_instructions: string;
  created_at: string;
  updated_at: string;
}

/**
 * Default formatting instructions used when user hasn't customized
 * Re-exported from the shared prompts module for backward compatibility
 */
export const DEFAULT_FORMATTING = DEFAULT_SYSTEM_PROMPT;

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
