import { createClient, SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT:
// For Vite apps, environment variables must be prefixed with VITE_.
// Create a .env.local file (not committed) with:
//   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
//   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
// Then restart the dev server.

function getEnvOrWarn(key: string): string | undefined {
  const value = import.meta.env[key] as string | undefined;
  if (!value && import.meta.env.DEV) {
    console.warn(`⚠️ Missing environment variable: ${key}`);
  }
  return value;
}

const supabaseUrl = getEnvOrWarn('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvOrWarn('VITE_SUPABASE_ANON_KEY');

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  if (import.meta.env.DEV) {
    console.log("✅ Supabase initialized");
  }
} else {
  if (import.meta.env.DEV) {
    console.warn("⚠️ Supabase not available. App will use localStorage only.");
  }
}

export { supabase };