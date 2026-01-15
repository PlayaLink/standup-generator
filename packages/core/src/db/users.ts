import { getSupabase } from './client';

export type Platform = 'slack' | 'teams';

export interface User {
  id: string;
  slack_user_id: string | null;
  slack_team_id: string | null;
  teams_user_id: string | null;
  teams_tenant_id: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get or create a user based on their Slack ID
 */
export async function getOrCreateSlackUser(
  slackUserId: string,
  slackTeamId: string
): Promise<User> {
  // Try to find existing user
  const { data: existingUser, error: fetchError } = await getSupabase()
    .from('users')
    .select('*')
    .eq('slack_user_id', slackUserId)
    .single();

  if (existingUser && !fetchError) {
    return existingUser as User;
  }

  // Create new user
  const { data: newUser, error: insertError } = await getSupabase()
    .from('users')
    .insert({
      slack_user_id: slackUserId,
      slack_team_id: slackTeamId,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create user: ${insertError.message}`);
  }

  return newUser as User;
}

/**
 * Get or create a user based on their Teams ID
 */
export async function getOrCreateTeamsUser(
  teamsUserId: string,
  teamsTenantId: string
): Promise<User> {
  // Try to find existing user
  const { data: existingUser, error: fetchError } = await getSupabase()
    .from('users')
    .select('*')
    .eq('teams_user_id', teamsUserId)
    .single();

  if (existingUser && !fetchError) {
    return existingUser as User;
  }

  // Create new user
  const { data: newUser, error: insertError } = await getSupabase()
    .from('users')
    .insert({
      teams_user_id: teamsUserId,
      teams_tenant_id: teamsTenantId,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create user: ${insertError.message}`);
  }

  return newUser as User;
}

/**
 * Get a user by their internal ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await getSupabase()
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return null;
  }

  return data as User;
}

/**
 * Get a user by their Slack ID
 */
export async function getUserBySlackId(slackUserId: string): Promise<User | null> {
  const { data, error } = await getSupabase()
    .from('users')
    .select('*')
    .eq('slack_user_id', slackUserId)
    .single();

  if (error) {
    return null;
  }

  return data as User;
}

/**
 * Get a user by their Teams ID
 */
export async function getUserByTeamsId(teamsUserId: string): Promise<User | null> {
  const { data, error } = await getSupabase()
    .from('users')
    .select('*')
    .eq('teams_user_id', teamsUserId)
    .single();

  if (error) {
    return null;
  }

  return data as User;
}
