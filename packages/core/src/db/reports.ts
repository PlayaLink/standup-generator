import { getSupabase } from './client';

export interface UserReport {
  id: string;
  user_id: string;
  project_key: string;
  board_name: string | null;
  report: string;
  created_at: string;
}

/**
 * Get past reports for a user
 */
export async function getUserReports(
  userId: string,
  limit: number = 20
): Promise<UserReport[]> {
  const { data, error } = await getSupabase()
    .from('user_reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user reports:', error);
    return [];
  }

  return (data || []) as UserReport[];
}

/**
 * Save a new report for a user
 */
export async function saveReport(
  userId: string,
  projectKey: string,
  boardName: string | null,
  report: string
): Promise<UserReport> {
  const { data, error } = await getSupabase()
    .from('user_reports')
    .insert({
      user_id: userId,
      project_key: projectKey,
      board_name: boardName,
      report,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save report: ${error.message}`);
  }

  return data as UserReport;
}

/**
 * Delete a report
 */
export async function deleteReport(
  reportId: string,
  userId: string
): Promise<void> {
  const { error } = await getSupabase()
    .from('user_reports')
    .delete()
    .eq('id', reportId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete report: ${error.message}`);
  }
}
