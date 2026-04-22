import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-side client (dùng trong API routes) — có toàn quyền
export function createServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('CRITICAL: Supabase server environment variables are missing!');
    // Throw a descriptive error instead of crashing silently with !
    throw new Error('Supabase configuration missing (Server)');
  }

  return createClient(
    supabaseUrl,
    supabaseServiceKey,
    { auth: { persistSession: false } }
  );
}

// Client-side client (dùng trong components nếu cần)
export function createBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Supabase browser environment variables are missing!');
    return null as any; // Return null instead of crashing
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
