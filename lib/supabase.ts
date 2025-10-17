import { createClient } from '@supabase/supabase-js';

// IMPORTANT:
// To enable authentication and cloud sync, you must provide your own
// Supabase project URL and public anon key. These can be found in your
// Supabase project's "API" settings.
//
// For this development environment, placeholder values are used to prevent the app from crashing.
// Authentication will NOT work until you replace the placeholder values below
// with your real credentials, or by setting the SUPABASE_URL and SUPABASE_ANON_KEY
// environment variables.
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';


// Conditionally create the client.
// With the placeholders above, this ensures `supabase` is an object,
// preventing the "client not initialized" crash. Authentication calls
// will fail gracefully until valid credentials are provided.
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;