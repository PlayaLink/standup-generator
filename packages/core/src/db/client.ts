import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

/**
 * Extract project ref from Supabase URL (e.g., "abc123" from "https://abc123.supabase.co")
 */
function getProjectRefFromUrl(url: string): string | null {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

/**
 * Extract project ref from Supabase service key JWT payload
 */
function getProjectRefFromKey(key: string): string | null {
  try {
    const [, payloadBase64] = key.split('.');
    if (!payloadBase64) return null;
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
    return payload.ref || null;
  } catch {
    return null;
  }
}

/**
 * Get the Supabase client (lazy-initialized to avoid build-time errors)
 */
export function getSupabase(): SupabaseClient {
  if (_supabase) {
    return _supabase;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }

  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_KEY environment variable');
  }

  // Validate that URL and key are for the same Supabase project
  const urlRef = getProjectRefFromUrl(url);
  const keyRef = getProjectRefFromKey(key);
  if (urlRef && keyRef && urlRef !== keyRef) {
    throw new Error(
      `Supabase URL and service key mismatch!\n` +
      `  URL project: ${urlRef}\n` +
      `  Key project: ${keyRef}\n` +
      `Check if a shell environment variable is overriding your .env.local file.`
    );
  }

  _supabase = createClient(
    url,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return _supabase;
}
